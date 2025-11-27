# V3 AI-SYNTHESIZED CONTENT ENGINE - BUILD INSTRUCTIONS

## SUCCESS CRITERIA
- [ ] 500+ unique insights displayed (currently 32)
- [ ] 50+ breakthroughs (currently 6)
- [ ] Zero repetitive/template titles
- [ ] Build time <30s (currently 117s)
- [ ] All AI synthesis calls succeed (currently 500 errors)
- [ ] No clustering errors in console

## CURRENT STATE
- **Data Points**: 196
- **Insights**: 32
- **Breakthroughs**: 6
- **Build Time**: 117 seconds
- **Template Titles**: Yes (garbage like "15 Quote Abandonment That Convert More Quotes")
- **AI Synthesis**: Broken (500 errors)

## TARGET STATE
- **Data Points**: 400+
- **Insights**: 500+
- **Breakthroughs**: 50+
- **Build Time**: <30 seconds
- **Template Titles**: ZERO - all AI-generated
- **AI Synthesis**: Working

## PHASE FILES
- `PHASE_A_FIX_BLOCKERS.md` - Fix clustering + ai-proxy errors
- `PHASE_B_KILL_TEMPLATES.md` - Replace template engine with AI synthesis
- `PHASE_C_DEDUPLICATION.md` - Semantic deduplication
- `PHASE_D_PARALLELIZE.md` - Reddit parallelization
- `PHASE_E_SCALE_INSIGHTS.md` - Scale to 500+ insights
- `PHASE_F_CUSTOMER_FOCUS.md` - Customer-first content

## EXECUTION ORDER
1. Phase A FIRST - everything else depends on AI working
2. Test with OpenDialog after Phase A
3. Phase B - core fix for garbage content
4. Phase C - prevent duplicates
5. Phase D - speed improvement
6. Phase E - scale
7. Phase F - quality polish

## BRANCH STRATEGY
```
main
  └── fix/v3-synthesis-blockers (Phase A)
       └── feat/v3-ai-synthesis (Phase B)
            └── feat/v3-deduplication (Phase C)
                 └── feat/v3-parallelize (Phase D)
                      └── feat/v3-scale-insights (Phase E)
                           └── feat/v3-customer-focus (Phase F)
```

## CRITICAL FILES - EXTRA CAUTION
| File | Risk | Approach |
|------|------|----------|
| `clustering.service.ts` | HIGH | Add null checks only, don't restructure |
| `connection-discovery.service.ts` | HIGH | Add new methods, don't modify working ones until new verified |
| `streaming-deepcontext-builder.service.ts` | HIGH | Minimal changes |
| `supabase/functions/ai-proxy/index.ts` | HIGH | Debug only, don't restructure |

## SESSION START CHECKLIST
1. Read this file
2. Read current phase file
3. Check git status
4. Identify current item number
5. Resume from last checkpoint

## SESSION END CHECKLIST
1. Update task status in phase file
2. Run `npm run build` - must pass
3. Commit with item number: `git commit -m "V3-A.1: Fix clustering null check"`
4. Note what's next in phase file
5. Tag if phase complete: `git tag v3-phase-a-complete`

## RULES
- ONE file at a time
- Build after EVERY change
- Commit after EVERY item
- Never batch without testing
- If build breaks, revert immediately
- All API calls through edge functions (no browser exposure)
- Read files before editing

## ROLLBACK
```bash
git tag pre-v3-synthesis  # Tag before starting
git checkout pre-v3-synthesis  # If everything breaks
```
