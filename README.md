# Kids Arcade

[Kids Arcade](https://fun.0utlaw.xyz) is a collection of open, browser-based games built for quick fun. Everything runs entirely in the browser with a static React + TypeScript dashboard, so it’s easy to host anywhere.

## What’s Inside

- Game dashboard with search and tag filters.
- Individual game pages that embed each game.
- A growing catalog of kid-friendly games.

## Local Development

```bash
cd app
npm install
npm run dev
```

## Building for Deploy

```bash
cd app
npm install
npm run build
```

This build runs each kaplay game build (from `app/games/*`) and then builds the main React site so everything is packaged into the same static output.

## Adding a New Game

### Classic HTML Game

1. Create a new folder under `app/public/games/<game-id>/` with an `index.html` entry point.
2. Add a new entry to `app/src/data/games.ts` with the name, emoji, tags, and path.
3. Use tags that already exist where possible (new tags are welcome too).

### Kaplay Game

1. Duplicate a kaplay game folder under `app/games/<game-id>/` (for example `app/games/color-match-pop/`).
2. Update the game code in `app/games/<game-id>/src/main.ts` and the title in `app/games/<game-id>/src/index.html`.
3. Ensure `app/games/<game-id>/vite.config.ts` outputs to `app/public/games/<game-id>/`.
4. Add a new entry to `app/src/data/games.ts` and include controls + tags.
5. Run `cd app && npm run build` to build the game into the public folder.

## Contributing

We welcome PRs for new games, fixes, and improvements.

### Guidelines

- Keep games fully browser-based (no backend, no auth).
- Aim for kid-friendly visuals and simple controls.
- Make sure the game works on both desktop and mobile.
- Prefer small, focused commits with clear descriptions.
- Test locally with `npm run dev` before opening a PR.

### Submitting a PR

- Describe the game and how it plays.
- Include controls and any special notes in the game entry.
- Add your game to the dashboard catalog so it’s discoverable.

## License

See `LICENSE`.
