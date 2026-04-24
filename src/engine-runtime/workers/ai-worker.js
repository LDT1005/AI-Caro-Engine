importScripts(`/dist/wasm/ai.js?v=${Date.now()}`); 

let wasmInstance = null;

Module({
    locateFile: function(path, prefix) {
        if (path.endsWith('.wasm')) {
            return '/dist/wasm/ai.wasm';
        }
        return prefix + path;
    }
}).then(instance => {
    wasmInstance = instance;
    console.log("[Engine] WASM Loaded successfully from /dist/wasm/ai.wasm");
    self.postMessage({ action: 'AI_READY' }); 
}).catch(err => {
    console.error("[Engine] Critical Error loading WASM:", err);
});

self.onmessage = function(e) {
    const { action, board, depth, playerTurn, gameId, requestId, mode } = e.data;

    if (action === 'REQUEST_MOVE' && wasmInstance) {
        const useAlphaBeta = (mode === 'alpha-beta');
        const timeoutMs = 5000; 

        // RÀNG BUỘC 8: Bổ sung Logs theo dõi
        console.log(`\n[AI_WORKER] === BẮT ĐẦU REQUEST AI ===`);
        console.log(`[AI_WORKER] Depth=${depth}, PlayerTurn=${playerTurn}, Mode=${mode}`);

        const flatBoard = board.flat();
        const bytesPerInt = 4; 
        const boardPtr = wasmInstance._malloc(flatBoard.length * bytesPerInt);
        
        wasmInstance.HEAP32.set(new Int32Array(flatBoard), boardPtr / bytesPerInt);

        // LOG HEAP TRƯỚC (Snapshot hàng đầu tiên của bàn cờ trong C++)
        const heapBefore = wasmInstance.HEAP32.slice(boardPtr / bytesPerInt, (boardPtr / bytesPerInt) + 15);
        console.log(`[AI_WORKER] HEAP32 (Row 0) Trước đệ quy:`, heapBefore);

        wasmInstance._get_best_move(boardPtr, playerTurn, depth, timeoutMs, useAlphaBeta);

        let bestRow = wasmInstance._get_move_row();
        let bestCol = wasmInstance._get_move_col();
        
        const result = {
            move: {
                row: bestRow,
                col: bestCol
            },
            metrics: {
                nodesEvaluated: wasmInstance._get_nodes(),
                timeMs: wasmInstance._get_time_ms(),
                score: wasmInstance._get_move_score(),
                depth: wasmInstance._get_depth_reached(),
                timeout: wasmInstance._get_is_timeout()
            }
        };

        // LOG HEAP SAU (Kiểm tra xem C++ có xóa sạch rác đi thử không)
        const heapAfter = wasmInstance.HEAP32.slice(boardPtr / bytesPerInt, (boardPtr / bytesPerInt) + 15);
        console.log(`[AI_WORKER] HEAP32 (Row 0) Sau đệ quy:`, heapAfter);

        console.log(`[AI_WORKER] WASM Trả về nước đi: [${bestRow}, ${bestCol}]`);
        let valOnBoard = undefined;
        if(board[bestRow] !== undefined && board[bestRow][bestCol] !== undefined) valOnBoard = board[bestRow][bestCol];
        console.log(`[AI_WORKER] Giá trị tại ô này trên Board gốc JS: ${valOnBoard}`);

        // RÀNG BUỘC 3: JS FALLBACK (Cứu cánh cuối cùng để không block luồng)
        if (bestRow < 0 || bestRow >= 15 || bestCol < 0 || bestCol >= 15 || valOnBoard !== 0) {
            console.error(`[AI_WORKER_ERROR] Lỗi DEPTH_INVALID_MOVE_REUSE! AI đánh đè lên quân cũ hoặc ngoài biên.`);
            let fallbackFound = false;
            for(let r=0; r<15; r++){
                for(let c=0; c<15; c++){
                    if(board[r][c] === 0) {
                        bestRow = r;
                        bestCol = c;
                        fallbackFound = true;
                        console.warn(`[AI_WORKER_FALLBACK] Đã ép fallback về ô trống hợp lệ đầu tiên: [${r}, ${c}]`);
                        break;
                    }
                }
                if(fallbackFound) break;
            }
            result.move.row = bestRow;
            result.move.col = bestCol;
        }

        wasmInstance._free(boardPtr);

        self.postMessage({
            action: 'AI_MOVE_RESULT',
            ...result,
            gameId: gameId,
            requestId: requestId
        });
        console.log(`[AI_WORKER] === KẾT THÚC REQUEST ===\n`);
    }

    if (action === 'RESET_ENGINE') {
        console.log("[Engine] Resetting memory and clearing worker context...");
    }
};