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
];

export const tagOptions = Array.from(
  new Set(games.flatMap((game) => game.tags)),
).sort();
