export class UIController {
    constructor() {
        this.statusText = document.getElementById('turn-status');
        this.spinner = document.getElementById('ai-spinner');
        this.metricNodes = document.getElementById('metric-nodes');
        this.metricTime = document.getElementById('metric-time');
        this.metricScore = document.getElementById('metric-score');
        this.metricDepth = document.getElementById('metric-depth');
        this.metricTimeout = document.getElementById('metric-timeout');
    }

    updateStatus(status, message) {
        this.statusText.innerText = message;
        // Bật/tắt loading spinner
        if (status === 'AI_THINKING') {
            this.spinner.style.display = 'block';
            this.statusText.style.color = 'var(--text-secondary)';
        } else {
            this.spinner.style.display = 'none';
            this.statusText.style.color = 'var(--accent-color)';
        }
    }

    updateMetrics(metrics) {
        this.metricNodes.innerText = metrics.nodesEvaluated.toLocaleString();
        this.metricTime.innerText = metrics.timeMs.toFixed(0);
        this.metricScore.innerText = metrics.score.toLocaleString();
        this.metricDepth.innerText = metrics.depth;

        this.metricTimeout.innerText = metrics.timeout ? 'True' : 'False';
        this.metricTimeout.className = `metric-value ${metrics.timeout}`;
    }

    resetMetrics() {
        this.updateMetrics({
            nodesEvaluated: 0,
            timeMs: 0,
            score: 0,
            depth: 0,
            timeout: false
        });
    }
}