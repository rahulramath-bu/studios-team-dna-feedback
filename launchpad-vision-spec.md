# Team DNA launchpad vision spec

Date: May 19, 2026  
Phase: Launchpad prototype before monolith integration  
Working goal: make a beautiful, functional, portable Team DNA experience that raises the team's expectations for what can be designed and engineered quickly.

## The simple version

Team DNA helps a team understand how its people work, what different people create together, and what the team can try next.

The prototype should feel inspiring, but not fake. It should be built like real product engineering: responsive, data-shaped, design-system-aware, and easy for a BetterUp engineer to imagine moving into the monolith.

## Why this exists

This project is partly a product idea and partly a proof point.

The product goal is to turn personality and working-style data into useful team insight. Not a dashboard full of scores. Not a ranking system. A calm surface that helps people see:

- What is powerful about the whole team.
- What is powerful about one person.
- What two people may create together.
- What the team might try next.

The meta goal is to show a real product team that "beautiful" and "buildable" are not enemies. The launchpad should make people feel: this is polished, this is useful, this uses the design system, and this is much closer to implementation than a throwaway mockup.

## The meta bet

The product team is used to a traditional process: design makes the thing, engineering later figures out how to build it, and the monolith becomes the scary handoff zone. This launchpad should challenge that expectation.

The bet is:

- A single day of focused design and engineering can create something that feels better than a normal two-week design handoff.
- The work can be inspiring without becoming unrealistic.
- The design system can be used in a beautiful way, not just a compliant way.
- New interaction patterns can still be design-system-aligned when the design system does not define those patterns yet.
- A standalone prototype can be built like a future monolith feature, not like disposable demo code.

The emotional outcome matters. The team should feel a little surprised in a good way: "This feels ambitious, but I can see how it would actually fit."

The practical outcome matters just as much. When someone asks a skeptical question, the answer should already be in the work:

- Does it use the design system? Yes, visually and structurally.
- Does it work on mobile? Yes, with known edge cases called out.
- Can engineering port it? Yes, because shell, data, routing, and UI concerns are separated.
- Is it just a mock? No, it is a product slice using realistic mock data and a replaceable adapter.
- Are we inventing an AI system? No, AI is noted as a future contextual layer around existing Grow/Lighthouse direction.

This is why the prototype should feel calm, minimal, and confident. It should not feel like software inside software. It should feel like one feature inside the larger BetterUp product.

## How to read the source material

The PRD is useful context, not the boss. It explains the original product intent: Team DNA as a team assessment, team insight, and coaching surface. It also contains solution ideas that can make the UI feel heavier than it needs to be.

The designer alignment notes are stronger design authority. They capture the core design philosophy: insight first, multiplication instead of comparison, differences as a strength, and one continuous surface across team, individual, and duo views.

The Figma concepts are directional. They show the visual and interaction intent, but the frames were not built as final responsive layouts or code-ready constraints.

The BetterUp monolith is the implementation reality check. The launchpad should borrow its design system, motion stack, routing assumptions, and component habits where they help.

## Design-system alignment strategy

This project should be able to say: "We are using the design system, and this is proof that the design system can produce a beautiful experience."

That does not mean copying every Figma value literally. It means translating the concept into the design system's actual tokens, components, and code patterns.

### What the design system owns

The design system should own the visual language:

- Typography.
- Color.
- Buttons.
- Icons.
- Cards and borders.
- Focus states.
- Spacing rhythm where the system gives one.
- Theme compatibility.

Concrete monolith anchors:

- `ux/apps/react-platform/src/styles/index.css` imports the component-library token files.
- `ux/packages/component-library/tokens/output/theme.css` defines the `2026` and `uplift` theme variables.
- `ux/packages/component-library/src/components/ui/button.tsx` exposes the design-system `Button`.
- `ux/packages/component-library/src/components/ui/heading.tsx` exposes `Heading`.
- `ux/packages/component-library/src/components/ui/text.tsx` exposes `Text`.
- `@betterup/icons` is already used by the component-library button.

### Token translation

The Figma concept currently uses the right family of visual ideas, but it is not yet token-precise. The implementation should translate the concept like this:

