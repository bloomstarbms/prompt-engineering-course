// src/data/courseData.js
//
// COURSE METADATA ONLY. Lesson prose lives in src/data/modules/<moduleSlug>.js
// and is loaded on demand through src/data/lessonContent.js — 109 KB of body
// text that no longer sits in the always-loaded bundle.
//
// THIS FILE OWNS ORDERING. progress.completed and progress.quiz_scores are keyed
// by position (`${m}-${l}`) derived from the order of MODULES and of each
// lessons array. scripts/check-course-integrity.mjs freezes those positions and
// fails the build if any of them move. Slugs are an additional field, never a
// replacement for the indices.

export const MOD_COLORS = [
  "#818cf8", // M01 — indigo (accent)
  "#60a5fa", // M02 — blue
  "#c084fc", // M03 — purple
  "#34d399", // M04 — emerald
  "#f87171", // M05 — rose
  "#fbbf24", // M06 — amber
  "#22d3ee", // M07 — cyan
  "#f472b6", // M08 — pink (Advanced Frontiers)
];

export const MODULES = [
  {
    id: 0,
    tag: "01",
    slug: "foundations-of-llms",
    color: MOD_COLORS[0],
    title: "Foundations of LLMs",
    icon: "◈",
    summary: "Understand what you're working with before writing a single prompt.",
    lessons: [
      {
        title: "How LLMs Actually Work",
        slug: "how-llms-actually-work",
        isPublic: true,
        dur: "22 min",
        vid: "wjZofJX0v4M",
        intro: "Before you write a single prompt, it helps to know what's actually happening inside the AI. In this lesson, you'll get a plain-English understanding of how language models work — no technical background needed. This foundation will make every technique in the course click faster.",
      },
      {
        title: "The Anatomy of a Prompt",
        slug: "anatomy-of-a-prompt",
        isPublic: true,
        dur: "15 min",
        vid: "dOxUroR57xs",
        intro: "Most people write prompts the same way they'd type a Google search — and get back shallow, hit-or-miss results. In this lesson, you'll learn the six building blocks of a well-structured prompt and see exactly what separates weak prompts from ones that reliably get great output.",
      },
      {
        title: "Mental Models for Prompting",
        slug: "mental-models-for-prompting",
        isPublic: true,
        dur: "20 min",
        vid: "p09yRj47kNM",
        intro: "The way you think about the AI shapes the prompts you write. In this lesson, you'll pick up three mental models — simple but powerful analogies — that will permanently change how you approach every prompting task. You'll finish with a clear mental picture of what you're really doing when you write a prompt.",
      },
    ],
  },
  {
    id: 1,
    tag: "02",
    slug: "core-techniques",
    color: MOD_COLORS[1],
    title: "Core Techniques",
    icon: "⬡",
    summary: "The fundamental toolkit every prompt engineer must master.",
    lessons: [
      {
        title: "Zero-Shot, Few-Shot & Many-Shot",
        slug: "zero-shot-few-shot-many-shot",
        dur: "18 min",
        vid: "aOm75o2Z5-o",
        intro: "One of the fastest ways to improve AI output is to show it what you want instead of just describing it. In this lesson, you'll learn the difference between asking with no examples (zero-shot), with a few examples (few-shot), and with many examples — and when each approach gives you the best results.",
      },
      {
        title: "Chain-of-Thought Prompting",
        slug: "chain-of-thought-prompting",
        dur: "20 min",
        vid: "H4YK_7MAckk",
        intro: "When you ask the AI to show its work, something surprising happens — the answers get dramatically better. In this lesson, you'll learn Chain-of-Thought prompting: a simple technique of asking the AI to reason step by step before answering, which reduces errors and makes complex tasks manageable.",
      },
      {
        title: "Role & Persona Prompting",
        slug: "role-and-persona-prompting",
        dur: "22 min",
        vid: "eMlx5fFNoYc",
        intro: "Telling the AI who it is changes everything it produces. In this lesson, you'll learn how to assign a role or persona to the AI — shaping its vocabulary, depth, and tone — and use that technique to get expert-level responses tailored to any audience.",
      },
      {
        title: "Instruction Clarity & Constraints",
        slug: "instruction-clarity-and-constraints",
        dur: "22 min",
        vid: "hkhDdcM5V94",
        intro: "Vague instructions produce vague results. In this lesson, you'll learn how to write crystal-clear prompts using the CRISP framework, how to add constraints that keep the AI on track, and how specific word choices can dramatically tighten the quality of every response.",
      },
    ],
  },
  {
    id: 2,
    tag: "03",
    slug: "advanced-systems",
    color: MOD_COLORS[2],
    title: "Advanced Systems",
    icon: "⬟",
    summary: "Multi-step reasoning, chaining, and architectures powering real AI products.",
    lessons: [
      {
        title: "Prompt Chaining & Pipelines",
        slug: "prompt-chaining-and-pipelines",
        dur: "20 min",
        vid: "T9aRN5JkmL8",
        intro: "Some tasks are too complex for a single prompt to handle well. In this lesson, you'll learn how to break big tasks into focused steps — where each step's output feeds the next — so you can build reliable, multi-stage AI workflows for complex real-world work.",
      },
      {
        title: "Tree of Thoughts (ToT)",
        slug: "tree-of-thoughts",
        dur: "20 min",
        vid: "lG7Uxts9SXs",
        intro: "Step-by-step thinking is powerful, but what if the first path the AI takes turns out to be wrong? In this lesson, you'll learn Tree of Thoughts — a technique where the AI explores multiple lines of reasoning simultaneously, evaluates them, and picks the best — giving you much smarter answers on complex problems.",
      },
      {
        title: "Self-Reflection & Critique Loops",
        slug: "self-reflection-and-critique-loops",
        dur: "18 min",
        vid: "DjuXACWYkkU",
        intro: "Even a well-designed prompt can produce output with errors or blind spots. In this lesson, you'll learn how to set up self-reflection loops — prompting the AI to review and critique its own work against a checklist — so every output goes through a quality check before it reaches you.",
      },
      {
        title: "RAG Prompt Engineering",
        slug: "rag-prompt-engineering",
        dur: "22 min",
        vid: "MlK6SIjcjE8",
        intro: "AI models have a knowledge cutoff — they can't access your documents or real-time information on their own. In this lesson, you'll learn Retrieval-Augmented Generation (RAG): the technique of feeding the AI the right context from your own sources, so it answers accurately from your data instead of guessing.",
      },
    ],
  },
  {
    id: 3,
    tag: "04",
    slug: "output-engineering",
    color: MOD_COLORS[3],
    title: "Output Engineering",
    icon: "◎",
    summary: "Control format, structure, and consistency of AI outputs for production use.",
    lessons: [
      {
        title: "Structured Output Design",
        slug: "structured-output-design",
        dur: "12 min",
        vid: "T-D1OfcDW1M",
        intro: "Getting the right answer is one thing — getting it in the right format is another. In this lesson, you'll learn how to precisely control the structure of AI output: JSON, tables, lists, or any custom format your workflow needs — so responses slot directly into your tools and processes.",
      },
      {
        title: "Length, Tone & Style Control",
        slug: "length-tone-and-style-control",
        dur: "18 min",
        vid: "2IK3DFHRFfw",
        intro: "Two prompts can produce the same facts but feel completely different — one is clear and punchy, the other padded and off-brand. In this lesson, you'll learn to control response length, tone, and writing style with precision, and build a personal prompt library for reusing what works.",
      },
    ],
  },
  {
    id: 4,
    tag: "05",
    slug: "optimization-and-evaluation",
    color: MOD_COLORS[4],
    title: "Optimization & Evaluation",
    icon: "◉",
    summary: "Test, measure, and improve prompts systematically — like an engineer.",
    lessons: [
      {
        title: "Building an Eval Framework",
        slug: "building-an-eval-framework",
        dur: "20 min",
        vid: "_ZvnD73m40o",
        intro: "How do you know if your prompt is actually good — or just good enough? In this lesson, you'll build a simple evaluation framework: a set of criteria and test cases you can run your prompts against to measure quality, catch failures, and know exactly when a prompt is ready to use.",
      },
      {
        title: "A/B Testing & Iteration",
        slug: "ab-testing-and-iteration",
        dur: "25 min",
        vid: "bZQun8Y4L2A",
        intro: "A great prompt rarely appears on the first try. In this lesson, you'll learn a systematic approach to prompt improvement — running controlled A/B comparisons, identifying what's failing, and iterating with a clear methodology — so you can reliably make prompts better over time.",
      },
      {
        title: "Prompt Security & Robustness",
        slug: "prompt-security-and-robustness",
        dur: "18 min",
        vid: "osKyvYJ3PRM",
        intro: "Real-world prompts face unexpected inputs, edge cases, and sometimes deliberate attempts to hijack them. In this lesson, you'll learn how to make your prompts robust: handling bad inputs gracefully, defending against prompt injection, and designing for reliability at scale.",
      },
    ],
  },
  {
    id: 5,
    tag: "06",
    slug: "domain-applications",
    color: MOD_COLORS[5],
    title: "Domain Applications",
    icon: "⬢",
    summary: "Specialized patterns for code, research, data analysis, and AI agents.",
    lessons: [
      {
        title: "Code Generation & Debugging",
        slug: "code-generation-and-debugging",
        dur: "15 min",
        vid: "zizonToFXDs",
        intro: "Code generation is one of the highest-value uses of AI — but only when you know how to ask for it correctly. In this lesson, you'll learn prompting patterns built specifically for coding tasks: writing, reviewing, debugging, and explaining code so you get accurate, runnable output every time.",
      },
      {
        title: "Data Analysis & Research",
        slug: "data-analysis-and-research",
        dur: "20 min",
        vid: "kCc8FmEb1nY",
        intro: "AI can compress hours of research and data analysis into minutes — if you know how to direct it. In this lesson, you'll learn how to prompt for data interpretation, literature synthesis, and structured research reports, keeping accuracy high when working with factual or numerical content.",
      },
      {
        title: "Agentic Prompting & Tool Use",
        slug: "agentic-prompting-and-tool-use",
        dur: "15 min",
        vid: "y1WnHpedi2A",
        intro: "The frontier of prompt engineering is agentic AI — models that don't just answer questions but take sequences of actions: browsing, writing files, calling tools. In this lesson, you'll learn how to structure prompts for AI agents, manage multi-step tool use, and keep autonomous workflows under control.",
      },
    ],
  },
  {
    id: 6,
    tag: "07",
    slug: "production-and-mastery",
    color: MOD_COLORS[6],
    title: "Production & Mastery",
    icon: "⬠",
    summary: "Manage prompts at scale, work across models, and build career-grade expertise.",
    lessons: [
      {
        title: "Prompt Management at Scale",
        slug: "prompt-management-at-scale",
        dur: "12 min",
        vid: "F8NKVhkZZWI",
        intro: "When you're using AI seriously, you'll quickly accumulate dozens of prompts. In this lesson, you'll learn how to organize, version, and manage prompts at scale — building a personal or team library that makes your best prompts reusable, findable, and improvable over time.",
      },
      {
        title: "Model Selection & Cross-Model",
        slug: "model-selection-and-cross-model-prompting",
        dur: "20 min",
        vid: "sal78ACtGTc",
        intro: "Not all AI models are the same — they have different strengths, costs, and behaviors. In this lesson, you'll learn how to choose the right model for each task, how the same prompt behaves differently across models, and how to write model-agnostic prompts that work reliably wherever you deploy them.",
      },
      {
        title: "Building Your PE Practice",
        slug: "building-your-prompt-engineering-practice",
        dur: "22 min",
        vid: "KrRD7r7y7NY",
        intro: "You've now covered the full map of prompt engineering. In this final lesson, you'll bring it all together — building a personal practice: a regular workflow for improving your prompts, staying current with new techniques, and applying what you've learned to the specific domain where you need it most.",
      },
    ],
  },
  // ── MODULE 08 — Advanced Frontiers ─────────────────────────────────────
  {
    id: 7,
    tag: "08",
    slug: "advanced-frontiers",
    color: MOD_COLORS[7],
    title: "Advanced Frontiers",
    icon: "✦",
    summary: "Multimodal vision prompting, hallucination control, conversational AI design, and meta-prompting.",
    lessons: [
      {
        title: "Multimodal & Vision Prompting",
        slug: "multimodal-and-vision-prompting",
        dur: "22 min",
        vid: "qMk8jk4NZDA",
        intro: "Most AI users still treat AI as text-only — but today's frontier models like Claude 3, GPT-4o, and Gemini 1.5 can see, analyze, and reason about images, PDFs, charts, and screenshots with remarkable precision. This lesson teaches you exactly how to write effective prompts when visual inputs are involved.",
      },
      {
        title: "Hallucination Detection & Mitigation",
        slug: "hallucination-detection-and-mitigation",
        dur: "25 min",
        vid: "1zd8QWxg7CM",
        intro: "Hallucination — AI confidently stating false information — is the single biggest barrier to using AI in production. It's not a bug being fixed; it's a fundamental property of how language models work. In this lesson you'll understand exactly why it happens and build a toolkit of proven techniques to reduce it to near-zero for your use cases.",
      },
      {
        title: "Conversational Design & Memory Management",
        slug: "conversational-design-and-memory-management",
        dur: "20 min",
        vid: "W2HVdB4Jbjs",
        intro: "Designing a multi-turn AI interaction is fundamentally different from writing a single prompt. A single prompt is a specification. A conversation is an architecture — with state, persona, memory, and failure modes that span multiple turns. This lesson gives you the framework to build well-designed, coherent AI conversation experiences.",
      },
      {
        title: "Meta-Prompting: AI-Assisted Prompt Design",
        slug: "meta-prompting",
        dur: "18 min",
        vid: "0JZisMktcbA",
        intro: "Meta-prompting is using AI to help you write better prompts — and it's one of the most powerful, most underused skills in the field. In this lesson, you'll build a complete workflow for using AI as your prompting co-pilot: to generate, critique, stress-test, and compress your prompts. This is how professional prompt engineers maintain quality at scale.",
      },
    ],
  },
];

