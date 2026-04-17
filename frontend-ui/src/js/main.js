import { CanvasBoard } from './canvas-board.js';
import { CONFIG } from './config.js';

// Điểm khởi chạy của Frontend
document.addEventListener('DOMContentLoaded', () => {
    // 1. Khởi tạo và vẽ bàn cờ tĩnh
    const board = new CanvasBoard('game-canvas');
    board.drawGrid();

    // --- DEMO TĨNH MẶC ĐỊNH (Phục vụ test UI Giai đoạn 1) ---
    // Hiển thị thử vài quân cờ trung tâm
    const center = Math.floor(CONFIG.BOARD_SIZE / 2);
    board.drawPiece(center, center, CONFIG.PLAYER_HUMAN); // Đen đi trước ở ô 7,7
    board.drawPiece(center, center + 1, CONFIG.PLAYER_AI); // Trắng đi kế bên

    // Giả lập hiển thị Spinner tĩnh để test layout
    document.getElementById('ai-spinner').style.display = 'block';
    document.getElementById('turn-status').innerText = 'AI is thinking...';
});