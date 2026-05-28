# How Scott's Team DNA Thinking Shows Up In This Prototype

This is a living decision log for incorporating Scott's Team DNA thinking into
the prototype without flattening the product direction.

The goal is not to prove one model right and the other wrong. The goal is to
show where Scott's work shaped the prototype, where the prototype made a
different call, and why those choices were intentional.

## Working Principle

Scott's proposal is strongest as a signal model and content taxonomy:

- Big Five as the validated spine.
- Working style as richer context.
- Strength-framed roles.
- Watch-outs as overextensions of strengths.
- AI-generated descriptions that stay developmental, not judgmental.

The prototype should preserve that rigor while still exploring what becomes
possible in an AI-native experience: more personal, more specific, and less
limited to static archetypes.

## What Scott Should See Reflected

The prototype now includes several direct translations of Scott's proposal:

- Big Five is the underlying spine for deterministic fallback.
- Scott's pole language is used where it is clearest and most trait-true.
- Low poles are treated as different contributions, not worse versions.
- Static roles are preserved as structural source language.
- Individual titles can become more unique and AI-enriched.
- Team page includes a clear Role distribution card.
- Individual pages include likely meeting behavior.
- Watch-outs are written as overextensions of strengths.
- Editable profile copy is included for the areas Scott marked as editable.

The product direction is not "Scott's doc copied into UI." It is Scott's model
used as the trustworthy structure underneath a more expressive, AI-native
experience.

## Decision 1: Unique Titles Over Shared Archetype Labels

**Status:** Decided for this prototype.

### Scott's Direction

Scott's role map creates shared, reusable Big Five role anchors such as
Mobilizer, Reflective Synthesizer, Innovator, Practical Stabilizer,
Implementer, Adaptive Responder, Harmonizer, Candid Challenger, Steadying
Presence, and Vigilant Sentinel.

Those are useful because they are stable. They help people understand similarity
and difference quickly. Someone can say, "Oh, we are both Innovators," or "You
are more of an Implementer and I am more of an Adaptive Responder."

### Prototype Decision

This prototype leans toward celebrating each person's individuality.

When AI-generated insight is available, the individual title can be unique to
that person, based on their Big Five signals, working style, and contextual
answers. That creates room for titles like "The Systems Spine" or "The Risk
Translator" instead of only shared archetype names.

The reason is that AI gives us a new possibility: not just sorting people into
known buckets, but reflecting back a more specific version of how someone
contributes.

### Fallback Decision

Fallback should still be deterministic and connected to Scott's role logic, but
it should not show users two separate role labels.

Instead of:

```txt
Primary: Implementer
Secondary: Harmonizer
```

the fallback combines the two strongest Big Five pole signals into one additive
role title:

```txt
The Collaborative Implementer
```

That keeps the role connected to the underlying data while still feeling like a
single identity.

### Why This Choice

The philosophy here is empowerment through specificity.

Shared archetypes are useful anchors, but unique AI-enriched titles may feel
more personally seen and more future-facing. Since that is not something older
static personality models could easily do, it feels worth exploring as a
distinctive Team DNA feature.

The current hierarchy is:

```txt
Big Five scores
-> deterministic combined fallback role
-> AI-enriched unique title when available
```

### Implementation Notes

- AI-generated titles currently come from `teamDnaGeneratedInsights.mock.js`.
- Deterministic fallback titles use `teamDnaFallbackRoles.js`.
- `teamDnaFallbackRoles.js` maps the top two strongest Big Five pole signals
  into one combined title.
- `teamDnaPairInsights.js` uses that fallback title when AI insight is not
  ready, unavailable, or failed.

### Open Question

We should still test whether users need visible shared role anchors somewhere
else. A possible future compromise is:

```txt
AI title: The Systems Spine
Role signals: Implementer + Steadying Presence
```

For now, the prototype gives the title space to the unique or combined identity,
not to separate primary and secondary labels.

## Decision 2: Big Five Pole Language

**Status:** Decided for this prototype pass.

