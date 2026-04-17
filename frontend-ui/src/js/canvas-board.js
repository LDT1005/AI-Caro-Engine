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
        const radius = CONFIG.CELL_SIZE * 0.38; // Chiếm 76% ô cờ

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);

        if (player === CONFIG.PLAYER_HUMAN) {
            // Quân Đen
            this.ctx.fillStyle = '#111111';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        } else if (player === CONFIG.PLAYER_AI) {
            // Quân Trắng
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        }

        // Thiết lập bóng đổ (Drop shadow)
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.fill();

        // Reset shadow để không ảnh hưởng các hàm vẽ sau
        this.ctx.shadowColor = 'transparent';
    }
}