import logging
import time
import traceback
from contextvars import ContextVar

from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from ..chatbot.context_builder import build_rag_context
from ..config.llm import LLMConfig
from ..models.state import AgentState, PlannerOutput
from ..prompts.system_prompt import get_farmer_prompt, get_simple_prompt
from ..rag.retriever import retrieval_service
from ..rag.utils.metadata_helpers import detect_script
from ..tools.tools import AVAILABLE_TOOLS

# -----------------------------
# Logging Configuration
# -----------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

profiling_data = ContextVar("profiling_data", default={})

# -----------------------------
# LLMs
# -----------------------------
llm = LLMConfig.get_primary_llm()
planner_llm = LLMConfig.get_planner_llm()
structured_planner_llm = planner_llm.with_structured_output(PlannerOutput)

prompt_template = get_farmer_prompt()
simple_prompt_template = get_simple_prompt()

# Planner system prompt — instructs the LLM to classify the user message
PLANNER_SYSTEM_PROMPT = """You are an intent classification engine for an agricultural AI assistant.
Analyse the user's message and return a structured JSON classification.

Rules:
- intent: one of 'greeting', 'crop_query', 'weather', 'market', 'scheme', 'acknowledgment', 'off_topic', 'unknown'
- confidence: 0.0 to 1.0 — how confident you are in the intent classification
- language: The semantic language of the user's message (e.g., 'English', 'Hindi', 'Marathi', 'Kannada'). Do NOT use ISO codes.
- writing_style: The writing style used: 'Native Script', 'Romanized', or 'Mixed'. If the script hint is Latin but the language is Indian, it is 'Romanized'.
- needs_clarification: true if the message is too vague to answer meaningfully
- domain_relevant: true if the topic relates to agriculture, farming, weather, market prices, or government schemes
- response_style: 'simple' for greetings/acknowledgments, 'step_by_step' for detailed farming queries, 'concise' for factual lookups
- need_rag: true ONLY if agricultural knowledge retrieval would help answer the query. False for greetings, weather, market prices, off-topic.

Examples:
- "namaste" → intent=greeting, confidence=0.95, language=Hindi, writing_style=Romanized, domain_relevant=true, need_rag=false
- "How to treat leaf curl in tomatoes?" → intent=crop_query, confidence=0.95, language=English, writing_style=Native Script, domain_relevant=true, need_rag=true
- "What is React?" → intent=off_topic, confidence=0.9, language=English, writing_style=Native Script, domain_relevant=false, need_rag=false
- "Green Family" → intent=unknown, confidence=0.3, language=English, writing_style=Native Script, needs_clarification=true, need_rag=false
- "मेरी गेहूं में पीली पत्तियां" → intent=crop_query, confidence=0.9, language=Hindi, writing_style=Native Script, domain_relevant=true, need_rag=true
- "Mitti ki janch kaise karaye" → intent=crop_query, confidence=0.95, language=Hindi, writing_style=Romanized, domain_relevant=true, need_rag=true

Respond with ONLY the structured output, no additional text.
"""


# -----------------------------
# Routers
# -----------------------------
def fast_router(state: AgentState):
    messages = state.get("messages", [])
    if not messages:
        return "planner"

    last_msg = messages[-1].content.strip().lower()

    # Only bypass planner for EXACT greeting/acknowledgment matches.
    # Everything else — including short queries like "soil pH" — goes to planner.
    greetings = {
        "hi",
        "hello",
        "hey",
        "namaste",
        "namaskar",
        "ram ram",
        "thanks",
        "thank you",
        "dhanyawad",
        "shukriya",
        "ok",
        "yes",
        "no",
        "haan",
        "nahi",
    }

    if last_msg in greetings:
        script_hint = detect_script(messages[-1].content.strip())
        logger.info(
            f"Fast Route: Greeting detected ('{last_msg}'), "
            f"script_hint={script_hint['script']}. Skipping planner."
        )
        state["detected_language"] = script_hint["script"]
        return "prompt_builder"

    return "planner"


