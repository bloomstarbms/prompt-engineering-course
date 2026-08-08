// Lesson bodies — module 06, domain-applications
//
// Split out of courseData.js so 109 KB of lesson prose stays out of the
// always-loaded bundle. Loaded on demand via src/data/lessonContent.js.
//
// KEYED BY LESSON SLUG, never by position. Ordering lives in courseData.js,
// which is what the build guard freezes; progress keys stay positional
// (`${m}-${l}`) and are never derived from anything in this file.

export const bodies = {
  "code-generation-and-debugging": `**The Context Sandwich (Full Code Prompt Structure):**
\`\`\`
[TECH STACK]
Language: Python 3.11 | Framework: FastAPI
Style: Google Python Style Guide
Existing patterns: [paste an example function from your codebase]

[TASK]
Write a function that...

[CONSTRAINTS]
- Type hints required
- Raise HTTPException with appropriate status codes
- No global variables | Must be easily testable

[OUTPUT]
1. Function with docstring
2. Unit test: the normal working case
3. Unit test: the primary error case
\`\`\`

**Debugging Prompt:**
\`\`\`
Error: [PASTE EXACT ERROR MESSAGE]
Code: \`\`\`[your code]\`\`\`
What I've tried: [your attempts]
Explain WHY the error occurred. Keep the fix minimal.
\`\`\`

**"Explain Before Code":** Ask for pseudocode + edge cases + assumptions before any implementation. This prevents bad architectural decisions.

---

## Detailed Analysis

**Why Code Prompts Need More Structure**
Code is unforgiving — a single wrong character causes failure. This means code generation prompts need to be more precise than general prompts. Vague instructions like "write a function to process data" produce technically valid but often wrong code. The Context Sandwich ensures the AI has everything it needs to produce code that actually fits into your existing system.

**The Four Elements of Code Context**

1. **Tech Stack Details:** Language version, framework, libraries. "Python 3.11 with FastAPI and SQLAlchemy" produces very different code than "Python 3.11 with Flask and raw SQL." Include version numbers — a library from 2 years ago might have breaking changes.

2. **An Example From Your Codebase:** The single most effective technique for style consistency. Paste a real function from your project: the AI will automatically match its naming conventions, error handling patterns, and documentation style.

3. **Hard Constraints:** Security requirements ("never log passwords"), performance needs ("must handle 10,000 records per second"), testability ("must work with mock dependencies"), style guidelines ("Google Python Style Guide").

4. **What the Output Should Include:** Be explicit — do you want just the function? Plus a docstring? Plus unit tests? The AI defaults to just the function unless you specify more.

**Debugging Prompt Best Practices**
The most effective debugging prompts include:
- **Exact error message** (copy-paste, not paraphrased) — the AI recognizes specific error patterns
- **Minimal reproducing code** — remove everything not needed to reproduce the error
- **What you've already tried** — prevents the AI suggesting things you've tested
- **"Explain WHY before fixing"** — forces the AI to understand root cause, not just apply a band-aid

**Code Review Prompt**
For a structured security-focused review:
\`\`\`
Review this code for: (1) security issues, (2) performance issues, (3) error handling gaps, (4) missing test coverage.
For each issue: severity (critical/major/minor), file:line, description, recommended fix.
Output as a JSON array.
\`\`\`

**The Architecture Review Pattern**
Before writing code for a new feature:
\`\`\`
[EXISTING CODEBASE OVERVIEW]
[NEW FEATURE REQUIREMENTS]
[CONSTRAINTS]

1. Propose 3 different approaches with tradeoffs
2. Recommend one with justification
3. Before writing code: list edge cases and failure modes
\`\`\`

---

## Take-Home Points

- Use the Context Sandwich: tech stack + existing example + task + constraints + output spec
- Paste an actual example from your codebase to ensure style consistency
- Debugging prompts need: exact error, minimal code, what you've tried, request for root cause
- "Explain Before Code" prevents architectural mistakes by requiring pseudocode first
- Specify unit tests as part of the output — not just the function itself

---

## Conclusion

Code generation is the domain where prompt engineering has the highest practical payoff. A well-structured code generation prompt doesn't just save time — it produces code that fits architecturally into your project, handles edge cases, includes tests, and follows your team's conventions. The difference between a beginner's code prompt ("write a function that...") and an expert's (the full Context Sandwich) can be the difference between code you discard and code you ship.`,
  "data-analysis-and-research": `**Structured Analysis Framework (5 Steps):**
\`\`\`
1. DESCRIBE     — What does the data show at face value?
2. PATTERNS     — Trends, cycles, anomalies?
3. HYPOTHESES   — 3 plausible explanations for what you see
4. GAPS         — What data would confirm or rule out each explanation?
5. RECOMMEND    — Most defensible action given the current evidence
\`\`\`

**Research Synthesis:**
\`\`\`
For each source:
- Core claim (1 sentence)
- Evidence strength (anecdotal / survey / experiment / meta-analysis)
- Key limitations

Then: what do sources agree on, genuine disagreements, state of evidence, unanswered questions
\`\`\`

**Devil's Advocate Pattern:** "Steelman the opposite conclusion. What evidence or assumptions would lead a reasonable analyst the other way? What am I most likely wrong about?"

---

## Detailed Analysis

**Why Structured Analysis Beats Open-Ended Analysis**
Asking the AI to "analyze this data" produces generic observations and surface-level patterns. The Structured Analysis Framework forces it through a logical progression: describe what's observable → find patterns → hypothesize why → identify what's missing → recommend action. This mirrors how a skilled analyst actually works.

The key addition is forcing **hypothesis generation before recommendations.** Most AI analyses jump from "here are the patterns" to "here is what you should do" — skipping the crucial step of articulating multiple competing explanations and evaluating them against the evidence.

**Evidence Quality Assessment**
The research synthesis framework's most important element is classifying how strong the evidence is:
- **Anecdotal:** "I heard that..." / "A company reported..." — lowest reliability
- **Survey:** correlation studies, polls — moderate reliability
- **Experiment:** randomized controlled trials — high reliability
- **Meta-analysis:** synthesis of multiple experiments — highest reliability

Most AI analyses treat all evidence as equally valid. Requiring explicit evidence strength assessment forces the AI to distinguish between weak correlational findings and robust causal evidence.

**The Devil's Advocate Pattern**
Confirmation bias is the enemy of good analysis — we tend to accept evidence that confirms what we already believe. After generating your primary analysis, always run the Devil's Advocate prompt:
\`\`\`
You have just produced [ANALYSIS SUMMARY].
Now steelman the opposite conclusion. What evidence or assumptions, if true, would lead a reasonable analyst to reach the opposite conclusion? What am I most likely wrong about? What would change your mind?
\`\`\`

This is extremely effective at surfacing:
- Hidden assumptions in the primary analysis
- Evidence that was ignored or underweighted
- Alternative explanations for the same data
- Data quality issues worth flagging

**Quantitative Analysis Prompt**
\`\`\`
[DATA: paste CSV or description]
Analyze for:
1. Distribution: averages, outliers (flag anything unusually high or low)
2. Trends: changes over time, patterns
3. Relationships: correlations between variables (specify which pairs to examine)
4. Anomalies: anything statistically unusual, with specific values and dates
5. Caveats: what this data cannot tell us; what additional data would strengthen the analysis

Output as a structured report with a supporting number for every claim.
\`\`\`

---

## Take-Home Points

- Use the 5-step framework: Describe → Patterns → Hypotheses → Gaps → Recommend
- Always classify evidence strength — distinguish anecdotal from experimental findings
- The Devil's Advocate pattern surfaces assumptions and counter-evidence that confirmation bias hides
- Require a supporting number for every claim — no unsupported assertions
- For literature reviews, explicitly ask for genuine disagreements and unanswered questions

---

## Conclusion

Data analysis and research are where the structured analytical power of AI shines most clearly — but only if you engineer the prompts to bring it out. Unstructured analysis prompts produce shallow observations. Structured prompts that guide the AI through a rigorous analytical framework produce insights worth acting on. The 5-step framework, evidence quality assessment, and Devil's Advocate pattern together give you an analytical discipline that rivals that of a trained researcher — running at the speed of an AI.`,
  "agentic-prompting-and-tool-use": `**What Makes a Prompt "Agentic"?**
Standard prompting = one question, one answer. Agentic prompting = the AI can take a series of actions, use tools, observe results, and decide what to do next — in a loop. The AI becomes the decision-making brain of an automated system.

**The ReAct Pattern (Reason → Act → Observe):**
\`\`\`
The AI thinks about what to do next:
Thought: [reasoning about current state and next step]

It uses a tool:
TOOL: search("current gold price")
OBSERVATION: Gold is $2,340/oz as of today.

Thought: Now I have the price, I'll calculate...
ANSWER: [final response]
\`\`\`

**Agent System Prompt:**
\`\`\`
[IDENTITY] You are [name], a [role] agent.
[CAPABILITIES] You have access to: [tool list]
[CONSTRAINTS]
- Never take irreversible actions without human confirmation
- Log your reasoning before each tool use
[TASK LOOP]
1. Understand the goal
2. Plan the steps
3. Execute one step at a time
4. Verify before proceeding
5. Report completion
[ERROR HANDLING] If a tool fails: retry once, then report.
\`\`\`

**Human-in-the-Loop Gate:** "Before any action that modifies data, sends a message, or costs money — describe what you're about to do and wait for 'confirm'."

---

## Detailed Analysis

**What Agentic AI Can Do**
An agentic system can:
1. **Break down a high-level goal** into steps it can execute one by one
2. **Choose which tool to use** at each step (web search, code execution, database query, etc.)
3. **Recover from errors** — recognize when a step failed and try a different approach
4. **Track progress** — know what's been done and what still needs doing
5. **Know when to stop** — recognize when the goal has been achieved

**The ReAct Pattern in Depth**
ReAct (Reason + Act) is the foundational agentic architecture. The AI alternates between:
- **Thought:** "What do I know? What should I do next?"
- **Action:** using a tool or performing a step
- **Observation:** recording what the tool returned

This creates an explicit reasoning trail — the AI can't jump to a conclusion without showing the intermediate steps. This makes the system more accurate and much easier to debug.

**Building the Agent System Prompt**

**Identity:** Who the agent is and what it's designed to do (same principle as role prompting).

**Capabilities:** A complete, unambiguous list of every available tool — with name, description, what parameters it takes, and what it returns. If the agent doesn't know it has a tool, it won't use it.

**Constraints:** The safety layer. The most critical constraint: **never take irreversible actions without human confirmation.** Define what "irreversible" means for your use case: sending emails, modifying a database, making purchases, etc.

**Task Loop:** A step-by-step operating procedure. Explicit procedures reduce the chance of the AI hallucinating or taking shortcuts on complex tasks.

**Human-in-the-Loop Design**
This single constraint prevents most catastrophic failures:
\`\`\`
BEFORE executing any of the following, describe the action in detail and wait for the user to type "confirm":
- Any action that modifies or deletes data
- Any message sent to external parties
- Any action that costs money
- Any action that cannot be undone in under 1 minute
\`\`\`
The cost is a brief pause in execution. The benefit is preventing irreversible mistakes.

**Planning for Failures**
Agentic systems will encounter errors — tools will fail, APIs will time out. The system prompt must specify:
1. How many times to retry a failed tool call (usually once)
2. When to try an alternative approach vs. escalate to the user
3. How to report failures clearly
"If tool X fails twice, try approach Y. If Y also fails, stop and report the failure with the exact error message."

---

## Take-Home Points

- The ReAct pattern (Reason → Act → Observe, in a loop) is the foundational agentic architecture
- Agent system prompts need: Identity, Capabilities (full tool list), Constraints, Task Loop, Error Handling
- The Human-in-the-Loop gate on irreversible actions is the single most important safety mechanism
- Explicit task loops reduce mistakes in complex multi-step tasks
- Plan for failure: every agent needs explicit error handling and escalation paths

---

## Conclusion

Agentic prompting is where AI stops being a question-answering tool and starts being an autonomous worker. The prompts powering agentic systems are more complex, and the stakes are higher — an agent that goes wrong might send an email, modify a database, or incur real costs. This demands a new level of engineering discipline: explicit capabilities, strict constraints, human-in-the-loop gates, and comprehensive error handling. Master agentic prompting and you're equipped to build the next generation of AI-powered automation.`,
};
