// Lesson bodies — module 04, output-engineering
//
// Split out of courseData.js so 109 KB of lesson prose stays out of the
// always-loaded bundle. Loaded on demand via src/data/lessonContent.js.
//
// KEYED BY LESSON SLUG, never by position. Ordering lives in courseData.js,
// which is what the build guard freezes; progress keys stay positional
// (`${m}-${l}`) and are never derived from anything in this file.

export const bodies = {
  "structured-output-design": `**Getting JSON (Machine-Readable) Output:**
\`\`\`
Output valid JSON only. No text before or after. Use exactly this structure:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": 0.0–1.0,
  "key_topics": ["string", ...],
  "summary": "string (max 50 words)"
}
\`\`\`

**5 Ways to Enforce the Format:**
1. **Show the exact structure** — paste the schema as an example, not a description
2. **Specify data types** — "string", "integer", "boolean"
3. **List valid options** — "pending" | "in_progress" | "complete" | "failed"
4. **Completion anchoring** — end your prompt with \`{\` so the AI completes the started structure
5. **Validation loop** — if the output can't be parsed, feed the error back and ask for a correction

**Production Note:** Most AI APIs (OpenAI, Anthropic) have a "JSON mode" setting. Always use it when available — it forces valid JSON at the API level, which is more reliable than prompt-only approaches.

---

## Detailed Analysis

**Why Structured Output Matters**
In real applications, AI output almost always feeds into something else — a database, a UI, another piece of code. Unstructured natural language responses can't be reliably processed by code. Structured output is the bridge between AI generation and software systems.

The challenge: the AI is trained to write natural language, not strict machine-readable formats. Left to its own devices, it might add "Sure, here is the JSON..." before the data, use different key names than you specified, or leave out required fields. Structured output design is the practice of overcoming these tendencies.

**The 5-Layer Defense Approach**

**Layer 1: Show the structure as an example**
Don't describe the structure in words — show it. The AI follows format examples far more reliably than format descriptions.

**Layer 2: Annotate the data types**
\`\`\`
{
  "name": "string",
  "age": integer,
  "active": boolean,
  "tags": ["string"]
}
\`\`\`
This prevents the AI from returning "twenty-three" when you need 23.

**Layer 3: List valid option values**
For fields with limited valid values, list them explicitly:
\`\`\`
"status": "pending" | "in_progress" | "complete" | "failed"
\`\`\`
This dramatically reduces the chance of the AI inventing new category names.

**Layer 4: Completion Anchoring**
End your prompt with the opening brace:
\`\`\`
Now output the JSON:

{
\`\`\`
The AI will complete the started structure. This single trick is the most reliable structural enforcement technique.

**Layer 5: Validation + Self-Correction**
Parse the output in code. If it fails, feed the error back to the AI:
\`\`\`
Your previous output failed JSON parsing with this error: [ERROR].
Output the corrected JSON with this exact structure: [SCHEMA]
\`\`\`
This self-correction loop handles the long tail of edge cases.

---

## Take-Home Points

- Show structure via example, not description — the AI follows templates better than verbal descriptions
- Include data type annotations and list valid option values in your schema
- Use completion anchoring (end with the opening bracket) for reliable structural enforcement
- Build a validation + self-correction loop for production systems
- Always use the API's JSON mode when available — it's the most reliable approach

---

## Conclusion

Structured output design is non-negotiable for any production AI application. You cannot reliably integrate AI outputs into software systems without it. The five-layer approach — show the schema, type annotations, valid options, completion anchoring, validation loop — gives you defense in depth. Start with the API's native JSON mode, add your schema in the prompt, end with completion anchoring, and validate on the receiving end. At that point, your structured output pipeline is production-ready.`,
  "length-tone-and-style-control": `**Length — Always Use Numbers:**
❌ "Write a short summary"
✅ "Write a summary in exactly 3 sentences"
✅ "Under 80 words"
✅ "5 bullet points, each 10–15 words"

**Tone Guide:**

| Tone | Keywords to Use |
|---|---|
| Professional | "formal", "precise", "objective" |
| Conversational | "casual", "contractions OK" |
| Authoritative | "direct", "declarative", "no hedging" |
| Empathetic | "warm", "acknowledging of difficulty" |
| Provocative | "contrarian", "challenge assumptions" |

**Style Cloning:** Paste 2–3 examples of the writing style you want, then: "Analyze the writing style of the examples above. Write [TASK] in that exact style."

**Removing Wishy-Washy Language:** "Do not use: 'it's worth noting', 'however', 'it depends', 'in conclusion'. Take a clear position."

---

## Detailed Analysis

**Why Vague Length Instructions Fail**
"Short", "brief", "concise", "comprehensive" — these mean different things to different people, and to the AI. In the AI's training data, "a short summary" appeared next to everything from 1 sentence to 5 paragraphs. The AI has no way to know which interpretation you want unless you specify with a number. Research consistently shows that number-based length instructions ("under 100 words") are followed far more reliably than qualitative ones ("be concise").

**Tone Has Multiple Dimensions**
Most people only think about one dimension of tone (formal vs. casual) while the others vary randomly. Tone is actually a multi-dimensional space:

- **Formality:** formal ↔ casual
- **Authority:** assertive ↔ tentative
- **Warmth:** friendly ↔ clinical
- **Concreteness:** specific examples ↔ abstract principles
- **Stance:** opinionated ↔ balanced

For professional communication, you typically want: formal + assertive + slightly warm + concrete + opinionated. Specify all the dimensions that matter.

**The Over-Hedging Problem**
The AI is trained to be careful and accurate, which makes it naturally add softening language: "It's worth noting that...", "However, it depends on...", "Generally speaking...". This is appropriate when there's genuine uncertainty — but it becomes annoying when you need a direct recommendation.

Two ways to remove hedging:
1. **List banned phrases explicitly:** "Do not use: 'it's worth noting', 'it depends', 'generally speaking'"
2. **Require a committed position:** "Take a clear, direct position. Commit to one recommendation without hedging."

**Style Cloning Workflow**
1. Find 2–3 examples of writing in the style you want
2. Paste them into the prompt
3. Add: "Analyze the writing style of the examples above. Then write [TASK] in exactly that style."
4. Optionally: "Specifically match: sentence length, paragraph structure, vocabulary level."

Style cloning is powerful for maintaining brand voice consistency across many outputs.

---

## Take-Home Points

- Always use numerical length constraints ("under 100 words") — never qualitative ones ("be brief")
- Tone has multiple dimensions — specify formality, authority, warmth, concreteness, and stance
- Remove hedging by listing banned phrases and requiring a direct position
- Style cloning (provide examples + "write in this style") maintains consistent brand voice
- Put length and tone instructions at the end of the prompt for maximum effect

---

## Conclusion

Length, tone, and style control are the finishing tools of prompt engineering. After you've set the role, context, task, and constraints, these controls determine whether the output sounds exactly right for your use case. The core insight: vague qualitative instructions ("professional, concise") are insufficient — precise, specific, multi-dimensional instructions are what separate amateur prompting from professional output engineering.`,
};