def route_after_planner(state: AgentState):
    plan = state.get("plan")

    if plan:
        if isinstance(plan, PlannerOutput):
            need_rag = plan.need_rag
            needs_clarification = plan.needs_clarification
            confidence = plan.confidence
        else:
            need_rag = plan.get("need_rag", False)
            needs_clarification = plan.get("needs_clarification", False)
            confidence = plan.get("confidence", 1.0)

        if confidence < 0.5 or needs_clarification:
            logger.info("Planner: Low confidence or needs clarification. Skipping RAG.")
            return "prompt_builder"

        if not need_rag:
            logger.info("Planner: need_rag=False. Skipping RAG.")
            return "prompt_builder"

    return "rag_node"


# -----------------------------
# Timed Tool Node
# -----------------------------
class TimedToolNode(ToolNode):
    def invoke(self, input, config=None, **kwargs):
        logger.info("ENTER tools")
        start = time.perf_counter()
        logger.info(f"Current input: {input}")
        try:
            logger.info("Tool execution start")
            res = super().invoke(input, config, **kwargs)
            logger.info("Tool execution end")
            logger.info(f"Execution time: {(time.perf_counter() - start) * 1000:.2f}ms")
            logger.info("EXIT tools")
            return res
        except Exception as e:
            error_tb = traceback.format_exc()
            logger.error(f"Exception in node 'tools':\n{error_tb}")
            raise e


# -----------------------------
# Planner
# -----------------------------
def planner_node(state: AgentState):
    logger.info("ENTER planner")
    start = time.perf_counter()
    logger.info(f"Current state keys: {list(state.keys())}")
    try:
        messages = state.get("messages", [])
        last_user_message = ""

        for msg in reversed(messages):
            if isinstance(msg, HumanMessage):
                last_user_message = msg.content
                break

        logger.info(f"User Query: {last_user_message}")

        # --- Step A: Detect script using generic Unicode script detector ---
        script_hint = detect_script(last_user_message)
        logger.info(f"Script Hint: {script_hint}")

        # --- Step B: Call LLM planner for structured intent classification ---
        from langchain_core.messages import SystemMessage

        planner_messages = [
            SystemMessage(content=PLANNER_SYSTEM_PROMPT + f"\n\nSCRIPT HINT: {script_hint['script']}"),
            HumanMessage(content=last_user_message),
        ]

        try:
            plan: PlannerOutput = structured_planner_llm.invoke(planner_messages)
            logger.info(f"LLM Planner Output: {plan.model_dump()}")
        except Exception as planner_err:
            logger.warning(f"LLM Planner failed, using fallback: {planner_err}")
            # Fallback: use safe defaults
            plan = PlannerOutput(
                intent="unknown",
                confidence=0.3,
                language="English",
                writing_style="Native Script",
                needs_clarification=True,
                domain_relevant=True,
                response_style="simple",
                need_rag=False,
            )

        # Removed naive langdetect override. The LLM planner handles Hinglish and romanized text much better.

        elapsed = (time.perf_counter() - start) * 1000
        data = profiling_data.get({})
        data["Planner"] = elapsed

        logger.info(f"Final Planner Output: {plan.model_dump()}")
        logger.info(f"Execution time: {elapsed:.2f}ms")
        logger.info("EXIT planner")

        return {
            "plan": plan.model_dump(),
            "detected_language": plan.language,
        }

    except Exception as e:
        error_tb = traceback.format_exc()
        logger.error(f"Exception in node 'planner':\n{error_tb}")
        raise e


# -----------------------------
# RAG Node
# -----------------------------
def rag_node(state: AgentState):
    logger.info("ENTER rag_node")
    start = time.perf_counter()
    logger.info(f"Current state keys: {list(state.keys())}")
    try:
        messages = state.get("messages", [])
        last_user_message = ""
        for msg in reversed(messages):
            if isinstance(msg, HumanMessage):
                last_user_message = msg.content
                break

        logger.info("RAG retrieval start")
        retrieved_chunks = []
        retrieval_time = 0.0

        try:
            if retrieval_service:
                retrieved_chunks, retrieval_time = retrieval_service.retrieve(
                    query=last_user_message
                )
        except Exception as e:
            logger.error(f"Retriever Failed: {e}")

        rag_context = build_rag_context(retrieved_chunks)

        elapsed = (time.perf_counter() - start) * 1000
        data = profiling_data.get({})
        data["RAG"] = elapsed

        logger.info(f"Retriever: Retrieved {len(retrieved_chunks)} chunks")
        logger.info(f"Retrieval Time: {retrieval_time:.2f} ms")
        logger.info(f"Execution time: {elapsed:.2f}ms")
        logger.info("EXIT rag_node")

        logger.info("--- State After rag_node ---")
        msgs = state.get("messages", [])
        logger.info(f"messages: {len(msgs)}")
        if msgs:
            last = msgs[-1]
            logger.info(f"last message type: {type(last)}")

        return {"rag_context": rag_context}
    except Exception as e:
        error_tb = traceback.format_exc()
        logger.error(f"Exception in node 'rag_node':\n{error_tb}")
        raise e


