importScripts("ai.js");

let ModuleReady = false;

Module.onRuntimeInitialized = function () {
  ModuleReady = true;
};

self.onmessage = function (e) {
  if (!ModuleReady) return;

  const { board, sessionId, requestId } = e.data;

  
  let ptr = Module._malloc(board.length * 4);

  
  for (let i = 0; i < board.length; i++) {
    Module.setValue(ptr + i * 4, board[i], "i32");
  }

  
  let moveIndex = Module._get_best_move(ptr);

  
  Module._free(ptr);

  
  self.postMessage({
    type: 'AI_RESULT',
    sessionId,
    requestId,
    bestMove: moveIndex
  });
};