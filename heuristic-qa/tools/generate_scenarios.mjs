/**
 * Generate scenarios.json (TV3). Run: node generate_scenarios.mjs
 */
const EMPTY = 0;
const P1 = 1;
const P2 = -1;

function emptyBoard() {
  return Array.from({ length: 15 }, () => Array(15).fill(EMPTY));
}

/** Chỉ kiểm tra 4 hướng qua (r,c) sau khi gán player (O(1)). */
function createsFiveAt(b, r, c, player) {
  for (const [dr, dc] of [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]) {
    let cnt = 1;
    let nr = r + dr,
      nc = c + dc;
    while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] === player) {
      cnt++;
      nr += dr;
      nc += dc;
    }
    nr = r - dr;
    nc = c - dc;
    while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && b[nr][nc] === player) {
      cnt++;
      nr -= dr;
      nc -= dc;
    }
    if (cnt >= 5) return true;
  }
  return false;
}

function buildAlmostFullNoFiveOneEmpty() {
  const b = emptyBoard();
  const order = [];
  for (let r = 0; r < 15; r++) for (let c = 0; c < 15; c++) order.push([r, c]);

  function dfs(k) {
    if (k >= order.length) return true;
    const [r, c] = order[k];
    for (const pl of [P1, P2]) {
      b[r][c] = pl;
      if (createsFiveAt(b, r, c, pl)) continue;
      if (dfs(k + 1)) return true;
    }
    b[r][c] = EMPTY;
    return false;
  }

  if (!dfs(0)) throw new Error("DFS full 225 board failed");

  const candidates = [...order];
  shuffle(candidates, mulberry32(12345));
  for (const [er, ec] of candidates) {
    const saved = b[er][ec];
    b[er][ec] = EMPTY;
    b[er][ec] = P1;
    const ok = !createsFiveAt(b, er, ec, P1);
    if (ok) {
      b[er][ec] = EMPTY;
      return { b, emptyCell: [er, ec], seed: null };
    }
    b[er][ec] = saved;
  }
  throw new Error("no single empty works for draw test — impossible?");
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function invalidMovesSmallEmptyRegion() {
  const hole = new Set();
  for (let r = 6; r <= 8; r++) for (let c = 6; c <= 8; c++) hole.add(`${r},${c}`);
  const fillOrder = [];
  for (let r = 0; r < 15; r++) for (let c = 0; c < 15; c++) if (!hole.has(`${r},${c}`)) fillOrder.push([r, c]);
  const b = emptyBoard();
  for (let r = 6; r <= 8; r++) for (let c = 6; c <= 8; c++) b[r][c] = EMPTY;

  function dfs(k) {
    if (k >= fillOrder.length) return true;
    const [r, c] = fillOrder[k];
    for (const pl of [P1, P2]) {
      b[r][c] = pl;
      if (createsFiveAt(b, r, c, pl)) continue;
      if (dfs(k + 1)) return true;
    }
    b[r][c] = EMPTY;
    return false;
  }

  if (!dfs(0)) throw new Error("invalid_moves DFS failed");
  return b;
}

function legalEmptyCells(b) {
  const o = [];
  for (let r = 0; r < 15; r++) for (let c = 0; c < 15; c++) if (b[r][c] === EMPTY) o.push([r, c]);
  return o;
}

function chebyshevCandidates(b, dist = 2) {
  const occupied = [];
  for (let r = 0; r < 15; r++) for (let c = 0; c < 15; c++) if (b[r][c] !== EMPTY) occupied.push([r, c]);
  const out = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (b[r][c] !== EMPTY) continue;
      if (occupied.some(([rr, cc]) => Math.max(Math.abs(r - rr), Math.abs(c - cc)) <= dist)) out.push([r, c]);
    }
  }
  return out;
}