# -----------------------------
# Prompt Builder
# -----------------------------
def prompt_builder_node(state: AgentState):
    logger.info("ENTER prompt_builder")
    start = time.perf_counter()
    logger.info(f"Current state keys: {list(state.keys())}")
    try:
        profile = state.get("profile") or {}
        plan = state.get("plan") or {}
        rag_context = state.get("rag_context", "None")

        context_lines = []

        # 1. Language Enforcement
        language = "English"
        writing_style = "Native Script"
        
        if plan and isinstance(plan, PlannerOutput):
            language = plan.language
            writing_style = plan.writing_style
        elif plan and isinstance(plan, dict):
            language = plan.get("language", "English")
            writing_style = plan.get("writing_style", "Native Script")
            
        context_lines.append("--- LANGUAGE DIRECTIVE ---")
        context_lines.append(f"Detected Language: {language}")
        context_lines.append(f"Writing Style: {writing_style}")
        
        if writing_style.lower() in ["romanized", "mixed"]:
            context_lines.append("Instructions:")
            context_lines.append(f"- Reply using Roman {language}.")
            context_lines.append("- Preserve commonly used English agricultural terms.")
            context_lines.append("- Do not switch to native scripts (e.g., Devanagari).")
            context_lines.append("- Mirror the user's writing style.")
            context_lines.append("- Do not translate unless the user requests it.")
        else:
            context_lines.append("Instructions:")
            context_lines.append(f"- Reply ONLY in {language} using its {writing_style}.")
            context_lines.append("- Do NOT use any other language or script unless explicitly requested.")

        # 2. Planner Metadata
        intent = plan.get("intent", "unknown")
        context_lines.append(f"DETECTED INTENT: {intent}")

        domain_relevant = plan.get("domain_relevant", True)
        if not domain_relevant:
            context_lines.append("DOMAIN WARNING: This query seems unrelated to agriculture. Politely redirect the user to farming topics.")

        # 3. Farmer Profile
        if profile:
            context_lines.append("--- FARMER PROFILE ---")
            context_lines.append(f"Name: {profile.get('farmer_name', 'Unknown')}")
            context_lines.append(f"Location: {profile.get('village', 'Unknown')}, {profile.get('district', 'Unknown')}, {profile.get('state', 'Unknown')}")
            context_lines.append(f"Farm Size: {profile.get('farm_size', 'Unknown')}")
            context_lines.append(f"Soil Type: {profile.get('soil_type', 'Unknown')}")
            context_lines.append(f"Primary Crops: {', '.join(profile.get('primary_crops', []))}")
        else:
            context_lines.append("--- FARMER PROFILE ---")
            context_lines.append("No profile available (Guest Mode).")

        # 4. RAG Context
        context_lines.append("--- RETRIEVED KNOWLEDGE ---")
        context_lines.append(rag_context)

        context = "\n".join(context_lines)

        elapsed = (time.perf_counter() - start) * 1000
        data = profiling_data.get({})
        data["Prompt Builder"] = elapsed

        logger.info(f"Built Context: {context}")

        logger.info(f"Execution time: {elapsed:.2f}ms")
        logger.info("EXIT prompt_builder")

        logger.info("--- State After prompt_builder ---")
        msgs = state.get("messages", [])
        logger.info(f"messages: {len(msgs)}")
        if msgs:
            last = msgs[-1]
            logger.info(f"last message type: {type(last)}")

        return {"final_context_string": context}

    except Exception as e:
        error_tb = traceback.format_exc()
        logger.error(f"Exception in node 'prompt_builder':\n{error_tb}")
        raise e


