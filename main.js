/*
 * Runstant
 * 思いたったらすぐ開発. プログラミングに革命を...
 */
"use strict";



phina.globalize();



var audioCtx=null; //音を鳴らすやつはglobalに　実際にインスタンスを作るのはユーザー入力を待たないといけない仕様に注意
var oscillator_correct1,oscillator_correct2;
var oscillator_chords = [];
var _tmpChord;
var _chordPush = 0;
var _lastScore = -1;
//var firstPush = true;

function correctSound(){
  let sec = 0.1;
  
  oscillator_correct1 = audioCtx.createOscillator();
  oscillator_correct1.frequency.value = 1326 * Math.pow(2,5/12);
  let gainNode = audioCtx.createGain();
  oscillator_correct1.type = "triangle";
  oscillator_correct1.connect(gainNode);
  gainNode.gain.value = SOUND_VOLUME*0.1;
  gainNode.connect(audioCtx.destination);
  oscillator_correct1.start();
  oscillator_correct1.stop(audioCtx.currentTime + sec);

  
  oscillator_correct2 = audioCtx.createOscillator();
  oscillator_correct2.frequency.value = 1326 * Math.pow(2,1/12);
  let gainNode2 = audioCtx.createGain();
  oscillator_correct2.type = "sine";
  oscillator_correct2.connect(gainNode2);
  gainNode2.gain.value = SOUND_VOLUME*0.1;
  gainNode2.connect(audioCtx.destination);
  oscillator_correct2.start(audioCtx.currentTime + sec);
  oscillator_correct2.stop(audioCtx.currentTime + sec + sec);
}

function playTmpChord(osc_bag){
  let chordFreqs = [];
  //chordFreqs.push(calcFreq(_tmpChord.root));
  let composIds;
  if(_tmpChord.type == 0){
    composIds = [0,4,7];
  }else{
    composIds = COMPOSITION[CHORD_TYPE[_tmpChord.type]];
  }
  composIds.forEach(function(element){
    chordFreqs.push(calcFreq(_tmpChord.root + element));
  });
  /*
  let oscillator = audioCtx.createOscillator();
  oscillator.frequency.value = chordFreqs[_playComposX % chordFreqs.length]; // value in hertz
  let gainNode = audioCtx.createGain();
  gainNode.gain.value = SOUND_VOLUME;
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.start();
  osc_bag.push([oscillator,gainNode]);
  */
  
  chordFreqs.forEach(function(element){
    let oscillator = audioCtx.createOscillator();
    oscillator.frequency.value = element; // value in hertz
    let gainNode = audioCtx.createGain();
    gainNode.gain.value = SOUND_VOLUME;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    //setTimeout( () => { oscillator.start(); },0);
    oscillator.start();
    osc_bag.push([oscillator,gainNode]);
  });
  return osc_bag;
}

