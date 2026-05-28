# Surface 1 Vision And Implementation Spec

This is the working spec for Surface 1: the Team DNA assessment path.

It is not a build ticket yet. It is the map we should use before building, so
the next coding pass does not drift into a pretty but useless standalone demo.

## Short Version

Surface 1 should feel like a calm, minimal assessment flow.

Under the hood, it should behave like a custom frontend for BetterUp's existing
assessment engine:

```txt
custom Surface 1 UI
-> normal assessment item keys and response values
-> normal assessment submit lifecycle
-> Team DNA result contract
-> AI-generated profile copy
-> user review, edit, privacy choice
-> Surface 2 can render the approved data
```

The main rule: make the frontend beautiful and bespoke, but keep the data boring
and portable.

## Source Material

Use these as real references, not vibes:

- Current repo README: `/Users/preetoshi/Documents/team-dna/README.md`
- Existing Surface 2 README: `/Users/preetoshi/Documents/team-dna/src/team-dna/README.md`
- Surface 2 view model: `/Users/preetoshi/Documents/team-dna/src/team-dna/data/teamDnaViewModel.d.ts`
- Surface 2 experience: `/Users/preetoshi/Documents/team-dna/src/team-dna/TeamDnaExperience.jsx`
- Surface 2 profile panel: `/Users/preetoshi/Documents/team-dna/src/team-dna/components/InsightPanel.jsx`
- Surface 2 debug panel: `/Users/preetoshi/Documents/team-dna/src/team-dna/dev/TeamDnaDevPanel.jsx`
- Surface 1 placeholder: `/Users/preetoshi/Documents/team-dna/src/team-dna-assessment/TeamDnaAssessmentPage.jsx`
- Partner Experience Studio welcome flow: `/Users/preetoshi/Documents/partner-experience-studio/components/steps/WelcomeStep.tsx`
- Partner Experience Studio app shell: `/Users/preetoshi/Documents/partner-experience-studio/app/page.tsx`
- Previous single-photo avatar capture step, if present in the Partner
  Experience Studio history/branch.
- BetterApart capture ancestry/fallback reference:
  `/Users/preetoshi/betterapart/components/casting-call/steps/EmoteCaptureStep.tsx`
- BetterUp assessment route: `/Users/preetoshi/Documents/BetterUp Monolith/ux/apps/react-platform/src/assessments/routes/RouteAssessmentDetails.tsx`
- BetterUp assessment hooks: `/Users/preetoshi/Documents/BetterUp Monolith/ux/packages/assessments/src/hooks/assessments.ts`
- BetterUp assessment types: `/Users/preetoshi/Documents/BetterUp Monolith/ux/packages/assessments/src/types/assessment.ts`
- BetterUp assessment scoring: `/Users/preetoshi/Documents/BetterUp Monolith/packs/assessments/engine/app/models/concerns/construct_scoring.rb`
- BetterUp avatar upload: `/Users/preetoshi/Documents/BetterUp Monolith/ux/apps/ember-frontend/app/pods/components/avatar-upload/component.js`
- BetterUp user avatar model: `/Users/preetoshi/Documents/BetterUp Monolith/packs/user_management/app/models/user.rb`
- BetterUp Lighthouse LLM pattern: `/Users/preetoshi/Documents/BetterUp Monolith/packs/lighthouse/app/models/concerns/lighthouse/generates_llm_content.rb`
- BetterUp Team Tooling LLM example: `/Users/preetoshi/Documents/BetterUp Monolith/packs/team_tooling/app/models/check_in_session_result.rb`

## Product Intent

Surface 1 has four jobs:

1. Collect valid Big Five assessment answers.
2. Collect a lighter working-style self read.
3. Generate a first Team DNA profile from those signals.
4. Let the user review, edit, and choose privacy before the profile becomes part
   of the team experience.

Surface 1 should not feel like a generic form. It should feel like a quiet
onboarding moment. But it should also be easy for a BetterUp engineer to port
into the monolith.

## Non-Negotiables

- Do not hand-wave the Partner Experience Studio welcome screen. Port the layout
  and animation carefully, property by property.
- Do not bring the 3D hand/shader into Surface 1 right now. Use a same-size video
  placeholder. The real looping hand video can be added later.
- Use non-overlapping fades. The current screen fades out first, then the next
  screen fades in. Do not crossfade question steps.
- Keep the upper progress bar fixed during the question flow.
- Over-correct toward minimalism. If text does not earn its place, remove it.
- Keep Big Five scoring deterministic. AI can explain the result, but AI should
  not score the validated Big Five instrument.
