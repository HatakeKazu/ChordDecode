/*
 * Runstant
 * 思いたったらすぐ開発. プログラミングに革命を...
 */

phina.globalize();

var SCREEN_WIDTH    = 640;
var SCREEN_HEIGHT   = 960;
var BOARD_PADDING   = 5;

var WHITEKEY_WIDTH = SCREEN_WIDTH /10; //白鍵の数
var BLACKLEY_WIDTH = SCREEN_WIDTH / 10 - 10; //若干小さく

var BOARD_SIZE      = SCREEN_WIDTH - BOARD_PADDING*2;
var BOARD_OFFSET_X  = BOARD_PADDING+40;

var KEY_SCALE       = 12;
var QUESTION_NUM    = 5;
var id2Root = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"
              ,"C","D♭","D","E♭","E","F","G♭","G","A♭","A"];
var CHORD_TYPE = ["","m","7","sus4","m7","M7"];
var COMPOSITION = {
  m:[0,3,7],
  7:[0,4,7,10] 
}
var TYPE_LIMIT = 3; //CHORD_TYPE.length; //難易度調整に

function id2keybit(id){
  return Math.pow(2,id%KEY_SCALE);
}

function calcKey_Bit(root_id, chord_type_num){
  var ret = 0;
  if(CHORD_TYPE[chord_type_num] in COMPOSITION){
    var compos = COMPOSITION[CHORD_TYPE[chord_type_num]];
    compos.forEach(function(element){
      ret += id2keybit((root_id + element)%KEY_SCALE);
    });
  }else{
    //純粋なトライアドのメジャーコード
    var compos = [0,4,7];
    compos.forEach(function(element){
      ret += id2keybit((root_id + element)%KEY_SCALE);
    });
  }
  return ret;
}

