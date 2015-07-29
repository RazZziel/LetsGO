"use strict";

Router.configure({
    layoutTemplate: "layout",
    loadingTemplate: "loading",
})

/*Router.route('/', {
    title: "Let's GO!",
    name: "home",
    template: "landing",
    fastRender: true
});*/

//Router.route('/game/', {
Router.route('/', {
    title: "Creating game",
    name: "create_game",
    template: "loading",
    //fastRender: true,
    onBeforeAction: function () {
        Meteor.call("createGame", function(error, gameId) {
            if (error) {
                alert("Could not get game " + gameId + ": " + error);
            } else {
                Router.go('/game/'+gameId);
            }
        });

        this.next(); // Wtf?
    }
});

Router.route('/ladder/', {
    title: "Let's GO!",
    name: "ladder",
    template: "go",
    //fastRender: true,
    waitOn: function() {
        return [
            Meteor.subscribe("games"),
            Meteor.subscribe("moves")
        ];
    },
    onBeforeAction: function () {
        Meteor.call("getGame", function(error, game) {
            if (error) {
                alert("Could not get game: " + error);
            } else {
                Session.set("game", game);
            }
        });

        this.next(); // Wtf?
    }
});

Router.route('/game/:_id', {
    title: "Let's GO! (:_id)",
    name: "game",
    template: "go",
    //fastRender: true,
    waitOn: function() {
        return [
            Meteor.subscribe("games", this.params._id),
            Meteor.subscribe("moves", this.params._id)
        ];
    },
    onBeforeAction: function () {
        var gameId = this.params._id;
        Meteor.call("getGame", gameId, function(error, game) {
            if (error) {
                alert("Could not get game " + gameId + ": " + error);
            } else {
                Session.set("game", game);
            }
        });

        this.next(); // Wtf?
    }
});