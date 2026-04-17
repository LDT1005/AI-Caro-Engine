import { CanvasBoard } from './canvas-board.js';
import { GameState, GameStatus } from './game-state.js';
import { UIController } from './ui.js';
import { CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo các module kiến trúc
    const boardUI = new CanvasBoard('game-canvas');
    const state = new GameState();
    const ui = new UIController();

    // Khởi tạo và đọc giá trị mặc định của Depth ngay khi load trang
    const depthSelect = document.getElementById('depth-select');
    state.metrics.depth = parseInt(depthSelect.value);

    // Render bàn cờ lần đầu tiên dựa trên GameState gốc (trống).
    boardUI.render(state);
    ui.resetMetrics();
    ui.updateStatus(state.status, 'Your Turn (X)');

    // 1. Lắng nghe sự kiện Click (Game Flow)
    boardUI.canvas.addEventListener('click', (e) => {
        // KIỂM TRA MỚI: Dựa vào JS State làm Single Source of Truth
        if (!state.metrics.mode) {
            alert("Vui lòng chọn Algorithm Mode (Minimax hoặc Alpha-Beta) trước khi chơi!");
            return; // Chặn luôn, không cho đánh cờ
        }

        // Lớp khiên bảo vệ: Bị chặn nếu AI đang nghĩ hoặc game over
        if (!state.canInteract()) return;

        const { row, col } = boardUI.getCellFromMouse(e);

        // Thử đặt quân cờ
        if (state.placePiece(row, col)) {
            // Render ngay lập tức cho người chơi
            boardUI.render(state);

            // Chuyển State sang trạng thái AI, khóa bảng, bật Spinner
            state.status = GameStatus.AI_THINKING;
            ui.updateStatus(state.status, 'AI is thinking...');

            // --- GIẢ LẬP LUỒNG AI BẤT ĐỒNG BỘ ---
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
        state.reset();
        boardUI.render(state);
        ui.resetMetrics();
        ui.updateStatus(state.status, 'New Game - Your Turn');
        
        // Reset giao diện các nút toggle về trạng thái ban đầu
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        state.metrics.mode = null;

        // Reset luôn Max Depth về giá trị đang hiển thị trên UI
        state.metrics.depth = parseInt(depthSelect.value);
    });

    // 3. Lắng nghe sự kiện thay đổi Algorithm Mode (Segmented Control)
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Xóa trạng thái active của toàn bộ các nút
            toggleBtns.forEach(b => b.classList.remove('active'));
            // Thêm active cho nút vừa click
            e.target.classList.add('active');
            
            // Cập nhật State trực tiếp
            state.metrics.mode = e.target.dataset.value;
            console.log("Đã chuyển thuật toán sang:", state.metrics.mode);
        });
    });

    // 4. Lắng nghe sự kiện thay đổi Depth
    depthSelect.addEventListener('change', (e) => {
        state.metrics.depth = parseInt(e.target.value);
        console.log("Đã chuyển độ sâu sang:", state.metrics.depth);
    });
});