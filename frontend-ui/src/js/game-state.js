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
        // Khởi tạo ma trận 15x15 chứa số 0 (CONFIG.EMPTY)
        this.board = Array.from({ length: CONFIG.BOARD_SIZE }, () => 
            Array(CONFIG.BOARD_SIZE).fill(CONFIG.EMPTY)
        );
        this.currentTurn = CONFIG.PLAYER_HUMAN;
        this.status = GameStatus.PLAYER_TURN;
        this.winner = null;
        this.lastMove = null;
        
        // Quản lý message bất đồng bộ và định danh phiên chơi
        this.gameId = (this.gameId || 0) + 1; 
        this.requestId = 0;
        
        // KIỂM TRA ĐỒNG BỘ: Đọc trạng thái Algorithm Mode từ UI Toggles (Custom Buttons)
        // Nếu bạn dùng hệ thống Button Toggle mới, chúng ta sẽ kiểm tra class 'active'
        const activeBtn = document.querySelector('.toggle-btn.active');
        
        this.metrics = {
            nodesEvaluated: 0,
            timeMs: 0,
            score: 0,
            depth: 0,
            timeout: false,
            // Mode sẽ được gán từ data-value của nút đang active, hoặc null nếu chưa chọn
            mode: activeBtn ? activeBtn.dataset.value : null 
        };
    }

    // Helper: Kiểm tra bàn cờ có đang trống hay không (dùng để khóa/mở khóa Control Panel)
    isEmpty() {
        return this.board.every(row => row.every(cell => cell === CONFIG.EMPTY));
    }

    // Lớp khiên bảo vệ (Guard): Chỉ cho phép tương tác khi tới lượt người chơi
    canInteract() {
        return this.status === GameStatus.PLAYER_TURN;
    }

    placePiece(row, col) {
        // Validate nghiêm ngặt trước khi thực hiện nước đi
        if (!this.canInteract()) return false;
        if (row < 0 || row >= CONFIG.BOARD_SIZE || col < 0 || col >= CONFIG.BOARD_SIZE) return false;
        if (this.board[row][col] !== CONFIG.EMPTY) return false;

        // Cập nhật trạng thái ô cờ và lưu lại nước đi cuối cùng để highlight
        this.board[row][col] = this.currentTurn;
        this.lastMove = { row, col, player: this.currentTurn };
        return true;
    }
}