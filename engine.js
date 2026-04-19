class Engine {
  constructor() {
    this.sessionId = 0;
    this.requestId = 0;
    this.reset();
  }

  
  reset() {
    this.board = new Array(225).fill(0);
    this.currentPlayer = 1;
    this.moveCount = 0;

    this.lastMoveIndex = -1;
    this.gameStatus = 'ONGOING';

    this.sessionId++;
    this.requestId = 0;

    this.isThinking = false;
  }

  
  isValidMove(index) {
    return index >= 0 && index < 225 && this.board[index] === 0;
  }

  
  makeMove(index) {
    if (this.gameStatus !== 'ONGOING') return false;
    if (!this.isValidMove(index)) return false;
    if (this.isThinking) return false;

    this.board[index] = this.currentPlayer;
    this.lastMoveIndex = index;
    this.moveCount++;

    if (this.checkWin(index)) {
      this.gameStatus = this.currentPlayer === 1 ? 'WIN_P1' : 'WIN_P2';
      return true;
    }

    if (this.checkDraw()) {
      this.gameStatus = 'DRAW';
      return true;
    }

    this.currentPlayer *= -1;
    return true;
  }

  
  makeAIMove(index) {
    if (this.gameStatus !== 'ONGOING') return;

    if (!this.isValidMove(index)) {
      console.warn("AI move invalid");
      this.isThinking = false;
      return;
    }

    this.board[index] = this.currentPlayer;
    this.lastMoveIndex = index;
    this.moveCount++;

    if (this.checkWin(index)) {
      this.gameStatus = this.currentPlayer === 1 ? 'WIN_P1' : 'WIN_P2';
      this.isThinking = false;
      return;
    }

    if (this.checkDraw()) {
      this.gameStatus = 'DRAW';
      this.isThinking = false;
      return;
    }

    this.currentPlayer *= -1;
    this.isThinking = false;
  }

  
  checkDraw() {
    return this.moveCount >= 225;
  }

  
  checkWin(index) {
    const player = this.board[index];
    const row = Math.floor(index / 15);
    const col = index % 15;

    const directions = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1]
    ];

    for (let [dx, dy] of directions) {
      let count = 1;

      
      let r = row + dx;
      let c = col + dy;
      while (this.getCell(r, c) === player) {
        count++;
        r += dx;
        c += dy;
      }

      
      r = row - dx;
      c = col - dy;
      while (this.getCell(r, c) === player) {
        count++;
        r -= dx;
        c -= dy;
      }

      if (count >= 5) return true;
    }

    return false;
  }

  
  getCell(row, col) {
    if (row < 0 || row >= 15 || col < 0 || col >= 15) return null;
    return this.board[row * 15 + col];
  }
}

export default Engine;