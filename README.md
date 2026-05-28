# Team DNA Prototype Hub

[Live demo](https://team-dna-two.vercel.app)

This repo now holds two intentionally separate Team DNA prototype surfaces:

| Surface | Local route | Purpose |
| --- | --- | --- |
| Surface 1 | `/assessment` | Lightweight placeholder for the future assessment path. |
| Surface 2 | `/team-dna` | Existing Team DNA results experience. |

The root route (`/`) is a tiny chooser so the same Vercel URL can host both
surfaces without mixing their implementation. Surface 2 keeps its detailed
handoff README inside [`src/team-dna/README.md`](src/team-dna/README.md).

## Local Development

```sh
npm install
npm run dev
```

Open the local URL and choose a surface from the hub.

## Demo Flow

The hub includes a presenter-only `/flow-demo` route with two journeys:

- `journey=user`
- `journey=manager`

It also has an optional `view=wireframe` mode. This is only a low-fidelity
meeting lens for reducing visual distraction during partner walkthroughs. It is
not product styling, not a design-system direction, and should not be ported
into the monolith. The implementation is intentionally isolated in
`src/demo-flow/demoOnlyWireframeMode.css` so agents and engineers can ignore it
when working on the real Surface 1 and Surface 2 seams.

## Routing

Vercel serves the same Vite app for all routes. The app resolves routes in the
browser:

- `/` shows the hub.
- `/assessment` shows Surface 1.
- `/team-dna` shows Surface 2.
- `/flow-demo` shows the presenter walkthrough.

Older prototype aliases like `/results`, `/surface-1`, and `/surface-2` were
removed so the handoff only has two real surface routes to reason about.

## Architecture Rule

Keep the surfaces isolated. Surface 1 is only a lightweight placeholder for now,
so future assessment work can start cleanly when we need it. Surface 2 should
continue to consume the normalized Team DNA dataset contract documented in
`src/team-dna/data/teamDnaViewModel.d.ts`.
