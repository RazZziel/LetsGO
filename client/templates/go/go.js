"use strict";

var updateGameInSession = function(game) {
    Session.set("turnColor", game.turn);
    Session.set("turnNumber", game.stack ? game.stack.length : 0);
}

var invalidMoveReason2str = function(reason) {
    switch (reason) {
        case 1: return "Given coordinates are not on board";
        case 2: return "On given coordinates already is a stone";
        case 3: return "Suicide";
        case 4: return "Repeated position";
        default: return "Unknown ("+reason+")";
    }
}

var game = new WGo.Game(19);
var board;
var scoreMode;

updateGameInSession(game);
var lastMoveId = undefined;


var myColor = function() {
    if (!Session.get("game"))
        return undefined;

    if (Meteor.userId() == Session.get("game").p1)
        return WGo.B;
    else
        return WGo.W;
};

var addMove = function(type, x, y) {

    var turn = game.turn;

    if (turn != myColor()) {
        alert("Calm yer tits");
        return;
    }

    switch (type) {
        case "play":
            var noplay = true;
            var ret = game.play( x, y, turn, noplay );
            console.log("Local move: (%s, %s, %s) -> %s", x, y, turn, ret);

            if (ret === false) {
                Meteor.call("play", Session.get("game")._id, x, y, turn);
            } else {
                alert("Invalid movement: " + invalidMoveReason2str(ret));
            }
            break;

        case "pass":
            Meteor.call("pass", Session.get("game")._id, turn);
            break;

        case "resign":
            Meteor.call("resign", Session.get("game")._id, turn);
            break;
    }
}


Template.go.events({
    'click #clear': function (e) {
        Meteor.call("clear");
        game = new WGo.Game(19);
        updateGameInSession(game);
    },
    'click #pass': function (e) {

        addMove("pass");
    },
    'click #resign': function (e) {

        addMove("resign");
    },
});

Template.go.helpers({
    "turn" : function() {
        //return Session.get("turnNumber") + " (" + (Session.get("turnColor") == WGo.B ? "Black" : "White") + ")";
        return Session.get("turnColor") == myColor() ? "Your turn" : "Oppopent's turn";
    },

    "gameId" : function() {
        if (Session.get("game")) {
            return Session.get("game")._id;
        }
    },

    "gameState" : function() {
        if (Session.get("game")) {
            return Session.get("game").state;
        }
    },

    "gameUrl" : function() {
      if (Session.get("game")) {
        return Meteor.absoluteUrl("game/"+Session.get("game")._id);
      }
    },

    "me" : function() {
        return Meteor.userId();
    },

    "myOpponent" : function() {
        if (Session.get("game")) {
            if (Meteor.userId() == Session.get("game").p1)
                return Session.get("game").p2;
            else
                return Session.get("game").p1;
        }
    },

    "gameRunning" : function() {
        if (Session.get("game")) {
            var game = Session.get("game");
            return game.state == "started" || game.state == "passed";
        }
    },

    "myColor" : function() {
        var color = myColor();
        if (color) {
          return color == WGo.B ? "Black" : "White";
        }
    },

    "result" : function() {
        if (Session.get("game").winner) {
            if (Meteor.userId() == Session.get("game").winner)
                return "You win";
            else
                return "You lose";
        }
    },

    "winner" : function() {
        if (Session.get("game")) {
            return Session.get("game").winner;
        }
    },
    "loser" : function() {
        if (Session.get("game")) {
            return Session.get("game").loser;
        }
    },
})

Template.go.rendered = function() {

    Games.find({}).observe({

      changed: function(newDocument, oldDocument) {

          Session.set("game", newDocument);

          /* TODO: Gotta be careful with this */
          game = new WGo.Game(19);
          updateGameInSession(game);
      }

  });
}

