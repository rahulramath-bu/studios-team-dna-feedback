# Developer integration tips

Date started: May 19, 2026

Purpose: keep a small, practical trail of implementation decisions that matter when Team DNA moves from this standalone launchpad into the BetterUp monolith.

This document should grow while we build. When we make a portability decision in code, add the short version here too. Also add a brief code comment at the relevant component, hook, adapter, or CSS boundary so an engineer sees the tip where they are working.

## How to use this doc

- Treat this as a working notebook, not a full spec.
- Keep tips short and concrete: what changed, why it exists, and what to do in the monolith.
- Do not duplicate every implementation detail from the code.
- If a decision becomes outdated, edit the entry instead of leaving contradictory notes.

## Current integration tips

### Use the modern React/component-library path, not every monolith pattern

The monolith has multiple UI eras. Team DNA should align with the future-facing path:

- React Platform surfaces.
- Component-library tokens and primitives.
- `motion/react`.
- `@betterup/icons`.

Avoid copying legacy Ember, Bootstrap, `.wb-btn-*`, or older `core-react` patterns just because they exist nearby.

### Team DNA should port as a panel, not as a full product shell

The standalone app owns the whole browser canvas, but the monolith should not. In the monolith, Team DNA should mount inside the future Team tab/subtab shell or, if needed first, inside Team Tooling routing.

Port expectation:

- The shell owns nav, authentication gates, page title, tabs/subtabs, analytics wiring, and loading/error route states.
- `TeamDnaExperience` owns the Team DNA content surface: people field, selection state, insight panel, and info block stack.

The monolith shell preview should not invent a team header above the subtabs. The team name and superpower blurb belong inside the Team DNA tab panel only. The current source-backed shell pattern is `MemberNavbar` plus route outlet, with `PageTabs` as the closest canonical subtab primitive: transparent full-width tab list, 16px tab padding, normal 16px text, gray bottom border, and rubine active text/underline.

Monolith target: use the real `MemberNavbar` and real `PageTabs`. Do not port the standalone `MonolithTeamShell` debug fixture.

### Keep the data adapter replaceable

The launchpad uses curated fixture data, but the UI should behave as if data came from a real backend hook. The important boundary is:

- route/page fetches or receives Team DNA data;
- adapter normalizes it into a simple view model;
- components render the view model and selection state.

Monolith target: replace `getTeamDna` / `getInsightForSelection` with generated API hooks or a thin mapper around them. Do not bury API shape assumptions inside JSX components.

### Preserve the team/person/duo selection contract

Normal scopes are:

- team: no selected people;
- person: one selected person;
- duo: two selected people.

Selection should stay ID-based. Pair IDs should be deterministic and order-insensitive so Rahul plus Sergio resolves to the same pair insight regardless of click order.

### Use `motion/react`

The React Platform already has `motion` available. Team DNA should keep using:

```js
import { AnimatePresence, motion } from 'motion/react';
```

Do not add `framer-motion` as a separate dependency during the monolith port.

### Keep content transitions exit-before-enter

The insight panel should use `AnimatePresence mode="wait"` so old copy exits before new copy enters. This avoids muddy crossfades between different ideas.

### Treat the face cluster as Team DNA-owned interaction work

The design system owns visual primitives. Team DNA owns the custom face-cluster interaction:

- face buttons;
- selected ring geometry;
- dimmed non-selected faces;
- selected scaling;
- duo selection behavior;
- layout continuity.

Use design-system tokens for color, focus, spacing, and type. Keep custom geometry local to Team DNA.

### Duo linking should stay simple

The selected-duo connection uses `DuoConnection`, which reads the actual DOM position of the two selected face buttons and draws a thick dashed ruby line behind them from center to center.

In duo state, selected rings tighten from a separated halo into a direct outside outline on the avatar edge. The ring should grow outward by the same amount as its border width, so the border's inner edge lands on the avatar edge without covering the photo or leaving a gap. The connector should be a rounded, sliding dashed line in the same ruby color, with a slight fade-in delay so it appears after the selected avatars have mostly landed.

If two selected faces are close enough that the scaled avatars/rings overlap, apply a small measured nudge away from each other. Then let that nudge ripple into nearby dimmed faces with smaller capped secondary nudges, so a selected pair does not crowd an adjacent teammate. This should be based on the actual face positions, not hardcoded grid coordinates, so the behavior can transfer to a future horizontal rail or mobile layout.

Dimmed faces should restore to full opacity on hover/focus-style inspection. The dimming communicates current selection focus; it should not prevent someone from visually checking another teammate before selecting them. Keep each button's invisible hitbox stable while the inner visual layer scales down, so hover exploration still works in solo and duo states.

Unavailable Team DNA members should still be pressable enough to explain why they cannot be selected. Keep the unavailable shake on its own inner animation layer so it does not compete with the visual layer's hover, press, opacity, or nudge transforms.

Selected faces can have a subtle "alive" pulse, but keep it on a separate inner pulse layer so it composes with base selected scale, hover scale, press scale, nudge, and unavailable shake instead of competing with them.

When exactly one face is selected, hovering another selectable face should show an immediate lightweight connection preview. Reuse the same measured connection layer, but style it thinner and more transparent than the committed duo line so it reads as "this is what would happen if you clicked."

