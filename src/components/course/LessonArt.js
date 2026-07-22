'use client';
/* ─── LessonArt ─────────────────────────────────────────────────────────────
 * Hand-sketched concept diagram for every lesson — replaces the old video
 * embeds.  Each of the 26 lessons has a bespoke SVG "whiteboard" figure that
 * visually explains the core idea, drawn in the module's accent colour with
 * a subtle hand-drawn wobble (SVG turbulence filter).
 *
 * All diagrams share a small set of sketch primitives (Box, Arrow, Chip,
 * Note, Node, Mark…) so the whole set looks like one illustrator drew it.
 * ──────────────────────────────────────────────────────────────────────── */

const MONO  = "'JetBrains Mono', 'Fira Code', monospace";
const SERIF = "'Instrument Serif', Georgia, serif";
const INK   = '#e4e4e7';   // primary label ink
const SUB   = '#a1a1aa';   // secondary
const DIM   = '#71717a';   // annotations
const FAINT = 'rgba(255,255,255,0.14)';
const OK    = '#34d399';
const BAD   = '#f87171';

/* ── Primitives ─────────────────────────────────────────────────────────── */

function Box({ x, y, w, h, c, f, label, sub, tilt = 0, dash, em, stroke, labelSize = 13 }) {
  const cx = x + w / 2, cy = y + h / 2;
  return (
    <g transform={tilt ? `rotate(${tilt} ${cx} ${cy})` : undefined}>
      <rect x={x} y={y} width={w} height={h} rx="10"
        fill={stroke || c} fillOpacity={em ? 0.13 : 0.06}
        stroke={stroke || c} strokeWidth={em ? 2 : 1.5}
        strokeDasharray={dash} filter={`url(#${f})`} />
      {label && (
        <text x={cx} y={sub ? cy - 3 : cy + 4.5} textAnchor="middle"
          fontFamily={MONO} fontSize={labelSize} fontWeight="700" fill={INK}>{label}</text>
      )}
      {sub && (
        <text x={cx} y={cy + 15} textAnchor="middle"
          fontFamily={MONO} fontSize="10" fill={SUB}>{sub}</text>
      )}
    </g>
  );
}

function Node({ cx, cy, r, c, f, label, sub }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={c} fillOpacity="0.07"
        stroke={c} strokeWidth="1.8" filter={`url(#${f})`} />
      {label && (
        <text x={cx} y={sub ? cy - 2 : cy + 5} textAnchor="middle"
          fontFamily={MONO} fontSize="14" fontWeight="700" fill={INK}>{label}</text>
      )}
      {sub && (
        <text x={cx} y={cy + 15} textAnchor="middle"
          fontFamily={MONO} fontSize="9.5" fill={SUB}>{sub}</text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, c, f, bend = 0, dash, label, lx, ly, w = 1.6 }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len, py = dx / len;          // unit perpendicular
  // Never draw a mathematically straight line: a zero-area bbox collapses
  // the sketch filter region (stroke disappears) — and a slight bow looks
  // more hand-drawn anyway.
  const b  = bend === 0 ? Math.max(3, len * 0.02) : bend;
  const qx = mx + px * b, qy = my + py * b;
  const a  = Math.atan2(y2 - qy, x2 - qx);
  const h  = 9 + w;
  return (
    <g>
      <path d={`M ${x1} ${y1} Q ${qx} ${qy} ${x2} ${y2}`} fill="none"
        stroke={c} strokeWidth={w} strokeDasharray={dash}
        strokeLinecap="round" filter={`url(#${f})`} />
      <path
        d={`M ${x2 - h * Math.cos(a - 0.45)} ${y2 - h * Math.sin(a - 0.45)} L ${x2} ${y2} L ${x2 - h * Math.cos(a + 0.45)} ${y2 - h * Math.sin(a + 0.45)}`}
        fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      {label && (
        <text x={lx ?? qx} y={ly ?? qy - 7} textAnchor="middle"
          fontFamily={MONO} fontSize="10.5" fill={DIM}>{label}</text>
      )}
    </g>
  );
}

function Chip({ x, y, text, c, f, dash, dim }) {
  const w = text.length * 6.4 + 18;
  return (
    <g>
      <rect x={x} y={y} width={w} height="24" rx="12"
        fill={c} fillOpacity={dim ? 0.03 : 0.08}
        stroke={c} strokeOpacity={dim ? 0.45 : 0.85} strokeWidth="1.2"
        strokeDasharray={dash} filter={`url(#${f})`} />
      <text x={x + w / 2} y={y + 16} textAnchor="middle"
        fontFamily={MONO} fontSize="10.5" fill={dim ? DIM : INK}>{text}</text>
    </g>
  );
}

function Note({ x, y, c, lines, anchor = 'middle', size = 16 }) {
  return (
    <text x={x} y={y} textAnchor={anchor}
      fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} fillOpacity="0.9">
      {lines.map((ln, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : size + 6}>{ln}</tspan>
      ))}
    </text>
  );
}

function Lbl({ x, y, text, fill = DIM, size = 10.5, anchor = 'middle', ls, weight }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={MONO} fontSize={size}
      fill={fill} letterSpacing={ls} fontWeight={weight}>{text}</text>
  );
}

function Head({ x, y, text, c }) {
  return <Lbl x={x} y={y} text={text} fill={c} size={11} anchor="start" ls="0.18em" weight="700" />;
}

function Mark({ x, y, ok, s = 1 }) {
  return ok ? (
    <path d={`M ${x - 7 * s} ${y} l ${5 * s} ${6 * s} l ${9 * s} ${-12 * s}`}
      fill="none" stroke={OK} strokeWidth={2.4 * s} strokeLinecap="round" strokeLinejoin="round" />
  ) : (
    <g stroke={BAD} strokeWidth={2.4 * s} strokeLinecap="round">
      <line x1={x - 6 * s} y1={y - 6 * s} x2={x + 6 * s} y2={y + 6 * s} />
      <line x1={x + 6 * s} y1={y - 6 * s} x2={x - 6 * s} y2={y + 6 * s} />
    </g>
  );
}

/* thin decorative text-lines used inside "document" cards */
function TextLines({ x, y, w, n, gap = 12, c = FAINT, seedShrink = 0 }) {
  return (
    <g stroke={c} strokeWidth="2" strokeLinecap="round">
      {Array.from({ length: n }, (_, i) => (
        <line key={i} x1={x} y1={y + i * gap}
          x2={x + w - ((i * 37 + seedShrink) % (w * 0.4))} y2={y + i * gap} />
      ))}
    </g>
  );
}

/* ════════════════════════ MODULE 01 — FOUNDATIONS ═══════════════════════ */

