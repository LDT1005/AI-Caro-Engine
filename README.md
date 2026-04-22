 
> Hệ thống trí tuệ nhân tạo chơi cờ Caro đỉnh cao, sử dụng thuật toán Minimax và Alpha-Beta Pruning biên dịch qua WebAssembly.

[![C++](https://img.shields.io/badge/Language-C%2B%2B-00599C?style=flat-square&logo=c%2B%2B)](https://isocpp.org/)
[![WASM](https://img.shields.io/badge/Powered%20by-WebAssembly-654FF0?style=flat-square&logo=webassembly)](https://webassembly.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/Status-Development-yellow?style=flat-square)]()

---
## 🧐 Mục lục
1. [Giới thiệu](#-giới-thiệu)
2. [Tính năng nổi bật](#-tính-năng-nổi-bật)
3. [Luật chơi (Core Rules)](#-luật-chơi-core-rules)
4. [Kiến trúc AI & Tối ưu hóa](#-kiến-trúc-ai--tối-ưu-hóa)
5. [Tech Stack](#-tech-stack)
---

## 📖 Giới thiệu
Dự án tập trung vào việc xây dựng một **Core AI** mạnh mẽ cho trò chơi Caro 15x15. Trọng tâm của dự án là chứng minh khả năng tối ưu hóa thuật toán tìm kiếm (Minimax + Alpha-Beta), chất lượng hàm lượng giá Heuristic và khả năng thực thi hiệu năng cao trên trình duyệt thông qua công nghệ WebAssembly.

## ✨ Tính năng nổi bật
* **AI Thông minh:** Thuật toán Minimax kết hợp cắt tỉa Alpha-Beta mạnh mẽ.
* **Tối ưu hóa không gian:** *Candidate Move Generation* giới hạn vùng tìm kiếm trong bán kính Chebyshev <= 2.
* **Đa luồng (Multi-threading):** Chạy AI ngầm trên **Web Worker** để đảm bảo giao diện không bị treo (Non-blocking UI).
* **Benchmark Dashboard:** Hiển thị thời gian thực số lượng Node đã duyệt, thời gian xử lý và Heuristic score.
* **Local Win Check:** Kiểm tra thắng/hòa cục bộ từ nước đi mới nhất để đạt tốc độ xử lý tối ưu.

## ⚖️ Luật chơi (Core Rules)
* **Kích thước:** Bàn cờ cố định 15x15.
* **Điều kiện thắng:** Có từ 5 quân liên tiếp (ngang, dọc, chéo). Chấp nhận Overline, không xét chặn 2 đầu.
* **Điều kiện hòa:** Bàn cờ đầy (225 ô) mà không có bên thắng.
* **Đơn giản hóa:** Không áp dụng luật Renju hay luật Caro Việt Nam truyền thống.

## 🧠 Kiến trúc AI & Tối ưu hóa
* **Iterative Deepening:** Tìm kiếm theo độ sâu tăng dần. Nếu hết thời gian, AI trả về kết quả tốt nhất của Depth hoàn chỉnh gần nhất.
* **Timeout Control:** Giới hạn mỗi lượt suy nghĩ tối đa **2000ms**.
* **Alpha-Beta Pruning:** Mục tiêu cắt tỉa >= 60% số lượng Node so với Minimax thuần túy.

## 🛠 Tech Stack
* **Core AI:** C++ (Standard 17)
* **Bridge:** Emscripten (WebAssembly)
* **Frontend:** HTML5, CSS3, JavaScript (ES6)
* **Threading:** Web Workers API
"
AI-CARO-ENGINE/
├── dist/                        # 📦 [MỚI] Build Artifacts
│   └── wasm/
│       ├── ai.wasm              # File biên dịch cuối cùng do TV2 tạo ra
│       └── ai.js                # Glue code Emscripten
│
├── benchmark/                   # 📊 [TV4] Đưa ra khỏi src (Tooling/Pipeline)
│   ├── benchmarkLogs.js
│   └── runner.js                # Script chạy auto
│
├── heuristic-qa/                # 🧪 [TV3] Đưa ra khỏi src & Quy chuẩn form
│   ├── heuristics/
│   │   └── weights.json         # Bảng trọng số (hoặc .h tùy TV1/TV3 chốt)
│   ├── scenarios/
│   │   └── scenarios.json       # 15 tests chuẩn
│   └── tools/
│       ├── generate_scenarios.py
│       └── explanations.txt     # Giải thích logic cho báo cáo
│
├── src/                         # 💻 SOURCE CODE CHÍNH
│   │
│   ├── ai-core/                 # 🧑‍💻 [TV1] Lõi Thuật Toán
│   │   ├── ai_core.cpp
│   │   └── ai_core.h
│   │
│   ├── engine-runtime/          # 🧑‍💻 [TV2] Tích Hợp & Game Logic
│   │   ├── game_engine.cpp      # Quản lý luồng game
│   │   ├── rules.cpp            # Local check thắng/hòa
│   │   ├── wasm_bridge.cpp      # Cầu nối C++ và Emscripten
│   │   ├── runtime_guard.cpp    # Bảo vệ timeout, chống crash
│   │   └── workers/
│   │       └── ai-worker.js     # 🎯 TRẢ VỀ TV2: TV2 sở hữu lifecycle worker thật
│   │
│   └── frontend-ui/             # 🧑‍💻 [TV5 - BẠN] Giao Diện & Điều Phối
│       ├── css/
│       │   └── main.css
│       ├── js/
│       │   ├── canvas-board.js  # Render đồ họa
│       │   ├── config.js
│       │   ├── ui-state.js      # 🎯 ĐỔI TÊN: Nhấn mạnh đây chỉ là View State
│       │   ├── main.js
│       │   ├── ui.js
│       │   ├── worker-client.js
│       │   └── ai-adapter.js    # Bọc giao tiếp giữa UI và Worker (Mock/Thật)
│       ├── workers/
│       │   └── mock-ai-worker.js # TV5 chỉ sở hữu Mock
│       └── index.html           # File load các script JS (trỏ tới dist/wasm khi chạy thật)
│
├── CMakeLists.txt
└── README.md
