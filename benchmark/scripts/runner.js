const fs = require('fs');
const path = require('path');
const { logMetrics, ensureDirectories } = require('./benchmarkLogs');

// Cấu hình đường dẫn hệ thống
const CASES_FILE = path.join(__dirname, '..', 'cases', 'benchmark_cases.json');
const WASM_PATH = path.join(__dirname, '..', '..', 'dist', 'wasm', 'ai.js');

async function runBenchmark() {
    ensureDirectories();

    // 1. Kiểm tra tính toàn vẹn của tệp đầu vào
    if (!fs.existsSync(CASES_FILE)) {
        console.error(`[FATAL] Missing configuration file: ${CASES_FILE}`);
        return;
    }

    if (!fs.existsSync(WASM_PATH)) {
        console.error(`[FATAL] Missing Engine binary: ${WASM_PATH}`);
        return;
    }

    // 2. Khởi tạo Engine (WebAssembly)
    console.log("[SYSTEM] Initializing WebAssembly Engine...");
    const aiModuleFactory = require(WASM_PATH);
    let Module;
    try {
        Module = await aiModuleFactory();
        console.log("[SYSTEM] Engine loaded successfully.");
    } catch (error) {
        console.error("[FATAL] Failed to initialize Engine runtime:", error);
        return;
    }

    // 3. Nạp dữ liệu thực nghiệm
    const casesRaw = JSON.parse(fs.readFileSync(CASES_FILE, 'utf-8'));
    const casesList = casesRaw.cases || casesRaw; 

    const depthsToTest = [3, 4, 5];
    const timeoutMs = 2000; // Ngưỡng timeout tiêu chuẩn
    
    const envMetadata = {
        os: process.platform,
        nodeVersion: process.version,
        buildMode: "Release" 
    };

    console.log("\n===============================================");
    console.log("          AI ENGINE BENCHMARK SUITE            ");
    console.log("===============================================");
    console.log(`[INFO] Environment : ${JSON.stringify(envMetadata)}`);
    console.log(`[INFO] Target Cases: ${casesList.length}`);
    console.log("-----------------------------------------------\n");

    for (let testCase of casesList) {
        console.log(`>> Executing Suite: [${testCase.caseId}] - ${testCase.group}`);
        
        for (let depth of depthsToTest) {
            const configs = [false, true]; // [Minimax thuần, Alpha-Beta]
            
            for (let useAB of configs) {
                // Đánh giá rủi ro Timeout cho Depth 5
                if (depth === 5 && !useAB && testCase.expectedRisk === "timeout-prone") {
                    console.log(`   [SKIP] Configuration Minimax(D5) bypassed due to high timeout probability.`);
                    continue;
                }

                const sessionId = `BENCH_${Date.now()}`;
                const algorithmLabel = useAB ? "AlphaBeta" : "Minimax  ";
                const requestId = `${testCase.caseId}_D${depth}_${algorithmLabel.trim()}`;
                
                let pointer = null;

                try {
                    // Chuẩn bị vùng nhớ cho Mảng 1D
                    const flatBoard = Int32Array.from(testCase.boardState.flat());
                    const bytesPerElement = flatBoard.BYTES_PER_ELEMENT;
                    
                    pointer = Module._malloc(flatBoard.length * bytesPerElement);
                    if (!pointer) throw new Error("Heap allocation failed");

                    Module.HEAP32.set(flatBoard, pointer / bytesPerElement);

                    // Thực thi Core Engine
                    Module._get_best_move(pointer, testCase.playerTurn, depth, timeoutMs, useAB);

                    // Truy xuất Metrics
                    const row = Module._get_move_row();
                    const col = Module._get_move_col();
                    const score = Module._get_move_score();
                    const nodesEvaluated = Module._get_nodes();
                    const timeMs = Module._get_time_ms();
                    const depthReached = Module._get_depth_reached();
                    const isTimeout = !!Module._get_is_timeout();

                    // Dọn dẹp Heap
                    Module._free(pointer);
                    pointer = null;

                    // Đóng gói Dữ liệu
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
                        const status = isTimeout ? "WARN" : " OK ";
                        // Căn lề cho đẹp mắt trên console
                        console.log(`   [${status}] D${depth} | ${algorithmLabel} | Time: ${timeMs.toFixed(2).padStart(7)}ms | Nodes: ${String(nodesEvaluated).padStart(8)}`);
                    }
                } catch (error) {
                    console.error(`   [FAIL] Critical exception at ${requestId}:`, error.message);
                    if (pointer !== null) {
                        Module._free(pointer); 
                    }
                }
            }
        }
        console.log(""); // Dòng trống giữa các case
    }
    console.log("===============================================");
    console.log("             BENCHMARK COMPLETED               ");
    console.log("===============================================\n");
}

runBenchmark();

// node benchmark/scripts/runner.js
// node benchmark/scripts/data_processor.js