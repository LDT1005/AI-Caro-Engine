import Engine from "./engine.js";

const engine = new Engine();
let worker = null;
let hardTimeoutId = null;
let workerReady = false;

// 🔥 FIX: lưu requestId đã gửi
let lastSentRequestId = null;

const boardDiv = document.getElementById("board");

engine.onGameStateChange((snap) => {
  render(snap);
});

engine.onMetrics((record) => {
  console.log('[METRICS]', JSON.stringify(record));
});

function initWorker() {
  workerReady = false;

  if (worker) {
    worker.terminate();
    worker = null;
  }

  worker = new Worker("worker.js");

  worker.onmessage = function (e) {
    const data = e.data;

    if (data.type === "AI_READY") {
      workerReady = true;
      return;
    }

    if (data.type === "AI_RESULT") {
      if (data.sessionId !== engine.sessionId) return;

      // 🔥 FIX QUAN TRỌNG NHẤT
      if (data.requestId !== lastSentRequestId) {
        console.warn("[Main] Discard stale result", data.requestId, lastSentRequestId);
        return;
      }

      clearTimeout(hardTimeoutId);

      engine.makeAIMove(data.bestMove, {
        score: data.score,
        nodesEvaluated: data.nodesEvaluated,
        timeMs: data.timeMs,
        depthReached: data.depthReached,
        isTimeout: data.isTimeout
      });
      return;
    }

    if (data.type === "AI_TIMEOUT") {
      clearTimeout(hardTimeoutId);
      engine.setThinking(false);
      return;
    }

    if (data.type === "AI_ERROR") {
      clearTimeout(hardTimeoutId);
      engine.setThinking(false);
      return;
    }
  };

  worker.onerror = function () {
    clearTimeout(hardTimeoutId);
    engine.setThinking(false);
  };
}

function handleClick(r, c) {
  if (!workerReady) return;
  if (engine.isThinking()) return;
  if (engine.getSnapshot().gameStatus !== "ONGOING") return;

  const index = r * 15 + c;
  const success = engine.makeMove(index);
  if (!success) return;

  const snap = engine.getSnapshot();
  if (snap.gameStatus !== "ONGOING") return;

  if (engine.currentPlayer !== -1) return;

  engine.setThinking(true);

  // 🔥 snapshot requestId
  const currentRequestId = engine.requestId;
  lastSentRequestId = currentRequestId;

  worker.postMessage({
    type: "AI_REQUEST",
    board: [...engine.board],
    playerTurn: engine.currentPlayer,
    sessionId: engine.sessionId,
    requestId: currentRequestId,
    depth: engine.config.depth,
    timeoutMs: engine.config.timeoutMs,
    useAlphaBeta: engine.config.useAlphaBeta
  });

  hardTimeoutId = setTimeout(() => {
    if (engine.isThinking()) {
      initWorker();
      engine.setThinking(false);
    }
  }, engine.config.timeoutMs + 500);
}

function resetGame() {
  clearTimeout(hardTimeoutId);
  engine.reset();
  initWorker();
}

function render(snap) {
  if (!snap) snap = engine.getSnapshot();

  boardDiv.innerHTML = "";

  for (let i = 0; i < 225; i++) {
    const r = Math.floor(i / 15);
    const c = i % 15;

    const cell = document.createElement("div");
    cell.className = "cell";

    if (snap.board[i] === 1) cell.innerText = "X";
    if (snap.board[i] === -1) cell.innerText = "O";

    if (i === snap.lastMoveIndex) cell.classList.add("last-move");

    if (!snap.isThinking && snap.gameStatus === "ONGOING") {
      cell.onclick = () => handleClick(r, c);
    }

    boardDiv.appendChild(cell);
  }

  updateStatus(snap);
}

function updateStatus(snap) {
  let statusEl = document.getElementById("status");
  if (!statusEl) return;

  if (snap.gameStatus === "WIN_P1") statusEl.innerText = "X thắng!";
  else if (snap.gameStatus === "WIN_P2") statusEl.innerText = "O thắng!";
  else if (snap.gameStatus === "DRAW") statusEl.innerText = "Hòa!";
  else if (snap.isThinking) statusEl.innerText = "AI đang suy nghĩ...";
  else statusEl.innerText = snap.currentPlayer === 1 ? "Lượt X" : "Lượt O";
}

initWorker();
render();

window.resetGame = resetGame;
document.getElementById("resetBtn").addEventListener("click", resetGame);