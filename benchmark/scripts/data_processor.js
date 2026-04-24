const fs = require('fs');
const path = require('path');

// Thiết lập đường dẫn tĩnh
const RAW_FILE = path.join(__dirname, '..', 'raw', 'raw_metrics.jsonl');
const PROCESSED_DIR = path.join(__dirname, '..', 'processed');
const SUMMARY_FILE = path.join(PROCESSED_DIR, 'benchmark_summary.csv');

function processData() {
    // 1. Edge Case: Kiểm tra file raw có tồn tại không
    if (!fs.existsSync(RAW_FILE)) {
        console.error(`[FATAL] Không tìm thấy file raw data: ${RAW_FILE}. Hãy chạy runner.js trước.`);
        return;
    }

    console.log("=== BẮT ĐẦU XỬ LÝ DỮ LIỆU BENCHMARK ===");

    // 2. Đọc và phân tích file JSONL
    const lines = fs.readFileSync(RAW_FILE, 'utf-8').trim().split('\n');
    const data = [];
    
    for (let line of lines) {
        if (!line) continue; // Bỏ qua dòng trống
        try {
            data.push(JSON.parse(line));
        } catch (e) {
            console.error(`[WARN] Bỏ qua 1 dòng lỗi cú pháp JSON: ${line}`);
        }
    }

    // 3. Nhóm dữ liệu theo cặp (Cùng Case, Cùng Depth)
    const grouped = {};

    data.forEach(row => {
        const key = `${row.boardStateHash}_D${row.depthTarget}`;
        if (!grouped[key]) {
            grouped[key] = { 
                caseId: row.boardStateHash, 
                depth: row.depthTarget, 
                minimax: null, 
                alphabeta: null 
            };
        }
        if (row.useAlphaBeta) {
            grouped[key].alphabeta = row;
        } else {
            grouped[key].minimax = row;
        }
    });

    // 4. Khởi tạo header cho file CSV
    let csvContent = "Case_ID,Depth,MM_Time(ms),AB_Time(ms),Time_Saved(%),MM_Nodes,AB_Nodes,Node_Reduction(%),MM_Timeout,AB_Timeout\n";

    // 5. Xử lý tính toán và đổ vào CSV
    for (const key in grouped) {
        const group = grouped[key];
        const mm = group.minimax;
        const ab = group.alphabeta;

        const caseId = group.caseId;
        const depth = group.depth;
        
        // Edge Case: Xử lý Missing Data (Ví dụ Depth 5 của Minimax bị skip)
        const mmTime = mm ? mm.timeMs.toFixed(2) : "N/A";
        const abTime = ab ? ab.timeMs.toFixed(2) : "N/A";
        const mmNodes = mm ? mm.nodesEvaluated : "N/A";
        const abNodes = ab ? ab.nodesEvaluated : "N/A";
        const mmTimeout = mm ? mm.isTimeout : "N/A";
        const abTimeout = ab ? ab.isTimeout : "N/A";

        let timeSaved = "N/A";
        let nodeRed = "N/A";

        // Chỉ tính phần trăm nếu có đủ cả 2 dữ liệu đối chứng và Minimax không bị crash bằng 0 node
        if (mm && ab && mm.nodesEvaluated > 0) {
            nodeRed = (((mm.nodesEvaluated - ab.nodesEvaluated) / mm.nodesEvaluated) * 100).toFixed(2);
            
            // Xử lý chia cho 0 nếu thời gian bằng 0ms (quá nhanh)
            if (mm.timeMs > 0) {
                timeSaved = (((mm.timeMs - ab.timeMs) / mm.timeMs) * 100).toFixed(2);
            } else {
                timeSaved = "0.00"; 
            }
        }

        csvContent += `${caseId},${depth},${mmTime},${abTime},${timeSaved},${mmNodes},${abNodes},${nodeRed},${mmTimeout},${abTimeout}\n`;
    }

    // 6. Ghi file kết quả
    if (!fs.existsSync(PROCESSED_DIR)) {
        fs.mkdirSync(PROCESSED_DIR, { recursive: true });
    }

    try {
        fs.writeFileSync(SUMMARY_FILE, csvContent, 'utf-8');
        console.log(`[SUCCESS] Đã xử lý ${lines.length} lượt chạy raw.`);
        console.log(`[SUCCESS] Đã xuất báo cáo CSV thành công tại: ${SUMMARY_FILE}`);
        console.log("=== HOÀN THÀNH ===");
    } catch (err) {
        console.error(`[FATAL] Lỗi khi ghi file CSV:`, err);
    }
}

processData();