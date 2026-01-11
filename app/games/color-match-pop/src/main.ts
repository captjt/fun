import kaplay from "kaplay";

const k = kaplay({
  canvas: document.getElementById("game") as HTMLCanvasElement,
  width: 720,
  height: 1280,
  letterbox: true,
  background: [253, 230, 138],
  global: false,
});

type ColorOption = {
  name: string;
  value: [number, number, number];
};

const colors: ColorOption[] = [
  { name: "Sunshine", value: [251, 191, 36] },
  { name: "Sky", value: [56, 189, 248] },
  { name: "Grape", value: [168, 85, 247] },
  { name: "Mint", value: [52, 211, 153] },
  { name: "Rose", value: [251, 113, 133] },
  { name: "Lime", value: [190, 242, 100] },
];

const state = {
  score: 0,
  combo: 0,
  timeLeft: 30,
  running: false,
  best: Number(localStorage.getItem("colorMatchBest") || 0),
  timerId: 0 as number | undefined,
};

const header = k.add([
  k.text("Color Match Pop", { size: 48 }),
  k.pos(k.center().x, 110),
  k.anchor("center"),
  k.color(15, 23, 42),
]);

const subtitle = k.add([
  k.text("Tap the bubble that matches the target color!", { size: 28, width: 620 }),
  k.pos(k.center().x, 170),
  k.anchor("center"),
  k.color(71, 85, 105),
]);

const hud = {
  score: k.add([k.text("Score: 0", { size: 28 }), k.pos(80, 240), k.color(15, 23, 42)]),
  combo: k.add([k.text("Combo: 0", { size: 28 }), k.pos(80, 280), k.color(15, 23, 42)]),
  time: k.add([k.text("Time: 30", { size: 28 }), k.pos(440, 240), k.color(15, 23, 42)]),
  best: k.add([k.text(`Best: ${state.best}`, { size: 28 }), k.pos(440, 280), k.color(15, 23, 42)]),
};

const targetBox = k.add([
  k.rect(560, 140, { radius: 20 }),
  k.pos(k.center().x, 380),
  k.anchor("center"),
  k.color(255, 255, 255),
  k.outline(4, k.rgb(15, 23, 42)),
]);

const targetText = k.add([
  k.text("Find the Sunshine bubble!", { size: 32, width: 520, align: "center" }),
  k.pos(k.center().x, 380),
  k.anchor("center"),
  k.color(15, 23, 42),
]);

const gridOrigin = k.vec2(120, 520);
const bubbleSize = k.vec2(200, 140);

type BubbleSlot = {
  box: ReturnType<typeof k.add>;
  label: ReturnType<typeof k.add>;
  option: ColorOption;
};

const bubbleSlots: BubbleSlot[] = [];
let target: ColorOption = colors[0];

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function updateHud() {
  hud.score.text = `Score: ${state.score}`;
  hud.combo.text = `Combo: ${state.combo}`;
  hud.time.text = `Time: ${state.timeLeft}`;
  hud.best.text = `Best: ${state.best}`;
}

function setTarget(option: ColorOption) {
  target = option;
  targetBox.color = k.rgb(...option.value);
  targetText.text = `Find the ${option.name} bubble!`;
}

function createBubbleSlots() {
  const columns = 2;
  const padding = k.vec2(40, 40);
  const rows = 3;

  for (let index = 0; index < columns * rows; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = gridOrigin.x + column * (bubbleSize.x + padding.x) + bubbleSize.x / 2;
    const y = gridOrigin.y + row * (bubbleSize.y + padding.y) + bubbleSize.y / 2;

    const slot: BubbleSlot = {
      box: k.add([
        k.rect(bubbleSize.x, bubbleSize.y, { radius: 24 }),
        k.pos(x, y),
        k.anchor("center"),
        k.color(...colors[0].value),
        k.area(),
        k.scale(1),
      ]),
      label: k.add([
        k.text("", { size: 28, width: bubbleSize.x - 20, align: "center" }),
        k.pos(x, y),
        k.anchor("center"),
        k.color(15, 23, 42),
      ]),
      option: colors[0],
    };

    slot.box.onClick(() => handleSelection(slot.option));
    bubbleSlots.push(slot);
  }
}

function buildGrid() {
  const choices = shuffle(colors).slice(0, 5);
  const targetChoice = shuffle(colors)[0];
  const allChoices = shuffle([...choices, targetChoice]);
  setTarget(targetChoice);

  allChoices.forEach((option, index) => {
    const slot = bubbleSlots[index];
    slot.option = option;
    slot.box.color = k.rgb(...option.value);
    slot.label.text = option.name;
  });
}

function handleSelection(option: ColorOption) {
  if (!state.running) return;
  if (option.name === target.name) {
    state.score += 10 + state.combo * 2;
    state.combo += 1;
  } else {
    state.score = Math.max(0, state.score - 4);
    state.combo = 0;
  }
  updateHud();
  buildGrid();
}

function startGame() {
  state.running = true;
  state.score = 0;
  state.combo = 0;
  state.timeLeft = 30;
  updateHud();
  setOverlayVisible(false);
  buildGrid();

  if (state.timerId) {
    window.clearInterval(state.timerId);
  }

  state.timerId = window.setInterval(() => {
    state.timeLeft -= 1;
    updateHud();
    if (state.timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  state.running = false;
  window.clearInterval(state.timerId);
  state.timerId = undefined;
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem("colorMatchBest", state.best.toString());
  }
  updateHud();
  overlayText.text = `Score: ${state.score} • Best: ${state.best}`;
  overlayTitle.text = "Time's Up!";
  setOverlayVisible(true);
}

const overlay = k.add([
  k.rect(720, 1280),
  k.pos(0, 0),
  k.color(15, 23, 42),
  k.opacity(0.75),
  k.area(),
  k.fixed(),
  k.z(100),
]);

const overlayTitle = k.add([
  k.text("Color Match Pop", { size: 52 }),
  k.pos(k.center().x, 480),
  k.anchor("center"),
  k.color(248, 250, 252),
  k.fixed(),
  k.z(101),
]);

const overlayText = k.add([
  k.text("Tap to start popping!", { size: 30, width: 520, align: "center" }),
  k.pos(k.center().x, 560),
  k.anchor("center"),
  k.color(248, 250, 252),
  k.fixed(),
  k.z(101),
]);

const overlayButton = k.add([
  k.rect(260, 70, { radius: 28 }),
  k.pos(k.center().x, 660),
  k.anchor("center"),
  k.color(251, 191, 36),
  k.area(),
  k.fixed(),
  k.z(101),
]);

const overlayButtonLabel = k.add([
  k.text("Start", { size: 30 }),
  k.pos(k.center().x, 660),
  k.anchor("center"),
  k.color(15, 23, 42),
  k.fixed(),
  k.z(102),
]);

overlay.onClick(() => {
  if (!state.running && overlay.hidden !== true) {
    startGame();
  }
});

overlayButton.onClick(startGame);

function setOverlayVisible(isVisible: boolean) {
  overlay.hidden = !isVisible;
  overlay.opacity = isVisible ? 0.75 : 0;
  overlayTitle.hidden = !isVisible;
  overlayText.hidden = !isVisible;
  overlayButton.hidden = !isVisible;
  overlayButtonLabel.hidden = !isVisible;
}

createBubbleSlots();
setOverlayVisible(true);
updateHud();
buildGrid();
