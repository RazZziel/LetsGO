Games = new Mongo.Collection("games");

"use strict";

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
