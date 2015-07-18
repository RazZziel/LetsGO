Games = new Mongo.Collection("games");
Moves = new Mongo.Collection("moves");

if (Meteor.isClient) {

  var getGame = function() {
    Meteor.call("getGame", function(error, game) {
      if (error) {
        alert("Could not get game:", error);
      } else {
        Session.set("game", game);
      }
    });
  };

  var updateGameInSession = function(game) {
    Session.set("turnColor", game.turn);
    Session.set("turnNumber", game.stack.length);
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

  var myColor = function() {
    if (!Session.get("game"))
      return undefined;

    if (Meteor.userId() == Session.get("game").p1)
        return WGo.B;
      else
        return WGo.W;
  };

  Template.body.events({
    'click #clear': function (e) {
      Meteor.call("clear");
      game = new WGo.Game(19);
      getGame();
      updateGameInSession(game);
    }
  });

  Template.body.helpers({
    "turn" : function() {
      return Session.get("turnNumber") + " (" + (Session.get("turnColor") == WGo.B ? "Black" : "White") + ")";
    },

    "gameId" : function() {
      if (Session.get("game")) {
        return Session.get("game")._id;
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
      return myColor() == WGo.B ? "Black" : "White";
    },

    "captureCountBlack": function() {
      return Session.get("captureCountWhite");
    },
    "captureCountWhite": function() {
      return Session.get("captureCountBlack");
    }
  })

  Meteor.startup(function () {

    getGame();

    WGo.Board.default.background = "/wgo/wood1.jpg";

    var board = new WGo.Board(document.getElementById("board"), {
      width: 600,
    });


    board.addEventListener("click", function(x, y) {

      var turn = game.turn;

      if (turn != myColor()) {
        alert("Hold yer tits");
        return;
      }

      var noplay = true;
      var ret = game.play( x, y, turn, noplay );

      if (ret === false) {

        Moves.insert({
          x: x,
          y: y,
          turn: turn
        });

      } else {
        alert("Invalid movement: " + invalidMoveReason2str(ret));
      }

    });

    Moves.find({}).observe({

      added: function(move) {

        var ret = game.play( move.x, move.y, move.turn );

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
  });
}

if (Meteor.isServer) {

  Meteor.methods({

    getGame: function() {
      console.log("Looking up game for user " + Meteor.userId());

      var gameAsP1 = Games.findOne({ p1: Meteor.userId() });
      if (gameAsP1) {
        console.log("Found game %s with %s as P1", gameAsP1._id, Meteor.userId());
        return Games.findOne(gameAsP1._id);
      }

      var gameAsP2 = Games.findOne({ p2: Meteor.userId() });
      if (gameAsP2) {
        console.log("Found game %s with %s as P2", gameAsP2._id, Meteor.userId());
        return Games.findOne(gameAsP2._id);
      }

      var openGame = Games.findOne({ p2: null });
      if (openGame) {
        console.log("Pairing P2 %s with p1 %s on game %s", Meteor.userId(), openGame.p1, openGame._id);
        Games.update(openGame._id, {
          p1: openGame.p1,
          p2: Meteor.userId()
        });
        return Games.findOne(openGame._id);
      }

      var newGameId = Games.insert({
        p1: Meteor.userId(),
        p2: null
      })
      console.log("Created new game %s for P1 %s", newGameId, Meteor.userId());
      return Games.findOne(newGameId);
    },

    play: function(x, y) {
      // TODO: Move game logic over here
    },

    clear: function() {
      Games.remove({});
      Moves.remove({});
    }

  });
}
