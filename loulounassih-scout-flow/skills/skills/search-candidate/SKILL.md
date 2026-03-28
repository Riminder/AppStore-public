---
name: search-candidate
description: Search and rank candidate
---

# General info

- Used to **search** for candidates
- Only execute this skill, if you have first executed the `job-refining` skill
- You are not to modify any file

# Job Refining Workflow

1. **Run Search Script:** Execute the search candidate script using Python 3:
   ```bash
   cd /Users/hackathon-team9/.openclaw/workspace/skills/search-candidate/scripts && source .venv/bin/activate && python3 main.py
   ```
2. **Present:** Read the generated `grading_summary.txt` file. 
   Make a recap of the result of the search and the grading to the user.