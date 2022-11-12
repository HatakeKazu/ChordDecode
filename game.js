//phinaに依存しない関数群

//idから和音などの処理用の数値へ
function id2keybit(id){
  return Math.pow(2,id%KEY_SCALE);
}

//和音を処理用数値へ
function calcKey_Bit(root_id, chord_type_num){
  var ret = 0;
  if(CHORD_TYPE[chord_type_num] in COMPOSITION){
    var compos = COMPOSITION[CHORD_TYPE[chord_type_num]];
    compos.forEach(function(element){
      ret += id2keybit((root_id + element)%KEY_SCALE);
    });
  }else{
    //純粋なトライアドのメジャーコード 空文字列はdictのkeyになれないので特殊対応
    var compos = [0,4,7];
    compos.forEach(function(element){
      ret += id2keybit((root_id + element)%KEY_SCALE);
    });
  }
  return ret;
}

//ランダムに和音を返す　特定の形式で受け渡すことに注意
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

//idに対応する周波数へ
function calcFreq(index){
  base = 9; //id of A = 9
  return TUNE *  Math.pow(2,(index-9)/12);
}
