---
name: research
description: "Use when the user asks to run a repository research prompt, investigate project facts, or generate documentation from context/research prompt files."
argument-hint: "<prompt-name|prompt-file>"
---

# Research

Run a documentation-only research task from a prompt file.

## Input

Use `$ARGUMENTS` as the prompt name or prompt file path.

If no argument is provided, stop and say:

```text
Usage: /research <prompt-name|prompt-file>
```

Resolve the prompt in this order:

1. If `$ARGUMENTS` points to an existing file, use that file.
2. If `context/research/$ARGUMENTS.md` exists, use that file.
3. If `context/research/$ARGUMENTS` exists, use that file.
4. Otherwise, stop and say:

```text
Prompt file not found. Expected a file path or context/research/<prompt-name>.md
```

## Prompt Format

The prompt file should define:

- `Output`: destination for the generated documentation.
- `Research`: what to investigate.
- `Include`: specific details to capture.
- `Sources`: files, directories, tools, or commands to inspect.

If `Output` is missing, write to `docs/research/<prompt-name>.md`.

## Workflow

1. Read the prompt file and identify the required output path.
2. Gather project context from the named sources using local code search and file reads first.
3. Use database or MCP tools only when the prompt requests them and they are available.
4. Use web research only when the prompt asks for external/current facts; cite sources when web research is used.
5. Write the findings to the output path as clear Markdown documentation.
6. Summarize the output path and the key findings.

## Rules

- Produce documentation only.
- Do not modify application source code.
- Do not create branches, commits, or pushes.
- Do not reveal secrets or copy raw environment variable values into output.
- Prefer local evidence from the repository over assumptions.
- Use subagents only when the user explicitly asks for delegated or parallel agent work.