| Concept need | Design-system alignment |
| --- | --- |
| Page/surface background | Prefer `--page-background` / `--background` from the `2026` or `uplift` theme. Current monolith value is `#F3F2EE`. |
| Main text | Use `--foreground` / `--foreground-heading`. Current `2026`/`uplift` value is `#1D1925`. |
| Body text | Use `--foreground-body` where available. Current `2026`/`uplift` value is `#5C5C5C`. |
| Selection ring / emphasis | Use `--primary`. Current `2026`/`uplift` value is `#CE0058`, matching the pink/red ring direction. |
| Cards / info blocks | Use `--card`, `--card-subtle-bg`, `--card-subtle-border`, `--card-shadow`, and `--radius` before inventing local card styles. |
| Face focus shadow/ring | Use primary and foreground tokens, with custom geometry only because the face cluster is a new interaction pattern. |

The concept background is warmer than the current `2026`/`uplift` page background. Use the theme background first. Only introduce a Team DNA-specific warm surface token if that warmth proves important and design review agrees.

### Typography translation

The Figma concept uses Sohne Mono, Ivar Display, and Sohne. That maps well to the monolith's theme direction.

Implementation should use:

- The monolith display heading token for the main superpower title. Important nuance: the Tailwind `font-heading` path maps to `Ivar Headline`, while the theme-level `--heading-display-font` / `.text-display-heading` path maps to `Ivar Display`, which is the direction we want for Team DNA.
- `Text` for body copy.
- `Text` with the all-caps/small-caps variant for eyebrow labels like `TEAM DNA`, person names, or duo labels.
- Design-system type sizes first, then local CSS only if the component-library sizes cannot express the intended hierarchy.

The goal is to preserve the Figma intent while proving the design system can carry the experience.

### Component translation

Use design-system components where they are the right owner:

- Use `Button` for normal actions.
- Use icon support from `@betterup/icons` for edit or utility actions.
- Use `Heading` and `Text` for readable content.
- Use token-built card surfaces for `InfoBlock`.

For the standalone prototype, local CSS should keep the same token names the monolith exposes: `--label-*`, `--heading-display-*`, `--foreground-heading`, `--foreground-body`, `--card-subtle-*`, `--ring`, and `--radius`. That makes the porting pass more like removing local fallbacks than renaming the whole visual system.

For standalone icon rendering, use a tiny BetterUp-shaped bridge instead of a third-party icon dependency. In the monolith, that bridge should collapse into `@betterup/icons/src/Icon` with names like `Edit`.

Use custom Team DNA components where the design system does not have a product-specific primitive:

- `TeamFace`.
- `TeamFaceField`.
- The selected/dimmed/focused face cluster behavior.
- The animated team/individual/duo insight transition.

Those custom pieces should still use design-system tokens for color, radius, focus, text, and spacing. The new thing is the interaction pattern, not a new visual design system.

### Interaction alignment

The design system appears stronger on visual primitives than on interaction patterns. That is not a blocker. It just means Team DNA should propose an interaction pattern that sits on top of the system:

- Faces are semantic buttons.
- Selected faces expose selected state clearly.
- Focus states are keyboard-visible.
- Reduced-motion preferences are respected.
- Motion uses the monolith's existing `motion/react` package.
- Content transitions use exit-before-enter behavior so ideas do not crossfade into each other.
- Pressable items should distinguish press-down feedback from press-up commit. The BetterApart `Pressable` pattern is the reference: give immediate tactile feedback on pointer down, but let the selected state commit through the native click moment on pointer-up-inside. In the launchpad, this can live as a tiny Team DNA hook; in the monolith, it should map to a shared pressable primitive only if design system/product engineering want that interaction grammar globally.

This is the clean argument: Team DNA is not breaking the design system. It is extending the product's interaction vocabulary while staying visually aligned.

### Alignment proof checklist

Before showing the prototype, be able to point to:

- Which tokens power the background, text, primary ring, cards, and borders.
- Which component-library components are used.
- Which pieces are custom because the design system does not own that behavior yet.
- Which interaction details are documented for future design-system discussion.
- How the same component can mount in a standalone prototype today and a Team subtab later.