function horizWinP1() {
  const b = emptyBoard();
  const r = 7;
  for (let c = 5; c <= 8; c++) b[r][c] = P1;
  return b;
}
function vertWinP1() {
  const b = emptyBoard();
  const c = 7;
  for (let r = 5; r <= 8; r++) b[r][c] = P1;
  return b;
}
function diagMainWinP1() {
  const b = emptyBoard();
  for (const [r, c] of [
    [5, 5],
    [6, 6],
    [7, 7],
    [8, 8],
  ])
    b[r][c] = P1;
  return b;
}
function diagAntiWinP1() {
  const b = emptyBoard();
  for (const [r, c] of [
    [5, 9],
    [6, 8],
    [7, 7],
    [8, 6],
  ])
    b[r][c] = P1;
  return b;
}
function blockHalfOpenFour() {
  const b = emptyBoard();
  const r = 7;
  for (let c = 4; c <= 7; c++) b[r][c] = P2;
  return b;
}
function instantWinP1() {
  const b = emptyBoard();
  const r = 10;
  for (let c = 2; c <= 5; c++) b[r][c] = P1;
  return b;
}
function mustBlockLoss() {
  const b = emptyBoard();
  for (let c = 5; c <= 8; c++) b[3][c] = P2;
  b[10][10] = b[10][11] = b[10][12] = P1;
  return b;
}
function twoWinningCells() {
  const b = emptyBoard();
  for (let c = 1; c <= 4; c++) b[1][c] = P1;
  for (let r = 1; r <= 4; r++) b[r][13] = P1;
  return b;
}
function openFourVsOpenThree() {
  const b = emptyBoard();
  b[7][5] = b[7][6] = b[7][7] = P1;
  b[11][10] = b[11][11] = P1;
  return b;
}
function doubleThreatSimple() {
  const b = emptyBoard();
  b[7][7] = b[7][8] = P1;
  b[8][7] = b[8][8] = P1;
  b[6][6] = b[6][9] = P2;
  return b;
}
function midBoardPosition() {
  const b = emptyBoard();
  for (const [r, c] of [
    [6, 6],
    [6, 8],
    [8, 6],
    [8, 8],
    [7, 7],
  ])
    b[r][c] = (r + c) % 2 === 0 ? P1 : P2;
  return b;
}
function equivalentGoodMoves() {
  const b = emptyBoard();
  b[7][7] = P1;
  b[7][8] = b[7][6] = P2;
  return b;
}
function winSingleEmptyRow() {
  const b = emptyBoard();
  for (let c = 0; c <= 3; c++) b[7][c] = P1;
  for (let c = 5; c <= 14; c++) b[7][c] = P2;
  b[7][4] = EMPTY;
  return b;
}

const { b: drawB, emptyCell: drawEmpty, seed: drawSeed } = buildAlmostFullNoFiveOneEmpty();
const invBoard = invalidMovesSmallEmptyRegion();

