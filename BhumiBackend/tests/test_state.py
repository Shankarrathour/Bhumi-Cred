import os
import sys
import traceback

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


def run_test():
    try:
        from backend.models.state import PlannerOutput
        from pydantic import ValidationError

        # Test valid input
        output = PlannerOutput(
            intent="crop_disease",
            language="hi",
            needs_clarification=False,
            response_style="step_by_step",
        )
        assert output.intent == "crop_disease"

        # Test invalid input
        try:
            PlannerOutput(intent="test")
            raise Exception("Expected ValidationError for missing fields")
        except ValidationError:
            pass

        print("PASS: test_state.py")
    except Exception:
        print("FAIL: test_state.py")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    run_test()
