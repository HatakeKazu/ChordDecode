/*
 * Runstant
 * 思いたったらすぐ開発. プログラミングに革命を...
 */
"use strict";

phina.globalize();

var audioCtx; //音を鳴らすやつはglobalに　実際にインスタンスを作るのはユーザー入力を待たないといけない仕様に注意
var oscillator_correct1,oscillator_correct2;
//var firstPush = true;

function correctSound(){
  let sec = 0.1;
  
  oscillator_correct1 = audioCtx.createOscillator();
  oscillator_correct1.frequency.value = 1326 * Math.pow(2,5/12);
  //const gainNode = audioCtx.createGain();
  oscillator_correct1.type = "triangle";
  //osc.connect(gainNode);
  oscillator_correct1.connect(audioCtx.destination);
  //gainNode.gain.value = sound_vol;
  //gainNode.connect(audioCtx.destination);
  oscillator_correct1.start(0);
  oscillator_correct1.stop(audioCtx.currentTime + sec);

  
  oscillator_correct2 = audioCtx.createOscillator();
  oscillator_correct2.frequency.value = 1326 * Math.pow(2,1/12);
  //const gainNode2 = audioCtx.createGain();
  oscillator_correct2.type = "sine";
  //osc2.connect(gainNode2);
  oscillator_correct2.connect(audioCtx.destination);
  //gainNode2.gain.value = sound_vol;
  //gainNode2.connect(audioCtx.destination);
  oscillator_correct2.start(audioCtx.currentTime + sec);
  oscillator_correct2.stop(audioCtx.currentTime + sec + sec);
}


phina.define("MainScene", {
  superClass: 'DisplayScene',

  init: function() {
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });

    //UI関連
    var self = this;
    this.backgroundColor = 'rgba(20, 200, 20, 0.5)';
    this.group = DisplayElement().addChildTo(this);
    let gridX = Grid(BOARD_SIZE, 16);
    let gridY = Grid(BOARD_SIZE, 8);
    
    //音関連
    //todo https://stackoverflow.com/questions/46249361/cant-get-web-audio-api-to-work-with-ios-11-safari
    
    /*
    //音を鳴らす処理(ダミー)
    var oscillator = audioCtx.createOscillator();
    oscillator.frequency.value = 440; // value in hertz
    var gainNode = audioCtx.createGain();
    gainNode.gain.value = sound_vol;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    this.oscillator = oscillator;
    if (audioCtx.state === 'interrupted') {
      audioCtx.resume();
    }
    this.oscillator.start();
    setTimeout( () => { this.oscillator.stop() }, 100 );
    */

    this.keyButtons = [];//後々登録する


    
    
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
    this.currentCorrectAnsNum = 0;
    
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
    question.fontSize = 74;
    question.setPosition(this.gridX.center(), this.gridY.span(13));
    question.text = this._tmpChord.name;
    this.question = question;

    var bit_db = Label(-1); //.addChildTo(this);
    bit_db.setPosition(this.gridX.span(), this.gridY.span(15));
    bit_db.text = this.user_key_bit;
    bit_db.fontSize = 0;
    this.bit_db = bit_db;
    var arr = [];

    numbers.each(function(index, i) { //index = 中身 i = enumerate的なやつ
      // グリッド上でのインデックス
      var xIndex = keyLayout_x[index];
      var yIndex = keyLayout_y[index];
      var col = '#000';
      var height = 190;
      var width = BLACKLEY_WIDTH;
      var isBlack = true;
      if(whitekeys.includes(index)){
        col = '#fff';
        height = 345;
        width = WHITEKEY_WIDTH;
        isBlack = false;
      }
      
      var p = Piano_key(index,col,width,height,isBlack).addChildTo(self.group);
      arr.push(p);
      p.x = gridX.span(xIndex)+BOARD_OFFSET_X;
      p.y = gridY.span(yIndex)+150;

      p.onpointstart = function() {
        if(!self._keyUpdate){
          self.check(this);
          self._keyUpdate = true;
        }        
      };
    });
    
    this.keyButtons = arr;

    // タイマーラベルを生成
    var timerLabel = Label('0').addChildTo(this);
    timerLabel.origin.x = 1;
    timerLabel.x = 580;
    timerLabel.y = 130;
    timerLabel.fill = '#444';
    timerLabel.fontSize = 50;
    // timerLabel.align = 'right';
    timerLabel.baseline = 'bottom';
    this.timerLabel = timerLabel;

    this.time = TIME_LIMIT * 1000;

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
    this.time -= app.ticker.deltaTime;
    if(this.time <= 0){
      //制限時間終了
      let totalScore = calcScore(this.currentCorrectAnsNum);
      let finalMessage = calcMessage(this.currentCorrectAnsNum,totalScore);
      this.exit({score: totalScore,message:finalMessage});
    }
    let sec = this.time/1000; // 秒数に変換
    this.timerLabel.text = sec.toFixed(3);
    this._keyUpdate = false;
  },

  check: function(piece) {
    if(piece.active){
      //押された状態に押されてもとに戻ったとき
      piece.pushed();
      this.user_key_bit -= id2keybit(piece.index);
    }else{
      //押されたとき
      piece.pushed();
      this.user_key_bit += id2keybit(piece.index);
    }
    
    this.bit_db.text = this.user_key_bit;

    if(this.user_key_bit == this.currentChord_key_bit){
      //正解に達した
      this.currentCorrectAnsNum += 1;
      
      setTimeout(() => {correctSound();}, 150);//ちょっと遅延させて正解音を出す
      
      
      //諸々をリセット
      this.user_key_bit = 0;
      this.keyButtons.forEach(function(element){
        element.reset();
      });

      //次の準備
      this._tmpChord = nextChord(this._tmpChord)
      this.currentChord_key_bit = this._tmpChord.key_bit;
      this.question.text = this._tmpChord.name;
      this.bit_db.text = this.user_key_bit;
      
    }
  }

});