## Build approach: idea first, system aware

Do not let design-system precision shrink the idea too early. Also do not build a beautiful island that has to be rebuilt later.

The right approach is two tracks at the same time:

- Protect the ideal user experience while the concept is still becoming visible.
- Keep the engineering seams aligned with the monolith from the first component.

That means we should not spend the first hour arguing over every token, heading size, or card radius. The first coded pass should get the real experience working: the clustered team surface, selection behavior, team/person/duo insight changes, motion, responsive shape, and data adapter.

But the first coded pass should still use the right kinds of parts:

- React components shaped like monolith components.
- `motion/react`, not a new animation library.
- Stable IDs and real selection state, not fake visual-only state.
- A data adapter, not data buried inside JSX.
- Semantic buttons for faces, not clickable divs.
- A page shell that can sit inside Team Tooling, not a standalone mini-product shell.

Then do a deliberate design-system pass before showing the work as "portable." That pass should:

- Replace rough buttons/headings/body text with component-library `Button`, `Heading`, and `Text` where they fit.
- Map colors to theme tokens before keeping custom colors.
- Map ordinary card surfaces to card/background/border/shadow tokens before keeping custom surfaces.
- Keep custom CSS only for Team DNA-specific geometry, like the face cluster, selected rings, and motion layout.
- Write down any intentional exception in a short note so it reads as a design decision, not drift.

The useful distinction is:

- Design-system fundamentals are day-one constraints.
- Design-system exactness is a pass.
- Interaction invention is allowed when the system does not already own that pattern.

Colors, fonts, and ordinary controls should be relatively easy to align with the system. The harder part is the Team DNA interaction itself: the clustered people field, selected/dimmed behavior, duo focus, and animated insight transition. That custom interaction should be protected as product experience work, then expressed with system tokens wherever possible.

If a design-system primitive, size, or color makes the experience worse, the team can detach from that primitive deliberately. But the default order should be: try the system path first, evaluate it in the real UI, then keep a custom value only when the better user experience is worth it.

This lets us champion the best user experience first, then prove it can live inside BetterUp's system instead of being watered down by it.

## Build passes

The launchpad should move in clear passes so the work stays focused.

1. Experience and architecture pass.
   Build View 1 with real selection state, motion, responsive structure, empty info blocks, and a replaceable data adapter. This pass proves the core idea.

2. Design-system alignment pass.
   Map typography, colors, buttons, cards, spacing, focus states, and shadows to the component library and theme tokens. Keep custom styling only where the Team DNA interaction needs it.

3. Insight copy and content pass.
   Fill the superpower copy and future info blocks with stronger content. Pair and team insights can be drafted with AI assistance, but they should land as curated deterministic fixture/content data, not as live runtime AI.

4. View 2 and mobile pass.
   Revisit the horizontal focus rail as both a second design direction and the likely mobile-forward solution if View 1 feels too tall or awkward on small screens.

5. Grow/Q&A pass.
   Add the ability to ask questions about the current team, person, or duo context. This should reuse or hand off to Grow/Lighthouse patterns instead of inventing a separate chat engine.

## Product principles

1. Insight first, metrics second.
   The first read should be human and useful. Scores, traits, and evidence can support the insight, but they should not be the main event.

2. Lead with the superpower.
   The main blurb should be positive and memorable. It should tell the user what is powerful about the team, person, or duo before showing supporting detail.

3. Progressive disclosure.
   The surface should not dump every possible trait, metric, and recommendation at once. The hero insight gives the main read; info blocks hold supporting evidence, recommendations, and future deeper content.

4. Multiplication, not comparison.
   A duo view is not "who is better" or "how different are they." It is "what happens when these two people work together."

5. Differences are the point.
   The product should treat contrast as material for collaboration, not as a problem to smooth out.

6. Spectrums, not scores.
   Avoid percentages, winner-style scoring, and fill-bar psychology. If trait language appears, both ends of the spectrum should feel valid.

7. One surface, three levels.
   The user should not feel like they are jumping between separate products. Team, individual, and duo should be different states of one experience.

