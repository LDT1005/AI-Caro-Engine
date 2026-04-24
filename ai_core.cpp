// =============================================================
//  ai_core.cpp  —  AI Core cho Caro Engine (TV1 - AI Architect)
//  Branch: ai-core
//  Quy tắc:
//    - Không dùng new/delete trong hot path (recursion)
//    - Mảng tĩnh cho candidate list
//    - No Global Mutable State ngoài bảng weights (set 1 lần trước search)
//    - Board: row-major, player 1 = AI hoặc người (do caller quyết định)
//    - 0 = EMPTY, 1 = Player1, 2 = Player2
// =============================================================
#include "ai_core.h"
#include <iostream>
#include <chrono>
#include <cmath>
#include <algorithm>

using namespace std;
using namespace std::chrono;

// ------------------------------------------------------------------
// Hằng số nội bộ
// ------------------------------------------------------------------
static const int EMPTY    = 0;
static const long INF     = 999999999L;
static const long WIN_SCORE = 100000000L;

// ------------------------------------------------------------------
// Bộ weights mặc định — TV3 có thể override bằng set_heuristic_weights()
// ------------------------------------------------------------------
static HeuristicWeights g_weights = {
    10000000,   // win
     9000000,   // block_win
     8000000,   // open4
     6000000,   // half4
     4000000,   // open3
     7000000,   // block_open4
     7000000,   // block_half4
     5000000,   // block_open3
      500000,   // half3
      100000,   // open2
        1000    // center
};

HeuristicWeights get_heuristic_weights() { return g_weights; }

void set_heuristic_weights(HeuristicWeights w) { g_weights = w; }


struct Candidate {
    int score;
    int r;
    int c;
};


/**
 * Kiểm tra ai đã thắng.
 * Trả về: player thắng (1 hoặc 2), hoặc 0 nếu chưa kết thúc.
 * Luật: 5 quân liên tiếp theo 4 hướng (không cần đúng 5, >= 5 cũng tính).
 */
static int check_win(int board[BOARD_SIZE][BOARD_SIZE]) {
    const int dr[] = {1, 0, 1, 1};
    const int dc[] = {0, 1, 1, -1};
    for (int r = 0; r < BOARD_SIZE; ++r) {
        for (int c = 0; c < BOARD_SIZE; ++c) {
            if (board[r][c] == EMPTY) continue;
            int player = board[r][c];
            for (int i = 0; i < 4; ++i) {
                int count = 1;
                int nr = r + dr[i], nc = c + dc[i];
                while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] == player) {
                    count++;
                    nr += dr[i];
                    nc += dc[i];
                }
                if (count >= 5) return player;
            }
        }
    }
    return 0;
}



/**
 * Đếm số quân liên tiếp của `player` từ (r,c) theo hướng (dr,dc) và ngược lại.
 * Trả về: tổng số quân trong chuỗi.
 * `blocks` (out): số đầu bị chặn (0 = mở hoàn toàn, 1 = half-open, 2 = closed).
 *
 * Giả sử: board[r][c] đã được đặt quân của `player` trước khi gọi.
 */
static int count_line(int board[BOARD_SIZE][BOARD_SIZE], int r, int c,
                      int dr, int dc, int player, int& blocks) {
    int count = 1;
    blocks = 0;

    // Quét về phía dương
    int nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] == player) {
        count++;
        nr += dr;
        nc += dc;
    }
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr][nc] != EMPTY) blocks++;

    // Quét về phía âm
    nr = r - dr; nc = c - dc;
    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] == player) {
        count++;
        nr -= dr;
        nc -= dc;
    }
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr][nc] != EMPTY) blocks++;

    return count;
}



/**
 * Đánh giá độ ưu tiên của ô (r,c) cho `player` dựa trên pattern.
 * Dùng cho move ordering trong get_candidates().
 *
 * Trả về điểm nguyên. Số càng cao = nước càng tốt để chọn.
 * Quy tắc move ordering (từ cao xuống thấp):
 *   1. Thắng ngay (my_win)
 *   2. Chặn đối thủ thắng ngay (op_win)
 *   3. Tạo open4 hoặc double-threat (my_open4 / my_open3 kép)
 *   4. Chặn open4/half4 của đối thủ
 *   5. Tạo half4
 *   6. Chặn open3 của đối thủ
 *   7. Tạo open3
 *   8. Tạo half3
 *   9. Tạo open2
 *  10. Bonus tâm bàn
 */
