import { CONFIG } from './config.js';

export class CanvasBoard {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Tính toán kích thước chuẩn
        this.displaySize = CONFIG.BOARD_SIZE * CONFIG.CELL_SIZE;
        this.dpr = window.devicePixelRatio || 1;
        
        this.initCanvas();
    }

    initCanvas() {
        // Fix mờ trên Retina/Projector
        this.canvas.width = this.displaySize * this.dpr;
        this.canvas.height = this.displaySize * this.dpr;
        this.canvas.style.width = `${this.displaySize}px`;
        this.canvas.style.height = `${this.displaySize}px`;
        this.ctx.scale(this.dpr, this.dpr);
    }

    // Mapping tọa độ tuyệt đối chuẩn xác
    getCellFromMouse(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const col = Math.floor(x / CONFIG.CELL_SIZE);
        const row = Math.floor(y / CONFIG.CELL_SIZE);

        return { row, col };
    }

    drawGrid() {
        // Xóa sạch canvas trước khi vẽ
        this.ctx.clearRect(0, 0, this.displaySize, this.displaySize);

        this.ctx.strokeStyle = CONFIG.LINE_COLOR;
        this.ctx.lineWidth = 1;

        // Vẽ 15 đường ngang và 15 đường dọc
        for (let i = 0; i < CONFIG.BOARD_SIZE; i++) {
            const pos = i * CONFIG.CELL_SIZE + (CONFIG.CELL_SIZE / 2);
            
            // Đường dọc
            this.ctx.beginPath();
            this.ctx.moveTo(pos, CONFIG.CELL_SIZE / 2);
            this.ctx.lineTo(pos, this.displaySize - CONFIG.CELL_SIZE / 2);
            this.ctx.stroke();

            // Đường ngang
            this.ctx.beginPath();
            this.ctx.moveTo(CONFIG.CELL_SIZE / 2, pos);
            this.ctx.lineTo(this.displaySize - CONFIG.CELL_SIZE / 2, pos);
            this.ctx.stroke();
        }
    }

    drawPiece(row, col, player) {
        const x = col * CONFIG.CELL_SIZE + (CONFIG.CELL_SIZE / 2);
        const y = row * CONFIG.CELL_SIZE + (CONFIG.CELL_SIZE / 2);

        // Cấu hình Typography cho X và O
        const fontSize = CONFIG.CELL_SIZE * 0.7; // Chữ chiếm 70% kích thước ô
        this.ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        let text = '';
        
        if (player === CONFIG.PLAYER_HUMAN) {
            text = 'X';
            this.ctx.fillStyle = '#111111'; // Màu đen xám mạnh mẽ cho X
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        } else if (player === CONFIG.PLAYER_AI) {
            text = 'O';
            this.ctx.fillStyle = '#f8fafc'; // Màu trắng sáng cho O
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        }

        // Thiết lập bóng đổ (Drop shadow) để text nổi bật lên nền bàn cờ
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        // Vẽ Text X hoặc O
        this.ctx.fillText(text, x, y);

        // Reset shadow để không ảnh hưởng các hàm vẽ sau
        this.ctx.shadowColor = 'transparent';
    }

    // Hiệu ứng Vi mô: Đánh dấu nước cờ mới nhất
    drawHighlight(row, col, player) {
        const x = col * CONFIG.CELL_SIZE + (CONFIG.CELL_SIZE / 2);
        const y = row * CONFIG.CELL_SIZE + (CONFIG.CELL_SIZE / 2);
        const radius = CONFIG.CELL_SIZE * 0.45; 

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        // Nhấn màu xanh cho User (X), màu cam đỏ cho AI (O)
        this.ctx.strokeStyle = player === CONFIG.PLAYER_HUMAN ? 'rgba(59, 130, 246, 0.8)' : 'rgba(239, 68, 68, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = this.ctx.strokeStyle;
        this.ctx.stroke();
        this.ctx.shadowColor = 'transparent'; 
    }

    // Render lại toàn bộ frame 
    render(gameState) {
        this.drawGrid();
        for (let r = 0; r < CONFIG.BOARD_SIZE; r++) {
            for (let c = 0; c < CONFIG.BOARD_SIZE; c++) {
                if (gameState.board[r][c] !== CONFIG.EMPTY) {
                    this.drawPiece(r, c, gameState.board[r][c]);
                }
            }
        }
        if (gameState.lastMove) {
            this.drawHighlight(gameState.lastMove.row, gameState.lastMove.col, gameState.lastMove.player);
        }
    }
}