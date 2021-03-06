# Let's GO

Let's GO is a casual, multi-player (no AI) game of go/baduk/wéiqí, like a dumbed-down [OGS](https://online-go.com), developed merely as a [Meteor](https://www.meteor.com/) testing exercise.

# Use cases

## Casual game

* P1 clicks "Create casual game"
* System generates a random unique ID for the game, which generates a unique link
* P1 can share the game with P2
 * Copy link
 * Email link
 * Share link on Facebook, Twitter, G+, etc
* First person to open the link becomes P2

## Ranked game (not implemented yet)

* P1 clicks "Search game"
* P1 logs in or registers
* System finds an opponent with a matching strength
 * Optinally, if strengts are close but not equal, it'd be cool to compensate with automatically calculated handicaps
* After the match, strengths are recalculated

# Props

This project was built on the shoulders of several giants:

* **Meteor**: https://www.meteor.com/
* **WGo.js**: http://wgo.waltheri.net/
