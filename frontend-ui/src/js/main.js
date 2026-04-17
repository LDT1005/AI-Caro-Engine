import { CanvasBoard } from './canvas-board.js';
import { GameState, GameStatus } from './game-state.js';
import { UIController } from './ui.js';
import { CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo các module kiến trúc
    const boardUI = new CanvasBoard('game-canvas');
    const state = new GameState();
    const ui = new UIController();

    // Thay thế logic vẽ tĩnh của Giai đoạn 1 bằng logic render động.
    // Render bàn cờ lần đầu tiên dựa trên GameState gốc (trống).
    boardUI.render(state);
    ui.resetMetrics();
    ui.updateStatus(state.status, 'Your Turn (Black)');

    // 1. Lắng nghe sự kiện Click (Game Flow)
    boardUI.canvas.addEventListener('click', (e) => {
        // Lớp khiên bảo vệ: Bị chặn nếu AI đang nghĩ hoặc game over
        if (!state.canInteract()) return;

        const { row, col } = boardUI.getCellFromMouse(e);

        // Thử đặt quân cờ (sẽ trả về false nếu ô đã có quân)
        if (state.placePiece(row, col)) {
            // Render ngay lập tức cho người chơi (KPI phản hồi < 16ms)
            boardUI.render(state);

            // Chuyển State sang trạng thái AI, khóa bảng, bật Spinner
            state.status = GameStatus.AI_THINKING;
            ui.updateStatus(state.status, 'AI is thinking...');

            // --- GIẢ LẬP LUỒNG AI BẤT ĐỒNG BỘ (Sẽ thay bằng Worker ở Giai đoạn 3) ---
            setTimeout(() => {
                // Mock logic: AI tìm ô trống đầu tiên từ góc trên cùng bên trái để đánh
                for(let r = 0; r < CONFIG.BOARD_SIZE; r++) {
                    for(let c = 0; c < CONFIG.BOARD_SIZE; c++) {
                        if(state.board[r][c] === CONFIG.EMPTY) {
                            // Cập nhật State cho AI
                            state.board[r][c] = CONFIG.PLAYER_AI;
                            state.lastMove = { row: r, col: c, player: CONFIG.PLAYER_AI };
                            
                            // Trả lượt về cho người chơi
                            state.status = GameStatus.PLAYER_TURN;
                            boardUI.render(state);
                            ui.updateStatus(state.status, 'Your Turn (Black)');
                            return; // Thoát vòng lặp ngay khi AI đã đánh
                        }
                    }
                }
            }, 600); // Giả lập độ trễ AI suy nghĩ mất 600ms
        }
    });

    // 2. Lắng nghe sự kiện Hard Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
        // Dọn dẹp hoàn toàn State Machine và Metrics, vẽ lại lưới trống
        state.reset();
        boardUI.render(state);
        ui.resetMetrics();
        ui.updateStatus(state.status, 'New Game - Your Turn');
    });
});