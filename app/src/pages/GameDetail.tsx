import { Link, useParams } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { games } from "../data/games";

export function GameDetail() {
  const { id } = useParams();
  const game = games.find((item) => item.id === id);

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-yellow-50">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center">
          <div className="text-5xl">🧩</div>
          <h1 className="text-3xl font-semibold">Game not found</h1>
          <p className="text-muted-foreground">
            That game is not in the arcade yet. Try another one from the dashboard.
          </p>
          <Button asChild>
            <Link to="/">Back to games</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-yellow-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Now playing
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">
              <span className="mr-3">{game.emoji}</span>
              {game.name}
            </h1>
            <p className="text-muted-foreground">{game.description}</p>
            <div className="flex flex-wrap gap-2">
              {game.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link to="/">Back</Link>
            </Button>
          </div>
        </header>

        <Card className="overflow-hidden">
          <iframe
            title={game.name}
            src={game.path}
            className="h-[90vh] w-full bg-black sm:h-[76vh] lg:h-[78vh]"
            loading="lazy"
          />
        </Card>

        <section className="grid gap-4 rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold">How to play</h2>
          <p className="text-muted-foreground">{game.controls}</p>
        </section>
      </div>
    </div>
  );
}
