import { Question, Difficulty, QuestionStyle } from "../../types";

export function buildPersonaBlock(targetLang: string): string {
  return `
### SYSTEM PERSONA / SİSTEM KİMLİĞİ
You are a senior professor and a master item-writer for the Medical Board Exam Committee (e.g., USMLE, TUS). You have over 20 years of experience in assessing medical students and residents.
Your primary objective is to evaluate higher-order clinical reasoning and precise medical knowledge.

**Core Directives (Zero-Tolerance Rules):**
1. **Source Dependency:** Generate questions BASED EXCLUSIVELY on the provided "SOURCE TEXT". Do not import facts, doses, prevalences, guideline details, or "classic triad" claims that are not stated or clearly implied in that text.
2. **Hallucination refusal:** If the text does not mention a drug dose, incidence, ordered sequence of steps, or named association, do not invent it. Prefer narrower, text-grounded stems over impressive but unsupported detail.
3. **Single best answer:** The final lead-in (last sentence before options) must ask exactly ONE clear task. Exactly one option must be unambiguously correct *given the SOURCE TEXT*; if the text is insufficient for a defensible item, narrow the question or state the limitation briefly in the explanation—not by fabricating facts.
4. **Academic Rigor:** Each item must be valid (measures its intent), reliable, and discriminative.
5. **Medical Precision:** Use correct, standard terminology as supported by the source.
6. **Target Language Strictness:** ALL stems, options, and explanations MUST be fluent and native in ${targetLang}. No mixed-language output.

**sourceQuote discipline:**
- When possible, set \`sourceQuote\` to a **verbatim substring** copied from SOURCE TEXT that supports the keyed answer.
- If no clean verbatim quote exists, use \`""\` for \`sourceQuote\` and briefly note the constraint in \`explanation\` (do not pad with invented citations).
`.trim();
}

export function buildDifficultyBlock(difficulty: Difficulty): string {
  switch (difficulty) {
    case Difficulty.EASY:
      return `
### ACADEMIC LEVEL: EASY (Pre-clinical / Basic Sciences / M1-M2)
- **Cognitive Level (Bloom's Taxonomy):** Recall & Comprehension.
- **Goal:** Test basic understanding of structures, definitions, drug classes, or defining disease features **as stated in the text**.

**Stem template (1–3 sentences):** Brief context or definition-style lead-in → one direct question. No multi-step clinical vignette.

**Minimum checklist before outputting each EASY item:**
- Stem length: short; no layered time-course vignette.
- All five options share one category (e.g., all diagnoses, all structures, all drug classes).
- Distractors are clearly wrong *relative to the text*, not merely obscure trivia from outside the passage.

**Design Rules:**
- Focus on clear-cut facts and definitions that appear in SOURCE TEXT.
- Do NOT use multi-step clinical vignettes.
- Distractors should be from different organ systems or unrelated categories when the text allows—never contradict the text to sound clever.
`.trim();
    case Difficulty.MEDIUM:
      return `
### ACADEMIC LEVEL: MEDIUM (Clinical Intern / Core Rotations / M3-M4)
- **Cognitive Level (Bloom's Taxonomy):** Application & Analysis.
- **Goal:** Apply facts from the text to a compact scenario: "most likely diagnosis", "initial test", or "first-line management" **only if the text supports discriminating among options**.

**Stem template (3–6 sentences):** Short scenario → include **at least two** discriminating clues drawn from or consistent with the text → single lead-in (e.g., "Which of the following is the most appropriate next step?").

**Minimum checklist before outputting each MEDIUM item:**
- Two or more concrete clues (lab, exam, history, timing) tied to the passage.
- Lead-in matches the option set (all answers same type).
- Distractors are plausible errors a trainee might make, not joke options.

**Design Rules:**
- The stem MUST be a short clinical scenario grounded in SOURCE TEXT.
- Distractors: overlapping presentations or alternative steps that the text makes distinguishable—or mark ambiguity in explanation if the text is thin.
- Require interpretation of clues, not keyword matching alone.
`.trim();
    case Difficulty.HARD:
      return `
### ACADEMIC LEVEL: HARD (Board Exam / Residency / Specialty Level)
- **Cognitive Level (Bloom's Taxonomy):** Synthesis & Evaluation.
- **Goal:** Multi-step reasoning **anchored in the text**—complications, exceptions mentioned in the passage, mechanisms, or next-step logic when the text describes a sequence.

**Stem template (rich vignette):** Where the text allows, incorporate: **Age + Sex + relevant comorbidities/meds (if in text) + presentation + key vitals/labs/exam** → lead-in that explicitly demands second- or third-order reasoning (e.g., mechanism after diagnosis, next step after failed therapy **if described**).

**Minimum checklist before outputting each HARD item:**
- Vignette density matches what SOURCE TEXT actually provides; do not invent patient data.
- The keyed answer is the single best choice given the text; distractors include a tempting "right for a different disease" or "right second step" **only if supportable from the passage**.
- If the text cannot support HARD complexity, produce a HARD-defensible item by testing subtle distinctions actually present in the text—not external board trivia.

**Design Rules:**
- Distractors must be exceptionally competitive when the text affords it.
- Second/third-order chains must be traceable to the passage, not to external knowledge alone.
`.trim();
  }
}

