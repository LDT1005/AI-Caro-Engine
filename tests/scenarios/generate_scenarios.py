#!/usr/bin/env python3
"""
Sinh tests/scenarios/scenarios.json — logic tương đương generate_scenarios.mjs.

Chạy (từ thư mục tests/scenarios):
  python generate_scenarios.py
hoặc:
  python3 generate_scenarios.py

Yêu cầu: Python 3.9+ (dùng list[list[int]], typing tùy chọn).
"""
from __future__ import annotations

import json
import random
from pathlib import Path

EMPTY = 0
P1 = 1
P2 = -1


def empty_board() -> list[list[int]]:
    return [[EMPTY] * 15 for _ in range(15)]


def creates_five_at(b: list[list[int]], r: int, c: int, player: int) -> bool:
    for dr, dc in ((0, 1), (1, 0), (1, 1), (1, -1)):
        cnt = 1
        nr, nc = r + dr, c + dc
        while 0 <= nr < 15 and 0 <= nc < 15 and b[nr][nc] == player:
            cnt += 1
            nr += dr
            nc += dc
        nr, nc = r - dr, c - dc
        while 0 <= nr < 15 and 0 <= nc < 15 and b[nr][nc] == player:
            cnt += 1
            nr -= dr
            nc -= dc
        if cnt >= 5:
            return True
    return False


def build_almost_full_no_five_one_empty() -> tuple[list[list[int]], list[int]]:
    b = empty_board()
    order = [(r, c) for r in range(15) for c in range(15)]

    def dfs(k: int) -> bool:
        if k >= len(order):
            return True
        r, c = order[k]
        for pl in (P1, P2):
            b[r][c] = pl
            if creates_five_at(b, r, c, pl):
                continue
            if dfs(k + 1):
                return True
        b[r][c] = EMPTY
        return False

    if not dfs(0):
        raise RuntimeError("DFS full 225 board failed")

    candidates = list(order)
    random.Random(12345).shuffle(candidates)
    for er, ec in candidates:
        saved = b[er][ec]
        b[er][ec] = P1
        ok = not creates_five_at(b, er, ec, P1)
        if ok:
            b[er][ec] = EMPTY
            return b, [er, ec]
        b[er][ec] = saved
    raise RuntimeError("no single empty works for draw test")


def invalid_moves_small_empty_region() -> list[list[int]]:
    hole = {(r, c) for r in range(6, 9) for c in range(6, 9)}
    fill_order = [(r, c) for r in range(15) for c in range(15) if (r, c) not in hole]
    b = empty_board()
    for r in range(6, 9):
        for c in range(6, 9):
            b[r][c] = EMPTY

    def dfs(k: int) -> bool:
        if k >= len(fill_order):
            return True
        r, c = fill_order[k]
        for pl in (P1, P2):
            b[r][c] = pl
            if creates_five_at(b, r, c, pl):
                continue
            if dfs(k + 1):
                return True
        b[r][c] = EMPTY
        return False

    if not dfs(0):
        raise RuntimeError("invalid_moves DFS failed")
    return b


def legal_empty_cells(b: list[list[int]]) -> list[list[int]]:
    return [[r, c] for r in range(15) for c in range(15) if b[r][c] == EMPTY]


def chebyshev_candidates(b: list[list[int]], dist: int = 2) -> list[list[int]]:
    occupied = [(r, c) for r in range(15) for c in range(15) if b[r][c] != EMPTY]
    out: list[list[int]] = []
    for r in range(15):
        for c in range(15):
            if b[r][c] != EMPTY:
                continue
            if any(max(abs(r - rr), abs(c - cc)) <= dist for rr, cc in occupied):
                out.append([r, c])
    return out


def horiz_win_p1() -> list[list[int]]:
    b = empty_board()
    for c in range(5, 9):
        b[7][c] = P1
    return b


def vert_win_p1() -> list[list[int]]:
    b = empty_board()
    for r in range(5, 9):
        b[r][7] = P1
    return b


def diag_main_win_p1() -> list[list[int]]:
    b = empty_board()
    for r, c in ((5, 5), (6, 6), (7, 7), (8, 8)):
        b[r][c] = P1
    return b