# -----------------------------
# LLM Node
# -----------------------------
def llm_node(state: AgentState):
    logger.info("ENTER llm")
    start = time.perf_counter()
    logger.info(f"Current state keys: {list(state.keys())}")
    try:
        plan = state.get("plan")
        # Extract metadata for prompt
        response_style = "simple"
        if plan:
            if isinstance(plan, PlannerOutput):
                response_style = plan.response_style
            elif isinstance(plan, dict):
                response_style = plan.get("response_style", "simple")

        logger.info(f"Prompt Variables: response_style={response_style}, plan={plan}")

        llm_with_tools = llm.bind_tools(AVAILABLE_TOOLS)
        chain = prompt_template | llm_with_tools

        messages = state.get("messages", [])
        
        # We removed naive truncation: MemorySaver manages the full conversation.
        # Down the line, a summarizer node can compress old messages.
        
        final_context = state.get("final_context_string", "")
        rag_context = state.get("rag_context", "")

        invoke_args = {
            "messages": messages,
            "final_context": final_context,
            "response_style": response_style,
        }
        try:
            formatted_prompt = str(prompt_template.format_messages(**invoke_args))
            sys_prompt_len = (
                len(str(prompt_template.messages[0].prompt.template))
                if hasattr(prompt_template, "messages")
                else len(str(prompt_template))
            )
        except Exception:
            formatted_prompt = "Unknown"
            sys_prompt_len = 0

        conv_history_len = sum(len(str(m.content)) for m in messages)
        model_name = getattr(llm, "model", "Unknown model")

        logger.info("--- LLM DIAGNOSTICS ---")
        logger.info(f"Model Name: {model_name}")
        logger.info(f"Total number of messages: {len(messages)}")
        logger.info(f"System prompt length (chars): {sys_prompt_len}")
        logger.info(f"Final context length (chars): {len(final_context)}")
        logger.info(f"RAG context length (chars): {len(rag_context)}")
        logger.info(f"Conversation history length (chars): {conv_history_len}")
        logger.info(f"Complete prompt size (chars): {len(formatted_prompt)}")
        logger.info("--------------------------")

        logger.info("LLM invocation start")
        time_before = time.perf_counter()

        response = chain.invoke(invoke_args)

        time_after = time.perf_counter()
        llm_call_ms = (time_after - time_before) * 1000

        data = profiling_data.get({})
        data["LLM call"] = llm_call_ms
        data["Number of conversation messages"] = len(messages)
        data["Prompt size in characters"] = len(formatted_prompt)
        data["Model name"] = model_name

        elapsed = (time.perf_counter() - start) * 1000
        data["Total LLM Node"] = elapsed

        logger.info("LLM invocation end")
        logger.info(f"Execution time: {elapsed:.2f}ms")
        logger.info("EXIT llm")

        msgs = state.get("messages", []) + [response]
        logger.info("--- State After llm_node ---")
        logger.info(f"messages: {len(msgs)}")
        if msgs:
            last = msgs[-1]
            logger.info(f"last message type: {type(last)}")
            logger.info(
                f"last message content: {last.content if hasattr(last, 'content') else str(last)}"
            )

        return {"messages": [response]}

    except Exception as e:
        error_tb = traceback.format_exc()
        logger.error(f"Exception in node 'llm':\n{error_tb}")
        raise e


# -----------------------------
# Build Graph
# -----------------------------
builder = StateGraph(AgentState)

builder.add_node("planner", planner_node)
builder.add_node("rag_node", rag_node)
builder.add_node("prompt_builder", prompt_builder_node)
builder.add_node("llm", llm_node)
builder.add_node("tools", TimedToolNode(AVAILABLE_TOOLS))

# --- ORIGINAL ROUTING (Commented out for debugging) ---
builder.add_conditional_edges(START, fast_router)
builder.add_conditional_edges("planner", route_after_planner)
builder.add_edge("rag_node", "prompt_builder")
builder.add_edge("prompt_builder", "llm")
builder.add_conditional_edges("llm", tools_condition)
builder.add_edge("tools", "llm")

# --- SIMPLIFIED ROUTING (For debugging) ---
# builder.add_edge(START, "prompt_builder")
# builder.add_edge("prompt_builder", "llm")
# builder.add_edge("llm", END)

memory = MemorySaver()
app = builder.compile(checkpointer=memory)
