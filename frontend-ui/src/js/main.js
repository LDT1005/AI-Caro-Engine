import { CanvasBoard } from './canvas-board.js';
import { GameState, GameStatus } from './game-state.js';
import { UIController } from './ui.js';
import { CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Khởi tạo các module kiến trúc
    const boardUI = new CanvasBoard('game-canvas');
    const state = new GameState();
    const ui = new UIController();

    // 2. Khởi tạo và ánh xạ các DOM elements phục vụ logic điều khiển
    const depthSelect = document.getElementById('depth-select');
    const toggleContainer = document.querySelector('.ui-toggles');
    const toggleBtns = document.querySelectorAll('.toggle-btn');

    // 3. KHỞI TẠO WORKER (Giai đoạn 3 & 4)
    let aiWorker = new Worker('./src/workers/mock-ai-worker.js');

    /**
     * Xử lý lỗi từ Worker/WASM (Mới tích hợp)
     * Đảm bảo giao diện không bị treo nếu lõi AI gặp sự cố
     */
    aiWorker.onerror = (err) => {
        console.error("Lỗi Worker/WASM:", err);
        ui.updateStatus(GameStatus.GAME_OVER, 'LỖI HỆ THỐNG AI!');
        
        // Tự động mở khóa board để người dùng có thể Reset
        if (toggleContainer) toggleContainer.classList.remove('locked');
        depthSelect.disabled = false;
    };

    /**
     * Xử lý kết quả trả về từ AI Worker
     * Trạm thu dữ liệu bất đồng bộ và thực hiện nước đi của AI
     */
    aiWorker.onmessage = (e) => {
        const { action, move, metrics, gameId, requestId } = e.data;

        if (action === 'AI_MOVE_RESULT') {
            // [BẢO VỆ 3.3]: Chống stale message (Tin nhắn lỗi thời từ ván cũ)
            if (gameId !== state.gameId || requestId !== state.requestId) {
                console.warn(`[Worker] Bỏ qua kết quả cũ: req ${requestId} vs current ${state.requestId}`);
                return;
            }

            // Thực hiện nước đi của AI lên bàn cờ
            if (move && state.status === GameStatus.AI_THINKING) {
                // Cập nhật ma trận dữ liệu
                state.board[move.row][move.col] = CONFIG.PLAYER_AI;
                state.lastMove = { row: move.row, col: move.col, player: CONFIG.PLAYER_AI };

                // Hiển thị các chỉ số hiệu năng lên Dashboard
                ui.updateMetrics(metrics);

                // KIỂM TRA TRẠNG THÁI KẾT THÚC SAU NƯỚC AI
                if (state.checkWin(move.row, move.col)) {
                    state.status = GameStatus.GAME_OVER;
                    boardUI.render(state);
                    ui.updateStatus(state.status, 'AI ĐÃ THẮNG! (O)');
                } else if (state.checkDraw()) {
                    state.status = GameStatus.DRAW;
                    boardUI.render(state);
                    ui.updateStatus(state.status, 'HÒA CỜ!');
                } else {
                    // Trả lại lượt cho người chơi
                    state.status = GameStatus.PLAYER_TURN;
                    boardUI.render(state);
                    ui.updateStatus(state.status, 'Your Turn (X)');
                }
            }
        }
    };

    // Thiết lập trạng thái ban đầu cho UI và State
    state.metrics.depth = parseInt(depthSelect.value);
    boardUI.render(state);
    ui.resetMetrics();
    ui.updateStatus(state.status, 'Ready to play');

    /**
     * SỰ KIỆN CLICK BÀN CỜ (Game Flow)
     */
    boardUI.canvas.addEventListener('click', (e) => {
        // Ràng buộc: Phải chọn thuật toán trước khi bắt đầu
        if (!state.metrics.mode) {
            alert("Vui lòng chọn Algorithm Mode trước khi chơi!");
            return; 
        }

        // Lớp khiên bảo vệ (Guard): Chặn tương tác nếu AI đang nghĩ
        if (!state.canInteract()) return;

        const { row, col } = boardUI.getCellFromMouse(e);

        // THỰC HIỆN NƯỚC ĐI NGƯỜI CHƠI
        if (state.placePiece(row, col)) {
            // [KHÓA GIAO DIỆN]: Cấm đổi cấu hình khi ván đấu đang diễn ra
            if (toggleContainer) toggleContainer.classList.add('locked');
            depthSelect.disabled = true;

            boardUI.render(state);

            // Kiểm tra nếu người chơi thắng ngay
            if (state.status === GameStatus.GAME_OVER) {
                ui.updateStatus(state.status, 'BẠN ĐÃ THẮNG! (X)');
                return;
            }

            // Kích hoạt luồng AI bất đồng bộ
            state.status = GameStatus.AI_THINKING;
            ui.updateStatus(state.status, 'AI is thinking...');

            // [BẢO VỆ 3.3]: Định danh yêu cầu mới nhất
            state.requestId++;

            // Gửi dữ liệu sang Worker xử lý (Non-blocking)
            aiWorker.postMessage({
                board: state.board,
                depth: state.metrics.depth,
                mode: state.metrics.mode,
                gameId: state.gameId,
                requestId: state.requestId
            });
        }
    });

    /**
     * SỰ KIỆN RESET GAME
     */
    document.getElementById('btn-reset').addEventListener('click', () => {
        // Reset State Machine (Làm mới gameId)
        state.reset();
        
        // Khôi phục giao diện sạch
        boardUI.render(state);
        ui.resetMetrics();
        ui.updateStatus(state.status, 'Ready to play');
        
        // MỞ KHÓA GIAO DIỆN CẤU HÌNH
        if (toggleContainer) toggleContainer.classList.remove('locked');
        depthSelect.disabled = false;
        
        toggleBtns.forEach(btn => btn.classList.remove('active'));
        state.metrics.mode = null;
        
        // Đồng bộ lại Depth theo giá trị hiện tại trên UI
        state.metrics.depth = parseInt(depthSelect.value);
    });

    /**
     * LẮNG NGHE THAY ĐỔI ALGORITHM MODE
     */
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Chỉ cho phép đổi nếu bàn cờ trống
            if (!state.isEmpty()) return;

            toggleBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            state.metrics.mode = e.target.dataset.value;
            console.log("Algorithm selected:", state.metrics.mode);
        });
    });

    /**
     * LẮNG NGHE THAY ĐỔI MAX DEPTH
     */
    depthSelect.addEventListener('change', (e) => {
        // Chỉ cho phép đổi nếu bàn cờ trống
        if (!state.isEmpty()) {
            depthSelect.value = state.metrics.depth; // Trả về giá trị cũ nếu vi phạm
            return;
        }
        state.metrics.depth = parseInt(e.target.value);
        console.log("Max Depth set to:", state.metrics.depth);
    });
});