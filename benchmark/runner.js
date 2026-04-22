const fs = require('fs');
const path = require('path');
const LoggerAdapter = require('./benchmarkLogs.js');
const benchmarkConfig = require('./benchmark_cases.json');

// Đường dẫn tới WASM do TV2 build (dùng chung cho cả Web và Node)
const aiModulePath = path.join(__dirname, '../dist/wasm/ai.js');

if (!fs.existsSync(aiModulePath)) {
    console.error("Lỗi: Không tìm thấy dist/wasm/ai.js. Yêu cầu TV2 build Emscripten trước.");
    process.exit(1);
}

// Import module WASM
const Module = require(aiModulePath);

Module.onRuntimeInitialized = () => {
    console.log("🚀 Tải thành công WASM AI Core. Bắt đầu chạy Pipeline Benchmark Headless...\n");
    const logger = new LoggerAdapter("benchmark_auto");
    
    // Cấp phát vùng nhớ cho bảng cờ 15x15 (225 ô * 4 bytes/int = 900 bytes)
    const boardPtr = Module._malloc(15 * 15 * 4);

    for (const testCase of benchmarkConfig.cases) {
        console.log(`\n===========================================`);
        console.log(`Đang chạy Case: [${testCase.caseId}] - ${testCase.group}`);
        console.log(`Ghi chú: ${testCase.notes}`);
        
        // Trải phẳng mảng 2D thành mảng 1D
        const flatBoard = new Int32Array(225);
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                flatBoard[r * 15 + c] = testCase.boardState[r][c];
            }
        }

        // Chạy qua các mốc độ sâu
        for (const depth of testCase.recommendedDepths) {
            // Chạy paired-test (có AlphaBeta và không có AlphaBeta)
            for (const useAlphaBeta of [false, true]) {
                const algoName = useAlphaBeta ? "Alpha-Beta" : "Minimax   ";
                
                // Ghi mảng 1D vào bộ nhớ WASM
                for (let i = 0; i < 225; i++) {
                    Module.setValue(boardPtr + (i * 4), flatBoard[i], 'i32');
                }

                // Gọi hàm C++: AIMove* get_best_move(int* flat_board, int player_turn, int max_depth, int timeout_ms, bool use_alpha_beta)
                Module._get_best_move(boardPtr, testCase.playerTurn, depth, 2000, useAlphaBeta);

                // Lấy kết quả trả về thông qua các hàm Getter KEEPALIVE từ ai_core.cpp
                const row = Module['_get_move_row']();
                const col = Module['_get_move_col']();
                const score = Module['_get_move_score']();
                const nodes = Module['_get_nodes']();
                const timeMs = Module['_get_time_ms']();
                const isTimeout = Module['_get_is_timeout']() === 1;
                const depthReached = Module['_get_depth_reached']();

                console.log(`[D:${depth}] ${algoName} -> Nước đi: [${row},${col}] | Thời gian: ${timeMs.toFixed(2)}ms | Nodes: ${nodes} ${isTimeout ? '(TIMEOUT)' : ''}`);

                // Ghi vào file JSONL
                logger.logRun({
                    row, 
                    col, 
                    score, 
                    nodes_evaluated: nodes, 
                    time_ms: timeMs, 
                    is_timeout: isTimeout, 
                    depth_reached: depthReached
                }, {
                    test_id: testCase.caseId,
                    depth_target: depth,
                    use_alpha_beta: useAlphaBeta,
                    run_index: 1
                });
            }
        }
    }

    // Giải phóng bộ nhớ
    Module._free(boardPtr);
    console.log("\n✅ Hoàn tất Pipeline! Dữ liệu đã được lưu vào thư mục benchmark/raw/");
};