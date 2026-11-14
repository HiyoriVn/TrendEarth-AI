# Create the GitHub repository and push this starter kit (Windows PowerShell)

The GitHub connector can edit an **existing** repository but cannot currently create a new one. A human with repo creation rights must perform the short initial creation step.

**Option A (fewest actions, connected GitHub):** Open https://github.com/new?name=TrendEarth-AI, select owner `HiyoriVn`, create a repository with an initial README, then send its URL to the assistant. The assistant can populate this existing repo via the connected GitHub tools; the starter ZIP is a backup. No terminal commands needed for this option.

**Option B (manual git push from ZIP):**

1. In GitHub, open https://github.com/new?name=TrendEarth-AI and select owner `HiyoriVn`.
2. Name: `TrendEarth-AI`. Choose **Public** if the team approves the Apache-2.0 open-source plan from the proposal, otherwise **Private** for now.
3. Do **not** initialize with README, .gitignore or license; they already exist in this starter.
4. From PowerShell, in the folder containing the downloaded ZIP:

```powershell
Expand-Archive .\TrendEarth-AI-Starter.zip -DestinationPath .\TrendEarth-AI
Set-Location .\TrendEarth-AI
git init -b main
git add .
git commit -m "chore: initialize TrendEarth AI engineering workspace"
git remote add origin https://github.com/HiyoriVn/TrendEarth-AI.git
git push -u origin main
```

5. Verify the GitHub URL displays 40+ files, including hidden `.agents`, `.codex`, and `.github` folders.
6. Once the remote exists, connected GitHub tools can create issues, branches, edits and pull requests directly.

If the `git push` command needs sign-in, complete GitHub's normal authentication; **do not paste passwords or tokens into chat**.

To check phase-zero structural integrity locally:

```powershell
python .\scripts\check_repo.py
```

**Status:** This starter includes documentation and agent configuration; there is no finished NASA app or verified climate output yet.
