---
name: skill-creator
description: Agent skill for creating new agent skills
---

# Skill Creator

This skill provides instructions for creating new agent skills based on the AgentSkills specification.

## Instructions

When the user asks to create a new skill, follow these steps:

1. **Create Skill Directory**: Create a new folder for the skill inside the `skills/` directory (e.g., `skills/my-new-skill`).
2. **Create `SKILL.md`**: Inside the new folder, create a `SKILL.md` file. It must start with a YAML frontmatter:
   ```yaml
   ---
   name: <skill-name>
   description: <short description>
   ---
   ```
   Followed by the Markdown content containing the actual instructions for the agent. Keep the main `SKILL.md` under 500 lines.
3. **Create `metadata.json`**: Always add a `metadata.json` file in the skill folder with the following format:
   ```json
   {
     "name": "<skill-name>",
     "version": "1.0.0",
     "description": "<short description>",
     "compatibleTargets": [
       "antigravity",
       "antigravity-cli"
     ]
   }
   ```
4. **Progressive Disclosure**: If the instructions are long, consider moving detailed reference material to separate files (e.g., `references/REFERENCE.md`) and reference them using relative paths one level deep.
5. **Optional Directories**: Consider adding `scripts/` for executable scripts, `assets/` for images/data, and `references/` for detailed docs.

## Validation

- Ensure the frontmatter is valid YAML.
- Ensure both `SKILL.md` and `metadata.json` are created successfully.
