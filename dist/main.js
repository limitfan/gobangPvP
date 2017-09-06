(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var S = require("./score.js");
var R = require("./role.js");
var W = require("./win.js");


var url = window.location.href;
var matchid = Math.random().toString(36).substr(2, 4);

var Board = function(container, status) {
  this.container = container;
  this.status = status;
  this.step = this.container.width() * 0.065;
  this.offset = this.container.width() * 0.044;
  this.steps = [];  //存储

  this.started = false;


  var self = this;
  this.container.on("click", function(e) {
    //if(self.lock) return;
    if(currentPlayer == "hum" && self.steps.length%2 == 0) return;
    if(currentPlayer == "com" && self.steps.length%2 == 1) return;		
    var y = e.offsetX, x = e.offsetY;
    x = Math.floor((x+self.offset)/self.step) - 1;
    y = Math.floor((y+self.offset)/self.step) - 1;

    var v = 1;
    if(currentPlayer == "com"){v=2;}	
    self.set(x, y, v);
    postGameMove(currentPlayer, x, y);


  });

  this.worker = new Worker("./dist/bridge.js?r="+(+new Date()));

  this.worker.onmessage = function(e) {
    self._set(e.data[0], e.data[1], R.com);
    self.lock = false;
    self.setStatus("电脑下子("+e.data[0]+","+e.data[1]+"), 用时"+((new Date() - self.time)/1000)+"秒");
  }
  this.setStatus("Waiting for an opponent..."+"\n"+url+"?mid="+matchid);

}

Board.prototype.start = function() {

  if(this.started) return;
  this.initBoard();
  
//  this.board[7][7] = R.com;
//  this.steps.push([7, 7]);

  this.draw();

  if(currentPlayer == "com"){
  this.setStatus("You move first.");
  }
  else{
  this.setStatus("Waiting for opponent move.");
 }

  this.started = true;

  this.worker.postMessage({
    type: "START"
  });
}

Board.prototype.stop = function() {
  if(!this.started) return;
  this.setStatu("Please refresh to start a new match.");
  this.started = false;
}
Board.prototype.initBoard = function() {
  this.board = [];
  for(var i=0;i<15;i++) {
    var row = [];
    for(var j=0;j<15;j++) {
      row.push(0);
    }
    this.board.push(row);
  }
  this.steps = [];
}

Board.prototype.draw = function() {
  var container = this.container;
  var board = this.board;
  
  container.find(".chessman, .indicator").remove();

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] != 0) {
        var chessman = $("<div class='chessman'></div>").appendTo(container);
        if(board[i][j] == 2) chessman.addClass("black");
        chessman.css("top", this.offset + i*this.step);
        chessman.css("left", this.offset + j*this.step);
      }
    }
  }

  if(this.steps.length > 0) {
    var lastStep = this.steps[this.steps.length-1];
    $("<div class='indicator'></div>")
      .appendTo(container)
      .css("top", this.offset + this.step * lastStep[0])
      .css("left", this.offset + this.step * lastStep[1])
  }

}

Board.prototype._set = function(x, y, role) {
  this.board[x][y] = role;
  this.steps.push([x,y]);
  this.draw();
  var winner = W(this.board);
  var self = this;
  if(winner == R.com) {
     if(currentPlayer == "com"){	
    $.alert("You are victorious.", function() {
      self.stop();
    });
      }
     else{
     $.alert("You are defeated.", function() {
      self.stop();
    });

     } 
  } else if (winner == R.hum) {
     if(currentPlayer == "hum") {
    $.alert("You are victorious.", function() {
      self.stop();
    });
     }
     else{
       $.alert("You are defeated.", function() {
      self.stop();
      });

     }
  }
}

Board.prototype.set = function(x, y, role) {
  if(this.board[x][y] !== 0) {
    throw new Error("此位置不为空");
  }
  this._set(x, y, role);
  //this.com(x, y, role);
}

Board.prototype.com = function(x, y, role) {
  this.lock = true;
  this.time = new Date();
  this.worker.postMessage({
    type: "GO",
    x: x,
    y: y
  });
  this.setStatus("电脑正在思考...");
}

Board.prototype.setStatus = function(s) {
  this.status.text(s);
}

Board.prototype.back = function(step) {
  if(this.lock) {
    this.setStatus("电脑正在思考，请稍等..");
    return;
  }
  step = step || 1;
  while(step && this.steps.length >= 2) {
    var s = this.steps.pop();
    this.board[s[0]][s[1]] = R.empty;
    s = this.steps.pop();
    this.board[s[0]][s[1]] = R.empty;
    step --;
  }
  this.draw();
  this.worker.postMessage({
    type: "BACK"
  });
}


var b = new Board($("#board"), $(".status"));
$("#start").click(function() {
  b.start();
});


b.start();


$("#fail").click(function() {
  $.confirm("确定认输吗?", function() {
    b.stop();
  });
});

$("#back").click(function() {
  b.back();
});

Parse.initialize("baasone");
Parse.serverURL = 'https://baasone.herokuapp.com/parse/';
var date;
date=new Date();
console.log(date);


function getQuery(q) {
    return (window.location.search.match(new RegExp('[?&]' + q + '=([^&]+)')) || [, null])[1];
}

