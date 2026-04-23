#include <iostream>
#include <cmath>
#include <algorithm>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

using namespace std;

const int BOARD_SIZE=15;
const int EMPTY=0;

struct AIMove{
    int row;
    int col;
    long score;
    long nodes_evaluated;
    float time_ms;
    bool is_timeout;
    int depth_reached;
};

AIMove result;

/* ================= COUNT LINE ================= */

int count_line(
    int board[15][15],
    int r,int c,
    int dr,int dc,
    int player,
    int& blocks
){

    int cnt=1;
    blocks=0;

    int nr=r+dr;
    int nc=c+dc;

    while(
        nr>=0&&nr<15&&
        nc>=0&&nc<15&&
        board[nr][nc]==player
    ){
        cnt++;
        nr+=dr;
        nc+=dc;
    }

    if(
        nr<0||nr>=15||
        nc<0||nc>=15||
        board[nr][nc]!=0
    ) blocks++;

    nr=r-dr;
    nc=c-dc;

    while(
        nr>=0&&nr<15&&
        nc>=0&&nc<15&&
        board[nr][nc]==player
    ){
        cnt++;
        nr-=dr;
        nc-=dc;
    }

    if(
        nr<0||nr>=15||
        nc<0||nc>=15||
        board[nr][nc]!=0
    ) blocks++;

    return cnt;
}

/* ================= NEAR CHECK ================= */

bool is_near_piece(
    int board[15][15],
    int r,int c
){

    for(int i=max(0,r-2);i<=min(14,r+2);i++)
    for(int j=max(0,c-2);j<=min(14,c+2);j++)
        if(board[i][j]!=0)
            return true;

    return false;
}

/* ================= FORCED ================= */

bool find_forced_move(
    int board[15][15],
    int player,
    int& r,
    int& c
){

    int opponent=(player==1)?2:1;

    int dr[]={1,0,1,1};
    int dc[]={0,1,1,-1};

    int best_score=-1;

    for(int i=0;i<15;i++)
    for(int j=0;j<15;j++){

        if(board[i][j]!=0) continue;

        int blocks=0;

        /* WIN NOW */

        board[i][j]=player;

        for(int d=0;d<4;d++){

            int cnt=count_line(
                board,i,j,
                dr[d],dc[d],
                player,
                blocks
            );

            if(cnt>=5){

                board[i][j]=0;

                r=i;
                c=j;

                return true;
            }
        }

        board[i][j]=0;

        /* BLOCK */

        board[i][j]=opponent;

        int threat_score=0;

        for(int d=0;d<4;d++){

            int cnt=count_line(
                board,i,j,
                dr[d],dc[d],
                opponent,
                blocks
            );

            if(cnt>=5)
                threat_score+=1000;

            else if(cnt==4&&blocks<=1)
                threat_score+=300;

            else if(cnt==3&&blocks==0)
                threat_score+=80;
        }

        board[i][j]=0;

        if(threat_score>best_score){

            best_score=threat_score;
            r=i;
            c=j;
        }
    }

    if(best_score>0)
        return true;

    return false;
}

/* ================= EVALUATE ================= */

int evaluate_position(
    int board[15][15],
    int r,int c,
    int player
){

    int opponent=(player==1)?2:1;

    int dr[]={1,0,1,1};
    int dc[]={0,1,1,-1};

    int score=0;

    int blocks=0;

    board[r][c]=player;

    for(int d=0;d<4;d++){

        int cnt=count_line(
            board,r,c,
            dr[d],dc[d],
            player,
            blocks
        );

        if(cnt>=5) score+=10000;

        else if(cnt==4&&blocks==0)
            score+=2000;

        else if(cnt==4&&blocks==1)
            score+=800;

        else if(cnt==3&&blocks==0)
            score+=300;
    }

    board[r][c]=EMPTY;

    board[r][c]=opponent;

    for(int d=0;d<4;d++){

        int cnt=count_line(
            board,r,c,
            dr[d],dc[d],
            opponent,
            blocks
        );

        if(cnt>=5) score+=9000;

        else if(cnt==4&&blocks<=1)
            score+=1500;

        else if(cnt==3&&blocks==0)
            score+=200;
    }

    board[r][c]=EMPTY;

    score+=100-(abs(r-7)+abs(c-7));

    return score;
}

/* ================= BEST MOVE ================= */

void simple_best_move(
    int board[15][15],
    int player,
    int& br,
    int& bc
){

    int best=-999999;

    for(int r=0;r<15;r++)
    for(int c=0;c<15;c++){

        if(board[r][c]!=0) continue;

        if(!is_near_piece(board,r,c))
            continue;

        int s=evaluate_position(
            board,r,c,player
        );

        if(s>best){

            best=s;
            br=r;
            bc=c;
        }
    }
}

/* ================= MAIN ================= */

extern "C" {

EMSCRIPTEN_KEEPALIVE
AIMove* get_best_move(
    int* flat,
    int player,
    int depth,
    int timeout_ms,
    bool use_ab
){

    int board[15][15];

    for(int r=0;r<15;r++)
    for(int c=0;c<15;c++)
        board[r][c]=flat[r*15+c];

    int br=7,bc=7;

    if(find_forced_move(
        board,
        player,
        br,
        bc
    )){

        result.row=br;
        result.col=bc;
        return &result;
    }

    simple_best_move(
        board,
        player,
        br,
        bc
    );

    result.row=br;
    result.col=bc;

    return &result;
}

/* EXPORTS */

EMSCRIPTEN_KEEPALIVE int get_move_row(){return result.row;}
EMSCRIPTEN_KEEPALIVE int get_move_col(){return result.col;}
EMSCRIPTEN_KEEPALIVE long get_nodes(){return 0;}
EMSCRIPTEN_KEEPALIVE long get_move_score(){return 0;}
EMSCRIPTEN_KEEPALIVE float get_time_ms(){return 0;}
EMSCRIPTEN_KEEPALIVE bool get_is_timeout(){return false;}
EMSCRIPTEN_KEEPALIVE int get_depth_reached(){return 0;}

}