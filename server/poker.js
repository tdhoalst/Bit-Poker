const { Card, Deck, Player } = require('./card.js');

class Board {
    constructor() {
        this.cards = [];
    }

    addCard(card) {
        this.cards.push(card);
    }

    showBoard() {
        const boardStr = this.cards.map((card, i) => {
            if (i === this.cards.length - 1) {
                return card.toString();
            } else {
                return card.toString() + ", ";
            }
        }).join("");
        console.log("The Board is: " + boardStr);
    }

    clear() {
        this.cards = [];
    }
}

class Poker {
    constructor(numPlayers, stackSize) {
        this.deck = new Deck();
        this.deck.shuffle();
        this.board = new Board();
        this.players = [];
        for (let i = 1; i <= numPlayers; i++) {
            this.players.push(new Player("Player " + i, stackSize));
        }
    }

    preFlop() {
        for (const player of this.players) {
            for (let i = 0; i < 2; i++) {
                player.draw(this.deck.drawCard());
            }
            console.log("Player " + player.name + " draws: " + player.showHand());
        }
        return this;
    }

    flop() {
        for (let i = 0; i < 3; i++) {
            this.board.addCard(this.deck.drawCard());
        }
        console.log("The Flop is: ");
        this.board.showBoard();
        return this;
    }

    turn() {
        this.board.addCard(this.deck.drawCard());
        console.log("The Turn is: ");
        this.board.showBoard();
        return this;
    }

    river() {
        this.board.addCard(this.deck.drawCard());
        console.log("The River is: ");
        this.board.showBoard();
        return this;
    }

    hasRoyalFlush(playerHand) { 
        const cards = playerHand.concat(this.board.cards);
        const flushRanks = new Set(cards.filter(card => cards.filter(c => c.suit === card.suit).length >= 5).map(card => card.rank));
        if (flushRanks.has(14) && flushRanks.has(13) && flushRanks.has(12) && flushRanks.has(11) && flushRanks.has(10)) {
            return true;
        }
        return false;
    }

    hasStraightFlush(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const flushCards = cards.filter(card => cards.filter(c => c.suit === card.suit).length >= 5);
        if (flushCards.length >= 5) {
            const flushRanks = flushCards.map(card => card.rank).sort((a, b) => a - b);
            if(flushRanks.includes(14) && flushRanks.includes(2) && flushRanks.includes(3) && flushRanks.includes(4) && flushRanks.includes(5)) {
                if(flushRanks.includes(6)) {
                    if(flushRanks.includes(7)) {
                        return [true, 7];
                    }
                    return [true, 6];
                }
                return [true, 5];
            }
            let maxConnectedCards = 0;
            let numConnectedCards = 0;
            for (let i = 0; i < flushRanks.length - 1; i++) {
                if (flushRanks[i] === flushRanks[i + 1] - 1) {
                    numConnectedCards++;
                } else {
                    numConnectedCards = 0;
                }
                if (numConnectedCards > maxConnectedCards) {
                    maxConnectedCards = numConnectedCards;
                }
            }
            if (maxConnectedCards >= 4) {
                return [true, flushRanks[maxConnectedCards]];
            }
        }
        return [false, null];
    }

    hasFourOfAKind(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const ranks = cards.map(card => card.rank);
        const quads = [...new Set(ranks.filter(rank => ranks.filter(r => r === rank).length === 4))];
        if (quads.length > 0) {
            const kicker = Math.max(...cards.filter(card => card.rank !== quads[0]).map(card => card.rank));
            return [true, quads[0], kicker];
        }
        return [false, null, null];
    }

    hasFullHouse(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const ranks = cards.map(card => card.rank).sort((a, b) => a - b);
        const threeOfAKind = [...new Set(ranks.filter(rank => ranks.filter(r => r === rank).length === 3))];
        const pair = [...new Set(ranks.filter(rank => ranks.filter(r => r === rank).length >= 2 && rank !== threeOfAKind[0]))];
        if (threeOfAKind.length > 0 && pair.length > 0) {
            return [true, threeOfAKind[0], pair[0]];
        }
        return [false, null, null];
    }

    hasFlush(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const flushSuit = cards.filter(card => cards.filter(c => c.suit === card.suit).length >= 5);
        if (flushSuit.length >= 5) {
            const flushRanks = flushSuit.map(card => card.rank).sort((a, b) => a - b);
            return [true, flushranks[flushRanks.length -1]];
        }
        return [false, []];
    }

    hasStraight(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const ranks = cards.map(card => card.rank).sort((a, b) => a - b);
        if(ranks.includes(14) && ranks.includes(2) && ranks.includes(3) && ranks.includes(4) && ranks.includes(5)) {
            if(ranks.includes(6)) {
                if(ranks.includes(7)) {
                    return [true, 7];
                }
                return [true, 6];
            }
            return [true, 5];
        }
        let maxConnectedCards = 0;
        let numConnectedCards = 0;
        for (let i = 0; i < ranks.length - 1; i++) {
            if (ranks[i] === ranks[i + 1] - 1) {
                numConnectedCards++;
            } else {
                numConnectedCards = 0;
            }
            if (numConnectedCards > maxConnectedCards) {
                maxConnectedCards = numConnectedCards;
            }
        }
        if (maxConnectedCards >= 4) {
            return [true, ranks[maxConnectedCards]];
        }
        return [false, null];
    }

