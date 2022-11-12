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
const keyLayout_y = [6,5,6,5,6,6,5,6,5,6,5,6,6];



//ピアノ定義
const KEY_SCALE       = 12;

const id2Root = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"
              ,"C","D♭","D","E♭","E","F","G♭","G","A♭","A"];
const CHORD_TYPE = ["","m","7","sus4","m7","M7"];
const COMPOSITION = {
  m:[0,3,7],
  7:[0,4,7,10] 
}
const TUNE = 442;
const COLOR_WHITE = '#fff';
const COLOR_BLACK = '#000';
const COLOR_PRESSED_WHITE = '#a00';
const COLOR_PRESSED_BLACK = '#a00';
const SOUND_KEEP = 100; //鳴る時間


//ゲーム関係
const TYPE_LIMIT = 3; //CHORD_TYPE.length; //難易度調整に
const QUESTION_NUM    = 5;
const TIME_LIMIT = 10; //秒数制限でのスコアアタックにしたい



