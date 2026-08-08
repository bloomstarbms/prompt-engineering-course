// Lesson bodies — module 02, core-techniques
//
// Split out of courseData.js so 109 KB of lesson prose stays out of the
// always-loaded bundle. Loaded on demand via src/data/lessonContent.js.
//
// KEYED BY LESSON SLUG, never by position. Ordering lives in courseData.js,
// which is what the build guard freezes; progress keys stay positional
// (`${m}-${l}`) and are never derived from anything in this file.

export const bodies = {
  "zero-shot-few-shot-many-shot": `**Zero-Shot** — Ask with no examples. Best for simple, clear tasks where the AI already handles them well.

**Few-Shot** — Provide 2–5 examples before your task. Dramatically improves results for tasks that need a specific format, tone, or domain knowledge.
\`\`\`
Tweet: "Just landed my dream job!" → Positive
Tweet: "Traffic is a nightmare today" → Negative
Tweet: "The meeting has been rescheduled" → Neutral

Tweet: "I can't believe they cancelled the show"
Sentiment:
\`\`\`

**Best Practices:**
- Examples should cover a variety of cases, including tricky ones
- Match the exact format you want in the output
- 3–5 examples is the sweet spot; beyond 10, the improvement drops off

**Many-Shot** — 20–100+ examples for specialized tasks. Uses a lot of your memory window budget. Use only when zero/few-shot aren't good enough.

| Task Complexity | Recommended |
|---|---|
| Simple, well-defined | Zero-shot |
| Format-sensitive | Few-shot (3–5) |
| Specialized / complex | Many-shot or fine-tuning |

---

## Detailed Analysis

**Why Zero-Shot Works**
The AI has been trained on such a wide variety of tasks — summarizing, classifying, explaining, translating — that it can handle most common requests without any examples. Zero-shot is always your starting point. It's free and fast.

**Why Few-Shot Examples Help**
When you provide examples, you're showing the AI — in concrete terms — what a good answer looks like. You're not just describing the format; you're demonstrating it. The AI picks up on: what level of detail you want, what format to use, what vocabulary fits the task. This is why **example quality matters as much as quantity.**

Three things good few-shot examples must have:
1. **Consistent format** — every example uses the exact output format you want
2. **Coverage of different cases** — don't give 3 "positive" examples with no "negative" ones
3. **A mix of easy and tricky cases** — include edge cases to teach the AI how to handle them

**When Few-Shot Shines**
Few-shot is especially powerful when you need a very specific output format that's hard to describe in words. Instead of writing a 200-word explanation of the JSON structure you want, just show one example. The AI will follow it.

**Many-Shot Economics**
Using 100 examples costs significantly more per request. The quality improvement from many-shot levels off around 20–30 examples for most tasks. Only use it when:
- The task needs domain-specific knowledge the AI doesn't have from training
- Zero/few-shot haven't worked even after optimizing
- The cost per request is acceptable given the quality requirement

---

## Take-Home Points

- Start with zero-shot — it's faster and cheaper; optimize from there
- Few-shot (3–5 examples) gives the highest quality-per-effort gain for format and tone tasks
- Examples must cover different cases, use consistent format, and include edge cases
- Many-shot plateaus after around 20–30 examples — don't over-invest
- Match your example format exactly to what you want in the output

---

## Conclusion

Zero-shot, few-shot, and many-shot are your three tiers. They represent increasing investment of time and memory budget in exchange for increasing output control. The expert move is knowing when to use each: zero-shot for clear tasks, few-shot for format-sensitive or specialized tasks, and many-shot only after you've exhausted cheaper options. Master this and you've mastered the core of prompting efficiency.`,
  "chain-of-thought-prompting": `**The Core Insight**
The AI reasons better when it thinks out loud. Asking it to show its steps produces more accurate answers — one of the most impactful discoveries in prompt engineering.

**Zero-Shot CoT:** Simply add "Let's think step by step." at the end of your prompt.

**Few-Shot CoT (with an example):**
\`\`\`
Q: Roger has 5 tennis balls. He buys 2 cans of 3 balls each. Total?
A: Roger started with 5. 2 cans × 3 = 6 new balls. 5 + 6 = 11.

Q: [Your question]
A:
\`\`\`

**When Step-by-Step Thinking Helps:**
Multi-step math, complex logic, tasks where one small mistake can break the whole answer.

**When It Hurts:**
Simple fact lookups (the extra steps add noise), short direct questions, situations where response time matters.

**Self-Consistency (Advanced):**
Ask the same question 5–10 times with some creativity in the response (temperature > 0), then take the most common answer. This can dramatically improve accuracy at the cost of more compute.

---

## Detailed Analysis

**Why Thinking Out Loud Helps**
When the AI generates a long response, it can only do a limited amount of calculation per word it produces. For complex problems, that's not enough to get to the right answer in one jump. By writing out intermediate steps, the AI effectively gives itself more "working space." Each step it writes helps it get the next step right.

Think of it like a student doing math: jumping straight to the answer invites errors. Showing the work — "first I'll identify what's known, then calculate the subtotal, then combine..." — keeps each step accurate.

**Different Ways to Ask for Steps:**
- "Think through this step by step before answering"
- "Explain your reasoning, then give your final answer"
- "First identify the relevant facts, then analyze, then conclude"
- "What would need to be true for [conclusion] to be correct?"

**The Self-Consistency Technique**
Run the same question multiple times. Because there's some randomness in the AI's responses, each run produces slightly different reasoning — but they should all converge on the same correct answer if the answer is right. Take the majority result. This technique has shown accuracy improvements of 15–30% over single-run step-by-step thinking on math and reasoning tasks.

**When Not to Use It**
Step-by-step thinking makes responses 2–5x longer. For a customer-facing chatbot where speed matters, this could be a problem. For a research or analysis task running in the background, it's worth every extra word.

---

## Take-Home Points

- "Let's think step by step" is one of the single most impactful phrases in prompting
- Step-by-step thinking works because it gives the AI more working space per complex problem
- Use example-driven step-by-step when the zero-shot version isn't accurate enough
- Self-Consistency (majority vote across multiple runs) adds another 15–30% accuracy improvement
- Step-by-step is expensive in length and time — reserve it for tasks that justify it

---

## Conclusion

Chain-of-Thought (step-by-step) prompting is perhaps the single most important technique in prompt engineering. Understanding why it works — the AI needs working space for complex problems — helps you apply it intelligently. Use it when problems have multiple steps, when small errors compound, or when you need the AI to show its reasoning for accountability. Combine with Self-Consistency for maximum accuracy on high-stakes tasks.`,
  "role-and-persona-prompting": `Telling the AI who it is shapes the vocabulary, depth, and style of everything it produces.

**How to Design an Effective Role:**
1. Be specific about expertise level — "senior engineer" produces deeper output than "junior analyst"
2. Include the specific field — "DeFi protocol auditor" works better than "blockchain developer"
3. Add behavioral traits — "known for blunt, direct feedback with no sugarcoating"
4. Specify the audience — "explaining to a non-technical CFO"

**What Not to Do:**
❌ "You are a helpful assistant" — This is the default. It adds nothing.
✅ "You are a macroeconomist specializing in emerging markets, writing for a hedge fund audience that is skeptical of consensus views."

**The Persona Stack (Advanced):**
\`\`\`
Role: You are Paul Graham writing an essay.
Style: Direct, contrarian, simple words for complex ideas.
Constraint: No corporate jargon. No "leverage" or "synergy."
\`\`\`

---

## Detailed Analysis

**Why Role Prompting Works**
The AI has been trained on text written by all kinds of people — PhD papers, Reddit posts by beginners, code reviews by senior engineers. When you specify a role, you're steering the AI toward the writing patterns associated with that role — the vocabulary, the depth of reasoning, the communication style, the level of assumed knowledge.

"Senior backend engineer reviewing code for security issues" will produce output that sounds like a security audit report, referencing real vulnerability categories and precise fixes. "A beginner asking for help" will produce output that sounds like a friendly tutorial. Same AI — very different outputs.

**The Four Things to Specify:**

1. **Expertise level** ("senior", "world-renowned", "15 years of experience")
   The AI learned from expert-written text. These phrases activate more sophisticated writing patterns.

2. **Specific field** ("quantitative portfolio manager", "HIPAA compliance attorney")
   "Lawyer" gives generic legal thinking. "M&A attorney who has worked on Fortune 500 deals" gives you something much more targeted.

3. **Communication style** ("known for being direct and avoiding hedging", "writes in Hemingway's short, declarative style")
   Style constraints work extremely well. The AI has absorbed many distinctive writing styles and can reproduce them.

4. **Who the audience is** ("writing for a non-technical CFO", "explaining to a first-year student")
   This changes vocabulary, assumed knowledge, and emphasis — same information, very different presentation.

**Multiple Roles in a System (Advanced)**
If you're building a pipeline, you can assign different roles to different steps:
- Researcher: gathers information
- Critic: challenges the research
- Synthesizer: produces a balanced output
This keeps each role honest by counterbalancing the others.

---

## Take-Home Points

- "You are a helpful assistant" is the default — it adds no value; always be more specific
- The four dimensions: expertise level, specific field, communication style, audience
- Narrow, specific roles produce better outputs than broad generic ones
- The Persona Stack (role + style + constraint) is the most complete role specification
- For high-stakes tasks, test 3 different role framings and compare outputs

---

## Conclusion

Role prompting is one of the easiest techniques with the highest impact. Every non-trivial prompt should have a role specification. But "helpful assistant" is the null option — it changes nothing. Think about who the ideal author of your output would be: their expertise, their field, their communication style, and who they're writing for. Specify all four dimensions and your output quality will consistently improve.`,
  "instruction-clarity-and-constraints": `**The CRISP Framework:**
- **C**lear — One unambiguous interpretation
- **R**elevant — Every word earns its place
- **I**nclusive — Covers edge cases explicitly
- **S**pecific — Numbers, not vague adjectives ("under 100 words" not "brief")
- **P**rioritized — Tell the AI what matters most when instructions conflict

**Use Positive Instructions, Not Negative Ones:**
❌ "Don't use bullets. Don't write over 200 words. Don't be technical."
✅ "Write in flowing prose, under 200 words, for a general audience with no technical background."

**Output Anchoring:**
❌ "Give me a structured response"
✅ "Format exactly: [HEADLINE]: ... [KEY POINT]: ... [EVIDENCE]: ..."

**The Completion Trick:**
\`\`\`
[Your full prompt]

Analysis: The primary issue is
\`\`\`
The AI is trained to complete started sequences — starting a sentence steers it in your direction.

---

## Detailed Analysis

**Why Positive Instructions Work Better**
Processing "don't use bullets" requires the AI to first activate the concept of bullets, then suppress it. It's like being told "don't think of a pink elephant" — you just did. Positive instructions work with the AI's process instead of against it. Instead of "don't be verbose," say "under 150 words." Instead of "don't use jargon," say "use language appropriate for a general audience."

**How to Make Constraints Specific**
Vague constraints are almost useless:
- ❌ "Keep it brief" → could mean 1 sentence or 5 paragraphs
- ✅ "Under 80 words" → unambiguous
- ❌ "Be professional" → means different things in different industries
- ✅ "Write in the tone of a McKinsey consultant: formal, direct, no filler words"
- ❌ "Cover the important points" → which points?
- ✅ "Cover exactly these 3 topics: [X], [Y], [Z]. Nothing else."

**The Priority Problem**
When instructions conflict ("be comprehensive" AND "be under 100 words"), the AI will make an arbitrary choice about which one to break. The **Prioritized** component of CRISP solves this: "Accuracy is paramount. If you cannot be accurate in under 100 words, use more words."

**Output Anchoring in Practice**
Beyond the Completion Trick, anchoring can mean providing a partial structure:
\`\`\`
Respond using EXACTLY this format:
{
  "recommendation": "",
  "confidence": "",
  "caveats": []
}
\`\`\`
The AI will fill in the blanks. This is more reliable than asking for JSON in plain language.

**Put the Most Important Instructions Last**
Instructions near the end of a prompt carry more weight than those at the start. Put your most critical requirements — especially format and length — at the very end, just before where the AI begins its response.

---

## Take-Home Points

- CRISP: Clear, Relevant, Inclusive, Specific, Prioritized
- Positive instructions outperform negative ones — tell the AI what to do, not what to avoid
- Use numbers, not adjectives: "under 100 words" beats "be brief"
- Always tell the AI which constraint takes priority when they conflict
- Put critical constraints last — they carry more weight there
- The Completion Trick is one of the most reliable format enforcement techniques

---

## Conclusion

Instruction clarity is the bridge between intent and output. Even the most sophisticated prompting technique fails if the instructions are ambiguous. CRISP gives you a checklist: Is there only one interpretation? Does every word earn its place? Are edge cases covered? Are measurements specific, not vague? Is there a priority ranking for conflicts? Apply CRISP to every prompt and you'll eliminate the most common class of prompting failures.`,
};