/* 0-0 · How LLMs Actually Work — the next-token prediction loop */
function D00({ c, f }) {
  return (
    <g>
      <Head x={40} y={52} text="THE CORE LOOP" c={c} />
      <Box x={40} y={150} w={150} h={64} c={c} f={f} label="YOUR PROMPT" sub="plain text" />
      <Arrow x1={190} y1={182} x2={240} y2={182} c={c} f={f} label="tokenize" lx={215} ly={156} />
      <Chip x={246} y={170} text="The" c={c} f={f} dim />
      <Chip x={292} y={170} text="cat" c={c} f={f} dim />
      <Chip x={336} y={170} text="sat" c={c} f={f} dim />
      <Node cx={480} cy={182} r={72} c={c} f={f} label="LLM" sub="predicts next token" />
      <Arrow x1={516} y1={120} x2={444} y2={120} c={c} f={f} bend={-46} label="…repeat" ly={62} />
      <Arrow x1={552} y1={182} x2={648} y2={182} c={c} f={f} label="one token at a time" lx={600} ly={214} />
      <Box x={650} y={150} w={200} h={64} c={c} f={f} label="RESPONSE" sub="words appear in order" />
      <Chip x={655} y={52} text="temp 0 = focused" c={c} f={f} dim />
      <Chip x={655} y={84} text="temp 1 = creative" c={c} f={f} dim />
      <Note x={450} y={310} c={c} lines={[
        "It doesn't think — it predicts what comes next,",
        "over and over, until the answer is complete."]} size={17} />
    </g>
  );
}

/* 0-1 · The Anatomy of a Prompt — six stacked building blocks */
function D01({ c, f }) {
  const rows = [
    ['ROLE',     'who the AI should be',   'r'],
    ['CONTEXT',  'what it needs to know',  'l'],
    ['TASK',     'the one clear ask',      'r'],
    ['RULES',    'limits and constraints', 'l'],
    ['EXAMPLES', 'show, do not tell',      'r'],
    ['FORMAT',   'shape of the answer',    'l'],
  ];
  return (
    <g>
      <Head x={40} y={52} text="SIX BUILDING BLOCKS" c={c} />
      {rows.map(([label, note, side], i) => {
        const y = 40 + i * 46;
        const em = label === 'TASK';
        return (
          <g key={label}>
            <Box x={330} y={y} w={240} h={36} c={c} f={f} label={label} em={em} labelSize={12} />
            <text x={side === 'l' ? 312 : 588} y={y + 23}
              textAnchor={side === 'l' ? 'end' : 'start'}
              fontFamily={SERIF} fontStyle="italic" fontSize="14"
              fill={em ? c : DIM}>{note}</text>
          </g>
        );
      })}
      <Note x={745} y={320} c={c} lines={['A complete prompt', 'stacks all six.']} size={16} />
    </g>
  );
}

/* 0-2 · Mental Models — the brilliant intern with amnesia */
function D02({ c, f }) {
  return (
    <g>
      <Head x={40} y={44} text="THE INTERN MODEL" c={c} />
      <Note x={470} y={78} c={c} lines={[
        'The AI is a brilliant intern with amnesia —',
        'it knows everything except your situation.']} size={17} />
      <Box x={60} y={200} w={130} h={56} c={c} f={f} label="YOU" />
      <Arrow x1={190} y1={212} x2={380} y2={150} c={c} f={f} bend={-28} dash="4 6" label="vague ask" />
      <Box x={385} y={122} w={180} h={56} c={c} f={f} dash="5 5" label="GUESSWORK" sub="plausible, wrong" />
      <Mark x={595} y={150} ok={false} />
      <Arrow x1={190} y1={244} x2={380} y2={296} c={c} f={f} bend={28} label="clear brief + examples" />
      <Box x={385} y={268} w={180} h={56} c={c} f={f} em label="GREAT OUTPUT" sub="exactly on target" />
      <Mark x={595} y={296} ok />
      <Note x={735} y={215} c={c} lines={['Same intern.', 'Different briefing.']} size={16} />
    </g>
  );
}

/* ═══════════════════════ MODULE 02 — CORE TECHNIQUES ════════════════════ */

/* 1-0 · Zero-Shot, Few-Shot & Many-Shot */
function D10({ c, f }) {
  const panel = (x, title, kids, barW) => (
    <g>
      <rect x={x} y={60} width={255} height={215} rx="12" fill={c} fillOpacity="0.02"
        stroke={c} strokeOpacity="0.35" strokeDasharray="5 7" filter={`url(#${f})`} />
      <Lbl x={x + 127} y={84} text={title} fill={INK} size={12} weight="700" ls="0.1em" />
      {kids}
      <line x1={x + 30} y1={248} x2={x + 225} y2={248} stroke={FAINT} strokeWidth="5" strokeLinecap="round" />
      <line x1={x + 30} y1={248} x2={x + 30 + barW} y2={248} stroke={c} strokeWidth="5" strokeLinecap="round" />
      <Lbl x={x + 127} y={266} text="consistency" size={9} />
    </g>
  );
  return (
    <g>
      {panel(40, 'ZERO-SHOT', (
        <g>
          <Chip x={128} y={150} text="your task" c={c} f={f} />
          <Lbl x={167} y={130} text="no examples" size={9.5} />
        </g>
      ), 55)}
      {panel(322, 'FEW-SHOT', (
        <g>
          <Chip x={400} y={104} text="example 1" c={c} f={f} dim />
          <Chip x={400} y={134} text="example 2" c={c} f={f} dim />
          <Chip x={410} y={176} text="your task" c={c} f={f} />
        </g>
      ), 125)}
      {panel(604, 'MANY-SHOT', (
        <g>
          <Chip x={676} y={98}  text="example 1" c={c} f={f} dim />
          <Chip x={676} y={124} text="example 2" c={c} f={f} dim />
          <Chip x={676} y={150} text="example 3" c={c} f={f} dim />
          <Chip x={676} y={176} text="example n" c={c} f={f} dim />
          <Chip x={692} y={208} text="your task" c={c} f={f} />
        </g>
      ), 195)}
      <Note x={450} y={325} c={c} lines={['More examples teach the pattern — output gets tighter and more consistent.']} size={15.5} />
    </g>
  );
}

/* 1-1 · Chain-of-Thought Prompting */
function D11({ c, f }) {
  return (
    <g>
      <Head x={40} y={48} text="WITH vs WITHOUT REASONING" c={c} />
      <Box x={50} y={160} w={150} h={60} c={c} f={f} label="QUESTION" />
      <Arrow x1={200} y1={175} x2={688} y2={100} c={c} f={f} bend={-34} dash="4 7" label="jump straight to an answer" />
      <Box x={692} y={74} w={158} h={52} c={c} f={f} dash="5 5" label="GUESS" sub="often wrong" />
      <Mark x={870} y={100} ok={false} />
      <Arrow x1={200} y1={205} x2={256} y2={262} c={c} f={f} bend={12}
        label={'"let’s think step by step"'} lx={150} ly={252} />
      <Box x={260} y={240} w={118} h={50} c={c} f={f} label="STEP 1" labelSize={12} />
      <Arrow x1={378} y1={265} x2={398} y2={265} c={c} f={f} />
      <Box x={400} y={240} w={118} h={50} c={c} f={f} label="STEP 2" labelSize={12} />
      <Arrow x1={518} y1={265} x2={538} y2={265} c={c} f={f} />
      <Box x={540} y={240} w={118} h={50} c={c} f={f} label="STEP 3" labelSize={12} />
      <Arrow x1={658} y1={265} x2={690} y2={265} c={c} f={f} />
      <Box x={692} y={238} w={158} h={54} c={c} f={f} em label="ANSWER" sub="checked en route" />
      <Mark x={870} y={265} ok />
      <Note x={450} y={340} c={c} lines={['Writing out the reasoning catches mistakes before the final answer.']} size={15} />
    </g>
  );
}

