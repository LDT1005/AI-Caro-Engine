class Engine {
  constructor() {
    this.sessionId = 0;
    this.requestId = 0;
    this._isThinking = false;
    this._listeners = [];
    this._metricsListeners = [];

    this.config = {
      depth: 4,
      useAlphaBeta: true,
      timeoutMs: 2000,
      humanPlayer: 1
    };

    this.reset();
  }

  reset() {
    this.board = new Array(225).fill(0);
    this.currentPlayer = 1;
    this.moveCount = 0;
    this.lastMoveIndex = -1;
    this.gameStatus = 'ONGOING';
    this._isThinking = false;

    this.sessionId++;
    this.requestId = 0;

    this._emit();
  }

  isThinking() {
    return this._isThinking;
  }

  setConfig(cfg) {
    this.config = { ...this.config, ...cfg };
  }

  getSnapshot() {
    return {
      board: [...this.board],
      currentPlayer: this.currentPlayer,
      moveCount: this.moveCount,
      lastMoveIndex: this.lastMoveIndex,
      gameStatus: this.gameStatus,
      isThinking: this._isThinking,
      sessionId: this.sessionId,
      requestId: this.requestId,
      config: { ...this.config }
    };
  }

  onGameStateChange(callback) {
    if (typeof callback === 'function') {
      this._listeners.push(callback);
    }
  }

  onMetrics(callback) {
    if (typeof callback === 'function') {
      this._metricsListeners.push(callback);
    }
  }

  makeMove(index) {
    
    if (this.currentPlayer !== this.config.humanPlayer) return false;

    if (this.gameStatus !== 'ONGOING') return false;
    if (!this.isValidMove(index)) return false;
    if (this._isThinking) return false;

    this.board[index] = this.currentPlayer;
    this.lastMoveIndex = index;
    this.moveCount++;

    if (this.checkWin(index)) {
      this.gameStatus = this.currentPlayer === 1 ? 'WIN_P1' : 'WIN_P2';
      this._emit();
      return true;
    }

    if (this.checkDraw()) {
      this.gameStatus = 'DRAW';
      this._emit();
      return true;
    }

    this.currentPlayer *= -1;

    
    this.requestId++;

    this._emit();
    return true;
  }

  makeAIMove(index, metricsData = {}) {
    
    if (this.currentPlayer === this.config.humanPlayer) {
      this._isThinking = false;
      return;
    }

    if (this.gameStatus !== 'ONGOING') {
      this._isThinking = false;
      this._emit();
      return;
    }

    if (!this.isValidMove(index)) {
      console.warn('[Engine] AI trả về nước không hợp lệ:', index);
      this._isThinking = false;
      this._emit();
      return;
    }

    this.board[index] = this.currentPlayer;
    this.lastMoveIndex = index;
    this.moveCount++;

    this._emitMetrics({
      sessionId: this.sessionId,
      requestId: this.requestId,
      boardStateHash: this._hashBoard(),
      bestMove: index,
      depthTarget: this.config.depth,
      depthReached: metricsData.depthReached ?? this.config.depth,
      nodesEvaluated: metricsData.nodesEvaluated ?? 0,
      timeMs: metricsData.timeMs ?? 0,
      score: metricsData.score ?? 0,
      isTimeout: metricsData.isTimeout ?? false,
      useAlphaBeta: this.config.useAlphaBeta
    });

    if (this.checkWin(index)) {
      this.gameStatus = this.currentPlayer === 1 ? 'WIN_P1' : 'WIN_P2';
      this._isThinking = false;
      this._emit();
      return;
    }

    if (this.checkDraw()) {
      this.gameStatus = 'DRAW';
      this._isThinking = false;
      this._emit();
      return;
    }

    this.currentPlayer *= -1;
    this._isThinking = false;

    this._emit();
  }

  setThinking(val) {
    this._isThinking = val;
    this._emit();
  }

  isValidMove(index) {
    return (
      index >= 0 &&
      index < 225 &&
      this.board[index] === 0
    );
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

  _emit() {
    const snap = this.getSnapshot();
    this._listeners.forEach(cb => {
      try { cb(snap); } catch (e) { console.error('[Engine] listener error:', e); }
    });
  }

  _emitMetrics(record) {
    this._metricsListeners.forEach(cb => {
      try { cb(record); } catch (e) { console.error('[Engine] metrics error:', e); }
    });
  }

  _hashBoard() {
    let hash = 0;
    for (let i = 0; i < 225; i++) {
      hash = (hash * 3 + (this.board[i] + 1)) | 0;
    }
    return hash >>> 0;
  }
}

export default Engine;