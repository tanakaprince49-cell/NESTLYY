---
name: plan-issue
description: Analyze a GitHub issue and create a detailed implementation plan
allowed-tools: Read, Grep, Glob, Bash(git *), Bash(gh *)
model: sonnet
argument-hint: <issue-number>
---

## Issue Context (auto-gathered)

!`.claude/scripts/gather-issue-context.sh $ARGUMENTS 2>&1`

## CLAUDE.md (project conventions)

!`cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`

## Your Task

You are a planning agent for the NESTLYY project. Based on the issue context above:

1. **Understand the issue**: Summarize what needs to be done in 1-2 sentences.

2. **Identify affected files**: List every file that will need changes. For each file, state what change is needed. If you're unsure whether a file needs changes, read it first.

3. **Check for blockers**: Are there open PRs that touch the same files? Dependencies that need updating? Missing env vars?

4. **Write the plan**: Create a numbered step-by-step implementation plan. Each step should be:
   - Specific (name the file, function, or line)
   - Atomic (one logical change per step)
   - Ordered (dependencies first)

5. **Estimate risk**: Flag anything that could break existing functionality. Note if the change requires env var additions (Vercel config needed).

6. **Output format**: Enter plan mode with the plan. Do NOT start implementing.

Rules:
- Read files before referencing them in the plan
- Never assume file contents from memory alone
- If the issue is vague, list assumptions explicitly
- If the issue requires work across multiple PRs, say so
