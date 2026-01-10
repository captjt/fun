import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { games, tagOptions } from "../data/games";
import { cn } from "../lib/utils";

export function Home() {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredGames = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return games.filter((game) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        game.name.toLowerCase().includes(normalizedQuery) ||
        game.description.toLowerCase().includes(normalizedQuery);
      const matchesTag = !selectedTag || game.tags.includes(selectedTag);
      return matchesQuery && matchesTag;
    });
  }, [query, selectedTag]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-yellow-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Ready, set, play
          </p>
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">Kids Arcade</h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            Pick a game, jump in, and have fun. Everything runs right in the browser with no
            downloads.
          </p>
        </header>

        <section className="grid gap-6 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Find a game</h2>
              <p className="text-sm text-muted-foreground">Search by name or filter by a mood.</p>
            </div>
            <div className="w-full md:max-w-sm">
              <Input
                placeholder="Search games..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search games"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={selectedTag ? "outline" : "default"}
              onClick={() => setSelectedTag(null)}
            >
              All
            </Button>
            {tagOptions.map((tag) => (
              <Button
                key={tag}
                type="button"
                variant={selectedTag === tag ? "default" : "outline"}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game) => (
            <Card key={game.id} className="flex h-full flex-col">
              <CardHeader className="space-y-3">
                <div className="text-4xl">{game.emoji}</div>
                <CardTitle className="text-2xl">{game.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{game.description}</p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {game.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className={cn(selectedTag === tag && "bg-primary text-primary-foreground")}
                  >
                    {tag}
                  </Badge>
                ))}
              </CardContent>
              <CardFooter className="mt-auto">
                <Button asChild className="w-full">
                  <Link to={`/games/${game.id}`}>Play</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>

        {filteredGames.length === 0 && (
          <div className="rounded-2xl border border-dashed bg-white/60 p-8 text-center">
            <p className="text-lg font-semibold">No games match that search yet.</p>
            <p className="text-sm text-muted-foreground">Try a different keyword or tag.</p>
          </div>
        )}
      </div>
    </div>
  );
}
