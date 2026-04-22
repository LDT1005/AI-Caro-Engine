#ifndef AI_CORE_H
#define AI_CORE_H

const int BOARD_SIZE = 15;

// Struct chứa kết quả trả về của một nước đi
struct AIMove {
    int row;
    int col;
    long score;
    long nodes_evaluated;
    float time_ms;
    bool is_timeout;
    int depth_reached;
};

// Interface để TV2 (wasm_bridge) gọi vào thuật toán của TV1
AIMove run_ai_search(int board[BOARD_SIZE][BOARD_SIZE], int player_turn, int max_depth, int timeout_ms, bool use_alpha_beta);

#endif