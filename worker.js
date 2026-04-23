importScripts("ai.js");

console.log('[Worker] ai.js loaded');

let ModuleReady = false;
let currentSessionId = null;
let currentRequestId = null;

function onModuleReady() {
  console.log('[Worker] WASM sẵn sàng!');
  ModuleReady = true;
  self.postMessage({ type: 'AI_READY' });
}

if (typeof Module !== 'undefined' && Module.calledRun) {
  onModuleReady();
} else {
  Module.onRuntimeInitialized = onModuleReady;
}


function findFallbackMove(board) {
  const empty = [];
  for (let i = 0; i < 225; i++) {
    if (board[i] === 0) empty.push(i);
  }
  if (empty.length === 0) return -1;

  return empty[Math.floor(Math.random() * empty.length)];
}

self.onmessage = function (e) {
  const { type, board, sessionId, requestId, playerTurn, depth, timeoutMs, useAlphaBeta } = e.data;

  if (type !== 'AI_REQUEST') return;

  currentSessionId = sessionId;
  currentRequestId = requestId;

  if (!ModuleReady) {
    self.postMessage({
      type: 'AI_ERROR',
      sessionId,
      requestId,
      message: 'WASM chưa sẵn sàng'
    });
    return;
  }

  let ptr = null;

  try {
    ptr = Module._malloc(225 * 4);

    const convertedBoard = board.map(v => v === -1 ? 2 : v);
    const tv1Player = playerTurn === -1 ? 2 : playerTurn;

    const heap = new Int32Array(Module.HEAP32.buffer, ptr, 225);
    heap.set(convertedBoard);

    Module._get_best_move(
      ptr,
      tv1Player,
      depth,
      timeoutMs,
      useAlphaBeta ? 1 : 0
    );

    Module._free(ptr);
    ptr = null;

    const bestRow = Module._get_move_row();
    const bestCol = Module._get_move_col();
    let bestMove = bestRow * 15 + bestCol;

    const score = Module._get_move_score();
    const nodesEvaluated = Module._get_nodes();
    const timeMs = Module._get_time_ms();
    const isTimeout = Module._get_is_timeout() === 1;
    const depthReached = Module._get_depth_reached();

    if (sessionId !== currentSessionId || requestId !== currentRequestId) return;

    
    if (
      bestRow === -1 ||
      bestCol === -1 ||
      bestMove < 0 ||
      bestMove >= 225 ||
      convertedBoard[bestMove] !== 0
    ) {
      console.warn("[Worker] AI lỗi → dùng random fallback");

      bestMove = findFallbackMove(convertedBoard);

      if (bestMove === -1) {
        self.postMessage({
          type: 'AI_ERROR',
          sessionId,
          requestId,
          message: 'Không còn nước đi'
        });
        return;
      }
    }

    if (isTimeout) {
      self.postMessage({
        type: 'AI_TIMEOUT',
        sessionId,
        requestId,
        timeMs
      });
      return;
    }

    self.postMessage({
      type: 'AI_RESULT',
      sessionId,
      requestId,
      bestMove,
      score,
      nodesEvaluated,
      timeMs,
      depthReached,
      isTimeout: false
    });

  } catch (err) {
    if (ptr !== null) Module._free(ptr);

    self.postMessage({
      type: 'AI_ERROR',
      sessionId,
      requestId,
      message: err.message
    });
  }
};