import kaplay from "kaplay";

const canvasElement = document.getElementById("game") as HTMLCanvasElement;

const k = kaplay({
  canvas: canvasElement,
  width: 720,
  height: 1280,
  letterbox: false,
  background: [226, 232, 240],
  global: false,
});

type Tile = {
  row: number;
  col: number;
  hasMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
  node: ReturnType<typeof k.add>;
  label: ReturnType<typeof k.add>;
};

const boardSize = 8;
const mineCount = 10;
const tileSize = 70;
const boardOrigin = k.vec2(80, 280);
const tiles: Tile[] = [];

const state = {
  flagsLeft: mineCount,
  revealed: 0,
  status: "ready" as "ready" | "playing" | "won" | "lost",
  firstClick: true,
  inputLocked: true,
};

const header = k.add([
  k.text("Minesweeper Mini", { size: 46 }),
  k.pos(k.center().x, 110),
  k.anchor("center"),
  k.color(15, 23, 42),
]);

const subtitle = k.add([
  k.text("Tap to reveal, long-press to flag.", { size: 26, width: 600, align: "center" }),
  k.pos(k.center().x, 170),
  k.anchor("center"),
  k.color(71, 85, 105),
]);

const hudFlags = k.add([
  k.text(`Flags: ${state.flagsLeft}`, { size: 26 }),
  k.pos(100, 220),
  k.color(15, 23, 42),
]);

const hudStatus = k.add([
  k.text("Ready", { size: 26 }),
  k.pos(440, 220),
  k.color(15, 23, 42),
]);

const overlay = k.add([
  k.rect(720, 1280),
  k.pos(0, 0),
  k.color(15, 23, 42),
  k.opacity(0.75),
  k.fixed(),
  k.z(100),
]);

const overlayTitle = k.add([
  k.text("Minesweeper Mini", { size: 50 }),
  k.pos(k.center().x, 520),
  k.anchor("center"),
  k.color(248, 250, 252),
  k.fixed(),
  k.z(101),
]);

const overlayText = k.add([
  k.text("Tap to start", { size: 30, width: 520, align: "center" }),
  k.pos(k.center().x, 600),
  k.anchor("center"),
  k.color(248, 250, 252),
  k.fixed(),
  k.z(101),
]);

const overlayButton = k.add([
  k.rect(260, 70, { radius: 28 }),
  k.pos(k.center().x, 700),
  k.anchor("center"),
  k.color(56, 189, 248),
  k.area(),
  k.fixed(),
  k.z(101),
]);

const overlayButtonLabel = k.add([
  k.text("Start", { size: 30 }),
  k.pos(k.center().x, 700),
  k.anchor("center"),
  k.color(15, 23, 42),
  k.fixed(),
  k.z(102),
]);

let overlayVisible = true;

function setOverlayVisible(isVisible: boolean) {
  overlayVisible = isVisible;
  overlay.hidden = !isVisible;
  overlay.opacity = isVisible ? 0.75 : 0;
  overlayTitle.hidden = !isVisible;
  overlayText.hidden = !isVisible;
  overlayButton.hidden = !isVisible;
  overlayButtonLabel.hidden = !isVisible;
}

function updateHud() {
  hudFlags.text = `Flags: ${state.flagsLeft}`;
  hudStatus.text =
    state.status === "won" ? "You win!" : state.status === "lost" ? "Boom!" : "Playing";
}

function tileIndex(row: number, col: number) {
  return row * boardSize + col;
}

function getTile(row: number, col: number) {
  if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) return null;
  return tiles[tileIndex(row, col)];
}

function forEachNeighbor(row: number, col: number, cb: (tile: Tile) => void) {
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const neighbor = getTile(row + dr, col + dc);
      if (neighbor) cb(neighbor);
    }
  }
}

function createTiles() {
  tiles.length = 0;
  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      const x = boardOrigin.x + col * tileSize + tileSize / 2;
      const y = boardOrigin.y + row * tileSize + tileSize / 2;
      const box = k.add([
        k.rect(tileSize - 6, tileSize - 6, { radius: 16 }),
        k.pos(x, y),
        k.anchor("center"),
        k.color(148, 163, 184),
        k.area(),
        k.z(10),
      ]);

      const label = k.add([
        k.text("", { size: 30 }),
        k.pos(x, y),
        k.anchor("center"),
        k.color(15, 23, 42),
        k.z(11),
      ]);

      const tile: Tile = {
        row,
        col,
        hasMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
        node: box,
        label,
      };

      tiles.push(tile);
    }
  }
}

function placeMines(excludedIndex?: number) {
  const positions = Array.from({ length: boardSize * boardSize }, (_, idx) => idx).filter(
    (index) => index !== excludedIndex,
  );
  positions.sort(() => Math.random() - 0.5);
  positions.slice(0, mineCount).forEach((index) => {
    tiles[index].hasMine = true;
  });
}

function ensureSafeFirstClick(tile: Tile) {
  if (!state.firstClick) return;
  state.firstClick = false;
  if (!tile.hasMine) return;

  tiles.forEach((current) => {
    current.hasMine = false;
  });
  placeMines(tileIndex(tile.row, tile.col));
  computeNumbers();
}

function countMines(tile: Tile) {
  let count = 0;
  forEachNeighbor(tile.row, tile.col, (neighbor) => {
    if (neighbor.hasMine) count += 1;
  });
  return count;
}

function computeNumbers() {
  tiles.forEach((tile) => {
    tile.adjacentMines = countMines(tile);
  });
}

