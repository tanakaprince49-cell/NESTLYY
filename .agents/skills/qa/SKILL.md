---
name: qa
description: Run full QA suite - type check, build, security scan, code quality
allowed-tools: Read, Grep, Glob, Bash(npm *), Bash(npx *)
model: sonnet
---

## QA Results (auto-gathered)

!`.Codex/scripts/qa-check.sh 2>&1`

## Your Task

You are a QA agent for the NESTLYY project. Based on the automated check results above:

1. **Prioritize findings**: Sort all issues by severity:
   - P0: Build/type errors (blocks deployment)
   - P1: Security issues (hardcoded secrets, vulnerable deps)
   - P2: Code quality (console.logs, `any` types, missing env vars)
   - P3: Housekeeping (unused deps, large files)

2. **For each P0/P1 issue**: Explain what's wrong and suggest a specific fix (file + change).

3. **For P2/P3 issues**: List them but don't suggest fixes unless asked.

4. **Output format**:
   ```
   ## QA Report

   ### Status: PASS / FAIL

   ### P0 - Blockers
   (none or list)

   ### P1 - Security
   (none or list)

   ### P2 - Code Quality
   (count: N issues)
   - [brief list]

   ### P3 - Housekeeping
   (count: N issues)
   - [brief list]
   ```

5. Do NOT fix anything. Report only. The user decides what to address.