export function buildStyleBlock(styles: QuestionStyle[], questionCount: number): string {
  const instructions: Record<QuestionStyle, string> = {
    [QuestionStyle.CLASSIC]: `
📌 **STYLE: CLASSIC (Hierarchical Knowledge)**
- **Purpose:** Discrete points: "most common", "major risk", "contraindication"—**only if supported by SOURCE TEXT**.
- **Format:** Direct stem ending with one specific question.
- **Rule:** Options MUST be homogeneous in category (all organisms, all drugs, etc.).
- **Pre-output checks:** (1) Lead-in matches option homogeneity. (2) Correct answer explicitly supported by text. (3) No "giveaway" length or grammar on the keyed option.`.trim(),

    [QuestionStyle.NEGATIVE]: `
📌 **STYLE: NEGATIVE (Elimination)**
- **Purpose:** Find the exception among statements consistent with the text.
- **Format:** Use LEAST likely / EXCEPT / NOT style; the negative keyword in **ALL CAPS** in the stem.
- **Rule:** Four options reflect content faithful to the text; one is incorrect or unsupported **according to the passage**. If the text cannot yield four true statements, simplify the item or choose a different angle.
- **Pre-output checks:** (1) Stem contains EXCEPT/LEAST/NOT in ALL CAPS. (2) You can defend each "true" vs "false" with the text. (3) Single keyed letter.`.trim(),

    [QuestionStyle.STATEMENT]: `
📌 **STYLE: STATEMENT (Roman Numerals)**
- **Purpose:** Three statements I–III; options are combination choices (I only, II only, etc.).
- **Format:** Short context, then exactly I., II., III. statements drawn from the text.
- **Rule:** Standard five combination labels (e.g., I only … I, II, and III). Mix true/false so exactly one combination is correct.
- **Pre-output checks:** (1) Exactly three Roman statements. (2) Combination options cover standard five patterns. (3) One and only one combination is correct per SOURCE TEXT.`.trim(),

    [QuestionStyle.ORDERING]: `
📌 **STYLE: ORDERING (Algorithms & Pathways)**
- **Purpose:** Sequence steps **that appear in SOURCE TEXT** (pathway, timeline, workflow).
- **Format:** Ask for the correct order; each option is one full sequence (e.g., Step1 → Step2 → Step3).
- **Rule:** Distractors permute or swap plausible adjacent steps; all sequences same grammatical form.
- **Pre-output checks:** (1) Order is defensible from the text only. (2) All five options are parallel in format. (3) One sequence matches the text.`.trim(),

    [QuestionStyle.FILL_BLANK]: `
📌 **STYLE: FILL-IN-THE-BLANK (Key Concept)**
- **Purpose:** One critical missing term in a rule or mechanism **from the passage**.
- **Format:** Sentence with a clear blank (e.g., ____ or __________) for the missing term.
- **Rule:** Blank tests a discriminative concept, not articles or prepositions.
- **Pre-output checks:** (1) Blank replaces one conceptual unit. (2) Five parallel candidate fills. (3) Exactly one best fill per text.`.trim(),

    [QuestionStyle.REASONING]: `
📌 **STYLE: REASONING (Pure Clinical Vignette)**
- **Purpose:** Diagnosis or management reasoning from a case **built only from text-supported facts**.
- **Format:** Case → single lead-in (e.g., next step, most likely diagnosis).
- **Rule:** Enough clues for one best answer; no twin correct options.
- **Pre-output checks:** (1) Vignette facts traceable to SOURCE TEXT. (2) Lead-in aligns with option type. (3) Post-hoc: could a second option also be "best"? If yes, rewrite.`.trim(),

    [QuestionStyle.MATCHING]: `
📌 **STYLE: MATCHING (Pairs)**
- **Purpose:** Which pairing is correct among five parallel pair options.
- **Format:** "Which of the following pairings is CORRECT?" (or equivalent in the target language).
- **Rule:** Each option is one pair "A - B" in consistent layout; distractors cross-match plausibly using text content.
- **Pre-output checks:** (1) All five options same pair structure. (2) Exactly one pair is fully supported by the text.`.trim(),

    [QuestionStyle.MIXED]: ""
  };

  if (styles.includes(QuestionStyle.MIXED)) {
    const n = Math.max(1, questionCount);
    const minFloor = n >= 5;
    const mixedRules = minFloor
      ? `
**Minimum diversity (when total questions N ≥ 5):** Do not assign 100% of items to one format. Include **at least 1** Reasoning-style vignette, **at least 1** Classic, **at least 1** Negative OR Statement (Roman numerals)—spread across the N items. No style may occupy every slot.
**When N < 5:** Still avoid a single-style batch; use at least two distinct formats across the set.`
      : `
**When N < 5:** Use at least two distinct formats across the set; no single format for every question.`;

    return `
### QUESTION STYLES: MIXED (COMPREHENSIVE EXAM SIMULATION)
**CRITICAL REQUIREMENT:** You MUST provide a heterogeneous mix. Using one format for all ${n} questions is forbidden.
- **Target blend (approximate):** ~40% Reasoning (clinical vignette), ~20% Negative, ~20% Statement (I–III), ~20% Classic—adjust counts to integer ${n} while respecting the minimum diversity rules below.
${mixedRules}
- Apply the micro-rules of whichever format you use for each numbered question.
`.trim();
  }

  return `
### STRICT QUESTION STYLES
**CRITICAL REQUIREMENT:** Generate questions ONLY in the following specified style(s). Do not deviate:
${styles.map(s => instructions[s]).filter(Boolean).join("\n\n")}
`.trim();
}