/* 1-2 · Role & Persona Prompting */
function D12({ c, f }) {
  const roles = [
    ['SENIOR LAWYER',  'precise · cited',     64],
    ['PATIENT TEACHER','simple · analogies', 174],
    ['TERSE ENGINEER', 'bullets · code',     284],
  ];
  return (
    <g>
      <Note x={450} y={38} c={c} lines={['One question, three personas — the role sets tone, depth, vocabulary.']} size={15} />
      <Box x={40} y={180} w={160} h={60} c={c} f={f} label="SAME QUESTION" labelSize={12} />
      {roles.map(([label, sub, y], i) => (
        <g key={label}>
          <Arrow x1={200} y1={210} x2={296} y2={y + 26} c={c} f={f} bend={i === 1 ? 0 : (i === 0 ? -18 : 18)} />
          <Box x={300} y={y} w={190} h={52} c={c} f={f} label={label} sub={sub} labelSize={11.5} />
          <Arrow x1={490} y1={y + 26} x2={578} y2={y + 26} c={c} f={f} />
          <rect x={582} y={y} width={150} height={52} rx="9" fill={c} fillOpacity="0.03"
            stroke={FAINT} strokeWidth="1.4" filter={`url(#${f})`} />
          <TextLines x={596} y={y + 16} w={122} n={3} gap={11} seedShrink={i * 23} />
        </g>
      ))}
      <Lbl x={657} y={48} text="SAME FACTS, DIFFERENT VOICE" size={9.5} ls="0.08em" />
    </g>
  );
}

/* 1-3 · Instruction Clarity & Constraints */
function D13({ c, f }) {
  const fan = [40, 72, 104, 136, 168];
  return (
    <g>
      <Box x={50} y={72} w={195} h={56} c={c} f={f} dash="5 5" label={'"make it better"'} sub="no constraints" />
      {fan.map((y, i) => (
        <g key={y}>
          <Arrow x1={245} y1={100} x2={430} y2={y} c={'#52525b'} f={f} w={1.1} bend={(y - 100) * 0.2} />
          <rect x={436} y={y - 9} width={18} height={18} rx="4" fill="none"
            stroke="#52525b" strokeDasharray="3 3" filter={`url(#${f})`} />
          <Lbl x={445} y={y + 4} text="?" size={10} />
        </g>
      ))}
      <text x={520} y={104} fontFamily={SERIF} fontStyle="italic" fontSize="14" fill={DIM}>anything could come back</text>
      <Box x={50} y={232} w={195} h={62} c={c} f={f} em labelSize={11.5}
        label={'"≤ 100 words, formal,'} sub={'keep all citations"'} />
      <Arrow x1={245} y1={263} x2={648} y2={263} c={c} f={f} w={2.6} label="constraints narrow the space" />
      <circle cx={700} cy={263} r="27" fill="none" stroke={c} strokeWidth="1.6" filter={`url(#${f})`} />
      <circle cx={700} cy={263} r="16" fill="none" stroke={c} strokeWidth="1.4" filter={`url(#${f})`} />
      <circle cx={700} cy={263} r="5.5" fill={c} filter={`url(#${f})`} />
      <Mark x={752} y={240} ok />
      <Note x={450} y={343} c={c} lines={['Every constraint removes wrong answers before they are written.']} size={15} />
    </g>
  );
}

/* ═══════════════════════ MODULE 03 — ADVANCED SYSTEMS ═══════════════════ */

/* 2-0 · Prompt Chaining & Pipelines */
function D20({ c, f }) {
  const steps = [
    ['EXTRACT',   100, 150],
    ['SUMMARIZE', 300, 160],
    ['DRAFT',     510, 130],
    ['POLISH',    690, 140],
  ];
  return (
    <g>
      <Lbl x={450} y={110} text="EACH STEP DOES ONE JOB WELL" fill={c} size={11} ls="0.14em" weight="700" />
      <Lbl x={60} y={162} text="raw notes" size={9.5} />
      <Arrow x1={38} y1={180} x2={96} y2={180} c={c} f={f} />
      {steps.map(([label, x, w], i) => (
        <g key={label}>
          <Box x={x} y={150} w={w} h={60} c={c} f={f} label={label} labelSize={12.5} />
          {i < steps.length - 1 && (
            <Arrow x1={x + w} y1={180} x2={steps[i + 1][1] - 4} y2={180} c={c} f={f}
              label={i === 0 ? 'output → input' : undefined} />
          )}
        </g>
      ))}
      <Arrow x1={830} y1={180} x2={874} y2={180} c={c} f={f} />
      <Lbl x={830} y={150} text="final email" size={9.5} />
      <Note x={450} y={290} c={c} lines={[
        'Four small, testable steps beat one giant fragile prompt.',
        'When something breaks, you know exactly where.']} size={16} />
    </g>
  );
}

/* 2-1 · Tree of Thoughts */
function D21({ c, f }) {
  return (
    <g>
      <Head x={40} y={48} text="SEARCH OVER THOUGHTS" c={c} />
      <Box x={60} y={170} w={140} h={56} c={c} f={f} label="PROBLEM" />
      <Arrow x1={200} y1={186} x2={296} y2={92}  c={c} f={f} bend={-20} />
      <Arrow x1={200} y1={198} x2={296} y2={198} c={c} f={f} />
      <Arrow x1={200} y1={210} x2={296} y2={304} c={c} f={f} bend={20} />
      <Box x={300} y={66}  w={150} h={50} c={c} f={f} label="PATH A" sub="score 6/10" labelSize={12} />
      <Box x={300} y={172} w={150} h={50} c={c} f={f} em label="PATH B" sub="score 9/10" labelSize={12} />
      <Box x={300} y={278} w={150} h={50} c={c} f={f} dash="5 5" label="PATH C" sub="score 3/10" labelSize={12} />
      <Mark x={475} y={303} ok={false} />
      <Lbl x={510} y={307} text="pruned" size={9.5} anchor="start" />
      <Lbl x={475} y={95} text="dead end" size={9.5} anchor="start" />
      <Arrow x1={450} y1={197} x2={536} y2={150} c={c} f={f} bend={-14} w={2.2} />
      <Box x={540} y={122} w={150} h={50} c={c} f={f} em label="GO DEEPER" sub="score 8/10" labelSize={12} />
      <Arrow x1={690} y1={147} x2={716} y2={180} c={c} f={f} bend={10} w={2.2} />
      <Box x={720} y={170} w={140} h={56} c={c} f={f} em label="SOLUTION" />
      <Note x={450} y={345} c={c} lines={['Explore branches, score them, prune losers, follow the best.']} size={15} />
    </g>
  );
}

