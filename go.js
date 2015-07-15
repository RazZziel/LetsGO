Moves = new Mongo.Collection("moves");

if (Meteor.isClient) {

  Template.body.events({
    'click #clear': function (e) {
      Meteor.call("clear");
    }
  });

  Meteor.startup(function () {

    WGo.Board.default.background = "/wgo/wood1.jpg";

    var board = new WGo.Board(document.getElementById("board"), {
      width: 600,
    });

    board.addEventListener("click", function(x, y) {
      Moves.insert({
        x: x,
        y: y,
        tool: document.getElementById("tool").value
      });
    });

    var move2object = function(move) {
      return {
        x: move.x,
        y: move.y,
        c: (move.tool == "black") ? WGo.B : WGo.W
      };
    }

    Moves.find({}).observe({
      added: function(move) {
        board.addObject( move2object(move) );
      },
      removed: function(move) {
        board.removeObject( move2object(move) );
      }
    });
  });
}

if (Meteor.isServer) {

  Meteor.methods({
    clear: function() {
      Moves.remove({});
    }
  });
}
