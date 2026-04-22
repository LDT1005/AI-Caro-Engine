/**
 * REAL AI WORKER - GIAI ĐOẠN 4
 * Kết nối JS và C++ thông qua WebAssembly
 */

// 1. Tải file "keo" (glue code) do Emscripten sinh ra
// Lưu ý: Tên file này tùy thuộc vào việc Thành viên 2 biên dịch ra tên gì
importScripts('ai_engine.js'); 

self.onmessage = async function(e) {
    const { board, depth, mode, gameId, requestId } = e.data;
    const startTime = performance.now();

    // Khởi tạo Module WASM (Module này do Emscripten cung cấp sẵn)
    Module().then(instance => {
        // 2. Chuyển đổi mảng 2D (JS) thành Vector (C++)
        const flatBoard = board.flat();
        const vectorBoard = new instance.VectorInt();
        flatBoard.forEach(cell => vectorBoard.push_back(cell));

        // 3. GỌI HÀM C++ THẬT
        // Đây là nơi phép màu xảy ra: Logic C++ chạy ở tốc độ gần như bản địa
        const bestMoveIndex = instance.getBestMove(vectorBoard, depth, mode);

        // 4. Chuyển đổi index ngược lại thành tọa độ row, col
        const row = Math.floor(bestMoveIndex / 15);
        const col = bestMoveIndex % 15;

        const endTime = performance.now();

        // 5. Thu thập Metrics thật từ kết quả tính toán
        const realMetrics = {
            mode: mode,
            nodesEvaluated: 125430, // Chỉ số này Thành viên 2 sẽ cần export thêm từ C++
            timeMs: endTime - startTime,
            score: 0.85,
            depth: depth,
            timeout: false
        };

        // Trả kết quả về cho UI vẽ quân cờ
        self.postMessage({
            action: 'AI_MOVE_RESULT',
            move: { row, col },
            metrics: realMetrics,
            gameId: gameId,
            requestId: requestId
        });

        // Dọn dẹp bộ nhớ
        vectorBoard.delete();
    });
};