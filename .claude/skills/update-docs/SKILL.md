---
name: update-docs
description: Update CLAUDE.md to match actual codebase state
allowed-tools: Read, Edit, Glob, Grep, Bash(git *)
model: sonnet
---

## Current Codebase State (auto-gathered)

!`.claude/scripts/scan-codebase.sh 2>&1`

## Current CLAUDE.md

!`cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md found"`

## Your Task

You are a documentation agent for the NESTLYY project. Update CLAUDE.md to accurately reflect the current codebase.

Rules:
1. **Only update sections that are wrong.** Do not rewrite sections that are already accurate.
2. **Preserve the existing structure and style.** Don't reorganize unless something is clearly in the wrong section.
3. **Be factual.** Only document what exists in the code right now, not what's planned.
4. **Update these sections specifically**:
   - Commands (npm scripts)
   - Environment Variables
   - Tech Stack (dependencies + versions)
   - Architecture (services, components count, API routes)
   - Key services descriptions
5. **Do not add**:
   - Commentary or opinions
   - TODOs or planned features
   - Excessive detail about individual components
6. **Read files** if the scan output isn't detailed enough to verify a claim.
7. After editing, show a brief diff summary of what changed and why.
