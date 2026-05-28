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

While this prototype is designed to be as portable as possible, it is unlikely
to be a perfect copy-paste production patch. The goal is to make the monolith
port much easier than rebuilding from a static design file: the main UI,
interaction model, data seams, fallback behavior, lifecycle states, and porting
boundaries are already shaped in code.

Engineers should still expect some integration work around routing, API hooks,
permissions, analytics, loading/error states, design-system primitives, and real
mutations. Treat this as a feature slice built for a cleaner surgery, not as
final monolith code.

## Contents

- [What This Is](#what-this-is)
- [Core Product Philosophy](#core-product-philosophy)
- [How The App Works](#how-the-app-works)
- [Team Management Data Seams](#team-management-data-seams)
- [Data And AI Philosophy](#data-and-ai-philosophy)
- [AI Generation Lifecycle](#ai-generation-lifecycle)
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

Engineering direction: the real monolith path should use the existing
organization user search service, which can search people within the same
organization by name and does not require email-only lookup. In this prototype,
`mockOrganizationEmployees` represents the returned organization-search
results. Manual email entry remains only as a fallback invite path.

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
they show the same incomplete-assessment treatment as an employee who has not
completed their assessment.

Assessment reminder actions are intentionally separated from team saves.
`TeamManagementOverlay` emits `onTeamManagementAction({
type: 'assessmentReminderRequested', ... })` when a manager clicks `Remind`;
the prototype route returns a fake delayed success promise. The row behaves
like the real deal should: `Remind` -> `Sending...` -> `Reminder sent!` only
after the promise resolves. During the monolith port, replace the fake promise
with the real assessment-reminder mutation, analytics event, toast/feedback
surface, and any resend throttling rules. Do not treat the local "sent" UI as
durable state.

The save payload also includes a prototype-only `notificationPreference` object
for the footer checkbox (`Notify new teammates`). That is an intent seam, not a
final backend field. Engineering should replace it with whatever request shape
the real Team/TeamMembership and assessment-reminder APIs require.

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

If generated insight data is missing, disabled, failed, or not available yet,
the app can still render from Big Five scores:

- `teamDnaPairInsights.js` builds deterministic team/person/duo copy.
- `teamDnaFallbackRoles.js` maps the two strongest person signals into one
  deterministic fallback role title.
- `teamDnaWatchOuts.js` builds deterministic watch-outs.
- `bigFiveTraits.js` owns trait labels, spectrum endpoints, and fallback
  pair read language.

That fallback layer is not throwaway. It is the explainable floor.

If generated insight data is stale, keep the old generated insight visible and
offer a refresh path where appropriate. Stale does not mean fallback must
replace the generated copy immediately.

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

## AI Generation Lifecycle

The simple rule:

```txt
Data creates the team/person/duo targets.
AI only enriches those targets with nicer readouts.
Once the required assessment data exists, deterministic fallback exists.
```

There are two different questions:

```txt
1. Is there enough assessment data to show a responsible read?
2. If yes, is the nicer AI-written version ready?
```

Do not think of the AI pass as "creating pages." Team DNA pages are view states
created by real product data. AI attaches generated copy to those view states:

| View target | Exists when | AI output attaches when |
| --- | --- | --- |
| Person read | That person has completed the assessment. | The person-profile generation job succeeds. |
| Duo read | Both selected people have completed the assessment. | The duo generation job for that pair succeeds. |
| Team summary | The team has enough completed assessments. | The team generation job succeeds for the chosen member snapshot. |

For the first version, use this readiness rule:

```txt
Person read: 1 completed assessment.
Duo read: 2 completed assessments.
Team summary hard minimum: at least 3 completed assessments.
Default team summary waits for everyone.
Manager can generate anyway once the hard minimum is met.
```

That means a team with 1-2 completed assessments should show a waiting state,
not a fake team summary and not a CTA. A team with 3+ completed assessments
should show the deterministic team summary with a quiet "generate anyway" notice
if the manager chooses to move forward before everyone finishes. When everyone
has completed, the team summary should move into generation/ready state.

Fallback is available only after the required source data exists:

| View target | Fallback exists when | No read when |
| --- | --- | --- |
| Person | That person completed the assessment. | That person has not completed the assessment. |
| Duo | Both selected people completed the assessment. | Either selected person has not completed the assessment. |
| Team | At least 3 team members completed the assessment. | Fewer than 3 team members completed the assessment. |

In normal product flow, incomplete person and duo reads should usually be
inaccessible because pending people are not selectable. The waiting state is
mostly visible for the team summary, because the team page can exist before enough
people finish.

### Backend event model

These event names are prototype seams, not final API names. They describe the
kind of backend/product events engineering should expect to wire:

| Event | Frontend result |
| --- | --- |
| `teamDnaAssessmentCompleted` | Person generation can start. Duo generation can start for completed teammate pairs. Team summary may become available or stale. |
| `teamDnaInsightGenerationRequested` | Target status becomes `pending`. |
| `teamDnaInsightGenerationSucceeded` | Target status becomes `ready`; generated copy can be used. |
| `teamDnaInsightGenerationFailed` | Target status becomes `failed`; deterministic fallback remains visible. |
| `teamDnaTeamInsightMarkedStale` | Existing team summary remains visible, but a refresh prompt appears. |
| `teamDnaTeamInsightRefreshRequested` | Team target status becomes `pending` again. |

The visible states are:

| Status | Meaning | UI behavior |
| --- | --- | --- |
| `not_ready` | Not enough completed assessments yet. | Show a waiting state; no fallback should pretend to know the result. Mostly team-visible, defensive for person/duo. |
| `pending` | Enough assessment data exists and the backend is generating the AI insight. | Show a small unframed "AI insights generating" status and deterministic fallback underneath. |
| `ready` | AI insight exists and matches the current source snapshot. | Show the normal generated insight. |
| `failed` | Enough assessment data exists but AI generation failed. | Quietly show deterministic fallback; log/retry through backend/telemetry rather than alarming the user by default. |
| `stale` | AI insight exists, but team membership or assessment data changed later. | Keep the existing insight visible. For team/admin views, show a refresh affordance. |

`stale` does not mean the page is broken. It means the generated copy came from
an older source snapshot. Example: a team summary was generated with 5 completed
members, then a 6th member finished. Keep the old generated insight visible and
offer refresh instead of silently changing the team's story.

### Generation timing

After the future assessment surface is wired:

```txt
Assessment submit
-> assessment engine saves answers/results
-> person generation starts
-> user waits briefly on "building your profile"
-> user lands on their person read when ready
```

That wait should be bounded. If person generation is slow or fails, show the
deterministic personal result and keep generation moving in the background.

Duo generation should not block the person from seeing their own result:

```txt
New member completes assessment
-> generate that person read
-> generate pair reads with already-complete teammates
-> mark the team aggregate stale or ready-to-generate
```

Team summary generation should be explicit when the team is incomplete. Do not silently
swap the team's generated identity every time a new member completes. If a team
summary already exists, keep it visible and mark it stale so the manager can
refresh it with the new member snapshot.

The team summary readiness POV is:

```txt
0-2 completed assessments
-> hard waiting state
-> no generate CTA

3+ completed assessments, but not everyone
-> enough signal to generate
-> show the deterministic summary
-> show a small "generate anyway" notice/action, similar to stale refresh

everyone completed
-> leave waiting
-> generate normally or show the ready summary

existing generated summary + later membership/assessment change
-> keep old summary visible
-> mark stale and show a quiet refresh action
```

### Manager/admin access seam

Manager/admin-only controls are gated by a single prototype permission flag:

```txt
canManageTeam
```

In this standalone build, the debug panel can toggle that flag. In the monolith,
replace it with the real Team Tooling permission/role decision, for example
team lead, manager, admin, or whoever owns that team. When `canManageTeam` is
false, hide team management controls and manager-only lifecycle actions like
"generate anyway" and stale refresh. The member/read experience can still render
normally. If the user has no team yet and cannot manage teams, keep the same
introductory empty-state headline/body, but replace setup/demo CTAs with a short
note that after a manager or admin adds them to a team, their team summary will
appear there.

### Viewer identity and profile editing seam

Manager/admin access is not the same thing as viewer identity.

The standalone debug panel uses:

```txt
viewerMemberId
```

to simulate which Team DNA member is the signed-in user. In the monolith, this
should come from the authenticated member/session mapped to the current Team DNA
member record.

Profile editing should be gated by ownership, not by team management access:

```txt
current insight is a person page
and selected person id === viewerMemberId
-> viewer can edit their own profile copy
```

For this prototype, editing is intentionally limited to profile-facing copy:

- Main overview.
- How to work with me.
- Where I shine.
- Look out for.

It does not edit Big Five scores, Big Five reads, team summaries, duo reads, or
duo reads. In production, save these edits as backend-authored overrides or
approved generated-profile edits, then feed them back through the same
`TeamDnaInsight` view model. Do not special-case edited copy inside visual
components.

Inline editing is a prototype-local interaction shell, not a new form system.
The viewed copy is replaced in place with an editor so users never see the same
copy twice. During the monolith port, keep that behavior but replace the local
textarea/button CSS with the component-library primitives listed in the design
system section below.

### Prototype simulation

`src/team-dna/data/teamDnaGenerationLifecycle.mock.js` is the local backend
simulation for these states. It does not call OpenAI and should not be ported
as production logic.

The debug panel can mutate the selected team/person/duo target through:

```txt
waiting     = not_ready, no responsible read yet
generating  = pending, fallback visible while AI works
ready       = generated copy visible
failed      = fallback visible because AI failed
stale       = old generated copy visible; team summaries may show refresh
```

The debug panel intentionally does not expose separate event buttons.
Clicking a state directly simulates the backend job ending up in that visible
state. The exception is `waiting`: because that is a source-data readiness gate,
the debug panel mutates member assessment completion and lets the normal
lifecycle resolver derive `not_ready`. The event names stay documented above for
engineering, but the prototype control should stay simple enough to explain in a
demo.

This exists so designers and engineers can see the real frontend states without
needing a live generation service. The real monolith should replace the mock
status map with backend generation fields, polling/subscription state, and real
retry/refresh mutations.

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
| Textarea | `ux/packages/component-library/src/components/ui/textarea.tsx` |
| Button | `ux/packages/component-library/src/components/ui/button.tsx` and `button-variants.ts` |
| Circular icon button | `ux/packages/core-react/src/components/CircularIconButton/CircularIconButton.tsx` |
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

### Team context switcher

The team context switcher is manager/admin-only in this prototype. It is fixed
near the top right of the Team DNA surface and portals to `document.body` so it
stays visually attached to the viewport while the result page scrolls.

The closed state shows:

- `Team`
- the current team name
- a chevron
- a separate edit button aligned to the same height

The open state keeps the current team in the trigger, lists the other available
teams with an initial tile and member count, and ends with an `Add team` row.
The edit button edits only the currently viewed team; it is not repeated on
every row.

During the monolith port, replace `teamOptions` with the real universal team
context source. Keep the component's basic contract: selected team id, switch
callback, edit-current-team callback, and add-team callback. If product later
allows non-managers to switch between teams they belong to, split "can switch
teams" from "can manage teams" instead of reusing one broad permission flag.

### Team management sheet

The prototype's add/edit team surface intentionally follows the monolith
right-side Sheet pattern, not a centered modal:

- Monolith reference:
  `@betterup/component-library/src/components/ui/sheet`
- Closest form reference:
  `partner/pages/configuration/priorities/components/OutcomeFormModal`
- Viewport behavior:
  `SheetOverlay` is `fixed inset-0`, so it appears above the app shell/nav.
- Motion:
  the dimmed backdrop fades; the right panel slides in/out from the right.
- Backdrop:
  black dim at about 50% opacity, no blur.
- Dismissal:
  normal modal sheets can close from the X, Escape, or the dimmed backdrop.

`TeamManagementOverlay.jsx` hand-rolls that shell only because this repo is a
standalone prototype. During the monolith port, replace the visual shell with
`<Sheet>` and `<SheetContent side="right">`, then keep the team-record data
seam and save behavior wired to the real Team/TeamMembership API.

The inside of the sheet is intentionally roster-first. Teammates render as
cards, and the final card is always the "add teammate" card. Expanding that
same card reveals the company-directory search and email fallback in-place.
After a person or email is added, the card collapses back to its add state and
the new teammate appears as a normal teammate card. That keeps the focus on
the selected team while still mapping to the real organization user-search
service when the user wants to add someone.

## Important Files

| File | Purpose |
| --- | --- |
| `src/team-dna/TeamDnaExperience.jsx` | Main feature panel. Mount this inside the monolith route. |
| `src/team-dna/TeamDnaPage.jsx` | Standalone local harness. Do not port as the final route. |
| `src/team-dna/components/TeamManagementOverlay.jsx` | Minimal prototype add/edit team overlay. Mirrors the monolith right Sheet behavior locally; replace the shell with component-library `Sheet` / `SheetContent side="right"` during port. |
| `src/team-dna/data/teamDnaAdapter.js` | Replaceable data seam and selection resolver. |
| `src/team-dna/data/teamDnaViewModel.d.ts` | Type-only frontend view-model contract for the monolith port. |
| `src/team-dna/data/teamDnaMock.js` | Demo team data. Do not ship these people, avatars, or scores. |
| `src/team-dna/data/teamManagementMock.js` | Organization employee, temporary team record, Team DNA result fixtures, and the mapper between them. |
| `src/team-dna/data/teamDnaGeneratedInsights.mock.js` | Mock backend-generated insight records. Do not port as frontend AI logic. |
| `src/team-dna/data/teamDnaGenerationLifecycle.mock.js` | Mock backend generation statuses for team/person/duo AI lifecycle states. Do not port as production logic. |
| `src/team-dna/data/teamDnaFallbackRoles.js` | Scott-inspired deterministic person-role matrix for fallback titles. |
| `src/team-dna/data/teamDnaPairInsights.js` | Deterministic fallback insight generation. |
| `src/team-dna/data/teamDnaWatchOuts.js` | Deterministic fallback watch-outs. |
| `src/team-dna/data/bigFiveTraits.js` | Trait order, labels, endpoint names, colors, and fallback spectrum copy. |
| `src/team-dna/data/teamDnaIds.js` | Stable team/person/duo id helpers, including order-insensitive pair ids. |
| `src/team-dna/components/TeamContextSwitcher.jsx` | Manager/admin team switcher, current-team edit button, and add-team entry point. |
| `src/team-dna/components/TeamFaceField.jsx` | Face cluster, selection behavior, duo preview/selection line ownership, and team/person/duo headline area. |
| `src/team-dna/components/TeamFace.jsx` | One person's interactive face button. |
| `src/team-dna/components/DuoConnection.jsx` | Measured line between selected/previewed people. |
| `src/team-dna/components/InsightPanel.jsx` | Right-side scroll panel, insight page transition, and own-profile inline editing behavior. Port inline textareas/buttons to component-library primitives. |
| `src/team-dna/components/InfoBlock.jsx` | Card renderer switch for bloom, spectrum, watch-out, and guidance cards. Owns quiet supporting-card edit action placement and inline body replacement. |
| `src/team-dna/components/BigFiveBloom.jsx` | Radial Big Five shape for team/person/duo. |
| `src/team-dna/components/BigFiveSpectrumList.jsx` | Spectrum carousel and show-all view. |
| `src/team-dna/components/TeamDnaEmptyPreview.jsx` | Animated empty-state preview. Local demo content; not required for the production route. |
| `src/team-dna/components/TeamDnaChatInputBridge.jsx` | Local bridge that mimics monolith ChatInputSection/InputBox. Replace during port. |
| `src/team-dna/components/BetterUpIcon.jsx` | Local icon bridge shaped like the monolith icon API. Replace during port. |
| `src/team-dna/hooks/useTeamDnaPressable.js` | Tiny local press feedback hook for face buttons. Keep local unless a shared BetterUp primitive already covers it. |
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

Open `/results` for this Surface 2 handoff. The root route `/` is a tiny
prototype hub, and `/assessment` is only the parked Surface 1 placeholder.

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

There is no live AI generation in this prototype. The debug harness simulates
the backend status map through `teamDnaGenerationLifecycle.mock.js` so the UI
can still exercise waiting, pending, failed, stale, and ready states.

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

Monolith already has the right handoff shape:

- `MemberHome/components/shared/ChatInputSection.tsx` wraps the Lighthouse
  `InputBox` and accepts `onSubmit(message)`.
- `lighthouse/standalone/routes/ChatRouter.tsx` accepts
  `initial_user_message` in search params, stores it as
  `LH.initial-user-message`, creates the conversation, then navigates to the
  conversation route.
- `lighthouse/standalone/components/MainArea/MainArea.tsx` reads that pending
  initial message and calls `sendUserMessage(...)` once the conversation is
  ready.
- `lighthouse/hooks/useGrowLogic.ts` sends the real socket payload with
  `new_user_messages: [{ text }]`.

Treat this as the working mechanism for the first port. It is not just a note
about a possible future direction.

```txt
Team DNA ask box
  -> setLocation('lighthouse.chat', { searchParams })
  -> ChatRouter creates/opens the Lighthouse conversation
  -> MainArea sends initial_user_message
  -> useGrowLogic sends new_user_messages over the existing channel
```

For this standalone prototype, submitting the Team DNA ask box emits:

```txt
team-dna:grow-chat-prompt
```

with:

```ts
{
  type: 'growChatInitialPromptRequested',
  payload: {
    initialUserMessage,
    scope,
    team,
    selection,
    monolith: {
      route: 'lighthouse.chat',
      searchParams: {
        behavior: 'orchestration',
        initial_user_message,
        skip_initial_messages: 'true',
        title,
        custom_instructions
      }
    }
  }
}
```

During the monolith port, replace the `window.dispatchEvent(...)` placeholder
with:

```ts
setLocation('lighthouse.chat', { searchParams })
```

or call the same route helper used by `useDeeplinkClickHandler`. Do not add a
Team DNA-only AI endpoint unless product decides this should become a separate
contextual AI surface instead of a Grow Chat handoff.

Porting confidence:

| Piece | Confidence | Future engineer action |
| --- | --- | --- |
| `initial_user_message` route param | High | Use it for the first Team DNA -> Grow Chat handoff. |
| `custom_instructions` route param | High | Put concise Team DNA context here so Grow Chat knows the selected team/person/pair. |
| `skip_initial_messages=true` | High | Use it so the user's Team DNA prompt starts the chat instead of generic starter copy. |
| Prototype `team-dna:grow-chat-prompt` event | Low / local only | Delete it during port; it exists only because this repo is standalone. |
| New Team DNA AI endpoint | Low / not recommended | Avoid unless product chooses a separate embedded contextual AI surface. |

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
| Textareas | component-library `Textarea`: `rounded-md`, `border-input`, transparent background, `px-4 py-2`, `focus-visible:ring-2`, `focus-visible:ring-black` |
| Save/cancel buttons | component-library `Button`: rounded-full base, `default` for save, `text` or `tertiary` for cancel |
| Image-backed edit icon | `CircularIconButton` or equivalent round icon button |
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

The profile edit pencil on the image-backed overview card should use a round
icon-button treatment because it sits over generated imagery. The quieter
supporting-card edit pencils can remain simple icon buttons, but they should
still be real buttons with accessible labels and should use `@betterup/icons`.

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

The current result page intentionally uses document-level scrolling: the left
people pane is fixed, the team switcher and AI ask box portal to the viewport,
and the right insight content creates the page scroll. If the monolith route
needs a nested scroll container instead, remap the scroll owner deliberately so
the body and right pane do not both show competing scrollbars.

The standalone CSS uses `:has()` for the spectrum show-all restyle. If the
monolith browser support matrix or CSS pipeline makes that uncomfortable, use
an explicit data attribute instead:

```tsx
<section data-spectrum-view="all">
```

That is a porting detail, not product behavior.

### 11. What to port

Port the reusable feature code:

- `TeamDnaExperience`
- portable components under `src/team-dna/components`, especially
  `TeamContextSwitcher`, `TeamFaceField`, `TeamFace`, `DuoConnection`,
  `InsightPanel`, `InfoBlock`, and the visualization/card components
- hooks under `src/team-dna/hooks`
- deterministic data helpers under `src/team-dna/data`
- `teamDnaViewModel.d.ts` as the type contract
- the team-management mapper concept from `teamManagementMock.js`
- the Team DNA CSS rules, converted to monolith styling conventions

Use the next section to exclude prototype-only bridges and shells from that
broad component list.

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
- `TeamManagementOverlay` as the final production overlay design; use the
  monolith component-library Sheet shell instead
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
- Non-manager empty state keeps the same headline/body but removes setup/demo
  CTAs.
- Team context switcher opens from the current team, switches to other teams,
  shows member counts, opens add team, and edits only the viewed team.
- Team, person, duo, incomplete-assessment, missing-avatar, empty-team, and
  large-team states all render.
- Manager/admin access gates team management controls, generate-anyway, stale
  refresh, and non-manager empty-state CTAs.
- Team summary waits below 3 completed assessments, allows generate-anyway at
  3+ incomplete responses for managers/admins, and shows stale refresh only
  when old generated team insight exists.
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
