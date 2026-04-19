import time

BOARD_SIZE = 15
EMPTY = 0

class TimeoutException(Exception):
    pass

def get_candidates(board):
    empty_cells = []
    has_piece = False

    for r in range(BOARD_SIZE):
        for c in range(BOARD_SIZE):
            if board[r][c] == EMPTY:
                empty_cells.append((r, c))
            else:
                has_piece = True

    if not has_piece:
        return [(7, 7)]

    candidates = []
    for r, c in empty_cells:
        min_r = max(0, r - 2)
        max_r = min(BOARD_SIZE - 1, r + 2)
        min_c = max(0, c - 2)
        max_c = min(BOARD_SIZE - 1, c + 2)
        
        found_near = False
        for i in range(min_r, max_r + 1):
            for j in range(min_c, max_c + 1):
                if board[i][j] != EMPTY:
                    found_near = True
                    break
            if found_near:
                break
        
        if found_near:
            score_ordering = - (abs(r - 7) + abs(c - 7))
            candidates.append((score_ordering, (r, c)))

    candidates.sort(reverse=True, key=lambda x: x[0])
    return [move for _, move in candidates]

def evaluate_board_mock(board, ai_player):
    opponent = 2 if ai_player == 1 else 1
    score = 0
    for r in range(BOARD_SIZE):
        for c in range(BOARD_SIZE):
            if board[r][c] == ai_player:
                score += 10
            elif board[r][c] == opponent:
                score -= 10
    return score

def minimax(board, depth, alpha, beta, is_maximizing, ai_player, current_player, start_time, time_limit, stats):
    if time.time() - start_time >= time_limit:
        raise TimeoutException()

    stats['nodes'] += 1

    if depth == 0:
        return evaluate_board_mock(board, ai_player), None

    candidates = get_candidates(board)
    opponent = 2 if ai_player == 1 else 1
    
    if not candidates:
        return evaluate_board_mock(board, ai_player), None

    best_move = None

    if is_maximizing:
        max_eval = float('-inf')
        for move in candidates:
            r, c = move
            board[r][c] = ai_player
            eval_score, _ = minimax(board, depth - 1, alpha, beta, False, ai_player, opponent, start_time, time_limit, stats)
            board[r][c] = EMPTY
            
            if eval_score > max_eval:
                max_eval = eval_score
                best_move = move
                
            alpha = max(alpha, eval_score)
            if beta <= alpha:
                break
        return max_eval, best_move
    else:
        min_eval = float('inf')
        for move in candidates:
            r, c = move
            board[r][c] = opponent
            eval_score, _ = minimax(board, depth - 1, alpha, beta, True, ai_player, ai_player, start_time, time_limit, stats)
            board[r][c] = EMPTY
            
            if eval_score < min_eval:
                min_eval = eval_score
                best_move = move
                
            beta = min(beta, eval_score)
            if beta <= alpha:
                break
        return min_eval, best_move

def get_best_move(board, ai_player=1, max_depth=4, timeout_ms=2000):
    start_time = time.time()
    time_limit_secs = (timeout_ms - 100) / 1000.0  
    
    stats = {'nodes': 0}
    
    best_move = None
    best_score = float('-inf')
    completed_depth = 0
    is_timeout = False

    candidates = get_candidates(board)
    if not candidates:
        return {
            'move': None,
            'completed_depth': 0,
            'nodes_visited': 0,
            'time_taken_ms': 0,
            'heuristic_score': 0,
            'is_timeout': False,
            'error': "No possible moves"
        }
        
    best_move = candidates[0] 

    try:
        for current_depth in range(1, max_depth + 1):
            score, move = minimax(
                board=board,
                depth=current_depth,
                alpha=float('-inf'),
                beta=float('inf'),
                is_maximizing=True,
                ai_player=ai_player,
                current_player=ai_player,
                start_time=start_time,
                time_limit=time_limit_secs,
                stats=stats
            )
            
            if move is not None:
                best_move = move
                best_score = score
                completed_depth = current_depth
                
    except TimeoutException:
        is_timeout = True
        pass

    end_time = time.time()
    time_taken_ms = round((end_time - start_time) * 1000, 2)

    return {
        'move': best_move,
        'completed_depth': completed_depth,
        'nodes_visited': stats['nodes'],
        'time_taken_ms': time_taken_ms,
        'heuristic_score': best_score,
        'is_timeout': is_timeout
    }

if __name__ == "__main__":
    test_board = [[0 for _ in range(15)] for _ in range(15)]
    result1 = get_best_move(test_board, max_depth=1)
    
    test_board[7][7] = 2 
    result2 = get_best_move(test_board, max_depth=4, timeout_ms=2000)
    result3 = get_best_move(test_board, max_depth=10, timeout_ms=2000)
