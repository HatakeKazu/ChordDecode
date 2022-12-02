//画面関係

const SCREEN_HEIGHT   = window.innerHeight; //960
const SCREEN_WIDTH    =  SCREEN_HEIGHT*2 / 3; //640;
const BOARD_PADDING   = 0;

const WHITEKEY_WIDTH = SCREEN_WIDTH /10; //白鍵の数
const BLACKKEY_WIDTH = (SCREEN_WIDTH / 10) * 0.85 ; //若干小さく
const WHITEKEY_HEIGHT= WHITEKEY_WIDTH * 5;
const BLACKKEY_HEIGHT= WHITEKEY_HEIGHT * 0.5;

const HUCHI = 8;
const KEYBOARD_OFFSET_X = WHITEKEY_WIDTH * 0.2; //白鍵何個分でオフセット
const KEYBOARD_OFFSET_Y = SCREEN_HEIGHT / 3;
const BLACK_OFFSET_1ST = WHITEKEY_WIDTH / 1.5;
const BLACK_OFFSET_2ND = 1.8 * WHITEKEY_WIDTH;

const BOARD_SIZE      = SCREEN_WIDTH - BOARD_PADDING*2;
const BOARD_OFFSET_X  = BOARD_PADDING+40;

const FONTSIZE_L = SCREEN_WIDTH * 0.13;
const FONTSIZE_ML = SCREEN_WIDTH * 0.10;
const FONTSIZE_M = SCREEN_WIDTH * 0.07;
const FONTSIZE_MS = SCREEN_WIDTH * 0.05;
const FONTSIZE_S = SCREEN_WIDTH * 0.04;


const BTNSIZE_L_W = SCREEN_WIDTH * 0.6;
const BTNSIZE_L_H = BTNSIZE_L_W * 9 / 16;
const BTNSIZE_M_W = SCREEN_WIDTH * 0.4;
const BTNSIZE_M_H = BTNSIZE_M_W * 9 / 16;
const BTNSIZE_S_W = SCREEN_WIDTH * 0.2;
const BTNSIZE_S_H = BTNSIZE_S_W * 12 / 16;

const numbers = [0,2,4,5,7,9,11,12,1,3,6,8,10]; //白鍵を先に配置
const whitekeys = [0,2,4,5,7,9,11,12];

var KeysPosition_x = []; //positon[i]は0=cとする通し番号iの配置場所 ex)0と2が隣同士
var KeysPosition_y = [];

//配置場所作成のための一時的なカウント　どこまで置いたか
var _cnt_whitekey = 0;
var _cnt_blackkey = 0;

for (let i = 0; i < 13; i++) {//左から右へ
  if(whitekeys.includes(i)){
    KeysPosition_x.push(KEYBOARD_OFFSET_X + _cnt_whitekey*(WHITEKEY_WIDTH + HUCHI));
    KeysPosition_y.push(KEYBOARD_OFFSET_Y);
    _cnt_whitekey += 1;
  }else{
    KeysPosition_y.push(KEYBOARD_OFFSET_Y);
    if(i<4){
      KeysPosition_x.push(KEYBOARD_OFFSET_X + BLACK_OFFSET_1ST + _cnt_blackkey*(WHITEKEY_WIDTH + HUCHI));
    
    }else{
      KeysPosition_x.push(KEYBOARD_OFFSET_X + BLACK_OFFSET_2ND + _cnt_blackkey*(WHITEKEY_WIDTH + HUCHI));
    }
    
    _cnt_blackkey += 1;
  }
  
}

const BG_COLOR_BASIC = 'hsl(200, 80%, 64%)';
const BG_COLOR_PP = 'rgba(200, 24, 24, 1.0)';
const BG_COLOR_TITLE = 'hsl(200, 80%, 64%)';

const FILL_COLOR_BASIC = 'rgba(200, 24, 24, 1.0)';
const FILL_COLOR_PP = 'hsl(200, 80%, 64%)';

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
const SOUND_KEEP_SEC = 0.15; //鳴る時間
var SOUND_VOLUME = 0.15;
const FADE_OUT_SEC = 0.2;

//ゲーム関係

var DIFFICULTY = -1; //0:easy,1;normal,2:hard
const TYPE_LIMIT_BEGIN=[0,0,5];
const TYPE_LIMIT_END = [2,6,CHORD_TYPE.length]; //difficultyに対応
const TIME_LIMIT_BASE = 20;
var TIME_LIMIT = -1; //秒数制限でのスコアアタックにしたい

const score_dif_coef = [1.0, 1.5, 2.0];
const score_per_q = 1200;
var isPPmode = 0>1; //is PerfectPitch mode

const evalScore_init = 1000;
const evalScore_rank = 2000;

const score_top30 = 3000;
const score_top60 = 2000;
const score_top90 = 1000;
const POPULATION = 7948838848;
const STR_POPULATION = '7,948,838,848';

const msgList = ["かけだしコードニスト"
            ,"指が慣れてきた"
            ,"一人前のコード知識"
            ,"構成音を考えるのがクセ"
            ,"構成音の申し子"
            ,"コード完全に理解した"
            ,"コードマニア"
            ,"コードがわかるってコト？"
            ,"3度の飯よりコード"
            ,"コードは友達"
            ,"親の顔より見たコード"
            ,"洗練された理解力"
            ,"もはや自身がコード"
            ,"人智を超えた構成音力"
            ,"コード界の神"]