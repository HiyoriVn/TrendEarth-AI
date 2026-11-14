"""Phase-zero structural checks. These are NOT scientific or app tests."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
required = [
    "README.md", "AGENTS.md", "GEMINI.md", "LICENSE",
    "docs/01-SRS-DRAFT.md", "docs/02-BACKLOG.md",
    "docs/03-SCIENCE-DATA-PROTOCOL.md", "docs/05-TEST-PLAN.md",
    "docs/08-AGENT-ORCHESTRATION.md",
]
for path in required:
    assert (ROOT / path).is_file(), f"missing {path}"
skills = sorted((ROOT / ".agents/skills").glob("*/SKILL.md"))
assert len(skills) >= 6, f"expected six project skills; found {len(skills)}"
for path in skills:
    text = path.read_text(encoding="utf-8")
    assert text.startswith("---\n"), f"missing YAML frontmatter: {path}"
    head = text.split("---", 2)[1]
    assert re.search(r"(?m)^name: [a-z0-9-]+$", head), f"missing name: {path}"
    assert re.search(r"(?m)^description: .+$", head), f"missing description: {path}"
import tomllib
for toml_file in (ROOT / ".codex").rglob("*.toml"):
    with toml_file.open("rb") as stream:
        tomllib.load(stream)
assert len(list((ROOT / ".codex/agents").glob("*.toml"))) == 3
readme = (ROOT / "README.md").read_text(encoding="utf-8")
assert "NASA" in readme and "11:00" in readme
assert not list(ROOT.rglob(".env.local")), "unexpected credential file"
print(f"PASS: {len(required)} structural docs, {len(skills)} skills; no science/app checks executed")
