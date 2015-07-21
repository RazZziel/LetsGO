Games = new Mongo.Collection("games");

"use strict";

if (Meteor.isServer) {

    Meteor.methods({

        createGame: function() {
            var newGameId = Games.insert({
                p1: Meteor.userId(),
                p2: null,
                state: "created",
                created: new Date()
            });
            console.log("Created new game %s for P1 %s", newGameId, Meteor.userId());
            return newGameId;
        },

        getGame: function(gameId) {
            console.log("Looking up game for user " + Meteor.userId());

            if (gameId) {

              var openGame = Games.findOne({ _id: gameId });
              if (!openGame) {
                  //console.error("Specified game %s not found", gameId);
                  //return undefined;
                  var newGameId = Games.insert({
                      _id: gameId,
                      p1: Meteor.userId(),
                      p2: null,
                      state: "created",
                      created: new Date()
                  })
                  console.log("Created new game %s for P1 %s", newGameId, Meteor.userId());
                  return Games.findOne(newGameId);
              }
              if (!openGame.p1) {
                  console.error("Specified game %s doesn't have a P1", gameId);
                  return undefined;
              }
              if (openGame.p1 == Meteor.userId()) {
                  console.log("Specified game %s was created by P1 %s", openGame._id, openGame.p1);
                  return openGame;
              }
              if (openGame.p2 && openGame.p2 != Meteor.userId()) {
                  console.error("Specified game %s already has a P2 %s", gameId, openGame.p2);
                  return undefined;
              }
              if (openGame) {
                  console.log("Pairing P2 %s with p1 %s on game %s", Meteor.userId(), openGame.p1, openGame._id);
                  Games.update(openGame._id, {$set : {
                      p2: Meteor.userId(),
                      state: "started",
                  }});
                  return Games.findOne(openGame._id);
              }

            } else {

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
                    Games.update(openGame._id, {$set : {
                        p2: Meteor.userId(),
                        state: "started",
                    }});
                    return Games.findOne(openGame._id);
                }

                var newGameId = Games.insert({
                    p1: Meteor.userId(),
                    p2: null,
                    state: "created",
                    created: new Date()
                })
                console.log("Created new game %s for P1 %s", newGameId, Meteor.userId());
                return Games.findOne(newGameId);
            }
        },

        play: function(gameId, x, y, turn) {
            console.log("User '%s' with color %s plays position (%d, %d) on game '%s'", Meteor.userId(), turn, x, y, gameId);
            Moves.insert({
                user: Meteor.userId(),
                gameId: gameId,
                x: x,
                y: y,
                turn: turn
            });
        },

        clear: function() {
            Games.remove({});
            Moves.remove({});
        }

    });
}
