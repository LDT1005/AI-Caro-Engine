// src/frontend-ui/js/ai-adapter.js
import { GameStatus } from './ui-state.js';

/**
 * AIProviderWrapper: Lớp trung gian điều phối Worker
 * Giúp UI cô lập logic giao tiếp, dễ dàng chuyển đổi giữa Mock và Engine thật.
 */
export class AIProviderWrapper {
    constructor(useMock = false) { // Mặc định false để sử dụng Engine thật cho GĐ 4
        this.useMock = useMock;
        this.worker = null;
        this.initWorker();
    }

    /**
     * Khởi tạo Worker dựa trên chế độ đang chạy
     */
    initWorker() {
        // Tách biệt ranh giới: Mock do TV5 quản lý, Thật do TV2 quản lý
        const workerPath = this.useMock 
            ? './workers/mock-ai-worker.js' 
            : '../engine-runtime/workers/ai-worker.js';
            
        this.worker = new Worker(workerPath);
    }

    /**
     * Giao thức API Giai đoạn 4: Đồng bộ cấu hình Engine (Depth, Mode) trước khi tính toán
     */
    updateEngineConfig(config) {
        this.worker.postMessage({
            action: 'SET_CONFIG',
            depth: config.depth,
            mode: config.mode,
            useAlphaBeta: config.mode === 'alpha-beta'
        });
    }

    /**
     * Giao thức chuẩn hóa để Main Thread yêu cầu AI tìm nước đi tốt nhất
     * Kết hợp tính cụ thể của GĐ 4 và tính linh hoạt của bản cũ
     */
    requestBestMove(payload) {
        this.worker.postMessage({
            action: 'REQUEST_MOVE',
            board: payload.board,
            playerTurn: payload.playerTurn || 2, // Mặc định AI là 2 (O) theo chuẩn Giai đoạn 4
            depth: payload.depth,
            mode: payload.mode,
            gameId: payload.gameId,
            requestId: payload.requestId
        });
    }

    /**
     * Đăng ký callback nhận phản hồi từ Worker
     */
    onResponse(callback) {
        this.worker.onmessage = callback;
    }

    /**
     * Đăng ký callback xử lý lỗi hệ thống (WASM/Worker sập)
     */
    onError(callback) {
        this.worker.onerror = callback;
    }

    /**
     * Gửi tín hiệu Reset cho Engine
     * TV5 không tự ý terminate worker thật của TV2 để bảo toàn tài nguyên WASM, 
     * chỉ gửi lệnh Reset để Engine dọn dẹp Heap.
     */
    resetEngine() {
        this.worker.postMessage({ action: 'RESET_ENGINE' });
    }
}