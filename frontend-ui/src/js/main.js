import { CanvasBoard } from './canvas-board.js';
import { GameState, GameStatus } from './game-state.js';
import { UIController } from './ui.js';
import { CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo các module kiến trúc
    const boardUI = new CanvasBoard('game-canvas');
    const state = new GameState();
    const ui = new UIController();

    // Khởi tạo các DOM elements cần thiết cho logic khóa UI
    const depthSelect = document.getElementById('depth-select');
    const toggleContainer = document.querySelector('.ui-toggles');
    const toggleBtns = document.querySelectorAll('.toggle-btn');

    // Đọc giá trị mặc định của Depth ngay khi load trang
    state.metrics.depth = parseInt(depthSelect.value);

    // Render bàn cờ lần đầu tiên dựa trên GameState gốc (trống).
    boardUI.render(state);
    ui.resetMetrics();
    ui.updateStatus(state.status, 'Ready to play');

    // 1. Lắng nghe sự kiện Click (Game Flow)
    boardUI.canvas.addEventListener('click', (e) => {
        // KIỂM TRA: Bắt buộc chọn thuật toán trước khi chơi
        if (!state.metrics.mode) {
            alert("Vui lòng chọn Algorithm Mode (Minimax hoặc Alpha-Beta) trước khi chơi!");
            return; 
        }

        // Lớp khiên bảo vệ: Bị chặn nếu AI đang nghĩ hoặc game over
        if (!state.canInteract()) return;

        const { row, col } = boardUI.getCellFromMouse(e);

        // Thử đặt quân cờ
        if (state.placePiece(row, col)) {
            // KHÓA GIAO DIỆN: Ngay khi đặt nước đầu tiên, thêm class CSS để khóa UI và vô hiệu hóa select
            if (toggleContainer) toggleContainer.classList.add('locked');
            depthSelect.disabled = true;

            // Render ngay lập tức cho người chơi
            boardUI.render(state);

            // Chuyển State sang trạng thái AI, khóa bảng, bật Spinner
            state.status = GameStatus.AI_THINKING;
            ui.updateStatus(state.status, 'AI is thinking...');

            // --- GIẢ LẬP LUỒNG AI BẤT ĐỒNG BỘ (Sẽ thay bằng Worker ở Giai đoạn 3) ---
            setTimeout(() => {
                for(let r = 0; r < CONFIG.BOARD_SIZE; r++) {
                    for(let c = 0; c < CONFIG.BOARD_SIZE; c++) {
                        if(state.board[r][c] === CONFIG.EMPTY) {
                            state.board[r][c] = CONFIG.PLAYER_AI;
                            state.lastMove = { row: r, col: c, player: CONFIG.PLAYER_AI };
                            
                            state.status = GameStatus.PLAYER_TURN;
                            boardUI.render(state);
                            ui.updateStatus(state.status, 'Your Turn (X)');
                            return; 
                        }
                    }
                }
            }, 600); 
        }
    });

    // 2. Lắng nghe sự kiện Hard Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
        // Dọn dẹp hoàn toàn State Machine và Metrics
        state.reset();
        boardUI.render(state);
        ui.resetMetrics();
        ui.updateStatus(state.status, 'Ready to play');
        
        // MỞ KHÓA GIAO DIỆN
        if (toggleContainer) toggleContainer.classList.remove('locked');
        depthSelect.disabled = false;
        
        // Reset giao diện các nút toggle về trạng thái ban đầu
        toggleBtns.forEach(btn => btn.classList.remove('active'));
        state.metrics.mode = null;

        // Đồng bộ lại Max Depth từ UI vào State sau khi reset
        state.metrics.depth = parseInt(depthSelect.value);
    });

    // 3. Lắng nghe sự kiện thay đổi Algorithm Mode (Segmented Control)
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // KIỂM TRA: Nếu bàn cờ đã có quân (không còn trống), chặn việc đổi mode
            if (!state.isEmpty()) {
                console.warn("Không thể thay đổi thuật toán khi trận đấu đang diễn ra!");
                return;
            }

            // Xóa trạng thái active của toàn bộ các nút
            toggleBtns.forEach(b => b.classList.remove('active'));
            // Thêm active cho nút vừa click
            e.target.classList.add('active');
            
            // Cập nhật State trực tiếp từ data-value của nút
            state.metrics.mode = e.target.dataset.value;
            console.log("Đã chọn thuật toán:", state.metrics.mode);
        });
    });

    // 4. Lắng nghe sự kiện thay đổi Depth
    depthSelect.addEventListener('change', (e) => {
        // Tương tự, nếu đang đánh (bàn cờ không trống) thì không cho đổi độ sâu
        if (!state.isEmpty()) {
            e.preventDefault();
            depthSelect.value = state.metrics.depth; // Ép trả về giá trị cũ đang lưu trong state
            return;
        }
        state.metrics.depth = parseInt(e.target.value);
        console.log("Đã chuyển độ sâu sang:", state.metrics.depth);
    });
});