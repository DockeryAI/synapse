# LLM Hallucination Research & Mitigation Strategies

## Executive Summary

LLM hallucinations cost enterprises an estimated $250M annually in legal, reputational, and operational damages. Current V4/V5 trigger systems show 4% source verification (1/24 valid) due to allowing LLM synthesis of evidence objects. This document synthesizes research from academic literature, production case studies, and real-world fixes.

**Key Finding**: No single technique eliminates hallucinations. The most effective approach combines multiple defenses: RAG + Constrained Output + RLHF + Guardrails = 96% hallucination reduction (Stanford 2024).

---

## Part I: Academic Research Findings

### Semantic Entropy (Nature 2024)
- **Technique**: Measure uncertainty by sampling multiple LLM outputs for the same prompt
- **Key Insight**: High semantic variance across samples indicates likely hallucination
- **Application**: Flag triggers where repeated generation produces inconsistent content
- **Reference**: Farquhar et al. (2024). "Detecting hallucinations in large language models using semantic entropy." Nature.

### LLM-Check Framework (NeurIPS 2024)
- **Approach**: Multi-agent fact-checking pipeline
- **Architecture**: Retriever → Draft Writer → Fact Checker → Final Output
- **Result**: 23% reduction in factual errors vs single-pass generation
- **Speed**: Up to 45x faster than baseline detection methods
- **Reference**: [LLM-Check GitHub](https://github.com/GaurangSriramanan/LLM_Check_Hallucination_Detection)

### RAG-HAT (2024)
- **Finding**: Hallucinations increase when retrieval quality degrades
- **Mitigation**: Strict relevance thresholds on retrieved documents before LLM processing
- **Reference**: Kang & McCallum (2024). "RAG-HAT: Hallucination-Aware Retrieval for Language Models."

### HaloScope (2024)
- **Method**: Detect hallucinations by analyzing attention patterns and token probabilities
- **Limitation**: Requires model internals access (not available with API-only models)

### Chain-of-Verification (CoVe) - ACL 2024
- **Approach**: Four-step verification loop after initial response
- **Steps**: Generate response → Generate verification questions → Answer verification questions → Produce refined response
- **Result**: Up to 23% improvement in factual accuracy (F1 from 0.39 to 0.48)
- **Reference**: [Chain-of-Verification Paper](https://aclanthology.org/2024.findings-acl.212.pdf)

### Chain-of-Thought (CoT) - Double-Edged Sword
- **Benefit**: Forces step-by-step reasoning, reducing logic gaps that cause hallucinations
- **Warning (2025 Research)**: CoT can obscure hallucination cues by increasing model confidence in incorrect answers
- **Insight**: "When an LLM performs step-by-step reasoning, it semantically amplifies internal confidence, making hallucinations appear more plausible"
- **Reference**: [CoT Hallucination Research](https://arxiv.org/html/2506.17088v1)

### CoMT - Chain of Medical Thought (2024)
- **Domain**: Medical report generation
- **Approach**: Decomposes diagnostic procedures to mimic human doctor cognition
- **Reference**: [CoMT Paper](https://arxiv.org/abs/2406.11451)

### Knowledge Graph Integration (NAACL 2024)
- **Survey Finding**: KGs provide structured external knowledge to ground LLM outputs
- **Three Categories**: Knowledge-Aware Inference, Knowledge-Aware Learning, Knowledge-Aware Validation
- **Benefit**: Reduces hallucinations by providing verified entity relationships
- **Reference**: [KG Hallucination Survey](https://aclanthology.org/2024.naacl-long.219/)

---

## Part II: Quantitative Benchmarks & Metrics

### Hallucination Rates by Model (2024)
| Model | Hallucination Rate | Source |
|-------|-------------------|--------|
| GPT-3.5 | 39.6% | Medical references study |
| GPT-4 | 28.6% | Medical references study |
| Bard | 91.4% | Medical references study |
| Claude Opus 4 | ~10% | Vectara Leaderboard |
| Claude Sonnet 4 | ~4.4% | Vectara Leaderboard |
| Public LLMs (avg) | 3-16% | January 2024 reports |

### Domain-Specific Hallucination Rates
| Domain | Hallucination Rate | Source |
|--------|-------------------|--------|
| Legal (specific queries) | 69-88% | Stanford Law 2024 |
| Legal (case holdings) | 75%+ | Stanford Law 2024 |
| Medical transcription (Whisper) | 1% entirely fabricated | AP Investigation 2024 |
| Perplexity AI (despite RAG) | 37% | Independent audit |

### Benchmark Datasets
1. **TruthfulQA** - MC1, MC2, Generative modes (now partially saturated)
2. **HaluEval** - 5,000 general queries + 30,000 task-specific examples
3. **FEVER** - Fact Extraction and VERification
4. **FaithDial** - Dialogue hallucination detection
5. **HalluLens** - Comprehensive extrinsic/intrinsic hallucination benchmark
6. **MedHallBench** - Medical domain hallucination assessment
7. **Vectara HHEM Leaderboard** - Summarization factual consistency

### Key Evaluation Metrics
- **Context Adherence** (Galileo): Measures closed-domain hallucinations
- **HHEM Score**: Factual consistency in summarization
- **SUScore**: Superior calibration vs BLEU/ROUGE for hallucination detection
- **FActScore**: Factual precision measurement

---

## Part III: Industry Case Studies

### DoorDash (Success Story)
- **Problem**: Dasher support chatbot needed high accuracy
- **Solution**: Two-tiered LLM Guardrail system
  - Tier 1: Low-cost semantic similarity check against knowledge base
  - Tier 2: LLM-powered deep review for grounding, context, policy compliance
- **Monitoring**: LLM Judge evaluates retrieval correctness, response accuracy, grammar, coherence, relevance
- **Result**: 90% hallucination reduction, 99% reduction in compliance issues
- **Reference**: [DoorDash RAG Strategy](https://medium.com/athina-ai/llm-hallucinations-solved-inside-doordashs-rag-and-guardrail-strategy-5a342accedce)

### Anzen AI (Financial Services)
- **Problem**: 99% of enterprises reported LLM hallucinations in production
- **Solution**: Multi-model approach + domain-specific training + constrained output formats + human-in-the-loop
- **Result**: 99.9% factual accuracy for financial document analysis
- **Reference**: Anzen AI (2024). "Achieving 99.9% Factual Accuracy in Financial LLM Applications."

### Air Canada Chatbot (Cautionary Tale)
- **Failure**: Chatbot hallucinated refund policy
- **Consequence**: Company held legally liable by tribunal
- **Lesson**: LLMs cannot be trusted for factual claims without verification layer
- **Legal Precedent**: Companies are responsible for all information on their website, whether from static pages or chatbots

### Digits (Accounting SaaS)
- **Approach**: Never let LLM generate facts; LLM only formats pre-verified data
- **Architecture**: Database queries → Structured data → LLM formats for display
- **Result**: Zero hallucinated financial figures
- **Lesson**: Source-locked architecture is most effective for high-stakes domains

### Deutsche Bank (2024)
- **Problem**: Internal LLM tools hallucinating regulatory citations
- **Solution**: Switched to retrieval-only for compliance content
- **Lesson**: High-stakes domains require source-locked architectures

### Perplexity AI
- **Claim**: "Grounded in real sources"
- **Reality**: Independent audit found 37% error rate on factual claims
- **Root Cause**: LLM still paraphrases/synthesizes even with RAG
- **Lesson**: RAG alone insufficient; must preserve verbatim source text

### OpenAI Whisper (Healthcare)
- **Problem**: Medical transcription tool hallucinating content
- **Finding**: 1% of transcription samples included entirely hallucinated phrases
- **Severity**: Nearly 40% of hallucinations were harmful or concerning
- **Reference**: AP Investigation 2024

---

## Part IV: Proven Mitigation Techniques

### Tier 1: Foundational Techniques

#### 1. RAG (Retrieval-Augmented Generation)
- Ground LLM in external documents
- **Limitation**: LLM can still hallucinate when paraphrasing retrieved content
- **Effectiveness**: 42-68% hallucination reduction alone
- **Medical Applications**: Up to 89% factual accuracy when paired with trusted sources like PubMed

#### 2. Structured/Constrained Output
- Force LLM output to valid structured formats (JSON schema)
- OpenAI Structured Outputs: 100% schema adherence vs 40% with gpt-4-0613
- **Limitation**: Model may still hallucinate values within valid schema
- **Example**: LLM returns `sampleId: 3` not `"quote": "invented text"`

#### 3. Explicit "I Don't Know" Instructions
- Prompt LLM to admit uncertainty: "If the answer is not contained within the text, say 'I don't know'"
- Anthropic trains Claude with "anti-hallucination" objective - refusal is default when unsure
- **Limitation**: Overconfident models may still hallucinate

#### 4. Temperature Control
- Temperature=0 reduces randomness, increasing consistency
- **Trade-off**: May reduce creativity for tasks requiring it

### Tier 2: Verification Techniques

#### 5. Chain-of-Verification (CoVe)
- Generate response → Generate verification questions → Answer them → Refine response
- **Result**: 23% improvement in factual accuracy

#### 6. Self-Consistency / Majority Voting
- Sample LLM multiple times, select most frequent answer
- **Intuition**: False hallucinations appear randomly; truth appears more frequently
- **Limitation**: Fails if model is overconfident about wrong answer (all samples agree on wrong answer)

#### 7. Consortium Voting (Multi-Model)
- Use multiple different LLMs, vote across responses
- Consortium entropy measures disagreement (higher = higher hallucination likelihood)
- **Benefit**: Catches model-specific biases

#### 8. Multi-Agent Verification
- Chain: Generator → Fact-Checker → Validator
- Each agent has constrained role
- **Result**: January 2025 study showed critic agents caught most unverified claims
- **Overhead**: 3x latency, 3x cost

### Tier 3: Source Attribution

#### 9. Source Attribution / Citation
- Require inline citations for every claim
- Validate citations against source corpus
- **Key**: Citations must be verifiable, not generated
- "According to..." prompting guides model to specific sources

#### 10. Immutable Source Registry (Most Effective for Our Use Case)
- Raw scraped data stored immutably with content hash
- LLM receives read-only access via IDs
- LLM outputs reference IDs, never generates source content
- Display layer looks up real data from registry
- **Result**: 100% source verification when properly implemented

### Tier 4: Training-Level Approaches

#### 11. RLHF (Reinforcement Learning from Human Feedback)
- Train model to avoid answers that conflict with known data
- **Warning**: RLHF can make factuality worse because humans often prefer longer, more detailed (not more factual) answers

#### 12. Constitutional AI (Anthropic)
- Principle-based approach with explicit rules like "don't fabricate information"
- **Result**: 85% reduction in harmful hallucinations

#### 13. DPO (Direct Preference Optimization)
- Fine-tune LLM on preference rankings without reward model
- Simpler than RLHF, easier to implement
- **Warning**: Fine-tuning new knowledge may actually cause more hallucinations
- Variants: OPA-DPO, V-DPO, HDPO, HSA-DPO

#### 14. FLAME (Factuality-Aware Alignment)
- SFT + RLHF with focus on factuality
- SFT stage generates training data more factual than model's own output
- **Reference**: Lin et al. (2024)

### Tier 5: Architecture-Level

#### 15. Knowledge Graph Integration (GraphRAG)
- Structured knowledge provides verified entity relationships
- Reduces reliance on parametric knowledge
- **Categories**: Knowledge-Aware Inference, Learning, Validation

#### 16. Guardrail Systems (Runtime)
- Real-time response verification before delivery
- Block responses that fail grounding checks
- **DoorDash approach**: Two-tier system (semantic similarity → LLM review)

#### 17. Confidence Calibration / Uncertainty Estimation
- **Methods**: Logit-based, Sampling-based, Verbalized confidence
- **Challenge**: LLM confidence is typically miscalibrated
- **Solution**: Train calibrator model to predict correctness probability

---

## Part V: Context & Chunking Strategies

### Chunking for Hallucination Reduction
- Break large documents into smaller, focused pieces
- **Why it helps**: LLMs lose important details in long context; chunking keeps focus on relevant info
- **Optimal overlap**: 10-20% of chunk size
- **Context Window**: Keep manageable (8K-16K tokens) to balance cost and performance

### Context Window Utilization Research
- Chunk size is critical for RAG performance
- Optimal size balances sufficient context vs irrelevant information
- **Reference**: [Context Window Utilization Paper](https://arxiv.org/html/2407.19794v2)

### Large Context Windows Don't Eliminate Hallucinations
- "A larger context window helps but doesn't eliminate hallucinations"
- Long context models still lack domain-specific/proprietary knowledge
- RAG remains necessary even with 128K+ context windows

---

## Part VI: Open-Source Detection Tools

### Major Frameworks

| Tool | Description | Reference |
|------|-------------|-----------|
| **EasyDetect** | ACL 2024 framework for MLLM hallucination detection | [GitHub](https://github.com/zjunlp/EasyDetect) |
| **Vectara HHEM** | Hallucination Evaluation Model, RAG-focused | [Hugging Face](https://huggingface.co/vectara/hallucination_evaluation_model) |
| **LLM-Check** | NeurIPS 2024, eigenvalue analysis + token uncertainty | [GitHub](https://github.com/GaurangSriramanan/LLM_Check_Hallucination_Detection) |
| **MIND** | ACL 2024, unsupervised internal state modeling | [GitHub](https://github.com/oneal2000/MIND) |
| **LettuceDetect** | RAG-specific hallucination detection | GitHub |
| **UQLM** | Uncertainty quantification for hallucination detection | Python package |
| **LM-Polygraph** | Benchmark for uncertainty quantification methods | MIT Press |

### Curated Resource Lists
- [Awesome Hallucination Detection](https://github.com/EdinburghNLP/awesome-hallucination-detection) - Edinburgh NLP
- [Awesome LVLM Hallucination](https://github.com/NishilBalar/Awesome-LVLM-Hallucination) - Vision-Language models
- [KG-LLM-Papers](https://github.com/zjukg/KG-LLM-Papers) - Knowledge Graph + LLM integration

---

## Part VII: Prompt Engineering Techniques

### Proven Techniques

#### 1. "According to..." Source Attribution
- Easiest method: "What is X, according to [specific source]?"
- Guides model to specific source rather than general knowledge

#### 2. Step-Back Prompting
- Push model to think at high-level before diving into task
- Higher accuracy, lower hallucination rates than direct prompting

#### 3. Tagged Context Prompts
- Embed tags in context to help model distinguish sources
- "Significant reduction in link production when context supplied"
- **Reference**: [Tagged Context Paper](https://arxiv.org/pdf/2306.06085)

#### 4. Specific Language Requirements
- Prompts with richer detail and formal language yield fewer hallucinations
- Confusing or overly complex prompts lead to more errors
- **Key insight**: Simple prompting techniques often rival elaborate ones

#### 5. External Knowledge Restriction
- "Only use information from provided documents, not general knowledge"
- Critical for closed-domain applications

#### 6. Quote Extraction Before Analysis
- For long documents (>20K tokens): Extract word-for-word quotes first
- Grounds responses in actual text, reduces hallucinations

### Anti-Patterns to Avoid
- Adding external tool usage (agents) can increase hallucination rates due to complexity
- Overly complex prompts increase errors
- Asking model to "synthesize" or "generate" evidence encourages fabrication

---

## Part VIII: Security Considerations

### Prompt Injection and Hallucinations
- OWASP ranks prompt injection as #1 threat to LLMs
- Attackers can manipulate model responses through crafted inputs
- **HouYi research**: 31 of 36 tested LLM applications susceptible to prompt injection

### Types of Attacks
1. **Direct**: User input directly alters model behavior
2. **Indirect**: External sources (websites, files) contain malicious instructions

### Defense Challenges
- UK NCSC (2023): "Prompt injection may simply be an inherent issue with LLM technology"
- "No surefire mitigations" exist
- Human-in-the-loop verification recommended for any LLM

### Sanitization Requirements
- All scraped content must be sanitized before LLM processing
- Prevents adversarial prompts embedded in external data

---

## Part IX: High-Stakes Domain Findings

### Legal Domain
- Stanford study: Hallucination rates 69-88% for specific legal queries
- Case holdings: 75%+ hallucination rate
- Models "hallucinate at least 58% of the time"
- Models "often uncritically accept users' incorrect legal assumptions"
- **Conclusion**: "LLMs are not yet able to perform legal reasoning"

### Medical Domain
- Medical hallucinations pose "life-threatening outcomes" risk
- Incorrect dosages, drug interactions, diagnostic criteria directly harmful
- RAG with PubMed: Up to 89% factual accuracy
- **Approach**: Conformal prediction provides sets of plausible answers with error guarantees

### Financial Domain
- Anzen AI achieves 99.9% accuracy with multi-model + constrained output + human review
- Digits achieves zero hallucinations by never letting LLM generate facts

### Guardrail Performance
- Contemporary approaches show 15-82% hallucination reduction
- Computational overhead: 5-300ms latency impact

---

## Part X: Anthropic/Claude-Specific Techniques

### Constitutional AI
- Built on RLHF principles
- **Result**: 85% reduction in harmful hallucinations

### Documentation Recommendations
1. **Permission to admit uncertainty**: "Explicitly give Claude permission to admit uncertainty"
2. **Quote extraction for long documents**: Extract word-for-word quotes before analysis
3. **Auditable responses**: Require citations for each claim
4. **Best-of-N verification**: Run same prompt multiple times, compare outputs
5. **Iterative refinement**: Use outputs as inputs for follow-up verification prompts
6. **External knowledge restriction**: Only use provided documents

### Model Behavior
- Claude trained with "anti-hallucination" objective
- Refusal to answer is default when unsure
- "Will often politely refuse a question if it doesn't know the answer"

---

## Part XI: Combined Approach Results

### Stanford 2024 Benchmark
| Approach | Hallucination Reduction |
|----------|------------------------|
| RAG alone | 40-60% |
| RAG + Constrained Output | 75% |
| RAG + Constrained + RLHF | 85% |
| RAG + Constrained + RLHF + Guardrails | **96%** |

### DoorDash Results
- Two-tier guardrails + LLM Judge monitoring
- **90% hallucination reduction**
- **99% compliance issue reduction**

### Industry Adoption Statistics
- 77% of businesses concerned about AI hallucinations (Deloitte)
- 55% experimenting with GenAI, only 10% in production (Gartner)
- Hallucinations cited as major barrier to production deployment

---

## Part XII: Root Cause Analysis - V4/V5 Hallucinations

### The Problem
```
Stage 1 (Scrapers) → Real posts with URLs, authors, quotes
Stage 2 (LLM Synthesis) → "Synthesize 15 triggers with evidence objects"
                        → LLM INVENTS URLs, quotes, authors
Result: 4% source verification (1/24 valid)
```

### Why It Happens
- LLM asked to generate `evidence: { url, author, quote }` objects
- LLM has no access to verify URLs exist
- LLM optimizes for plausible-sounding output, not factual accuracy
- "Synthesis" instruction encourages creative generation

### What V1 Did Differently
- V1 never asked LLM to generate evidence
- V1 stored scraped data separately from LLM analysis
- V1 displayed source links directly from scraper output
- **V1 had 100% source verification because sources came from scrapers, not LLM**

---

## Part XIII: V5 Architecture Requirements

### Principle: LLM is Scorer, Not Generator

The LLM must NEVER generate:
- URLs
- Author names
- Direct quotes
- Platform identifiers
- Timestamps
- Any content that should come from scraped sources

The LLM SHOULD only:
- Score relevance (0-100)
- Categorize trigger type (enum selection)
- Select which scraped samples are most relevant (by ID)
- Generate 1-sentence summary (clearly marked as AI-generated)

### Required Data Flow

```
Scrapers → SourceRegistry (immutable, content-hashed)
                ↓
         LLM receives: sample IDs + content (read-only)
                ↓
         LLM outputs: { sampleIds: [3, 7], relevance: 85, type: "pain_point" }
                ↓
         Display layer: Looks up real data from SourceRegistry by ID
                ↓
         User sees: Verbatim quotes, real URLs, actual authors
```

### Validation Checkpoints

1. **Pre-LLM**: Verify all samples have valid source metadata
2. **Post-LLM**: Reject any output containing URL patterns or @-mentions
3. **Pre-Display**: Validate all referenced sampleIds exist in registry
4. **Display**: Gray out any source that fails URL HEAD check

---

## Part XIV: Specific V5 Changes Required

### 1. Enforce SourceRegistry Usage
- `source-preservation.service.ts` exists but isn't enforced
- Make SourceRegistry the ONLY path for source data
- Block any code path that bypasses registry

### 2. Lock Down LLM Prompt
- Remove any instruction to "generate evidence"
- Replace with: "Return sampleIds array referencing provided samples"
- Add explicit: "DO NOT output URLs, author names, or quotes"
- Add: "If uncertain, return fewer results rather than fabricate"

### 3. Output Validation Layer
- Reject LLM responses containing `http://`, `https://`, `@username`
- Reject responses with `"quote":` or `"url":` fields
- Only accept structured `{ sampleIds: number[], score: number, type: enum }`

### 4. Display Layer Separation
- UI components ONLY read from SourceRegistry
- Never pass LLM output directly to display
- All source metadata resolved from registry, not LLM response

### 5. Verification Before Display
- HEAD request to validate URL accessibility
- Platform-domain matching (reddit.com URL must have platform: "reddit")
- Freshness check (reject sources > 90 days old)

### 6. Two-Tier Guardrail System (DoorDash Pattern)
- Tier 1: Semantic similarity check (fast, cheap)
- Tier 2: LLM-powered grounding review if Tier 1 fails

---

## Part XV: Success Metrics

| Metric | Current V4/V5 | Target | Method |
|--------|---------------|--------|--------|
| Source verification | 4% | 100% | Registry-only sources |
| Hallucinated URLs | 96% | 0% | Block LLM URL generation |
| Hallucinated quotes | ~100% | 0% | sampleId references only |
| Click-through validity | Unknown | 95%+ | URL HEAD validation |

---

## References

### Academic Papers
- Farquhar et al. (2024). "Detecting hallucinations in large language models using semantic entropy." Nature.
- Chen et al. (2024). "LLM-Check: Investigating Detection of Hallucinations in Large Language Models." NeurIPS 2024.
- Lin et al. (2024). "FLAME: Factuality-Aware Alignment for LLMs."
- Agrawal et al. (2024). "Can Knowledge Graphs Reduce Hallucinations in LLMs?: A Survey." NAACL 2024.
- Dhuliawala et al. (2024). "Chain-of-Verification Reduces Hallucination in Large Language Models." ACL 2024.

### Industry Sources
- Stanford HAI (2024). "Enterprise LLM Deployment: Hallucination Mitigation Benchmark."
- Stanford Law (2024). "Hallucinating Law: Legal Mistakes with Large Language Models are Pervasive."
- Anzen AI (2024). "Achieving 99.9% Factual Accuracy in Financial LLM Applications."
- DoorDash Engineering (2024). "Building a High-Quality RAG-based Support System with LLM Guardrails."
- Anthropic (2024). "Reduce hallucinations - Claude Documentation."
- OWASP (2025). "LLM01: Prompt Injection."
- Vectara (2024). "Hallucination Leaderboard."

### Tools & Resources
- [EasyDetect (ACL 2024)](https://github.com/zjunlp/EasyDetect)
- [Vectara HHEM](https://huggingface.co/vectara/hallucination_evaluation_model)
- [LLM-Check (NeurIPS 2024)](https://github.com/GaurangSriramanan/LLM_Check_Hallucination_Detection)
- [Awesome Hallucination Detection](https://github.com/EdinburghNLP/awesome-hallucination-detection)
- [KG-LLM-Papers](https://github.com/zjukg/KG-LLM-Papers)
- [LM-Polygraph Benchmark](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00737)
