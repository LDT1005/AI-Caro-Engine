export class UIController {
    constructor() {
        this.statusText = document.getElementById('turn-status');
        this.spinner = document.getElementById('ai-spinner');
        
        // Mapping các DOM elements của Metrics
        this.metricMode = document.getElementById('metric-mode'); // Mới thêm
        this.metricNodes = document.getElementById('metric-nodes');
        this.metricTime = document.getElementById('metric-time');
        this.metricScore = document.getElementById('metric-score');
        this.metricDepth = document.getElementById('metric-depth');
        this.metricTimeout = document.getElementById('metric-timeout');
    }

    updateStatus(status, message) {
        this.statusText.innerText = message;
        // Bật/tắt loading spinner theo đúng Requirement
        if (status === 'AI_THINKING') {
            this.spinner.style.display = 'block';
            this.statusText.style.color = 'var(--text-secondary)';
        } else {
            this.spinner.style.display = 'none';
            this.statusText.style.color = 'var(--accent-color)';
        }
    }

    // Hàm này sẽ được gọi liên tục từ Web Worker ở Giai đoạn 3
    updateMetrics(metrics) {
        // Render Mode (Minimax hoặc Alpha-Beta)
        if (!metrics.mode) {
            this.metricMode.innerText = "None";
        } else {
            this.metricMode.innerText = metrics.mode === 'minimax' ? "Minimax" : "Alpha-Beta";
        }

        // Render các chỉ số khác với định dạng số (có dấu phẩy phần ngàn)
        this.metricNodes.innerText = metrics.nodesEvaluated.toLocaleString();
        this.metricTime.innerText = metrics.timeMs.toFixed(0);
        this.metricScore.innerText = metrics.score.toLocaleString();
        this.metricDepth.innerText = metrics.depth;

        // Render trạng thái Timeout và đổi màu (CSS Class)
        this.metricTimeout.innerText = metrics.timeout ? 'True' : 'False';
        this.metricTimeout.className = `metric-value ${metrics.timeout}`;
    }

    resetMetrics() {
        this.updateMetrics({
            mode: null,
            nodesEvaluated: 0,
            timeMs: 0,
            score: 0,
            depth: 0,
            timeout: false
        });
    }
}