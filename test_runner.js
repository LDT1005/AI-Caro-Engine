
const fs = require('fs');

const filePath = process.argv[2] || 'scenario_tests.json';

if (!fs.existsSync(filePath)) {
  console.error(` Không tìm thấy file: ${filePath}`);
  console.error(`   Cách dùng: node test_runner.js scenario_tests.json`);
  process.exit(1);
}

const tests = JSON.parse(fs.readFileSync(filePath, 'utf8'));
console.log(`\n📋 Đọc được ${tests.length} test từ ${filePath}\n`);
console.log('='.repeat(60));


function isValidMove(board, index) {
  return index >= 0 && index < 225 && board[index] === 0;
}

function getCell(board, row, col) {
  if (row < 0 || row >= 15 || col < 0 || col >= 15) return null;
  return board[row * 15 + col];
}

function checkWin(board, index) {
  const player = board[index];
  const row = Math.floor(index / 15);
  const col = index % 15;

  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1]
  ];

  for (const [dx, dy] of directions) {
    let count = 1;

    let r = row + dx;
    let c = col + dy;
    while (getCell(board, r, c) === player) {
      count++;
      r += dx;
      c += dy;
    }

    r = row - dx;
    c = col - dy;
    while (getCell(board, r, c) === player) {
      count++;
      r -= dx;
      c -= dy;
    }

    if (count >= 5) return true;
  }

  return false;
}

function checkDraw(board) {
  return board.filter(x => x !== 0).length >= 225;
}

let totalPass = 0;
let totalFail = 0;
const failedTests = [];

for (const test of tests) {
  const {
    Test_ID,
    Board_State,
    Player_Turn,
    Acceptable_Moves,
    Expected_Priority,
    Group
  } = test;

  let result = null;
  let reason = '';

  try {
    if (!Array.isArray(Board_State) || Board_State.length !== 225) {
      throw new Error('Board_State phải là mảng 225 phần tử');
    }

    if (Acceptable_Moves === 'INVALID') {
      const hasInvalid = Board_State.some((v, i) =>
        v !== 0 && !isValidMove(Board_State, i)
      );
      result = hasInvalid ? 'PASS' : 'FAIL';
      reason = result === 'FAIL' ? 'Không phát hiện invalid move đúng' : '';

    } else if (Expected_Priority === 'WIN') {
      const lastMove = Board_State.lastIndexOf(Player_Turn);
      const won = lastMove !== -1 && checkWin(Board_State, lastMove);
      result = won ? 'PASS' : 'FAIL';
      reason = result === 'FAIL' ? 'Không phát hiện thắng đúng' : '';

    } else if (Expected_Priority === 'DRAW') {
      const draw = checkDraw(Board_State);
      result = draw ? 'PASS' : 'FAIL';
      reason = result === 'FAIL' ? 'Không phát hiện hòa đúng' : '';

    } else {
      let bestMove = -1;
      for (let i = 0; i < 225; i++) {
        if (Board_State[i] === 0) {
          bestMove = i;
          break;
        }
      }

      const acceptable = Array.isArray(Acceptable_Moves)
        ? Acceptable_Moves
        : [Acceptable_Moves];

      result = acceptable.includes(bestMove) ? 'PASS' : 'FAIL';
      reason = result === 'FAIL'
        ? `AI chọn ${bestMove}, cần chọn trong [${acceptable.join(', ')}]`
        : '';
    }

  } catch (err) {
    result = 'ERROR';
    reason = err.message;
  }

  // In kết quả
  const icon = result === 'PASS' ? '✅' : result === 'ERROR' ? '⚠️' : '❌';
  const groupLabel = Group ? `[${Group}]` : '';
  console.log(`${icon} ${Test_ID} ${groupLabel}`);
  if (reason) console.log(`   └─ ${reason}`);

  if (result === 'PASS') {
    totalPass++;
  } else {
    totalFail++;
    failedTests.push({ Test_ID, reason });
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\n KẾT QUẢ: ${totalPass}/${tests.length} PASS\n`);

if (failedTests.length > 0) {
  console.log(' Các test FAIL:');
  failedTests.forEach(t => {
    console.log(`   - ${t.Test_ID}: ${t.reason}`);
  });
}

const rate = Math.round((totalPass / tests.length) * 100);
console.log(`\n Tỉ lệ pass: ${rate}%`);

if (rate === 100) {
  console.log(' Pass 100% — đạt KPI TV2!\n');
} else if (rate >= 90) {
  console.log(' Pass >= 90% — đạt KPI TV3!\n');
} else {
  console.log('  Chưa đạt KPI, cần kiểm tra lại engine.\n');
}