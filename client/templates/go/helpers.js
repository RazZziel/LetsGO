getGame = function() {
  Meteor.call("getGame", function(error, game) {
    if (error) {
      alert("Could not get game:", error);
    } else {
      Session.set("game", game);
    }
  });
};

updateGameInSession = function(game) {
  Session.set("turnColor", game.turn);
  Session.set("turnNumber", game.stack.length);
  Session.set("captureCountBlack", game.getCaptureCount(WGo.B));
  Session.set("captureCountWhite", game.getCaptureCount(WGo.W));
}

invalidMoveReason2str = function(reason) {
  switch (reason) {
    case 1: return "Given coordinates are not on board";
    case 2: return "On given coordinates already is a stone";
    case 3: return "Suicide";
    case 4: return "Repeated position";
    default: return "Unknown ("+reason+")";
  }
}

var myColor = function() {
  if (!Session.get("game"))
    return undefined;

  if (Meteor.userId() == Session.get("game").p1)
      return WGo.B;
    else
      return WGo.W;
};