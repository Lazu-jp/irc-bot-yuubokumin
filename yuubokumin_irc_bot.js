// IRC bot for yuubokumin
/*
  this script character code is UTF-8
*/

var limit = 8;
var filePath = './irc_bot_yuubokumin.txt';
var targetChannel = '#xxx';

function event::onChannelText(prefix, channel, text) {
  //log('----start-----');
  //log('prefix:'+prefix.toString());
  //log('channel:'+channel);
  //log('text:'+text);
  
  var ch_lc = channel.toLowerCase();
  //log('ch_lc:'+ch_lc);
  if( ch_lc == targetChannel){
    //log('channel ok');
    switch(text){
      case 'はじめる':
        var file = openFile(filePath, false);
        file.truncate();
        file.close();
        send(channel, 'BOT:つのります');
        break;
      case 'くわわる':
        //log('proccess "add"');
        addPlayer(1, prefix, channel, '');
        break;
      case 'ぬける':
        delPlayer(1, prefix, channel, '');
        break;
      case 'しらべる':
        var file = openFile(filePath, true);
        var doc = file.readAll();
        var plys = doc.split(':');
        var plylist = '';
        for(var i=0; i<plys.length; i++){
          if(i > 0){
            plylist += ', ';
          }
          plylist += plys[i];
        }
        send(channel, 'BOT:参加者：'+plylist);
        file.close();
        break;
      case 'けっか':
        var file = openFile(filePath, true);
        var doc = file.readAll();
        var plys = doc.split(':');
        var non = 0;  // number of names in textfile
        if(plys != ''){
          non = plys.length;
        }
        //log('non:'+non);
        
        if(non === limit){
          outputLink(channel, plys);
        }else{
          send(channel, 'プレイヤー数が足りません');
        }
        file.close();
        break;
      case 'こまんど':
        send(channel, 'BOT:独立コマンドは、はじめる、くわわる、ぬける、しらべる、けっか です。');
        send(channel, 'BOT:他人を変更できるコマンドは、くわえる、ぬけさせる です。例.「くわえる Kenji」、「ぬけさせる Kenji」。');
        break;
      default:
        //log('the command is unknown');
        if(text.indexOf('くわえる ') === 0){
          // get target player name
          var tpn = text.substr(5);
          //log('tpn:'+tpn);
          addPlayer(2, prefix, channel, tpn);
        }else if(text.indexOf('ぬけさせる ') === 0){
          // get target player name
          var tpn = text.substr(6);
          //log('tpn:'+tpn);
          delPlayer(2, prefix, channel, tpn);
        }
    }
  }
}

function addPlayer(mode, prefix, channel, tpn){
  var file = openFile(filePath, false);
  var doc = file.readAll();
  
  var plys = doc.split(':');
  var non = 0;  // number of names in textfile
  if(plys != ''){
    non = plys.length;
  }
  //log('non:'+non);
  
  if(non < limit){
    // get player name
    var pname = '';
    if(mode === 1){
      pname = getIrcUsername(prefix);
      if(pname === false){
        send(channel, 'prefix is incorrect');
        return false;
      }
    }else{
      pname = tpn;
    }
    //log('pname:'+pname);
    
    // check include in array
    var found = false;
    for(var i=0; i<plys.length; i++){
      if(plys[i] === pname){
        found = true;
        break;
      }
    }
    
    if(found === false){ 
      var strWrite = '';
      if(non > 0){
        strWrite += ':';
      }
      strWrite += pname;
      //log('strWrite is "'+strWrite+'"');
      file.write(strWrite);  //ファイルポイントが最後になっているので、そこから追加書き込み
      
      if((non+1) === limit){
        plys.push(pname);
        outputLink(channel, plys);
      }else{
        send(channel, 'BOT:あと '+(limit-non-1)+' 人');
      }
    }else{
      var sbj = 'error';  // subject
      if(mode === 1){
        sbj = 'あなた';
      }else{
        sbj = '彼';
      }
      send(channel, 'BOT:'+sbj+'はすでに参加しています');
    }
  }else{
    send(channel, 'BOT:これ以上参加できません');
  }
  file.close();
}

function delPlayer(mode, prefix, channel, tpn){
  var file = openFile(filePath, true);
  var doc = file.readAll();
  
  // get player names
  var plys = doc.split(':');
  var non = 0;  // number of names in textfile
  if(plys != ''){
    non = plys.length;
  }
  
  // get IRC user name
  var pname = '';
  if(mode === 1){
    pname = getIrcUsername(prefix);
    if(pname === false){
      send(channel, 'prefix is incorrect');
      return false;
    }
  }else{
    pname = tpn;
  }
  //log('pname:'+pname);
  
  // check include in array
  var tn = -1;
  for(var i=0; i<plys.length; i++){
    if(plys[i] === pname){
      tn = i;
      break;
    }
  }
  if(tn >= 0){
    // make new document
    var newDoc = '';
    var cnt = 0;
    for(var i=0; i<plys.length; i++){
      if(plys[i] != pname){
        if(cnt > 0){
          newDoc += ':';
        }
        newDoc += plys[i];
        cnt++;
      }
    }
    //log('newDoc:'+newDoc);
    file.close();
    // ファイルポインタを先頭に戻すために読み直す
    var file = openFile(filePath, false);
    file.write(newDoc);
    file.truncate();
    file.close();
    send(channel, 'BOT:OK');
  }else{
    send(channel, 'BOT:そもそも参加していません');
  }
  file.close();
}

function outputLink(channel, plys){
  var kwGET = '';
  for(var i=0; i<plys.length; i++){
    kwGET += '&kw'+(i+1)+'='+plys[i];
  }
  send(channel, 'BOT:http://lazuaoe.php.xdomain.jp/rate/mkt?stp=2&nop='+limit+kwGET);
}

/*
[ return value ]
  if false, have error. else correct.
*/
function getIrcUsername(prefix){
  var temp = prefix.toString();
  //log('temp:'+temp);
  if(temp.indexOf('[Prefix ') == 0){
    var ep = temp.indexOf(',');
    //log('ep:'+ep);
    pname = temp.substr(8,ep-8);
    return pname;
  }else{
    return false;
  }
}
/*
  ソースの候補
  //file.writeLine("aaa");
  //file.write("bbb");
  //var cnt = (text.match(/\r\n/g) || []).length;
  
  // check value
  for(var i=0; i<plys.length; i++){
    log('P'+(i+1)+':'+plys[i]);
  }
*/