function nextChord(chord_dict){
  /*
  テーマ和音を選択、現状とは被らせたくないので今の和音を渡す
  和音はrootと和音種類の組み合わせ
  */
  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  var _pre_root = chord_dict.root;
  var _root = getRandomInt(id2Root.length);
  var _root2id = _root % 12;
  while(_root2id == _pre_root){//前回と同じ根音は避ける
    _root = getRandomInt(id2Root.length);
    _root2id = _root % 12;
  }
  var _type_num = getRandomInt(TYPE_LIMIT);
  return {
    name:id2Root[_root] + CHORD_TYPE[_type_num],
    key_bit:calcKey_Bit(_root2id,_type_num),
    root:_root2id,
    type:_type_num
  };
}
phina.define("MainScene", {
  superClass: 'DisplayScene',

  init: function() {
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });

    this.currentCorrectAnsNum = 0;

    this.group = DisplayElement().addChildTo(this);
    var gridX = Grid(BOARD_SIZE, 16);
    var gridY = Grid(BOARD_SIZE, 8);
    var self = this;

    var numbers = [0,2,4,5,7,9,11,12,1,3,6,8,10]; //白鍵を先に配置
    const whitekeys = [0,2,4,5,7,9,11,12];
    const keyLayout_x = [0,1,2,3,4,6,7,8,9,10,11,12,14];
    const keyLayout_y = [6,5,6,5,6,6,5,6,5,6,5,6,6];
    
    this.keyButtons = [];//後々push
    /*
    ■鍵盤の表現について

    1.id
    c = 0, c# = 1, d = 2,　... b = 11, c2=12 (cはどちらでも)
    
    2.処理用の固有数値（以降key_bitと呼ぶ）
    c = 1, c# = 2, d = 4,  ... b = 2048, c2 = 1
    ただしメンバーとして持つわけではなく、都度idから計算する（pow(2,id%12))
    
    3.和音の表現
    使う音のkey_bitの和で表現する
    Cm = {c,e,g} = 1 + 16 + 128 = 145

    4.正誤判定
    現在の状態も和音の表現と同様に管理し、テーマ和音と==で判定
    押されたらkey_bitを足し、inactiveになったら引く

    和音情報を受け渡すときは
    {
      name:"Cm",
      key_bit:145,
      root:0,
      type:1
    }
    の形で渡すこと(chord_dict)
    */
    
    
    var currentChord_key_bit = -1;
    var currentChord_name = "none";
    var currentChord_root = -1;
    var currentChord_type = -1;
    this.user_key_bit = 0;
    
    var firstChord = {name:currentChord_name,
                    key_bit:currentChord_key_bit,
                    root:currentChord_root,
                    type:currentChord_type};
    
    this._tmpChord = nextChord(firstChord);
    this.currentChord_key_bit = this._tmpChord.key_bit;
    
    this._keyUpdate = false; //1個押されたら次のフレームまで他は発火させない

    var question = Label('Xm').addChildTo(this);
    question.setPosition(this.gridX.span(2), this.gridY.span(2));
    question.text = this._tmpChord.name;
    this.question = question;

    var bit_db = Label(-1).addChildTo(this);
    bit_db.setPosition(this.gridX.span(3), this.gridY.span(3));
    bit_db.text = this.user_key_bit;
    this.bit_db = bit_db;
    arr = [];

    numbers.each(function(index, i) { //index = 中身 i = enumerate的なやつ
      // グリッド上でのインデックス
      var xIndex = keyLayout_x[index];
      var yIndex = keyLayout_y[index];
      var col = '#000';
      var height = 180;
      var width = BLACKLEY_WIDTH;
      if(whitekeys.includes(index)){
        col = '#fff';
        height = 300;
        width = WHITEKEY_WIDTH;
      }
      var p = Piano_key(index,col,width,height).addChildTo(self.group);
      arr.push(p);
      p.x = gridX.span(xIndex)+BOARD_OFFSET_X;
      p.y = gridY.span(yIndex)+150;

      p.onpointstart = function() {
        if(!self._keyUpdate){
          self.check(this);
          self._keyUpdate = true;
        }
        
      };
      
      //p.appear();
    });
    this.keyButtons = arr;

    // タイマーラベルを生成
    var timerLabel = Label('0').addChildTo(this);
    timerLabel.origin.x = 1;
    timerLabel.x = 580;
    timerLabel.y = 130;
    timerLabel.fill = '#444';
    timerLabel.fontSize = 10;
    // timerLabel.align = 'right';
    timerLabel.baseline = 'bottom';
    this.timerLabel = timerLabel;

    this.time = 0;

    this.onpointstart = function(e) {
      var p = e.pointer;
      var wave = Wave().addChildTo(this);
      wave.x = p.x;
      wave.y = p.y;
    };
  },


  onenter: function() {
    var scene = CountScene({
      backgroundColor: 'rgba(100, 100, 100, 1)',
      count: ['Ready'],
      fontSize: 100,
    });
    this.app.pushScene(scene);
  },

  update: function(app) {
    // タイマーを更新
    this.time += app.ticker.deltaTime;
    var sec = this.time/1000; // 秒数に変換
    this.timerLabel.text = sec.toFixed(3);
    this._keyUpdate = false;
  },

  check: function(piece) {
    if(piece.active){
      //押された状態に押されてもとに戻ったとき
      piece.alpha = 1.0;
      piece.active = false;
      this.user_key_bit -= id2keybit(piece.index);
    }else{
      //押されたとき
      piece.alpha = 0.5;
      piece.active = true;
      this.user_key_bit += id2keybit(piece.index);
    }
    
    this.bit_db.text = this.user_key_bit;

    if(this.user_key_bit == this.currentChord_key_bit){
      //正解に達した
      this.currentCorrectAnsNum += 1;
      
      
      //諸々をリセット
      this.user_key_bit = 0;
      this.keyButtons.forEach(function(element){
        element.active = false;
        element.alpha = 1.0;
      });

      //次の準備
      this._tmpChord = nextChord(this._tmpChord)
      this.currentChord_key_bit = this._tmpChord.key_bit;
      this.question.text = this._tmpChord.name;
      this.bit_db.text = this.user_key_bit;
      
    }

    if (this.currentCorrectAnsNum == QUESTION_NUM) {
      this.exit({
        score: 100,
      });
    }
    else {
      this.currentIndex += 1;
    }
    
  }

  

});




phina.define('Piano_key',{
  superClass: 'Button',
  init: function(index,my_color,width,height){
    this.superInit({
      width:width,
      height:height,
      cornerRadius: 3,
      backgroundColor: '#aaa',
      fill: my_color, //FFF = 白, 000 = 黒
      text:'',
    });
    this.setInteractive(true);
    this.index = index;
    this.active = false;
  }
  
})

phina.define('ResultScene', {
  // デフォルトの ResultScene を上書き
  superClass: 'ResultScene',
  
  init: function() {
    this.superInit();
    
    // デフォルトの処理(Twitter シェア)を上書きする
    this.shareButton.onclick = function() {
      var text = 'Score: {0}\n{1}'.format(3, "good");
      var url = phina.social.Twitter.createURL({
        text: text,
        hashtags: "game",
        url: phina.global.location && phina.global.location.href,
      });
      window.open(url, 'share window', 'width=480, height=320');
    };
    
    // オリジナルのボタンを追加してみる
    var circle = CircleShape({
      radius: 64,
      fill: 'white',
      stroke: null,
    }).addChildTo(this);
    // 位置を調整
    circle.setPosition(320, 840);
    // タッチを有効に
    circle.interactive = true;
    // クリック時の処理を登録
    circle.onclick = function() {
      // 特定の URL を開く
      window.open('https://phiary.me');
    };
  },
})


phina.main(function() {
  var app = GameApp({
    startLabel: location.search.substr(1).toObject().scene || 'title',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    startLabel: 'title',
  });

  app.enableStats();

  app.run();
});