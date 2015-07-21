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

Router.route('/', {
    title: "Let's GO!",
    name: "go",
    template: "go",
    fastRender: true,
    waitOn: function() {
        return [
            Meteor.subscribe("games"),
            Meteor.subscribe("moves")
        ];
    }
});