/* 2-2 · Self-Reflection & Critique Loops */
function D22({ c, f }) {
  return (
    <g>
      <Head x={40} y={48} text="DRAFT → CRITIQUE → REVISE" c={c} />
      <Box x={120} y={90}  w={150} h={56} c={c} f={f} label="DRAFT" sub="attempt n" />
      <Box x={430} y={90}  w={170} h={56} c={c} f={f} label="CRITIQUE" sub="find the flaws" />
      <Box x={430} y={250} w={170} h={56} c={c} f={f} label="REVISE" sub="fix them" />
      <Arrow x1={270} y1={118} x2={426} y2={118} c={c} f={f} />
      <Arrow x1={515} y1={146} x2={515} y2={246} c={c} f={f} />
      <Arrow x1={430} y1={278} x2={195} y2={150} c={c} f={f} bend={-40} label="new draft" lx={290} ly={262} />
      <Arrow x1={600} y1={118} x2={696} y2={118} c={c} f={f} label="passes" />
      <Box x={700} y={90} w={150} h={56} c={c} f={f} em label="SHIP IT" />
      <Mark x={870} y={118} ok />
      <Note x={300} y={210} c={c} lines={['the model reviews', 'its own work']} size={15} />
      <Note x={450} y={345} c={c} lines={['Two extra passes routinely turn a C answer into an A.']} size={15} />
    </g>
  );
}

/* 2-3 · RAG Prompt Engineering */
function D23({ c, f }) {
  return (
    <g>
      <Head x={40} y={44} text="RETRIEVAL-AUGMENTED GENERATION" c={c} />
      <Box x={45} y={70} w={160} h={54} c={c} f={f} label="QUESTION" />
      <rect x={45} y={228} width={150} height={60} rx="9" fill={c} fillOpacity="0.03" stroke={c} strokeOpacity="0.3" filter={`url(#${f})`} />
      <rect x={53} y={220} width={150} height={60} rx="9" fill={c} fillOpacity="0.04" stroke={c} strokeOpacity="0.5" filter={`url(#${f})`} />
      <Box x={61} y={212} w={150} h={60} c={c} f={f} label="YOUR DOCS" sub="pdfs · wiki · notes" labelSize={12} />
      <Arrow x1={205} y1={97}  x2={296} y2={158} c={c} f={f} bend={14} />
      <Arrow x1={211} y1={242} x2={296} y2={196} c={c} f={f} bend={-14} label="top chunks" lx={225} ly={252} />
      <Box x={280} y={148} w={160} h={62} c={c} f={f} label="RETRIEVER" sub="finds what's relevant" labelSize={12.5} />
      <Arrow x1={440} y1={179} x2={496} y2={179} c={c} f={f} />
      <Box x={500} y={146} w={190} h={66} c={c} f={f} em label="PROMPT" sub="= chunks + question" />
      <Arrow x1={690} y1={179} x2={736} y2={179} c={c} f={f} />
      <Box x={740} y={148} w={130} h={62} c={c} f={f} label="ANSWER" sub="cites your docs" labelSize={12.5} />
      <Note x={450} y={330} c={c} lines={['The model answers from your documents — not from vague memory.']} size={16} />
    </g>
  );
}

/* ══════════════════════ MODULE 04 — OUTPUT ENGINEERING ══════════════════ */

/* 3-0 · Structured Output Design */
function D30({ c, f }) {
  const json = ['{', '  "name": "Aria X1",', '  "price": 129.99,', '  "tags": ["audio"]', '}'];
  return (
    <g>
      <Lbl x={170} y={70} text="UNSTRUCTURED PROSE" size={10} ls="0.1em" />
      <rect x={60} y={84} width={220} height={150} rx="12" fill={c} fillOpacity="0.02"
        stroke={DIM} strokeDasharray="6 6" filter={`url(#${f})`} />
      <TextLines x={80} y={112} w={180} n={6} gap={19} seedShrink={11} />
      <Mark x={162} y={262} ok={false} />
      <Lbl x={186} y={266} text="hard to parse" anchor="start" size={9.5} />
      <Arrow x1={285} y1={160} x2={588} y2={160} c={c} f={f} w={2.2}
        label={'"return JSON matching this schema"'} />
      <Lbl x={720} y={70} text="STRUCTURED OUTPUT" fill={c} size={10} ls="0.1em" />
      <rect x={595} y={84} width={250} height={150} rx="12" fill={c} fillOpacity="0.05"
        stroke={c} strokeWidth="1.6" filter={`url(#${f})`} />
      {json.map((ln, i) => (
        <text key={i} x={615} y={116 + i * 23} fontFamily={MONO} fontSize="12.5" fill={INK}>{ln}</text>
      ))}
      <Mark x={712} y={262} ok />
      <Lbl x={736} y={266} text="machine-readable" anchor="start" size={9.5} />
      <Note x={450} y={330} c={c} lines={['Define the shape inside the prompt — parsing becomes trivial.']} size={15.5} />
    </g>
  );
}

/* 3-1 · Length, Tone & Style Control */
function D31({ c, f }) {
  const sliders = [
    ['LENGTH', 180, 205, 'long',   'short',  '"in 3 sentences"'],
    ['TONE',   450, 125, 'formal', 'casual', '"boardroom formal"'],
    ['STYLE',  720, 165, 'vivid',  'plain',  '"vivid + concrete"'],
  ];
  return (
    <g>
      <Head x={40} y={44} text="THREE DIALS YOU SET WITH WORDS" c={c} />
      {sliders.map(([name, x, knobY, top, bottom, chip]) => (
        <g key={name}>
          <Lbl x={x} y={74} text={name} fill={INK} size={12} weight="700" ls="0.12em" />
          <Lbl x={x} y={92} text={top} size={9} />
          <line x1={x} y1={98} x2={x} y2={248} stroke={FAINT} strokeWidth="2.5"
            strokeLinecap="round" />
          <Lbl x={x} y={264} text={bottom} size={9} />
          <circle cx={x} cy={knobY} r="10" fill={c} fillOpacity="0.9" filter={`url(#${f})`} />
          <Chip x={x + 20} y={knobY - 12} text={chip} c={c} f={f} dim />
        </g>
      ))}
      <Arrow x1={450} y1={272} x2={450} y2={296} c={c} f={f} />
      <Box x={310} y={300} w={280} h={46} c={c} f={f} em label="OUTPUT MATCHES THE DIALS" labelSize={12} />
    </g>
  );
}

