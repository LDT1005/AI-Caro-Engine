#include "../ai-core/ai_core.h" 

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/bind.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

extern "C" {

AIMove static_move_result; 

EMSCRIPTEN_KEEPALIVE
AIMove* get_best_move(int* flat_board, int player_turn, int max_depth, int timeout_ms, bool use_alpha_beta) {
    int board[BOARD_SIZE][BOARD_SIZE];
    
    for (int r = 0; r < BOARD_SIZE; r++) {
        for(int c = 0; c < BOARD_SIZE; c++) {
            board[r][c] = flat_board[r * BOARD_SIZE + c];
        }
    }

    static_move_result = run_ai_search(board, player_turn, max_depth, timeout_ms, use_alpha_beta);

    return &static_move_result; 
}

EMSCRIPTEN_KEEPALIVE int get_move_row() { return static_move_result.row; }
EMSCRIPTEN_KEEPALIVE int get_move_col() { return static_move_result.col; }
EMSCRIPTEN_KEEPALIVE long get_move_score() { return static_move_result.score; }
EMSCRIPTEN_KEEPALIVE long get_nodes() { return static_move_result.nodes_evaluated; }
EMSCRIPTEN_KEEPALIVE float get_time_ms() { return static_move_result.time_ms; }
EMSCRIPTEN_KEEPALIVE int get_depth_reached() { return static_move_result.depth_reached; }
EMSCRIPTEN_KEEPALIVE bool get_is_timeout() { return static_move_result.is_timeout; }

}