Scott's pole language and the prototype's pole language are mostly aligned.
The decision here is case-by-case: use the clearest, most trait-true,
strength-framed pair for each dimension.

| Trait | Scott's language | Prototype language | Recommendation | Rationale |
| --- | --- | --- | --- | --- |
| Extraversion | Reflective / Expressive | Reflective / Expressive | Keep | Full alignment. This is clear, strengths-based, and easy to understand. |
| Openness | Practical / Explorative | Grounded / Inventive | Use hybrid: Practical / Inventive | Scott's "Practical" is clearer than "Grounded." "Inventive" feels more natural than "Explorative," but keeps the high pole vivid and user-facing. |
| Conscientiousness | Flexible / Structured | Spontaneous / Methodical | Use Scott | Flexible / Structured is clearer and less likely to make the low pole sound flaky. |
| Agreeableness | Skeptical / Cooperative | Direct / Warm | Use Scott | Skeptical / Cooperative is more directly aligned to Big Five agreeableness than Direct / Warm. It names the real polarity between questioning/default-challenging and trusting/default-cooperating. We should still make the surrounding copy clear that skeptical can be pro-team and does not mean uncooperative. |
| Emotional Stability / Pressure | Calm / Vigilant | Steady / Vigilant | Prefer prototype | The prototype stores this as pressure sensitivity, where higher means more vigilant. "Steady / Vigilant" is clear, active, and avoids awkward neuroticism language. |

### Current Recommendation

Use Scott's language where it is more trait-true or clearer, and keep prototype
language where it better fits the product framing.

Chosen direction:

```txt
Openness: Practical / Inventive
Conscientiousness: Flexible / Structured
Extraversion: Reflective / Expressive
Agreeableness: Skeptical / Cooperative
Pressure sensitivity: Steady / Vigilant
```

This keeps Scott's strongest clarity improvements while protecting the prototype
from language that feels too clinical or judgmental. The Agreeableness choice is
the main place where Scott's terminology wins despite being slightly less soft,
because it is more accurate to the underlying trait.

### Implementation Notes

- `bigFiveTraits.js` now uses Practical / Inventive for Openness.
- `bigFiveTraits.js` now uses Flexible / Structured for Conscientiousness.
- `bigFiveTraits.js` now uses Skeptical / Cooperative for Agreeableness.
- Extraversion and Pressure sensitivity keep the prototype labels for now.
- Big Five read emphasis is fixed in the content itself with `**pole phrase**`.
  The UI should not auto-highlight keywords like "ideas" or "pressure," because
  that creates accidental emphasis and makes AI-authored copy harder to trust.

## Decision 3: Working Style As Source Data, Big Five As Direct Read

**Status:** Decided for this prototype pass.

### Scott's Direction

Scott proposes a working-style layer with dimensions such as pace, structure,
collaboration, communication, autonomy, innovation, and decision-making.

Those dimensions are useful because they speak more directly to day-to-day work
than Big Five labels alone.

### Prototype Decision

Treat working-style dimensions as source data for the future insight engine,
not as seven required UI cards.

The profile UI should not become a flat report of every source dimension.
Instead, working-style data should inform the existing sections:

- Main overview.
- Where they shine.
- How to work with.
- Look out for...
- Duo and team synthesis.

### Big Five Card Decision

The Big Five spectrum card should be more honest about what it is.

Earlier copy sometimes made the Big Five card behave like a general working
style card. That made the Big Five feel like the visible character of every
insight, which is not the desired direction.

The revised direction:

```txt
Big Five card = direct Big Five read.
Working-style data = source signal for richer profile synthesis.
```

The Big Five card should use the pole language directly and explain what that
trait signal means in plain work terms.

Example:

```txt
Justin is **structured**, turning intent into owners, standards, and next steps.
```

This keeps the Big Five useful and visible without forcing it to carry the
whole working-style system.

### Implementation Notes