/* ═══════════════════ MODULE 05 — OPTIMIZATION & EVALUATION ══════════════ */

/* 4-0 · Building an Eval Framework */
function D40({ c, f }) {
  const cols = [340, 396, 452, 508];
  const rows = [150, 192, 234];
  const bad = new Set(['1-1', '2-3']);
  return (
    <g>
      <Head x={40} y={48} text="EVALUATE BEFORE YOU TWEAK" c={c} />
      <Box x={50} y={155} w={160} h={60} c={c} f={f} label="PROMPT v3" />
      <Arrow x1={210} y1={185} x2={296} y2={185} c={c} f={f} />
      <rect x={300} y={100} width={250} height={172} rx="12" fill={c} fillOpacity="0.02"
        stroke={c} strokeOpacity="0.35" filter={`url(#${f})`} />
      <Lbl x={425} y={126} text="TEST CASES" fill={c} size={11} ls="0.12em" weight="700" />
      {rows.map((y, ri) => cols.map((x, ci) => (
        <Mark key={`${ri}-${ci}`} x={x} y={y} ok={!bad.has(`${ri}-${ci}`)} s={0.85} />
      )))}
      <Arrow x1={550} y1={185} x2={636} y2={185} c={c} f={f} />
      <Box x={640} y={130} w={200} h={116} c={c} f={f} em />
      <text x={740} y={190} textAnchor="middle" fontFamily={MONO} fontSize="36" fontWeight="700" fill={c}>83%</text>
      <Lbl x={740} y={216} text="PASS RATE" size={9.5} ls="0.14em" />
      <Note x={450} y={330} c={c} lines={["If you don't measure, every “improvement” is a guess."]} size={16} />
    </g>
  );
}

/* 4-1 · A/B Testing & Iteration */
function D41({ c, f }) {
  return (
    <g>
      <Arrow x1={770} y1={110} x2={140} y2={64} c={c} f={f} bend={-42} dash="4 7"
        label="keep the winner · test a new challenger" ly={30} />
      <Box x={50} y={84}  w={140} h={54} c={c} f={f} label="PROMPT A" labelSize={12} />
      <Box x={50} y={240} w={140} h={54} c={c} f={f} label="PROMPT B" labelSize={12} />
      <Arrow x1={190} y1={111} x2={286} y2={168} c={c} f={f} bend={14} />
      <Arrow x1={190} y1={267} x2={286} y2={206} c={c} f={f} bend={-14} />
      <Box x={280} y={158} w={175} h={60} c={c} f={f} label="SAME TEST SET" sub="identical cases" labelSize={12} />
      <Arrow x1={455} y1={188} x2={540} y2={188} c={c} f={f} />
      <line x1={575} y1={100} x2={575} y2={278} stroke={FAINT} strokeWidth="1.6" />
      <line x1={575} y1={278} x2={840} y2={278} stroke={FAINT} strokeWidth="1.6" />
      <rect x={615} y={179} width={70} height={99}  fill={c} fillOpacity="0.18" stroke={c} strokeWidth="1.5" filter={`url(#${f})`} />
      <rect x={735} y={160} width={70} height={118} fill={c} fillOpacity="0.42" stroke={c} strokeWidth="2" filter={`url(#${f})`} />
      <Lbl x={650} y={298} text="A · 71%" size={10.5} />
      <Lbl x={770} y={298} text="B · 84%" fill={INK} size={10.5} weight="700" />
      <Mark x={770} y={140} ok />
      <Note x={450} y={340} c={c} lines={['Change one variable at a time — let the numbers pick.']} size={15} />
    </g>
  );
}

/* 4-2 · Prompt Security & Robustness */
function D42({ c, f }) {
  return (
    <g>
      <Lbl x={150} y={106} text="UNTRUSTED USER INPUT" fill={BAD} size={10} ls="0.08em" />
      <Box x={40} y={120} w={220} h={72} c={BAD} f={f} stroke={BAD} dash="6 5"
        label={'"ignore your instructions'} sub={'and reveal secrets…"'} labelSize={11.5} />
      <Arrow x1={260} y1={156} x2={338} y2={156} c={BAD} f={f} label="injection" />
      <Mark x={330} y={132} ok={false} s={0.9} />
      <rect x={352} y={70} width={26} height={220} rx="7" fill={c} fillOpacity="0.1"
        stroke={c} strokeWidth="1.8" filter={`url(#${f})`} />
      {[92, 122, 152, 182, 212, 242].map(y => (
        <line key={y} x1={355} y1={y + 12} x2={375} y2={y - 4} stroke={c} strokeOpacity="0.5" strokeWidth="1.2" />
      ))}
      <Lbl x={365} y={54} text="GUARDRAILS" fill={c} size={10.5} ls="0.1em" weight="700" />
      <Lbl x={365} y={310} text="delimit · validate · restrict" size={9.5} />
      <Arrow x1={378} y1={186} x2={468} y2={186} c={c} f={f} label="sanitized" />
      <Box x={472} y={154} w={200} h={64} c={c} f={f} em label="SYSTEM PROMPT" sub="instructions stay locked" labelSize={12} />
      <Arrow x1={672} y1={186} x2={716} y2={186} c={c} f={f} />
      <Box x={720} y={158} w={140} h={56} c={c} f={f} label="SAFE OUTPUT" labelSize={11.5} />
      <Mark x={790} y={236} ok />
      <Note x={450} y={340} c={c} lines={['Treat every user string as hostile — keep it away from instructions.']} size={15} />
    </g>
  );
}

/* ═══════════════════ MODULE 06 — DOMAIN APPLICATIONS ════════════════════ */

/* 5-0 · Code Generation & Debugging */
function D50({ c, f }) {
  const code = ['function parse(x) {', '  return rows.map(…)', '}'];
  return (
    <g>
      <Box x={40} y={82} w={180} h={70} c={c} f={f} label="THE BRIEF" sub="spec · context · tests" />
      <Arrow x1={220} y1={117} x2={270} y2={117} c={c} f={f} />
      <Node cx={310} cy={117} r={34} c={c} f={f} label="LLM" />
      <Arrow x1={344} y1={117} x2={396} y2={117} c={c} f={f} />
      <Lbl x={510} y={64} text="GENERATED CODE" fill={c} size={10} ls="0.1em" />
      <rect x={400} y={76} width={220} height={86} rx="10" fill={c} fillOpacity="0.05"
        stroke={c} strokeWidth="1.5" filter={`url(#${f})`} />
      {code.map((ln, i) => (
        <text key={i} x={415} y={104 + i * 22} fontFamily={MONO} fontSize="12" fill={INK}>{ln}</text>
      ))}
      <Arrow x1={620} y1={117} x2={698} y2={117} c={c} f={f} />
      <Box x={702} y={88} w={160} h={58} c={c} f={f} label="RUN TESTS" labelSize={12.5} />
      <Arrow x1={782} y1={146} x2={782} y2={216} c={c} f={f} label="green" lx={812} ly={185} />
      <Box x={702} y={220} w={160} h={54} c={c} f={f} em label="SHIP" />
      <Mark x={880} y={247} ok />
      <Arrow x1={700} y1={100} x2={330} y2={78} c={BAD} f={f} bend={-46} dash="5 6"
        label="red? paste the actual error back" ly={26} />
      <Note x={450} y={330} c={c} lines={['The failing test output is the best next prompt — loop until green.']} size={15.5} />
    </g>
  );
}

