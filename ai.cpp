#include <stdint.h>  // Thêm header cho int32_t

extern "C" {

// Sửa int* → int32_t* để khớp chuẩn bridge đã chốt với TV1
// Sửa int → int32_t cho return type
int32_t get_best_move(int32_t* board) {

    // Placeholder — TV1thay thế AI thật
    for (int i = 0; i < 225; i++) {
        if (board[i] == 0) {
            return i;
        }
    }
    return -1;
}

}