static int evaluate_move(int board[BOARD_SIZE][BOARD_SIZE], int r, int c, int player) {
    int opponent = (player == 1) ? 2 : 1;
    const HeuristicWeights& w = g_weights;

    // Đếm pattern cho player và opponent
    int my_win   = 0, my_open4 = 0, my_half4 = 0;
    int my_open3 = 0, my_half3 = 0, my_open2 = 0;

    int op_win   = 0, op_open4 = 0, op_half4 = 0;
    int op_open3 = 0, op_half3 = 0;

    const int dr[] = {1, 0, 1, 1};
    const int dc[] = {0, 1, 1, -1};

    for (int i = 0; i < 4; ++i) {
        int blocks = 0, op_blocks = 0;

        // --- Phía player ---
        board[r][c] = player;
        int count = count_line(board, r, c, dr[i], dc[i], player, blocks);
        if      (count >= 5)                    my_win++;
        else if (count == 4 && blocks == 0)     my_open4++;
        else if (count == 4 && blocks == 1)     my_half4++;
        else if (count == 3 && blocks == 0)     my_open3++;
        else if (count == 3 && blocks == 1)     my_half3++;
        else if (count == 2 && blocks == 0)     my_open2++;

        // --- Phía opponent ---
        board[r][c] = opponent;
        int op_count = count_line(board, r, c, dr[i], dc[i], opponent, op_blocks);
        if      (op_count >= 5)                     op_win++;
        else if (op_count == 4 && op_blocks == 0)   op_open4++;
        else if (op_count == 4 && op_blocks == 1)   op_half4++;
        else if (op_count == 3 && op_blocks == 0)   op_open3++;
        else if (op_count == 3 && op_blocks == 1)   op_half3++;
    }
    board[r][c] = EMPTY; // Khôi phục — KHÔNG ĐƯỢC quên dòng này

    // --- Phân loại ưu tiên theo bảng weights ---
    if (my_win > 0)                                         return w.win;
    if (op_win > 0)                                         return w.block_win;
    // Double-threat: open4 hoặc tạo 2 mối đe dọa cùng lúc
    if (my_open4 > 0)                                       return w.open4;
    if (my_open3 >= 2)                                      return w.open4;  // double open3 ~ open4
    // Chặn tấn công nguy hiểm của đối thủ
    if (op_open4 > 0 || op_half4 > 0)                      return w.block_open4;
    // Tạo half4 (chỉ thiếu 1 đầu)
    if (my_half4 > 0)                                       return w.half4;
    // Chặn open3 đối thủ
    if (op_open3 > 0)                                       return w.block_open3;
    // Tạo open3
    if (my_open3 > 0)                                       return w.open3;
    // Tạo half3
    if (my_half3 > 0)                                       return w.half3;
    // Tạo open2
    if (my_open2 > 0)                                       return w.open2;

    // Bonus theo khoảng cách tâm bàn (tâm = 7,7)
    return w.center - (abs(r - 7) + abs(c - 7));
}



/**
 * Đánh giá toàn bộ bàn cờ từ góc nhìn của `ai_player`.
 * Gọi check_win() trước để bắt terminal state.
 * Sau đó tổng hợp evaluate_move() cho mỗi quân trên bàn.
 */
static long evaluate_board(int board[BOARD_SIZE][BOARD_SIZE], int ai_player) {
    int winner = check_win(board);
    if (winner == ai_player)  return WIN_SCORE;
    if (winner != 0)          return -WIN_SCORE;

    long score = 0;
    int opponent = (ai_player == 1) ? 2 : 1;
    for (int r = 0; r < BOARD_SIZE; r++) {
        for (int c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] == ai_player)
                score += evaluate_move(board, r, c, ai_player);
            else if (board[r][c] == opponent)
                score -= evaluate_move(board, r, c, opponent);
        }
    }
    return score;
}



/**
 * Sinh danh sách ô trống ứng viên theo chuẩn dự án:
 *   - Chỉ ô trống
 *   - Phải có quân trong vùng Chebyshev <= 2
 *   - Nếu bàn trống hoàn toàn: trả về duy nhất (7,7)
 *   - Sắp xếp giảm dần theo evaluate_move() để move ordering hiệu quả
 *
 * Không cấp phát động. Dùng mảng tĩnh temp_candidates[225].
 */