def diag_anti_win_p1() -> list[list[int]]:
    b = empty_board()
    for r, c in ((5, 9), (6, 8), (7, 7), (8, 6)):
        b[r][c] = P1
    return b


def block_half_open_four() -> list[list[int]]:
    b = empty_board()
    for c in range(4, 8):
        b[7][c] = P2
    return b


def instant_win_p1() -> list[list[int]]:
    b = empty_board()
    for c in range(2, 6):
        b[10][c] = P1
    return b


def must_block_loss() -> list[list[int]]:
    b = empty_board()
    for c in range(5, 9):
        b[3][c] = P2
    b[10][10] = b[10][11] = b[10][12] = P1
    return b


def two_winning_cells() -> list[list[int]]:
    b = empty_board()
    for c in range(1, 5):
        b[1][c] = P1
    for r in range(1, 5):
        b[r][13] = P1
    return b


def open_four_vs_open_three() -> list[list[int]]:
    b = empty_board()
    b[7][5] = b[7][6] = b[7][7] = P1
    b[11][10] = b[11][11] = P1
    return b


def double_threat_simple() -> list[list[int]]:
    b = empty_board()
    b[7][7] = b[7][8] = P1
    b[8][7] = b[8][8] = P1
    b[6][6] = b[6][9] = P2
    return b


def mid_board_position() -> list[list[int]]:
    b = empty_board()
    for r, c in ((6, 6), (6, 8), (8, 6), (8, 8), (7, 7)):
        b[r][c] = P1 if (r + c) % 2 == 0 else P2
    return b


def equivalent_good_moves() -> list[list[int]]:
    b = empty_board()
    b[7][7] = P1
    b[7][8] = b[7][6] = P2
    return b


def win_single_empty_row() -> list[list[int]]:
    b = empty_board()
    for c in range(0, 4):
        b[7][c] = P1
    for c in range(5, 15):
        b[7][c] = P2
    b[7][4] = EMPTY
    return b


