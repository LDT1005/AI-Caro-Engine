importScripts("ai.js");

let ModuleReady = false;

Module.onRuntimeInitialized = function () {
  ModuleReady = true;
};

self.onmessage = function (e) {
  if (!ModuleReady) return;

  const { board } = e.data;

  let flatBoard = board.flat();

  // cấp phát bộ nhớ
  let ptr = Module._malloc(flatBoard.length * 4);

  // ghi dữ liệu vào WASM (KHÔNG dùng HEAP32 nữa)
  for (let i = 0; i < flatBoard.length; i++) {
    Module.setValue(ptr + i * 4, flatBoard[i], "i32");
  }

  // gọi AI
  let moveIndex = Module._get_best_move(ptr);

  // giải phóng bộ nhớ
  Module._free(ptr);

  if (moveIndex === -1) {
    self.postMessage(null);
    return;
  }

  let r = Math.floor(moveIndex / 15);
  let c = moveIndex % 15;

  self.postMessage({ r, c });
};