8. Fewer pieces doing more.
   The same face component should scale, move, dim, and become selected. The same insight component should handle team, person, and duo copy. Avoid fake duplicate elements that only exist to create a transition.

9. Motion should prove continuity.
   Animation should make the user feel like the same people and same surface are responding to attention. It should not feel like a slideshow.

10. Fade out before fade in.
   When text or content changes, the old content should leave first, then the new content should enter. No muddy crossfade between two different ideas.

11. Build the prototype like a product slice.
   Mock data is fine. A fake architecture is not. The data should be shaped so a future API can replace it without rewriting the experience.

12. Document the why.
   The spec and the code should explain ownership boundaries, design-system decisions, and portability decisions clearly enough that design, product, engineering, and future coding assistants can understand why the build should work.

## Core experience model

The experience has three states:

### Team state

No person is selected. The surface explains the whole team's superpower and supporting insights.

Example role:

- Label: TEAM DNA
- Title: FlightHouse
- Superpower: The team-level strength or working pattern.
- Info blocks: expandable future homes for trait evidence, team rituals, risks, prompts, or recommendations.

### Individual state

One person is selected. The selected person becomes the center of attention, and the content explains that person's working superpower.

Example role:

- Label: RAHUL RAMATH
- Title: The Innovator
- Superpower: A positive, useful read of the person's working style.
- Info blocks: future homes for strengths, watchouts, collaboration tips, or how to work with them.

### Duo state

Two people are selected. The two selected people become visually connected, and the content explains what they create together.

Example role:

- Label: RAHUL X SERGIO
- Title: The Balancers
- Superpower: A synthesized read of their combined working energy.
- Info blocks: future homes for where the pair is strong, where they may misread each other, and how to collaborate well.

## Launchpad view strategy

Phase one should focus on View 1: the team cluster.

This keeps the first coded prototype simpler and sharper. View 2 is still a useful idea, but it should be treated as a later experiment, not part of the first build. The launchpad should prove the core Team DNA interaction with one strong surface before adding another layout model.

### View 1: Team cluster

This is the grid-style view from the Figma concept.

What it does well:

- Makes the team feel like a team, not a list.
- Gives a strong desktop layout.
- Keeps people visually clustered.
- Supports a clear left-side people surface and right-side insight surface.

Risks:

- Large teams can create a tall people area.
- On mobile, selecting a person and then scrolling back to the content may feel awkward.
- Duo selection is harder to dramatize because selected people may be far apart in the grid.

Recommended behavior:

- Desktop: max 3 columns of people, flexible rows.
- Mobile: stack people above content and keep the selection behavior simple.
- Selection: selected faces scale up and get a primary ring; unselected faces dim and shrink slightly.
- Large teams: treat extra scrolling as a known pressure point to test, not a reason to build View 2 immediately.

### Future option: Horizontal focus rail

This is the horizontal view from the Figma concept. Do not build it in phase one.

Treat this as the most likely future mobile pass. View 1 can prove the main experience on desktop and normal mobile cases. View 2 can later solve the mobile pressure created by tall teams: selection stays horizontally reachable, selected people can center themselves, and the page does not require the user to scroll back up through the face cluster as often.

Why it may come back later:

- Scales better on mobile through native horizontal scrolling.
- Makes the selected person or duo feel centered and celebrated.
- Lets two selected people move next to each other, which makes the duo story stronger.
- Keeps the content below in a simple stack on mobile.

Why it should wait:

- It adds another layout system before the core experience has been proven.
- Needs careful touch target sizing.
- Teams larger than 12 may need scroll hints, edge fades, or simple arrows.
- If over-animated, it could feel like a carousel instead of a calm product surface.

Future behavior to revisit:

- Desktop: rail on top, blurb and info blocks below in two columns.
- Mobile: rail on top, blurb below, info blocks stacked underneath.
- Selection: selected people animate toward the center and enlarge. A selected duo should sit together in the middle.

### Current layout recommendation

Build View 1 first.

Phase-one recommendation:

- Use the team cluster for desktop teams of 3 to 12.
- Use the same team cluster on mobile, stacked above the content.
- Keep the component boundaries clean enough that View 2 can reuse the same `TeamFace` and insight components later.
- Treat View 2 as the likely future mobile optimization, not as a day-one requirement.
- Use the backslash debug panel for data and state testing, not for switching between View 1 and View 2.