def main() -> None:
    draw_b, draw_empty = build_almost_full_no_five_one_empty()
    inv_board = invalid_moves_small_empty_region()
    mid = mid_board_position()

    scenarios = [
        {
            "Test_ID": "G1-R01",
            "Group": "Luật & Engine",
            "Board_State": horiz_win_p1(),
            "Player_Turn": 1,
            "Acceptable_Moves": [[7, 4], [7, 9]],
            "Expected_Priority": "Hoàn thành 5 quân liên tiếp theo hàng ngang (hai đầu hợp lệ).",
            "Pass_Fail": None,
        },
        {
            "Test_ID": "G1-R02",
            "Group": "Luật & Engine",
            "Board_State": vert_win_p1(),
            "Player_Turn": 1,
            "Acceptable_Moves": [[4, 7], [9, 7]],
            "Expected_Priority": "Thắng dọc với nước thứ 5 tại một trong hai đầu hở.",
            "Pass_Fail": None,
        },
        {
            "Test_ID": "G1-R03",
            "Group": "Luật & Engine",
            "Board_State": diag_main_win_p1(),
            "Player_Turn": 1,
            "Acceptable_Moves": [[4, 4], [9, 9]],
            "Expected_Priority": "Thắng chéo chính (đường chéo song song vector (1,1)).",
            "Pass_Fail": None,
        },
        {
            "Test_ID": "G1-R04",
            "Group": "Luật & Engine",
            "Board_State": inv_board,
            "Player_Turn": 1,
            "Acceptable_Moves": legal_empty_cells(inv_board),
            "Expected_Priority": "Chỉ chấp nhận ô trống; harness từ chối nước đặt trùng quân (invalid move).",
            "Pass_Fail": None,
        },
        {
            "Test_ID": "G1-R05",
            "Group": "Luật & Engine",
            "Board_State": draw_b,
            "Player_Turn": 1,
            "Acceptable_Moves": [draw_empty],
            "Expected_Priority": "Ô trống duy nhất; sau khi đánh bàn đầy và không có 5 liên tiếp — hòa.",
            "Pass_Fail": None,
        },
        {
            "Test_ID": "G2-T01",
            "Group": "Sinh tử chiến thuật",
            "Board_State": block_half_open_four(),
            "Player_Turn": 1,
            "Acceptable_Moves": [[7, 3], [7, 8]],
            "Expected_Priority": "Chặn Half-Open Four của đối thủ (hai điểm chặn năm liên tiếp).",
            "Pass_Fail": None,
        },
        {
            "Test_ID": "G2-T02",
            "Group": "Sinh tử chiến thuật",
            "Board_State": instant_win_p1(),
            "Player_Turn": 1,
            "Acceptable_Moves": [[10, 6]],
            "Expected_Priority": "Nước thắng tức thì (năm ngang).",
            "Pass_Fail": None,
        },
        {
            "Test_ID": "G2-T03",
            "Group": "Sinh tử chiến thuật",
            "Board_State": must_block_loss(),
            "Player_Turn": 1,
            "Acceptable_Moves": [[3, 4], [3, 9]],
            "Expected_Priority": "Ưu tiên chặn bốn quân địch sắp thành năm hơn tấn công xa.",
            "Pass_Fail": None,
        },
        {
            "Test_ID": "G2-T04",
            "Group": "Sinh tử chiến thuật",
            "Board_State": two_winning_cells(),
            "Player_Turn": 1,
            "Acceptable_Moves": [[1, 0], [1, 5], [0, 13], [5, 13]],
            "Expected_Priority": "Không bỏ lỡ nước thắng tức thì (hai đường thắng độc lập).",
            "Pass_Fail": None,
        },
        {
            "Test_ID": "G2-T05",
            "Group": "Sinh tử chiến thuật",
            "Board_State": open_four_vs_open_three(),
            "Player_Turn": 1,
            "Acceptable_Moves": [[7, 4], [7, 8]],
            "Expected_Priority": "Ưu tiên mở rộng ba quân giữa hàng 7 (tạo thế 4 liên tiếp hai đầu hở) hơn hàng 11 yếu.",
            "Pass_Fail": None,
        },
        {
            "Test_ID": "G3-A01",
            "Group": "Chiến thuật nâng cao",
            "Board_State": diag_anti_win_p1(),
            "Player_Turn": 1,
            "Acceptable_Moves": [[4, 10], [9, 5]],
            "Expected_Priority": "Thắng chéo phụ (đường cố định r+c).",
            "Pass_Fail": None,
        },
        {
            "Test_ID": "G3-A02",
            "Group": "Chiến thuật nâng cao",
            "Board_State": double_threat_simple(),
            "Player_Turn": 1,
            "Acceptable_Moves": [[6, 7], [7, 6], [9, 8], [8, 9]],
            "Expected_Priority": "Ưu tiên nước tạo song công / đe dọa kép (một trong các nước lân cận khối 2x2).",
            "Pass_Fail": None,
        },
        {
            "Test_ID": "G3-A03",
            "Group": "Chiến thuật nâng cao",
            "Board_State": mid,
            "Player_Turn": 1,
            "Acceptable_Moves": chebyshev_candidates(mid, 2),
            "Expected_Priority": "Nước đi phải thuộc tập candidate Chebyshev<=2 quanh quân hiện có (theo spec AI).",
            "Pass_Fail": None,
        },
        {
            "Test_ID": "G3-A04",
            "Group": "Chiến thuật nâng cao",
            "Board_State": win_single_empty_row(),
            "Player_Turn": 1,
            "Acceptable_Moves": [[7, 4]],
            "Expected_Priority": "Một ô trống duy nhất trên hàng — hoàn thành 5 quân P1.",
            "Pass_Fail": None,
        },
        {
            "Test_ID": "G3-A05",
            "Group": "Chiến thuật nâng cao",
            "Board_State": equivalent_good_moves(),
            "Player_Turn": 1,
            "Acceptable_Moves": [[6, 7], [8, 7], [7, 5], [7, 9]],
            "Expected_Priority": "Đối xứng quanh trung tâm — chấp nhận bất kỳ nước trong tập tương đương.",
            "Pass_Fail": None,
        },
    ]

    out = {
        "project": "AI Caro Engine",
        "format_version": 1,
        "board_legend": {0: "empty", 1: "first_player", -1: "second_player"},
        "scenarios": scenarios,
    }

    out_path = Path(__file__).resolve().parent / "scenarios.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out_path} with {len(scenarios)} tests. G1-R05 empty: {draw_empty}")


if __name__ == "__main__":
    main()
