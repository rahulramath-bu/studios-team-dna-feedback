# Surface 1 Agent Handoff

This is a temporary handoff note for the next AI agent/session. It is not a
finished spec. The next phase is partly about creating the Surface 1 spec while
building enough of the assessment experience to feel whether Scott's proposal
works in practice.

## Current Goal

Build Surface 1: the Team DNA assessment path.

Start by implementing a fairly direct version of Scott Baker's assessment
proposal, then use the working prototype to decide what should become more
delightful, shorter, stranger, more visual, more conversational, or more
experimental.

The intention is not to lock the final assessment model immediately. The
intention is to make Scott's proposal tangible enough that Preetoshi can react
to the actual experience instead of debating it abstractly.

## Product Context

Surface 2 already exists as the Team DNA results experience. It shows:

- Team-level reads.
- Individual profile reads.
- Duo collaboration reads.
- Big Five interpretation.
- Role distribution.
- Strengths, watch-outs, meeting behavior, and how-to-work-with guidance.
- AI lifecycle and fallback behavior.
- Own-profile editing for editable generated copy.

Surface 2 was built with a strong philosophy:

- Human first, not score first.
- Strengths framed honestly.
- Watch-outs as overextensions of strengths.
- AI as enrichment, not the foundation.
- Deterministic fallback data should still be useful.
- The code should be easier for engineering to port than a static design file.

Surface 1 should respect that same philosophy, but it should be allowed to feel
more like an onboarding/assessment experience than a results dashboard.

## Current Route Boundaries

The prototype now has only two real surface routes:

```txt
/assessment -> Surface 1
/team-dna   -> Surface 2
```

The root route `/` is only a local prototype hub.

Older aliases like `/results`, `/surface-1`, and `/surface-2` were removed so
engineering does not inherit confusing route language.

Current files:

```txt
src/team-dna-assessment/TeamDnaAssessmentPage.jsx
src/team-dna-assessment/teamDnaAssessment.css
```

Surface 1 is currently only a parked placeholder. It is intentionally clean.

## Engineering Portability Goal

This repo should be easy for engineering to build from.

Do not treat Surface 1 and Surface 2 as two random standalone prototypes. Treat
them as two product surfaces connected by a contract:

```txt
Surface 1 collects signals -> shared contract/result shape -> Surface 2 renders reads
```

The next important engineering seam is likely a shared contract folder, for
example:

```txt
src/team-dna-contract/
```

That contract should describe the assessment output/result shape that Surface 1
creates and Surface 2 consumes. It should not contain Surface 1 UI or Surface 2
UI. Keep it boring and practical.

Likely contract responsibilities:

- Big Five trait scores.
- Working style scores.
- Assessment completion state.
- Person/result identifiers.
- Any context fields needed by the AI generation pass.
- Eventually, versioning for the assessment schema.

Do not let Surface 1 import Surface 2 components. Do not let Surface 2 depend
on Surface 1 screen internals.

## Monolith Assessment Engine Compatibility

A major unlock from Jon's monolith discovery: Surface 1 should be framed as a
bespoke assessment experience backed by the existing assessment engine, not as a
replacement for the assessment engine.

The mental model:

```txt
custom Team DNA assessment UI
-> preserves assessment engine contract
-> submits normal assessment responses
-> engine keeps scoring/reporting/analytics/lifecycle ownership
```

Jon's read is that the backend is not tightly coupled to the visual renderer. A
custom frontend can likely change journey, layout, grouping, interaction,
motion, and transitions as long as the submitted data still matches what the
engine expects.

The next agent should inspect the monolith directly, especially:

```txt
/Users/preetoshi/Documents/BetterUp Monolith/ux/apps/react-platform/src/assessments/routes/RouteAssessmentDetails.tsx
/Users/preetoshi/Documents/BetterUp Monolith/ux/packages/assessments/src/hooks/assessments.ts
/Users/preetoshi/Documents/BetterUp Monolith/packs/assessments/engine/app/models/concerns/construct_scoring.rb
```

Important contract details from Jon's discovery:

- Fetch/create an `Assessment`.
- Use its resolved `assessment_configuration.assessment_items`.
- Render each item however the experience wants.
- Respect `item_type`, options, required state, and skip behavior.
- Store answers as `responses[item.key] = value`.
- Submit through the normal assessment update/submission lifecycle.
- Preserve `submitted: true` timing / submitted state semantics.

Be careful not to casually change:

- `AssessmentItem#key`
- response value shape
- option values for scored questions
- which required/skipped items are included
- dynamic item exclusion behavior
- post-submit redirect/report behavior

The safest design direction is:

```txt
assessment engine = system of record
Surface 1 = custom renderer / guided experience
AI = host, transition layer, summarizer, or mapper around known fields
```

AI can sit around the assessment without breaking the engine. For example, it
could introduce sections, make transitions feel more personal, summarize a free
text response, or route among known questions. But the actual capture moments
should still map back to known assessment items and expected response values.

For flexible qualitative moments, a useful pattern is:

```txt
AI asks or follows up conversationally
-> AI distills the exchange into a known textarea item
-> user can review/edit/approve the captured text
-> normal assessment submission stores that textarea response
```

This is one of the central design constraints for Surface 1. It should feel
bespoke on the front end, but ordinary and compatible underneath.

Known current assessment item types Jon found:

```txt
date
email
email_multiple
interstitial
metadata
nps
nps_5
radio
radio_single_column
radio_with_flex_layout
radio_with_flex_single_column_layout
scale
scale_continuum
scale_descriptive
select_multiple
select_multiple_with_limit
select_multiple_with_flex_layout
slider
textarea
yes_no
partner_competency_radio
```

## The Real Surface 1 Challenge

Surface 1 is not just an assessment UI. The interesting challenge is designing
an assessment whose output can do three jobs at once:

1. Produce stable scored data.
2. Give the AI prompt enough useful context to generate the richer profile,
   team, and duo reads.
3. Map cleanly into the Surface 2 mock/result data shapes that already exist.

That means the next session should think carefully about the data shape, not
only the screen flow.

Open questions to keep alive:

- Which Surface 1 answers become durable scored fields?
- Which answers are only prompt context for the AI pass?
- Which answers map directly into existing Surface 2 data like Big Five scores,
  working style reads, profile copy, watch-outs, and team role distribution?
- Does Scott's working-style data exist as a first-class result in Surface 2,
  or does it mostly live "in between" as source data for AI-generated copy?
- Should the AI receive raw answers, scored dimensions, short summaries, or all
  three?
- Where should the contract stop and the AI prompt begin?
- How do the Team DNA result fields map back to known monolith
  `AssessmentItem` keys and values?
- Which parts of the experience can be bespoke without needing a new assessment
  engine behavior?

The next agent should not assume those answers are already settled. Part of the
work is to make the questions visible, then choose the simplest useful first
shape.

## Scott's Proposal

Scott proposes two assessment layers:

1. Big Five
2. Working style

### Big Five

Use the current 20-item SDA with the same scale and scoring.

Scott's reasoning: this gives BetterUp a valid instrument and differentiates
Team DNA from MBTI-style personality typing.

Scott also suggests adding dummy/filler questions after each fourth scored
question to make the experience more engaging. These would not affect scoring.
That would make the full assessment 25 questions.

The filler questions could be:

- Image-based.
- Scenario-based.
- More playful.
- More visual.
- Part of a progress metaphor, like assembling an object.

### Working Style

Scott proposes seven working style dimensions, each answered twice:

- One answer for the person's own preference.
- One answer for how they experience the team.

The poles are:

```txt
This doesn't sound like me        -> This sounds like me
This doesn't sound like my team   -> This sounds like my team
```

The dimensions:

1. Work pace / rhythm
2. Structure vs flexibility
3. Collaboration intensity
4. Communication style
5. Autonomy vs guidance
6. Innovation vs execution focus
7. Decision making style

The exact prompts from Scott:

```txt
1. I prefer to work at a fast pace.
1a. This team works at a fast pace.

2. I prefer clear roles, processes, and expectations.
2a. This team has clear roles, processes, and expectations.

3. I prefer to communicate and work closely with others rather than mostly async.
3a. This team communicates and works closely together rather than mostly async.

4. I prefer direct, candid communication.
4a. This team communicates directly and candidly.

5. I prefer a high degree of autonomy in how I do my work.
5a. This team gives people a high degree of autonomy in how they work.

6. I prefer experimenting with new ideas and approaches.
6a. This team experiments with new ideas and approaches.

7. I prefer to make decisions quickly.
7a. This team makes decisions quickly.
```

## Scott's Big Five Pole Language

Use this language unless there is a strong product reason to change it:

```txt
Extraversion:        Expressive / Reflective
Openness:            Explorative / Practical
Conscientiousness:   Structured / Flexible
Agreeableness:       Cooperative / Skeptical
Emotional Stability: Calm / Vigilant
```

Important: low scores are not bad versions of the trait. They are different
default contributions with strengths and overextensions.

## Scott's Output Intent

Scott wants the assessment to create enough signal for:

