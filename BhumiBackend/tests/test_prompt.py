import os
import sys
import traceback

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


def run_test():
    try:
        from backend.prompts.system_prompt import get_farmer_prompt
        from langchain_core.messages import HumanMessage

        prompt = get_farmer_prompt()

        # Format the prompt
        formatted = prompt.invoke(
            {
                "final_context": "Farmer Name: Raj\nPrimary Crops: Wheat",
                "response_style": "step_by_step",
                "messages": [HumanMessage(content="Hello")],
            }
        )

        messages = formatted.to_messages()
        assert len(messages) == 2, f"Expected 2 messages, got {len(messages)}"
        assert "Wheat" in messages[0].content, "Context not injected properly"

        print("PASS: test_prompt.py")
    except Exception:
        print("FAIL: test_prompt.py")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    run_test()