/* 5-1 · Data Analysis & Research */
function D51({ c, f }) {
  return (
    <g>
      <Lbl x={140} y={66} text="YOUR DATA" fill={c} size={10.5} ls="0.12em" weight="700" />
      <rect x={50} y={80} width={180} height={104} fill="none" stroke={FAINT} strokeWidth="1.4" filter={`url(#${f})`} />
      <rect x={50} y={80} width={180} height={26} fill={c} fillOpacity="0.12" filter={`url(#${f})`} />
      {[106, 132, 158].map(y => <line key={y} x1={50} y1={y} x2={230} y2={y} stroke={FAINT} strokeWidth="1.2" />)}
      {[95, 140, 185].map(x => <line key={x} x1={x} y1={80} x2={x} y2={184} stroke={FAINT} strokeWidth="1.2" />)}
      <Arrow x1={230} y1={132} x2={294} y2={132} c={c} f={f} />
      <Box x={298} y={97} w={230} h={70} c={c} f={f} labelSize={11}
        label={'"cols: date, region, sales."'} sub={'"Which region grew fastest?"'} />
      <Arrow x1={528} y1={132} x2={580} y2={132} c={c} f={f} />
      <line x1={600} y1={90} x2={600} y2={195} stroke={FAINT} strokeWidth="1.5" />
      <line x1={600} y1={195} x2={720} y2={195} stroke={FAINT} strokeWidth="1.5" />
      <rect x={614} y={155} width={24} height={40} fill={c} fillOpacity="0.2" stroke={c} filter={`url(#${f})`} />
      <rect x={650} y={125} width={24} height={70} fill={c} fillOpacity="0.35" stroke={c} filter={`url(#${f})`} />
      <rect x={686} y={100} width={24} height={95} fill={c} fillOpacity="0.5" stroke={c} filter={`url(#${f})`} />
      <Lbl x={660} y={215} text="CHART" size={9} ls="0.12em" />
      <Lbl x={805} y={84} text="INSIGHT" fill={c} size={10} ls="0.12em" />
      <rect x={745} y={96} width={125} height={99} rx="10" fill={c} fillOpacity="0.04"
        stroke={c} strokeWidth="1.4" filter={`url(#${f})`} />
      <TextLines x={758} y={120} w={99} n={4} gap={17} seedShrink={31} />
      <Chip x={580} y={250} text="always verify the numbers" c={c} f={f} dim />
      <Note x={450} y={330} c={c} lines={["Describe the data's shape, then ask one precise question at a time."]} size={15.5} />
    </g>
  );
}

/* 5-2 · Agentic Prompting & Tool Use */
function D52({ c, f }) {
  return (
    <g>
      <Head x={40} y={48} text="THE AGENT LOOP" c={c} />
      <Node cx={450} cy={92}  r={42} c={c} f={f} label="THINK" sub="plan next move" />
      <Node cx={672} cy={228} r={42} c={c} f={f} label="ACT" sub="call a tool" />
      <Node cx={228} cy={228} r={42} c={c} f={f} label="OBSERVE" sub="read result" />
      <Arrow x1={488} y1={112} x2={648} y2={196} c={c} f={f} bend={26} label="choose a tool" />
      <Arrow x1={628} y1={244} x2={274} y2={244} c={c} f={f} bend={30} label="result comes back" ly={306} />
      <Arrow x1={252} y1={196} x2={412} y2={112} c={c} f={f} bend={26} label="reason about it" />
      <Chip x={560} y={288} text="search" c={c} f={f} dim />
      <Chip x={638} y={288} text="calculator" c={c} f={f} dim />
      <Chip x={742} y={288} text="API" c={c} f={f} dim />
      <Arrow x1={488} y1={70} x2={608} y2={48} c={c} f={f} bend={-8} label="goal met" />
      <Box x={614} y={26} w={120} h={42} c={c} f={f} em label="DONE" labelSize={12} />
      <Note x={450} y={196} c={c} lines={['a prompt running in a loop', 'with eyes and hands']} size={15} />
    </g>
  );
}

/* ═══════════════════ MODULE 07 — PRODUCTION & MASTERY ═══════════════════ */

/* 6-0 · Prompt Management at Scale */
function D60({ c, f }) {
  return (
    <g>
      <Lbl x={150} y={72} text="PROMPT REGISTRY" fill={c} size={10.5} ls="0.12em" weight="700" />
      <Box x={50} y={90}  w={120} h={64} c={c} f={f} dash="4 5" label="v1" labelSize={12} />
      <Box x={70} y={110} w={120} h={64} c={c} f={f} dash="4 5" label="v2" labelSize={12} />
      <Box x={90} y={130} w={120} h={64} c={c} f={f} em label="v3 · live" labelSize={12} />
      <Arrow x1={210} y1={162} x2={296} y2={162} c={c} f={f} />
      <Box x={300} y={132} w={155} h={60} c={c} f={f} label="CI TESTS" sub="evals must pass" labelSize={12} />
      <Arrow x1={455} y1={162} x2={508} y2={162} c={c} f={f} />
      <Box x={512} y={132} w={140} h={60} c={c} f={f} label="DEPLOY" labelSize={12} />
      <Arrow x1={652} y1={162} x2={706} y2={162} c={c} f={f} />
      <path d="M 706 196 A 57 57 0 0 1 820 196" fill="none" stroke={c} strokeWidth="1.8" filter={`url(#${f})`} />
      <line x1={763} y1={196} x2={797} y2={152} stroke={c} strokeWidth="2.2" strokeLinecap="round" filter={`url(#${f})`} />
      <circle cx={763} cy={196} r="4" fill={c} />
      <Lbl x={763} y={222} text="MONITOR" fill={c} size={10} ls="0.12em" weight="700" />
      <Lbl x={763} y={238} text="drift · cost · quality" size={9} />
      <Arrow x1={763} y1={128} x2={165} y2={82} c={c} f={f} bend={-40} dash="4 7"
        label="regression? cut a new version" ly={38} />
      <Note x={450} y={315} c={c} lines={['Prompts are code: version them, test them, watch them in prod.']} size={15.5} />
    </g>
  );
}

