#include <iostream>
#include <vector>
#include <chrono>
#include <cmath>
#include <algorithm>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

using namespace std;
using namespace std::chrono;

const int BOARD_SIZE = 15;
const int EMPTY = 0;

struct AIMove {
    int row;
    int col;
    long score;
    long nodes_evaluated;
    float time_ms;
    bool is_timeout;
};

struct Candidate {
    int score;
    int r;
    int c;
};

bool compareCandidates(const Candidate& a, const Candidate& b) {
    return a.score > b.score;
}

vector<Candidate> get_candidates(int board[BOARD_SIZE][BOARD_SIZE]) {
    vector<pair<int, int>> empty_cells;
    bool has_piece = false;

    for (int r = 0; r < BOARD_SIZE; ++r) {
        for (int c = 0; c < BOARD_SIZE; ++c) {
            if (board[r][c] == EMPTY) {
                empty_cells.push_back({r, c});
            } else {
                has_piece = true;
            }
        }
    }

    if (!has_piece) {
        return {{0, 7, 7}}; 
    }

    vector<Candidate> candidates;
    for (auto& cell : empty_cells) {
        int r = cell.first;
        int c = cell.second;
        
        int min_r = max(0, r - 2);
        int max_r = min(BOARD_SIZE - 1, r + 2);
        int min_c = max(0, c - 2);
        int max_c = min(BOARD_SIZE - 1, c + 2);
        
        bool found_near = false;
        for (int i = min_r; i <= max_r; ++i) {
            for (int j = min_c; j <= max_c; ++j) {
                if (board[i][j] != EMPTY) {
                    found_near = true;
                    break;
                }
            }
            if (found_near) break;
        }
        
        if (found_near) {
            int score = -(abs(r - 7) + abs(c - 7));
            candidates.push_back({score, r, c});
        }
    }

    sort(candidates.begin(), candidates.end(), compareCandidates);
    return candidates;
}

long evaluate_board_mock(int board[BOARD_SIZE][BOARD_SIZE], int ai_player) {
    int opponent = (ai_player == 1) ? 2 : 1;
    long score = 0;
    for (int r = 0; r < BOARD_SIZE; ++r) {
        for (int c = 0; c < BOARD_SIZE; ++c) {
            if (board[r][c] == ai_player) {
                score += 10;
            } else if (board[r][c] == opponent) {
                score -= 10;
            }
        }
    }
    return score;
}

long minimax(int board[BOARD_SIZE][BOARD_SIZE], int depth, long alpha, long beta, bool is_maximizing, int ai_player, 
             const time_point<high_resolution_clock>& start_time, float time_limit_ms, 
             long& nodes, bool& timeout_flag, int& best_r, int& best_c, bool use_alpha_beta) {
    
    auto current_time = high_resolution_clock::now();
    float elapsed_ms = duration_cast<milliseconds>(current_time - start_time).count();
    if (elapsed_ms >= time_limit_ms) {
        timeout_flag = true;
        return 0; 
    }

    nodes++;

    if (depth == 0) return evaluate_board_mock(board, ai_player);

    vector<Candidate> candidates = get_candidates(board);
    if (candidates.empty()) return evaluate_board_mock(board, ai_player);

    int opponent = (ai_player == 1) ? 2 : 1;

    if (is_maximizing) {
        long max_eval = -999999999;
        for (auto& move : candidates) {
            board[move.r][move.c] = ai_player;
            int child_best_r, child_best_c;
            
            long eval_score = minimax(board, depth - 1, alpha, beta, false, ai_player, start_time, time_limit_ms, nodes, timeout_flag, child_best_r, child_best_c, use_alpha_beta);
            
            board[move.r][move.c] = EMPTY;
            
            if (timeout_flag) return 0; 

            if (eval_score > max_eval) {
                max_eval = eval_score;
                best_r = move.r;
                best_c = move.c;
            }
            if (use_alpha_beta) {
                alpha = max(alpha, eval_score);
                if (beta <= alpha) break; 
            }
        }
        return max_eval;
    } else {
        long min_eval = 999999999;
        for (auto& move : candidates) {
            board[move.r][move.c] = opponent;
            int child_best_r, child_best_c;
            
            long eval_score = minimax(board, depth - 1, alpha, beta, true, ai_player, start_time, time_limit_ms, nodes, timeout_flag, child_best_r, child_best_c, use_alpha_beta);
            
            board[move.r][move.c] = EMPTY;
            
            if (timeout_flag) return 0;

            if (eval_score < min_eval) {
                min_eval = eval_score;
                best_r = move.r;
                best_c = move.c;
            }
            if (use_alpha_beta) {
                beta = min(beta, eval_score);
                if (beta <= alpha) break;
            }
        }
        return min_eval;
    }
}

extern "C" {

AIMove static_move_result;

EMSCRIPTEN_KEEPALIVE
AIMove* get_best_move(int* flat_board, int player_turn, int max_depth, int timeout_ms, bool use_alpha_beta) {
    int board[BOARD_SIZE][BOARD_SIZE];
    for(int r = 0; r < BOARD_SIZE; r++) {
        for(int c = 0; c < BOARD_SIZE; c++) {
            board[r][c] = flat_board[r * BOARD_SIZE + c];
        }
    }

    auto start_time = high_resolution_clock::now();
    float time_limit_ms = (float)timeout_ms - 50.0f; 
    
    long total_nodes = 0;
    bool timeout_flag = false;
    
    int global_best_r = -1;
    int global_best_c = -1;
    long global_best_score = -999999999;
    
    vector<Candidate> candidates = get_candidates(board);
    if(!candidates.empty()) {
        global_best_r = candidates[0].r;
        global_best_c = candidates[0].c;
    }

    for (int current_depth = 1; current_depth <= max_depth; current_depth++) {
        int depth_best_r = -1;
        int depth_best_c = -1;
        bool local_timeout = false;
        
        long depth_score = minimax(
            board, current_depth, -999999999, 999999999, true, player_turn, 
            start_time, time_limit_ms, total_nodes, local_timeout, 
            depth_best_r, depth_best_c, use_alpha_beta
        );
        
        if (local_timeout) {
            timeout_flag = true;
            break; 
        } else {
            global_best_r = depth_best_r;
            global_best_c = depth_best_c;
            global_best_score = depth_score;
        }
    }

    auto end_time = high_resolution_clock::now();
    float elapsed_ms = duration_cast<milliseconds>(end_time - start_time).count();

    static_move_result.row = global_best_r;
    static_move_result.col = global_best_c;
    static_move_result.score = global_best_score;
    static_move_result.nodes_evaluated = total_nodes;
    static_move_result.time_ms = elapsed_ms;
    static_move_result.is_timeout = timeout_flag;

    return &static_move_result; 
}

EMSCRIPTEN_KEEPALIVE int get_move_row() { return static_move_result.row; }
EMSCRIPTEN_KEEPALIVE int get_move_col() { return static_move_result.col; }
EMSCRIPTEN_KEEPALIVE long get_move_score() { return static_move_result.score; }
EMSCRIPTEN_KEEPALIVE long get_nodes() { return static_move_result.nodes_evaluated; }
EMSCRIPTEN_KEEPALIVE float get_time_ms() { return static_move_result.time_ms; }
EMSCRIPTEN_KEEPALIVE bool get_is_timeout() { return static_move_result.is_timeout; }

}
