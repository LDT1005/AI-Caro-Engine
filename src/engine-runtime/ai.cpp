extern "C" {

int get_best_move(int* board) {
    for (int i = 0; i < 225; i++) {
        if (board[i] == 0) {
            return i;
        }
    }
    return -1;
}

}