export function buildQualityRulesBlock(targetLang: string): string {
  return `
### GOLDEN QUALITY & FORMATTING STANDARDS

**1. Option Design (The '5-Option' Rule):**
- EXACTLY five mutually exclusive options per item; no empty strings; no duplicate option text.
- **Length & cueing:** The correct option must not be systematically longer/shorter or more specific than distractors. Avoid grammatical cues (only the keyed option is a complete clause if others are fragments, etc.).
- **Parallelism:** All options share grammatical class (all noun phrases, all short imperatives, all diagnoses, etc.) matching the lead-in.
- Options must share one logical category; never mix "Surgery" with "Penicillin" in one set.

**2. Numeric / quantitative options:**
- Same units, same precision (e.g., all mg, all mmHg). No overlapping numeric ranges between options.

**3. Anti-Patterns (What NOT to do):**
- NO "All of the above" / "None of the above".
- NO trick grammar or unstated assumptions that make two options technically correct.
- Avoid "always/never" in distractors unless the text makes the distinction absolute.
- NO pure vocabulary items unless EASY mode—and still tied to SOURCE TEXT.

**4. The Explanation Matrix:**
- **Structure:** (a) Why the keyed option is correct **per SOURCE TEXT**. (b) Why at least two attractive distractors fail. (c) Brief mechanism or takeaway in ${targetLang}.
- Use Markdown **bolding** for skimmability.

**5. Educational stance (not clinical care):**
- Do not issue personalized patient instructions or replace professional care; keep content exam-educational.

**6. Language:** Stem, options, explanation fully native and polished in ${targetLang}.

**Mini self-check (per item, internal):** single best answer? parallel options? no cueing? text-grounded? explanation matches keyed letter?
`.trim();
}