export const QUIZZES = {
  "0-0": {
    questions: [
      { q: "What does an AI language model fundamentally do at each step when generating text?", opts: ["Searches a knowledge database", "Predicts the most likely next word or chunk", "Executes a pre-written logic chain", "Retrieves a pre-written answer"], a: 1 },
      { q: "Which creativity level setting makes AI output fully predictable (same input = same output every time)?", opts: ["1.0", "0.5", "0", "2.0"], a: 2 },
      { q: "Why does where you place instructions in a prompt matter?", opts: ["The AI only reads the first part", "The AI gives more weight to words near the end", "Earlier parts get deleted", "The AI reads in reverse order"], a: 1 },
      { q: "What did human feedback training (RLHF) teach AI models to do?", opts: ["Process more words at once", "Reduce costs", "Produce helpful, safe behavior", "Generate images"], a: 2 },
    ],
  },
  "0-1": {
    questions: [
      { q: "Which structural component tells the AI WHO it is and what expertise it has?", opts: ["Input Data", "Output Format", "System / Role", "Constraints"], a: 2 },
      { q: "What makes a well-structured prompt better than 'Summarize this article'?", opts: ["It's longer", "It specifies role, format, and constraints", "It uses technical vocabulary", "It includes 'please'"], a: 1 },
      { q: "What does the Output Format component specify?", opts: ["How creative the AI should be", "How the response should be structured", "How many word chunks to use", "The source language"], a: 1 },
    ],
  },
  "0-2": {
    questions: [
      { q: "The Brilliant New Hire model combats which primary prompting mistake?", opts: ["Prompts being too long", "Assuming the AI already knows your context", "Providing too many examples", "Asking for too much creativity"], a: 1 },
      { q: "In the Funnel model, what does each constraint or added detail do?", opts: ["Increases cost exponentially", "Narrows the range of possible outputs", "Forces step-by-step thinking", "Widens creative range"], a: 1 },
      { q: "When should you stop adding constraints to a prompt?", opts: ["After 5 constraints", "When only 1–2 plausible good responses remain", "When it exceeds 200 words", "When creativity is set to 0"], a: 1 },
    ],
  },
  "1-0": {
    questions: [
      { q: "When is Zero-Shot prompting most appropriate?", opts: ["Complex multi-step reasoning", "Simple, well-defined tasks", "Format-sensitive tasks", "Domain-specific classification"], a: 1 },
      { q: "How many few-shot examples hit the sweet spot for most tasks?", opts: ["1–2", "3–5", "10–15", "20+"], a: 1 },
      { q: "What is the main tradeoff of Many-Shot prompting?", opts: ["Lower accuracy", "Uses a large portion of the AI's memory window", "Disables step-by-step thinking", "The AI ignores instructions"], a: 1 },
      { q: "Good few-shot examples should be:", opts: ["All from the same category", "Diverse, covering different cases including tricky ones", "As short as possible", "Placed after the input data"], a: 1 },
    ],
  },
  "1-1": {
    questions: [
      { q: "What is the simplest way to trigger step-by-step (CoT) thinking?", opts: ["'Think carefully.'", "'Let's think step by step.'", "Set creativity level to 0", "Provide 10 examples"], a: 1 },
      { q: "When does step-by-step (CoT) thinking HURT performance?", opts: ["Multi-step math problems", "Simple fact lookups", "Complex reasoning tasks", "When combined with examples"], a: 1 },
      { q: "What is Self-Consistency CoT?", opts: ["Running the same prompt on two different AI models", "Generating multiple responses and taking the most common answer", "The AI checks its reasoning just once", "Using step-by-step thinking in both turns of a conversation"], a: 1 },
    ],
  },
  "1-2": {
    questions: [
      { q: "Why does assigning a specific role improve AI outputs?", opts: ["It increases the AI's memory window", "It activates writing patterns from that role's training data", "It bypasses safety filters", "It forces formal language"], a: 1 },
      { q: "Which role specification is most effective?", opts: ["'You are a helpful assistant'", "'You are an AI'", "'You are a DeFi auditor with 8 years in smart contract security'", "'You are an expert'"], a: 2 },
      { q: "The Persona Stack combines:", opts: ["Creativity level + word diversity + repetition penalty", "Role + Style + Constraint", "System + Few-shot examples + Step-by-step", "Input + Output + Evaluation"], a: 1 },
    ],
  },
  "1-3": {
    questions: [
      { q: "What does the 'S' in CRISP stand for?", opts: ["Simple", "Specific", "Structured", "Short"], a: 1 },
      { q: "Why are positive instructions better than negative ones?", opts: ["They use fewer words", "Negative instructions make the AI generate the unwanted thing first, then suppress it", "The AI ignores 'don't'", "Positive instructions are easier to parse"], a: 1 },
      { q: "What is Output Anchoring?", opts: ["Setting a maximum word count", "Providing a format template or example instead of just describing the format", "Repeating the same prompt", "Setting creativity to 0"], a: 1 },
      { q: "The Completion Trick works because:", opts: ["It adds extra words for context", "AI is trained to complete started sequences — starting a sentence steers the response", "It resets how the AI weighs words", "It forces JSON output"], a: 1 },
    ],
  },
  "2-0": {
    questions: [
      { q: "What is the main advantage of prompt chaining over a single long prompt?", opts: ["Reduces API cost", "Prevents errors from compounding by isolating each sub-task", "Enables automatic parallel processing", "Removes the need for system prompts"], a: 1 },
      { q: "What is the preferred format for passing data between chain stages?", opts: ["Plain prose", "Bullet points", "Structured JSON", "Numbered lists"], a: 2 },
      { q: "What is a Router Prompt?", opts: ["A prompt that summarizes the conversation", "A classification step that determines which chain to use for a given input", "A prompt that validates JSON output", "The system prompt shared by all agents"], a: 1 },
    ],
  },
  "2-1": {
    questions: [
      { q: "How does Tree of Thoughts differ from step-by-step (CoT) thinking?", opts: ["Step-by-step uses more words", "Tree of Thoughts explores multiple different approaches and evaluates them; step-by-step is a single path", "Step-by-step needs examples; Tree of Thoughts doesn't", "Tree of Thoughts only works for math"], a: 1 },
      { q: "Correct order of Tree of Thoughts steps?", opts: ["Evaluate→Generate→Expand", "Generate options→Evaluate→Expand best option", "Expand→Generate→Evaluate", "Evaluate→Expand→Generate"], a: 1 },
      { q: "What is the main cost tradeoff of Tree of Thoughts?", opts: ["Lower accuracy than step-by-step", "3–5x more words generated than step-by-step", "Cannot be used with examples", "Requires fine-tuning"], a: 1 },
    ],
  },
  "2-2": {
    questions: [
      { q: "What does the Reflexion (critique loop) pattern do?", opts: ["Runs the same prompt 3 times and picks the best", "Makes the AI critique its own output, then revise it", "Uses a second AI model to evaluate the output", "Adds step-by-step thinking to every step"], a: 1 },
      { q: "Constitutional AI (Anthropic's approach) works by:", opts: ["Fine-tuning on human ratings alone", "Defining principles and having the AI check each output against them, then revising", "Role prompting with an ethics expert persona", "Removing all constraints from the model"], a: 1 },
      { q: "Multi-Agent Debate is most effective for:", opts: ["Code generation", "Simple classification tasks", "Research or analysis requiring a balanced, fair output", "JSON data extraction"], a: 2 },
    ],
  },
  "2-3": {
    questions: [
      { q: "What core problem does RAG (Retrieval-Augmented Generation) solve?", opts: ["AI responses being too slow", "AI having outdated knowledge and no access to private documents", "AI refusing to follow instructions", "AI producing badly formatted output"], a: 1 },
      { q: "Which instruction prevents the AI from ignoring provided documents and making things up?", opts: ["'Always provide a confident answer'", "'Answer using ONLY information from the provided context'", "'Search the web if unsure'", "'Use your built-in knowledge to fill gaps'"], a: 1 },
      { q: "What is the recommended starting chunk size for RAG documents?", opts: ["50–100 words", "200–500 words", "1,000–2,000 words", "Entire documents"], a: 1 },
    ],
  },
  "3-0": {
    questions: [
      { q: "Why are number-based length instructions better than word-based ones?", opts: ["Numbers use fewer words in the prompt", "Words like 'brief' are interpreted inconsistently — numbers are unambiguous", "Numbers activate special processing in the AI", "The AI cannot understand adjectives"], a: 1 },
      { q: "What is Completion Anchoring for JSON output?", opts: ["Specifying the full schema at the start of the prompt", "Ending your prompt with '{' so the AI completes the started structure", "Adding 'output JSON only' to the system prompt", "Setting a maximum word count"], a: 1 },
      { q: "When the API's JSON mode is available, you should:", opts: ["Avoid it as it limits creativity", "Always use it — it's more reliable than prompt-only approaches", "Only use it for outputs over 500 words", "Only use it for classification tasks"], a: 1 },
    ],
  },
  "3-1": {
    questions: [
      { q: "Which length instruction is most reliably followed by an AI?", opts: ["'Write a short summary'", "'Be concise'", "'Write a summary in exactly 3 sentences'", "'Keep it brief'"], a: 2 },
      { q: "How does Style Cloning work?", opts: ["Specify the author's name and ask to copy them", "Provide writing examples, ask the AI to analyze the style, then write in that style", "Set creativity level to 1.5", "Use an author's name in the role specification"], a: 1 },
      { q: "To remove hedging language, the most effective instruction is:", opts: ["'Be confident'", "\"Don't hedge\"", "List the specific banned phrases like 'it's worth noting', 'it depends'", "'Use an assertive tone'"], a: 2 },
    ],
  },
  "4-0": {
    questions: [
      { q: "What is 'Vibe Testing'?", opts: ["Testing prompts using emotional language", "Judging prompt quality by feel rather than systematic measurement", "A/B testing with user surveys", "Testing the same prompt across multiple AI models"], a: 1 },
      { q: "In a test set, what percentage should be edge cases and adversarial cases combined?", opts: ["5%", "10%", "40% (25% edge + 15% adversarial)", "50%"], a: 2 },
      { q: "What is AI-as-Judge?", opts: ["The AI permanently replacing human quality reviewers", "Using a second AI to score outputs against defined criteria", "A fine-tuned safety classifier", "A benchmark for comparing different AI models"], a: 1 },
    ],
  },
  "4-1": {
    questions: [
      { q: "What is an Ablation Study in prompt engineering?", opts: ["Adding components to a prompt one at a time", "Removing one component at a time from the best prompt to measure each one's contribution", "Testing the same prompt across different AI models", "Running the same prompt at different creativity levels"], a: 1 },
      { q: "How should production prompts be managed?", opts: ["As static configurations that never change", "Like code — version controlled, tested, with regression tracking", "As trade secrets stored in team memory", "As temporary per-session configurations"], a: 1 },
      { q: "The '10x Harder Test' refers to:", opts: ["Running 10 times more test cases", "Finding the 10% of failures and building new tests from those failure cases", "Making prompts 10 times longer", "Increasing example difficulty by 10x"], a: 1 },
    ],
  },
  "4-2": {
    questions: [
      { q: "What is a Prompt Injection attack?", opts: ["Overloading the AI with too much text", "Malicious instructions hidden in user input that try to override the system instructions", "Injecting few-shot examples mid-conversation", "Using creativity level = 0"], a: 1 },
      { q: "Which defense best structurally separates instructions from user data?", opts: ["Output monitoring after the fact", "A quick input validation check", "Clear labeled delimiters like XML tags separating instructions from data", "Rate limiting user requests"], a: 2 },
      { q: "The Principle of Least Capability means:", opts: ["Using the smallest and cheapest AI model possible", "Only giving the AI access to what it actually needs to complete the task", "Limiting output to the minimum number of words", "Restricting the AI to zero-shot prompting only"], a: 1 },
    ],
  },
  "5-0": {
    questions: [
      { q: "What belongs in the 'Tech Stack' section of a code generation prompt?", opts: ["API keys and database schema", "Programming language, framework, style guide, and an existing code example", "Test results and deployment logs", "Environment variables"], a: 1 },
      { q: "'Explain Before Code' works because:", opts: ["It automatically triggers step-by-step thinking", "It prevents bad architectural decisions by requiring pseudocode and edge cases before implementation", "It reduces the word count by 50%", "It bypasses the need for few-shot examples"], a: 1 },
      { q: "A thorough code review prompt should evaluate:", opts: ["Syntax errors only", "Security vulnerabilities, performance issues, error handling gaps, and test coverage", "Style and naming conventions only", "Whether the code matches the original requirements"], a: 1 },
    ],
  },
  "5-1": {
    questions: [
      { q: "In the Structured Analysis Framework, what step comes after identifying patterns?", opts: ["Making recommendations", "Describing the data at face value", "Generating multiple hypotheses to explain the patterns", "Identifying data gaps"], a: 2 },
      { q: "The Devil's Advocate Pattern asks the AI to:", opts: ["Find all errors in the data", "Argue for the opposite conclusion and identify what the primary analysis might be wrong about", "Take the most controversial possible position", "Repeat the analysis with different parameters"], a: 1 },
      { q: "Why specify the strength of evidence in a research synthesis?", opts: ["To make the output longer", "To distinguish how reliable and trustworthy different claims are", "To enable automatic citations", "To activate the AI's research mode"], a: 1 },
    ],
  },
  "5-2": {
    questions: [
      { q: "In the ReAct pattern, what do the components stand for?", opts: ["Read, Act, Complete", "Reason + Act, with Observation of results in a loop", "Retrieve, Analyze, Communicate", "Reflect, Assert, Conclude"], a: 1 },
      { q: "What must an AI agent do before starting to execute a complex task?", opts: ["Set creativity level to 0", "Confirm the API connection", "Understand the goal, plan the steps, and identify risks or missing information", "Generate 3 alternative approaches"], a: 2 },
      { q: "When should the Human-in-the-Loop confirmation gate trigger?", opts: ["Before every single action the agent takes", "Only when an error occurs", "Before any action that modifies data, sends a communication, or incurs costs above a threshold", "Only before the final action"], a: 2 },
    ],
  },
  "6-0": {
    questions: [
      { q: "What does a Major version change (v1→v2) indicate in prompt versioning?", opts: ["Minor wording improvements", "A breaking change in the output format — downstream systems must update", "A creativity level adjustment", "A new few-shot example was added"], a: 1 },
      { q: "Why use prompt templates with fill-in variables instead of hardcoded prompts?", opts: ["It reduces word count", "It makes prompts reusable, testable, and maintainable across different inputs", "It enables automatic fine-tuning", "It bypasses safety filters"], a: 1 },
      { q: "Production prompt documentation must include:", opts: ["The developer's name only", "Purpose, input variables, output format, test scores, known failures, last tested date", "The prompt text only", "Only API usage examples"], a: 1 },
    ],
  },
  "6-1": {
    questions: [
      { q: "Which formatting style works especially well with Claude?", opts: ["Markdown headers (##)", "XML tags like <task>, <context>, <instructions>", "Python-style indentation", "YAML front matter"], a: 1 },
      { q: "For responses needed in under 500 milliseconds at scale, which model tier is appropriate?", opts: ["GPT-4 / Claude Opus", "Claude Haiku / GPT-3.5", "Claude Sonnet / GPT-4o", "Any fine-tuned model"], a: 1 },
      { q: "Eval-First model selection means:", opts: ["Reading all available benchmarks first", "Running your actual test suite on candidate models and letting real performance data decide", "Choosing the most expensive model", "Testing a small sample then scaling"], a: 1 },
    ],
  },
  "6-2": {
    questions: [
      { q: "What does 'T-shaped' expertise mean for a prompt engineering specialist?", opts: ["Deep expertise in two separate domains equally", "Deep prompting skill combined with deep expertise in one specific field", "Technical skills only with no domain knowledge", "Equal competence spread across all techniques"], a: 1 },
      { q: "What is the single exercise worth more than 10 hours of reading?", opts: ["Reading the original Chain-of-Thought research paper", "Watching video tutorials on each technique", "Taking one real task all the way through CRISP → test cases → 5 iterations → documented results", "Memorizing all prompt patterns"], a: 2 },
      { q: "The prompt journal practice helps because:", opts: ["It creates a shareable portfolio", "It turns repeated experience into compounding expertise — without documenting, practice just repeats", "It is required for certification", "It replaces the need for test cases"], a: 1 },
    ],
  },

  // ── Module 08 quizzes ──────────────────────────────────────────────────
  "7-0": {
    questions: [
      { q: "When prompting with an image, what should come FIRST in your prompt?", opts: ["The image file attachment", "A clear task statement telling the model what you want from the image", "A description of the image's colors and layout", "Image metadata like file size and resolution"], a: 1 },
      { q: "What is the 'Chain of Visual Thought' technique?", opts: ["Uploading a sequence of images in order", "Asking the model to describe what it sees first, then reason from that description", "Using bounding box coordinates to guide attention", "Chaining multiple vision API calls together"], a: 1 },
      { q: "For extracting data from a chart, which instruction pattern produces the best results?", opts: ["'Describe this chart'", "'Analyze the data'", "'Extract all data points into a JSON object with keys matching the x-axis labels'", "'Tell me what you see'"], a: 2 },
    ],
  },
  "7-1": {
    questions: [
      { q: "Why do LLMs hallucinate?", opts: ["They were trained on incorrect internet data", "They are optimized for fluent, confident-sounding text — not verified factual accuracy", "They have insufficient memory to store facts", "They are programmed to estimate when unsure"], a: 1 },
      { q: "The 'Source-First Grounding' technique means:", opts: ["Asking the AI to search the web before answering", "Providing verified source material in your prompt and restricting the AI to answer only from it", "Asking the AI to cite Wikipedia for every claim", "Using RAG infrastructure automatically"], a: 1 },
      { q: "Which instruction most effectively reduces hallucinated citations?", opts: ["'Be accurate and don't make things up'", "'Always cite your sources'", "'If you are not certain of a specific author, title, or URL, say so explicitly rather than guessing'", "'Only use information from the last 2 years'"], a: 2 },
    ],
  },
  "7-2": {
    questions: [
      { q: "In a multi-turn AI conversation, the system prompt's primary job is to:", opts: ["Set the creativity level for the session", "Carry the persona, rules, and user context across every turn without re-specification", "Provide the full conversation history", "List all topics the AI should avoid"], a: 1 },
      { q: "What is 'Context Compression' in conversational AI?", opts: ["Reducing the file size of uploaded images", "Summarizing earlier conversation turns into a compact state note to stay within the context window", "Removing punctuation and stop words from messages", "Using a smaller AI model for faster responses"], a: 1 },
      { q: "To collect multiple pieces of information in a chatbot, the best approach is:", opts: ["Ask all questions in one message to be efficient", "Ask one specific question at a time, progressing only after an answer is received", "Infer all information from the first user message", "Use a form instead of conversation"], a: 1 },
    ],
  },
  "7-3": {
    questions: [
      { q: "What does 'meta-prompting' mean in practice?", opts: ["Writing very long, detailed prompts", "Using AI to generate, critique, stress-test, and improve other prompts", "Prompting multiple AI models simultaneously", "Using metadata tags to structure prompt files"], a: 1 },
      { q: "When running a Prompt Critique meta-prompt, what is the optimal framing?", opts: ["'Is this prompt good? Rate it out of 10'", "'How can I improve this prompt?'", "'Act as a senior prompt engineer. Identify 3 specific weaknesses and rewrite each one to fix it.'", "'Check my prompt for spelling errors'"], a: 2 },
      { q: "The Automatic Prompt Engineer (APE) technique involves:", opts: ["Software that automatically calls the API", "Generating multiple structurally different prompt candidates for a task, then selecting the best-performing one using a test set", "A fine-tuning technique for custom models", "Using AI to write documentation for prompts"], a: 1 },
    ],
  },
};

