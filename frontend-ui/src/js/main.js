import { CanvasBoard } from './canvas-board.js';
import { GameState, GameStatus } from './game-state.js';
import { UIController } from './ui.js';
import { CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Khởi tạo các module kiến trúc
    const boardUI = new CanvasBoard('game-canvas');
    const state = new GameState();
    const ui = new UIController();

    // 2. Khởi tạo các DOM elements phục vụ logic điều khiển và khóa UI
    const depthSelect = document.getElementById('depth-select');
    const toggleContainer = document.querySelector('.ui-toggles');
    const toggleBtns = document.querySelectorAll('.toggle-btn');

    // Đọc giá trị mặc định của Depth ngay khi load trang để đồng bộ vào State
    state.metrics.depth = parseInt(depthSelect.value);

    // Render trạng thái ban đầu
    boardUI.render(state);
    ui.resetMetrics();
    ui.updateStatus(state.status, 'Ready to play');

    // --- CÁC TRÌNH LẮNG NGHE SỰ KIỆN ---

    // 1. Lắng nghe sự kiện Click trên bàn cờ (Game Flow)
    boardUI.canvas.addEventListener('click', (e) => {
        // KIỂM TRA: Bắt buộc chọn thuật toán trước khi chơi
        if (!state.metrics.mode) {
            alert("Vui lòng chọn Algorithm Mode (Minimax hoặc Alpha-Beta) trước khi chơi!");
            return; 
        }

        // Lớp khiên bảo vệ (Guard): Chặn click nếu AI đang nghĩ hoặc game over
        if (!state.canInteract()) return;

        // Map tọa độ từ Pixel sang mảng index
        const { row, col } = boardUI.getCellFromMouse(e);

        // Thử đặt quân cờ của Người chơi (X)
        if (state.placePiece(row, col)) {
            // [KHÓA GIAO DIỆN]: Cấm thay đổi cấu hình khi trận đấu đã bắt đầu
            if (toggleContainer) toggleContainer.classList.add('locked');
            depthSelect.disabled = true;

            // Render ngay lập tức nước đi của người chơi
            boardUI.render(state);

            // Chuyển State sang AI_THINKING, khóa bảng, bật Spinner
            state.status = GameStatus.AI_THINKING;
            ui.updateStatus(state.status, 'AI is thinking...');

            // --- GIẢ LẬP LUỒNG AI BẤT ĐỒNG BỘ (Sẽ được thay bằng Web Worker ở Giai đoạn 3) ---
            setTimeout(() => {
                // Logic giả lập: Tìm ô trống đầu tiên để đặt quân AI (O)
                let moved = false;
                for (let r = 0; r < CONFIG.BOARD_SIZE; r++) {
                    for (let c = 0; c < CONFIG.BOARD_SIZE; c++) {
                        if (state.board[r][c] === CONFIG.EMPTY) {
                            state.board[r][c] = CONFIG.PLAYER_AI;
                            state.lastMove = { row: r, col: c, player: CONFIG.PLAYER_AI };
                            moved = true;
                            break;
                        }
                    }
                    if (moved) break;
                }
                
                // Trả lại lượt cho người chơi
                state.status = GameStatus.PLAYER_TURN;
                boardUI.render(state);
                ui.updateStatus(state.status, 'Your Turn (X)');
            }, 600); 
        }
    });

    // 2. Lắng nghe sự kiện Reset Game
    document.getElementById('btn-reset').addEventListener('click', () => {
        // Reset State Machine (Bao gồm cả việc sinh gameId mới)
        state.reset();
        
        // Cập nhật UI về trạng thái sạch
        boardUI.render(state);
        ui.resetMetrics();
        ui.updateStatus(state.status, 'Ready to play');
        
        // [MỞ KHÓA GIAO DIỆN]: Trả lại quyền cấu hình
        if (toggleContainer) toggleContainer.classList.remove('locked');
        depthSelect.disabled = false;
        
        // Reset các nút Mode trên giao diện
        toggleBtns.forEach(btn => btn.classList.remove('active'));
        state.metrics.mode = null;

        // Đồng bộ lại Depth từ UI vào State sau khi reset
        state.metrics.depth = parseInt(depthSelect.value);
    });

    // 3. Lắng nghe sự kiện thay đổi Algorithm Mode (Custom Toggles)
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // KIỂM TRA: Nếu ván đấu đang diễn ra (bàn cờ không trống), cấm đổi mode
            if (!state.isEmpty()) {
                console.warn("Không thể thay đổi thuật toán khi trận đấu đang diễn ra!");
                return;
            }

            // Cập nhật hiển thị nút active
            toggleBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Lưu Mode vào State để Worker sử dụng sau này
            state.metrics.mode = e.target.dataset.value;
            console.log("Đã chọn thuật toán:", state.metrics.mode);
        });
    });

    // 4. Lắng nghe sự kiện thay đổi Max Depth
    depthSelect.addEventListener('change', (e) => {
        // KIỂM TRA: Cấm đổi độ sâu nếu ván đấu đang diễn ra
        if (!state.isEmpty()) {
            e.preventDefault();
            // Ép UI quay lời giá trị cũ đang lưu trong state
            depthSelect.value = state.metrics.depth; 
            return;
        }
        
        state.metrics.depth = parseInt(e.target.value);
        console.log("Đã chuyển độ sâu sang:", state.metrics.depth);
    });
});