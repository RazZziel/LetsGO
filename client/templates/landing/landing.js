Template.landing.events({
    'click #createGame': function (event) {
        Router.go("/game/");
    },
    'submit #joinGame': function (event) {
    	console.log(event.target.gameId.value);
        Router.go("/game/"+event.target.gameId.value);
        return false;
    }
});