"use strict";

Meteor.publish("games", function(gameId) {

	if (gameId) {
		return Games.find(gameId);
	} else {
		return Games.find(
			{$or : [
				{ p1: this.userId },
				{ p2: this.userId }
			]},
			{
				sort: {created: 1},
				limit: 1
			}
		);
	}
});

Meteor.publish("moves", function(gameId) {

	return Moves.find({ gameId: gameId });
});