- Remove Scott's team-perception working-style questions for v1. Ask only the
  seven self-preference working-style questions.
- Copy the avatar capture/upload step from the proven prior flow when building,
  not by approximation.
- Add the profile review/edit/privacy step before publishing into Surface 2.
- Keep Surface 1 and Surface 2 separate surfaces, connected by a shared contract.

Explicitly out of v1:

- Dilemmas from the old Partner Experience Studio attempt.
- The AI-guided versus self-guided choice.
- The 3D hand, shader, and Three.js dependency.
- Scott's team-perception `1a`, `2a`, `3a`, etc. questions.
- Playful filler questions, unless we later need them after feeling the direct
  Scott-based flow.

## Recommended Flow

```txt
1. Welcome
2. Big Five questions
3. Working-style questions
4. Submit assessment
5. Avatar capture or upload
6. Saving / processing
7. Profile review and edit
8. Privacy choices
9. Continue to Team DNA
```

The UI can feel like one smooth flow, but the data should treat these as
different kinds of work:

- `welcome`: product intro, no assessment data.
- `assessment`: scored or structured answers.
- `avatar`: user profile media, not an assessment answer.
- `generation`: AI content generation and save lifecycle.
- `review`: user approval and edits, not raw scoring.
- `privacy`: publication settings.

Decision: the assessment itself is complete once the scored/structured
questions are submitted. Avatar, generation, review, edit, and privacy happen
after that submit. They are part of the user-facing Surface 1 flow, but they are
not assessment-engine items and must not affect Big Five scoring.

## Welcome Screen

Use Partner Experience Studio as the exact structural reference.

This is not a "recreate the vibe" task. When building, inspect the existing
welcome component and port it in a micro pass:

```txt
layout first
grid/markers second
hand/video region third
right-side content sizing fourth
typography fifth
CTA sixth
entrance animation seventh
button/start transition eighth
responsive behavior ninth
```

Do not do a broad rewrite from memory. The goal is to match the existing
composition closely while replacing the 3D hand with a video placeholder and
removing the guided-mode choice.

Important values from the current welcome step:

```txt
screen: fixed inset-0 overflow-hidden
background: #F9F9F8
main visual region: left-0 top-[15%] w-[45%] h-[120%]
content container: h-full flex items-center justify-center
content max width: 480px
content transform: translateX(55%)
eyebrow: 13px, uppercase, 0.2em tracking, rubine
title: Ivar, 46px, #1A1A1A, line-height 1.2
subtitle: 18px, #4D4D4D, line-height 1.5
CTA: full-width max 348px, rounded-full, rubine/carmine, white text
```

Grid markers from the reference:

```txt
horizontal lines: top 1.7%, 19.7%, bottom 18.3%, 1.6%
vertical lines: left 6.4%, 40%, 41.2%, right 2.1%
rubine plus markers: left 6.4% top 19.7%, left 40% bottom 18.3%
```

Animation values:

```txt
initial: opacity 0, y 20
animate: opacity 1, y 0
duration: 0.6
ease: [0.215, 0.61, 0.355, 1]
stagger delays: 0.1, 0.2, 0.3, 0.4, 0.5
```

Implementation note: the hand region should be a video placeholder for now, same
size and placement as the old hand region. Do not add Three.js or shader code.

The welcome screen should keep the same background/foreground composition from
Partner Experience Studio. Treat the left visual as a background/foreground
layer, not as a normal two-column layout.

If the old copy is still available, use it as the first pass for headline,
subtitle, and CTA copy, then make only the smallest Team DNA-specific edits. The
first CTA should be a single continue/start action, not a mode selector.

## Visual Rules

Use the same visual family as Surface 2 and Partner Experience Studio:

- Cream/off-white background.
- BetterUp rubine for progress and key accents.
- Ivar/Ivar Headline for big titles.
- Sohne for normal text.
- Sohne Mono only for tiny labels, debug, and machine-ish metadata.
- Spacious centered layouts.
- Small amount of copy.
- No decorative clutter.

Questions should usually sit centered in the screen. The page should feel quiet,
not dashboard-like.

Collapse styles toward the simple Partner Experience Studio visual system:
cream background, rubine accent, Ivar heading, Sohne body, Sohne Mono metadata.
Do not introduce a new decorative language for Surface 1. A deeper design-system
alignment pass can happen later; the first build should stay visually simple and
easy to port.

## Motion Rules

The core motion rule is:

```txt
old thing fades out
brief empty beat
new thing fades in
```

Use `AnimatePresence mode="wait"` or an equivalent state machine so steps never
visually overlap.

Recommended first timing:

```txt
step fade out: 300-450ms
empty beat: 80-140ms
step fade in: 450-650ms
ease: [0.215, 0.61, 0.355, 1]
```

The progress bar is different. It should not fade per question. It stays fixed
at the top during assessment questions and animates its width.

Partner reference progress bar:

```txt
container: fixed top-0 left-0 right-0 h-2 z-50
bar: h-full bg-rubine rounded-r-full
width animation: 0.7s, ease [0.4, 0, 0.2, 1]
```

When the flow leaves the canonical assessment question section, the progress bar
can fade away once, then the review/processing part can take over.

The start action from the welcome screen should follow the same principle:
current welcome content exits first, then the assessment question frame enters.
Do not pop directly from welcome to question one.

## Assessment Model

V1 should use:

- Big Five: current 20-item SDA / IPIP-mini-like assessment, same scale and
  scoring.
- Working style: seven self-preference questions only.

Do not include Scott's `1a`, `2a`, `3a`, etc. team-perception questions in v1.
Reason: they add friction, they are subjective, and team-level averages can be
computed from individual answers later.

The seven working-style self prompts:

```txt
1. I prefer to work at a fast pace.
2. I prefer clear roles, processes, and expectations.
3. I prefer to communicate and work closely with others rather than mostly async.
4. I prefer direct, candid communication.
5. I prefer a high degree of autonomy in how I do my work.
6. I prefer experimenting with new ideas and approaches.
7. I prefer to make decisions quickly.
```

Recommended response shape for each working-style item:

```txt
0 = This does not sound like me
100 = This sounds like me
```

If the monolith assessment engine requires string values, store those as strings:

```txt
responses[item.key] = "0" | "25" | "50" | "75" | "100"
```

This is a prototype convenience only. In the monolith, use the exact configured
`assessment_response_set.assessment_response_options[].value` values for the
real assessment item. Do not invent values in the frontend and hope the scoring
engine interprets them.

## Scott Role And Copy Model

Use Scott's Big Five poles:

```txt
Extraversion: Expressive / Reflective
Openness: Explorative / Practical
Conscientiousness: Structured / Flexible
Agreeableness: Cooperative / Skeptical
Emotional Stability: Calm / Vigilant
```

Surface 2 alignment:

```txt
Data key: neuroticism
User-facing trait label: Pressure sensitivity
User-facing low/high labels: Steady / Vigilant
Scott input language: Emotional Stability, Calm / Vigilant
```

Use Surface 2's existing `BIG_FIVE_TRAITS` metadata as the product-language
source of truth. Do not create a second public label for the same trait. If the
assessment/monolith names the construct differently, map it once in the adapter
and keep the UI language aligned with Surface 2.

Use Scott's 10 team roles as generation guidance:

```txt
Higher Extraversion -> Mobilizer
Lower Extraversion -> Reflective Synthesizer
Higher Openness -> Innovator
Lower Openness -> Practical Stabilizer
Higher Conscientiousness -> Implementer
Lower Conscientiousness -> Adaptive Responder
Higher Agreeableness -> Harmonizer
Lower Agreeableness -> Candid Challenger
Higher Emotional Stability -> Steadying Presence
Lower Emotional Stability -> Vigilant Sentinel
```

Important copy rule:

Low scores are not bad. They are different useful defaults. Watch-outs should be
framed as overextensions of strengths.

Examples:

```txt
not less energy, but energy plus space
not less reflection, but reflection plus earlier voice
not less creativity, but creativity plus convergence
not less realism, but realism plus curiosity
not less vigilance, but vigilance plus prioritization
```

## Question System

Build the frontend question flow as data-driven steps, not hardcoded pages.

Recommended shape:

```ts
type TeamDnaAssessmentStep =
  | { kind: 'welcome' }
  | { kind: 'question'; itemKey: string; questionType: 'likert' | 'slider' | 'choice' | 'interstitial' }
  | { kind: 'avatar' }
  | { kind: 'processing' }
  | { kind: 'review' }
  | { kind: 'privacy' };
```

This makes it easy to:

- Change the order.
- Mix question types.
- Add filler questions later.
- Remove filler questions later.
- Keep one progress model across different question components.

Each scored question component should be replaceable. The flow controller should
not care whether the current question is a slider, choice, or future visual
question.

