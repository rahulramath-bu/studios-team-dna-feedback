# Scott x Preetoshi Alignment Decisions

This is a living decision log for incorporating Scott's Team DNA assessment
thinking into the prototype without flattening the product direction.

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
