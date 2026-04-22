// src/frontend-ui/js/canvas-board.js
import { CONFIG } from './config.js';

export class CanvasBoard {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Cấu hình kích thước hiển thị cố định 600px để đồng bộ layout sidebar
        this.displaySize = 600;
        this.padding = 30; // Khoảng trống để vẽ tọa độ viền (A-O, 1-15)
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
        
        // Tính toán kích thước ô cờ dựa trên vùng vẽ thực tế (đã trừ padding 2 bên)
        this.cellSize = (this.displaySize - (this.padding * 2)) / CONFIG.BOARD_SIZE;
    }

    /**
     * Mapping tọa độ từ Pixel sang ma trận board[row][col] chuẩn xác
     * Logic: Trừ đi offset của thẻ canvas và vùng padding trước khi tính toán ô
     */
    getCellFromMouse(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left - this.padding;
        const y = event.clientY - rect.top - this.padding;
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        // Chỉ trả về tọa độ nếu click nằm trong phạm vi bàn cờ (không tính vùng tọa độ viền)
        if (row >= 0 && row < CONFIG.BOARD_SIZE && col >= 0 && col < CONFIG.BOARD_SIZE) {
            return { row, col };
        }
        return null;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.displaySize, this.displaySize);
    }

    /**
     * Vẽ hệ thống tọa độ A-O và 1-15 quanh viền bàn cờ phục vụ Demo
     */
    drawCoordinates() {
        this.ctx.fillStyle = '#5c3a21'; // Màu gỗ đậm cho chữ
        this.ctx.font = 'bold 12px "Roboto Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let i = 0; i < CONFIG.BOARD_SIZE; i++) {
            const letter = String.fromCharCode(65 + i); // Cột: A, B, C...
            const labelPos = this.padding + i * this.cellSize + (this.cellSize / 2);
            
            // Vẽ nhãn cột (Cạnh trên & Cạnh dưới)
            this.ctx.fillText(letter, labelPos, this.padding / 2);
            this.ctx.fillText(letter, labelPos, this.displaySize - (this.padding / 2));
            
            // Vẽ nhãn hàng (Cạnh trái & Cạnh phải)
            this.ctx.fillText((i + 1).toString(), this.padding / 2, labelPos);
            this.ctx.fillText((i + 1).toString(), this.displaySize - (this.padding / 2), labelPos);
        }
    }

    /**
     * Vẽ lưới bàn cờ 15x15 bên trong vùng giới hạn bởi padding
     */
    drawGrid() {
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#8b5a2b'; // Màu gỗ đậm cho đường kẻ
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= CONFIG.BOARD_SIZE; i++) {
            const pos = this.padding + (i * this.cellSize);
            
            // Vẽ đường ngang (giới hạn trong vùng padding)
            this.ctx.moveTo(this.padding, pos);
            this.ctx.lineTo(this.displaySize - this.padding, pos);
            
            // Vẽ đường dọc (giới hạn trong vùng padding)
            this.ctx.moveTo(pos, this.padding);
            this.ctx.lineTo(pos, this.displaySize - this.padding);
        }
        this.ctx.stroke();
    }

    drawPieces(board) {
        for (let r = 0; r < CONFIG.BOARD_SIZE; r++) {
            for (let c = 0; c < CONFIG.BOARD_SIZE; c++) {
                if (board[r][c] !== CONFIG.EMPTY) {
                    this.drawSinglePiece(r, c, board[r][c]);
                }
            }
        }
    }

    /**
     * Vẽ một quân cờ (X hoặc O) với hiệu ứng Typography và bóng đổ chuyên nghiệp
     */
    drawSinglePiece(row, col, player) {
        const x = this.padding + col * this.cellSize + this.cellSize / 2;
        const y = this.padding + row * this.cellSize + this.cellSize / 2;

        this.ctx.save();
        // Typography: Chữ Inter bold, kích thước chiếm 70% ô cờ
        this.ctx.font = `bold ${this.cellSize * 0.7}px "Inter", sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Hiệu ứng Shadow giúp quân cờ nổi bật, có chiều sâu trên nền gỗ
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';

        if (player === CONFIG.PLAYER_HUMAN) {
            this.ctx.fillStyle = '#0f172a'; // Màu đen xám mạnh mẽ (X)
            this.ctx.fillText('X', x, y);
        } else if (player === CONFIG.PLAYER_AI) {
            this.ctx.fillStyle = '#f8fafc'; // Màu trắng sáng (O)
            this.ctx.fillText('O', x, y);
        }
        this.ctx.restore();
    }

    /**
     * Hiệu ứng Vi mô: Vòng tròn highlight đứt nét cho nước đi mới nhất
     */
    drawHighlight(row, col, player) {
        const x = this.padding + col * this.cellSize + this.cellSize / 2;
        const y = this.padding + row * this.cellSize + this.cellSize / 2;
        const radius = this.cellSize * 0.4;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        // Màu sắc phản hồi: Xanh dương cho người, Đỏ cho AI
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

    /**
     * Giai đoạn 4: Vẽ bàn cờ trực tiếp từ Snapshot của Engine
     * Đảm bảo tính trung thực tuyệt đối giữa UI và Lõi C++ của TV2
     */
    renderFromSnapshot(boardMatrix, lastMove = null) {
        this.clear();
        
        // 1. Vẽ nền gỗ cho vùng biên (padding)
        this.ctx.fillStyle = '#d1ad70';
        this.ctx.fillRect(0, 0, this.displaySize, this.displaySize);
        
        // 2. Vẽ nền chính cho vùng chơi (Board Background)
        this.ctx.fillStyle = '#e2c18d';
        this.ctx.fillRect(
            this.padding, 
            this.padding, 
            this.displaySize - (this.padding * 2), 
            this.displaySize - (this.padding * 2)
        );

        // 3. Vẽ các lớp hỗ trợ quan sát
        this.drawCoordinates();
        this.drawGrid();

        // 4. Duyệt và vẽ các quân cờ từ Snapshot
        for (let r = 0; r < CONFIG.BOARD_SIZE; r++) {
            for (let c = 0; c < CONFIG.BOARD_SIZE; c++) {
                if (boardMatrix[r][c] !== CONFIG.EMPTY) {
                    this.drawSinglePiece(r, c, boardMatrix[r][c]);
                }
            }
        }

        // 5. Highlight nước đi cuối cùng nếu có dữ liệu từ Engine
        if (lastMove) {
            this.drawHighlight(lastMove.row, lastMove.col, lastMove.player);
        }
    }

    /**
     * Hàm render tiêu chuẩn gọi từ luồng chính (Main Thread)
     */
    render(state) {
        this.renderFromSnapshot(state.board, state.lastMove);
    }
}