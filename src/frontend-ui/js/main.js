// src/frontend-ui/js/main.js
import { CanvasBoard } from './canvas-board.js';
import { UIState, GameStatus } from './ui-state.js'; 
import { UIController } from './ui.js';
import { CONFIG } from './config.js';
import { AIProviderWrapper } from './ai-adapter.js'; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. Khởi tạo các module kiến trúc
    const boardUI = new CanvasBoard('game-canvas');
    const state = new UIState(); 
    const ui = new UIController();
    
    // 2. Ánh xạ các DOM elements phục vụ điều khiển
    const depthSelect = document.getElementById('depth-select');
    const toggleContainer = document.querySelector('.ui-toggles');
    const toggleBtns = document.querySelectorAll('.toggle-btn');

    // 3. KHỞI TẠO AI ADAPTER - GIAI ĐOẠN 4
    // false = Kết nối tới src/engine-runtime/workers/ai-worker.js (TV2/Engine thật)
    const aiAdapter = new AIProviderWrapper(false); 

    /**
     * Xử lý lỗi từ Worker/WASM
     */
    aiAdapter.onError((err) => {
        console.error("Lỗi hệ thống AI (WASM):", err);
        ui.updateStatus(GameStatus.GAME_OVER, 'HỆ THỐNG AI GẶP SỰ CỐ!');
        if (toggleContainer) toggleContainer.classList.remove('locked');
        depthSelect.disabled = false;
    });

    /**
     * Xử lý kết quả trả về từ AI Engine (Tích hợp GĐ 4)
     */
    aiAdapter.onResponse((e) => {
        const { action, move, metrics, gameId, requestId, engineState } = e.data;

        if (action === 'AI_MOVE_RESULT') {
            // [BẢO VỆ]: Chống stale message (Tin nhắn lỗi thời từ ván cũ hoặc request cũ)
            if (gameId !== state.gameId || requestId !== state.requestId) {
                console.warn(`[Worker] Bỏ qua kết quả cũ: req ${requestId}`);
                return;
            }

            // Thực hiện nước đi của AI lên bàn cờ dựa trên kết quả từ WASM
            if (move && state.status === GameStatus.AI_THINKING) {
                // Cập nhật Board local để render nhanh
                state.board[move.row][move.col] = CONFIG.PLAYER_AI;
                state.lastMove = { row: move.row, col: move.col, player: CONFIG.PLAYER_AI };
                
                // Hiển thị Metrics thật từ WASM vào Dashboard
                ui.updateMetrics({
                    ...metrics,
                    mode: state.metrics.mode 
                });

                // KIỂM TRA TRẠNG THÁI KẾT THÚC (Ưu tiên tín hiệu engineState từ Engine thật)
                const isGameOver = engineState?.isOver || state.checkWin(move.row, move.col);

                if (isGameOver) {
                    state.status = GameStatus.GAME_OVER;
                    boardUI.render(state);
                    // Hiển thị thông báo thắng dựa trên engineState nếu có, nếu không dùng mặc định
                    const winner = engineState?.winner || (state.checkWin(move.row, move.col) ? CONFIG.PLAYER_AI : 0);
                    const winMsg = winner === CONFIG.PLAYER_HUMAN ? 'BẠN THẮNG!' : 'AI ĐÃ THẮNG! (O)';
                    ui.updateStatus(state.status, winMsg);
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
    });

    // Thiết lập cấu hình ban đầu
    state.metrics.depth = parseInt(depthSelect.value);
    boardUI.render(state);
    ui.resetMetrics();
    ui.updateStatus(state.status, 'Ready to play');

    /**
     * SỰ KIỆN CLICK BÀN CỜ (Game Flow)
     */
    boardUI.canvas.addEventListener('click', (e) => {
        // Ràng buộc GĐ 4: Phải chọn thuật toán để Engine biết mode chạy
        if (!state.metrics.mode) {
            alert("Vui lòng chọn Algorithm Mode trước khi chơi!");
            return; 
        }

        // Lớp khiên bảo vệ (Guard): Chặn tương tác nếu AI đang tính toán hoặc game đã xong
        if (!state.canInteract()) return;

        const cell = boardUI.getCellFromMouse(e);
        if (!cell) return; 

        // THỰC HIỆN NƯỚC ĐI NGƯỜI CHƠI
        if (state.placePiece(cell.row, cell.col)) {
            // KHÓA GIAO DIỆN: Không cho đổi cấu hình khi đang trong lượt đấu
            if (toggleContainer) toggleContainer.classList.add('locked');
            depthSelect.disabled = true;

            boardUI.render(state);

            // Kiểm tra nếu người chơi thắng ngay lập tức
            if (state.status === GameStatus.GAME_OVER) {
                ui.updateStatus(state.status, 'BẠN THẮNG!');
                return;
            }

            // Chuyển sang luồng AI
            state.status = GameStatus.AI_THINKING;
            ui.updateStatus(state.status, 'AI is thinking...');
            
            // Tăng định danh yêu cầu cho phiên hiện tại
            state.requestId++;

            // Gửi yêu cầu tính toán sang AI Adapter
            aiAdapter.requestBestMove({
                board: state.board,
                depth: state.metrics.depth,
                mode: state.metrics.mode,
                gameId: state.gameId,
                requestId: state.requestId,
                playerTurn: CONFIG.PLAYER_AI
            });
        }
    });

    /**
     * SỰ KIỆN RESET GAME
     */
    document.getElementById('btn-reset').addEventListener('click', () => {
        // 1. Reset State Machine địa phương (Tạo gameId mới để hủy các callback cũ)
        state.reset();
        
        // 2. Báo cho Engine C++ thực hiện dọn dẹp bộ nhớ Heap (GĐ 4)
        aiAdapter.resetEngine();
        
        // 3. Cập nhật lại giao diện sạch
        boardUI.render(state);
        ui.resetMetrics();
        ui.updateStatus(state.status, 'Ready to play');
        
        // 4. MỞ KHÓA GIAO DIỆN CẤU HÌNH
        if (toggleContainer) toggleContainer.classList.remove('locked');
        depthSelect.disabled = false;
        
        toggleBtns.forEach(btn => btn.classList.remove('active'));
        state.metrics.mode = null;
        state.metrics.depth = parseInt(depthSelect.value);
    });

    /**
     * LẮNG NGHE THAY ĐỔI ALGORITHM MODE
     */
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Chỉ cho phép đổi cấu hình nếu bàn cờ đang trống
            if (!state.isEmpty()) return;
            
            toggleBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.metrics.mode = e.target.dataset.value;
            
            // Đồng bộ cấu hình mới xuống Engine ngay lập tức (GĐ 4)
            aiAdapter.updateEngineConfig({
                depth: state.metrics.depth,
                mode: state.metrics.mode
            });
        });
    });

    /**
     * LẮNG NGHE THAY ĐỔI MAX DEPTH
     */
    depthSelect.addEventListener('change', (e) => {
        // Chỉ cho phép đổi cấu hình nếu bàn cờ đang trống
        if (!state.isEmpty()) {
            depthSelect.value = state.metrics.depth; // Hoàn trả giá trị cũ
            return;
        }
        state.metrics.depth = parseInt(e.target.value);
        
        // Đồng bộ cấu hình mới xuống Engine (GĐ 4)
        if (state.metrics.mode) {
            aiAdapter.updateEngineConfig({
                depth: state.metrics.depth,
                mode: state.metrics.mode
            });
        }
    });
});