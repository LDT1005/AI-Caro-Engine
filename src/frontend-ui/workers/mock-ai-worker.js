/**
 * MOCK AI WORKER
 * Giả lập luồng xử lý của AI C++ trong tương lai
 */

self.onmessage = function(e) {
    const { board, depth, mode, gameId, requestId } = e.data;

    // 1. Giả lập thời gian tính toán (300ms - 700ms)
    const delay = Math.floor(Math.random() * 400) + 300;

    setTimeout(() => {
        // 2. Logic tìm nước đi giả: Tìm ô trống đầu tiên từ giữa bàn cờ ra ngoài
        let move = null;
        const center = 7;
        
        // Tìm kiếm xoắn ốc hoặc đơn giản là tìm ô trống đầu tiên
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                if (board[r][c] === 0) {
                    move = { row: r, col: c };
                    break;
                }
            }
            if (move) break;
        }

        // 3. Tạo dữ liệu Metrics giả lập để "nuôi" Dashboard
        const mockMetrics = {
            mode: mode,
            nodesEvaluated: Math.floor(Math.random() * 500000) + 100000,
            timeMs: delay,
            score: Math.floor(Math.random() * 2000) - 1000,
            depth: depth,
            timeout: false
        };

        // 4. Trả kết quả về Main Thread
        self.postMessage({
            action: 'AI_MOVE_RESULT',
            move: move,
            metrics: mockMetrics,
            gameId: gameId,
            requestId: requestId
        });
    }, delay);
};