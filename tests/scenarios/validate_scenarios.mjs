import fs from "node:fs";
import path from "node:path";

const SCENARIO_PATH = path.resolve("d:/AI_CaroAI_Project/AI-Caro-Engine/tests/scenarios/scenarios.json");
const raw = fs.readFileSync(SCENARIO_PATH, "utf8");
const data = JSON.parse(raw);

const errors = [];

function assert(cond, msg) {
  if (!cond) errors.push(msg);
}

function createsFiveAt(board, r, c, player) {
  for (const [dr, dc] of [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]) {
    let cnt = 1;
    let nr = r + dr;
    let nc = c + dc;
    while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && board[nr][nc] === player) {
      cnt++;
      nr += dr;
      nc += dc;
    }
    nr = r - dr;
    nc = c - dc;
    while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && board[nr][nc] === player) {
      cnt++;
      nr -= dr;
      nc -= dc;
    }
    if (cnt >= 5) return true;
  }
  return false;
}

function emptyCells(board) {
  const out = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (board[r][c] === 0) out.push([r, c]);
    }
  }
  return out;
}

assert(data.project === "AI Caro Engine", "project phải là 'AI Caro Engine'");
assert(Array.isArray(data.scenarios), "scenarios phải là mảng");
assert(data.scenarios.length === 15, "Phải có đúng 15 scenario");

const requiredFields = ["Test_ID", "Group", "Board_State", "Player_Turn", "Acceptable_Moves", "Expected_Priority", "Pass/Fail"];
const ids = new Set();
const groupCount = new Map();

for (const s of data.scenarios ?? []) {
  for (const field of requiredFields) {
    assert(Object.hasOwn(s, field), `Thiếu field '${field}' ở ${s.Test_ID ?? "unknown"}`);
  }

  assert(!ids.has(s.Test_ID), `Trùng Test_ID: ${s.Test_ID}`);
  ids.add(s.Test_ID);

  groupCount.set(s.Group, (groupCount.get(s.Group) ?? 0) + 1);

  const b = s.Board_State;
  assert(Array.isArray(b) && b.length === 15, `${s.Test_ID}: Board_State phải có 15 hàng`);
  for (let r = 0; r < 15; r++) {
    assert(Array.isArray(b[r]) && b[r].length === 15, `${s.Test_ID}: hàng ${r} không đủ 15 cột`);
    for (let c = 0; c < 15; c++) {
      assert([-1, 0, 1].includes(b[r][c]), `${s.Test_ID}: giá trị ô [${r},${c}] không hợp lệ`);
    }
  }

  assert(s.Player_Turn === 1 || s.Player_Turn === -1, `${s.Test_ID}: Player_Turn chỉ được 1 hoặc -1`);
  assert(Array.isArray(s.Acceptable_Moves), `${s.Test_ID}: Acceptable_Moves phải là mảng tọa độ`);
  for (const mv of s.Acceptable_Moves) {
    assert(Array.isArray(mv) && mv.length === 2, `${s.Test_ID}: move không đúng format [r,c]`);
    if (!Array.isArray(mv) || mv.length !== 2) continue;
    const [r, c] = mv;
    assert(Number.isInteger(r) && Number.isInteger(c), `${s.Test_ID}: tọa độ phải là số nguyên`);
    assert(r >= 0 && r < 15 && c >= 0 && c < 15, `${s.Test_ID}: tọa độ ngoài bàn ${r},${c}`);
    assert(s.Board_State[r][c] === 0, `${s.Test_ID}: Acceptable_Move ${r},${c} không phải ô trống`);
  }
}

assert(groupCount.get("Luật & Engine") === 5, "Nhóm 'Luật & Engine' phải có 5 case");
assert(groupCount.get("Sinh tử chiến thuật") === 5, "Nhóm 'Sinh tử chiến thuật' phải có 5 case");
assert(groupCount.get("Chiến thuật nâng cao") === 5, "Nhóm 'Chiến thuật nâng cao' phải có 5 case");

// Check đặc biệt theo tài liệu
const byId = new Map(data.scenarios.map((s) => [s.Test_ID, s]));

const r04 = byId.get("G1-R04");
if (r04) {
  const expectedEmpty = emptyCells(r04.Board_State).map((x) => JSON.stringify(x));
  const actualMoves = r04.Acceptable_Moves.map((x) => JSON.stringify(x));
  assert(expectedEmpty.length === actualMoves.length, "G1-R04: Acceptable_Moves phải bằng đúng tập ô trống");
  for (const m of expectedEmpty) {
    assert(actualMoves.includes(m), `G1-R04: thiếu ô trống ${m} trong Acceptable_Moves`);
  }
}

const r05 = byId.get("G1-R05");
if (r05) {
  const empties = emptyCells(r05.Board_State);
  assert(empties.length === 1, "G1-R05: board phải có đúng 1 ô trống");
  assert(r05.Acceptable_Moves.length === 1, "G1-R05: Acceptable_Moves phải có đúng 1 nước");
  if (empties.length === 1 && r05.Acceptable_Moves.length === 1) {
    const [er, ec] = empties[0];
    const [ar, ac] = r05.Acceptable_Moves[0];
    assert(er === ar && ec === ac, "G1-R05: Acceptable_Move phải trùng ô trống duy nhất");
    const cloned = r05.Board_State.map((row) => [...row]);
    cloned[er][ec] = 1;
    assert(!createsFiveAt(cloned, er, ec, 1), "G1-R05: sau khi đi nước cuối, không được tạo 5 liên tiếp");
  }
}

if (errors.length > 0) {
  console.error("SCENARIO VALIDATION FAILED");
  for (const err of errors) console.error("-", err);
  process.exit(1);
}

console.log("SCENARIO VALIDATION PASSED");
console.log("- Tổng số test:", data.scenarios.length);
console.log("- Phân nhóm:", Object.fromEntries(groupCount.entries()));