Template.board.rendered = function() {

    WGo.Board.default.background = "/wgo/wood1.jpg";

    var board_element = document.getElementById("board");
    var board_overlay = document.getElementById("boardOverlay");
    board = new WGo.Board(board_element);

    var resizeBoard = function() {
        board.setWidth(Math.min(board_element.offsetWidth, window.innerHeight));
        if (board_overlay) {
            board_overlay.style.width = board.width+"px";
            board_overlay.style.height = board.height+"px";
        }
    };
    resizeBoard();
    window.addEventListener("resize", resizeBoard);


    board.addEventListener("click", function(x, y) {
        addMove("play", x, y);
    });

    loadAudioSamples();
    var lastMove;
    var init = true;

    Moves.find({}).observe({

        added: function(move) {

            if (lastMoveId == move._id) {
                console.warn("Ignoring repeated remote move (%s, %s, %s)", move.x, move.y, move.turn);
                return;
            }
            lastMoveId = move._id;

            switch (move.type) {
                case "move":
                    var ret = game.play( move.x, move.y, move.turn );
                    if (!init)
                        console.log("Remote move: (%s, %s, %s) -> %s", move.x, move.y, move.turn, ret);

                    if (ret.constructor == Array) {

                        board.update({
                            add: [ { x: move.x, y: move.y, c: move.turn } ],
                            remove: ret
                        });

                        if (!init) {
                            if (lastMove)
                                board.removeObject(lastMove);
                            lastMove = {x: move.x, y: move.y, type: WGo.Board.drawHandlers.CR};
                            board.addObject(lastMove);

                            updateScoreMode();

                            stoneAudio[ Math.round(Math.random()*(stoneAudio.length-1)) ].play();
                        }

                    } else {
                        if (!init)
                            console.warn("Received invalid movement from server:" + invalidMoveReason2str(ret));
                    }
                    break;

                case "pass":
                    console.log("Remote pass");
                    game.pass(move.turn);
                    break;

                case "resign":
                    console.log("Remote resign");
                    break;
            }

            updateGameInSession(game);
        },

        removed: function(move) {
            board.removeObject( { x: move.x, y: move.y, c: move.turn } );
        }

    });
    init = false;

    updateScoreMode();

    var lastOutline;
    board.addEventListener("mousemove", function(x, y) {

        if (lastOutline) {

            if (lastOutline.x == x && lastOutline.y == y) return;

            board.removeObject(lastOutline);
        }

        if (x<0 || y<0) return;

        var noplay = true;
        var ret = game.play( x, y, game.turn, noplay );
        if (ret === false && game.turn == myColor()) {
            lastOutline = {x: x, y: y, type: WGo.Board.drawHandlers.outline, c: myColor()};
        } else {
            lastOutline = {x: x, y: y, type: WGo.Board.drawHandlers.MA};
            // TODO: Do something with invalidMoveReason2str(ret)
        }

        board.addObject(lastOutline);
    });
    board.addEventListener("mouseleave", function(x, y) {

        if (lastOutline)
            board.removeObject(lastOutline);
    });
}

Template.score.rendered = function() {

    $(document.getElementById("showScore")).change(updateScoreMode);
    updateScoreMode();
}

var updateScoreMode = function(enabled) {
    var checkbox = document.getElementById("showScore");
    if (checkbox && game && board) {

        if (!scoreMode) {
            var komi = 0;
            scoreMode = new WGo.ScoreMode(game.position, board, komi, drawScore);
        } else {
            scoreMode.originalPosition = game.position;
            scoreMode.position = game.position.clone();
        }

        scoreMode.calculate();
        scoreMode.displayScore(checkbox.checked);
    }
}

var drawScore = function(scoreMode, score) {

    var sb = score.black.length+
            score.white_captured.length+
            scoreMode.originalPosition.capCount.black;
    var sw = score.white.length+
            score.black_captured.length+
            scoreMode.originalPosition.capCount.white+
            parseFloat(scoreMode.komi);

    var msg = "<p>";
    msg +=
        WGo.t("black")+": "+
        score.black.length+" + "+
        (score.white_captured.length+scoreMode.originalPosition.capCount.black)+" = "+
        sb+"</br>";
    msg += WGo.t("white")+": "+
        score.white.length+" + "+
        (score.black_captured.length+scoreMode.originalPosition.capCount.white)+" + "+
        scoreMode.komi+" = "+
        sw+"</p>";
    msg += "<p style='font-weight: bold;'>"+
        (sb > sw
            ? WGo.t("bwin", sb-sw)
            : WGo.t("wwin", sw-sb))+
        "</p>";

    var scoreMode_element = document.getElementById("scoreMode");
    if (scoreMode_element)
        scoreMode_element.innerHTML = msg;
}

var stoneAudio = [];
var loadAudioSamples = function() {
    var audioPath = 'https://a00ce0086bda2213e89f-570db0116da8eb5fdc3ce95006e46d28.ssl.cf1.rackcdn.com/4.2/sound/';
    stoneAudio[0] = loadAudioSample(audioPath+'stone1');
    stoneAudio[1] = loadAudioSample(audioPath+'stone2');
    stoneAudio[2] = loadAudioSample(audioPath+'stone3');
    stoneAudio[3] = loadAudioSample(audioPath+'stone4');
    stoneAudio[4] = loadAudioSample(audioPath+'stone5');
}

var loadAudioSample = function(filename) {
    var audio = new Audio();
    var source = document.createElement('source');
    if (audio.canPlayType('audio/mpeg;')) {
        source.type = 'audio/mpeg';
        source.src = filename+'.mp3';
    } else {
        source.type = 'audio/ogg';
        source.src = filename+'.ogg';
    }
    audio.appendChild(source);
    return audio;
}