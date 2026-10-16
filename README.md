# District 214 Intro to Business

One site with every Intro to Business game, laid out like the District 214 Accounting site.

| Address | What it is |
|---|---|
| `/` | The hub: Live Class Games and Simulations, filter by unit |
| `/media-buy/` | Million Dollar Media Buy (students) |
| `/media-buy/teacher` | Media Buy teacher console |
| `/windy-city/` | Windy City Ad Buy (students) |
| `/windy-city/teacher` | Windy City teacher console |

Each game's start screen offers **Live in Class** (joins the game you run from its teacher console) and **Open Play** (always open, students work on their own and send you a report). The teacher consoles have no password and are not linked from the hub, so keep those two addresses to yourself.

## Folders

| Folder | What it is |
|---|---|
| `index.html` | The hub page. To add a game, add an item to the `ITEMS` list near the bottom. |
| `media-buy/` | Media Buy pages, styles, and game logic |
| `windy-city/` | Windy City pages, styles, and game logic |
| `api/mb/` | Media Buy server code (join, live state, buys, Open Play, teacher controls) |
| `api/wc/` | Windy City server code |
| `vercel.json`, `package.json` | Vercel settings |

## Setup

1. **GitHub:** create a new repository named `214-introbusiness`. Upload in two rounds so no folders get dropped:
   - Round 1: `index.html`, `README.md`, `package.json`, `vercel.json`
   - Round 2 (in Chrome): drag the `api`, `media-buy`, and `windy-city` folders in together. Before committing, check that file names show folder paths like `api/mb/login.js` and `media-buy/js/game.js`.
2. **Vercel:** Add New > Project, import `214-introbusiness`, Framework Preset **Other**, leave the build settings empty, and click Deploy. Vercel names the site from the repo, which gives you `214-introbusiness.vercel.app`. If that name is taken, rename it under Settings > Domains.
3. **Storage:** Storage > **upstash-kv-lime-flask** > Connect Project > pick `214-introbusiness`. Then go to Deployments > ⋯ > **Redeploy**.

Both games keep their data under their own labels (`mdmb:` and `wcab:`), so they share the database with Bond Desk safely. If the old stand-alone Media Buy site used this same database, its saved games and Open Play reports show up here too.

## Retiring the old sites

Once this site works, you can delete the separate `media-buy` and `windy-city` projects in Vercel (Settings > Delete Project). Do not delete the Redis database.