Face hover targets should be larger than the visible circular avatars. Keep the visible grid spacing, but let each button's invisible hitbox fill the cell/gap area so someone can glide across faces without hover repeatedly dropping in the space between avatars. Do not apply selection scaling to the button itself; scale only the inner visual layer.

Why the measurement approach still matters: the bridge is not hardcoded to the current 3-column grid. It can survive a future View 2 rail, mobile layout, or any other face arrangement as long as `TeamFaceField` can provide refs for the selected faces.

Monolith target: keep the measuring layer local to Team DNA. It is an interaction pattern for this surface, not a global design-system primitive.

### Pressable behavior is local for now

The launchpad uses `useTeamDnaPressable`, inspired by BetterApart's `Pressable` pattern:

- press down gives immediate tactile feedback;
- selection commits through native click on press-up-inside;
- dragging away cancels without committing.

Monolith target: either replace this hook with a shared BetterUp pressable primitive if one exists, or keep it as a tiny Team DNA hook. Do not make Team DNA responsible for creating a global interaction primitive unless product/design-system engineering wants that.

### Face name reveal should stay inside the face cluster

For hover/focus name reveal on team faces, use an inline label beneath the hovered avatar rather than a tooltip/popover.

Implemented direction:

- The label should use ruby `Söhne Mono` styling so it feels like part of the Team DNA visual system.
- It should feel immediate and lightweight; a very short fade is acceptable if it avoids visual popping.
- The unavailable assessment message should stay short and human. Current copy: "Needs Team DNA first."
- Keep the label owned by `TeamFace`; the parent field should only track hover when it needs to draw a connection preview.
- The label belongs inside the same visual layer as the avatar so nudge/scale motion carries the name with it.
- Do not show the label when hovering an already selected face; it is primarily for inspecting non-selected teammates.
- Do not add tooltip dependencies for this behavior. The label is not a global design-system primitive.

### Team edit mode is a data mutation seam

The standalone prototype lets the team edit button enter a lightweight edit mode: the insight panel fades out, the face cluster centers, team name becomes editable, members can be removed, and a simple add button creates a new member placeholder.

Keep the edit affordance on the face-cluster side of the layout, in the same row as the "Select to explore" label. Editing the roster/name is a team-explorer concern, not an insight-content concern.

Monolith target: keep this as a thin UI over real team-management APIs. The UI should call add/remove/rename mutations from the Team tab's data layer rather than owning persistence. New members will likely enter as no-avatar and assessment-incomplete until backend/profile data catches up.

### The insight panel should snap by readable sections

The right panel mirrors the Human Session lobby pattern: the scrolling container owns vertical scroll snap, and each meaningful section opts in as a snap point.

Current snap targets:

- the top superpower blurb;
- each supporting info block.

Monolith target: keep this as local layout behavior for Team DNA. The Team tab shell should provide the outer page/subtab surface, but the Team DNA panel should own how its internal insight cards scroll.

The active snap section should stay fully opaque while off-snap sections quiet down. This makes the panel feel responsive while scrolling without introducing extra chrome or page-level navigation.

### Typography token nuance: use display heading, not normal heading

The monolith Tailwind `font-heading` path maps to `Ivar Headline`. Team DNA wants `Ivar Display`.

Use the theme-level display heading path:

- `--heading-display-font`
- `--heading-display-tracking`
- `--heading-display-line-height`
- `.text-display-heading` if using monolith utility classes

Standalone CSS mirrors these token names so the port can remove local fallbacks rather than rename everything.

### Label typography should use the monolith label tokens

Eyebrows and info block labels should map to:

- `--label-font`
- `--label-size`
- `--label-line-height`
- `--label-tracking`
- `--label-weight`
- `--label-color`

Current direction is `Söhne Mono`, 11px, uppercase, 1.1px tracking, weight 500.

### Standalone font assets are mirrors, not new product assets

The standalone prototype includes local copies of monolith font files under:

```txt
public/frontend/assets/fonts/
```

This is only so the prototype renders like the monolith. In the monolith, these font faces already come from React Platform/global styles, so the Team DNA port should not bring duplicate font files.

### Use a BetterUp-shaped icon bridge in standalone

The standalone app has `BetterUpIcon` so we can avoid a third-party icon package and keep call sites shaped like the monolith.

Monolith target:

```tsx
import { Icon } from '@betterup/icons/src/Icon';

<Icon name="Edit" />
```

Delete the local bridge when porting.

### Keep first-pass info blocks skeletal

Info blocks exist to prove the layout and future content slots. They should stay intentionally empty/skeletal until the content model is decided.

Monolith target: keep the `supportingBlocks` array shape available, but do not fill it with fake-real content that product or engineering may mistake for final IA.

### Layout should center the two-pane composition as one unit

On desktop, the people pane and insight pane should behave like one centered composition with a stable middle gap. As the surface grows, extra space should appear outside the pair, not between the two panes.

Monolith target: make the Team DNA panel width relative to its parent surface, not the whole browser body, so it behaves correctly inside a Team tab/subtab layout.

### View 2 is parked as the likely mobile pass

View 1 is the current build path. View 2 should remain available as a future horizontal rail/mobile-forward solution if tall teams make View 1 awkward on small screens.

### AI is future pass, not local runtime AI

Current pair/team/person copy can be AI-assisted during authoring, but should ship as deterministic curated content or backend-provided insight copy.

Do not add live local AI inside this prototype. Future open-ended questions should reuse or hand off to Grow/Lighthouse patterns.
