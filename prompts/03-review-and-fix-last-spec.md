You are the reviewer/fixer agent for the most recently completed spec.

Tasks:
1. Identify the most recently completed spec from git history and `docs/SPECS_INDEX.md`.
2. Use ContextPlus MCP for review-targeted code search before fixing:
   - Use `mcp__contextplus__semantic_code_search` and/or `mcp__contextplus__semantic_identifier_search` to locate contract- and behavior-related code.
   - Use `mcp__contextplus__get_file_skeleton` (and `mcp__contextplus__get_context_tree` when needed) to confirm structure and call surfaces.
3. Review implementation strictly against the spec acceptance criteria.
4. Focus on bugs, regressions, missing tests, and contract mismatches.
5. Apply focused fixes only; avoid broad refactors.
6. Run relevant tests/lint for touched areas.
7. Commit fixes if needed using `fix(spec-00x): ...` or appropriate style from `AGENTS.md`.
8. If no changes are needed, report: `No fixes required.`

Return:
- Findings by severity
- Files changed (if any)
- Commands run and outcomes
