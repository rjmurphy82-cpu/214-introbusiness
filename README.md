# District 214 Intro to Business

One site with every Intro to Business game, laid out like the District 214 Accounting site.

| Address | What it is |
|---|---|
| `/` | The hub: Live Class Games and Simulations, filter by unit |
| `/media-buy/` | Million Dollar Media Buy (students) |
| `/media-buy/teacher` | Media Buy teacher console |
| `/windy-city/` | Windy City Ad Buy (students) |
| `/windy-city/teacher` | Windy City teacher console |
| `/build-the-lineup/` | Build the Lineup (students) |
| `/build-the-lineup/teacher` | Build the Lineup teacher console |
| `/ad-buy-showdown/` | Ad Buy Showdown (students) |
| `/ad-buy-showdown/teacher` | Ad Buy Showdown teacher console |

Each game's start screen offers **Live in Class** (joins the game you run from its teacher console) and **Open Play** (always open, students work on their own and send you a report). The teacher consoles have no password and are not linked from the hub, so keep those addresses to yourself.

## Folders

| Folder | What it is |
|---|---|
| `index.html` | The hub page. To add a game, add an item to the `ITEMS` list near the bottom. |
| `media-buy/` | Media Buy pages, styles, and game logic |
| `windy-city/` | Windy City pages, styles, and game logic |
| `build-the-lineup/` | Build the Lineup pages, styles, game logic, and the 12 company case files (`js/data.js`) |
| `api/mb/` | Media Buy server code (join, live state, buys, Open Play, teacher controls) |
| `api/wc/` | Windy City server code |
| `api/bl/` | Build the Lineup server code |
| `ad-buy-showdown/` | Ad Buy Showdown pages, styles, and game logic (`js/model.js` holds the six clients and the market math) |
| `api/ab/` | Ad Buy Showdown server code |

Each game's server code runs through one file, `[route].js`, which hands each request to the matching `_` file. Vercel's free plan allows only 12 server functions per site, so this keeps every game at one. When you add a game, give it one `[route].js` the same way.
| `vercel.json`, `package.json` | Vercel settings |

## Setup

1. **GitHub:** create a new repository named `214-introbusiness`. Upload in two rounds so no folders get dropped:
   - Round 1: `index.html`, `README.md`, `package.json`, `vercel.json`
   - Round 2 (in Chrome): drag the `api`, `media-buy`, `windy-city`, and `build-the-lineup` folders in together. Before committing, check that file names show folder paths like `api/mb/login.js` and `media-buy/js/game.js`.
2. **Vercel:** Add New > Project, import `214-introbusiness`, Framework Preset **Other**, leave the build settings empty, and click Deploy. Vercel names the site from the repo, which gives you `214-introbusiness.vercel.app`. If that name is taken, rename it under Settings > Domains.
3. **Storage:** Storage > **upstash-kv-lime-flask** > Connect Project > pick `214-introbusiness`. Then go to Deployments > ⋯ > **Redeploy**.

Each game keeps its data under its own label (`mdmb:`, `wcab:`, `bltl:`, `abs:`), so they share the database with Bond Desk safely. If the old stand-alone Media Buy site used this same database, its saved games and Open Play reports show up here too.

## Retiring the old sites

Once this site works, you can delete the separate `media-buy` and `windy-city` projects in Vercel (Settings > Delete Project). Do not delete the Redis database.

## Keep class handouts out of this repo

This repository is public and everything in it is served on the site. Keep slide decks, case files, and answer keys in Google Drive or Schoology, not here.
