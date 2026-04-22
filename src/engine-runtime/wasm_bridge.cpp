#include "../ai-core/ai_core.h" // Chứa định nghĩa BOARD_SIZE và struct AIMove từ TV1

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/bind.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

extern "C" {

/**
 * Authoritative Result: Biến tĩnh lưu trữ kết quả cuối cùng.
 * TV2 quản lý vòng đời biến này để JS có thể đọc qua con trỏ an toàn.
 */
AIMove static_move_result; 

/**
 * GIAI ĐOẠN 1-4: Bridge kết nối UI và AI Core.
 * @param flat_board Mảng 1 chiều 225 phần tử (row-major) gửi từ JS.
 */
EMSCRIPTEN_KEEPALIVE
AIMove* get_best_move(int* flat_board, int player_turn, int max_depth, int timeout_ms, bool use_alpha_beta) {
    // Logic của TV2: Chuyển đổi ranh giới dữ liệu
    int board[BOARD_SIZE][BOARD_SIZE];
    
    // 1. Chuyển đổi mảng 1D phẳng (từ JS) sang 2D (cho C++ AI Core)
    for (int r = 0; r < BOARD_SIZE; r++) {
        for(int c = 0; c < BOARD_SIZE; c++) {
            board[r][c] = flat_board[r * BOARD_SIZE + c];
        }
    }

    /**
     * 2. Gọi lõi AI thật của TV1.
     * Logic tìm kiếm ô trống cũ đã được thay thế bằng run_ai_search.
     */
    static_move_result = run_ai_search(board, player_turn, max_depth, timeout_ms, use_alpha_beta);

    // 3. Trả về con trỏ tới vùng nhớ tĩnh
    return &static_move_result; 
}

/**
 * BẮT BUỘC: Các hàm Getter chuẩn hóa.
 * Giúp Worker đọc dữ liệu từ Heap WASM mà không bị lệch Byte Alignment (Cấu trúc struct).
 */
EMSCRIPTEN_KEEPALIVE int get_move_row() { return static_move_result.row; }
EMSCRIPTEN_KEEPALIVE int get_move_col() { return static_move_result.col; }
EMSCRIPTEN_KEEPALIVE long get_move_score() { return static_move_result.score; }
EMSCRIPTEN_KEEPALIVE long get_nodes() { return static_move_result.nodes_evaluated; }
EMSCRIPTEN_KEEPALIVE float get_time_ms() { return static_move_result.time_ms; }
EMSCRIPTEN_KEEPALIVE int get_depth_reached() { return static_move_result.depth_reached; }
EMSCRIPTEN_KEEPALIVE bool get_is_timeout() { return static_move_result.is_timeout; }

}