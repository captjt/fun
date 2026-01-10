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

## Adding a New Game

1. Create a new folder under `app/public/games/<game-id>/` with an `index.html` entry point.
2. Add a new entry to `app/src/data/games.ts` with the name, emoji, tags, and path.
3. Use tags that already exist where possible (new tags are welcome too).

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