## Responsive rules

Design for 3 to 12 people as the primary range. Tolerate larger teams without breaking.

The experience should have:

- A desktop two-column structure where the people surface and insight surface can sit side by side.
- A mobile structure where people sit above the insight content.
- A cluster layout that still works inside a narrower Team tab/subtab content area.
- A clear known-risk note if large teams make mobile selection feel too scroll-heavy.
- Touch targets that stay comfortable.
- Info blocks that stack naturally on small screens.
- Text that never relies on giant viewport-scaled type.

## Component model

The prototype should be small, portable, and easy to map into the monolith later.

Suggested components:

- `TeamDnaExperience`: owns the selected state, dataset, host context, and layout constraints.
- `TeamFaceField`: renders the View 1 cluster layout.
- `TeamFace`: one reusable face component with default, selected, dimmed, and focused states.
- `InsightHero`: renders the label, title, and main superpower copy for team, individual, or duo.
- `InfoBlock`: reusable empty/flexible card for future supporting content. In the first pass, these should be intentionally empty or clearly skeletal, not filled with believable placeholder content yet.
- `DebugPanel`: toggles dataset, team size, completion state, and selected state.
- `teamDnaAdapter`: isolates mock data today from future API data tomorrow.

This structure matters because it keeps the product logic clean:

- The face component owns how a person looks.
- The field owns where people are arranged.
- The experience shell owns what is selected.
- The adapter owns where data comes from.
- A future rail can be added as a new layout around the same `TeamFace` and `InsightHero` pieces if View 1 exposes real limits.

## Documentation and comments

This work should be unusually clear about why it is built the way it is.

The goal is not to comment every line. The goal is to leave small, useful notes at the places future people may question:

- Why Team DNA is a portable panel instead of a full page shell.
- Why View 1 is the phase-one path and View 2 is parked.
- Why View 2 is still important as a future mobile/layout pass.
- Which custom components exist because the design system does not own that interaction pattern yet.
- Which colors, fonts, and card styles map back to component-library tokens.
- Why the data adapter exists even while the prototype uses mock data.
- Why pair insights are curated fixture/content data for now, even if AI helped draft the first content.
- Why info blocks are empty in the first pass instead of pretending the final content model is solved.
- Why AI is treated as a future Grow/Lighthouse integration instead of a new local chat system.

The code should use comments sparingly, but the comments that exist should make handoff easier for:

- Product: "This is the user/product reason."
- Design: "This is the design-system and interaction reason."
- Engineering: "This is the ownership and porting reason."
- Coding assistants: "This is the boundary you should not accidentally collapse later."

Implementation documentation should be part of the deliverable. The future engineer should be able to open the files and quickly understand the implementation philosophy: where data enters, where selection is decided, why the view model exists, why the shell is thin, why the custom interaction is local to Team DNA, and how to replace mock data with the eventual API.

## Motion model

The monolith React platform already uses `motion` with imports from `motion/react`. The launchpad should use that path instead of adding `framer-motion` as a separate package.

Motion rules:

- Use stable keys for people.
- Use layout animation so the same face moves instead of being recreated.
- Use `AnimatePresence` with `mode="wait"` for content that should fade out before the next content fades in.
- Respect reduced-motion settings.
- Keep motion purposeful: scale, position, opacity, and short timing changes should explain focus.

Important interaction moments:

- Selecting one person: that face scales up, gets a primary ring, and surrounding faces dim.
- Selecting a second person: both selected faces become the focus inside the cluster.
- Clearing selection: the surface returns to the whole-team read.
- Updating content: the old insight fades out, then the new insight fades in.

## Data strategy

The prototype needs realistic data, but it should not pretend the final backend already exists.

The safest approach is an explainable structured model:

1. Individual assessment data comes first.
2. Team and duo insights are derived from individual data.
3. Display copy is generated from a curated rule/content library.
4. AI can help author the first curated content, but should not run live in the first launchpad.

Why:

