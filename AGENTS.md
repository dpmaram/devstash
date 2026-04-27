# DevStash
A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.
 
## Context Files
Read the following to get the full context of the project:
- @context/project-overview.md
- @context/code-structure.md
- @context/ai-integration.md
- @context/current-feature.md


## Neon MCP Safety

  When using the Neon MCP for this project, always use the DevStash Neon project and the `development` branch by default.

  Production safety rules:
  - Never use the production, main, default, or parent Neon branch unless I explicitly ask for production access in that
  request.
  - Do not rely on Neon MCP defaults for branch selection. Always pass the explicit `projectId` and `branchId` for the
  DevStash `development` branch when a Neon tool supports them.
  - Treat omitted `branchId` as unsafe because it may target the default or production branch.
  - Run all SQL, schema inspection, migrations, query tuning, and branch operations against the `development` branch unless
  I clearly say otherwise.
  - Do not call migration completion tools that apply changes to the parent/main/production branch unless I explicitly
  approve that exact production operation.
  - If a Neon MCP operation appears to require production access, stop and ask for confirmation before running it.
  - If the correct DevStash project ID or `development` branch ID is unknown, first search/inspect Neon resources to
  identify them, then use those explicit IDs. Do not guess.

  If you know the exact Neon IDs, make it stricter:

  Use this Neon target by default:
  - Project: DevStash
  - Project ID: `development
  - Branch: development
  - Branch ID: `<development_branch_id>`