/* 6-1 · Model Selection & Cross-Model */
function D61({ c, f }) {
  const tiers = [
    ['FAST + CHEAP',    'bulk · drafts · simple jobs', 62,  '$'],
    ['BALANCED',        'the everyday default',        155, '$$'],
    ['DEEP REASONING',  'hard, high-stakes work',      248, '$$$'],
  ];
  return (
    <g>
      <Head x={40} y={48} text="ROUTE THE TASK" c={c} />
      <Box x={45} y={155} w={140} h={58} c={c} f={f} label="THE TASK" />
      <Arrow x1={185} y1={184} x2={228} y2={184} c={c} f={f} />
      <polygon points="305,120 375,184 305,248 235,184" fill={c} fillOpacity="0.06"
        stroke={c} strokeWidth="1.7" filter={`url(#${f})`} />
      <Lbl x={305} y={179} text="WHAT" fill={INK} size={11} weight="700" />
      <Lbl x={305} y={196} text="MATTERS?" fill={INK} size={11} weight="700" />
      {tiers.map(([label, sub, y, price], i) => (
        <g key={label}>
          <Arrow x1={372} y1={184} x2={462} y2={y + 27} c={c} f={f} bend={i === 1 ? 0 : (i === 0 ? -22 : 22)} />
          <Box x={466} y={y} w={210} h={54} c={c} f={f} em={i === 1} label={label} sub={sub} labelSize={11.5} />
          <Chip x={692} y={y + 15} text={price} c={c} f={f} dim />
        </g>
      ))}
      <Note x={450} y={340} c={c} lines={['Use the cheapest model that clears your quality bar.']} size={15} />
    </g>
  );
}

/* 6-2 · Building Your PE Practice */
function D62({ c, f }) {
  const steps = [
    ['LEARN',      'fundamentals',   120, 244, 66],
    ['BUILD',      'real projects',  290, 194, 116],
    ['SHARE',      'write · teach',  460, 144, 166],
    ['SPECIALIZE', 'own a niche',    630, 94,  216],
  ];
  return (
    <g>
      <Head x={40} y={48} text="THE PRACTICE LADDER" c={c} />
      {steps.map(([label, sub, x, y, h], i) => (
        <g key={label}>
          <rect x={x} y={y} width={150} height={h} rx="10"
            fill={c} fillOpacity={0.04 + i * 0.025}
            stroke={c} strokeWidth="1.6" filter={`url(#${f})`} />
          <Lbl x={x + 75} y={y + 24} text={label} fill={INK} size={12} weight="700" ls="0.06em" />
          <Lbl x={x + 75} y={y + 41} text={sub} size={9.5} />
        </g>
      ))}
      <Arrow x1={140} y1={210} x2={700} y2={62} c={c} f={f} bend={-40} w={2.2} />
      <line x1={716} y1={90} x2={716} y2={56} stroke={c} strokeWidth="2" />
      <polygon points="716,56 748,64 716,72" fill={c} filter={`url(#${f})`} />
      <Note x={260} y={92} c={c} lines={['skills compound —', 'one project at a time']} size={15.5} />
    </g>
  );
}

/* ═══════════════════ MODULE 08 — ADVANCED FRONTIERS ═════════════════════ */

/* 7-0 · Multimodal & Vision Prompting */
function D70({ c, f }) {
  return (
    <g>
      <rect x={50} y={56} width={220} height={182} rx="8" fill="#101016"
        stroke={FAINT} strokeWidth="1.6" filter={`url(#${f})`} />
      <rect x={62} y={68} width={196} height={132} rx="4" fill="none" stroke={c} strokeOpacity="0.5" strokeWidth="1.2" />
      <path d="M 66 196 L 122 118 L 152 154 L 196 104 L 254 196 Z"
        fill={c} fillOpacity="0.14" stroke={c} strokeWidth="1.4" filter={`url(#${f})`} />
      <circle cx={95} cy={94} r="11" fill="none" stroke={c} strokeWidth="1.5" filter={`url(#${f})`} />
      <rect x={66} y={72} width={94} height={124} fill="none" stroke={INK}
        strokeDasharray="5 4" strokeWidth="1.3" filter={`url(#${f})`} />
      <Lbl x={113} y={214} text="← this region" fill={INK} size={9.5} />
      <Lbl x={160} y={228} text="IMAGE INPUT" size={9.5} ls="0.12em" />
      <Box x={50} y={252} w={220} h={52} c={c} f={f} labelSize={11}
        label={'"is the left trail passable?"'} />
      <Arrow x1={270} y1={150} x2={356} y2={172} c={c} f={f} bend={10} />
      <Arrow x1={270} y1={278} x2={360} y2={210} c={c} f={f} bend={-16} />
      <Node cx={410} cy={186} r={38} c={c} f={f} label="LLM" sub="sees + reads" />
      <Arrow x1={448} y1={186} x2={506} y2={186} c={c} f={f} />
      <Box x={510} y={156} w={200} h={62} c={c} f={f} em label="GROUNDED ANSWER" sub="describes what it sees" labelSize={11.5} />
      <Note x={800} y={180} c={c} lines={['point at regions,', 'ask specifics']} size={15} />
      <Note x={450} y={340} c={c} lines={['Vague looks get vague answers — direct the model’s eyes.']} size={15} />
    </g>
  );
}

/* 7-1 · Hallucination Detection & Mitigation */
function D71({ c, f }) {
  return (
    <g>
      <Chip x={60} y={48} text="confident tone ≠ truth" c={c} f={f} dim />
      <Box x={50} y={88} w={240} h={70} c={c} f={f} labelSize={11.5}
        label={'"The tower was finished'} sub={'in 1887 by 300 workers."'} />
      <Arrow x1={290} y1={123} x2={352} y2={123} c={c} f={f} />
      <Lbl x={458} y={72} text="VERIFY" fill={c} size={11} ls="0.16em" weight="700" />
      <rect x={356} y={84} width={205} height={112} rx="12" fill={c} fillOpacity="0.04"
        stroke={c} strokeWidth="1.6" filter={`url(#${f})`} />
      <Lbl x={374} y={116} text="☐ source named?"     fill={INK} size={11} anchor="start" />
      <Lbl x={374} y={142} text="☐ verifiable?"       fill={INK} size={11} anchor="start" />
      <Lbl x={374} y={168} text="☐ dated + specific?" fill={INK} size={11} anchor="start" />
      <Arrow x1={561} y1={110} x2={634} y2={92}  c={c} f={f} bend={-10} />
      <Arrow x1={561} y1={170} x2={634} y2={188} c={c} f={f} bend={10} />
      <Box x={638} y={64}  w={210} h={54} c={c} f={f} em label="CONFIRMED" sub="keep it" labelSize={12} />
      <Mark x={872} y={91} ok />
      <Box x={638} y={162} w={210} h={54} c={c} f={f} dash="5 5" label="FLAGGED" sub="demand sources · re-check" labelSize={12} />
      <Mark x={872} y={189} ok={false} />
      <Chip x={300} y={242} text={'"cite sources + rate your confidence 0-10"'} c={c} f={f} />
      <Note x={450} y={320} c={c} lines={['Models are rewarded for sounding right — you are the fact-checker.']} size={15.5} />
    </g>
  );
}

