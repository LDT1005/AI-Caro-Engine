#ifndef AI_CORE_H
#define AI_CORE_H

const int BOARD_SIZE = 15;

// ============================================================
// Struct kết quả trả về của một nước đi (TV2/TV5 sử dụng)
// ============================================================
struct AIMove {
    int row;
    int col;
    long score;
    long nodes_evaluated;
    float time_ms;
    bool is_timeout;
    int depth_reached;
};

// ============================================================
// Bảng trọng số heuristic (TV3 có thể tuning qua set_heuristic_weights)
// Thứ tự ưu tiên từ cao -> thấp:
//   WIN       : 5 quân liên tiếp (thắng ngay)
//   BLOCK_WIN : chặn đối thủ thắng ngay
//   OPEN4     : 4 quân 2 đầu mở (gần như thắng)
//   HALF4     : 4 quân 1 đầu mở
//   OPEN3     : 3 quân 2 đầu mở
//   HALF3     : 3 quân 1 đầu mở
//   OPEN2     : 2 quân 2 đầu mở
//   CENTER    : bonus gần tâm bàn cờ
// ============================================================
struct HeuristicWeights {
    int win;        // Default: 10000000
    int block_win;  // Default:  9000000
    int open4;      // Default:  8000000
    int half4;      // Default:  6000000
    int open3;      // Default:  4000000
    int block_open4;// Default:  7000000  (chặn open4 đối thủ)
    int block_half4;// Default:  7000000  (chặn half4 đối thủ, gộp với block_open4)
    int block_open3;// Default:  5000000  (chặn open3 đối thủ)
    int half3;      // Default:   500000
    int open2;      // Default:   100000
    int center;     // Default:     1000  (bonus tâm bàn)
};

// Trả về bộ weights hiện tại đang dùng (đọc an toàn từ mọi luồng sau khi set)
HeuristicWeights get_heuristic_weights();

// Cập nhật bộ weights — TV3 gọi trước khi chạy benchmark/tuning
void set_heuristic_weights(HeuristicWeights w);

// ============================================================
// Interface chính để TV2 (wasm_bridge) gọi vào AI Core
// ============================================================
AIMove run_ai_search(int board[BOARD_SIZE][BOARD_SIZE], int player_turn, int max_depth, int timeout_ms, bool use_alpha_beta);

#endif