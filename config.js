//画面関係

 SCREEN_WIDTH    = 640;
const SCREEN_HEIGHT   = 960;
const BOARD_PADDING   = 5;

const WHITEKEY_WIDTH = SCREEN_WIDTH /10; //白鍵の数
const BLACKLEY_WIDTH = SCREEN_WIDTH / 10 - 10; //若干小さく
const WHITEKEY_HEIGHT= 345;
const BLACKKEY_HEIGHT= 190;

const BOARD_SIZE      = SCREEN_WIDTH - BOARD_PADDING*2;
const BOARD_OFFSET_X  = BOARD_PADDING+40;

const numbers = [0,2,4,5,7,9,11,12,1,3,6,8,10]; //白鍵を先に配置
const whitekeys = [0,2,4,5,7,9,11,12];
const keyLayout_x = [0,1,2,3,4,6,7,8,9,10,11,12,14];
const keyLayout_y = [4,3,4,3,4,4,3,4,3,4,3,4,4];



//ピアノ定義
const KEY_SCALE       = 12;

const id2Root = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"
              ,"C","D♭","D","E♭","E","F","G♭","G","A♭","A"];
const CHORD_TYPE = ["","m","7","sus4","m7","M7","aug","dim","mM7","sus2","add9","6","m6"];
const COMPOSITION = {
  m:[0,3,7],
  7:[0,4,7,10],
  sus4:[0,5,7],
  m7:[0,3,7,10],
  M7:[0,4,7,11],
  aug:[0,4,8],
  dim:[0,3,6],
  mM7:[0,3,7,11],
  sus2:[0,2,7],
  add9:[0,2,4,7],
  6:[0,4,7,9],
  m6:[0,3,7,9]
}
const TUNE = 440;
const COLOR_WHITE = '#fff';
const COLOR_BLACK = '#000';
const COLOR_PRESSED_WHITE = '#a00';
const COLOR_PRESSED_BLACK = '#a00';
const SOUND_KEEP = 100; //鳴る時間
var sound_vol = 0.1;

//ゲーム関係

var DIFFICULTY = -1; //0:easy,1;normal,2:hard
const TYPE_LIMIT = [2,6,CHORD_TYPE.length]; //difficultyに対応
const TIME_LIMIT = 15; //秒数制限でのスコアアタックにしたい

const score_dif_coef = [1.0, 1.5, 2.0];
const score_per_q = 1200;
var isPPmode = false; //is PerfectPitch mode

const evalScore_init = 1000;
const evalScore_rank = 1000;

const msgList = ["かけだしコードニスト"
            ,"指が慣れてきた"
            ,"一人前のコード知識"
            ,"クセになってんだ、構成音考えるの"
            ,"構成音の申し子"
            ,"コード完全に理解した"
            ,"コードマニア"
            ,"コードは友達"
            ,"親の顔より見たコード"
            ,"洗練された理解力"
            ,"もはや自分自身がコード"
            ,"人智を超えた構成音力"
            ,"コード界の神"]