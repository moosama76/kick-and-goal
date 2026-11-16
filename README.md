# Kick & Goal

[Play online](https://moosama76.github.io/kick-and-goal/) · [Hosting repository](https://github.com/moosama76/kick-and-goal)

A desktop keyboard/mouse action-platformer with nine ball puzzles.

## Run locally

Download this repository using **Code → Download ZIP** and extract it, or clone it:

```sh
git clone https://github.com/moosama76/kick-and-goal.git
cd kick-and-goal
```

The game uses local runtime files, including Phaser. It needs no build step, account, API key or asset download. Use a current desktop browser with a keyboard and mouse.

For a quick start, open `index.html` in your browser. For a local web server, run this from the folder containing `index.html`:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open **http://localhost:8000/**. Keep the terminal open while playing; press **Ctrl+C** to stop the server. On Windows, use `py -m http.server 8000 --bind 127.0.0.1` if `python3` is unavailable. If port 8000 is already in use, replace it with 8001 and open http://localhost:8001/.

The full development checkout also includes two launchers:

```sh
python3 start-local.py  # starts a server and opens the browser
# or, with Node.js installed:
npm start              # serves http://localhost:8000/
```

If the checkout is inside a `project-repo` folder, enter that folder before running these commands. Running the game does not require `npm install`; installing development tools is only necessary for automated tests.

Click **Play**, select a level and follow the tutorial in level 1. Click inside the game if keyboard input is not focused. Audio starts after user interaction; adjust Music/SFX in Options if needed. Progress and settings are stored in this browser's local storage, so a different browser or local URL may start with a fresh save.

## Controls

- Move: A/D or left/right arrows.
- Jump: Space, W or up arrow; hold for full height.
- Aim and kick: left mouse button.
- Recall: hold R or right mouse button.
- Ball Blink, when equipped: Q/E. Ball Jump: meet a ball rising from a pull with your feet.
- Menu/pause: L/Escape. Restart: Backspace. Sound: M.

The level menu has independent vertical Music and SFX volume sliders on its right. Settings are saved between visits; M still mutes both channels.

Start with Ball Jump. Rocket unlocks at level 3 and Blink at level 6. Switch unlocked loadouts with 1–3 or the mouse wheel; a running cooldown continues across swaps. Clear the required enemies and numbered locks, then bring both the player and ball into the goal together. Loadouts remain player-selected. Level 2 has a normal player-contact checkpoint on its first raised platform. It saves the respawn position without healing.

## Code layout

- `js/game.js`: the game scene, with named setup steps followed by gameplay methods. The physics update stays in one place so its order is explicit.
- `js/art.js`: shared pixel textures and animations used by gameplay and the title screen.
- `js/levels.js`: level geometry, enemies and waves.
- `js/state.js`: saved progress, score migrations and ability unlocks.
- `js/title.js` and `js/tutorial.js`: title-screen animation and the training dialogue.
- `js/main.js`: Phaser startup, audio controls and menu keyboard navigation.
- `js/audio.js`, `js/home-art.js` and `css/game.css`: sound synthesis, menu previews and UI styling.

These are plain scripts loaded in order by `index.html`. There is no runtime build step or additional framework.

## AI assistance

DeepSeek Flash was used for art; Codex was used for logic. Design decisions and iteration were directed by the developer.

## Development

`css/`, `js/` and `vendor/` contain the playable runtime. `scripts/`, `tests/`, package files and the local launcher support game development and validation. The Phaser MIT notice remains in `vendor/PHASER-LICENSE.md`.

Install development tools with `npm ci` and `npx playwright install chromium`. Run `npm run test:unit`, `npm run test:browser`, `npm run test:camera` and `npm run test:rules` as appropriate. The browser smoke check starts all nine levels and records screenshots. More focused checks are available with `node scripts/browser-check.mjs --title`, `--progression`, `--coach`, `--waves`, `--home` and `--camera-effects`. Unit checks are discovered by `scripts/unit-check.mjs`; the browser-based passability fixture remains separate. Rule fixtures do not prove complete normal-input solutions.

`npm run package` creates `../artifacts/kick-and-goal.zip`. Browser captures also go to `../artifacts/`; recorded solution evidence goes to `../evidence/`. Assignment documents, historical documentation and evidence live beside this repository rather than inside it.

GitHub Pages serves the public repository's `main` branch from `/`. The repository contains the runtime and development files so a clone can be played or tested locally; assignment documents and evidence stay outside the core game repository.
