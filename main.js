import Engine from "./engine.js";


const engine = new Engine();
let worker = null;
let timeoutId = null;

const boardDiv = document.getElementById("board");


function initWorker() {
  worker = new Worker("worker.js");

  worker.onmessage = function (e) {
    const data = e.data;

    if (data.type === "AI_RESULT") {

      
      if (data.sessionId !== engine.sessionId) return;
      if (data.requestId !== engine.requestId) return;

      
      clearTimeout(timeoutId);

      engine.isThinking = false;

      if (data.bestMove === -1) return;

      engine.makeAIMove(data.bestMove);

      render();
    }

    if (data.type === "AI_ERROR") {
      console.error("AI ERROR:", data.message);
      engine.isThinking = false;
    }

    if (data.type === "AI_READY") {
      console.log("AI READY");
    }
  };
}


initWorker();


function render() {
  boardDiv.innerHTML = "";

  for (let i = 0; i < 225; i++) {
    const r = Math.floor(i / 15);
    const c = i % 15;

    const cell = document.createElement("div");
    cell.className = "cell";

    if (engine.board[i] === 1) cell.innerText = "X";
    if (engine.board[i] === -1) cell.innerText = "O";

    cell.onclick = () => handleClick(r, c);

    boardDiv.appendChild(cell);
  }
}


function handleClick(r, c) {
  if (engine.isThinking) return;

  const index = r * 15 + c;

  const success = engine.makeMove(index);
  if (!success) return;

  render();

  // Nếu game kết thúc → dừng
  if (engine.gameStatus !== "ONGOING") return;

  
  engine.isThinking = true;
  engine.requestId++;

  worker.postMessage({
    type: "AI_REQUEST",
    board: engine.board,
    player: engine.currentPlayer,
    sessionId: engine.sessionId,
    requestId: engine.requestId
  });


  timeoutId = setTimeout(() => {
    if (engine.isThinking) {
      console.log("AI TIMEOUT -> restart worker");

      worker.terminate();
      initWorker(); 

      engine.isThinking = false;
    }
  }, 3000);
}


function resetGame() {
  engine.reset();

  clearTimeout(timeoutId);

  worker.terminate();
  initWorker(); 

  render();
}


render();


window.resetGame = resetGame;