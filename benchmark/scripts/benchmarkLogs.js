const fs = require('fs');
const path = require('path');

const BENCHMARK_ROOT = path.join(__dirname, '..');
const RAW_DIR = path.join(BENCHMARK_ROOT, 'raw');
const PROCESSED_DIR = path.join(BENCHMARK_ROOT, 'processed');

function ensureDirectories() {
    const dirs = [RAW_DIR, PROCESSED_DIR];
    for (let dir of dirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
}

const REQUIRED_FIELDS = [
    'sessionId', 
    'requestId', 
    'boardStateHash', 
    'bestMove',
    'depthTarget', 
    'depthReached', 
    'nodesEvaluated', 
    'timeMs', 
    'score',
    'isTimeout', 
    'useAlphaBeta'
];

function logMetrics(metrics) {
    ensureDirectories();

    for (let i = 0; i < REQUIRED_FIELDS.length; i++) {
        const field = REQUIRED_FIELDS[i];
        if (metrics[field] === undefined || metrics[field] === null) {
            console.error(`[ERROR] Bỏ qua log: Thiếu trường bắt buộc '${field}'.`);
            return false;
        }
    }

    if (metrics.timeMs < 0 || metrics.nodesEvaluated < 0) {
        console.error(`[ERROR] Dữ liệu dị thường: timeMs hoặc nodesEvaluated âm.`);
        return false;
    }

    if (metrics.depthReached > metrics.depthTarget) {
        console.error(`[ERROR] depthReached (${metrics.depthReached}) lớn hơn depthTarget (${metrics.depthTarget}).`);
        return false;
    }

    const rawFilePath = path.join(RAW_DIR, 'raw_metrics.jsonl');
    const logEntry = JSON.stringify(metrics) + '\n';

    try {
        fs.appendFileSync(rawFilePath, logEntry, 'utf8');
        return true;
    } catch (error) {
        console.error(`[ERROR] Lỗi khi ghi file log:`, error);
        return false;
    }
}

module.exports = {
    logMetrics,
    ensureDirectories
};