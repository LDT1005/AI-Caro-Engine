 
const benchmarkLogs = [];

function logTurn(testId, algoType, expectedDepth, aiMoveResult) {
    const logEntry = {
        test_id: testId,
        algorithm: algoType, // 'Minimax' hoặc 'Alpha-Beta'
        target_depth: expectedDepth,
        achieved_depth: aiMoveResult.is_timeout ? (expectedDepth - 1) : expectedDepth, // Xử lý fallback [cite: 456, 458]
        nodes_evaluated: aiMoveResult.nodes_evaluated,
        time_ms: aiMoveResult.time_ms,
        score: aiMoveResult.score,
        is_timeout: aiMoveResult.is_timeout
    };
    benchmarkLogs.push(logEntry);
}
 
function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Test_ID,Algorithm,Target_Depth,Achieved_Depth,Nodes_Evaluated,Time_ms,Score,Is_Timeout\n";
    
    benchmarkLogs.forEach(row => {
        csvContent += `${row.test_id},${row.algorithm},${row.target_depth},${row.achieved_depth},${row.nodes_evaluated},${row.time_ms},${row.score},${row.is_timeout}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "benchmark_data.csv");
    document.body.appendChild(link);
    link.click();
}