- Big Five is useful for individual trait measurement and team composition research.
- There does not appear to be a standard, product-ready Big Five map where every pair of people automatically has a canonical collaboration archetype like "The Balancers."
- A deterministic rule/content layer is easier to explain to product, design, legal, and engineering.
- AI assistance can help draft the first team/person/duo language, but that language should be reviewed, curated, and stored as fixture/content data.
- Live AI can still become a narrative layer later once it is grounded in structured evidence and monolith AI patterns.

Suggested data shape:

```ts
type TeamDnaDataset = {
  team: TeamDnaTeam;
  members: TeamDnaMember[];
  teamInsight: TeamDnaInsight;
  individualInsights: Record<string, TeamDnaInsight>;
  pairInsights: Record<string, TeamDnaInsight>;
  completion: TeamDnaCompletion;
};

type TeamDnaMember = {
  id: string;
  name: string;
  role?: string;
  avatarUrl: string;
  traits?: BigFiveProfile;
  assessmentStatus: "complete" | "pending" | "not_invited";
};

type BigFiveProfile = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  emotionalStability: number;
};

type TeamDnaInsight = {
  eyebrow: string;
  title: string;
  summary: string;
  evidence?: string[];
  cards?: TeamDnaInfoBlock[];
};
```

The exact backend can change. The important part is that the UI receives clean, plain data:

- Who is on the team.
- Who has completed the assessment.
- What the selected state is.
- What insight should be shown for that selected state.
- What supporting cards should render.

### Data seam rules

The launchpad should make fake data feel real, while making the fake part easy to remove.

Use a view-model boundary:

```ts
type TeamDnaViewModel = {
  team: TeamDnaTeam;
  members: TeamDnaMember[];
  insights: {
    team: TeamDnaInsight;
    people: Record<string, TeamDnaInsight>;
    pairs: Record<string, TeamDnaInsight>;
  };
  generation?: TeamDnaGenerationState;
};
```

The UI should render this view model. It should not care whether the data came from:

- A local fixture.
- A mocked adapter.
- A generated React Query API hook.
- A future Team DNA backend endpoint.

Practical rules:

- Keep mock data in `data/`, not inside visual components.
- Give every person a stable `id`; never key animation or pair logic from display names.
- Use one helper to make pair IDs, such as sorted member IDs joined together. This prevents `rahul-sergio` and `sergio-rahul` from becoming two different pairs.
- Keep raw traits separate from display copy. Big Five-style values can support the insight, but the UI should receive ready-to-render insight text.
- Treat AI-drafted prototype copy as authored content once it enters the fixture. The runtime should not need an AI call to render a team, person, or duo insight.
- Treat team, person, and duo insights as the same shape. The selection changes the subject, not the component model.
- Let `InfoBlock` render an array of blocks. Do not bake card meanings into the layout until we know the real content.
- Include partial states: pending assessment, incomplete team, missing pair insight, generated insight loading, failed insight.
- Keep privacy-sensitive fields out of the default mock shape unless the final product truly needs them.

In the monolith, the future data path should probably become generated hooks from `@betterup/api/src/member/@tanstack/react-query.gen` once endpoints exist. Until then, the launchpad adapter should feel like the placeholder for that hook:

```ts
const teamDna = await getTeamDna({ teamId });
```

That way an engineer can replace `getTeamDna` with a real hook and mapping function without rewriting the Team DNA experience.

## Monolith portability

The current product reality is that Team DNA is planned as a subtab inside the Team area, alongside surfaces like Overview and Team Pulse.

That may not be the cleanest possible information architecture, but it is the constraint to design for right now. The launchpad should feel like it can live inside that Team tab without becoming a separate product inside the product.

The current monolith scan shows Team Tooling routes and Team Pulse pages in the React platform. It does not clearly prove that the final Team tab/subtab shell already exists. So the safest implementation strategy is:

- Build the prototype as a portable Team DNA panel.
- Assume the eventual host is a Team subtab.
- Avoid depending on a full-page standalone route layout.
- Keep the shell thin so engineering can mount it inside the real Team tab once that container is confirmed.

Relevant monolith anchors:

