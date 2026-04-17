import { CONFIG } from './config.js';

export class CanvasBoard {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Cấu hình kích thước hiển thị cố định 600px để đồng bộ layout sidebar
        this.displaySize = 600;
        this.initCanvas();
    }

    initCanvas() {
        // Xử lý devicePixelRatio để chống mờ trên màn hình Retina/Projector
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = this.displaySize * dpr;
        this.canvas.height = this.displaySize * dpr;
        this.canvas.style.width = `${this.displaySize}px`;
        this.canvas.style.height = `${this.displaySize}px`;
        
        this.ctx.scale(dpr, dpr);
        this.cellSize = this.displaySize / CONFIG.BOARD_SIZE;
    }

    // Mapping tọa độ từ Pixel sang ma trận board[row][col] chuẩn xác
    getCellFromMouse(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        return { row, col };
    }

    // Xóa sạch canvas trước mỗi frame vẽ mới
    clear() {
        this.ctx.clearRect(0, 0, this.displaySize, this.displaySize);
    }

    // Vẽ lưới bàn cờ 15x15
    drawGrid() {
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#8b5a2b'; // Màu gỗ đậm cho đường kẻ
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= CONFIG.BOARD_SIZE; i++) {
            const pos = i * this.cellSize;
            // Vẽ đường ngang
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.displaySize, pos);
            // Vẽ đường dọc
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.displaySize);
        }
        this.ctx.stroke();
    }

    // Duyệt ma trận và vẽ toàn bộ quân cờ đang có
    drawPieces(board) {
        for (let r = 0; r < CONFIG.BOARD_SIZE; r++) {
            for (let c = 0; c < CONFIG.BOARD_SIZE; c++) {
                if (board[r][c] !== CONFIG.EMPTY) {
                    this.drawSinglePiece(r, c, board[r][c]);
                }
            }
        }
    }

    // Vẽ một quân cờ (X hoặc O) với hiệu ứng Typography và bóng đổ
    drawSinglePiece(row, col, player) {
        const x = col * this.cellSize + this.cellSize / 2;
        const y = row * this.cellSize + this.cellSize / 2;

        this.ctx.save();
        // Typography: Chữ Inter bold, kích thước chiếm 70% ô cờ
        this.ctx.font = `bold ${this.cellSize * 0.7}px "Inter", sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Cấu hình Shadow chung cho quân cờ
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';

        if (player === CONFIG.PLAYER_HUMAN) {
            this.ctx.fillStyle = '#0f172a'; // Màu đen xám mạnh mẽ (X)
            this.ctx.fillText('X', x, y);
        } else {
            this.ctx.fillStyle = '#f8fafc'; // Màu trắng sáng (O)
            this.ctx.fillText('O', x, y);
        }
        this.ctx.restore();
    }

    // Hiệu ứng Vi mô: Vòng tròn highlight đứt nét cho nước đi mới nhất
    drawHighlight(row, col, player) {
        const x = col * this.cellSize + this.cellSize / 2;
        const y = row * this.cellSize + this.cellSize / 2;
        const radius = this.cellSize * 0.4;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        // Màu sắc phản hồi: Xanh cho người, Đỏ cho AI
        this.ctx.strokeStyle = player === CONFIG.PLAYER_HUMAN ? '#3b82f6' : '#ef4444'; 
        this.ctx.lineWidth = 2;
        
        // Tạo đường đứt nét (Line Dash) tạo cảm giác tiêu điểm tập trung
        this.ctx.setLineDash([4, 4]); 
        
        // Thêm hiệu ứng phát sáng (Glow) cho highlight
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = this.ctx.strokeStyle;
        
        this.ctx.stroke();
        this.ctx.restore();
    }

    // Hàm tổng hợp để render toàn bộ bàn cờ từ GameState
    render(state) {
        this.clear();
        this.drawGrid();
        this.drawPieces(state.board);
        
        // Nếu có nước đi cuối cùng, thực hiện vẽ highlight đè lên trên
        if (state.lastMove) {
            this.drawHighlight(state.lastMove.row, state.lastMove.col, state.lastMove.player);
        }
    }
}