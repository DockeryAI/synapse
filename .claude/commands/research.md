---
description: Deep research on any subject - exhaustive multi-source analysis with unique angles
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch
---

# Deep Research: /research

**PURPOSE: Exhaustive, comprehensive research on any subject. Find proven solutions, unique angles, authoritative sources.**

---

## Step 1: Parse Input

**Input format:** `/research <subject> <document>`

Examples:
- `/research claude automation claude_automation` → `claude_automation_research.md`
- `/research codebase mapping` → Find existing `*_research.md` containing "codebase" or "mapping"
- `/research react performance perf` → `perf_research.md`

**Document resolution:**
1. If document name provided → `{name}_research.md`
2. If no document → Search for existing `*_research.md` matching subject keywords
3. If no match → Create `{subject_slugified}_research.md`

```bash
# Find existing research docs
ls -la .buildrunner/*_research.md 2>/dev/null || true
```

---

## Step 2: Research Strategy

**Research MUST be exhaustive. Cover ALL of these sources:**

### 2.1 Official Documentation
- Official docs for any technology mentioned
- GitHub repos (README, issues, discussions)
- Release notes and changelogs

### 2.2 Authoritative Sources
- Academic papers (if applicable)
- Conference talks and presentations
- Books and published guides
- Official blog posts from maintainers

### 2.3 Community Knowledge
- Stack Overflow (highest voted answers)
- Reddit discussions (r/programming, r/webdev, etc.)
- Discord/Slack community insights
- Dev.to, Medium technical articles
- Hacker News discussions

### 2.4 Real-World Implementations
- Open source projects solving this problem
- Case studies from companies
- Production postmortems and lessons learned
- Benchmark comparisons

### 2.5 Full Spectrum of Approaches
- **Standard/mainstream solutions** - The proven defaults most teams use
- **Alternative approaches** - Less common but equally valid methods
- **Edge cases and gotchas** - What breaks in production
- **What NOT to do** - Anti-patterns with evidence of failure

**CRITICAL: Every approach (standard or unique) MUST be:**
- Proven in real-world production use
- Backed by evidence (case studies, benchmarks, testimonials)
- Tested at scale by actual teams
- NOT theoretical or untested ideas

---

## Step 3: Execute Research

**Run multiple searches to cover all angles:**

```
Search 1: "{subject} best practices 2024 2025"
Search 2: "{subject} production implementation"
Search 3: "{subject} github solution"
Search 4: "{subject} stackoverflow"
Search 5: "{subject} reddit discussion"
Search 6: "{subject} case study"
Search 7: "{subject} vs alternatives comparison"
Search 8: "{subject} problems issues gotchas"
Search 9: "{subject} advanced techniques"
Search 10: "{subject} official documentation"
```

**For each promising result:**
- Use WebFetch to get full content
- Extract key insights, code examples, metrics
- Note the source URL and credibility

---

## Step 4: Document Structure

**Always use this structure:**

```markdown
# Research: {Subject}

> **Last Updated:** {ISO Date}
> **Research Sessions:** {count}

## TL;DR

{3-5 bullet executive summary of key findings}

---

## Problem Statement

{Clear definition of what we're solving}

---

## Common Solutions

### Solution 1: {Name}
- **What:** {Description}
- **Pros:** {Benefits}
- **Cons:** {Drawbacks}
- **When to use:** {Use cases}
- **Sources:** {URLs}

### Solution 2: {Name}
...

---

## Alternative Approaches

{Other valid solutions beyond the mainstream - must be equally proven in production}

### Approach 1: {Name}
- **What:** {Description}
- **Why it's overlooked:** {Reason}
- **Evidence it works:** {Proof points}
- **Sources:** {URLs}

---

## Real-World Implementations

### {Company/Project 1}
- **Scale:** {Size/scope}
- **Approach:** {What they did}
- **Results:** {Outcomes}
- **Source:** {URL}

---

## Trade-offs & Considerations

| Approach | Complexity | Performance | Maintainability | Cost |
|----------|------------|-------------|-----------------|------|
| {A} | {Low/Med/High} | {metrics} | {rating} | {$} |

---

## Anti-Patterns (What NOT To Do)

1. **{Anti-pattern 1}:** {Why it fails}
2. **{Anti-pattern 2}:** {Why it fails}

---

## Recommendations

{Based on research, what should we actually do?}

### For Our Use Case:
1. {Recommendation 1}
2. {Recommendation 2}

---

## Sources

### [Official] Official Documentation
- [{Title}]({URL})

### [Community] Community Discussions
- [{Title}]({URL})

### [Research] Studies & Benchmarks
- [{Title}]({URL})

---

## Research Log

### Session {N} - {Date}
- Searched: {queries}
- Found: {key findings}
- Added: {sections updated}
```

---

## Step 5: Write/Append Document

**If document exists:**
1. Read existing content
2. Update "Last Updated" date
3. Increment "Research Sessions" count
4. Add new findings to appropriate sections
5. Update TL;DR if major new insights
6. Add new session to Research Log

**If new document:**
1. Create with full structure
2. Populate all sections from research
3. Set session count to 1

**Document location:** `.buildrunner/{name}_research.md`

---

## Step 6: Summary Report

After research, tell user:

```
**Research Complete: {Subject}**

**Document:** .buildrunner/{name}_research.md
**Sessions:** {count}
**Sources consulted:** {number}

**Key Findings:**
1. {Finding 1}
2. {Finding 2}
3. {Finding 3}

**Unique angles discovered:**
- {Uncommon approach 1}
- {Uncommon approach 2}

**Recommendation:** {One sentence}
```

---

## Rules

1. **EXHAUSTIVE** - Don't stop at first answer, keep digging
2. **MULTI-SOURCE** - Verify findings across multiple sources
3. **FULL SPECTRUM** - Cover mainstream AND alternative approaches
4. **PROVEN ONLY** - Every approach must have real-world production evidence
5. **NO THEORY** - Exclude untested ideas, only battle-tested solutions
6. **CITE EVERYTHING** - Every claim needs a source with proof it works
7. **ACTIONABLE** - End with clear recommendations
8. **APPEND DON'T REPLACE** - Build on existing research, never overwrite

---

## What This Command Does NOT Do

- ❌ Shallow research (first page of Google only)
- ❌ Theory without proof
- ❌ Overwrite existing research
- ❌ Skip sources because they're "too niche"
- ❌ Provide recommendations without evidence