The implementation should allow 20 to 30 question-like steps without becoming a
pile of special cases. The same question component can render different item
data, but step transitions should still treat each question as its own step so
the progress bar and fade sequencing stay clear.

## BetterUp Assessment Engine Contract

The monolith assessment engine shape is clear enough for v1 planning.

Frontend reads an `Assessment` with:

```txt
assessment.id
assessment.responses
assessment.next_item
assessment.assessment_configuration.assessment_items
assessment.links.post_assessment
```

Each item includes:

```txt
id
key
prompt
item_type
required
body_markdown
framing_markdown
footer_markdown
image_url
image_png_url
assessment_response_set.assessment_response_options
skip_if_key
skip_if_values
skip_unless_key
skip_unless_values
allow_unknown_response
```

Update and submit use:

```txt
PUT /assessments/:id
body: { assessment: { id, responses } }

PUT /assessments/:id
body: { assessment: { id, responses, submitted: true } }
```

The React route does the same thing through:

```txt
useAssessment
useUpdateAssessment
useSubmitAssessment
```

The safest Surface 1 port shape:

```txt
find or create Team DNA assessment
read resolved assessment items from the assessment serializer
render custom Surface 1 steps
store answers by item.key
use real response option values from assessment_response_set
respect required, interstitial, metadata, and skip rules
submit through normal assessment lifecycle with submitted: true
then run Team DNA profile generation
```

Things not to casually change:

- `AssessmentItem#key`
- response value shape
- option values
- required/skipped item rules
- dynamic exclusion behavior
- `submitted: true` timing
- post-submit routing/report behavior

Scoring note: the scoring concern reads `responses[item.key]` and only scores
numeric-looking answers for construct items. That means the pretty UI is free to
look different, but scored responses must remain numeric and tied to real item
keys.

Important engine constraints from the monolith:

- `responses` is an hstore-like object keyed by real assessment item keys.
- Frontend hooks update with `Record<string, string | null>`.
- `AssessmentContainer` updates the whole responses object as the user answers.
- Scale and radio widgets store `assessment_response_option.value`, not the
  label.
- Slider stores a stringified number inside the configured min/max range.
- `skip_if_key`, `skip_if_values`, `skip_unless_key`, and
  `skip_unless_values` decide whether an item is skipped.
- Required items are complete only when answered or skipped.
- Interstitial and metadata items count as complete without a response.
- On submit, the frontend sends `{ assessment: { id, responses, submitted:
  true } }`.
- Construct scoring runs when `submitted_at` is first set.
- Missing or non-numeric construct responses produce nil scores.
- After submit, normal response edits are not permitted through the standard
  policy. The profile review/edit/privacy flow must therefore live outside the
  assessment record.

This means Surface 1 can be visually custom, but it cannot be data-freeform. The
custom UI is a renderer/controller for real assessment items until the assessment
is submitted. After submission, Team DNA profile drafting becomes a separate
product workflow.

## Shared Team DNA Contract

Add a boring shared contract folder before serious Surface 1 code:

```txt
src/team-dna-contract/
```

Recommended files:

```txt
src/team-dna-contract/teamDnaAssessmentContract.js
src/team-dna-contract/teamDnaResultContract.js
src/team-dna-contract/teamDnaGenerationPrompt.md
src/team-dna-contract/teamDnaPrivacyContract.js
```

This folder should not contain UI. It should describe the data passed between:

```txt
Surface 1 -> AI generation -> storage -> Surface 2
```

Recommended raw assessment output:

```ts
type TeamDnaAssessmentOutput = {
  schemaVersion: 'team-dna-assessment-v1';
  assessmentId: string;
  userId: string;
  completedAt: string;
  bigFive: {
    scores: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
    poles: {
      openness: 'practical' | 'explorative';
      conscientiousness: 'flexible' | 'structured';
      extraversion: 'reflective' | 'expressive';
      agreeableness: 'skeptical' | 'cooperative';
      neuroticism: 'calm' | 'vigilant';
    };
  };
  workingStyle: {
    pace: number;
    structure: number;
    collaboration: number;
    communication: number;
    autonomy: number;
    innovation: number;
    decisionMaking: number;
  };
  avatar: {
    source: 'camera' | 'upload' | 'skipped';
    previewUrl?: string;
    uploadedAvatarUrl?: string;
    uploadStatus: 'not_started' | 'uploading' | 'uploaded' | 'failed' | 'skipped';
  };
};
```

Recommended draft persistence model:

```ts
type TeamDnaProfileDraft = {
  schemaVersion: 'team-dna-profile-draft-v1';
  userId: string;
  sourceAssessmentId: string;
  status: 'draft' | 'published';
  generatedProfile: TeamDnaGeneratedProfile;
  editedProfile?: Partial<TeamDnaGeneratedProfile['profile']>;
  privacy: TeamDnaProfilePrivacy;
  updatedAt: string;
};
```

Prototype minimum:

```txt
Use local state plus localStorage/sessionStorage so refreshes do not destroy the
draft during design iteration.
```

Real product minimum:

```txt
After assessment submission and AI generation, save a private draft connected to
the authenticated user and source assessment id. The draft can exist before the
team can see it. Surface 2 should only use the published/approved fields, or
private fields visible to the owner.
```

Do not overbuild this into a full content-management system. The important
production seam is simply:

```txt
submitted assessment -> generated private draft -> user edits/privacy -> publish/save
```

Recommended generated profile output:

```ts
type TeamDnaGeneratedProfile = {
  schemaVersion: 'team-dna-profile-v1';
  userId: string;
  sourceAssessmentId: string;
  generatedAt: string;
  generationStatus: 'pending' | 'ready' | 'failed' | 'stale';
  role: {
    primary: string;
    secondary?: string;
  };
  profile: {
    title: string;
    summary: string;
    strengths: string[];
    watchOuts: string[];
    workingStyle: string[];
    howToWorkWithMe: string[];
    coachingNotes?: string[];
    meetingBehavior?: string;
  };
};
```

The generated profile should be canonical Team DNA product data, not raw Surface
2 UI data. A shared adapter should map this canonical profile into the
`TeamDnaInsight` view model that Surface 2 renders. This keeps the AI prompt from
depending directly on a specific UI component shape.

Recommended privacy fields:

```ts
type TeamDnaProfilePrivacy = {
  profileVisibility: 'private' | 'teams';
  pairComparisonVisibility: 'not_allowed' | 'teams';
};
```

## AI Generation

The local prototype should use an OpenAI call so we can test the prompt for
real. But the monolith port should probably follow the existing Lighthouse
pattern.

Do not put an OpenAI API key in browser code. The prototype should call a local
server/API route that reads the key from the environment. The browser should send
only the Team DNA generation input payload to that local endpoint.

The BetterUp pattern:

```txt
model includes Lighthouse::GeneratesLlmContent
model has *_generation_status column
prompt/message template lives in app/views/... text template
generate_llm_content_later(:name) enqueues a job
generate_llm_content_now!(:name) can run synchronously
success block maps response fields onto model fields
fallback block gives safe deterministic content
status values: processing, completed, failed
```

Team Tooling already uses this for team pulse results. That is the closest
monolith reference for Team DNA.

Recommended local prototype files:

```txt
src/team-dna-assessment/ai/buildTeamDnaProfileInput.js
src/team-dna-assessment/ai/generateTeamDnaProfile.js
src/team-dna-assessment/ai/teamDnaProfilePrompt.md
src/team-dna-assessment/ai/teamDnaProfileSchema.js
```

Recommended monolith port shape:

```txt
TeamDnaProfileResult includes Lighthouse::GeneratesLlmContent
generates_llm_content :profile
slug 'team-dna-profile'
message_context { assessment scores, working style, Scott role map }
success { map response to profile/result fields }
fallback { deterministic profile copy from scores }
```

The prompt should receive:

- Big Five scores and pole labels.
- Working-style scores.
- Scott's role map.
- Scott's developmental copy rules.
- The canonical Team DNA profile output schema.
- Surface 2 language/card expectations as guidance, not as the raw output
  contract.
- Any user-approved edits if regenerating.

The prompt should not invent raw scores. It should explain and shape known
scores into useful profile copy.

The same prompt shape should be reusable later for stale/regeneration states in
Surface 2. Surface 1 is the first place the profile is generated, but Surface 2
may need to regenerate team, person, or duo copy when source data changes.

Keep the AI call easy to port:

```txt
input builder -> prompt file -> AI service call -> schema validation -> mapped output
```

Document those parts in code with short `What`, `How`, and `Port` comments when
the build starts. Engineers should be able to find the prompt, see the exact
input payload, see the expected output shape, and replace the local OpenAI call
with the monolith's LLM mechanism.

## Avatar Capture And Upload

The avatar step is part of the user flow, but it should not be part of Big Five
assessment scoring.

The primary reference should be the previous Partner Experience Studio-derived
single-photo avatar step. That version already adapted the older BetterApart
multi-expression capture into the simpler one-photo profile use case.

