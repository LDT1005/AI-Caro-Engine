importScripts("ai.js");

let ModuleReady = false;

Module.onRuntimeInitialized = function () {
  ModuleReady = true;
  self.postMessage({ type: 'AI_READY' });
};

self.onmessage = function (e) {
  const { type, board, sessionId, requestId, playerTurn, depth, timeoutMs, useAlphaBeta } = e.data;

  if (type !== 'AI_REQUEST') return;

  if (!ModuleReady) {
    self.postMessage({
      type: 'AI_ERROR',
      sessionId,
      requestId,
      message: 'WASM Module chưa sẵn sàng'
    });
    return;
  }

  const startTime = Date.now();

  let ptr = null;

  try {

    ptr = Module._malloc(225 * 4);

    if (!ptr) {
      throw new Error('_malloc thất bại, không cấp phát được heap');
    }

    const heap = new Int32Array(Module.HEAP32.buffer, ptr, 225);
    heap.set(board);

    const bestMove = Module._get_best_move(ptr);

    Module._free(ptr);
    ptr = null;

    
    const timeMs = Date.now() - startTime;

    const isTimeout = timeMs >= timeoutMs;

    
    if (isTimeout) {
      self.postMessage({
        type: 'AI_TIMEOUT',
        sessionId,
        requestId,
        timeMs
      });
      return;
    }

    // AI_RESULT 
    self.postMessage({
      type: 'AI_RESULT',
      sessionId,
      requestId,
      bestMove,
      score: 0,            //  AI thật
      nodesEvaluated: 0,   //  AI thật
      timeMs,
      depthReached: depth, // TV1 cập nhật 
      isTimeout: false
    });

  } catch (err) {
    
    if (ptr !== null) {
      Module._free(ptr);
      ptr = null;
    }

    
    self.postMessage({
      type: 'AI_ERROR',
      sessionId,
      requestId,
      message: err.message
    });
  }
};