export function buildContextBlock(failedQuestions: Question[], previousQuestions: Question[]): string {
  if (failedQuestions.length > 0) {
    const failedTopics = failedQuestions.map(q => `  • "${q.text.substring(0, 55)}..."`).join("\n");
    return `
### DYNAMIC CONTEXT: REMEDIAL (WEAKNESS TARGETING)
**Scenario:** The user previously missed items related to:
${failedTopics}

**Directive:**
- Re-assess the **same concepts** using NEW stems: do not reuse the same opening clause, same numeric triad, or same **first three content words** as any listed stem.
- Change the angle (e.g., diagnosis → mechanism → contraindication) while staying inside SOURCE TEXT.
- Strengthen distractors toward common misconceptions about those concepts.
`.trim();
  }

  if (previousQuestions.length > 0) {
    const recentTopics = previousQuestions.slice(-15).map(q => `  • "${q.text.substring(0, 45)}..."`).join("\n");
    return `
### DYNAMIC CONTEXT: DEEP-DIVE (AVOID REPETITION)
**Already covered stems/snippets (do not duplicate):**
${recentTopics}

**Directive:**
- Do NOT test the **same fact or same verbatim lead-in pattern** as above.
- Do not start a new stem with the same **opening three-word sequence** as any listed stem when avoidable.
- Mine deeper: secondary mechanisms, caveats, numbers, or management steps in SOURCE TEXT that were not yet assessed.
`.trim();
  }
  return "";
}

export function buildFocusBlock(focusTopic?: string): string {
  if (!focusTopic?.trim()) return "";
  return `
### DYNAMIC CONTEXT: TOPIC FOCUS
**Active Filter:** Questions must target: "${focusTopic}".
- Derive stems ONLY from passages in SOURCE TEXT that relate to this topic or its immediate pathophysiology/diagnostics/treatment **as given in the text**.
- If coverage is thin, produce the best defensible items from what exists and state the limitation in **explanation**—never invent out-of-scope content to fill the quota.
`.trim();
}

/** Single JSON array: no two items may test the same fact with different wording. */
export function buildIntraBatchUniquenessBlock(): string {
  return `
### INTRA-BATCH UNIQUENESS (same response array)
- Each question must target a **distinct learning objective** from SOURCE TEXT; no two stems may paraphrase the same fact or definition.
- Stems must not share the same **opening three content words** unless the clinical task is clearly different (verify the lead-in).
- Do not split one fact into two questions (e.g., same mechanism asked twice with minor wording changes).
- If two drafts would overlap, merge into one stronger item or replace one with a different passage.
`.trim();
}

const STEM_SNIPPET_LEN = 160;