If that single-photo step is not present in the current checkout, use the
BetterApart capture step only as ancestry for mechanics and timing:

```txt
COUNTDOWN_START = 3
COUNTDOWN_TICK_MS = 1500
COUNTDOWN_FADE_MS = 500
ABSORB_DELAY_MS = 2200
FLASH_MS = 180
FREEZE_MS = 1500
DONE_CROSSFADE_MS = 350
SNAPSHOT_QUALITY = 0.92
camera: facingMode user, width 720, height 720
circle: min(660px, 75vw, 60vh)
countdown font: min(144px, 16vw, 13vh)
```

It mirrors the webcam and canvas snapshot with `scaleX(-1)`. Keep that behavior.

Also preserve the feeling of the step:

- The friendly interstitial before capture.
- The `3, 2, 1` countdown.
- The flash/freeze moment after the photo.
- The "how we will use this" reassurance.
- Upload as a peer option to camera capture.
- Retry/retake without making the user restart the assessment.

BetterUp's existing avatar upload shape:

```txt
PUT user.meta.links.self
fileKey: user[avatar]
accept: image/png,image/jpg,image/jpeg
```

The User model has:

```txt
has_one_attached :avatar
variants: square_320, thumbnail
```

The serialized avatar shape includes:

```txt
avatar.links.square_320.href
avatar.links.thumbnail.href
avatar_uploaded
```

Recommended v1 decision:

Use one profile avatar image for Team DNA, not five expression captures. Copy the
single-photo Partner Studio behavior when available. If falling back to
BetterApart, copy only the countdown, camera, freeze, flash, upload, and retry
feel, not the five-expression data model.

Avatar should be encouraged, human, and easy, but not blocking. A user should be
allowed to finish Team DNA without a photo.

Open question: should we also keep multiple expression captures for a future
visual identity system? My recommendation is no for v1. One good avatar is
enough, and it maps cleanly to BetterUp's existing profile pipeline.

## Processing State

Surface 1 needs a real processing state even if the prototype feels fast.

It represents:

```txt
submit assessment
save avatar if present
normalize scores
call AI generation
receive generated profile
prepare editable review screen
```

User-facing copy should be tiny. Example:

```txt
Reading your Team DNA
```

Avoid explaining the whole backend. The debug panel can show that.

## Profile Review And Edit

Do not send the user straight to Surface 2 after generation.

Recommended flow:

```txt
AI generates profile
Surface 1 shows the user their profile
user can edit generated copy
user chooses privacy settings
user saves/publishes
then Surface 2 can consume the approved profile
```

This matters because Team DNA describes people. The user should get control
before other people can see or pair against their profile.

The generated profile should be saved as a private draft before review. That
means refresh/recovery is safer, but the team still cannot see it until the user
saves/continues with their chosen visibility settings.

Use Surface 2 components where possible:

- `InsightPanel` style and editing behavior.
- `InfoBlock` card style.
- Existing own-profile inline edit behavior.
- Existing `TeamDnaInsight` view model.

But keep the Surface 1 layout separate. Surface 1 review is a solo profile
approval screen, not the full team results surface.

Recommended layout:

```txt
left: profile image / avatar
right: generated profile cards and inline edit controls
bottom or footer: privacy choices + save
```

The profile image on the left should be editable from this screen. The user
should be able to retake or upload a different image without restarting the
assessment flow.

If Surface 2 card styling changes later, Surface 1 review should benefit because
it shares the same presentational components.

The final CTA should stay simple:

```txt
Save and continue
```

Visibility settings sit near that CTA. Defaults are already selected. The user
can adjust them if they care.

## Privacy And Surface 2 Impact

Add explicit profile permissions:

```txt
profileVisibility: private | teams
pairComparisonVisibility: not_allowed | teams
```

Recommended default for prototype:

```txt
profileVisibility = teams
pairComparisonVisibility = teams
```

But the UI should make the choice visible before save.

Keep the user-facing scope simple for now:

```txt
Share my profile with teams I am in
Allow pair comparisons with teams I am in
```

The owner can always see their own draft/profile regardless of these sharing
settings.

Surface 2 should respect these states:

- Assessment incomplete: current pending/incomplete behavior.
- Profile private: face appears in the people selector, but other people cannot
  open the solo profile.
- Pairing not allowed: face can look complete, but pair selection is blocked.

Use the existing negative feedback pattern:

