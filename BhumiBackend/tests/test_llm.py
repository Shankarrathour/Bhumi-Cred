import os
import sys
import traceback

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


def run_test():
    try:
        from backend.config.llm import LLMConfig

        # Verify if GOOGLE_API_KEY is present
        if not os.getenv("GOOGLE_API_KEY"):
            print(
                "WARNING: GOOGLE_API_KEY is not set. Assuming LLM might fail if not configured in environment."
            )

        llm = LLMConfig.get_primary_llm()
        planner = LLMConfig.get_planner_llm()

        # Just check if we can instantiate them correctly
        assert llm.model == "gemini-3.5-flash"
        assert planner.model == "gemini-3.5-flash"
        assert planner.temperature == 0.0

        print("PASS: test_llm.py")
    except Exception:
        print("FAIL: test_llm.py")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    run_test()
