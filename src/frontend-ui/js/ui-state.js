// src/frontend-ui/js/ui-state.js
import { CONFIG } from './config.js';

/**
 * Định nghĩa các trạng thái của luồng giao diện
 */
export const GameStatus = {
    PLAYER_TURN: 'PLAYER_TURN',
    AI_THINKING: 'AI_THINKING',
    GAME_OVER: 'GAME_OVER',
    DRAW: 'DRAW'
};

/**
 * UIState: Quản lý trạng thái bàn cờ và luồng dữ liệu cục bộ cho Frontend.
 * Đã chuẩn hóa tên lớp để khớp với các lệnh gọi trong main.js.
 */
export class UIState {
    constructor() {
        this.reset();
    }

    /**
     * Khởi tạo lại toàn bộ trạng thái về mặc định
     */
    reset() {
        // 1. Khởi tạo ma trận 15x15 chứa số 0 (CONFIG.EMPTY)
        this.board = Array.from({ length: CONFIG.BOARD_SIZE }, () => 
            Array(CONFIG.BOARD_SIZE).fill(CONFIG.EMPTY)
        );
        
        // 2. Thiết lập trạng thái luồng và lượt đi mặc định
        this.status = GameStatus.PLAYER_TURN;
        this.currentTurn = CONFIG.PLAYER_HUMAN; // Người đi trước (1)
        
        // 3. Thông tin phục vụ hiển thị highlight và kết quả ván đấu
        this.winner = null;
        this.lastMove = null; 
        
        // 4. Quản lý định danh phiên chơi để chống Stale Message (Tin nhắn lỗi thời từ ván cũ)
        this.gameId = Date.now();
        this.requestId = 0;
        
        // 5. Đồng bộ trạng thái Algorithm Mode trực tiếp từ UI Control Panel
        const activeBtn = document.querySelector('.toggle-btn.active');
        
        // 6. Khởi tạo bộ chỉ số Metrics cho Dashboard
        this.metrics = {
            nodesEvaluated: 0,
            timeMs: 0,
            score: 0,
            depth: 1,
            timeout: false,
            // Lấy mode từ nút đang active trên giao diện hoặc null
            mode: activeBtn ? activeBtn.dataset.value : null 
        };
    }

    /**
     * Kiểm tra bàn cờ có đang trống hoàn toàn hay không
     * @returns {boolean}
     */
    isEmpty() {
        return this.board.every(row => row.every(cell => cell === CONFIG.EMPTY));
    }

    /**
     * Lớp khiên bảo vệ (Guard): Chặn tương tác nếu không phải lượt người chơi hoặc game đã kết thúc
     * @returns {boolean}
     */
    canInteract() {
        return this.status === GameStatus.PLAYER_TURN && this.status !== GameStatus.GAME_OVER;
    }

    /**
     * Thực hiện đặt quân cờ lên ma trận dữ liệu cục bộ và kiểm tra trạng thái thắng/hòa
     * @param {number} row 
     * @param {number} col 
     * @returns {boolean} - Trả về true nếu nước đi hợp lệ và được thực hiện
     */
    placePiece(row, col) {
        // Validate tính hợp lệ trước khi cập nhật ma trận
        if (!this.canInteract()) return false;
        if (row < 0 || row >= CONFIG.BOARD_SIZE || col < 0 || col >= CONFIG.BOARD_SIZE) return false;
        if (this.board[row][col] !== CONFIG.EMPTY) return false;

        // Cập nhật ma trận và lưu vết nước đi mới nhất để vẽ highlight
        this.board[row][col] = this.currentTurn;
        this.lastMove = { row, col, player: this.currentTurn };

        // Kiểm tra trạng thái kết thúc ván đấu (Lite version phục vụ UI)
        if (this.checkWin(row, col)) {
            this.status = GameStatus.GAME_OVER;
            this.winner = this.currentTurn;
        } else if (this.checkDraw()) {
            this.status = GameStatus.DRAW;
        }
        
        return true;
    }

    /**
     * Logic kiểm tra thắng nhanh: Quét 4 hướng từ tọa độ vừa đánh để tìm chuỗi 5 quân liên tiếp
     * @param {number} row
     * @param {number} col
     * @returns {boolean}
     */
    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [
            [0, 1],  // Trục ngang
            [1, 0],  // Trục dọc
            [1, 1],  // Trục chéo chính
            [1, -1]  // Trục chéo phụ
        ];

        for (const [dr, dc] of directions) {
            let count = 1;
            // Kiểm tra xuôi theo hướng (dr, dc)
            for (let i = 1; i < 5; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r >= 0 && r < CONFIG.BOARD_SIZE && c >= 0 && c < CONFIG.BOARD_SIZE && this.board[r][c] === player) {
                    count++;
                } else break;
            }
            // Kiểm tra ngược theo hướng (dr, dc)
            for (let i = 1; i < 5; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r >= 0 && r < CONFIG.BOARD_SIZE && c >= 0 && c < CONFIG.BOARD_SIZE && this.board[r][c] === player) {
                    count++;
                } else break;
            }
            if (count >= 5) return true;
        }
        return false;
    }

    /**
     * Kiểm tra trạng thái hòa: Toàn bộ 225 ô đã được lấp đầy quân
     * @returns {boolean}
     */
    checkDraw() {
        return this.board.every(row => row.every(cell => cell !== CONFIG.EMPTY));
    }
}