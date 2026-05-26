# Team DNA Prototype Hub

[Live demo](https://team-dna-two.vercel.app)

This repo now holds two intentionally separate Team DNA prototype surfaces:

| Surface | Local route | Purpose |
| --- | --- | --- |
| Surface 1 | `/assessment` | Lightweight placeholder for the future assessment path. |
| Surface 2 | `/results` | Existing Team DNA results experience. |

The root route (`/`) is a tiny chooser so the same Vercel URL can host both
surfaces without mixing their implementation. Surface 2 keeps its detailed
handoff README inside [`src/team-dna/README.md`](src/team-dna/README.md).

## Local Development

```sh
npm install
npm run dev
```

Open the local URL and choose a surface from the hub.

## Routing

Vercel serves the same Vite app for all routes. The app resolves routes in the
browser:

- `/` shows the hub.
- `/assessment` shows Surface 1.
- `/results` shows Surface 2.
- `/team-dna` and `/surface-2` are aliases for Surface 2.
- `/surface-1` is an alias for Surface 1.

## Architecture Rule

Keep the surfaces isolated. Surface 1 is only a lightweight placeholder for now,
so future assessment work can start cleanly when we need it. Surface 2 should
continue to consume the normalized Team DNA dataset contract documented in
`src/team-dna/data/teamDnaViewModel.d.ts`.