const scenarios = [
  {
    Test_ID: "G1-R01",
    Group: "Luật & Engine",
    Board_State: horizWinP1(),
    Player_Turn: 1,
    Acceptable_Moves: [
      [7, 4],
      [7, 9],
    ],
    Expected_Priority: "Hoàn thành 5 quân liên tiếp theo hàng ngang (hai đầu hợp lệ).",
    "Pass/Fail": null,
  },
  {
    Test_ID: "G1-R02",
    Group: "Luật & Engine",
    Board_State: vertWinP1(),
    Player_Turn: 1,
    Acceptable_Moves: [
      [4, 7],
      [9, 7],
    ],
    Expected_Priority: "Thắng dọc với nước thứ 5 tại một trong hai đầu hở.",
    "Pass/Fail": null,
  },
  {
    Test_ID: "G1-R03",
    Group: "Luật & Engine",
    Board_State: diagMainWinP1(),
    Player_Turn: 1,
    Acceptable_Moves: [
      [4, 4],
      [9, 9],
    ],
    Expected_Priority: "Thắng chéo chính (đường chéo song song vector (1,1)).",
    "Pass/Fail": null,
  },
  {
    Test_ID: "G1-R04",
    Group: "Luật & Engine",
    Board_State: invBoard,
    Player_Turn: 1,
    Acceptable_Moves: legalEmptyCells(invBoard),
    Expected_Priority:
      "Chỉ chấp nhận ô trống; harness từ chối nước đặt trùng quân (invalid move).",
    "Pass/Fail": null,
  },
  {
    Test_ID: "G1-R05",
    Group: "Luật & Engine",
    Board_State: drawB,
    Player_Turn: 1,
    Acceptable_Moves: [drawEmpty],
    Expected_Priority: "Ô trống duy nhất; sau khi đánh bàn đầy và không có 5 liên tiếp — hòa.",
    "Pass/Fail": null,
  },
  {
    Test_ID: "G2-T01",
    Group: "Sinh tử chiến thuật",
    Board_State: blockHalfOpenFour(),
    Player_Turn: 1,
    Acceptable_Moves: [
      [7, 3],
      [7, 8],
    ],
    Expected_Priority: "Chặn Half-Open Four của đối thủ (hai điểm chặn năm liên tiếp).",
    "Pass/Fail": null,
  },
  {
    Test_ID: "G2-T02",
    Group: "Sinh tử chiến thuật",
    Board_State: instantWinP1(),
    Player_Turn: 1,
    Acceptable_Moves: [[10, 6]],
    Expected_Priority: "Nước thắng tức thì (năm ngang).",
    "Pass/Fail": null,
  },
  {
    Test_ID: "G2-T03",
    Group: "Sinh tử chiến thuật",
    Board_State: mustBlockLoss(),
    Player_Turn: 1,
    Acceptable_Moves: [
      [3, 4],
      [3, 9],
    ],
    Expected_Priority: "Ưu tiên chặn bốn quân địch sắp thành năm hơn tấn công xa.",
    "Pass/Fail": null,
  },
  {
    Test_ID: "G2-T04",
    Group: "Sinh tử chiến thuật",
    Board_State: twoWinningCells(),
    Player_Turn: 1,
    Acceptable_Moves: [
      [1, 0],
      [1, 5],
      [0, 13],
      [5, 13],
    ],
    Expected_Priority: "Không bỏ lỡ nước thắng tức thì (hai đường thắng độc lập).",
    "Pass/Fail": null,
  },
  {
    Test_ID: "G2-T05",
    Group: "Sinh tử chiến thuật",
    Board_State: openFourVsOpenThree(),
    Player_Turn: 1,
    Acceptable_Moves: [
      [7, 4],
      [7, 8],
    ],
    Expected_Priority:
      "Ưu tiên mở rộng ba quân giữa hàng 7 (tạo thế 4 liên tiếp hai đầu hở) hơn hàng 11 yếu.",
    "Pass/Fail": null,
  },
  {
    Test_ID: "G3-A01",
    Group: "Chiến thuật nâng cao",
    Board_State: diagAntiWinP1(),
    Player_Turn: 1,
    Acceptable_Moves: [
      [4, 10],
      [9, 5],
    ],
    Expected_Priority: "Thắng chéo phụ (đường cố định r+c).",
    "Pass/Fail": null,
  },
  {
    Test_ID: "G3-A02",
    Group: "Chiến thuật nâng cao",
    Board_State: doubleThreatSimple(),
    Player_Turn: 1,
    Acceptable_Moves: [
      [6, 7],
      [7, 6],
      [9, 8],
      [8, 9],
    ],
    Expected_Priority:
      "Ưu tiên nước tạo song công / đe dọa kép (một trong các nước lân cận khối 2x2).",
    "Pass/Fail": null,
  },
  {
    Test_ID: "G3-A03",
    Group: "Chiến thuật nâng cao",
    Board_State: midBoardPosition(),
    Player_Turn: 1,
    Acceptable_Moves: chebyshevCandidates(midBoardPosition(), 2),
    Expected_Priority:
      "Nước đi phải thuộc tập candidate Chebyshev<=2 quanh quân hiện có (theo spec AI).",
    "Pass/Fail": null,
  },
  {
    Test_ID: "G3-A04",
    Group: "Chiến thuật nâng cao",
    Board_State: winSingleEmptyRow(),
    Player_Turn: 1,
    Acceptable_Moves: [[7, 4]],
    Expected_Priority: "Một ô trống duy nhất trên hàng — hoàn thành 5 quân P1.",
    "Pass/Fail": null,
  },
  {
    Test_ID: "G3-A05",
    Group: "Chiến thuật nâng cao",
    Board_State: equivalentGoodMoves(),
    Player_Turn: 1,
    Acceptable_Moves: [
      [6, 7],
      [8, 7],
      [7, 5],
      [7, 9],
    ],
    Expected_Priority: "Đối xứng quanh trung tâm — chấp nhận bất kỳ nước trong tập tương đương.",
    "Pass/Fail": null,
  },
];

const out = {
  project: "AI Caro Engine",
  format_version: 1,
  board_legend: { 0: "empty", 1: "first_player", "-1": "second_player" },
  scenarios,
};

await import("node:fs/promises").then((fs) =>
  fs.writeFile(new URL("../scenarios/scenarios.json", import.meta.url), JSON.stringify(out, null, 2), "utf8"),
);

console.log("Wrote scenarios.json,", scenarios.length, "tests. G1-R05 empty:", drawEmpty, "seed:", drawSeed);