phina.define('Piano_key',{
  superClass: 'Button',
  init: function(index,my_color,width,height,isBlack){
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
    this.isBlack = isBlack;
    this.freq = calcFreq(index);
    this.myFreq = calcFreq(index);
    
  },
  pushed: function(){
    if(this.active){ //すでに押された状態で押された
      if(this.isBlack){
        this.fill = '#000';
      }else{
        this.fill = '#fff';
      }
    }else{ //押されてない状態から押された
      if(this.isBlack){
        this.fill = '#a00';
      }else{
        this.fill = '#a00';
      }
      let oscillator = audioCtx.createOscillator();
      oscillator.frequency.value = this.myFreq; // value in hertz
      oscillator.connect(audioCtx.destination);
      this.oscillator = oscillator;
      this.oscillator.start();
      setTimeout( () => { this.oscillator.stop() }, 100 );
    }
    this.active = !this.active;
  },
  reset: function(){
    this.active = false;
    if(this.isBlack){
      this.fill = '#000';
    }else{
      this.fill = '#fff';
    }
  }
  
})

/**
 * @class phina.game.ResultScene
 *
 */
phina.define('ResultScene', {
  superClass: 'DisplayScene',
  /**
   * @constructor
   */
  init: function(params) {
    this.superInit(params);

    params = ({}).$safe(params, phina.game.ResultScene.defaults);

    let message = params.message.format(params);

    //this.backgroundColor = params.backgroundColor;
    if(isPPmode){
      this.backgroundColor = 'rgba(200, 24, 24, 1.0)';
    }else{
      this.backgroundColor = 'hsl(200, 80%, 64%)';
      
    }
    

    this.fromJSON({
      children: {
        scoreText: {
          className: 'phina.display.Label',
          arguments: {
            text: 'score',
            fill: params.fontColor,
            stroke: null,
            fontSize: 48,
          },
          x: this.gridX.span(8),
          y: this.gridY.span(4),
        },
        scoreLabel: {
          className: 'phina.display.Label',
          arguments: {
            text: params.score+'',
            fill: params.fontColor,
            stroke: null,
            fontSize: 72,
          },
          x: this.gridX.span(8),
          y: this.gridY.span(6),
        },

        messageLabel: {
          className: 'phina.display.Label',
          arguments: {
            text: message,
            fill: params.fontColor,
            stroke: null,
            fontSize: 32,
          },
          x: this.gridX.center(),
          y: this.gridY.span(9),
        },

        shareButton: {
          className: 'phina.ui.Button',
          arguments: [{
            text: 'Tweet',
            width: 220,
            height: 128,
            fontColor: params.fontColor,
            fontSize: 50,
            //cornerRadius: 64,
            fill: 'rgba(240, 240, 240, 0.5)',
            // stroke: '#aaa',
            // strokeWidth: 2,
          }],
          x: this.gridX.center(-3),
          y: this.gridY.span(12),
        },
        playButton: {
          className: 'phina.ui.Button',
          arguments: [{
            text: 'Retry',
            width: 220,
            height: 128,
            fontColor: params.fontColor,
            fontSize: 50,
            //cornerRadius: 64,
            fill: 'rgba(240, 240, 240, 0.5)',
            // stroke: '#aaa',
            // strokeWidth: 2,
          }],
          x: this.gridX.center(3),
          y: this.gridY.span(12),

          interactive: true,
          onpush: function() {
            this.exit();
          }.bind(this),
        },
      }
    });

    if (params.exitType === 'touch') {
      this.on('pointend', function() {
        this.exit();
      });
    }

    this.shareButton.onclick = function() {
      let text = 'SCORE:{0}\n{1}'.format(params.score,params.message);
      let url = phina.social.Twitter.createURL({
        text: text,
        hashtags: '',
        url: params.url,
      });
      window.open(url, 'share window', 'width=480, height=320');
    };
  },

  _static: {
    defaults: {
      score: 16,

      message: 'this is phina.js project.',
      hashtags: 'chord',
      url: phina.global.location && phina.global.location.href,

      width: 640,
      height: 960,

      fontColor: 'white',
      backgroundColor: 'hsl(200, 80%, 64%)',
      backgroundImage: '',
    },
  },

});

