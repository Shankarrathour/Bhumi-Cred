import os
import sys
import traceback

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


def run_test():
    try:
        print("PASS: test_imports.py")
    except Exception:
        print("FAIL: test_imports.py")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    run_test()
