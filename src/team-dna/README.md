# Team DNA

[Live demo](https://team-dna-two.vercel.app)

Team DNA is a high-fidelity React prototype for helping a team understand how
its people work, how pairs collaborate, and what the team should pay attention
to together.

This repo is intentionally more than a visual mock. The people and generated
copy are demo data, but the product surface, data seams, fallback logic, motion,
selection model, and porting boundaries are built like a real feature slice.
The goal is that a BetterUp engineer can replace the fixture adapter with real
monolith data and keep the same UI mechanism.

## Contents

- [What This Is](#what-this-is)
- [Core Product Philosophy](#core-product-philosophy)
- [How The App Works](#how-the-app-works)
- [Team Management Data Seams](#team-management-data-seams)
- [Data And AI Philosophy](#data-and-ai-philosophy)
- [Design System And Monolith Alignment](#design-system-and-monolith-alignment)
- [Important Files](#important-files)
- [Local Development](#local-development)
- [Porting Guide](#porting-guide)
- [Verification Checklist](#verification-checklist)
- [FAQ](#faq)

## What This Is

Team DNA has three connected states:

| State | Selection | What the user sees |
| --- | --- | --- |
| Team | no selected people | The team's overall working shape, team-level guidance, and watch-outs. |
| Person | one selected person | That person's archetype, Big Five shape, how they work, where they shine, and what to watch for. |
| Duo | two selected people | What that pair creates together, where the handoff may break, and short ways to work better together. |

The surface is designed for a manager, teammate, or the person themselves. The
copy avoids "use this person" language and uses human framing like "how to work
with him," "where she shines," and "try this together."

This is also a porting prototype. It is meant to prove that a rich, custom Team
DNA interaction can still sit cleanly inside BetterUp's design system and
React Platform architecture.

## Core Product Philosophy

### 1. Multiplication, not comparison

The most valuable question is not "who is better?" or "who is more X?" It is:
"what becomes possible when these people work together?"

Team DNA should show:

- What one person naturally brings.
- What two people create together that neither creates alone.
- What the whole team can do because of its mix.

The duo view is especially important. It should not feel like two profiles
placed side by side. It should feel like a new collaboration object.

### 2. Human first

The UI should feel like it is about people, not about scoring people.

That is why the first signal is imagery and presence: faces, names, motion,
and plain-language guidance. The Big Five is still there, but it is a grounding
layer, not the whole experience.

Good Team DNA copy should be:

- Concrete.
- Useful.
- Short enough to act on.
- Strength-framed without lying.
- Clear enough that a tired person can understand it quickly.

### 3. Progressive disclosure

The user should not land in a wall of analytics.

The surface starts with a single team, person, or pair read. From there, the
user can move into Big Five shape, spectrum detail, working guidance, places
to shine, and watch-outs.

The spectrum card uses a carousel by default because one useful read is easier
to absorb than five rows at once. "Show all" exists when someone wants the
full scan.

### 4. Assessment output first, assessment design second

This prototype starts from Surface 2: the results experience. That is
intentional. Once we know what information would actually help a manager,
teammate, or team, Surface 1 can collect the right data to power it.

Big Five scores are useful, but not enough on their own. A future assessment
should likely combine:

- Structured scoring questions for reliable trait data.
- Open-ended work-context prompts for richer AI synthesis.
- Short prompts about feedback, pressure, energy, drains, common misreads,
  decision style, and collaboration needs.

The goal is not "take quiz, get report." The goal is "take assessment, unlock
living team context."

### 5. AI as an enrichment layer, not the foundation

The product must work without AI. Scores alone should produce useful fallback
visuals, titles, summaries, watch-outs, and pair reads.

AI should sit on top of that stable base. It should make the output more
specific, more human, and more context-aware without creating a second UI path.

## How The App Works

The app has a simple selection model:

```txt
[]                  -> team view
[memberId]          -> person view
[memberId, memberId] -> duo view
```

The UI resolves the current selection into one `TeamDnaInsight`. Then the right
panel renders cards from that insight.

The important architecture rule:

```txt
raw data -> adapter -> TeamDnaDataset -> selection resolver -> TeamDnaInsight -> cards
```

Components should not know backend field names. Components should not import
fixture data. Components should receive normalized view-model props.

## Team Management Data Seams

The add/edit team prototype uses three separate data sources on purpose:

```txt
organization employees + team records + Team DNA results -> TeamDnaDataset
```

That split is the porting contract. It keeps generic team concepts reusable
while still giving this Team DNA surface the result fields it needs.

| Fixture | Confidence | Purpose | Future replacement |
| --- | --- | --- | --- |
| `mockOrganizationEmployees` | High | Mirrors the monolith frontend `organization-employee` model exactly. | Real organization employee directory query. |
| `mockTeamRecords` | Medium | Temporary minimal team roster seam. | Real Team/TeamMembership API once engineering defines it. |
| `mockTeamDnaResultsByEmployeeId` | Feature-specific | Team DNA assessment completion, Big Five scores, and pronouns. | Real Team DNA assessment/results API. |

`mockOrganizationEmployees` intentionally keeps the full normalized monolith
frontend shape:

```js
{
  id,
  firstName,
  lastName,
  email,
  title,
  avatar,
  currentAccess,
  upcomingAccess,
  eligibleForAccess,
  previousAccess
}
```

Some fields are blank arrays or `null` in the prototype because Team DNA does
not need them yet. They stay present so the fixture is recognizable to an
engineer comparing it against BetterUp's existing directory model.

`mockTeamRecords` is intentionally smaller:

```js
{
  id,
  name,
  memberEmployeeIds,
  invitedEmails,
  sample
}
```

Do not treat that as a final backend contract. It is just the smallest useful
placeholder for "a team has selected employees and maybe invited emails."

`mockTeamDnaResultsByEmployeeId` keeps the Team DNA result layer separate:

```js
{
  [employeeId]: {
    assessmentComplete,
    bigFive,
    pronouns
  }
}
```

Do not collapse Big Five data into organization employees or team records. A
person's assessment result belongs to the person/result layer, not to the
company directory and not to one team roster.

The single mapper is:

```txt
buildTeamDnaDatasetFromTeamRecord()
```

It is the only place where the three sources become `TeamDnaMember` objects.
That is deliberate. Future engineers should replace fixture inputs and keep
the UI consuming `TeamDnaDataset`.

### Sample, invites, and empty state

The sample team is not always present. "Try with sample data" inserts
`sampleTeamRecord` as a normal team record with `sample: true`, then the same
mapper creates the Team DNA dataset. If the sample team is edited down to zero
members, it uses the same canonical empty state as any other empty team.

Manual email entries are stored as `invitedEmails` on the team record. No real
invite is sent in this prototype. The mapper turns those emails into pending
Team DNA members with no avatar and `assessmentComplete: false`, which is why
they show the same `PENDING` treatment as an employee who has not completed
their assessment.

The empty state is triggered only by data:

```txt
no selected team OR selected team has zero mapped members
```

There is no separate "show empty state" flag.

## Data And AI Philosophy

### The layered model

Team DNA has four conceptual layers:

| Layer | Owner | Purpose |
| --- | --- | --- |
| Raw assessment data | Backend / assessment surface | Scores, names, roles, avatars, pronouns, future open-ended answers. |
| Deterministic fallback | Frontend feature logic | Complete useful output from scores alone. |
| Generated insight data | Future backend AI synthesis | Richer titles, summaries, watch-outs, guidance cards, and spectrum reads. |
| UI rendering | Frontend components | Renders the same shape regardless of source. |

The key rule:

```txt
scores -> deterministic insight
scores + richer answers -> generated insight
both -> same TeamDnaInsight shape
```

### Mock generated insights

`src/team-dna/data/teamDnaGeneratedInsights.mock.js` is mock backend output.
It is not live AI. It exists to show the ideal records a future AI synthesis
service should return.

Those records use `source: 'ai'`, `generatedAt`, `inputVersion`,
`spectrumReads`, `watchOut`, and `cards`. The UI should not be able to tell
whether those records came from the mock file or a real API.

### Fallback behavior

If generated insight data is missing, stale, disabled, or not available yet,
the app can still render from Big Five scores:

- `teamDnaPairInsights.js` builds deterministic team/person/duo copy.
- `teamDnaWatchOuts.js` builds deterministic watch-outs.
- `bigFiveTraits.js` owns trait labels, spectrum endpoints, and fallback
  pair read language.

That fallback layer is not throwaway. It is the explainable floor.

### AI should own

AI is useful for:

- Person and duo archetype names.
- Human-specific summaries.
- Short "how to work with them" guidance.
- Where someone, a pair, or a team shines.
- Watch-outs that use open-ended answers.
- Spectrum sentence reads that feel specific to the person or pair.

### AI should not own

AI should not be the source of truth for:

- Raw scores.
- Spectrum positions.
- Assessment completion state.
- Team membership.
- Core trait labels.
- Layout and interaction behavior.

The frontend should not choose models, hold protected prompts, or call an LLM
directly for the main Team DNA result surface.

## Design System And Monolith Alignment

This prototype was cross-checked against the BetterUp monolith reference repo.
The intended port target is modern React Platform inside Team Tooling, not
Ember and not a standalone mini-app shell.

Monolith anchors checked:

| Concern | Monolith anchor |
| --- | --- |
| Team route shell | `ux/apps/react-platform/src/member/team-tooling/routers/TeamToolingRouter.tsx` |
| Team Tooling home | `ux/apps/react-platform/src/member/team-tooling/pages/TeamToolingHome.tsx` |
| Route constants | `ux/packages/core-react/src/routes.ts` |
| Global Team nav | `ux/packages/core-react/src/components/PrimaryNavbar/config.ts` |
| Theme tokens | `ux/packages/component-library/tokens/output/theme.css` |
| Primitive tokens | `ux/packages/component-library/tokens/output/tokens.css` |
| React Platform styles | `ux/apps/react-platform/src/styles/index.css` |
| Tailwind token mapping | `ux/apps/react-platform/tailwind.config.js` |
| Icons | `ux/packages/icons/src/Icon.tsx` |
| Avatar reference | `ux/packages/core-react/src/components/WBAvatar/WBAvatar.tsx` |
| AI ask box precedent | `MemberHome/components/shared/ChatInputSection.tsx` and Lighthouse `InputBox.tsx` |
| Generated AI status pattern | Team Pulse session result and health report cards |

The monolith has several UI eras. Team DNA should follow the modern React path:

- `@betterup/component-library` for normal primitives.
- `@betterup/icons` for icons.
- `tokens.css` and `theme.css` for colors and typography.
- `motion/react` for animation.
- Generated API hooks and a local adapter for data.

The custom Team DNA interaction is allowed to stay custom. The design system
does not currently own a face-cluster selection pattern, duo line geometry, or
radial Big Five bloom. Those pieces should use design-system tokens, but they
do not need to become generic primitives.

## Important Files

| File | Purpose |
| --- | --- |
| `src/team-dna/TeamDnaExperience.jsx` | Main feature panel. Mount this inside the monolith route. |
| `src/team-dna/TeamDnaPage.jsx` | Standalone local harness. Do not port as the final route. |
| `src/team-dna/components/TeamManagementOverlay.jsx` | Minimal prototype add/edit team overlay. Keep the data flow; replace the visual shell with monolith patterns. |
| `src/team-dna/data/teamDnaAdapter.js` | Replaceable data seam and selection resolver. |
| `src/team-dna/data/teamDnaViewModel.d.ts` | Type-only frontend view-model contract for the monolith port. |
| `src/team-dna/data/teamDnaMock.js` | Demo team data. Do not ship these people, avatars, or scores. |
| `src/team-dna/data/teamManagementMock.js` | Organization employee, temporary team record, Team DNA result fixtures, and the mapper between them. |
| `src/team-dna/data/teamDnaGeneratedInsights.mock.js` | Mock backend-generated insight records. Do not port as frontend AI logic. |
| `src/team-dna/data/teamDnaPairInsights.js` | Deterministic fallback insight generation. |
| `src/team-dna/data/teamDnaWatchOuts.js` | Deterministic fallback watch-outs. |
| `src/team-dna/data/bigFiveTraits.js` | Trait order, labels, endpoint names, colors, and fallback spectrum copy. |
| `src/team-dna/components/TeamFaceField.jsx` | Face cluster, editing affordance, selection behavior, and team/person/duo headline area. |
| `src/team-dna/components/TeamFace.jsx` | One person's interactive face button. |
| `src/team-dna/components/DuoConnection.jsx` | Measured line between selected/previewed people. |
| `src/team-dna/components/InsightPanel.jsx` | Right-side scroll panel and insight page transition. |
| `src/team-dna/components/InfoBlock.jsx` | Card renderer switch for bloom, spectrum, watch-out, and guidance cards. |
| `src/team-dna/components/BigFiveBloom.jsx` | Radial Big Five shape for team/person/duo. |
| `src/team-dna/components/BigFiveSpectrumList.jsx` | Spectrum carousel and show-all view. |
| `src/team-dna/components/TeamDnaChatInputBridge.jsx` | Local bridge that mimics monolith ChatInputSection/InputBox. Replace during port. |
| `src/team-dna/components/BetterUpIcon.jsx` | Local icon bridge shaped like the monolith icon API. Replace during port. |
| `src/team-dna/dev/*` | Debug shell and local controls. Do not port. |
| `src/styles.css` | Standalone CSS with monolith token fallbacks plus Team DNA-specific geometry. |

## Local Development

Install dependencies:

```bash
npm install
```

Run the prototype:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Porting Guide

### 1. Route and shell

Mount Team DNA under React Platform Team Tooling.

Likely path:

```txt
/platform/member/team-tooling/team-dna
```

Inside React Router's basename, that is:

```txt
/member/team-tooling/team-dna
```

Add a route constant near the existing Team Tooling constants:

```ts
teamDna: '/member/team-tooling/team-dna'
```

Then add a route under `TeamToolingRouter`. If a broader Team tab shell exists
by then, mount Team DNA as a sibling to Overview, Team Pulse, and Team Coaching.

Do not port the fake monolith shell. The real monolith owns:

- `MemberNavbar`
- Team gates
- route constants
- Browser title
- analytics
- loading and error states
- top-level tabs

### 2. Page ownership

The monolith should create a thin route page:

```txt
TeamDnaPage.tsx
```

That page should own:

- generated API hook calls
- loading, empty, failed, and retry states
- analytics
- `BrowserTitle`
- adapter mapping
- route-level mutations if edit mode ships

`TeamDnaExperience` should remain mostly a feature panel.

### 3. Data adapter

Team management has one extra mapping step before Team DNA rendering:

```txt
organization employee response
+ team/team-membership response
+ Team DNA assessment/results response
-> mapTeamRecordToTeamDnaDataset()
-> TeamDnaDataset
```

Keep organization directory data, team membership data, and Team DNA result
data separate until this mapper. That prevents the future universal team
model from accidentally becoming Team DNA-specific.

The current organization employee fixture mirrors the monolith
`organization-employee` frontend model. The current team record fixture is not
authoritative; it is a temporary placeholder until the real Team/TeamMembership
shape exists.

Keep one mapping layer:

```txt
backend response -> mapTeamDnaResponseToViewModel() -> TeamDnaDataset
```

The view-model contract lives in:

```txt
src/team-dna/data/teamDnaViewModel.d.ts
```

When porting, turn that `.d.ts` contract into real TypeScript types near the
monolith adapter.

Do not pass raw backend response objects into JSX components.

### 4. Insight source resolution

The adapter should resolve copy in this order:

1. Use generated AI insight if present and valid.
2. Use explicit authored/backend override if present.
3. Fall back to deterministic Big Five generation.

Conceptually:

```ts
const insight =
  generatedInsightForSelection ??
  explicitOverrideForSelection ??
  buildDeterministicInsightFromScores(selection);
```

All three paths must produce the same `TeamDnaInsight` shape.

### 5. Generated insight status

There is no live AI generation in this prototype.

For the real monolith, prefer the Team Pulse pattern:

- backend-owned generated fields
- generation status
- polling while pending or processing
- failed state
- retry action
- feedback on generated content

Do not create a new frontend-only AI generation path for the core results
surface.

### 6. Open-ended questions

The bottom AI question affordance is represented locally by:

```txt
TeamDnaChatInputBridge
```

That is a bridge, not a new primitive. In the monolith, replace it with the
existing `ChatInputSection` or Lighthouse `InputBox`, then keep the Team
DNA-specific rotating placeholder questions at the Team DNA route/feature layer.

The first realistic behavior can be a deep link into Lighthouse/Grow Chat with
an initial message and Team DNA context. A richer future version can become a
contextual AI layer over the Team DNA surface.

### 7. Design-system tokens

The standalone CSS defines local fallbacks for monolith token names. In the
monolith, inherit the real tokens instead of keeping duplicate values.

Important mappings:

| Team DNA need | Monolith token path |
| --- | --- |
| Page background | `--page-background` / `--background` |
| Main heading and ink | `--foreground` / `--foreground-heading` / `--midnight` |
| Body copy | `--foreground-body` |
| Primary selection | `--primary` / `--rubine` |
| Cards | `--card`, `--card-subtle-bg`, `--card-subtle-border`, `--card-shadow` |
| Label typography | `--label-font`, `--label-size`, `font-mono` |
| Display titles | `--heading-display-font`, `font-display` |
| Data colors | `--data-series-*`, `--blue-aa`, `--green`, `--purple` |

Do not port local `@font-face` blocks. The monolith already defines the fonts.

### 8. Icons and avatars

Replace:

```txt
BetterUpIcon
```

with:

```tsx
import { Icon } from '@betterup/icons/src/Icon';
```

For avatars, use the existing BetterUp avatar/profile primitive if it can
support the Team DNA visual requirements. If not, keep a Team DNA visual
wrapper but feed it real monolith avatar URLs/profile data.

Do not port fixture avatars as product data.

### 9. Custom interaction code

These should stay custom to Team DNA:

- face cluster selection
- selected and preview rings
- selected-person dimming
- duo connection line
- measured nudges for close selected pairs
- Big Five bloom visualization
- spectrum carousel/show-all behavior
- right-panel transitions

They are product interaction, not generic component-library primitives.

### 10. Layout and CSS cautions

The standalone prototype owns the whole viewport. The monolith will not.

During porting, replace `100vh` assumptions with the real Team tab panel height.
Usually this means a flex child or `calc(100vh - nav/subtab chrome)` depending
on the final shell.

The standalone CSS uses `:has()` for the spectrum show-all restyle. If the
monolith browser support matrix or CSS pipeline makes that uncomfortable, use
an explicit data attribute instead:

```tsx
<section data-spectrum-view="all">
```

That is a porting detail, not product behavior.

### 11. What to port

Port the feature code:

- `TeamDnaExperience`
- components under `src/team-dna/components`
- hooks under `src/team-dna/hooks`
- deterministic data helpers under `src/team-dna/data`
- `teamDnaViewModel.d.ts` as the type contract
- the team-management mapper concept from `teamManagementMock.js`
- the Team DNA CSS rules, converted to monolith styling conventions

### 12. What not to port

Do not port these as production code:

- `TeamDnaPage.jsx`
- `src/team-dna/dev/*`
- local font files
- fake monolith shell assets
- fixture avatars
- `teamDnaMock.js` as real data
- `mockTeamRecords` as the final backend team contract
- `mockTeamDnaResultsByEmployeeId` as real assessment storage
- `teamDnaGeneratedInsights.mock.js` as frontend AI logic
- `TeamManagementOverlay` as the final production overlay design
- `TeamDnaChatInputBridge` as a new input primitive
- `BetterUpIcon`

### 13. Expected integration effort

This is an AI-assisted engineering estimate, not a calendar promise.

| Scope | Likely effort with a strong coding agent |
| --- | --- |
| Compileable monolith route using fixture data | 0.5 day |
| Clean route, tokens, icons, types, and adapter seam | 1 day |
| Real API hook integration if backend shape already exists | 1-2 days |
| Full generated-insight status, retry, feedback, and permissions | 2-4 days depending on backend readiness |
| Mobile polish and edge cases | separate pass |

The reason this can be relatively quick is that the hard parts are already
separated: UI, selection, adapter, fallback, generated insight data, and dev
shell are not braided together.

## Verification Checklist

Before calling a monolith port done:

- Team DNA appears inside the real Team shell.
- No fake shell, debug panel, local font files, or fixture avatars ship.
- Route/page layer owns API, loading, errors, analytics, title, and mutations.
- Components receive `TeamDnaDataset`/`TeamDnaInsight`, not raw backend data.
- Organization employees, team membership, and Team DNA results stay separate
  until the mapper.
- Add/edit team works from the empty state, the switcher add item, and the
  switcher edit button.
- Manual email invites create pending members without sending real invites in
  the prototype.
- Sample Team is inserted through the same team-record path as real teams.
- Empty state appears when there is no selected team or the selected team maps
  to zero members.
- Team, person, duo, incomplete-assessment, missing-avatar, empty-team, and
  large-team states all render.
- Pair lookup is order-insensitive.
- `[]`, `[memberId]`, and `[memberId, memberId]` selection states work.
- Generated insight data and deterministic fallback use the same UI path.
- If generated insight data is missing, the page still renders useful fallback.
- Icons come from `@betterup/icons`.
- Chat input comes from `ChatInputSection` or Lighthouse `InputBox`.
- Typography uses monolith font/token paths.
- Colors use `tokens.css`, `theme.css`, and Tailwind token mappings.
- Duo connection lines still align after the real shell/layout is applied.
- Motion respects reduced-motion preferences.
- Right panel scroll behavior works inside the real route container.
- Build, lint, and focused adapter/selection tests pass.

## FAQ

### Is this dummy code?

No. The people, avatars, scores, and generated copy are demo data. The code path
is real: data enters through an adapter, resolves into a normalized insight,
and renders through reusable components. Real data should be able to replace
the fixtures without changing the rendering model.

### Why are there three mock data shapes?

Because they mean different things. Organization employees are people in the
company directory. Team records are which people belong to this team. Team DNA
results are assessment data. Keeping them separate makes the future port less
confusing and keeps generic team infrastructure from becoming Team DNA-only.

### Is the app using live AI right now?

No. `teamDnaGeneratedInsights.mock.js` is mock backend output. It represents the
kind of insight records a future backend AI synthesis layer should return.

### Why keep deterministic fallback if AI will make better copy?

Because the product needs a floor. Deterministic fallback means Team DNA still
works if AI is disabled, late, missing, failed, or waiting on richer assessment
inputs. It also makes the visuals and basic claims explainable.

### Why not just deep-link everyone into Grow Chat?

The main Team DNA surface should be useful without chat. Chat is a follow-up
interaction. The result page is the shared object the team can look at together.

### Why does this have custom UI instead of only design-system components?

The design system owns normal UI primitives: typography, tokens, buttons,
inputs, icons, cards, focus states. It does not currently own a face-cluster
team map, duo line geometry, or Big Five bloom visualization. Those are Team
DNA-specific product interactions, so they stay custom while using design
system tokens.

### Are pronouns gender data?

No. In this view model, pronouns are display-language data. If missing, fallback
copy uses neutral `they/them`.

### Should duo insights be precomputed or generated on demand?

Either can work. This prototype stores all pair records in `insights.pairs`
because that makes the demo instant. A real backend can precompute common team
pairs, generate lazily, or combine generated pair copy with deterministic
fallback while generation is pending.

### Should the assessment be only Big Five?

Probably not. Big Five gives a strong spine, but the most useful Team DNA copy
needs work-context signal too: feedback style, pressure needs, project fit,
drains, misreads, collaboration preferences, and what the person wants others
to know.

### What is the single most important porting rule?

Keep the route/page layer thin and keep the components API-blind. Fetch real
data, normalize it once, then pass `TeamDnaDataset` into `TeamDnaExperience`.

### What is the single most important product rule?

Do not turn people into tools. The language should help teammates work with
each other, not "use" each other.
