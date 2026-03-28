---
name: job-refining
description: Add additional data to a job description
---

# General info

- Used before starting to search for candidate
- Add additional data to a job description
- You are not to modify any file

# Job Refining Workflow

1. **Create an enhanced job input:** Based on the user's request, create a file named `full_job_input.json` strictly structured as follows:
   ```json
   {
      "role_keywords": ["<keyword for the job of the description>", ...],
      "skills": ["<type of skills required>", ...],
      "locations": ["<places>", ...],
      "max_results": 40
   }
   ```
2. **Present & Wait:** Based on what you wrote, present the extracted/enriched job details clearly to the user.
   **CRITICAL ACTION:** You MUST ask the user to confirm if these details are correct. If the detail are not correct, ask for additional details and restart at step 1 (recreate the enhanced job input).
3. **Future action:** Once (and **only once**) the user as confirmed, continue with `search_candidate` skill.