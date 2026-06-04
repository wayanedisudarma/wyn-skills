# wyn-skills

`wyn-skills` is a Node.js-based CLI for installing AI skills into AI coding assistant/editor configuration directories.

The installer reads all skills from the `skills/` folder, checks each skill's metadata, then copies compatible skills into the selected target.

## Features

- Install skills to multiple targets: Antigravity, Antigravity CLI, Codex, Cursor, and Gemini.
- Install all compatible skills, or select specific skills with flags.
- Check target compatibility based on `metadata.json`.
- Check installed versions through `.installed.json` so skills with the same version are not copied again.

## Installation and Usage

Run directly with `npx`:

```bash
npx wyn-skills --codex
```

General format:

```bash
npx wyn-skills --<target> [--<skill-name> ...]
```

Check the installed CLI version:

```bash
npx wyn-skills --version
```

Example: install all compatible skills to Codex:

```bash
npx wyn-skills --codex
```

Example: install specific skills:

```bash
npx wyn-skills --codex --java-spring-boot-unit-testing
npx wyn-skills --antigravity-cli --java-spring-boot-code-style --java-spring-boot-integration-testing
```

## Supported Targets

| Flag | Target | Installation Directory |
| :--- | :--- | :--- |
| `--antigravity` | Antigravity | `~/.gemini/antigravity/skills` |
| `--antigravity-cli` | Antigravity CLI | `~/.gemini/antigravity-cli/skills` |
| `--codex` | Codex | `~/.codex/skills` |
| `--cursor` | Cursor | `~/.cursor/skills` |
| `--gemini` | Gemini | `~/.gemini/skills` |

Note: the installer recognizes all targets above, but a skill will only be installed if the skill metadata's `compatibleTargets` includes that target.

## Available Skills

| Skill | Description | Compatible Targets |
| :--- | :--- | :--- |
| `java-spring-boot-code-style` | Java code style guide for Spring Boot projects with Lombok. | `antigravity`, `antigravity-cli`, `codex` |
| `java-spring-boot-integration-testing` | Spring Boot integration testing patterns with Testcontainers, WireMock, MockMvc, and Awaitility. | `antigravity`, `antigravity-cli`, `codex` |
| `java-spring-boot-unit-testing` | Spring Boot unit testing guide with JUnit 5 and Mockito using Detroit Style TDD. | `antigravity`, `antigravity-cli`, `codex` |
| `skill-creator` | Instructions for creating a new agent skill following this project's structure. | `antigravity`, `antigravity-cli`, `codex` |

Skill names in the CLI follow the folder names inside `skills/`.

## Project Structure

```text
wyn-skills/
|-- bin/
|   `-- install.js
|-- skills/
|   |-- java-spring-boot-code-style/
|   |   |-- SKILL.md
|   |   `-- metadata.json
|   |-- java-spring-boot-integration-testing/
|   |   |-- SKILL.md
|   |   `-- metadata.json
|   |-- java-spring-boot-unit-testing/
|   |   |-- SKILL.md
|   |   `-- metadata.json
|   `-- skill-creator/
|       |-- SKILL.md
|       `-- metadata.json
|-- package.json
`-- README.md
```

## Adding a New Skill

Add a new folder inside `skills/`:

```text
skills/
`-- new-skill-name/
    |-- SKILL.md
    `-- metadata.json
```

`SKILL.md` must start with YAML frontmatter:

```markdown
---
name: new-skill-name
description: Brief skill description
---
```

`metadata.json` must contain the skill information and compatible targets:

```json
{
  "name": "new-skill-name",
  "version": "1.0.0",
  "description": "Brief skill description",
  "compatibleTargets": [
    "antigravity",
    "antigravity-cli",
    "codex"
  ]
}
```

## License

MIT
