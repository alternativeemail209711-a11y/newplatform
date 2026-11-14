# CRAFT platform (compact deploy build of UPDATE_149)

Only 6 files in this repo:

| File | Purpose |
|---|---|
| `package.json` | dependencies + `npm start` |
| `start.js` | launcher: unpacks `app.pack` into `app/` and starts the platform |
| `app.pack` | the entire platform (the whole platform, 32 games, compressed) |
| `.env.example` | environment variable reference |
| `.gitignore` | keeps `app/`, `node_modules/`, runtime data out of git |
| `README.md` | this file |

## Deploy (Render)
1. Upload these files to GitHub (they fit in one upload).
2. Render: Build Command `npm install`, Start Command `npm start`.
3. Add your environment variables (`EULERSTREAM_API_KEY`, etc. — see `.env.example`).

The first start prints `[launcher] unpacked N files`. Saved settings/records under `app/data/` are never overwritten by later deploys.
The original guides (`DEPLOY_GUIDE.md`, `README.md`, `AFK_AUTOPILOT_README.md`, change logs) are inside the pack and appear in `app/` after the first start.
