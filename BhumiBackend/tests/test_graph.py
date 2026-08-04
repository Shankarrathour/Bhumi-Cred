import os
import sys
import traceback

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from langchain_core.messages import HumanMessage

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


def run_test():
    try:
        from backend.graph.graph import app

        # Scenario 1: English query
        print("\n--- Running English Query ---")
        state = {
            "messages": [HumanMessage(content="How do I treat leaf curl in tomatoes?")],
            "profile": {"farmer_name": "Ravi", "primary_crops": ["Tomatoes", "Wheat"]},
        }

        res = app.invoke(state)
        messages = res.get("messages", [])

        assert len(messages) > 1, "Graph did not return a new message"
        print("Last message:", messages[-1].content)
        print("PASS: English query executed correctly.")

        print("\nPASS: test_graph.py")
    except Exception:
        print("\nFAIL: test_graph.py")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    run_test()