- General profile description.
- Likely team role or roles.
- Strengths brought to the team.
- Working and thinking style preferences.
- Potential blind spots.
- How to coach / how to work with the person.
- Comparison between two people.
- Team role distribution.
- Team strengths.
- Team watch-outs.

Surface 2 already represents many of these ideas, often with slightly different
language:

```txt
General profile description -> overview hero card
Likely team role(s)         -> combined individual title / fallback role matrix
Strengths                  -> Where I shine
Working guidance            -> How to work with me
Potential blind spots       -> Look out for
How to coach                -> How to work with me
Meeting behavior            -> In meetings
Team role distribution      -> Role distribution
Team strengths              -> Where this team shines
Team watch-outs             -> Look out for
Duo comparison              -> duo collaboration read
```

## Important Product Decision Already Made

Surface 2 leans toward individualized, empowering titles rather than only
shared archetype labels.

Fallback titles use a deterministic role matrix, but the AI pass can produce
more specific titles. The goal is for people to feel seen, not merely sorted.

That said, Scott's role thinking is still represented through:

- Big Five pole language.
- Fallback role matrix.
- Role distribution card.
- Meeting behavior card.
- Strength and overextension framing.

The next agent should continue treating Scott's work as meaningful source
material, not as something to discard.

## Preetoshi's Current POV

Preetoshi is not fully convinced Scott's assessment proposal will become the
most powerful or delightful experience as-is.

The concern: it may feel too long or too traditional.

The plan: build Scott's proposal first, close enough to feel it, then improve
from there.

Possible later directions are intentionally still open:

- More visual assessment interactions.
- Game-like moments.
- Conversational AI moments.
- Scenario cards.
- Image choices.
- Forced choice blocks.
- Faster flow.
- More magical progress feedback.
- A hybrid where valid scoring stays stable but the wrapper feels more alive.

Do not over-spec the final assessment before the first tangible pass exists.

## Assessment Design Constraints

Keep the total experience under 10 minutes.

Be careful not to let delight break scoring validity. If using playful or dummy
questions, make it clear in code/data which questions are scored and which are
not.

The cleanest first implementation may be:

```txt
20 scored Big Five questions
+ optional 5 unscored interstitial/filler questions
+ 7 working style dimensions, each with self/team response
```

But part of the next session's job is to decide whether that feels too long.

## AI And Scoring POV

Do not let AI score the core Big Five assessment if there is a validated scoring
method available.

Recommended split:

```txt
Structured scoring -> stable trait and working-style data
AI generation      -> human-readable profile, team, and duo copy
Fallback logic     -> deterministic reads when AI is unavailable
```

AI can enrich the read. It should not be the only thing making the product work.

## UX Starting Point

Start simple. Build the direct Scott version first.

Useful first-pass UX:

- A clear intro.
- One question or small block at a time.
- Visible progress.
- Smooth pacing.
- Big tap/drag targets.
- A calm but slightly magical feeling.
- A clean handoff at completion into `/team-dna`.

Do not create a marketing landing page. Surface 1 should be the actual
assessment experience.

## Data Handoff Into Surface 2

Surface 2 currently uses mock/result data under:

```txt
src/team-dna/data/
```

Especially relevant:

```txt
src/team-dna/data/teamManagementMock.js
src/team-dna/data/teamDnaAdapter.js
src/team-dna/data/teamDnaViewModel.d.ts
src/team-dna/data/bigFiveTraits.js
```

The next phase should not simply mutate random Surface 2 fixture data from
Surface 1. Instead, create a cleaner contract that could eventually replace the
fixture layer.

Think of Surface 1 completion as producing a result record. That record can be
adapted into Surface 2's normalized dataset.

## Suggested First Tasks For Next Agent

1. Read the current Surface 2 README and data adapter.
2. Create or propose the shared assessment/result contract.
3. Build the first Surface 1 assessment shell in `src/team-dna-assessment`.
4. Implement Scott's Big Five and working style question flow as real local
   data, with scored vs unscored questions clearly marked.
5. Add a simple completion result that can eventually map into Surface 2.
6. Keep the UI clean and user-facing.
7. Do not over-polish until the full flow can be felt end to end.

## Tone For The Next Session

The next agent should be a thought partner, not just a code machine.

Preetoshi wants to:

- Try Scott's version seriously.
- Notice what feels dead or too long.
- Find the more magical version through interaction.
- Keep Scott feeling represented and respected.
- Keep engineering handoff clean.

When unsure, preserve the seam and make the smallest useful prototype move.

Shortly after reading this handoff, Preetoshi will likely send a full rambling
audio transcript about how he feels about Surface 1. Treat that transcript as
important product raw material. The handoff gives context; the transcript will
probably give the real emotional direction for what this surface should become.
