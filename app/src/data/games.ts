export type Game = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tags: string[];
  path: string;
  controls: string;
};

export const games: Game[] = [
  {
    id: "flappy-bird",
    name: "Flappy Bird",
    description: "Dodge the pipes and chase a new high score.",
    emoji: "🐦",
    tags: ["arcade", "reaction", "flying"],
    path: "/games/flappy-bird/index.html",
    controls: "Tap, click, or press Space to flap.",
  },
  {
    id: "metro-runner",
    name: "Metro Runner",
    description: "Run the rails, switch lanes, and dodge the rush-hour chaos.",
    emoji: "🚇",
    tags: ["runner", "arcade", "reaction"],
    path: "/games/metro-runner/index.html",
    controls: "Swipe or use arrows/WASD to move, jump, or slide.",
  },
  {
    id: "color-match-pop",
    name: "Color Match Pop",
    description: "Pop the bubble that matches the target color.",
    emoji: "🎈",
    tags: ["puzzle", "reaction", "colors"],
    path: "/games/color-match-pop/index.html",
    controls: "Tap the bubble that matches the target color.",
  },
  {
    id: "balloon-defender",
    name: "Balloon Defender",
    description: "Pop balloons before they float away.",
    emoji: "🎯",
    tags: ["arcade", "reaction", "tapping"],
    path: "/games/balloon-defender/index.html",
    controls: "Tap balloons before they reach the top.",
  },
  {
    id: "puzzle-slider",
    name: "Puzzle Slider",
    description: "Slide the tiles into the correct order.",
    emoji: "🧩",
    tags: ["puzzle", "logic", "relax"],
    path: "/games/puzzle-slider/index.html",
    controls: "Tap a tile next to the empty space to slide it.",
  },
  {
    id: "fruit-catcher",
    name: "Fruit Catcher",
    description: "Catch fruit, avoid the veggies.",
    emoji: "🍎",
    tags: ["arcade", "reaction", "tapping"],
    path: "/games/fruit-catcher/index.html",
    controls: "Move the basket with your finger or mouse.",
  },
  {
    id: "snowball-toss",
    name: "Snowball Toss",
    description: "Tap the targets before they disappear.",
    emoji: "❄️",
    tags: ["arcade", "reaction", "precision"],
    path: "/games/snowball-toss/index.html",
    controls: "Tap the targets quickly to score points.",
  },
  {
    id: "minesweeper",
    name: "Minesweeper Mini",
    description: "Flag the mines and clear the safe tiles.",
    emoji: "💣",
    tags: ["puzzle", "logic", "classic"],
    path: "/games/minesweeper/index.html",
    controls: "Tap to reveal, long-press to flag.",
  },
  {
    id: "gary-world",
    name: "Gary World",
    description: "Run, jump, and dodge 3D obstacles.",
    emoji: "🌄",
    tags: ["runner", "3d", "action"],
    path: "/games/gary-world/index.html",
    controls: "Press Space or tap to jump.",
  },
];

export const tagOptions = Array.from(
  new Set(games.flatMap((game) => game.tags)),
).sort();
