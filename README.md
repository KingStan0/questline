# Questline

A local-first desktop companion for earning Discord quest progress without installing the full game.

Questline searches Discord's detectable-game catalog and launches a tiny session runner under a game's real executable name. Discord's own game detection sees the activity while the quest timer runs. No game downloads, account login, or Discord tokens.

![Questline quest board](screenshots/questline-session.png)

## Download

Get the latest portable Windows build from [Releases](https://github.com/ibrahimarchive/questline/releases/latest). Run the EXE directly — no installation needed. The build is unsigned, so Windows SmartScreen may show an unknown-publisher warning.

## Features

- 10,000+ game catalog with search, aliases, and Discord icons
- Personal library with pinned games and one-click sessions
- Live session monitor with elapsed time and stop controls
- Local activity log for launches, stops, syncs, and errors
- Catalog refresh from Discord's public API
- Dark, light, and system themes
- Optional Rich Presence preview (cosmetic only; does not count toward quests)

## Requirements

- Windows 10 or 11 (x64)
- Discord desktop app, open and signed in
- Node.js 22.12+ (only for running or building from source)

## Run from source

```powershell
npm install
npm run dev
```

Build the portable EXE:

```powershell
npm run dist
```

The output is written to `release/`.

## How it works

1. Add a game from the catalog to your library.
2. Questline copies `resources/runner.exe` into a game-shaped folder:

   ```text
   <games directory>/<game ID>/<executable path>
   ```

3. Launch the session. Discord sees the expected executable while it runs.
4. Keep Discord open until the quest timer finishes, then stop the session.

Sessions are tracked through Windows CIM and stopped with `taskkill`. Questline never downloads or modifies a real game installation.

## Data

- App state: `%APPDATA%\Questline\questline-state.json`
- Catalog cache: `<userData>\gamelist-cache.json`
- Runner copies: `<userData>\games\<game ID>\<executable path>`

The games folder can be changed in **Settings → Storage**. Set `QUESTLINE_USER_DATA` to redirect all app state for an isolated run.

## Disclaimer

Questline is an unofficial tool. Automated game detection may conflict with Discord's Terms of Service, and quest credit is always decided by Discord. Use at your own risk.

## License

MIT © Ibrahim Chowdhury