static void get_candidates(int board[BOARD_SIZE][BOARD_SIZE],
                           Candidate candidates[225], int& candidate_count,
                           int ai_player) {
    candidate_count = 0;
    bool has_piece = false;
    Candidate temp_candidates[225];
    int count = 0;

    for (int r = 0; r < BOARD_SIZE; ++r) {
        for (int c = 0; c < BOARD_SIZE; ++c) {
            if (board[r][c] != EMPTY) {
                has_piece = true;
                continue;
            }

            // Kiểm tra Chebyshev distance <= 2
            int min_r = max(0, r - 2), max_r = min(BOARD_SIZE - 1, r + 2);
            int min_c = max(0, c - 2), max_c = min(BOARD_SIZE - 1, c + 2);

            bool found_near = false;
            for (int i = min_r; i <= max_r && !found_near; ++i)
                for (int j = min_c; j <= max_c && !found_near; ++j)
                    if (board[i][j] != EMPTY) found_near = true;

            if (found_near && count < 225) {
                int score = evaluate_move(board, r, c, ai_player);
                temp_candidates[count++] = {score, r, c};
            }
        }
    }

    // Bàn trống: mặc định đánh tâm
    if (!has_piece) {
        candidates[0] = {0, 7, 7};
        candidate_count = 1;
        return;
    }

    // Sắp xếp giảm dần (move ordering)
    sort(temp_candidates, temp_candidates + count,
         [](const Candidate& a, const Candidate& b) { return a.score > b.score; });

    for (int i = 0; i < count; i++)
        candidates[i] = temp_candidates[i];
    candidate_count = count;
}



/**
 * Thuật toán Minimax đệ quy với Alpha-Beta Pruning tuỳ chọn.
 *
 * Nguyên tắc:
 *   - Không cấp phát động trong thân hàm
 *   - Candidate list dùng mảng cục bộ (stack) — an toàn với recursion
 *   - Timeout guard kiểm tra ở đầu mỗi node
 *   - Khi timeout: set timeout_flag = true, return 0 ngay lập tức
 *   - best_r / best_c được cập nhật ngay khi tìm được node tốt hơn
 *
 * @param board          Bàn cờ hiện tại (sửa trực tiếp, undo sau mỗi lượt)
 * @param depth          Độ sâu còn lại
 * @param alpha / beta   Cửa sổ Alpha-Beta
 * @param is_maximizing  true = lượt AI, false = lượt đối thủ
 * @param ai_player      Giá trị player của AI (1 hoặc 2)
 * @param start_time     Thời điểm bắt đầu tìm kiếm
 * @param time_limit_ms  Giới hạn thời gian (ms)
 * @param nodes          Đếm số node đã evaluate (metrics)
 * @param timeout_flag   Cờ báo timeout
 * @param best_r/best_c  Nước tốt nhất tìm được ở level này
 * @param use_alpha_beta Bật/tắt cắt tỉa Alpha-Beta
 */
static long minimax(int board[BOARD_SIZE][BOARD_SIZE],
                    int depth, long alpha, long beta,
                    bool is_maximizing, int ai_player,
                    const time_point<high_resolution_clock>& start_time,
                    float time_limit_ms,
                    long& nodes, bool& timeout_flag,
                    int& best_r, int& best_c,
                    bool use_alpha_beta) {

    // --- Timeout Guard ---
    float elapsed_ms = duration_cast<milliseconds>(high_resolution_clock::now() - start_time).count();
    if (elapsed_ms >= time_limit_ms) {
        timeout_flag = true;
        return 0;
    }

    nodes++;

    // --- Terminal State Check ---
    int winner = check_win(board);
    if (winner != 0) {
        // Thưởng/phạt thêm theo depth để AI ưu tiên thắng sớm / kéo dài khi thua
        return (winner == ai_player) ? (WIN_SCORE + depth) : (-WIN_SCORE - depth);
    }

    // --- Leaf Node: trả về heuristic evaluation ---
    if (depth == 0) return evaluate_board(board, ai_player);

    // --- Sinh candidate --- (mảng cục bộ, không heap)
    Candidate candidates[225];
    int candidate_count = 0;
    int current_player = is_maximizing ? ai_player : ((ai_player == 1) ? 2 : 1);
    get_candidates(board, candidates, candidate_count, current_player);

    if (candidate_count == 0) return evaluate_board(board, ai_player);

    int opponent = (ai_player == 1) ? 2 : 1;

    if (is_maximizing) {
        long max_eval = -INF;
        for (int i = 0; i < candidate_count; i++) {
            const Candidate& move = candidates[i];
            board[move.r][move.c] = ai_player;      // Apply
            int child_r, child_c;
            long eval = minimax(board, depth - 1, alpha, beta, false, ai_player,
                                start_time, time_limit_ms, nodes, timeout_flag,
                                child_r, child_c, use_alpha_beta);
            board[move.r][move.c] = EMPTY;           // Undo

            if (timeout_flag) return 0;

            if (eval > max_eval) {
                max_eval = eval;
                best_r = move.r;
                best_c = move.c;
            }
            if (use_alpha_beta) {
                alpha = max(alpha, eval);
                if (beta <= alpha) break;            // Beta cutoff
            }
        }
        return max_eval;
    } else {
        long min_eval = INF;
        for (int i = 0; i < candidate_count; i++) {
            const Candidate& move = candidates[i];
            board[move.r][move.c] = opponent;        // Apply
            int child_r, child_c;
            long eval = minimax(board, depth - 1, alpha, beta, true, ai_player,
                                start_time, time_limit_ms, nodes, timeout_flag,
                                child_r, child_c, use_alpha_beta);
            board[move.r][move.c] = EMPTY;           // Undo

            if (timeout_flag) return 0;

            if (eval < min_eval) {
                min_eval = eval;
                best_r = move.r;
                best_c = move.c;
            }
            if (use_alpha_beta) {
                beta = min(beta, eval);
                if (beta <= alpha) break;            // Alpha cutoff
            }
        }
        return min_eval;
    }
}


