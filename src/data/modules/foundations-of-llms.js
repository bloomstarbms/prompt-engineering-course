// Lesson bodies — module 01, foundations-of-llms
//
// Split out of courseData.js so 109 KB of lesson prose stays out of the
// always-loaded bundle. Loaded on demand via src/data/lessonContent.js.
//
// KEYED BY LESSON SLUG, never by position. Ordering lives in courseData.js,
// which is what the build guard freezes; progress keys stay positional
// (`${m}-${l}`) and are never derived from anything in this file.

export const bodies = {
  "how-llms-actually-work": `AI language models (LLMs) — like ChatGPT or Claude — are **word predictors**. Every response they generate is actually the result of picking one word at a time, over and over, based on what word seems most likely to come next given everything before it. They don't "think" or "understand" in the way humans do — they've learned statistical patterns from billions of pages of human writing.

**How text gets split up (Tokens)**
The AI doesn't read word by word — it reads in small chunks called **tokens** (roughly ¾ of a word each). "ChatGPT" becomes 2 tokens. "Hello" is 1. This matters because AI services charge per token, and there's a limit on how many tokens can fit in one conversation.

**The AI's memory window (Context Window)**
The AI can only see what's in the current conversation — there's no memory between sessions unless you build it in. Everything the AI needs to answer your question must be in the prompt you send. Think of it like talking to someone who forgets everything the moment the call ends.

**Creativity dial (Temperature)**
You can control how predictable or creative the AI's answers are. At temperature = 0, it always picks the most likely next word — same input, same output every time. At temperature = 1 or higher, it picks less predictably, producing more varied or creative responses. Use low temperature (0–0.3) for factual tasks, higher (0.7–1) for creative work.

**How the AI connects words (Attention)**
Inside the AI, every word in your prompt gets compared to every other word to figure out which ones are related. This is why the AI understands that "bank" in "river bank" means water, not money. Instructions placed toward the end of a prompt often get more weight than those at the start.

**From text predictor to helpful assistant (RLHF)**
A base AI model just predicts text. Models like Claude and ChatGPT went through an extra training step called **RLHF (Reinforcement Learning from Human Feedback)**: thousands of human raters chose which AI responses were helpful, safe, and honest. The model learned to prefer those patterns. This is what makes it feel like an assistant rather than a random text generator.

**Words with similar meanings are stored close together**
The AI organizes words and concepts in a kind of invisible map — words that mean similar things end up "near" each other in this map. That's why the AI can handle synonyms and analogies without being explicitly told about them.

**Practical takeaway:** You're communicating with a system that learned from human writing. The best prompts are the ones a knowledgeable human would find clear, complete, and easy to act on.

---

## Detailed Analysis

The core loop is simple: take all the text so far → predict the single most likely next word → add it → repeat. That loop is what generates an entire paragraph.

When the AI processes your prompt, it converts every word chunk into a number (a vector). It then runs an "attention" calculation that scores how related every word chunk is to every other word chunk. This is what lets it track that the word "it" in "Maria told Sofia that she liked her" refers back correctly.

Pre-training on internet-scale text gives the AI its broad knowledge. But the RLHF training step is what made it helpful — it learned that answers humans rate highly tend to be accurate, organized, and directly responsive to the question asked.

The memory limit (context window) is a hard technical boundary. GPT-4 can handle roughly 128,000 word chunks at once; Claude can handle about 200,000. Once you exceed that limit, the AI literally cannot see what came before it. Memory tricks — like summarizing earlier parts of a conversation — must be built on top.

---

## Take-Home Points

- The AI predicts the next word probabilistically — it doesn't "understand" the way humans do
- Temperature controls the creativity/predictability tradeoff — use low values for factual tasks
- The context window is everything the AI can "see" — fill it with what matters
- Word relationships (attention) is what gives the AI its contextual reasoning ability
- RLHF is what turns a text predictor into an assistant that follows instructions well

---

## Conclusion

Understanding how the AI works at a basic level is the foundation for everything that follows. When you know the AI is a word predictor with a fixed memory window that weighs word relationships to understand context, you can immediately see why the structure, position, and specificity of your prompt all matter. You're not talking to an oracle — you're steering a very sophisticated autocomplete system. This mental model will guide every prompting decision you make.`,
  "anatomy-of-a-prompt": `Every prompt — whether you realize it or not — has structural pieces. Understanding these pieces lets you build prompts deliberately, not by guesswork.

**The 6 Building Blocks:**
\`\`\`
[ROLE]           → Who is the AI playing? What expertise?
[CONTEXT]        → What background does it need to know?
[TASK]           → What exactly should it do?
[INPUT DATA]     → The content to work on
[OUTPUT FORMAT]  → How should the response look?
[CONSTRAINTS]    → What to avoid or limit?
\`\`\`

**Weak Prompt:** "Summarize this article."

**Well-Built Prompt:**
\`\`\`
You are a financial analyst writing for institutional investors.
Context: Q3 earnings report for a mid-cap tech company.
Task: Summarize key financial signals — revenue, margins, guidance.
Format: 3 bullet points max, each under 30 words.
Constraints: No filler phrases. Numbers and directional signals only.
Article: [INSERT TEXT]
\`\`\`

The well-built prompt is longer — but it produces dramatically more useful output every single time. **Precision saves editing time later.**

---

## Detailed Analysis

**The Role component** sets who the AI is pretending to be. This shapes the vocabulary, depth, and style of the response. A "senior data engineer" will produce technically richer output than a generic "helpful assistant."

**Context and Background** is where most prompts fall short. Humans communicate with huge amounts of shared context — "you know that project we discussed." The AI has none of that unless you provide it. Be generous with background — the AI cannot assume anything.

**Task vs. Instruction** — "Task" is what you want done; "instruction" is how to do it. "Summarize" (task) vs. "Extract the 3 most important financial metrics and state each as a single sentence" (instruction). More specific instructions = more predictable output.

**Input Data separation** — Always clearly separate your source material from your instructions. Use XML tags, triple quotes, or clear headers. This prevents the AI from confusing data with instructions (it also protects against malicious content in data trying to hijack the AI — more on that in the Security lesson).

**Output Format** is massively underused. If you give the AI a template — even a partial one — it will follow it reliably. The AI mirrors whatever format you give it.

**Constraints** close the gap between "good enough" and "exactly right." They handle edge cases before they happen: "if the answer is unknown, say so explicitly" prevents the AI making things up. "No preamble" stops it from restating your question before answering.

---

## Take-Home Points

- Every prompt has 6 building blocks — use all 6 for complex tasks
- Context is the most commonly missing piece — provide more than you think you need
- Separate your source data from your instructions using clear dividers
- Specify output format explicitly — show an example if possible
- Constraints are your edge-case handlers — write them before problems happen

---

## Conclusion

The anatomy of a prompt is like the grammar of a sentence — it has required parts that work together. Just as a sentence has a subject and verb, a solid prompt has a role, context, task, data, format, and constraints. Mastering this structure transforms prompting from guesswork into a repeatable skill. Everything else in this course builds on this foundation.`,
  "mental-models-for-prompting": `Three mental models that permanently change how you think about prompts:

**Mental Model 1: The Brilliant New Hire**
Imagine a brilliant person on their first day at your company. Smart, eager to help, but knows absolutely nothing about your situation. You must explain everything from scratch. This combats the #1 prompting mistake: **assuming the AI already knows your context.**

**Mental Model 2: The Specification Document**
Engineers write a spec before building anything. Treat every complex prompt like a spec: define inputs, define outputs, list edge cases, write constraints, clarify success criteria. The clearer your spec, the more predictable your result.

**Mental Model 3: The Funnel**
Picture a funnel. An empty prompt = wide open — thousands of valid responses possible. Each word you add narrows it down. Your job is to funnel the AI toward the exact response you need.

**Simple test:** Can you imagine 5 very different valid answers to your prompt? If yes, it's too vague. Keep adding constraints until only 1–2 good responses are possible.

---

## Detailed Analysis

**The Brilliant New Hire model** explains immediately why vague prompts produce vague outputs. If you hired someone brilliant and said "help me with this project" with no further context, you'd get a useless response. Give them background, explain the task clearly, and they'd produce excellent work. The AI is exactly the same.

Use this model to check if you've included:
- Company or project context: "We're a B2B SaaS company targeting HR teams"
- Prior decisions: "We've already tried approach X and it failed because Y"
- Audience info: "This is for non-technical stakeholders"
- What success looks like: "A good response makes the CFO feel confident about the decision"

**The Specification Document model** comes from software engineering. A spec answers: What is the input? What should the output look like? What are the edge cases? What must never appear in the output? What happens if data is missing? Thinking of prompts this way forces you to anticipate failure modes before they happen.

**The Funnel model** explains why being specific is so powerful. Every additional constraint removes possible responses from the pool. Adding "in formal business language" eliminates casual phrasing. Adding "in 3 bullet points" eliminates paragraph-form answers. Each constraint removes unwanted results.

Combine all three: "I'm the brilliant new hire who needs a clear spec for this task, and I'll use the funnel to narrow down to exactly what I want."

---

## Take-Home Points

- The Brilliant New Hire: provide context as if talking to someone who knows nothing about your situation
- The Spec Document: define inputs, outputs, edge cases, and success criteria before writing the prompt
- The Funnel: every constraint narrows the range of possible responses — be specific
- If 5+ different valid responses are possible, your prompt is underspecified
- Mental models are more useful than memorized rules — they apply to every new situation

---

## Conclusion

Mental models are the foundation of real expertise. Rather than memorizing a list of prompting rules, these three models give you a thinking framework for every prompt you'll ever write. Before you type anything, ask: Have I given enough context for the Brilliant New Hire? Have I written a clear Spec? Have I narrowed the Funnel enough? When all three pass, your prompt will reliably produce what you need.`,
};