- `ux/apps/react-platform/src/member/team-tooling/routers/TeamToolingRouter.tsx`
- `ux/apps/react-platform/src/member/team-tooling/components/TeamToolingGate.tsx`
- `ux/apps/react-platform/src/member/team-tooling/pages/TeamToolingHome.tsx`
- `ux/apps/react-platform/src/styles/index.css`
- `ux/packages/component-library/src/components/ui/button.tsx`
- `ux/packages/component-library/src/components/ui/heading.tsx`
- `ux/packages/component-library/src/components/ui/text.tsx`

Important finding:

`TeamToolingHome.tsx` already has a disabled Team DNA card. That means the product already has a conceptual slot for this feature. The newer product direction is more specific: Team DNA should become a Team subtab, not just a home-card destination.

Likely future host shape:

```txt
Team
  Overview
  Team Pulse
  Team DNA
```

### Port-friendly seams

Build the isolated launchpad as if these seams already exist.

Host seam:

- The Team/Team Tooling shell owns `MemberNavbar`, auth gates, global page chrome, and future subtabs.
- Team DNA owns only the content inside the Team DNA subtab.
- The core experience should mount as `<TeamDnaExperience />` inside any parent shell.
- Do not add a second app shell, sidebar, global nav, or fake product frame inside Team DNA.

Route seam:

- Future route is likely `/platform/member/team-tooling/team-dna`.
- Inside React Router's basename, that means `/member/team-tooling/team-dna`.
- In the monolith, this should become a lazy route under `TeamToolingRouter` or under the future Team subtab shell.
- Routing should stay outside the core Team DNA components.

Tab seam:

- If Overview, Team Pulse, and Team DNA are true product subtabs, prefer route-driven tabs so each subtab can be linked to directly.
- Use component-library `PageTabs` or local in-page tabs only for content inside Team DNA that does not deserve its own URL.
- Team DNA should be a sibling of Team Pulse, not a child of Team Pulse.

Layout and scroll seam:

- The future page probably lives under the Team Tooling layout, which is already `flex flex-col h-screen` with `MemberNavbar` above an `Outlet`.
- Team DNA should fit into a `flex-1 overflow-y-auto` content area.
- Keep the outer page wrapper quiet: background, max width, responsive padding, and then the Team DNA experience.
- Do not assume unlimited width. The cluster/content layout must still work if the Team tab container is narrower than a blank standalone prototype.

Suggested monolith wrapper:

```tsx
<main className="flex-1 overflow-y-auto bg-background">
  <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
    <TeamDnaExperience />
  </div>
</main>
```

Design-system seam:

- Use component-library primitives for normal controls and text.
- Use token-backed classes or CSS variables for background, text, primary ring, cards, borders, and shadows.
- Keep local CSS for face layout, selection geometry, and animation behavior.
- Do not copy legacy `.wb-btn-*`, Bootstrap-era, or Ember-only patterns just because they exist in the monolith.

State seam:

- `TeamDnaExperience` owns selection state for the standalone launchpad.
- The selection model should be small enough to move into URL state or parent state later if product needs deep linking.
- Support exactly three normal selected scopes: team, person, duo.

Data seam:

- The adapter owns fetching/mapping.
- The UI owns rendering.
- The future API response can be messy; the Team DNA view model should be clean.
- Generated insight status should be a first-class field if AI-generated copy enters the backend.

AI seam:

- The launchpad should not invent a new AI engine.
- Generated insight text should follow the Team Pulse pattern: backend-owned fields, generation status, retry, and feedback.
- Open-ended "ask about this" can later deep-link or hand context to Grow/Lighthouse, but the core page must stand on its own.

Product instrumentation seam:

- In the monolith, add `BrowserTitle`, `useTranslate`, page constants, and analytics events the way Team Tooling pages already do.
- In the launchpad, keep copy local if that helps speed, but structure it so translation keys can be introduced later.

Monolith alignment rules:

- Use the existing Team/Team Tooling gate if that remains the access boundary.
- Fit inside the Team tab/subtab container instead of assuming ownership of the whole page.
- Use generated API hooks or a narrow adapter when real backend data exists.
- Use `@betterup/component-library` for buttons, headings, and text where practical.
- Use `@betterup/icons` for icons.
- Use theme variables from the component library tokens and theme files.
- Use `motion/react` for animation.
- Keep the Team DNA prototype components free of Rails and Ember assumptions.
- Keep API/data translation in one adapter layer.
- Keep routing details outside the core Team DNA components so the same experience can mount in a standalone launchpad route today and a Team subtab later.

