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
        // 1. Khởi tạo ma trận 15x15 chứa số 0 (CONFIG.EMPTY)
        this.board = Array.from({ length: CONFIG.BOARD_SIZE }, () => 
            Array(CONFIG.BOARD_SIZE).fill(CONFIG.EMPTY)
        );
        
        // 2. Thiết lập trạng thái luồng và lượt đi
        this.status = GameStatus.PLAYER_TURN;
        this.currentTurn = CONFIG.PLAYER_HUMAN; // Người đi trước (1)
        
        // 3. Thông tin ván đấu phục vụ hiển thị và xử lý thắng thua
        this.winner = null;
        this.lastMove = null; // Dùng để highlight nước đi mới nhất
        
        // 4. Quản lý message bất đồng bộ và định danh phiên chơi (Chống Stale Message)
        // Sử dụng Date.now() để đảm bảo gameId luôn duy nhất sau mỗi lần reset
        this.gameId = Date.now();
        this.requestId = 0;
        
        // 5. KIỂM TRA ĐỒNG BỘ: Đọc trạng thái Algorithm Mode trực tiếp từ UI
        const activeBtn = document.querySelector('.toggle-btn.active');
        
        // 6. Khởi tạo lại bộ Metrics
        this.metrics = {
            nodesEvaluated: 0,
            timeMs: 0,
            score: 0,
            depth: 1, // Mặc định bắt đầu từ depth 1
            timeout: false,
            // Mode được gán từ data-value của nút đang active, hoặc null nếu người dùng chưa chọn
            mode: activeBtn ? activeBtn.dataset.value : null 
        };
    }

    // Helper: Kiểm tra bàn cờ có đang trống hay không (Dùng để khóa/mở khóa Control Panel)
    isEmpty() {
        return this.board.every(row => row.every(cell => cell === CONFIG.EMPTY));
    }

    // Lớp khiên bảo vệ (Guard): Chặn tương tác nếu không phải lượt người chơi hoặc game đã kết thúc
    canInteract() {
        return this.status === GameStatus.PLAYER_TURN && this.status !== GameStatus.GAME_OVER;
    }

    // Thực hiện đặt quân cờ lên ma trận
    placePiece(row, col) {
        // Validate nghiêm ngặt trước khi thực hiện cập nhật Board
        if (!this.canInteract()) return false;
        if (row < 0 || row >= CONFIG.BOARD_SIZE || col < 0 || col >= CONFIG.BOARD_SIZE) return false;
        if (this.board[row][col] !== CONFIG.EMPTY) return false;

        // Cập nhật trạng thái ô cờ và lưu lại nước đi cuối cùng để UI vẽ highlight
        this.board[row][col] = this.currentTurn;
        this.lastMove = { row, col, player: this.currentTurn };
        
        return true;
    }
}