```txt
click blocked person
-> small shake / non-destructive feedback
-> tooltip explains why
```

Suggested tooltip copy:

```txt
Profile not shared
Pairing not allowed
Needs DNA assessment
```

Do not make privacy-blocked people look pending. Their DNA may exist. The state
is permission, not missing data.

Keep profile visibility and pairing permission as two separate controls:

```txt
Share my profile with teams I am in
Allow pair comparisons with teams I am in
```

Both controls can default on in the prototype, but they must be visible before
the user saves and continues.

Concrete Surface 2 follow-on work:

- Extend `TeamDnaMember.meta` or a typed member field with:
  - `profileVisibility`
  - `pairComparisonVisibility`
  - `profileDraftStatus` or equivalent published/private state
- Update `TeamDnaExperience` selection logic so `assessmentComplete` is not the
  only blocked state.
- Keep `selectableMemberIds` for people with completed DNA, but add a separate
  permission gate when selecting solo or duo views.
- Solo selection rule:
  - owner can open their own profile
  - managers/admins follow product permission rules
  - teammates cannot open a private profile
- Duo selection rule:
  - both selected members need completed DNA
  - both selected members need `pairComparisonVisibility = teams`
  - blocked duo clicks use the same shake/tooltip pattern
- Update `TeamFace` so blocked permission states can show tooltip text other
  than `Assessment incomplete`.
- Do not show the `Pending` pill for privacy-blocked members. Pending is only for
  missing/incomplete DNA.
- Update lifecycle/readiness helpers so privacy-blocked people are not treated
  as `not_ready`. Their data may be ready; the viewer is just not allowed to see
  that scope.
- Add debug toggles for profile visibility and pair permission, similar to the
  existing avatar/DNA toggles.
- Route generated canonical profile data through the shared
  `teamDnaProfileToInsightAdapter` before Surface 2 renders it.
- Keep own-profile editing behavior working for the signed-in owner even if their
  profile is not shared with teammates.

## Debug Panel

Surface 1 should get a dev panel that follows Surface 2's pattern:

```txt
toggle key: backslash
panel motion: slides from right
styling: same black debug drawer family
purpose: local-only visibility into state
```

Surface 1 debug contents:

- Current step id.
- Current question index.
- Progress percent.
- Raw `responses` object.
- Current assessment item key.
- Assessment engine payload preview.
- Big Five computed scores.
- Working-style scores.
- Avatar upload state.
- AI generation status.
- Prompt input payload.
- AI output payload.
- Privacy settings.
- Copy buttons for raw input and generated output.

Keep it mostly read-only. This is a viewer/debugger, not a second product UI.
Default to showing only a few sections at a time, with expandable/copyable data
blocks for the full payloads. The debug panel should help us inspect the hidden
data flow without making the product surface noisy.

Prototype-only warning: do not ship this raw payload viewer to production users.
It can expose assessment answers, prompt inputs, AI outputs, avatar state, and
privacy flags.

## Suggested File Plan

First build pass:

```txt
src/team-dna-contract/
  teamDnaAssessmentContract.js
  teamDnaResultContract.js
  teamDnaPrivacyContract.js
  teamDnaProfilePrompt.md

src/team-dna-assessment/
  TeamDnaAssessmentPage.jsx
  teamDnaAssessment.css
  assessmentSteps.js
  assessmentEngineAdapter.js
  teamDnaAssessmentScoring.js
  teamDnaWorkingStyle.js
  TeamDnaAssessmentDebugPanel.jsx

src/team-dna-assessment/components/
  AssessmentWelcome.jsx
  AssessmentProgressBar.jsx
  AssessmentStepFrame.jsx
  LikertQuestion.jsx
  WorkingStyleSlider.jsx
  AvatarCaptureStep.jsx
  ProcessingStep.jsx
  ProfileReviewStep.jsx
  PrivacyControls.jsx

src/team-dna-assessment/ai/
  buildTeamDnaProfileInput.js
  generateTeamDnaProfile.js
  teamDnaProfileSchema.js

src/team-dna-shared/
  teamDnaProfileToInsightAdapter.js
```

Shared component option:

```txt
src/team-dna-shared/
  InsightPanel primitives that Surface 1 and Surface 2 both use
```

Do this only if sharing becomes clean. Do not create a fake shared layer if it
turns into a tangled import mess.

## Build Phases

### Phase 1: Contract And Shell

