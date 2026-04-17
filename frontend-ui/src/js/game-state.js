import { CONFIG } from './config.js';

export const GameStatus = {
    PLAYER_TURN: 'PLAYER_TURN',
    AI_THINKING: 'AI_THINKING',
    GAME_OVER: 'GAME_OVER',
    DRAW: 'DRAW'
};

export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        // Khởi tạo ma trận 15x15 chứa số 0
        this.board = Array.from({ length: CONFIG.BOARD_SIZE }, () => 
            Array(CONFIG.BOARD_SIZE).fill(CONFIG.EMPTY)
        );
        this.currentTurn = CONFIG.PLAYER_HUMAN;
        this.status = GameStatus.PLAYER_TURN;
        this.winner = null;
        this.lastMove = null;
        
        // Quản lý message bất đồng bộ sau này
        this.gameId = (this.gameId || 0) + 1; 
        this.requestId = 0;
        
        // Tìm xem có thuật toán nào đang được chọn trên UI không
        const selectedMode = document.querySelector('input[name="algo-mode"]:checked');
        
        this.metrics = {
            nodesEvaluated: 0,
            timeMs: 0,
            score: 0,
            depth: 0,
            timeout: false,
            // Nếu chưa chọn, mode sẽ là null
            mode: selectedMode ? selectedMode.value : null 
        };
    }

    // Lớp khiên bảo vệ (Guard)
    canInteract() {
        return this.status === GameStatus.PLAYER_TURN;
    }

    placePiece(row, col) {
        // Validate nghiêm ngặt
        if (!this.canInteract()) return false;
        if (row < 0 || row >= CONFIG.BOARD_SIZE || col < 0 || col >= CONFIG.BOARD_SIZE) return false;
        if (this.board[row][col] !== CONFIG.EMPTY) return false;

        // Cập nhật state
        this.board[row][col] = this.currentTurn;
        this.lastMove = { row, col, player: this.currentTurn };
        return true;
    }
}