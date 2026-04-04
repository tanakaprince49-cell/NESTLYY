---
name: audit
description: Audit documentation vs actual codebase implementation
allowed-tools: Read, Grep, Glob, Bash(git *), Bash(npm audit *)
model: sonnet
---

## Audit Data (auto-gathered)

!`.Codex/scripts/audit-docs.sh 2>&1`

## Your Task

You are an audit agent for the NESTLYY project. Based on the audit data above:

1. **Find discrepancies**: Compare what AGENTS.md says vs what actually exists. Categorize each finding as:
   - CRITICAL: Documentation says something exists that doesn't (or vice versa). Could mislead developers.
   - WARNING: Documentation is outdated but not dangerously wrong.
   - INFO: Minor inconsistency, nice to fix.

2. **Check service descriptions**: For each service listed in AGENTS.md, verify the description matches what the code actually does. Read the service files if the audit data isn't enough.

3. **Check architecture claims**: Verify statements about state management, routing, data flow, etc.

4. **Generate a report** with this structure:
   ```
   ## Audit Report - [date]

   ### Critical
   - [finding]

   ### Warnings
   - [finding]

   ### Info
   - [finding]

   ### Recommended Changes
   - [specific edit to make]
   ```

5. Do NOT make changes. Only report findings. The user decides what to fix.
