const fs = require('fs');
const path = require('path');

class LoggerAdapter {
    constructor(sessionName = "headless_benchmark") {
        this.sessionId = `${sessionName}_${Date.now()}`;
        this.rawDir = path.join(__dirname, 'raw');
        this.rawLogPath = path.join(this.rawDir, `${this.sessionId}.jsonl`);
        
        // Đảm bảo thư mục raw tồn tại
        if (!fs.existsSync(this.rawDir)) {
            fs.mkdirSync(this.rawDir, { recursive: true });
        }
    }

    logRun(aiResult, context) {
        if (!aiResult || !context) {
            console.error("[Logger] Lỗi: Thiếu payload dữ liệu.");
            return;
        }

        const logEntry = {
            session_id: this.sessionId,
            run_index: context.run_index || 1,
            test_id: context.test_id || "UNKNOWN",
            use_alpha_beta: context.use_alpha_beta,
            depth_target: context.depth_target,
            depth_reached: aiResult.depth_reached || 0,
            nodes_evaluated: Math.max(0, aiResult.nodes_evaluated || 0),
            time_ms: Math.max(0, aiResult.time_ms || 0),
            score: aiResult.score || 0,
            is_timeout: aiResult.is_timeout || false,
            move_row: aiResult.row ?? -1,
            move_col: aiResult.col ?? -1,
            timestamp: new Date().toISOString()
        };

        try {
            fs.appendFileSync(this.rawLogPath, JSON.stringify(logEntry) + '\n', 'utf8');
        } catch (error) {
            console.error(`[Logger] Lỗi ghi file log: ${error.message}`);
        }
    }
}

module.exports = LoggerAdapter;