const fs = require('fs');

const Module = require('./ai.js');

/* ===============================
   WAIT FOR WASM READY
================================ */

function waitForWasmReady() {
  return new Promise(resolve => {
    if (Module.calledRun) {
      resolve();
    } else {
      Module.onRuntimeInitialized = () => {
        resolve();
      };
    }
  });
}

/* ===============================
   UTILS
================================ */

function flattenBoard(board2D) {
  return board2D.flat();
}

function rcToIndex(row, col) {
  return row * 15 + col;
}

function indexToRC(index) {
  return [
    Math.floor(index / 15),
    index % 15
  ];
}

/* ===============================
   CONFIG
================================ */

const DEPTH = 5;
const TIMEOUT = 2000;
const USE_ALPHA_BETA = 1;

/* ===============================
   CALL WASM AI (FIXED VERSION)
================================ */

function getBestMoveFromEngine(
  board,
  playerTurn
) {

  const ptr =
    Module._malloc(
      board.length * 4
    );

  try {

   

    const intBoard =
      new Int32Array(board);

    Module.HEAP32.set(
      intBoard,
      ptr >> 2
    );

   

    Module._get_best_move(
      ptr,
      playerTurn | 0,
      DEPTH | 0,
      TIMEOUT | 0,
      USE_ALPHA_BETA | 0
    );

    

    const row =
      Module._get_move_row() | 0;

    const col =
      Module._get_move_col() | 0;

    

    if (
      row < 0 || row >= 15 ||
      col < 0 || col >= 15
    ) {

      console.warn(
        ' AI trả move không hợp lệ:',
        row,
        col
      );

      return -1;

    }

    return rcToIndex(
      row,
      col
    );

  }
  finally {

    Module._free(ptr);

  }

}

/* ===============================
   MAIN
================================ */

async function runTests() {

  await waitForWasmReady();

  const filePath =
    process.argv[2] || 'scenarios.json';

  if (!fs.existsSync(filePath)) {

    console.error(
      ` Không tìm thấy file: ${filePath}`
    );

    process.exit(1);

  }

  const raw =
    JSON.parse(
      fs.readFileSync(
        filePath,
        'utf8'
      )
    );

  const tests =
    raw.scenarios;

  console.log(
    `\n Đọc được ${tests.length} test\n`
  );

  console.log('='.repeat(60));

  let totalPass = 0;

  const failedTests = [];

  for (const test of tests) {

    const {
      Test_ID,
      Board_State,
      Player_Turn,
      Acceptable_Moves,
      Group
    } = test;

    let result = null;
    let reason = '';

    try {

      let board =
        flattenBoard(Board_State);

      if (board.length !== 225) {

        throw new Error(
          'Board phải có 225 ô'
        );

      }

      const acceptableIndices =
        Acceptable_Moves.map(
          ([r,c]) =>
            rcToIndex(r,c)
        );

      const bestMove =
        getBestMoveFromEngine(
          board,
          Player_Turn
        );

      if (
        acceptableIndices.includes(
          bestMove
        )
      ) {

        result = 'PASS';

      }
      else {

        const [r,c] =
          indexToRC(bestMove);

        result = 'FAIL';

        reason =
          `AI chọn (${r},${c}) ` +
          `không nằm trong ` +
          `[${acceptableIndices.join(', ')}]`;

      }

    }
    catch (err) {

      result = 'ERROR';

      reason = err.message;

    }

    const icon =
      result === 'PASS'
        ? '✅'
        : result === 'ERROR'
        ? '⚠️'
        : '❌';

    const groupLabel =
      Group
        ? `[${Group}]`
        : '';

    console.log(
      `${icon} ${Test_ID} ${groupLabel}`
    );

    if (reason) {

      console.log(
        `   └─ ${reason}`
      );

    }

    if (result === 'PASS') {

      totalPass++;

    }
    else {

      failedTests.push({
        Test_ID,
        reason
      });

    }

  }

  console.log(
    '\n' + '='.repeat(60)
  );

  console.log(
    `\n KẾT QUẢ: ` +
    `${totalPass}/${tests.length} PASS\n`
  );

  if (failedTests.length > 0) {

    console.log(' Các test FAIL:');

    failedTests.forEach(t => {

      console.log(
        `   - ${t.Test_ID}: ${t.reason}`
      );

    });

  }

  const rate =
    Math.round(
      (totalPass / tests.length) * 100
    );

  console.log(
    `\n Tỉ lệ pass: ${rate}%`
  );

}

runTests();