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
];

export const tagOptions = Array.from(
  new Set(games.flatMap((game) => game.tags)),
).sort();
