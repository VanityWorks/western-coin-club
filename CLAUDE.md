# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build to dist/
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

No test runner is configured.

## Architecture

**Stack:** Vite + React 19 SPA, JavaScript (ES modules), CSS with custom properties. Deployed to Vercel.

**Routing:** React Router DOM v7. All routes are defined in `src/App.jsx`. Vite config and `vercel.json` both include SPA fallback rules to serve `index.html` for all routes.

**Structure:**
- `src/pages/` — One component per route (`Home`, `About`, `Membership`, `Join`, `News`, `Consulting`, `Forum`, `Contact`)
- `src/components/` — Shared `Header` and `Footer` rendered on every page
- `src/index.css` — Global CSS variables (SA flag colors: `--sa-green`, `--sa-gold`, `--sa-red`, `--sa-blue`; typography; button classes)
- `src/pages/Page.css` — Base page layout styles imported by most pages
- `public/` — Static assets: logos, news images, consultant photos, icon sprite (`icons.svg`), custom cursor (`cursor-coin.png`)

**Data:** All content (news articles, consultant profiles, forum categories, testimonials, etc.) is hardcoded directly inside each page component. There is no backend, API, or state management library — only React `useState` for local UI state (menu toggle, search/filter inputs).

**Styling:** CSS Modules per component (each `Page.jsx` has a `Page.css`). Theme via CSS variables in `:root`. Custom coin cursor applied globally. Fonts: Outfit (headings) and DM Sans (body), loaded from Google Fonts in `index.html`.

**Forms:** All forms (Join, Contact) are frontend-only demos — no submission logic.