export const TOTAL_LESSONS = MODULES.reduce((a, m) => a + m.lessons.length, 0);

/**
 * Grandfather clause for the syllabus expansion of 2026-04-20 (commit a86ad6f),
 * when the course grew from 22 lessons to 26.
 *
 * This is a TIME-BOUNDED exception, not a lowered requirement. Accounts created
 * before the cutoff qualify at LEGACY_SYLLABUS_LESSONS, because they signed up
 * to a 22-lesson course and finishing it was genuinely finishing it. Everyone
 * who joined afterwards must complete all TOTAL_LESSONS — otherwise the bar
 * would be permanently lowered and "Certificate of Completion" would be false
 * on its face for anyone registering today.
 *
 * Why account creation and not the progress row: public.progress has no
 * created_at column, only updated_at, and updated_at is rewritten on every save
 * — so it records the last time someone studied, not when they started, and is
 * useless as a cohort signal. auth.users.created_at is the only reliable
 * pre-existing timestamp, and it already arrives with the verified token, so no
 * extra query is needed.
 *
 * Do not derive the requirement from the live MODULES array again. Doing so is
 * what silently disqualified the earlier cohort in the first place: the course
 * grew, and their completions quietly stopped counting with no code change and
 * no decision recorded anywhere.
 */
export const SYLLABUS_EXPANDED_AT     = '2026-04-20T00:00:00Z';
export const LEGACY_SYLLABUS_LESSONS  = 22;

export const PASS_THRESHOLD = 70; // % score needed to pass a quiz and unlock the next lesson

/* getGrade lives in src/lib/theme.js — imported from there by all components */