Design-system alignment:

- Follow the detailed design-system alignment strategy above.
- Treat component-library tokens and components as the default visual source of truth.
- Treat Team DNA's custom face cluster behavior as a new interaction pattern layered on top of the system.
- Keep a short implementation note wherever a custom visual value is used instead of an existing token.

## AI and Grow

The user should eventually be able to ask questions about the team, a person, or a duo.

For the launchpad, do not build a new AI chat system.

Near-term recommendation:

- Add the concept to the spec and maybe show a disabled or prototype-only "Ask Grow about this" affordance.
- If needed, deep link or hand off to the existing Grow/Lighthouse chat experience with Team DNA context.
- Be clear that this is not the ideal final interaction.

Long-term recommendation:

- Grow should become more contextual and available on top of product surfaces.
- Team DNA should be able to pass selected context into Grow without forcing the user to lose the surface they were exploring.

This keeps the prototype honest. It shows the desired AI experience without inventing a separate AI architecture that engineers may reject.

## Day-one prototype scope

In scope:

- Seeded realistic team data.
- Team, individual, and duo states.
- Team cluster view.
- Backslash debug toggle for data and selected-state testing.
- Responsive desktop and mobile behavior.
- Design-system token/component mapping for the main visual decisions.
- Reusable face component.
- Reusable insight component.
- Empty flexible info block shells.
- Mock data adapter shaped like a future API.
- Short code comments where ownership boundaries would help future engineers.
- Implementation notes that explain the porting philosophy.

Out of scope for day one:

- Real assessment-taking flow.
- Real backend team entity creation.
- Real generated pair insights from production data.
- Final info block content.
- Real AI answers.
- Final privacy/legal review.
- Full monolith integration.
- Team Pulse merge decisions.
- Horizontal focus rail implementation.

## What this should prove

When someone asks "but can we actually build this?", the answer should be easy:

- It can mount in the monolith's likely React Team/Team Tooling home without owning the whole shell.
- It uses the design system's typography, tokens, and component direction.
- It shows that the design system can feel beautiful and expressive without leaving the system.
- It uses the motion package already present in the React platform.
- It has a clean data adapter boundary.
- It handles mobile and desktop.
- It handles team, person, and duo without three separate products.
- It is shaped to mount inside the Team tab/subtab product reality.
- It has debug controls so the team can test different data states quickly.

## Open questions

1. What exact payload will the Team DNA assessment produce?
2. Where will the real team entity live in the BetterUp backend?
3. Which parts of the assessment can be shown to teammates without creating privacy issues?
4. When should the team revisit the horizontal focus rail as a second layout?
5. Is View 2 the preferred mobile solution once View 1 proves the core experience?
6. What should the first real info blocks contain in the later content pass?
7. Can Grow/Lighthouse accept deep-linked context from another product surface today?
8. Should Team DNA and Team Pulse eventually share one team surface?
9. What should users see when only part of the team has completed the assessment?
10. Should duo insights be available for all pairs, or only after both people complete the assessment?
11. What is the smallest monolith integration spike that would prove the port path?

## Reference notes

Local references:

- `reference documents/Team DNA PRD - Take with grain of salt.md`
- `reference documents/Recent alignments between designers.pdf`
- `reference documents/Links to be aware of.txt`

Figma references:

- Team DNA Design Playground: https://www.figma.com/design/i03f9LTvdHu9A6IwsvIXFr/Team-DNA-Design-Playground?node-id=22-570
- BetterUp Design System: https://www.figma.com/design/p4ZtQHYZSP4E6nzRF6oF6m/BetterUp-Design-System?m=auto&node-id=248-4210

Research references:

- Big Five/team composition background: https://pubmed.ncbi.nlm.nih.gov/32248694/
- Personality profile background: https://journals.sagepub.com/doi/10.1177/0146167206293375
