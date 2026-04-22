#include <iostream>
<<<<<<< HEAD
#include <vector>
=======
>>>>>>> a642836aad0c3d6124dfa608edfe60eb1d8ef1b1
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
<<<<<<< HEAD
=======
const long INF = 999999999;
const long WIN_SCORE = 100000000;
>>>>>>> a642836aad0c3d6124dfa608edfe60eb1d8ef1b1

struct AIMove {
    int row;
    int col;
    long score;
    long nodes_evaluated;
    float time_ms;
    bool is_timeout;
<<<<<<< HEAD
=======
    int depth_reached;
>>>>>>> a642836aad0c3d6124dfa608edfe60eb1d8ef1b1
};

struct Candidate {
    int score;
    int r;
    int c;
};

<<<<<<< HEAD
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
=======
int check_win(int board[BOARD_SIZE][BOARD_SIZE]) {
    int dr[] = {1, 0, 1, 1};
    int dc[] = {0, 1, 1, -1};
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

int count_line(int board[BOARD_SIZE][BOARD_SIZE], int r, int c, int dr, int dc, int player, int& blocks) {
    int count = 1;
    blocks = 0;
    
    int nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] == player) { 
        count++; 
        nr += dr; 
        nc += dc; 
    }
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr][nc] != EMPTY) blocks++;
    
    nr = r - dr; nc = c - dc;
    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] == player) { 
        count++; 
        nr -= dr; 
        nc -= dc; 
    }
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr][nc] != EMPTY) blocks++;
    
    return count;
}

int evaluate_move(int board[BOARD_SIZE][BOARD_SIZE], int r, int c, int player) {
    int opponent = (player == 1) ? 2 : 1;
    
    int my_win = 0, my_open4 = 0, my_open3 = 0, my_half4 = 0;
    int op_win = 0, op_open4 = 0, op_open3 = 0, op_half4 = 0;
    
    int dr[] = {1, 0, 1, 1};
    int dc[] = {0, 1, 1, -1};
    
    for (int i = 0; i < 4; ++i) {
        int blocks = 0, op_blocks = 0;
        
        board[r][c] = player;
        int count = count_line(board, r, c, dr[i], dc[i], player, blocks);
        if (count >= 5) my_win++;
        else if (count == 4 && blocks == 0) my_open4++;
        else if (count == 4 && blocks == 1) my_half4++;
        else if (count == 3 && blocks == 0) my_open3++;
        
        board[r][c] = opponent;
        int op_count = count_line(board, r, c, dr[i], dc[i], opponent, op_blocks);
        if (op_count >= 5) op_win++;
        else if (op_count == 4 && op_blocks == 0) op_open4++;
        else if (op_count == 4 && op_blocks == 1) op_half4++;
        else if (op_count == 3 && op_blocks == 0) op_open3++;
    }
    board[r][c] = EMPTY;

    if (my_win > 0) return 10000000;
    if (op_win > 0) return 9000000;
    if (my_open4 > 0 || (my_open3 > 0 && op_open4 == 0)) return 8000000;
    if (op_open4 > 0 || op_half4 > 0) return 7000000;
    if (my_half4 > 0) return 6000000;
    if (op_open3 > 0) return 5000000;
    if (my_open3 > 0) return 4000000;

    return 1000 - (abs(r - 7) + abs(c - 7));
}

void get_candidates(int board[BOARD_SIZE][BOARD_SIZE], Candidate candidates[225], int& candidate_count, int ai_player) {
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
                int score = evaluate_move(board, r, c, ai_player);
                if (count < 225) {
                    temp_candidates[count++] = {score, r, c};
                }
            }
        }
    }
    
    if (!has_piece) {
        candidates[0] = {0, 7, 7};
        candidate_count = 1;
        return;
    }

    std::sort(temp_candidates, temp_candidates + count, [](const Candidate& a, const Candidate& b) {
        return a.score > b.score;
    });

    for(int i = 0; i < count; i++) {
        candidates[i] = temp_candidates[i];
    }
    candidate_count = count;
}

