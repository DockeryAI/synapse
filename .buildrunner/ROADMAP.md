# Project Roadmap

**Last Updated:** 2025-12-03
**Current Release:** 3.2

---

## Release Definitions

| Release | Horizon | Theme | Status |
|---------|---------|-------|--------|
| 3.2 | now | Context Preservation System | active |
| 3.3 | next | Parallel Orchestration & Scaling | planned |
| 4.0 | later | Major Architecture Rewrite | future |

---

## NOW - Release 3.2 (Active)

**Theme:** Context Preservation System
**Goal:** Maintain AI context across sessions, prevent drift, enable seamless handoffs

### Features
- [x] Decision logging with rotation (50 entries, 90-day archives)
- [x] Context load/save slash commands (/cl, /cs)
- [x] Gap detection with self-healing (/gaps)
- [x] Browser debug integration (/dbg)
- [x] Build plan creation (/bp)
- [x] Architecture guard (/guard)
- [ ] Roadmap management (/roadmap, /later)

---

## NEXT - Release 3.3 (Planned)

**Theme:** Parallel Orchestration & Scaling
**Goal:** Enable multi-agent coordination, improve performance at scale

### Features
<!-- Features with horizon: next will appear here -->

---

## LATER - Release 4.0 (Future)

**Theme:** Major Architecture Rewrite
**Goal:** Ground-up redesign based on learnings from 3.x

### Features
<!-- Features with horizon: later will appear here -->

---

## How to Use This Roadmap

### Adding Features
- Use `/later "feature description"` to add to roadmap
- Use `/later 3,4 to 4.0` to move numbered features from /bp
- Use `/roadmap` to view and manage all horizons

### Moving Features Between Horizons
```
/later "dark mode" to next     → Move to next horizon
/later 2,5 to 4.0              → Move items 2,5 to release 4.0
/roadmap move "auth" to now    → Promote feature to current release
```

### Release Progression
When a release completes:
1. Current "next" becomes "now"
2. Current "later" becomes "next"
3. New "later" release is defined

---

*Managed by BuildRunner 3. Use /roadmap to edit.*
