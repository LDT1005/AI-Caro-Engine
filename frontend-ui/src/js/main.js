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

    // Đồng bộ giá trị Depth mặc định từ UI vào State ngay khi load trang
    state.metrics.depth = parseInt(depthSelect.value);

    // Render trạng thái ban đầu của hệ thống
    boardUI.render(state);
    ui.resetMetrics();
    ui.updateStatus(state.status, 'Ready to play');

    // --- CÁC TRÌNH LẮNG NGHE SỰ KIỆN ---

    // 1. Lắng nghe sự kiện Click trên bàn cờ (Luồng xử lý chính)
    boardUI.canvas.addEventListener('click', (e) => {
        // KIỂM TRA: Bắt buộc người chơi phải chọn thuật toán trước khi đặt quân
        if (!state.metrics.mode) {
            alert("Vui lòng chọn Algorithm Mode (Minimax hoặc Alpha-Beta) trước khi chơi!");
            return; 
        }

        // Lớp khiên bảo vệ (Guard): Chặn click nếu AI đang suy nghĩ hoặc game đã kết thúc
        if (!state.canInteract()) return;

        // Chuyển đổi tọa độ click từ Pixel sang Index ma trận (row, col)
        const { row, col } = boardUI.getCellFromMouse(e);

        // THỰC HIỆN NƯỚC ĐI CỦA NGƯỜI CHƠI (X)
        if (state.placePiece(row, col)) {
            // [KHÓA GIAO DIỆN]: Vô hiệu hóa cấu hình ngay khi nước đi đầu tiên hợp lệ
            if (toggleContainer) toggleContainer.classList.add('locked');
            depthSelect.disabled = true;

            // Render ngay lập tức nước đi của người chơi lên màn hình
            boardUI.render(state);

            // KIỂM TRA THẮNG THUA: Nếu người chơi thắng sau nước đi này
            if (state.status === GameStatus.GAME_OVER) {
                ui.updateStatus(state.status, 'BẠN ĐÃ THẮNG! (X)');
                return;
            }

            // Nếu chưa thắng, chuyển sang trạng thái AI đang suy nghĩ
            state.status = GameStatus.AI_THINKING;
            ui.updateStatus(state.status, 'AI is thinking...');

            // --- GIẢ LẬP LUỒNG AI BẤT ĐỒNG BỘ (Sẽ thay bằng Web Worker ở Giai đoạn 3) ---
            setTimeout(() => {
                // Kiểm tra lại trạng thái để tránh lỗi khi người dùng nhấn Reset quá nhanh
                if (state.status !== GameStatus.AI_THINKING) return;

                let aiMoved = false;
                // Logic giả lập: Tìm ô trống đầu tiên từ trái sang phải, trên xuống dưới
                for (let r = 0; r < CONFIG.BOARD_SIZE; r++) {
                    for (let c = 0; c < CONFIG.BOARD_SIZE; c++) {
                        if (state.board[r][c] === CONFIG.EMPTY) {
                            // AI thực hiện nước đi (O)
                            state.board[r][c] = CONFIG.PLAYER_AI;
                            state.lastMove = { row: r, col: c, player: CONFIG.PLAYER_AI };
                            
                            // KIỂM TRA THẮNG THUA: Nếu AI thắng sau nước đi giả lập này
                            if (state.checkWin(r, c)) {
                                state.status = GameStatus.GAME_OVER;
                                boardUI.render(state);
                                ui.updateStatus(state.status, 'AI ĐÃ THẮNG! (O)');
                                return;
                            }
                            
                            aiMoved = true;
                            break;
                        }
                    }
                    if (aiMoved) break;
                }
                
                // Trả lại quyền kiểm soát cho người chơi
                state.status = GameStatus.PLAYER_TURN;
                boardUI.render(state);
                ui.updateStatus(state.status, 'Your Turn (X)');
            }, 600); 
        }
    });

    // 2. Lắng nghe sự kiện Reset Game (Làm mới hoàn toàn)
    document.getElementById('btn-reset').addEventListener('click', () => {
        // Dọn dẹp State Machine (Reset board, metrics, gameId)
        state.reset();
        
        // Cập nhật hiển thị UI về trạng thái "Sạch"
        boardUI.render(state);
        ui.resetMetrics();
        ui.updateStatus(state.status, 'Ready to play');
        
        // [MỞ KHÓA GIAO DIỆN]: Trả lại quyền chọn thuật toán và độ sâu
        if (toggleContainer) toggleContainer.classList.remove('locked');
        depthSelect.disabled = false;
        
        // Reset trạng thái hiển thị của các nút Toggle Mode
        toggleBtns.forEach(btn => btn.classList.remove('active'));
        state.metrics.mode = null;

        // Đồng bộ lại giá trị Max Depth hiện tại trên UI vào State
        state.metrics.depth = parseInt(depthSelect.value);
    });

    // 3. Lắng nghe sự kiện thay đổi Algorithm Mode (Custom Toggles)
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // RÀNG BUỘC: Không cho phép đổi thuật toán khi bàn cờ đã có quân
            if (!state.isEmpty()) {
                console.warn("Không thể thay đổi thuật toán khi trận đấu đang diễn ra!");
                return;
            }

            // Cập nhật trạng thái Active cho nút được chọn
            toggleBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Lưu lựa chọn vào State
            state.metrics.mode = e.target.dataset.value;
            console.log("Đã chọn thuật toán:", state.metrics.mode);
        });
    });

    // 4. Lắng nghe sự kiện thay đổi Max Depth
    depthSelect.addEventListener('change', (e) => {
        // RÀNG BUỘC: Không cho phép đổi độ sâu khi trận đấu đang diễn ra
        if (!state.isEmpty()) {
            e.preventDefault();
            // Ép UI quay lại giá trị cũ đang lưu trong State để tránh sai lệch hiển thị
            depthSelect.value = state.metrics.depth; 
            return;
        }
        
        state.metrics.depth = parseInt(e.target.value);
        console.log("Đã chuyển độ sâu sang:", state.metrics.depth);
    });
});