- `teamDnaAdapter.js` now labels the spectrum card simply as Big Five.
- `BigFiveSpectrumList.jsx` uses numbered steps for the five traits instead of
  unlabelled dots.
- `teamDnaPairInsights.js` now provides deterministic person and team Big Five
  read sentences, so fallback and AI states share the same intent.
- `teamDnaGeneratedInsights.mock.js` now uses the same direct Big Five read
  style for mock AI spectrum reads.
- The richer working-style dimensions are not modeled in the prototype data yet;
  they belong to the future assessment/results source data contract.

## Decision 4: Team Shape As Story Plus Distribution

**Status:** First prototype pass implemented.

### Scott's Direction

Scott's proposal includes team role distribution: the team view should show
which contribution patterns are present across the team, not only a general
team summary.

His 10-role map is useful here because it gives shared structural language:
Mobilizer, Reflective Synthesizer, Innovator, Practical Stabilizer,
Implementer, Adaptive Responder, Harmonizer, Candid Challenger, Steadying
Presence, and Vigilant Sentinel.

### Prototype Decision

Represent role distribution through a Team Shape hero card, not a clinical
chart-first report.

The team page should get the same expressive image-card treatment as people
and duos. The card's title and overview explain the team-level shape, while
compact contribution tags show which Scott-style energies are most present and
which teammates exemplify them.

This keeps the experience story-led while making the underlying distribution
visible enough that Scott's model is clearly represented.

### Implementation Notes

- `teamDnaTeamShape.js` maps each completed member's strongest Big Five pole
  signal into one Scott-style role group for this card.
- `getArchetypeImageForTeam()` returns team-shape image data, contribution
  groups, and representative member images.
- `teamDnaAdapter.js` emits a separate `teamShapeContributions` card called
  Role distribution, ordered before Big Five.
- `InfoBlock.jsx` renders that card through the same editorial card family used
  by Big Five, guidance, and watch-out cards.
- `TeamShapeContributions.jsx` renders one tiny face carousel next to each role
  label. If only one person owns that role, clicking the face opens that
  person's profile; hovering uses the same cursor-following tooltip pattern as
  the main people selector.

## Decision 5: Meeting Behavior As An Individual Card

**Status:** First prototype pass implemented.

### Scott's Direction

Scott's 10-role map includes "how they likely behave in meetings." This is one
of the clearest product-facing parts of his role language because it turns a
trait read into an observable work moment.

### Prototype Decision

Add this only to individual person pages as a card called:

```txt
In meetings...
```

Do not add it to team or duo pages for now. The team page already has Role
distribution and team-level guidance; duo pages already have pair-specific
comparison and working guidance.

The card should use the same editorial `InfoBlock` shell and body rhythm as
`Look out for...`, so it feels like a sibling card rather than a new report
format.

### Implementation Notes

- `teamDnaMeetingBehavior.js` provides deterministic fallback copy from a
  person's two strongest Big Five signals.
- `teamDnaAdapter.js` emits the `meetingBehavior` card only when exactly one
  person is selected.
- `InfoBlock.jsx` renders the card through the same simple item layout used by
  watch-outs.
- Own-profile inline editing supports this card using the same pattern as
  `Look out for...`.
- Future AI output can replace the fallback by sending `meetingBehavior` in
  the same `{ items: [{ title, body }] }` shape.

## Decision 6: Watch-Outs As Strengths Overextended

**Status:** Adopted as a content standard.

### Scott's Direction

Scott's doc is explicit that blind spots should stay developmental:

```txt
Every role adds value by leaning in a direction.
The blind spot is usually just the overextension of that same strength.
```

This is one of the most important tone rules in the whole model. It prevents
Team DNA from turning personality differences into deficits.

### Prototype Decision

Use the UI label:

```txt
Look out for...
```

but write every item underneath it using Scott's overextension philosophy.

The language should follow this pattern:

```txt
Useful contribution -> moment where it stretches too far -> complement or next step
```

Examples:

- Risk-sensing is useful; the watch-out is when the signal repeats without
  changing the plan.
