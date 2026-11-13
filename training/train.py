from pathlib import Path
import subprocess
import sys

# Forward execution to ai-service/training/train.py inside the ai-service directory
ai_service_dir = Path(__file__).resolve().parent.parent / "ai-service"
script = ai_service_dir / "training" / "train.py"

if not script.exists():
    print(f"Error: {script} does not exist.", file=sys.stderr)
    sys.exit(1)

cmd = [sys.executable, str(script)] + sys.argv[1:]
sys.exit(subprocess.call(cmd, cwd=str(ai_service_dir)))

