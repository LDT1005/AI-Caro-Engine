const fs = require('fs');
const path = require('path');
const { logMetrics, ensureDirectories } = require('./benchmarkLogs');

// Đường dẫn tương đối dựa trên cấu trúc thư mục dự án
const CASES_FILE = path.join(__dirname, '..', 'cases', 'benchmark_cases.json');
const WASM_PATH = path.join(__dirname, '..', '..', 'dist', 'wasm', 'ai.js');

async function runBenchmark() {
    ensureDirectories();

    // 1. Kiểm tra file đầu vào
    if (!fs.existsSync(CASES_FILE)) {
        console.error(`[FATAL] Không tìm thấy file cases: ${CASES_FILE}`);
        return;
    }

    if (!fs.existsSync(WASM_PATH)) {
        console.error(`[FATAL] Không tìm thấy file WASM: ${WASM_PATH}`);
        return;
    }

    // 2. Nạp module WebAssembly
    console.log("[INFO] Đang nạp module WebAssembly từ TV2...");
    const aiModuleFactory = require(WASM_PATH);
    let Module;
    try {
        Module = await aiModuleFactory();
        console.log("[OK] WASM Module đã được nạp thành công.");
    } catch (error) {
        console.error("[FATAL] Lỗi khởi tạo WASM Module:", error);
        return;
    }

    // 3. Đọc dữ liệu benchmark cases
    const casesRaw = JSON.parse(fs.readFileSync(CASES_FILE, 'utf-8'));
    const casesList = casesRaw.cases || casesRaw; // Xử lý cấu trúc object có chứa mảng

    const depthsToTest = [3, 4, 5];
    const timeoutMs = 2000; // Cố định 2000ms theo dự án
    
    const envMetadata = {
        os: process.platform,
        nodeVersion: process.version,
        buildMode: "Release" // WASM build nên luôn là Release
    };

    console.log("=== BẮT ĐẦU CHẠY BENCHMARK HEADLESS (WASM THẬT) ===");
    console.log(`Môi trường: ${JSON.stringify(envMetadata)}\n`);

    for (let testCase of casesList) {
        console.log(`\n>> Đang chạy Case: ${testCase.caseId} [${testCase.group}]`);
        
        for (let depth of depthsToTest) {
            const configs = [false, true]; // [Minimax thuần, Alpha-Beta]
            
            for (let useAB of configs) {
                // Xử lý logic cắt rủi ro cho Depth 5 Minimax thuần
                if (depth === 5 && !useAB && testCase.expectedRisk === "timeout-prone") {
                    console.log(`[SKIP] Bỏ qua Minimax thuần tại Depth 5 cho case ${testCase.caseId} vì rủi ro timeout cao.`);
                    continue;
                }

                const sessionId = `BENCH_${Date.now()}`;
                const requestId = `${testCase.caseId}_D${depth}_AB${useAB ? 1 : 0}`;
                
                let pointer = null;

                try {
                    // Trải phẳng mảng 2D thành 1D (225 phần tử)
                    const flatBoard = Int32Array.from(testCase.boardState.flat());
                    const bytesPerElement = flatBoard.BYTES_PER_ELEMENT; // 4 bytes
                    
                    // Cấp phát bộ nhớ trên WASM Heap
                    pointer = Module._malloc(flatBoard.length * bytesPerElement);
                    if (!pointer) throw new Error("WASM Out of Memory");

                    // Ghi dữ liệu bàn cờ vào WASM Heap
                    Module.HEAP32.set(flatBoard, pointer / bytesPerElement);

                    // Gọi Engine lõi (Hàm chạy đồng bộ trên WASM)
                    Module._get_best_move(pointer, testCase.playerTurn, depth, timeoutMs, useAB);

                    // Đọc kết quả qua các Getter của C++ (tránh lỗi struct alignment)
                    const row = Module._get_move_row();
                    const col = Module._get_move_col();
                    const score = Module._get_move_score();
                    const nodesEvaluated = Module._get_nodes();
                    const timeMs = Module._get_time_ms();
                    const depthReached = Module._get_depth_reached();
                    const isTimeout = !!Module._get_is_timeout(); // Ép kiểu bool

                    // Dọn dẹp bộ nhớ ngay lập tức
                    Module._free(pointer);
                    pointer = null;

                    // Đóng gói contract
                    const metricsData = {
                        sessionId: sessionId,
                        requestId: requestId,
                        boardStateHash: testCase.caseId,
                        bestMove: `${row},${col}`,
                        depthTarget: depth,
                        depthReached: depthReached,
                        nodesEvaluated: nodesEvaluated,
                        timeMs: timeMs,
                        score: score,
                        isTimeout: isTimeout,
                        useAlphaBeta: useAB,
                        envId: envMetadata.os,
                        buildMode: envMetadata.buildMode
                    };

                    const logged = logMetrics(metricsData);
                    if (logged) {
                        console.log(`[OK] ${requestId} | Time: ${timeMs.toFixed(2)}ms | Nodes: ${nodesEvaluated} | Timeout: ${isTimeout}`);
                    }
                } catch (error) {
                    console.error(`[ERROR] Crash tại ${requestId}:`, error);
                    if (pointer !== null) {
                        Module._free(pointer); // Tránh rò rỉ nếu crash giữa chừng
                    }
                }
            }
        }
    }
    console.log("\n=== HOÀN THÀNH BENCHMARK ===");
}

runBenchmark();