// Lesson bodies — module 03, advanced-systems
//
// Split out of courseData.js so 109 KB of lesson prose stays out of the
// always-loaded bundle. Loaded on demand via src/data/lessonContent.js.
//
// KEYED BY LESSON SLUG, never by position. Ordering lives in courseData.js,
// which is what the build guard freezes; progress keys stay positional
// (`${m}-${l}`) and are never derived from anything in this file.

export const bodies = {
  "prompt-chaining-and-pipelines": `Complex tasks need to be broken into smaller steps, with each step's output feeding the next.

**Basic Chain:**
\`\`\`
Input → [Extract] → [Analyze] → [Format] → Output
\`\`\`

**Chain Design Principles:**
1. One task per prompt — reduces mistakes spreading from step to step
2. Pass structured data (JSON) between steps for clean handoffs
3. Add a check between steps — validate the output before moving on
4. Design fallback steps for when something goes wrong

**Conditional Chain (Router Pattern):**
\`\`\`
Input
  ↓
Router: "Classify as: [technical / billing / general]. Output only the category."

If technical → Technical Support Chain
If billing   → Billing Chain
\`\`\`

**When to Chain:** Tasks needing more than 800 words of reasoning, multi-step transformations, workflows requiring validation gates.

---

## Detailed Analysis

**Why Chains Beat Single Prompts**
When a single prompt gets very long, the AI's attention gets spread across too many things at once, reducing its effective focus on any individual instruction. Breaking a complex task into focused steps keeps each prompt tight and optimized for its specific job.

There's also an error compounding problem: in a single prompt, an early reasoning mistake snowballs through the entire response. In a chain, each step's output can be validated before passing to the next stage. A bad extraction step gets caught and corrected before it corrupts the analysis step.

**How to Design a Chain**

Step 1: **Break down the task** — Write out the steps a human expert would follow. Each distinct step becomes a chain stage.

Step 2: **Define the handoff** — For each stage, define: What goes in? What comes out? In what format (JSON, plain text, structured template)?

Step 3: **Add validation** — After each stage, check the output against what you expected. A simple check like "can this be parsed as JSON?" is enough. If it fails, re-run that step.

Step 4: **Carry state forward** — Each stage should receive the original input PLUS all prior outputs. This keeps context consistent through the whole chain.

**The Router Pattern**
The router prompt classifies the input so the right chain handles it. A good router:
- Outputs only a category label (no prose around it)
- Has categories that don't overlap
- Includes an "unknown" category for anything unexpected
- Is set to temperature = 0 for consistent results

**Real-World Example: Document Processing Pipeline**
\`\`\`
Stage 1 (Extract): Identify document type and key details → JSON
Stage 2 (Validate): Check extracted details are complete → Pass/Fail
Stage 3 (Enrich): Look up extra context → JSON with enriched data
Stage 4 (Format): Generate final structured report → Markdown
\`\`\`

---

## Take-Home Points

- Break complex tasks into focused single-task prompts
- Pass structured JSON between steps for reliable handoffs
- Add validation between steps to stop errors from compounding
- Use a Router prompt at the start to direct different inputs to the right chains
- Design fallback prompts for when a step fails — never let a chain silently break

---

## Conclusion

Prompt chaining is what takes AI from answering single questions to powering real products. Any complex knowledge work — research, analysis, content generation, data processing — can be broken into a chain of focused prompts, each doing one thing well. Master chain architecture and you've mastered building AI-powered systems, not just AI-powered responses.`,
  "tree-of-thoughts": `Step-by-step thinking produces one line of reasoning. Tree of Thoughts explores multiple different approaches at once, evaluates them, and picks the best one — similar to how a smart person considers several options before committing.

**Step 1 — Generate multiple approaches:**
\`\`\`
"Generate 3 different approaches to this problem. Describe key steps in 2-3 sentences each."
\`\`\`

**Step 2 — Evaluate them:**
\`\`\`
"Rate each approach: (a) feasibility 1-5, (b) completeness 1-5, (c) failure risk 1-5. Explain each."
\`\`\`

**Step 3 — Expand the best one:**
\`\`\`
"The highest-scoring approach was [X]. Expand into a detailed step-by-step plan with edge cases."
\`\`\`

**Cost vs. Benefit:** 3–5x more words than step-by-step thinking. Use for high-stakes decisions where quality justifies the cost.

---

## Detailed Analysis

**The Thinking Process Behind ToT**
Standard AI responses are like a first instinct — fast but sometimes wrong on hard problems. Step-by-step thinking pushes toward more deliberate reasoning. Tree of Thoughts pushes even further: it explicitly creates multiple hypotheses, evaluates them against clear criteria, and selects the best — the same mental process an expert uses when solving a difficult problem by considering multiple approaches before committing.

**How to Run Each Phase**

**Phase 1: Come up with different options (Diverge)**
You want genuinely different approaches — not three versions of the same idea.
Prompt tip: "Generate 3 approaches that are as different from each other as possible. If you find yourself proposing similar solutions, start over."

**Phase 2: Compare options against criteria (Evaluate)**
The evaluation criteria are the most important part. Define them before you generate options:
- What does success look like for this approach?
- What are the main ways it could fail?
- What would we need to actually execute it?

**Phase 3: Go deep on the winner (Commit)**
Once you've picked the best path, focus entirely on expanding it. Start a new prompt that only talks about the winning approach — carrying the rejected ones forward can confuse the output.

**Tree of Thoughts vs. Step-by-Step**
Use step-by-step when you know the general direction and just need careful execution. Use Tree of Thoughts when you genuinely don't know which approach is best and want to explore options first.

**Quick Cost Estimate**
For a simple Tree of Thoughts with 3 options, 1 evaluation, and 1 expansion:
- Generating 3 options: ~600 words
- Evaluation: ~300 words
- Expansion: ~800 words
Roughly 3x the cost of a single step-by-step response — but for a complex strategic decision, that tradeoff is often worth it.

---

## Take-Home Points

- Tree of Thoughts generates multiple reasoning paths, evaluates them, and expands the best one
- Define your evaluation criteria BEFORE generating options — they determine which one wins
- Use it when you don't know which of several different approaches is best
- 3–5x more words than step-by-step — reserve for high-stakes, low-volume decisions
- Keep rejected options out of the expansion prompt to avoid muddling the final answer

---

## Conclusion

Tree of Thoughts is one of the most powerful prompting architectures. It's not just a technique — it's a structured way of thinking through hard problems. When the stakes are high enough to justify the extra effort, it reliably outperforms both zero-shot and step-by-step approaches. And it mirrors how expert thinkers actually work: explore multiple hypotheses, evaluate them rigorously, commit to the strongest one.`,
  "self-reflection-and-critique-loops": `**The Reflexion Pattern:** Generate output → Check it against criteria → Revise.

**Basic Critique Loop:**
\`\`\`
Step 1: "Write a cold email for [product] targeting [audience]."

Step 2: "Review against criteria:
- Opens with a pain point, not a feature? (Y/N)
- CTA is specific with a low-commitment ask? (Y/N)
- Under 100 words? (Y/N)
List failures and why."

Step 3: "Rewrite fixing all identified issues."
\`\`\`

**Multi-Agent Debate:**
\`\`\`
Prompt A: "Argue why [position X] is correct."
Prompt B: "Argue why [position X] is flawed."
Prompt C: "Write a balanced analysis given both arguments."
\`\`\`
Extremely effective for research, policy analysis, any output requiring balance.

---

## Detailed Analysis

**Why Self-Critique Produces Better Results**
When the AI generates output and then critiques it, something useful happens: the critique step is often more accurate than the original generation. This is because critiquing is a different job than creating — it activates a different kind of checking process. Just as a writer benefits from reading their own draft with "editor eyes," the AI benefits from switching from creation mode to evaluation mode.

**How This Connects to How Claude Works**
Anthropic's approach called "Constitutional AI" is closely related to this pattern. The model is given a list of principles and asked to evaluate its own outputs against them. That's exactly the critique step — the difference is that in Claude's training, the principles are fixed, while in your prompts, you define the criteria yourself at any time.

**What Makes Critique Criteria Effective**
The critique is only as good as its criteria. Good criteria are:
- **Yes/No answers when possible** — easier to evaluate than "how well does it..."
- **Specific** ("Under 100 words" not "concise")
- **In priority order** (most important criteria first)
- **Relevant to the task** (cold email criteria ≠ code review criteria)

Example criteria for different tasks:
- Cold email: Opens with pain point? Strong call-to-action? Short enough? Personalized?
- Code review: Handles all error cases? No security issues? Readable?
- Research summary: Cites specific evidence? Acknowledges what's uncertain? Covers counterarguments?

**How Many Rounds?**
For most tasks, 2–3 critique-and-revise cycles is enough:
- Round 1: address major structural issues
- Round 2: address style and clarity
- Round 3: final polish
Beyond 3, improvements become marginal and you risk "over-polishing."

**Multi-Agent Debate**
When one AI argues for a position and another argues against, you get a stronger balanced analysis. This works well for:
- Business decisions with significant uncertainty
- Research summaries that need to be fair
- Content that must represent multiple perspectives
- Finding blind spots in a proposed plan

---

## Take-Home Points

- The Reflexion pattern (generate → critique → revise) reliably improves output quality
- Critique criteria should be yes/no, specific, and relevant to the task
- 2–3 critique-and-revise cycles is the practical sweet spot for most tasks
- Multi-Agent Debate produces stronger balanced analysis than single-prompt approaches
- Self-critique works because evaluation and creation are genuinely different processes

---

## Conclusion

Self-reflection and critique loops are the closest thing prompt engineering has to quality control. Just as good software ships with tests, high-stakes prompts should ship with embedded critique criteria. The AI's ability to evaluate its own output — given clear rubrics — is often as reliable as a human reviewer for well-defined quality criteria. Build critique loops into your workflow wherever quality matters.`,
  "rag-prompt-engineering": `**What RAG Solves**
AI models have a knowledge cutoff — they don't know about recent events, and they can't access your private documents. RAG (Retrieval-Augmented Generation) fixes this: it finds the most relevant pieces of your documents and feeds them directly into the prompt at the moment you ask a question. The AI answers from your documents, not just its built-in knowledge.

**Basic RAG Prompt:**
\`\`\`
[SYSTEM]
Answer questions based ONLY on the provided context.
If the answer isn't in the context: "I don't have that information."

[RETRIEVED CONTEXT]
{document_chunk_1}
{document_chunk_2}

[USER QUESTION]
{question}
\`\`\`

**Critical Instructions to Include:**
- **Grounding:** "Answer using ONLY the context above"
- **Uncertainty:** "State what remains uncertain"
- **Attribution:** "Cite source after each claim [Doc 1]"
- **Contradictions:** "Present both perspectives if documents contradict each other"

**Starting Configuration:** Chunk size 200–500 words, top 3–5 matching chunks, and a reranking step before insertion.

---

## Detailed Analysis

**The Three Ways RAG Fails**

1. **Wrong chunks retrieved** — The right document exists but wasn't found. This happens when the search is too literal or the chunks are sized poorly.
2. **Too many chunks** — Injecting too much context dilutes the relevant information. The AI can't find the signal in the noise.
3. **AI ignores the context** — The AI answers from its built-in training knowledge instead of the provided documents. This causes inaccurate or outdated answers.

Each failure needs a different fix.

**Fixing Wrong Chunks Retrieved**
Try rephrasing your query in 3 different ways and retrieve for each version. Sometimes the way a document is written doesn't match the exact words in your question, but a rephrased version will find it.

You can also try this trick: generate a hypothetical ideal answer to your question, then use that as your search query. The AI's hypothetical answer is often worded more similarly to how real documents discuss the topic.

**Fixing Too Many Chunks**
Start with only 3 matching chunks. If your answers are missing information, increase to 5. Add a scoring step that picks only the chunks most closely matching your question — this helps you keep quality high while reducing quantity.

**Fixing the AI Ignoring Context**
Use strong, explicit grounding language:
\`\`\`
You MUST answer based solely on the information in the [CONTEXT] section below.
If the answer is not explicitly stated in the context, respond with:
"This information is not available in the provided documents."
Do NOT use your general knowledge to supplement the answer.
\`\`\`

**Attribution for Professional Use**
For business or legal use cases, require the AI to cite sources after every claim:
\`\`\`
After each statement you make, cite which document it came from in brackets: [Document 1], [Document 2].
If a claim comes from multiple documents, cite all of them.
\`\`\`

---

## Take-Home Points

- RAG is the standard solution for "AI doesn't know recent events" or "AI can't see my private data"
- The three failure modes: wrong chunks retrieved, too many chunks, AI ignores context
- Rephrasing your query 3 ways dramatically improves how well the right chunks get found
- Strong grounding instructions prevent the AI from falling back on built-in knowledge
- Start with 200–500 word chunks, top 3–5 results, and a scoring step

---

## Conclusion

Retrieval-Augmented Generation has become the backbone of enterprise AI products. Built-in AI knowledge is insufficient for most business use cases — products change, policies update, and private data can't be trained on. RAG solves all three problems. The prompt engineering side of RAG — the system instructions, the context format, the grounding language, the attribution requirements — is just as important as the retrieval technology. Master both, and you can build knowledge systems that are accurate, auditable, and trustworthy.`,
};