long evaluate_board(int board[BOARD_SIZE][BOARD_SIZE], int ai_player) {
    int winner = check_win(board);
    if (winner == ai_player) return WIN_SCORE;
    if (winner != 0) return -WIN_SCORE;
    
    long score = 0;
    int opponent = (ai_player == 1) ? 2 : 1;
    for (int r = 0; r < BOARD_SIZE; r++) {
        for (int c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] == ai_player) score += evaluate_move(board, r, c, ai_player);
            if (board[r][c] == opponent) score -= evaluate_move(board, r, c, opponent);
>>>>>>> a642836aad0c3d6124dfa608edfe60eb1d8ef1b1
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

<<<<<<< HEAD
    if (depth == 0) return evaluate_board_mock(board, ai_player);

    vector<Candidate> candidates = get_candidates(board);
    if (candidates.empty()) return evaluate_board_mock(board, ai_player);
=======
    int winner = check_win(board);
    if (winner != 0) {
        if (winner == ai_player) return WIN_SCORE + depth;
        else return -WIN_SCORE - depth;
    }

    if (depth == 0) return evaluate_board(board, ai_player);

    Candidate candidates[225];
    int candidate_count = 0;
    get_candidates(board, candidates, candidate_count, is_maximizing ? ai_player : (ai_player == 1 ? 2 : 1));
    
    if (candidate_count == 0) return evaluate_board(board, ai_player);
>>>>>>> a642836aad0c3d6124dfa608edfe60eb1d8ef1b1

    int opponent = (ai_player == 1) ? 2 : 1;

    if (is_maximizing) {
<<<<<<< HEAD
        long max_eval = -999999999;
        for (auto& move : candidates) {
            board[move.r][move.c] = ai_player;
            int child_best_r, child_best_c;
            
            long eval_score = minimax(board, depth - 1, alpha, beta, false, ai_player, start_time, time_limit_ms, nodes, timeout_flag, child_best_r, child_best_c, use_alpha_beta);
            
=======
        long max_eval = -INF;
        for (int i = 0; i < candidate_count; i++) {
            auto& move = candidates[i];
            
            board[move.r][move.c] = ai_player;
            int child_best_r, child_best_c;
            long eval_score = minimax(board, depth - 1, alpha, beta, false, ai_player, start_time, time_limit_ms, nodes, timeout_flag, child_best_r, child_best_c, use_alpha_beta);
>>>>>>> a642836aad0c3d6124dfa608edfe60eb1d8ef1b1
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
<<<<<<< HEAD
        long min_eval = 999999999;
        for (auto& move : candidates) {
            board[move.r][move.c] = opponent;
            int child_best_r, child_best_c;
            
            long eval_score = minimax(board, depth - 1, alpha, beta, true, ai_player, start_time, time_limit_ms, nodes, timeout_flag, child_best_r, child_best_c, use_alpha_beta);
            
=======
        long min_eval = INF;
        for (int i = 0; i < candidate_count; i++) {
            auto& move = candidates[i];
            
            board[move.r][move.c] = opponent;
            int child_best_r, child_best_c;
            long eval_score = minimax(board, depth - 1, alpha, beta, true, ai_player, start_time, time_limit_ms, nodes, timeout_flag, child_best_r, child_best_c, use_alpha_beta);
>>>>>>> a642836aad0c3d6124dfa608edfe60eb1d8ef1b1
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
<<<<<<< HEAD
    for(int r = 0; r < BOARD_SIZE; r++) {
=======
    for (int r = 0; r < BOARD_SIZE; r++) {
>>>>>>> a642836aad0c3d6124dfa608edfe60eb1d8ef1b1
        for(int c = 0; c < BOARD_SIZE; c++) {
            board[r][c] = flat_board[r * BOARD_SIZE + c];
        }
    }

    auto start_time = high_resolution_clock::now();
<<<<<<< HEAD
    float time_limit_ms = (float)timeout_ms - 50.0f; 
=======
    float time_limit_ms = (float)timeout_ms - 50.0f;
>>>>>>> a642836aad0c3d6124dfa608edfe60eb1d8ef1b1
    
    long total_nodes = 0;
    bool timeout_flag = false;
    
    int global_best_r = -1;
    int global_best_c = -1;
<<<<<<< HEAD
    long global_best_score = -999999999;
    
    vector<Candidate> candidates = get_candidates(board);
    if(!candidates.empty()) {
=======
    long global_best_score = -INF;
    int global_depth_reached = 0;
    
    Candidate candidates[225];
    int candidate_count = 0;
    get_candidates(board, candidates, candidate_count, player_turn);
    if (candidate_count > 0) {
>>>>>>> a642836aad0c3d6124dfa608edfe60eb1d8ef1b1
        global_best_r = candidates[0].r;
        global_best_c = candidates[0].c;
    }

    for (int current_depth = 1; current_depth <= max_depth; current_depth++) {
        int depth_best_r = -1;
        int depth_best_c = -1;
        bool local_timeout = false;
        
        long depth_score = minimax(
<<<<<<< HEAD
            board, current_depth, -999999999, 999999999, true, player_turn, 
=======
            board, current_depth, -INF, INF, true, player_turn, 
>>>>>>> a642836aad0c3d6124dfa608edfe60eb1d8ef1b1
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
<<<<<<< HEAD
=======
            global_depth_reached = current_depth;
            
            if (depth_score >= WIN_SCORE - 100) break;
>>>>>>> a642836aad0c3d6124dfa608edfe60eb1d8ef1b1
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
<<<<<<< HEAD
=======
    static_move_result.depth_reached = global_depth_reached;
>>>>>>> a642836aad0c3d6124dfa608edfe60eb1d8ef1b1

    return &static_move_result; 
}

EMSCRIPTEN_KEEPALIVE int get_move_row() { return static_move_result.row; }
EMSCRIPTEN_KEEPALIVE int get_move_col() { return static_move_result.col; }
EMSCRIPTEN_KEEPALIVE long get_move_score() { return static_move_result.score; }
EMSCRIPTEN_KEEPALIVE long get_nodes() { return static_move_result.nodes_evaluated; }
EMSCRIPTEN_KEEPALIVE float get_time_ms() { return static_move_result.time_ms; }
EMSCRIPTEN_KEEPALIVE bool get_is_timeout() { return static_move_result.is_timeout; }
<<<<<<< HEAD
=======
EMSCRIPTEN_KEEPALIVE int get_depth_reached() { return static_move_result.depth_reached; }
>>>>>>> a642836aad0c3d6124dfa608edfe60eb1d8ef1b1

}