    hasThreeOfAKind(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const ranks = cards.map(card => card.rank);
        const threeOfAKind = [...new Set(ranks.filter(rank => ranks.filter(r => r === rank).length === 3))];
        if (threeOfAKind.length > 0) {
            const kickers = cards.filter(card => card.rank !== threeOfAKind[0]).sort((a, b) => b.rank - a.rank);
            return [true, threeOfAKind[0], kickers[0].rank, kickers[1].rank];
        }
        return [false, null, null];
    }

    hasTwoPair(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const ranks = cards.map(card => card.rank);
        const pairs = [...new Set(ranks.filter(rank => ranks.filter(r => r === rank).length === 2))];
        if (pairs.length >= 2) {
            const kickers = cards.filter(card => card.rank !== pairs[0] && card.rank !== pairs[1]).sort((a, b) => b.rank - a.rank);
            return [true, pairs[0], pairs[1], kickers[0].rank];
        }
        return [false, null, null, null];
    }

    hasOnePair(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const ranks = cards.map(card => card.rank);
        const pair = [...new Set(ranks.filter(rank => ranks.filter(r => r === rank).length === 2))];
        if (pair.length > 0) {
            const kickers = cards.filter(card => card.rank !== pair[0]).sort((a, b) => b.rank - a.rank);
            return [true, pair[0], kickers[0].rank, kickers[1].rank, kickers[2].rank];
        }
        return [false, null, null];
    }

    hasHighCard(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const kickers = cards.sort((a, b) => b.rank - a.rank);
        return [true, kickers[0].rank, kickers[1].rank, kickers[2].rank, kickers[3].rank, kickers[4].rank];
    }

    evaluateHand() {
        const handRatings = {
            10: 'Royal Flush',
            9: 'Straight Flush',
            8: 'Four of a Kind',
            7: 'Full House',
            6: 'Flush',
            5: 'Straight',
            4: 'Three of a Kind',
            3: 'Two Pair',
            2: 'One Pair',
            1: 'High Card'
        };

        const scores = [];

        for (const player of this.players) {
            let handRanking;

            const royalFlush = this.hasRoyalFlush(player.hand);
            if (royalFlush) {
                handRanking = [10];
            } else {
                const [hasStraightFlush, straightFlushHigh] = this.hasStraightFlush(player.hand);
                if (hasStraightFlush) {
                    handRanking = [9, straightFlushHigh];
                } else {
                    const [hasFourOfAKind, quadsRank, kicker] = this.hasFourOfAKind(player.hand);
                    if (hasFourOfAKind) {
                        handRanking = [8, quadsRank, kicker];
                    } else {
                        const [hasFullHouse, trips, pair] = this.hasFullHouse(player.hand);
                        if (hasFullHouse) {
                            handRanking = [7, trips, pair];
                        } else {
                            const [hasFlush, flushRanks] = this.hasFlush(player.hand);
                            if (hasFlush) {
                                handRanking = [6, flushRanks[0], flushRanks[1], flushRanks[2], flushRanks[3], flushRanks[4]];
                            } else {
                                const [hasStraight, straightHigh] = this.hasStraight(player.hand);
                                if (hasStraight) {
                                    handRanking = [5, straightHigh];
                                } else {
                                    const [threeOfAKind, tripsRank, kicker1, kicker2] = this.hasThreeOfAKind(player.hand);
                                    if (threeOfAKind) {
                                        handRanking = [4, tripsRank, kicker1, kicker2];
                                    } else {
                                        const [hasTwoPairs, pair1Rank, pair2Rank, kicker] = this.hasTwoPair(player.hand);
                                        if (hasTwoPairs) {
                                            handRanking = [3, pair1Rank, pair2Rank, kicker];
                                        } else {
                                            const [hasOnePair, pairRank, kicker1, kicker2, kicker3] = this.hasOnePair(player.hand);
                                            if (hasOnePair) {
                                                handRanking = [2, pairRank, kicker1, kicker2, kicker3];
                                            } else {
                                                const [hasHighCard, kicker1, kicker2, kicker3, kicker4, kicker5] = this.hasHighCard(player.hand);
                                                if (hasHighCard) {
                                                    handRanking = [1, kicker1, kicker2, kicker3, kicker4, kicker5];
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            scores.push(handRanking);
        }

        console.log("EVALUEATED HANDS");
        for (const score of scores) {
            console.log(score);
        }
        console.log("EVALUEATED HANDS");

        const maxHandRank = scores.reduce((prev, current) => (prev[0] > current[0] ? prev : current), [0]);
        
        if (maxHandRank !== null) {
            const highestRanking = maxHandRank[0];
            const playerIndex = scores.findIndex(hand => hand[0] === highestRanking);
            console.log(this.players[playerIndex].name + ' wins with ' + handRatings[highestRanking]);
        } else {
            console.log("Split pot. It's a draw!");
        }
    }
}

module.exports = { Poker, Board };