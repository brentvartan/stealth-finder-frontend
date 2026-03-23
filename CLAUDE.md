# Stealth Startup Finder — Frontend Context

## Session startup checklist
1. Run `caffeinate -i &` in the background to prevent Mac sleep killing long tasks
2. Read `/Users/brentvartan/.claude/projects/-Users-brentvartan/memory/stealth_finder_state.md` for full build state

## Quick facts
- **Repo**: https://github.com/brentvartan/stealth-finder-frontend
- **Live URL**: https://brentvartan.github.io/stealth-finder-frontend/
- **Deploy**: push to `main` → GitHub Actions builds + deploys automatically (~2 min)
- **Local path**: `/Users/brentvartan/Desktop/Desktop/Work/Bullish/Products/Apps/Stealth Startup Finder/frontend/`
- **API**: `VITE_API_URL=https://api.bullish.co/api` (set in GitHub Actions workflow)

## Stack
React + Vite + Tailwind + Recharts. No Next.js. GitHub Pages SPA with 404.html redirect trick.

## Key conventions
- Brand color electric blue: `#052EF0`
- Dark navy: `#020A52`, light blue: `#87B4F8`
- `font-display` for headers, `font-mono` for emails/IDs/codes
- Admin check: `user?.role === 'admin'`
- Do NOT use `process.env` — use `import.meta.env.VITE_*`

## What's already built — do not rebuild
- Show/hide password icon on login (already there)
- Founder badge (was "Jockey", renamed — electric blue #052EF0)
- TrendChart: 6 monthly buckets, unique brand count Y-axis, brand-name tooltip
- Team tab: expandable inline edit rows with name/role/status/force-password
- Spend tab: live API cost monitor + Rate Card table
- Watchlist subheader copy (already updated)
