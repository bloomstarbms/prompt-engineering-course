// Lesson bodies — module 07, production-and-mastery
//
// Split out of courseData.js so 109 KB of lesson prose stays out of the
// always-loaded bundle. Loaded on demand via src/data/lessonContent.js.
//
// KEYED BY LESSON SLUG, never by position. Ordering lives in courseData.js,
// which is what the build guard freezes; progress keys stay positional
// (`${m}-${l}`) and are never derived from anything in this file.

export const bodies = {
  "prompt-management-at-scale": `**Prompt Registry (Organized File Structure):**
\`\`\`
prompts/
├── system/
│   ├── base_assistant.txt
│   └── safety_wrapper.txt
├── tasks/
│   ├── summarization_v3.txt
│   └── classification_v2.txt
├── evaluators/
│   └── quality_judge.txt
└── tests/
    └── summarization_cases.json
\`\`\`

**Reusable Templates:**
\`\`\`python
SUMMARIZE = """
You are a {role} summarizing for {audience}.
Tone: {tone} | Length: {max_words} words max
Content: {content}
"""
\`\`\`

**Versioning:** Major (v1→v2) = the output format changed in a breaking way. Minor (v1.1) = same format, better performance. Keep all old versions for rollback.

**Documentation:** Every prompt needs: purpose, input variables, output format, test scores, known failure cases, last tested date + model version.

---

## Detailed Analysis

**The Scaling Problem**
One developer working alone can keep their prompts in a text file. A team building AI products cannot. When multiple engineers iterate on the same prompt, or a product has 50 different prompts across 10 features, ad-hoc management becomes a liability. Prompt management at scale means treating prompts as critical production assets — which they are.

**Version Control for Prompts**
Prompts belong in version control (git) alongside code. Every change should have:
- A note explaining the motivation for the change
- Test scores before and after the change
- Which test cases were run to validate it

The major/minor versioning convention maps directly to how software APIs work:
- **Major version** (v1 → v2): the output format changed in a breaking way — everything downstream must be updated
- **Minor version** (v1.0 → v1.1): the output format is unchanged, only the logic improved — backward compatible

**The Template Pattern**
Reusable templates with fill-in variables are far more maintainable than having 10 slightly different prompts for 10 different use cases. Instead:
\`\`\`python
def build_summarize_prompt(role, audience, tone, max_words, content):
    return SUMMARIZE_TEMPLATE.format(
        role=role, audience=audience, tone=tone,
        max_words=max_words, content=content
    )
\`\`\`

This enables:
- Central maintenance of the core logic
- Easy A/B testing (just change one parameter)
- Easy auditing ("what values of 'role' are we using in production?")

**Prompt Documentation Block**
Every production prompt should have a header like this:
\`\`\`
# summarization_v3.txt
# Purpose: Summarize articles for newsletter digest
# Input Variables: article_text, target_length_words, audience_type
# Output Format: Single paragraph, no headers
# Test Score: 87% (human rating), 91% (AI judge) — tested 2025-03-15
# Known Failures: Fails on articles over 10,000 words. Struggles with heavy jargon.
# Last Tested With: Claude 3 Sonnet
# Owner: @marketing-team
\`\`\`

**Gradual Rollout**
In production, use feature flags to roll out prompt changes gradually:
- 5% of traffic uses the new version
- Monitor test metrics on that 5%
- If metrics improve, increase to 25% → 50% → 100%
- If metrics regress, roll back instantly
This is the same practice as rolling software deployments — applied to prompts.

---

## Take-Home Points

- Treat prompts as production assets: version control, documentation, testing, and ownership
- Parameterized templates are more maintainable than slightly-different hardcoded prompts
- Major version = breaking format change; minor version = same format, improved logic
- Every production prompt needs: purpose, variables, output format, test scores, failure modes, owner
- Use gradual rollout for prompt changes to minimize risk

---

## Conclusion

Prompt management at scale is what separates "AI experiments" from "AI products." The techniques — version control, templates, documentation standards, gradual rollout — are borrowed directly from software engineering. What's new is applying them to natural language prompts rather than code. Organizations that build this infrastructure early iterate faster, debug more reliably, and scale their AI products with confidence. Those that skip it accumulate "prompt debt" that eventually becomes a production liability.`,
  "model-selection-and-cross-model-prompting": `**Model Tiers:**

| Model Class | Strengths | Use When |
|---|---|---|
| GPT-4 / Claude Opus | Complex reasoning, nuanced tasks | High-stakes, complex problems |
| Claude Sonnet / GPT-4o | Best balance of speed + quality | Most production use cases |
| Claude Haiku / GPT-3.5 | Fast and affordable | Speed-critical or high-volume |
| Open source (Llama, Mistral) | Private data, on-premise | Data privacy requirements |

**Claude Works Especially Well with XML:**
\`\`\`xml
<task>
  <context>...</context>
  <instructions>...</instructions>
  <output_format>...</output_format>
</task>
\`\`\`

**Eval-First Principle:** Run your actual test suite on candidate models. Real performance data beats marketing claims every time.

---

## Detailed Analysis

**Model Selection is an Ongoing Decision**
The best model for your task today may not be the best model in 6 months as new releases arrive. Build model selection into your system as a configurable setting, not a hardcoded choice.

The four factors for model selection:

1. **Task complexity** — How much reasoning is required? Simple classification → affordable fast models. Complex multi-step reasoning → frontier models.

2. **Speed requirements** — A customer-facing chatbot needs responses in under 2 seconds. A background analysis pipeline can take 60 seconds.

3. **Cost per use** — At scale, the difference between Claude Haiku and Claude Opus can be 100x in cost. For 1 million daily requests, this is a significant budget decision.

4. **Privacy requirements** — Regulated industries (healthcare, finance, legal) may not be able to send data to external cloud APIs. Open-source models running on your own infrastructure are the solution.

**Each Model Has Its Own Style**
The same logical prompt may perform differently across models:

- **Claude (Anthropic):** excellent with XML structure, strong at following complex multi-part instructions, thoughtful nuanced output
- **GPT-4 (OpenAI):** strong at code generation, responds well to Markdown formatting
- **Gemini (Google):** strong at tasks involving factual knowledge and structured reasoning
- **Llama/Mistral (open source):** performance varies by size; benefit most from clear examples

For cross-model compatibility: write prompts in plain, clear English first. Add model-specific formatting as a separate layer on top. Don't write prompts that only work on one model if you might need to switch.

**The Eval-First Principle**
Marketing benchmarks measure general performance on standardized tests. Your specific task matters more. A model that scores 90% on a general benchmark might score 65% on your actual use case.

Evaluation protocol for choosing a model:
1. Run your standard test suite on your current model
2. Run the identical suite on the candidate model
3. Compare: accuracy, response time, cost per request
4. Calculate the cost-adjusted performance
5. Pick the model with the best cost-adjusted performance on your specific task

---

## Take-Home Points

- Select models on four factors: task complexity, speed requirements, cost, and privacy needs
- Different models respond to different formatting — Claude excels with XML; GPT-4 with Markdown
- Write model-agnostic prompts first; add model-specific optimizations as a separate layer
- Always test on your actual task — marketing benchmarks don't predict real-world performance
- Build model selection as a configurable parameter; the landscape changes rapidly

---

## Conclusion

Model selection is a strategic decision affecting quality, cost, and speed simultaneously. There's no universally best model — only the best model for your specific task, speed requirements, cost budget, and privacy constraints. The eval-first approach eliminates the guesswork: test candidate models on your actual task with your actual data and let the numbers decide. As the model landscape continues to evolve rapidly, organizations that build rigorous model testing into their workflows will consistently outperform those relying on intuition and marketing claims.`,
  "building-your-prompt-engineering-practice": `**Daily Habits That Build Real Expertise:**
1. Keep a prompt journal — what worked, what didn't, and why
2. Reverse-engineer outputs you admire — what prompt would produce that?
3. Read one AI research paper abstract per day (it compounds over time)
4. Build a personal prompt library organized by technique type

**The High-Value Techniques to Master First:**
1. Zero-shot step-by-step for reasoning tasks
2. Few-shot for classification and extraction
3. Self-critique loops for quality-sensitive writing
4. Structured JSON output for any production use
5. RAG grounding prompts for knowledge-intensive tasks

**Career Positioning:** Go T-shaped — deep expertise in prompt engineering + deep expertise in one field (finance, medicine, legal, code, marketing).

**The Compounding Advantage:** After 100 prompts: strong intuition. After 1,000: expert-level instinct. The practice compounds exponentially.

**Your Next Step:** Pick one real task. Apply CRISP. Create 20 test cases. Run, score, iterate 5 times, document what you learned. That single exercise is worth more than 10 hours of reading.

---

## Detailed Analysis

**How Expertise Actually Develops**

Deliberate practice — the method behind expertise in chess, athletics, music, and programming — requires:
1. Clear, measurable performance criteria
2. Immediate feedback
3. Targeted work on weaknesses
4. Progressively harder challenges

Applied to prompt engineering:
1. **Criteria:** your test suite is the performance metric
2. **Feedback:** the score after each iteration
3. **Weakness targeting:** the 10x Harder Test surfaces your weak spots
4. **Progression:** tackle harder tasks as your core skills improve

The prompt journal is how you extract learning from each practice session. Without documenting, experience just repeats — it doesn't build into expertise.

**The T-Shaped Expertise Model**

General prompt engineering skill is the horizontal bar: broad competence across techniques, models, and use cases. Deep expertise in one field is the vertical bar: knowing that field's data, quality standards, edge cases, and failure modes from the inside.

Why domain depth matters:
- You can write better evaluation criteria because you know what great output actually looks like
- You catch failure modes that a field-agnostic prompter would miss
- You command premium positioning in the job market
- You build proprietary techniques that transfer across clients in your vertical

High-value fields for prompt engineering specialization:
- **Healthcare:** medical record processing, clinical decision support, insurance coding
- **Legal:** contract analysis, legal research, compliance monitoring
- **Finance:** financial analysis, risk assessment, earnings synthesis
- **Software engineering:** code generation, test writing, documentation, debugging
- **Marketing/content:** brand voice, SEO-aware generation, campaign optimization

**Your Personal Prompt Library**
A personal library organized by technique is one of the most valuable assets you can build:
\`\`\`
/prompts
├── /techniques
│   ├── zero_shot_cot.md
│   ├── few_shot_classification.md
│   ├── self_critique_loop.md
│   └── rag_grounding.md
├── /domains
│   ├── /finance
│   ├── /legal
│   └── /code
└── /tests
    └── [task]_test_cases.json
\`\`\`

Each technique file contains: description, template, example, when to use, known limitations.

**Key Research Papers Worth Knowing**
- Wei et al., "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models" (2022)
- Yao et al., "Tree of Thoughts: Deliberate Problem Solving with LLMs" (2023)
- Shinn et al., "Reflexion: Language Agents with Verbal Reinforcement Learning" (2023)
- Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" (2020)

---

## Take-Home Points

- Deliberate practice: clear metrics + immediate feedback + targeting weaknesses + harder challenges
- The prompt journal is how experience compounds into expertise — document every insight
- T-shaped: deep prompting skill + domain expertise in one field = premium positioning
- Build a structured personal prompt library organized by technique type
- The single most valuable exercise: one real task, CRISP, 20 test cases, 5 iterations, documented

---

## Conclusion

You've completed Prompt Engineering: Zero to Mastery. But completing the course is just the beginning. The techniques here are foundational — the real expertise comes from applying them repeatedly to real problems, building a prompt library that captures your insights, and developing T-shaped depth in both prompting and a domain you care about. The compounding advantage is real: every prompt you write teaches you something the next prompt benefits from. After 100 prompts you'll have intuition. After 1,000 you'll have expertise. Start today — pick one real problem, apply CRISP, build a test set, and iterate. The practitioners who build systematic expertise now will have a durable advantage for years to come.`,
};