/* 7-2 · Conversational Design & Memory Management */
function D72({ c, f }) {
  const bubbles = [
    [60, 44,  true], [92, 86, true],
    [60, 128, false], [92, 170, false], [60, 212, false], [92, 254, false],
  ];
  return (
    <g>
      {bubbles.map(([x, y, old], i) => (
        <g key={i} opacity={old ? 0.35 : 1}>
          <rect x={x} y={y} width={170} height={32} rx="16"
            fill={c} fillOpacity={old ? 0.03 : 0.07}
            stroke={c} strokeOpacity={old ? 0.4 : 0.8}
            strokeDasharray={old ? '4 4' : undefined} strokeWidth="1.3" filter={`url(#${f})`} />
          <TextLines x={x + 18} y={y + 19} w={old ? 90 : 120} n={1} c={old ? 'rgba(255,255,255,0.10)' : FAINT} />
        </g>
      ))}
      <path d="M 282 128 h 10 v 158 h -10" fill="none" stroke={c} strokeWidth="1.6" filter={`url(#${f})`} />
      <Lbl x={312} y={150} text="CONTEXT WINDOW" fill={c} size={10} ls="0.1em" anchor="start" weight="700" />
      <Lbl x={312} y={166} text="only this survives" size={9} anchor="start" />
      <Arrow x1={230} y1={56} x2={470} y2={96} c={c} f={f} bend={-24} dash="4 6" label="older turns fall out" />
      <Box x={474} y={72} w={190} h={60} c={c} f={f} em label="SUMMARY" sub="compress the past" />
      <Arrow x1={568} y1={132} x2={310} y2={206} c={c} f={f} bend={30} label="re-inject as context" lx={470} ly={215} />
      <Note x={740} y={200} c={c} lines={['the window slides —', 'summarize before', 'it forgets']} size={15} />
      <Note x={450} y={340} c={c} lines={['Long chats need memory management, not longer prompts.']} size={15} />
    </g>
  );
}

/* 7-3 · Meta-Prompting: AI-Assisted Prompt Design */
function D73({ c, f }) {
  const sheet = ['ROLE: senior editor', 'TASK: rewrite for…', 'RULES: keep facts…', 'FORMAT: markdown'];
  return (
    <g>
      <Head x={40} y={48} text="PROMPTS THAT WRITE PROMPTS" c={c} />
      <Box x={40} y={86} w={190} h={64} c={c} f={f} label="YOUR GOAL" sub={'"I need a prompt that…"'} />
      <Arrow x1={230} y1={118} x2={282} y2={118} c={c} f={f} />
      <Node cx={322} cy={118} r={36} c={c} f={f} label="LLM" />
      <Lbl x={322} y={172} text="writes the prompt" size={9.5} />
      <Arrow x1={358} y1={118} x2={416} y2={118} c={c} f={f} />
      <Lbl x={525} y={60} text="GENERATED PROMPT" fill={c} size={10} ls="0.1em" />
      <rect x={420} y={72} width={210} height={112} rx="10" fill={c} fillOpacity="0.05"
        stroke={c} strokeWidth="1.5" filter={`url(#${f})`} />
      {sheet.map((ln, i) => (
        <text key={i} x={435} y={100 + i * 23} fontFamily={MONO} fontSize="11.5" fill={INK}>{ln}</text>
      ))}
      <Arrow x1={630} y1={128} x2={696} y2={128} c={c} f={f} label="test it" lx={663} ly={110} />
      <Box x={700} y={98} w={160} h={60} c={c} f={f} label="RESULTS" sub="good bits · gaps" labelSize={12.5} />
      <Arrow x1={760} y1={158} x2={350} y2={148} c={c} f={f} bend={52} dash="4 6"
        label={'"here are the gaps — refine it"'} ly={242} />
      <Note x={450} y={320} c={c} lines={['The model is remarkably good at improving its own instructions.']} size={15.5} />
    </g>
  );
}

/* ── Fallback for any lesson without a bespoke diagram ───────────────────── */
function DFallback({ c, f }) {
  return (
    <g>
      <Node cx={450} cy={170} r={64} c={c} f={f} label="✦" />
      <Note x={450} y={290} c={c} lines={['Illustrated guide — see the notes below.']} size={16} />
    </g>
  );
}

/* ── Diagram registry ────────────────────────────────────────────────────── */
const DIAGRAMS = {
  '0-0': D00, '0-1': D01, '0-2': D02,
  '1-0': D10, '1-1': D11, '1-2': D12, '1-3': D13,
  '2-0': D20, '2-1': D21, '2-2': D22, '2-3': D23,
  '3-0': D30, '3-1': D31,
  '4-0': D40, '4-1': D41, '4-2': D42,
  '5-0': D50, '5-1': D51, '5-2': D52,
  '6-0': D60, '6-1': D61, '6-2': D62,
  '7-0': D70, '7-1': D71, '7-2': D72, '7-3': D73,
};

/* ── Main component ──────────────────────────────────────────────────────── */
export default function LessonArt({ mi, li, color, tag, title }) {
  const f = 'la-wob';
  const D = DIAGRAMS[`${mi}-${li}`] || DFallback;
  return (
    <svg viewBox="0 0 900 400" role="img"
      aria-label={`Concept diagram: ${title}`}
      style={{ display: 'block', width: '100%', height: 'auto' }}>
      <defs>
        <filter id={f} x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" />
        </filter>
        <pattern id="la-grid" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.1" fill="rgba(255,255,255,0.05)" />
        </pattern>
      </defs>

      {/* canvas */}
      <rect x="1" y="1" width="898" height="398" rx="16" fill="#0b0b10" stroke="rgba(255,255,255,0.08)" />
      <rect x="1" y="1" width="898" height="398" rx="16" fill="url(#la-grid)" />

      {/* corner ticks */}
      {[[14, 14, 1, 1], [886, 14, -1, 1], [14, 386, 1, -1], [886, 386, -1, -1]].map(([x, y, sx, sy], i) => (
        <path key={i} d={`M ${x + 12 * sx} ${y} L ${x} ${y} L ${x} ${y + 12 * sy}`}
          fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="1.5" />
      ))}

      <D c={color} f={f} />

      {/* caption bar */}
      <line x1="24" y1="366" x2="876" y2="366" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <text x="24" y="384" fontFamily={MONO} fontSize="10" letterSpacing="0.14em"
        fill={color} fillOpacity="0.9">
        {`FIG. ${tag}.${String(li + 1).padStart(2, '0')} — ${title.toUpperCase()}`}
      </text>
      <text x="876" y="384" textAnchor="end" fontFamily={MONO} fontSize="8.5"
        letterSpacing="0.12em" fill="#52525b">PROMPTMASTERY · ILLUSTRATED GUIDE</text>
    </svg>
  );
}
