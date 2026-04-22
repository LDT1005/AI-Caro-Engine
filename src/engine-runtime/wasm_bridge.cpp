#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

// Phải khai báo cấu trúc chuẩn để JS có thể đọc được dữ liệu
struct AIMove {
    int row;
    int col;
    long score;
    long nodes_evaluated;
    float time_ms;
    bool is_timeout;
    int depth_reached;
};

extern "C" {

AIMove static_move_result;

// Chữ ký hàm phải ĐÚNG 100% với giao thức đã chốt
EMSCRIPTEN_KEEPALIVE
AIMove* get_best_move(int* flat_board, int player_turn, int max_depth, int timeout_ms, bool use_alpha_beta) {
    
    // Logic của TV2: Tìm ô trống đầu tiên
    for (int i = 0; i < 225; i++) {
        if (flat_board[i] == 0) {
            // Chuyển đổi index 1 chiều thành tọa độ 2 chiều (row, col)
            static_move_result.row = i / 15; 
            static_move_result.col = i % 15;
            
            // Dữ liệu Mock cho Dashboard
            static_move_result.score = 10;
            static_move_result.nodes_evaluated = 1;
            static_move_result.time_ms = 0.5f;
            static_move_result.is_timeout = false;
            static_move_result.depth_reached = 1;

            return &static_move_result;
        }
    }
    
    // Nếu bàn cờ đầy
    static_move_result.row = -1;
    static_move_result.col = -1;
    return &static_move_result;
}

// BẮT BUỘC: Các hàm Getter để JavaScript dễ dàng lấy dữ liệu ra khỏi bộ nhớ WASM
EMSCRIPTEN_KEEPALIVE int get_move_row() { return static_move_result.row; }
EMSCRIPTEN_KEEPALIVE int get_move_col() { return static_move_result.col; }
EMSCRIPTEN_KEEPALIVE long get_move_score() { return static_move_result.score; }
EMSCRIPTEN_KEEPALIVE long get_nodes() { return static_move_result.nodes_evaluated; }
EMSCRIPTEN_KEEPALIVE float get_time_ms() { return static_move_result.time_ms; }

}