var currentPlayer = "hum";


	
if(getQuery("mid")){
	currentPlayer = "com";
        matchid = getQuery("mid");
	postGameMove(currentPlayer, -1, -1);
   }else{
        $.prompt({
  title: 'Finding a match',
  text: 'Please send following link to the player you have choosen to play with.',
  input: url+"?mid="+matchid,
  empty: false, // 是否允许为空
  onOK: function (input) {
    //点击确认
  },
  onCancel: function () {
    //点击取消
  }
});

   //    $.alert("Please send following link to the player you have choosen to play with."+"<br/><a href=\"\">"+url+"?mid="+matchid+"</a>", "finding a match");
       	var GobangMatch = Parse.Object.extend("Posts");
	var gobangMatch = new GobangMatch();

	gobangMatch.set("matchid", matchid);
	gobangMatch.set("x", -2);
	gobangMatch.set("y", -2);
	gobangMatch.set("currentPlayer",currentPlayer);

	gobangMatch.save(null, {
	  success: function(gobangMatch) {
	    // Execute any logic that should take place after the object is saved.
	    //alert('New object created with objectId: ' + gobangMatch.id);
	  },
	  error: function(gobangMatch, error) {
	    // Execute any logic that should take place if the save fails.
	    // error is a Parse.Error with an error code and message.
	    alert('Failed to create new object, with error code: ' + error.message);
	  }
	});

}


	function postGameMove(role, x, y){
		var GobangMatch = Parse.Object.extend("Posts");
		var gobangMatchQuery = new Parse.Query(GobangMatch);
		gobangMatchQuery.equalTo("matchid", matchid);
		gobangMatchQuery.find({
		  success: function(results) {
		    //alert("Successfully retrieved " + results.length + " scores.");
		    // Do something with the returned Parse.Object values
		    for (var i = 0; i < results.length; i++) {
		      var object = results[i];

		        var result = Parse.Object.extend("Posts");

                    var result = new Parse.Query(result);
                    gobangMatchQuery.get(results[i].id,{
                        success: function(result) {
                            result.set('currentPlayer', role);
                            result.set('x',x);
                            result.set('y',y);
                            result.save();
                        }
                    });
		      //alert(object.id + ' - ' + object.get('currentPlayer'));
		    }
		  },
		  error: function(error) {
		    alert("Error: " + error.code + " " + error.message);
		  }
		});
	}

  let query = new Parse.Query('Posts');
	let subscription = query.subscribe();
	subscription.on('delete', (object) => {
	  console.log('object deleted');
	});

	subscription.on('open', () => {
	  console.log('open event');
	});

	subscription.on('update', (object) => {
	  console.log('user object updated!');
      var player = object.get("currentPlayer");
         var x = object.get("x");
         var y = object.get("y");

         console.log("currentPlayer:"+object.get("currentPlayer")+"with x&y:"+x+" "+y);
        if (x==-1&&y==-1){
          b.setStatus("The opponent has been connected. Waiting for the first move...");
         }

       if(player == currentPlayer){
        }
      else{
      	if (currentPlayer == "hum"){
          b.set(x,y,2);
      	}
      	else{
	  b.set(x,y,1);
      	}
      }

	});

	subscription.on('create', (object) => {
  console.log('object created');
});




},{"./role.js":2,"./score.js":3,"./win.js":4}],2:[function(require,module,exports){
module.exports = {
  com: 2,
  hum: 1,
  empty: 0,
  reverse: function(r) {
    return r == 1 ? 2 : 1;
  }
}

},{}],3:[function(require,module,exports){
/*
 * 棋型表示
 * 用一个6位数表示棋型，从高位到低位分别表示
 * 连五，活四，眠四，活三，活二/眠三，活一/眠二, 眠一
 */

module.exports = {
  ONE: 10,
  TWO: 100,
  THREE: 1000,
  FOUR: 100000,
  FIVE: 1000000,
  BLOCKED_ONE: 1,
  BLOCKED_TWO: 10,
  BLOCKED_THREE: 100,
  BLOCKED_FOUR: 10000
}

},{}],4:[function(require,module,exports){
var R = require("./role.js");
var isFive = function(board, p, role) {
  var len = board.length;
  var count = 1;

  var reset = function() {
    count = 1;
  }

  for(var i=p[1]+1;true;i++) {
    if(i>=len) break;
    var t = board[p[0]][i];
    if(t !== role) break;
    count ++;
  }


  for(var i=p[1]-1;true;i--) {
    if(i<0) break;
    var t = board[p[0]][i];
    if(t !== role) break;
    count ++;
  }

  if(count >= 5) return true;

  //纵向
  reset();

  for(var i=p[0]+1;true;i++) {
    if(i>=len) {
      break;
    }
    var t = board[i][p[1]];
    if(t !== role) break;
    count ++;
  }

  for(var i=p[0]-1;true;i--) {
    if(i<0) {
      break;
    }
    var t = board[i][p[1]];
    if(t !== role) break;
    count ++;
  }


  if(count >= 5) return true;
  // \\
  reset();

  for(var i=1;true;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x>=len || y>=len) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
      
    count ++;
  }

  for(var i=1;true;i++) {
    var x = p[0]-i, y = p[1]-i;
    if(x<0||y<0) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
    count ++;
  }

  if(count >= 5) return true;

  // \/
  reset();

  for(var i=1; true;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x<0||y<0||x>=len||y>=len) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
    count ++;
  }

  for(var i=1;true;i++) {
    var x = p[0]-i, y = p[1]+i;
    if(x<0||y<0||x>=len||y>=len) {
      break;
    }
    var t = board[x][y];
    if(t !== role) break;
    count ++;
  }

  if(count >= 5) return true;

  return false;

}


var w = function(board) {
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      var t = board[i][j];
      if(t !== R.empty) {
        var r = isFive(board, [i, j], t);
        if(r) return t;
      }
    }
  }
  return false;
}

module.exports = w;

},{"./role.js":2}]},{},[1]);