function stopTmpChord(osc_bag){
  osc_bag.forEach(function(element){ //element = [(osillator,gainNode),(oscillator,gainNode),...]
    let startTime = audioCtx.currentTime;
    let endTime = startTime + 2 * FADE_OUT_SEC;
    element[1].gain.linearRampToValueAtTime(SOUND_VOLUME, startTime);
    element[1].gain.linearRampToValueAtTime(0, endTime);
    //setTimeout( () => { element[0].stop() }, 100);
    //element[0].stop(endTime  + 4 * FADE_OUT_SEC);
    //element[0].stop(startTime + FADE_OUT_SEC);
  });
  return [];
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
    if(isPPmode){
      this.backgroundColor = BG_COLOR_PP;
    }else{
      this.backgroundColor = BG_COLOR_BASIC;
    }
    
    this.group = DisplayElement().addChildTo(this);
    
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
    
    _tmpChord = nextChord(firstChord);
    this.currentChord_key_bit = _tmpChord.key_bit;
    
    this._keyUpdate = false; //1個押されたら次のフレームまで他は発火させない

    //var question = Label('Xm').addChildTo(this);
    let _q_col;
    if(isPPmode){
      _q_col = BG_COLOR_PP;
    }else{
      _q_col = BG_COLOR_BASIC;
    }
    var question = Button({text:"",fill:_q_col,width:BTNSIZE_L_W,height:BTNSIZE_L_H,fontSize:FONTSIZE_M}).addChildTo(this);
    
    question.setInteractive(true);
    question.onpointstart = function(){
      oscillator_chords = playTmpChord(oscillator_chords);
      _chordPush += 1;
    };
    question.onpointend = function(){
      stopTmpChord(oscillator_chords);
      oscillator_chords = [];
      _chordPush -= 1;
    };
    question.fontSize = FONTSIZE_L;
    question.setPosition(SCREEN_WIDTH * 0.5, SCREEN_HEIGHT * 0.9);
    question.text = _tmpChord.name;
    this.question = question;
    if(isPPmode){
      this.question.text = "TOUCH";
    }

    var bit_db = Label(-1); //.addChildTo(this);
    bit_db.setPosition(this.gridX.span(), this.gridY.span(15));
    bit_db.text = this.user_key_bit;
    bit_db.fontSize = 0;
    this.bit_db = bit_db;
    var arr = [];

    numbers.each(function(index, i) { //index = 中身 i = enumerate的なやつ 白鍵から配置する
      // グリッド上でのインデックス

      var col = '#000';
      var height = BLACKKEY_HEIGHT;
      var width = BLACKKEY_WIDTH;
      var isBlack = true;
      if(whitekeys.includes(index)){
        col = '#fff';
        height = WHITEKEY_HEIGHT;
        width = WHITEKEY_WIDTH;
        isBlack = false;
      }
      
      var p = Piano_key(index,col,width,height,isBlack).addChildTo(self.group);
      arr.push(p);
      p.setOrigin(0,0)
      p.x = KeysPosition_x[index];
      p.y = KeysPosition_y[index];

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
    timerLabel.x = SCREEN_WIDTH * 0.92;
    timerLabel.y = SCREEN_HEIGHT * 0.05;
    timerLabel.fill = '#fff';
    timerLabel.fontSize = FONTSIZE_S;
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
      fontSize: FONTSIZE_L,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
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
      oscillator_chords = stopTmpChord(oscillator_chords);
      audioCtx = null;
      this.keyButtons = null;
      let _passingScore = _lastScore;
      _lastScore = totalScore;
      this.exit({score: totalScore, message:finalMessage, lastScore:_passingScore});
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
      _tmpChord = nextChord(_tmpChord)
      this.currentChord_key_bit = _tmpChord.key_bit;
      this.question.text = _tmpChord.name;
      if(isPPmode){
        this.question.text = "???";
      }
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
      cornerRadius: 2,
      backgroundColor: '#aaa',
      fill: my_color, //FFF = 白, 000 = 黒
      text:'',
    });
    this.setInteractive(true);
    this.index = index;
    this.active = false;
    this.isBlack = isBlack;
    this.myFreq = calcFreq(index);
    this.fill_c = FILL_COLOR_BASIC;
    if(isPPmode){
      this.fill_c = FILL_COLOR_PP;
    }
    
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
        this.fill = this.fill_c;
      }else{
        this.fill = this.fill_c;
      }
      
      let oscillator = audioCtx.createOscillator();
      let gainNode = audioCtx.createGain();
      gainNode.gain.value = SOUND_VOLUME;
      oscillator.frequency.value = this.myFreq; // value in hertz
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      let startTime = audioCtx.currentTime;
      let endTime = startTime + FADE_OUT_SEC;
      gainNode.gain.setValueAtTime(SOUND_VOLUME, startTime);
      gainNode.gain.linearRampToValueAtTime(0, endTime);
      oscillator.stop(startTime + SOUND_KEEP_SEC + FADE_OUT_SEC);
      
      //setTimeout( () => { this.oscillator.stop() }, 1000*SOUND_KEEP_SEC + 1000*FADE_OUT_SEC);
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
      this.backgroundColor = BG_COLOR_PP;
    }else{
      this.backgroundColor = BG_COLOR_TITLE;
      
    }

    let _lasttext = '';
    if(params.lastScore >= 0){
      _lasttext = '前回:' + params.lastScore;
    }
    let _comptext = '';
    if(params.lastScore >= 0 && params.score > params.lastScore){
      _comptext = (params.score - params.lastScore) + '点アップ！';
    }

    this.fromJSON({
      children: {
        scoreText: {
          className: 'phina.display.Label',
          arguments: {
            text: 'score',
            fill: params.fontColor,
            stroke: null,
            fontSize: FONTSIZE_M,
          },
          x: this.gridX.span(8),
          y: this.gridY.span(3),
        },
        scoreLabel: {
          className: 'phina.display.Label',
          arguments: {
            text: params.score+'',
            fill: params.fontColor,
            stroke: null,
            fontSize: FONTSIZE_L,
          },
          x: this.gridX.span(8),
          y: this.gridY.span(5),
        },
        lastScoreLabel: {
          className: 'phina.display.Label',
          arguments: {
            text: _lasttext,
            fill: params.fontColor,
            stroke: null,
            fontSize: FONTSIZE_S,
          },
          x: this.gridX.span(11),
          y: this.gridY.span(6),
        },
        CompLastScoreLabel: {
          className: 'phina.display.Label',
          arguments: {
            text: _comptext,
            fill: params.fontColor,
            stroke: null,
            fontSize: FONTSIZE_MS,
          },
          x: this.gridX.span(11),
          y: this.gridY.span(6.5),
        },
        messageLabel: {
          className: 'phina.display.Label',
          arguments: {
            text: message,
            fill: params.fontColor,
            stroke: null,
            fontSize: FONTSIZE_MS,
            lineHeight: 1.5
          },
          x: this.gridX.center(),
          y: this.gridY.span(9),
        },
        /*
        messageLabel2: {
          className: 'phina.display.Label',
          arguments: {
            text: calcRanking(params.score),
            fill: params.fontColor,
            stroke: null,
            fontSize: FONTSIZE_M,
            lineHeight: 1.5
          },
          x: this.gridX.center(),
          y: this.gridY.span(14),
        },
        messageLabel3: {
          className: 'phina.display.Label',
          arguments: {
            text: '/ ' + STR_POPULATION + '人',
            fill: params.fontColor,
            stroke: null,
            fontSize: FONTSIZE_S,
            lineHeight: 1.5
          },
          x: this.gridX.center(2),
          y: this.gridY.span(15),
        },
        */

        shareButton: {
          className: 'phina.ui.Button',
          arguments: [{
            text: 'つぶやく',
            width: BTNSIZE_L_W,
            height: BTNSIZE_L_H,
            fontColor: params.fontColor,
            fontSize: FONTSIZE_L,
            //cornerRadius: 64,
            backgroundColor: 'transparent',
            fill: 'rgba(240, 240, 240, 0.5)',
            // stroke: '#aaa',
            // strokeWidth: 2,
          }],
          x: this.gridX.center(0),
          y: this.gridY.span(13),
        },
        playButton: {
          className: 'phina.ui.Button',
          arguments: [{
            text: 'タイトル',
            width: BTNSIZE_S_W,
            height: BTNSIZE_S_H,
            fontColor: params.fontColor,
            fontSize: FONTSIZE_S,
            //cornerRadius: 64,
            fill: 'rgba(240, 240, 240, 0.5)',
            // stroke: '#aaa',
            // strokeWidth: 2,
          }],
          x: this.gridX.center(6),
          y: this.gridY.span(1),

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
      let text = 'Chord Decodeをプレイ\nSCORE:{0}\n{1}'.format(params.score,params.message);
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
    this.superInit(
      {width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT});
    this.on('enter', function() {
      let event = "touchstart"; //for iPhone
      let dom = this.app.domElement;
      dom.addEventListener(event, (function() {
        return function f() {
          if(audioCtx == null){
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          }
          let oscillator = audioCtx.createOscillator();
          oscillator.frequency.value = 440; // value in hertz
          let gainNode = audioCtx.createGain();
          gainNode.gain.value = SOUND_VOLUME*0.00;
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.01);
          dom.removeEventListener(event, f, false);
        }
      }()), false);

      let event2 = "click"; // for PC
      dom.addEventListener(event2, (function() {
        return function f() {
          if(audioCtx == null){
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          }
          let oscillator = audioCtx.createOscillator();
          oscillator.frequency.value = 440; // value in hertz
          let gainNode = audioCtx.createGain();
          gainNode.gain.value = SOUND_VOLUME*0.00;
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator = oscillator;
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.01);
          dom.removeEventListener(event, f, false);
        }
      }()), false);

      // シーン遷移
      this.on('pointend', function() {
      });

    });

    
    if(isPPmode){
      this.backgroundColor = BG_COLOR_PP;
      //document.body.style.backgroundColor = BG_COLOR_PP; //だめだった
    }else{
      this.backgroundColor = BG_COLOR_TITLE;
      //document.body.style.backgroundColor = BG_COLOR_TITLE;
    }
    
    
    this.fromJSON({
      children:{
        title: {
          className: 'phina.ui.Button',
          arguments: [{
            text: 'Chord Decode',
            width: 9999,
            height: SCREEN_HEIGHT * 0.15,
            fontColor: 'black',
            fontSize: FONTSIZE_L,
            fontFamily: "'Helvetica'", // Hiragino or Helvetica
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
              this.backgroundColor = BG_COLOR_TITLE;
              this.messageLabel.text = "";
            }else{
              this.backgroundColor = BG_COLOR_PP;
              this.messageLabel.text = "絶対音感用モード";
            }
            isPPmode = !isPPmode;
            
          }.bind(this),
        },
        playButton_easy: {
          className: 'phina.ui.Button',
          arguments: [{
            text: 'EASY',
            width: BTNSIZE_M_W,
            height: BTNSIZE_M_H,
            fontColor: 'white',
            fontSize: FONTSIZE_M,
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
            TIME_LIMIT = TIME_LIMIT_BASE * 2; //制限時間倍増
            this.exit();
          }.bind(this),
        },
        playButton_normal: {
          className: 'phina.ui.Button',
          arguments: [{
            text: 'NORMAL',
            width: BTNSIZE_M_W,
            height: BTNSIZE_M_H,
            fontColor: 'white',
            fontSize: FONTSIZE_M,
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
            TIME_LIMIT = TIME_LIMIT_BASE;
            this.exit();
          }.bind(this),
        },
        playButton_hard: {
          className: 'phina.ui.Button',
          arguments: [{
            text: 'HARD',
            width: BTNSIZE_M_W,
            height: BTNSIZE_M_H,
            fontColor: 'white',
            fontSize: FONTSIZE_M,
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
            TIME_LIMIT = TIME_LIMIT_BASE;
            this.exit();
          }.bind(this),
        },
        exprLabel_easy: {
          className: 'phina.display.Label',
          arguments: {
            text: 'メジャー・マイナー和音のみ',
            fill: 'white',
            stroke: null,
            fontSize: FONTSIZE_S,
          },
          x: this.gridX.span(11.5),
          y: this.gridY.span(8),
        },
        exprLabel_normal: {
          className: 'phina.display.Label',
          arguments: {
            text: '一般的に使用される和音たち',
            fill: 'white',
            stroke: null,
            fontSize: FONTSIZE_S,
          },
          x: this.gridX.span(11.5),
          y: this.gridY.span(11),
        },
        exprLabel_hard: {
          className: 'phina.display.Label',
          arguments: {
            text: 'マニアック和音も含まれます',
            fill: 'white',
            stroke: null,
            fontSize: FONTSIZE_S,
          },
          x: this.gridX.span(11.5),
          y: this.gridY.span(14),
        },
        messageLabel: {
          className: 'phina.display.Label',
          arguments: {
            text: "",
            fill: 'white',
            stroke: null,
            fontSize: FONTSIZE_M,
          },
          x: this.gridX.center(),
          y: this.gridY.span(6),
        },
      }
    })
  },
});



phina.main(function() {
  let app = GameApp({
    startLabel: location.search.substr(1).toObject().scene || 'title',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    startLabel: 'title',
  });

  //app.enableStats();
  let canvas = phina.graphics.Canvas()
  let ctx = canvas.context;
  ctx.scale(2,2);
  //alert(scale)
  app.run();
});