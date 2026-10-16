# Afuera — Interactive Prototype

`Afuera.jsx` is a single, self-contained React component: a high-fidelity, clickable
prototype of the whole product (drag-and-drop Kanban, calendar, dashboard, analytics,
a simulated AI drawer, and more) driven by one in-memory data store.

It is **front-end only** — no backend, no database, simulated AI. Its job is to let you
*feel* the product. The real, wired implementation is the Next.js app in
`../01-nextjs-app/`.

## How to view it
- Easiest: open a React sandbox (e.g. a Vite React app or an online playground),
  add `recharts` and `lucide-react`, drop in `Afuera.jsx`, and render `<Afuera />`.
- Dependencies used: `react`, `recharts`, `lucide-react`. Styling is injected via a
  `<style>` block, so no CSS setup is required.
