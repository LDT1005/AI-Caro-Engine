const worker = new Worker("worker.js");
worker.onmessage = function (e) {
  const move = e.data;

  if (!move || gameOver) {
    isAITurn = false;
    return;
  }

  makeMove(move.r, move.c);
  isAITurn = false;
};
// ************************** TẠO BOARD 15x15
const SIZE = 15;

let board = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
let currentPlayer = 1; // 1 = X, -1 = O
let movesPlayed = 0;
let gameOver = false;
let isAITurn = false;

// ************************** RENDER BOARD
const boardDiv = document.getElementById("board");

function renderBoard() {
  boardDiv.innerHTML = "";

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (board[r][c] === 1) cell.innerText = "X";
      if (board[r][c] === -1) cell.innerText = "O";

      cell.onclick = () => handleClick(r, c);

      boardDiv.appendChild(cell);
    }
  }
}

renderBoard();

// ************************** PLACE MOVE
function placeMove(r, c) {
  if (gameOver || board[r][c] !== 0) return false;

  board[r][c] = currentPlayer;
  movesPlayed++;
  return true;
}

// ************************** CHECK WIN
function checkDirection(r, c, dr, dc) {
  let count = 1;

  for (let i = 1; i < 5; i++) {
    let nr = r + dr * i;
    let nc = c + dc * i;
    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
    if (board[nr][nc] !== currentPlayer) break;
    count++;
  }

  for (let i = 1; i < 5; i++) {
    let nr = r - dr * i;
    let nc = c - dc * i;
    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
    if (board[nr][nc] !== currentPlayer) break;
    count++;
  }

  return count >= 5;
}

function checkWin(r, c) {
  return (
    checkDirection(r, c, 0, 1) ||   // ngang
    checkDirection(r, c, 1, 0) ||   // dọc
    checkDirection(r, c, 1, 1) ||   // chéo chính
    checkDirection(r, c, 1, -1)     // chéo phụ
  );
}

// ************************** CHECK DRAW
function checkDraw() {
  return movesPlayed === SIZE * SIZE;
}

// ************************** MAKE MOVE (DÙNG CHUNG)
function makeMove(r, c) {
  if (!placeMove(r, c)) return false;

  if (checkWin(r, c)) {
    alert((currentPlayer === 1 ? "X" : "O") + " thắng!");
    gameOver = true;
    renderBoard();
    return true;
  }

  if (checkDraw()) {
    alert("Hòa!");
    gameOver = true;
    renderBoard();
    return true;
  }

  currentPlayer *= -1;
  renderBoard();
  return true;
}

// ************************** HANDLE CLICK (CHUẨN PHASE 3)
function handleClick(r, c) {
  if (gameOver || isAITurn) return;

  // Người chơi đi
  if (!makeMove(r, c)) return;

  if (gameOver) return;

  // AI đi
  isAITurn = true;
  // gửi board sang worker
worker.postMessage({
  board: JSON.parse(JSON.stringify(board))
});
}

// ************************** RESET GAME
function resetGame() {
  board = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
  currentPlayer = 1;
  movesPlayed = 0;
  gameOver = false;
  isAITurn = false;

  renderBoard();
}