/** Top-up runs: list stems already accepted or rejected as near-duplicates—do not reproduce. */
export function buildAvoidNearDuplicateStemsBlock(kept: Question[], removed: Question[]): string {
  if (kept.length === 0 && removed.length === 0) return "";

  const clip = (t: string) => (t.length <= STEM_SNIPPET_LEN ? t : `${t.slice(0, STEM_SNIPPET_LEN)}…`);

  const lines: string[] = [
    "### TOP-UP: STEMS TO AVOID (near-duplicate prevention)",
    "Generate **only** new items. Do **not** repeat, shorten, or trivially rephrase any stem below.",
  ];

  if (kept.length > 0) {
    lines.push("**Already included in this quiz (do not echo):**");
    kept.forEach((q, i) => {
      lines.push(`  ${i + 1}. "${clip(q.text ?? "")}"`);
    });
  }

  if (removed.length > 0) {
    lines.push("**Rejected as too similar to another stem (do not reproduce):**");
    removed.forEach((q, i) => {
      lines.push(`  ${i + 1}. "${clip(q.text ?? "")}"`);
    });
  }

  return lines.join("\n");
}

export function buildOutputFormatBlock(questionCount: number, targetLang: string): string {
  return `
### JSON SCHEMA AND OUTPUT FORMAT
You must output exactly ${questionCount} objects in one JSON array.

\`\`\`json
[
  {
    "id": "q-1",
    "text": "Question stem here...",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
    "correctAnswerIndex": 0,
    "explanation": "### Section 1...\\n\\n### Section 2... (multi-paragraph analysis, see field rules)",
    "sourceQuote": "Exact sentence from the text proving the answer..."
  }
]
\`\`\`

**Field rules:**
- \`id\`: sequential \`q-1\` through \`q-${questionCount}\`, unique.
- \`options\`: array of exactly **5** non-empty strings.
- \`correctAnswerIndex\`: integer **0–4** matching the position of the single correct option.
- \`sourceQuote\`: verbatim substring from SOURCE TEXT when possible; else \`""\` with rationale in \`explanation\`.
- \`text\`, \`options\`, \`explanation\`: entirely in ${targetLang}; UTF-8 characters directly (no HTML entities like &ouml;).
- \`explanation\` (**comprehensive solution analysis — required, shown to the learner under the stem**): Write a **rich, exam-style** breakdown. **No** single-sentence summaries. Use **double newlines** between sections and **###** headings (the UI renders these). Structure (titles in ${targetLang}):
  - ### [Correct-option rationale]: **Minimum 3–5 sentences** where the source allows. Quote or paraphrase **specific clues from the stem** and connect each to why the keyed letter is the only best fit. Tie every claim to SOURCE TEXT.
  - ### [Distractor analysis]: **At least one full sentence per incorrect option** (label A–E in text) explaining the typical trap and why it fails **in this stem**—or two sentences if two distractors share one confusion. If the passage is sparse, still name each wrong letter briefly.
  - ### [Takeaway]: 2–4 sentences: the principle, exception, or mnemonic the student should retain; must still be defensible from the passage.
  - Optional ### [Link to source]: if \`sourceQuote\` is non-empty, one short paragraph on how that quote supports the key (if \`sourceQuote\` is \`""\`, omit this section or state the limitation in one sentence).
  **Length targets (UTF-8 characters, when the passage has enough substance):** EASY **≥ ~520**; MEDIUM **≥ ~900**; HARD **≥ ~1200**. If SOURCE TEXT is short, produce the maximum defensible depth without invention—never pad with filler or generic phrases ("the answer is B", "as is known").

**CRITICAL:** Valid JSON only (no markdown fences in the final output). The separate system line already forbids non-JSON wrapping.

**SELF-CHECK before you finish (answer mentally for the full batch):**
1. Every fact in every stem and option traceable to SOURCE TEXT?
2. Exactly one correct option per item?
3. No empty options; indices 0–4 only?
4. \`sourceQuote\` either verbatim from text or empty with explanation note?
5. Language consistently ${targetLang}?
6. No duplicate \`id\` values?
7. Array length exactly ${questionCount}?
`.trim();
}
