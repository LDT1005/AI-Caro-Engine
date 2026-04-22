/**
 * AI WORKER - Giai đoạn 4: Tích hợp Engine thật (WASM)
 * Vai trò: Quản lý vòng đời WebAssembly, xử lý tính toán nền không block UI.
 * Owner: Thành viên 2 (System Integration)
 */

// 1. Nạp Glue Code do Emscripten sinh ra
importScripts('/dist/wasm/ai.js'); 

let wasmInstance = null;

/**
 * BƯỚC 1: KHỞI TẠO MODULE (Sửa lỗi 404 và Magic Word)
 * Vì biên dịch với -s MODULARIZE=1, ta cần gọi hàm Factory Module()
 * và truyền cấu hình locateFile trực tiếp vào bên trong.
 */
Module({
    locateFile: function(path, prefix) {
        // Ép Engine tìm file .wasm tại đường dẫn tuyệt đối từ gốc Server
        if (path.endsWith('.wasm')) {
            return '/dist/wasm/ai.wasm';
        }
        return prefix + path;
    }
}).then(instance => {
    wasmInstance = instance;
    console.log("[Engine] WASM Loaded successfully from /dist/wasm/ai.wasm");
    
    // Thông báo cho UI (Thành viên 5) rằng Engine đã sẵn sàng
    self.postMessage({ action: 'AI_READY' }); 
}).catch(err => {
    console.error("[Engine] Critical Error loading WASM:", err);
});

/**
 * BƯỚC 2: XỬ LÝ TIN NHẮN TỪ MAIN THREAD
 */
self.onmessage = function(e) {
    const { action, board, depth, playerTurn, gameId, requestId, mode } = e.data;

    // Chỉ thực hiện khi có yêu cầu tính toán và WASM đã sẵn sàng nạp
    if (action === 'REQUEST_MOVE' && wasmInstance) {
        const useAlphaBeta = (mode === 'alpha-beta');
        const timeoutMs = 5000; // Ngưỡng timeout 5s cho thuật toán

        // --- BƯỚC A: QUẢN LÝ BỘ NHỚ WASM (MALLOC) ---
        // Làm phẳng ma trận 2D thành mảng 1D 225 phần tử (row-major)
        const flatBoard = board.flat();
        const bytesPerInt = 4; // int32_t trong C++ chiếm 4 bytes
        
        // Cấp phát vùng nhớ trên Heap của WASM cho bàn cờ
        const boardPtr = wasmInstance._malloc(flatBoard.length * bytesPerInt);
        
        // Copy dữ liệu từ mảng JS (TypedArray) vào vùng nhớ vừa cấp phát trên Heap
        wasmInstance.HEAP32.set(new Int32Array(flatBoard), boardPtr / bytesPerInt);

        // --- BƯỚC B: THỰC THI ENGINE C++ ---
        // Gọi hàm Bridge tìm nước đi tốt nhất
        wasmInstance._get_best_move(boardPtr, playerTurn, depth, timeoutMs, useAlphaBeta);

        // --- BƯỚC C: TRÍCH XUẤT KẾT QUẢ (GETTERS) ---
        // Đọc dữ liệu từ biến tĩnh static_move_result thông qua các hàm Getter
        const result = {
            move: {
                row: wasmInstance._get_move_row(),
                col: wasmInstance._get_move_col()
            },
            metrics: {
                nodesEvaluated: wasmInstance._get_nodes(),
                timeMs: wasmInstance._get_time_ms(),
                score: wasmInstance._get_move_score(),
                depth: wasmInstance._get_depth_reached(),
                timeout: wasmInstance._get_is_timeout()
            }
        };

        // --- BƯỚC D: GIẢI PHÓNG BỘ NHỚ (FREE) ---
        // Quan trọng: Giải phóng vùng nhớ bàn cờ để tránh rò rỉ bộ nhớ trình duyệt
        wasmInstance._free(boardPtr);

        // --- BƯỚC E: PHẢN HỒI KẾT QUẢ CHO UI ---
        // Trả kết quả kèm định danh phiên chơi (gameId/requestId) để UI đối soát
        self.postMessage({
            action: 'AI_MOVE_RESULT',
            ...result,
            gameId: gameId,
            requestId: requestId
        });
    }

    /**
     * XỬ LÝ TÍN HIỆU RESET ENGINE
     */
    if (action === 'RESET_ENGINE') {
        console.log("[Engine] Resetting memory and clearing worker context...");
    }
};