- Directness is useful; the watch-out is when the message needs more landing
  context.
- Reflection is useful; the watch-out is when useful input waits too long.
- Flexibility is useful; the watch-out is when the team needs a clearer anchor.

### Implementation Notes

- `README.md` now includes an AI copy standard for generated and fallback copy.
- `teamDnaWatchOuts.js` uses deterministic watch-outs written in this
  strengths-overextended style.
- `teamDnaGeneratedInsights.mock.js` should be treated as model output examples
  and kept aligned with the same tone rule.
- This standard applies beyond the `Look out for...` card. Overview,
  where-shines, how-to-work-with, meeting behavior, duo reads, and team reads
  should also avoid treating lower scores or sharper signals as bad traits.

## Current Mapping Back To Scott's Proposal

| Scott proposal item | Prototype expression | Decision |
| --- | --- | --- |
| Big Five as validated instrument | Big Five scores power fallback title, spectrum, Role distribution, meeting behavior, watch-outs, and deterministic reads. | Adopted as the spine. |
| Big Five pole descriptions | Practical / Inventive, Flexible / Structured, Reflective / Expressive, Skeptical / Cooperative, Steady / Vigilant. | Mostly adopted, with a few product-language adjustments. |
| Working style dimensions | Treated as future source data for AI synthesis, not visible as seven required cards. | Deferred to assessment/data contract. |
| General profile description | Main hero overview card. | Adopted, but more expressive and AI-native. |
| Likely team roles, primary/secondary | Combined fallback title plus Role distribution card. | Adapted to avoid showing users two separate role labels. |
| Strengths you bring | `Where I shine` card. | Adopted with warmer product language. |
| Working/thinking preferences | Partly covered by `How to work with me`; future working-style data should enrich this. | Partly represented; source data still future. |
| Potential blind spots | `Look out for...` card. | Adopted with overextension-of-strengths framing. |
| How to coach | `How to work with me` and duo `Try this together`. | Renamed to feel less hierarchical and useful for any teammate. |
| Comparisons | Duo pages with summary, Big Five comparison, where-pair-shines, try-this-together, and look-outs. | Adopted. |
| Team role distribution | Team-only `Role distribution` card. | Adopted directly enough for Scott to recognize. |
| Team strengths | Team overview and `Where this team shines`. | Adopted. |
| Team watch-outs | Team `Look out for...` card. | Adopted. |
| Ability to edit | Own-profile inline editing for overview, where-I-shine, how-to-work-with-me, and look-outs. | Adopted for individual profile copy. |

## Decision 7: More Behavioral, Less Atmospheric Supporting Copy

**Status:** Adopted as a copy direction.

### Scott's Direction

Scott's examples are strongest when they name behavior someone could actually
see in a meeting:

```txt
Speaks early.
Thinks out loud.
Asks what could fail.
Names owners, timing, and next steps.
```

His coaching prompts also work because they are immediately usable:

```txt
Who have we not heard from yet?
What is your early read?
Which risks matter most?
What is the minimum structure we need?
```

### Prototype Decision

Keep the expressive hero titles and overview cards, because that is where the
AI-native "being seen" feeling belongs.

Move the supporting cards closer to Scott's concrete behavior model:

- `Where I shine` should say what the person helps the team do and when.
- `How to work with me` should read like usable prompts or cues.
- `In meetings...` should stay observable and behavior-based.
- `Look out for...` should keep natural prose, but each description should
  include the useful strength, the moment it stretches too far, and a small
  behavior to try.

### Implementation Notes

- `teamDnaGeneratedInsights.mock.js` now rewrites person `bestFor` copy toward
  "Use this person when..." behavior.
- `teamDnaWatchOuts.js` now makes the strength and overextension more explicit
  inside the natural watch-out sentence.
- `teamDnaPairInsights.js` trims some abstract deterministic summary language
  so fallback copy names the useful behavior more directly.
- `README.md` documents the copy rule: supporting cards should be easier to
  verify in real work than purely atmospheric language.