/**
 * Hàm chính AI Core. TV2 gọi hàm này thông qua wasm_bridge.
 *
 * Chiến lược:
 *   1. Seed best move bằng candidate đứng đầu (move ordering) trước khi search.
 *      => Đảm bảo KHÔNG BAO GIỜ trả null/invalid nếu bàn có quân.
 *   2. Chạy Iterative Deepening từ depth=1 đến max_depth.
 *   3. Mỗi depth hoàn chỉnh: cập nhật global_best.
 *   4. Nếu timeout giữa chừng: dừng ngay, trả global_best của depth gần nhất.
 *   5. Nếu tìm thấy nước thắng chắc (score >= WIN_SCORE-100): dừng sớm.
 *
 * @param board         Mảng 2D [15][15], row-major, 0=empty/1=p1/2=p2
 * @param player_turn   Người chơi hiện tại (1 hoặc 2)
 * @param max_depth     Độ sâu tối đa cho Iterative Deepening
 * @param timeout_ms    Giới hạn thời gian tổng (ms), mặc định 2000
 * @param use_alpha_beta Bật Alpha-Beta Pruning (khuyến nghị true)
 * @return AIMove       Struct kết quả đầy đủ metrics
 */
AIMove run_ai_search(int board[BOARD_SIZE][BOARD_SIZE], int player_turn,
                     int max_depth, int timeout_ms, bool use_alpha_beta) {
    AIMove result;
    auto start_time = high_resolution_clock::now();

    // Dành 50ms buffer để không vượt timeout khi giao tiếp với caller
    float time_limit_ms = (float)timeout_ms - 50.0f;
    if (time_limit_ms < 50.0f) time_limit_ms = 50.0f;

    long total_nodes       = 0;
    bool timeout_flag      = false;
    int  global_best_r     = -1;
    int  global_best_c     = -1;
    long global_best_score = -INF;
    int  global_depth      = 0;

    // --- Seed: lấy nước tốt nhất theo move ordering để có fallback ngay lập tức ---
    {
        Candidate seed_candidates[225];
        int seed_count = 0;
        get_candidates(board, seed_candidates, seed_count, player_turn);
        if (seed_count > 0) {
            global_best_r = seed_candidates[0].r;
            global_best_c = seed_candidates[0].c;
            global_best_score = seed_candidates[0].score;
        }
    }

    // --- Iterative Deepening ---
    for (int d = 1; d <= max_depth; d++) {
        int depth_best_r = global_best_r;
        int depth_best_c = global_best_c;
        bool local_timeout = false;

        long depth_score = minimax(
            board, d, -INF, INF, true, player_turn,
            start_time, time_limit_ms, total_nodes,
            local_timeout, depth_best_r, depth_best_c, use_alpha_beta
        );

        if (local_timeout) {
            // Depth này chưa hoàn chỉnh — giữ kết quả depth trước, đánh dấu timeout
            timeout_flag = true;
            break;
        }

        // Depth hoàn chỉnh — cập nhật global best
        global_best_r     = depth_best_r;
        global_best_c     = depth_best_c;
        global_best_score = depth_score;
        global_depth      = d;

        // Tìm thấy nước thắng chắc chắn — không cần search sâu hơn
        if (depth_score >= WIN_SCORE - 100) break;
    }

    float elapsed_ms = duration_cast<milliseconds>(high_resolution_clock::now() - start_time).count();

    // --- Điền metrics đầy đủ cho TV4/TV5 ---
    result.row            = global_best_r;
    result.col            = global_best_c;
    result.score          = global_best_score;
    result.nodes_evaluated = total_nodes;
    result.time_ms        = elapsed_ms;
    result.is_timeout     = timeout_flag;
    result.depth_reached  = global_depth;

    return result;
}