// タイトルシーン
phina.define('TitleScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    this.superInit();
    this.on('enter', function() {
      let event = "touchstart"; //for iPhone
      let dom = this.app.domElement;
      //no alert
      //alert(dom);
      dom.addEventListener(event, (function() {
        return function f() {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();;
          //alert("active by iOS");
          let oscillator = audioCtx.createOscillator();
          oscillator.frequency.value = 440; // value in hertz
          oscillator.connect(audioCtx.destination);
          this.oscillator = oscillator;
          this.oscillator.start();
          setTimeout( () => { this.oscillator.stop() }, 100 );

          dom.removeEventListener(event, f, false);
        }
      }()), false);

      let event2 = "click"; // for PC
      dom.addEventListener(event2, (function() {
        return function f() {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();;
          //alert("active by PC");
          let oscillator = audioCtx.createOscillator();
          oscillator.frequency.value = 440; // value in hertz
          oscillator.connect(audioCtx.destination);
          this.oscillator = oscillator;
          this.oscillator.start();
          setTimeout( () => { this.oscillator.stop() }, 100 );

          dom.removeEventListener(event2, f, false);
        }
      }()), false);

      // シーン遷移
      this.on('pointend', function() {
      });

    });

    this.backgroundColor = 'hsl(200, 80%, 64%)';
    this.fromJSON({
      children:{
        title: {
          className: 'phina.ui.Button',
          arguments: [{
            text: 'Chord Decode',
            width: 1000,
            height: 128,
            fontColor: 'black',
            fontSize: 64,
            //cornerRadius: 64,
            fill: 'rgba(240, 240, 240, 1.0)',
            // stroke: '#aaa',
            // strokeWidth: 2,
          }],
          x: this.gridX.center(),
          y: this.gridY.span(4),

          interactive: true,
          onpush: function() {
            if(isPPmode){
              this.backgroundColor = 'hsl(200, 80%, 64%)';
              this.messageLabel.text = "";
            }else{
              this.backgroundColor = 'rgba(200, 24, 24, 1.0)';
              this.messageLabel.text = "絶対音感モード";
            }
            isPPmode = !isPPmode;
            
          }.bind(this),
        },
        playButton_easy: {
          className: 'phina.ui.Button',
          arguments: [{
            text: 'EASY',
            width: 220,
            height: 128,
            fontColor: 'white',
            fontSize: 50,
            //cornerRadius: 64,
            fill: 'rgba(240, 240, 240, 0.5)',
            // stroke: '#aaa',
            // strokeWidth: 2,
          }],
          x: this.gridX.span(4),
          y: this.gridY.span(8),

          interactive: true,
          onpush: function() {
            DIFFICULTY=0;
            this.exit();
          }.bind(this),
        },
        playButton_normal: {
          className: 'phina.ui.Button',
          arguments: [{
            text: 'NORMAL',
            width: 220,
            height: 128,
            fontColor: 'white',
            fontSize: 50,
            //cornerRadius: 64,
            fill: 'rgba(240, 240, 240, 0.5)',
            // stroke: '#aaa',
            // strokeWidth: 2,
          }],
          x: this.gridX.span(4),
          y: this.gridY.span(11),

          interactive: true,
          onpush: function() {
            DIFFICULTY=1;
            this.exit();
          }.bind(this),
        },
        playButton_hard: {
          className: 'phina.ui.Button',
          arguments: [{
            text: 'HARD',
            width: 220,
            height: 128,
            fontColor: 'white',
            fontSize: 50,
            //cornerRadius: 64,
            fill: 'rgba(240, 240, 240, 0.5)',
            // stroke: '#aaa',
            // strokeWidth: 2,
          }],
          x: this.gridX.span(4),
          y: this.gridY.span(14),

          interactive: true,
          onpush: function() {
            DIFFICULTY=2;
            this.exit();
          }.bind(this),
        },
        exprLabel_easy: {
          className: 'phina.display.Label',
          arguments: {
            text: 'メジャーとマイナーの和音のみ',
            fill: 'white',
            stroke: null,
            fontSize: 24,
          },
          x: this.gridX.span(11),
          y: this.gridY.span(8),
        },
        exprLabel_normal: {
          className: 'phina.display.Label',
          arguments: {
            text: '一般的に使用される和音群',
            fill: 'white',
            stroke: null,
            fontSize: 24,
          },
          x: this.gridX.span(11),
          y: this.gridY.span(11),
        },
        exprLabel_hard: {
          className: 'phina.display.Label',
          arguments: {
            text: 'マニアック和音も含む',
            fill: 'white',
            stroke: null,
            fontSize: 24,
          },
          x: this.gridX.span(11),
          y: this.gridY.span(14),
        },
        messageLabel: {
          className: 'phina.display.Label',
          arguments: {
            text: "",
            fill: 'white',
            stroke: null,
            fontSize: 32,
          },
          x: this.gridX.center(),
          y: this.gridY.span(6),
        },
      }
    })
    /*
    // タイトル
    Label({
      text: 'Chord Decode',
      fontSize: 64,
      fill:'white',
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(4));

    */
    /*Label({
      text: "TOUCH START",
      fontSize: 32,
    }).addChildTo(this)
      .setPosition(this.gridX.center(), this.gridY.span(12))
      .tweener.fadeOut(1000).fadeIn(500).setLoop(true).play();
    // 画面タッチ時
    this.on('pointend', function() {
      // 次のシーンへ
      this.exit();
    });
    */
  },
});



phina.main(function() {
  let app = GameApp({
    startLabel: location.search.substr(1).toObject().scene || 'title',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    startLabel: 'title',
  });

  app.enableStats();

  app.run();
});