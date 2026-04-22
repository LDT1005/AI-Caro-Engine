/**
 * MOCK AI WORKER
 * Giả lập luồng xử lý của AI C++ trong tương lai
 * Vị trí: src/frontend-ui/workers/mock-ai-worker.js
 */

self.onmessage = function(e) {
    const { action, board, depth, mode, gameId, requestId } = e.data;

    // Chỉ thực hiện khi nhận đúng tín hiệu REQUEST_MOVE từ AI Adapter
    if (action === 'REQUEST_MOVE') {
        
        // 1. Giả lập thời gian tính toán (từ 300ms đến 700ms)
        const delay = Math.floor(Math.random() * 400) + 300;

        setTimeout(() => {
            // 2. Logic tìm nước đi giả: Tìm ô trống đầu tiên trong ma trận 15x15
            let move = null;
            
            for (let r = 0; r < 15; r++) {
                for (let c = 0; c < 15; c++) {
                    if (board[r][c] === 0) { // CONFIG.EMPTY
                        move = { row: r, col: c };
                        break;
                    }
                }
                if (move) break;
            }

            // 3. Tạo dữ liệu Metrics giả lập để hiển thị lên Dashboard
            const mockMetrics = {
                mode: mode,
                nodesEvaluated: Math.floor(Math.random() * 500000) + 100000,
                timeMs: delay,
                score: Math.floor(Math.random() * 2000) - 1000,
                depth: depth,
                timeout: false
            };

            // 4. Trả kết quả về Main Thread theo đúng giao thức AI_MOVE_RESULT
            self.postMessage({
                action: 'AI_MOVE_RESULT',
                move: move,
                metrics: mockMetrics,
                gameId: gameId,
                requestId: requestId
            });
            
        }, delay);
    }
};