- Add `src/team-dna-contract`.
- Define assessment output, generated profile, and privacy shapes.
- Replace the parked placeholder with the Partner-style welcome screen.
- Port the welcome screen in small visual passes, not from memory.
- Add the fixed progress bar.
- Add non-overlapping step transition frame.
- Add debug panel skeleton.

### Phase 2: Assessment Questions

- Add the 20 Big Five items as data.
- Add the seven working-style self items.
- Implement answer storage by item key.
- Implement deterministic scoring for local prototype.
- Keep the step order easy to change.
- Do not add filler/dummy questions yet unless we need them for feel.

### Phase 3: Avatar

- Port the capture/upload step carefully from the proven flow.
- Use one final avatar image for v1.
- Add upload/skipped/failed states.
- Map the eventual monolith path to `user[avatar]`.
- Allow avatar retake/re-upload from the final review screen.

### Phase 4: AI Generation

- Add local OpenAI-backed generation.
- Route the OpenAI call through a server/API endpoint, not browser code.
- Add a separate input builder for the prompt payload.
- Keep the prompt in its own markdown file.
- Validate the output against a schema.
- Add deterministic fallback.
- Map generated profile data into Surface 2's `TeamDnaInsight` view model with a
  shared adapter.
- Show processing state while generation runs.
- Show raw prompt input and AI output in the debug panel.
- If AI generation fails, show the deterministic fallback profile and let the
  user continue. The debug panel can show the failure.
- Add short porting comments around the input builder, prompt call, schema, and
  output mapper.

### Phase 5: Review, Edit, Privacy

- Reuse Surface 2 profile card/editing patterns where clean.
- Let the user edit generated profile copy.
- Add profile and pairing visibility choices.
- Save the approved result into the shared contract shape.
- Save the generated result as a private draft before approval.
- Use one minimal primary CTA: `Save and continue`.
- Keep all review edits and privacy settings outside the submitted assessment
  record.

### Phase 6: Surface 2 Permission States

- Extend Surface 2 member meta with profile/pairing visibility.
- Keep complete-but-private people visually complete.
- Block individual or duo selection with the existing shake/tooltip pattern.
- Add debug toggles for privacy states.

## Open Questions

1. Exact Big Five item source

   We still need the actual 20 SDA item keys, wording, reverse scoring, and
   response values from Scott's sheet or the monolith assessment config.

2. Local scoring versus monolith scoring

   The prototype needs local scoring so it can work alone. The monolith port
   should rely on the assessment engine for scored construct output where
   possible.

3. Privacy defaults in production

   Prototype default is selected-on but adjustable. Product/legal may later want
   explicit opt-in instead of default sharing.

4. Where approved Team DNA profile data lives

   This likely wants its own Team DNA profile/result model, not raw assessment
   responses. Assessment answers are source data and become hard to edit after
   submit. The approved generated profile is product data.

5. Whether pair/team generation happens immediately or lazily

   Current recommendation: generate individual profile at Surface 1 completion.
   Generate duo/team insights lazily in Surface 2 when enough people,
   permissions, and product context exist. Engineering may have a stronger
   preference once we see real generation/storage constraints.

6. How much prompt output should be editable

   Recommendation: editable profile-facing copy only. Do not let users edit raw
   scores.

## Working Decision Set

These are the current recommended decisions:

- Surface 1 is a custom renderer around the assessment engine, not a new engine.
- Big Five uses deterministic scoring.
- Working style v1 asks self-only questions.
- Monolith response values come from real assessment response options, not
  invented frontend values.
- Surface 2 trait labels remain the user-facing language source of truth.
- Avatar capture is part of the flow but not part of assessment scoring.
- Avatar is encouraged but skippable.
- AI generates profile copy after assessment submission.
- AI output is canonical profile data; an adapter maps it into Surface 2 insight
  data.
- Local OpenAI calls go through a server/API endpoint, never directly from the
  browser.
- If AI fails, deterministic fallback profile lets the user continue.
- Generated profile is saved as a private draft before user approval.
- User reviews and edits before publishing/sharing.
- Privacy flags become first-class data.
- Profile visibility and pairing permission are separate controls.
- Defaults are selected, but users can adjust them before `Save and continue`.
- Sharing applies to teams the user is in.
- Owners can always see their own draft/profile.
- Private profiles still appear in the people selector; solo profile opening is
  blocked for other viewers.
- Surface 2 should share profile display/edit primitives where clean.
- Surface 1 review uses a new layout that can house the same cards/components.
- Avatar/profile image can be re-edited from the final review screen.
- Surface 2 needs new permission-blocked states.
- The whole build should optimize for easy monolith surgery later.
