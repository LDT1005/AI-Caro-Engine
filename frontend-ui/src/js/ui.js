export class UIController {
    constructor() {
        // Ánh xạ các phần tử điều khiển trạng thái (Status & Spinner)
        this.statusText = document.getElementById('turn-status');
        this.spinner = document.getElementById('ai-spinner');
        
        // Ánh xạ các phần tử hiển thị chỉ số (Dashboard Metrics)
        this.metricMode = document.getElementById('metric-mode');
        this.metricNodes = document.getElementById('metric-nodes');
        this.metricTime = document.getElementById('metric-time');
        this.metricScore = document.getElementById('metric-score');
        this.metricDepth = document.getElementById('metric-depth');
        this.metricTimeout = document.getElementById('metric-timeout');
    }

    /**
     * Cập nhật thông báo trạng thái và điều khiển Spinner
     * @param {string} status - Trạng thái từ GameStatus
     * @param {string} message - Nội dung thông báo hiển thị
     */
    updateStatus(status, message) {
        this.statusText.innerText = message;
        
        if (status === 'AI_THINKING') {
            // Trạng thái AI đang tính toán: Hiện spinner, làm mờ text
            this.spinner.style.display = 'block';
            this.statusText.style.color = 'var(--text-secondary)';
            this.statusText.style.fontWeight = '500';
        } else if (status === 'GAME_OVER') {
            // Trạng thái kết thúc: Ẩn spinner, đổi sang màu đỏ nổi bật
            this.spinner.style.display = 'none';
            this.statusText.style.color = '#ef4444'; // Màu đỏ cảnh báo
            this.statusText.style.fontWeight = 'bold';
        } else {
            // Trạng thái bình thường/Lượt người chơi: Ẩn spinner, dùng màu accent
            this.spinner.style.display = 'none';
            this.statusText.style.color = 'var(--accent-color)';
            this.statusText.style.fontWeight = '500';
        }
    }

    /**
     * Cập nhật các chỉ số học thuật của thuật toán AI
     * @param {Object} metrics - Đối tượng chứa thông số từ GameState hoặc Worker
     */
    updateMetrics(metrics) {
        // 1. Hiển thị chế độ thuật toán đang chạy
        if (!metrics.mode) {
            this.metricMode.innerText = "None";
        } else {
            this.metricMode.innerText = metrics.mode === 'minimax' ? "Minimax" : "Alpha-Beta";
        }

        // 2. Hiển thị số Node (định dạng dấu phẩy phần ngàn)
        this.metricNodes.innerText = metrics.nodesEvaluated.toLocaleString();
        
        // 3. Hiển thị thời gian thực thi (làm tròn số nguyên)
        this.metricTime.innerText = metrics.timeMs.toFixed(0);
        
        // 4. Hiển thị điểm Heuristic (định dạng dấu phẩy phần ngàn)
        this.metricScore.innerText = metrics.score.toLocaleString();
        
        // 5. Hiển thị độ sâu đạt được
        this.metricDepth.innerText = metrics.depth;

        // 6. Hiển thị trạng thái Timeout và đổi màu chữ bằng CSS class
        this.metricTimeout.innerText = metrics.timeout ? 'True' : 'False';
        // Class 'true' sẽ kích hoạt màu đỏ, 'false' kích hoạt màu xanh lá trong CSS
        this.metricTimeout.className = `metric-value ${metrics.timeout}`;
    }

    /**
     * Đưa toàn bộ Dashboard Metrics về trạng thái 0
     */
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