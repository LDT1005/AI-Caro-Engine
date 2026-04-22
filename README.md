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

---

## 📁 Cấu trúc thư mục

```txt
AI-CARO-ENGINE/
├── dist/                        
│   └── wasm/
│       ├── ai.wasm              
│       └── ai.js                
│
├── benchmark/                   
│   ├── benchmarkLogs.js
│   └── runner.js                
│
├── heuristic-qa/                
│   ├── heuristics/
│   │   └── weights.json         
│   ├── scenarios/
│   │   └── scenarios.json       
│   └── tools/
│       ├── generate_scenarios.py
│       └── explanations.txt     
│
├── src/                         
│   │
│   ├── ai-core/                 
│   │   ├── ai_core.cpp
│   │   └── ai_core.h
│   │
│   ├── engine-runtime/          
│   │   ├── game_engine.cpp      
│   │   ├── rules.cpp            
│   │   ├── wasm_bridge.cpp      
│   │   ├── runtime_guard.cpp    
│   │   └── workers/
│   │       └── ai-worker.js     
│   │
│   └── frontend-ui/             
│       ├── css/
│       │   └── main.css
│       ├── js/
│       │   ├── canvas-board.js  
│       │   ├── config.js
│       │   ├── ui-state.js      
│       │   ├── main.js
│       │   ├── ui.js
│       │   ├── worker-client.js
│       │   └── ai-adapter.js    
│       ├── workers/
│       │   └── mock-ai-worker.js 
│       └── index.html           
│
├── CMakeLists.txt
└── README.md