function revealTile(tile: Tile) {
  if (tile.isRevealed || tile.isFlagged) return;
  tile.isRevealed = true;
  state.revealed += 1;
  tile.node.color = k.rgb(226, 232, 240);
  tile.node.outline = k.outline(2, k.rgb(148, 163, 184));

  if (tile.hasMine) {
    tile.label.text = "💣";
    tile.label.color = k.rgb(239, 68, 68);
    return;
  }

  if (tile.adjacentMines > 0) {
    tile.label.text = tile.adjacentMines.toString();
    tile.label.color = k.rgb(30, 64, 175);
  }
}

function floodReveal(tile: Tile) {
  const queue: Tile[] = [tile];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    if (current.isRevealed || current.isFlagged) continue;
    revealTile(current);
    if (current.adjacentMines === 0 && !current.hasMine) {
      forEachNeighbor(current.row, current.col, (neighbor) => {
        if (!neighbor.isRevealed && !neighbor.isFlagged) {
          queue.push(neighbor);
        }
      });
    }
  }
}

function handleReveal(tile: Tile) {
  if (state.status === "lost" || state.status === "won" || state.inputLocked) return;
  if (tile.isFlagged) return;

  if (state.status === "ready") {
    ensureSafeFirstClick(tile);
    state.status = "playing";
    updateHud();
  }

  if (tile.hasMine) {
    revealTile(tile);
    state.status = "lost";
    revealAllMines();
    endGame("Boom! You hit a mine.");
    return;
  }

  if (tile.adjacentMines === 0) {
    floodReveal(tile);
  } else {
    revealTile(tile);
  }

  checkWin();
}

function handleFlag(tile: Tile) {
  if (state.status === "lost" || state.status === "won" || state.inputLocked) return;
  if (tile.isRevealed) return;
  if (tile.isFlagged) {
    tile.isFlagged = false;
    tile.label.text = "";
    state.flagsLeft += 1;
  } else {
    if (state.flagsLeft <= 0) return;
    tile.isFlagged = true;
    tile.label.text = "🚩";
    tile.label.color = k.rgb(239, 68, 68);
    state.flagsLeft -= 1;
  }
  updateHud();
}

function revealAllMines() {
  tiles.forEach((tile) => {
    if (tile.hasMine && !tile.isRevealed) {
      tile.label.text = "💣";
      tile.label.color = k.rgb(239, 68, 68);
      tile.node.color = k.rgb(254, 202, 202);
    }
  });
}

function checkWin() {
  if (state.revealed >= boardSize * boardSize - mineCount) {
    state.status = "won";
    endGame("You cleared all the safe tiles!");
  }
}

function getTileFromPosition(pos: { x: number; y: number }) {
  const col = Math.floor((pos.x - boardOrigin.x) / tileSize);
  const row = Math.floor((pos.y - boardOrigin.y) / tileSize);
  return getTile(row, col);
}

function toBoardPosition(clientX: number, clientY: number) {
  const rect = canvasElement.getBoundingClientRect();
  const scaleX = canvasElement.width / rect.width;
  const scaleY = canvasElement.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

let pressTimeout: number | undefined;
let pressedTile: Tile | null = null;
let didLongPress = false;

function handlePointerReveal(clientX: number, clientY: number) {
  if (overlayVisible && state.status !== "playing") {
    resetGame();
    return;
  }
  const tile = getTileFromPosition(toBoardPosition(clientX, clientY));
  if (tile) {
    handleReveal(tile);
  }
}

function handlePointerFlag(clientX: number, clientY: number) {
  const tile = getTileFromPosition(toBoardPosition(clientX, clientY));
  if (tile) {
    handleFlag(tile);
  }
}

function resetGame() {
  state.flagsLeft = mineCount;
  state.revealed = 0;
  state.status = "ready";
  state.firstClick = true;
  state.inputLocked = true;
  updateHud();
  tiles.forEach((tile) => {
    tile.hasMine = false;
    tile.isFlagged = false;
    tile.isRevealed = false;
    tile.adjacentMines = 0;
    tile.node.color = k.rgb(148, 163, 184);
    tile.label.text = "";
  });
  placeMines();
  computeNumbers();
  setOverlayVisible(false);
  k.wait(0.1, () => {
    state.inputLocked = false;
  });
}

function endGame(message: string) {
  updateHud();
  overlayTitle.text = state.status === "won" ? "You Win!" : "Game Over";
  overlayText.text = message;
  overlayButtonLabel.text = "Play Again";
  setOverlayVisible(true);
}

overlayButton.onClick(resetGame);

canvasElement.addEventListener("contextmenu", (event) => event.preventDefault());

canvasElement.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch") {
    didLongPress = false;
    pressedTile = getTileFromPosition(toBoardPosition(event.clientX, event.clientY));
    pressTimeout = window.setTimeout(() => {
      if (pressedTile) {
        handleFlag(pressedTile);
        didLongPress = true;
      }
    }, 350);
    return;
  }

  if (event.button === 2) {
    handlePointerFlag(event.clientX, event.clientY);
    return;
  }

  handlePointerReveal(event.clientX, event.clientY);
});

canvasElement.addEventListener("pointerup", (event) => {
  if (event.pointerType !== "touch") return;
  if (pressTimeout) window.clearTimeout(pressTimeout);
  if (!didLongPress) {
    handlePointerReveal(event.clientX, event.clientY);
  }
  pressedTile = null;
});

canvasElement.addEventListener("pointercancel", () => {
  if (pressTimeout) window.clearTimeout(pressTimeout);
  pressedTile = null;
  didLongPress = false;
});

createTiles();
placeMines();
computeNumbers();
setOverlayVisible(true);
updateHud();
state.inputLocked = false;
