"use strict";

Meteor.publish("games", function() {
	return Games.find({});
});

Meteor.publish("moves", function() {
	return Moves.find({});
});