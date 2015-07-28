"use strict";

var updateGameInSession = function(game) {
    Session.set("turnColor", game.turn);
    Session.set("turnNumber", game.stack ? game.stack.length : 0);
    Session.set("captureCountBlack", game.getCaptureCount(WGo.B));
    Session.set("captureCountWhite", game.getCaptureCount(WGo.W));
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


Template.go.events({
    'click #clear': function (e) {
        Meteor.call("clear");
        game = new WGo.Game(19);
        updateGameInSession(game);
    }
});

Template.go.helpers({
    "turn" : function() {
        return Session.get("turnNumber") + " (" + (Session.get("turnColor") == WGo.B ? "Black" : "White") + ")";
    },

    "gameId" : function() {
        if (Session.get("game")) {
            return Session.get("game")._id;
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

    "myColor" : function() {
        var color = myColor();
        if (color) {
          return color == WGo.B ? "Black" : "White";
        }
    },

    "captureCountBlack": function() {
        return Session.get("captureCountWhite");
    },
    "captureCountWhite": function() {
        return Session.get("captureCountBlack");
    }
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
    var board = new WGo.Board(board_element);

    var resizeBoard = function() {
        board.setWidth(Math.min(board_element.offsetWidth, window.innerHeight));
    };
    resizeBoard();
    window.addEventListener("resize", resizeBoard);


    board.addEventListener("click", function(x, y) {

        var turn = game.turn;

        if (turn != myColor()) {
            alert("Calm yer tits");
            return;
        }

        var noplay = true;
        var ret = game.play( x, y, turn, noplay );
        console.log("Local move: (%s, %s, %s) -> %s", x, y, turn, ret);

        if (ret === false) {
            Meteor.call("play", Session.get("game")._id, x, y, turn);
        } else {
            alert("Invalid movement: " + invalidMoveReason2str(ret));
        }
    });


    Moves.find({}).observe({

        added: function(move) {

            if (lastMoveId == move._id) {
                console.warn("Ignoring repeated remote move (%s, %s, %s)", move.x, move.y, move.turn);
                return;
            }
            lastMoveId = move._id;

            var ret = game.play( move.x, move.y, move.turn );
            console.log("Remote move: (%s, %s, %s) -> %s", move.x, move.y, move.turn, ret);

            if (ret.constructor == Array) {

                board.update({
                    add: [ { x: move.x, y: move.y, c: move.turn } ],
                    remove: ret
                });

            } else {
                alert("Received invalid movement from server:" + invalidMoveReason2str(ret));
            }

            updateGameInSession(game);
        },

        removed: function(move) {
            board.removeObject( { x: move.x, y: move.y, c: move.turn } );
        }

    });
}