# AI Synthesis Layer Philosophy

This document explains how Team DNA should think about deterministic Big Five logic, future AI-generated insight, and the frontend data shape. The goal is simple: a real engineer should be able to plug in scores and get a useful product, while a future AI layer can make the same product feel much more specific and alive without creating a second UI path.

## The Layered Model

Team DNA should have four conceptual layers:

1. **Raw assessment data**
   - Big Five scores.
   - Team/member metadata such as name, role, avatar, and pronouns.
   - Future open-ended assessment answers about working style, feedback, pressure, motivation, and collaboration.

2. **Deterministic fallback**
   - Big Five visualizations.
   - Archetype/title fallback.
   - Team, person, and duo superpower blurbs.
   - Watch-outs and spectrum readouts.
   - This layer must work from scores alone.

3. **AI synthesis**
   - Richer title, summary, and supporting cards generated from scores plus open-ended assessment answers.
   - This layer should make the output feel specific to the person, pair, or team in ways scores alone cannot.
   - AI should enrich the same data shape, not create a separate frontend experience.

4. **UI rendering**
   - The UI renders `TeamDnaInsight`.
   - The UI should not care whether the insight came from deterministic fallback, backend-authored copy, or AI synthesis.

The important rule:

```txt
scores -> deterministic insight
scores + richer answers -> AI synthesis
both -> same TeamDnaInsight shape
```

## Why This Matters

The Big Five is a strong base map, but it is not the whole terrain. It can tell us that someone is high in openness or low in extraversion; it cannot fully explain what kind of project gives them energy, how feedback lands for them, what teammates often misunderstand about them, or what conditions make a pair work beautifully together.

The deterministic layer gives the product a stable floor:

- Explainable.
- Fast.
- Works without AI.
- Easy to test.
- Easy for engineers to integrate.

The AI layer gives the product a richer ceiling:

- Specific.
- Context-aware.
- Able to use open-ended answers.
- Able to make titles and blurbs feel uniquely fitted to a real person or pair.

Do not throw away the deterministic layer. It is the fallback, the visual grounding, and the safety net. The AI layer should sit on top of it.

## What AI Should Own

AI is strongest on content that needs specificity and synthesis:

- Person archetype/title.
- Person superpower blurb.
- Duo archetype/title.
- Duo superpower blurb.
- `How to work with him/her/them` cards.
- `Where he/she/they shine` / `Where this pair shines` / `Where this team shines` cards.
- Misread guidance as a subsection inside "How to work with him/her/them" or "Working together."
- Working-together guidance for duos.

AI should use the deterministic score patterns as grounding. If the AI claims something that strongly contradicts the scores, the backend should either reject it, regenerate it, or mark it for review.

## What AI Should Not Own

AI should not be the source of truth for:

- Raw Big Five scores.
- Spectrum positions.
- Team range/density visualizations.
- Baseline trait labels and endpoints.
- Basic assessment completion state.
- The frontend layout or interaction model.

Those should remain stable and deterministic.

## Future Data Shape

The frontend should receive the same shape regardless of where insight prose comes from:

```ts
type TeamDnaInsight = {
  id: string;
  source?: 'deterministic' | 'ai' | 'override';
  generatedAt?: string;
  inputVersion?: string;
  eyebrow: string;
  title: string;
  summary: Array<{ text: string; emphasis?: boolean }>;
  cards: TeamDnaInsightCard[];
};

type TeamDnaInsightCard = {
  id: string;
  label: string;
  kind?: string;
  showLabel?: boolean;
  data?: unknown;
};
```

The local prototype can mock AI output by placing `source: 'ai'` insight records in the fixture data. That is acceptable as long as the mock uses the same shape the real backend would later return.

## How The Adapter Should Resolve Content

The route/data adapter should resolve insights in this order:

1. Use AI synthesis if present and valid.
2. Use explicit backend/content override if present.
3. Fall back to deterministic insight generation from scores.

Conceptually:

```ts
const insight =
  aiInsightForSelection ??
  explicitInsightOverride ??
  buildDeterministicInsightFromScores(selection);
```

The components should only receive the resolved `TeamDnaInsight`.

## Future Assessment Inputs

If Team DNA adds AI synthesis, the assessment should probably collect more than Big Five answers. Useful open-ended prompts might include:

- When I am doing my best work, you will usually see me...
- The kind of work that gives me energy is...
- The kind of work that drains me is...
- Feedback lands best when...
- Feedback shuts me down when...
- When I disagree, I usually...
- When I am under pressure, I need teammates to...
- A common misunderstanding people have about me is...
- Pairing with me works best when...
- One thing I am trying to get better at is...

These answers let the AI produce insight that scores alone cannot produce. The raw answers may be sensitive, so the product should decide carefully whether raw answers are visible to teammates or only the synthesized output is visible.

## Cards Enabled By AI

The first AI-backed cards worth exploring:

- **How to work with him/her/them**
  - How to ask this person for input.
  - How to challenge them.
  - How feedback should be framed.
  - What helps under pressure.

- **Where he/she/they shine / Where this pair shines / Where this team shines**
  - Where this person, pair, or team is likely to make the strongest contribution.
  - Examples: early exploration, closing execution, stakeholder alignment, risk spotting, critique, synthesis, facilitation, quality control.

- **Working together**
  - What this duo is good for.
  - What this duo should avoid.
  - How to run a working session together.
  - How to know friction is becoming unproductive.

Guidance cards can include small mono sublabels for specific sections such as
"Start here," "Keep visible," and "Do not misread." This keeps misread copy
near the working guidance instead of making it feel like a separate category.

These cards should still be normal `insight.cards`. They should not require a new panel architecture.

## Prototype Stance

For now, the prototype should treat AI synthesis as mocked backend output. If we add AI-shaped fixture content, it should live exactly where real AI output would live later. That keeps the prototype honest: it demonstrates the future feature without wiring a fake one-off frontend path.

The fallback remains important. If AI output is missing, stale, or disabled, the page should still render from scores.
