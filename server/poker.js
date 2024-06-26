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

        this.startingBigBlind = 20;
        this.currentBigBlind = this.startingBigBlind;

        this.players = [];
        for (let i = 1; i <= numPlayers; i++) {
            this.players.push(new Player("Player " + i, stackSize));
        }
    }

    addPlayer(player) {
        this.players.push(player);
    }

    removePlayer(socketId) {
        this.players = this.players.filter(player => player.socketId !== socketId);
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
        // Group cards by suit
        const suits = cards.reduce((acc, card) => {
            if (!acc[card.suit]) {
                acc[card.suit] = [];
            }
            acc[card.suit].push(card.rank);
            return acc;
        }, {});
        // Check each suit for a Royal Flush
        for (const suit in suits) {
            const flushRanks = new Set(suits[suit]);
            if (flushRanks.has(14) && flushRanks.has(13) && flushRanks.has(12) && flushRanks.has(11) && flushRanks.has(10)) {
                return true;
            }
        }
        return false;
    }

    hasStraightFlush(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        // Group cards by suit
        const suits = cards.reduce((acc, card) => {
            if (!acc[card.suit]) {
                acc[card.suit] = [];
            }
            acc[card.suit].push(card.rank);
            return acc;
        }, {});
        // Check each suit for a Straight Flush
        for (const suit in suits) {
            let ranks = suits[suit];
            ranks = [...new Set(ranks)].sort((a, b) => a - b); // Remove duplicates and sort
            if (ranks.includes(14)) {
                ranks.push(1);
            }
            let maxStraightLength = 0;
            let highCardInStraight = 0;
            for (let i = 0; i < ranks.length - 1; i++) {
                let currentLength = 1;
                let currentHighCard = ranks[i];
                for (let j = i + 1; j < ranks.length; j++) {
                    if (ranks[j] === ranks[j - 1] + 1) {
                        currentLength++;
                        currentHighCard = ranks[j];
                    } else {
                        break;
                    }
                }
                if (currentLength > maxStraightLength) {
                    maxStraightLength = currentLength;
                    highCardInStraight = currentHighCard;
                }
            }
            if (maxStraightLength >= 5) {
                return [true, highCardInStraight];
            }
        }
        return [false, null];
    }

    hasFourOfAKind(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const ranks = cards.map(card => card.rank);
        // Find if there are four cards of the same rank
        for (let rank of new Set(ranks)) {
            if (ranks.filter(r => r === rank).length === 4) {
                // Find the highest card that's not part of the quads as the kicker
                const kicker = Math.max(...cards.filter(card => card.rank !== rank).map(card => card.rank));
                return [true, rank, kicker];
            }
        }
        return [false, null, null];
    }
    
    hasFullHouse(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const ranks = cards.map(card => card.rank);
        let threeOfAKindRank = null;
        let pairRank = null;
        // First, check for three-of-a-kind
        for (let rank of new Set(ranks)) {
            if (ranks.filter(r => r === rank).length === 3) {
                threeOfAKindRank = rank;
                break;
            }
        }
        // Then, check for a pair (that's not the same rank as the three-of-a-kind)
        if (threeOfAKindRank !== null) {
            for (let rank of new Set(ranks)) {
                if (rank !== threeOfAKindRank && ranks.filter(r => r === rank).length >= 2) {
                    pairRank = rank;
                    break;
                }
            }
        }
        if (threeOfAKindRank !== null && pairRank !== null) {
            return [true, threeOfAKindRank, pairRank];
        }
        return [false, null, null];
    }

    hasFlush(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        // Group cards by suit
        const suits = cards.reduce((acc, card) => {
            if (!acc[card.suit]) {
                acc[card.suit] = [];
            }
            acc[card.suit].push(card);
            return acc;
        }, {});
        // Check for a flush in any suit
        for (const suit in suits) {
            if (suits[suit].length >= 5) {
                // Sort the cards of the flush suit by rank, in descending order
                const sortedFlushCards = suits[suit].sort((a, b) => b.rank - a.rank);
                // Return the sorted flush cards
                return [true, sortedFlushCards];
            }
        }
        return [false, null];
    }    

    hasStraight(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        let ranks = cards.map(card => card.rank);
        ranks = [...new Set(ranks)].sort((a, b) => a - b); // Remove duplicates and sort
        // Special handling for Ace (14) which can also be used as 1
        if (ranks.includes(14)) {
            ranks.push(1);
        }
        let maxStraightLength = 0;
        let highCardInStraight = 0;
        for (let i = 0; i < ranks.length - 1; i++) {
            let currentLength = 1;
            let currentHighCard = ranks[i];
            for (let j = i + 1; j < ranks.length; j++) {
                if (ranks[j] === ranks[j - 1] + 1) {
                    currentLength++;
                    currentHighCard = ranks[j];
                } else {
                    break;
                }
            }
            if (currentLength > maxStraightLength) {
                maxStraightLength = currentLength;
                highCardInStraight = currentHighCard;
            }
        }
        if (maxStraightLength >= 5) {
            return [true, highCardInStraight];
        }
        return [false, null];
    }
    
    hasThreeOfAKind(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const ranks = cards.map(card => card.rank);
        let threeOfAKindRank = null;
        let kickers = [];
        // Find the highest three-of-a-kind
        for (let rank of new Set(ranks).values()) {
            if (ranks.filter(r => r === rank).length === 3) {
                threeOfAKindRank = rank;
                // Remove the three-of-a-kind cards from the kicker candidates
                kickers = cards.filter(card => card.rank !== rank).sort((a, b) => b.rank - a.rank);
                break;
            }
        }
        if (threeOfAKindRank !== null) {
            return [true, threeOfAKindRank, kickers[0].rank, kickers[1].rank];
        }
        return [false, null, null];
    }

    hasTwoPair(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const ranks = cards.map(card => card.rank);
        let pairs = ranks.filter(rank => ranks.filter(r => r === rank).length === 2);
        pairs = [...new Set(pairs)]; // Remove duplicates
        if (pairs.length >= 2) {
            // Sort pairs in descending order and take the top two
            pairs.sort((a, b) => b - a);
            const topTwoPairs = pairs.slice(0, 2);
            // Find the kicker (highest card not in the two pairs)
            const kickers = cards.filter(card => !topTwoPairs.includes(card.rank)).sort((a, b) => b.rank - a.rank);
            return [true, topTwoPairs[0], topTwoPairs[1], kickers[0].rank];
        }
        return [false, null, null, null];
    }

    hasOnePair(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const ranks = cards.map(card => card.rank);
        let pairs = ranks.filter(rank => ranks.filter(r => r === rank).length === 2);
        pairs = [...new Set(pairs)]; // Remove duplicates
        if (pairs.length > 0) {
            // Sort pairs in descending order to find the highest pair
            pairs.sort((a, b) => b - a);
            const highestPair = pairs[0];
            // Find the top three kickers (highest cards not in the pair)
            const kickers = cards.filter(card => card.rank !== highestPair).sort((a, b) => b.rank - a.rank);
            return [true, highestPair, kickers[0].rank, kickers[1].rank, kickers[2].rank];
        }
        return [false, null, null, null, null];
    }

    hasHighCard(playerHand) {
        const cards = playerHand.concat(this.board.cards);
        const kickers = cards.sort((a, b) => b.rank - a.rank);
        return [kickers[0].rank, kickers[1].rank, kickers[2].rank, kickers[3].rank, kickers[4].rank];
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
                                                const highCards = this.hasHighCard(player.hand);
                                                handRanking = [1, ...highCards];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            scores.push({ player, handRanking });
        }
    
        console.log("EVALUEATED HANDS");
        for (const score of scores) {
            console.log(score);
        }
        console.log("EVALUEATED HANDS");
        // Sort scores by hand rank and kickers
        scores.sort((a, b) => {
            for (let i = 0; i < Math.min(a.handRanking.length, b.handRanking.length); i++) {
                if (a.handRanking[i] !== b.handRanking[i]) {
                    return b.handRanking[i] - a.handRanking[i];
                }
            }
            return 0;
        });
    
        // Check for ties
        const highestHand = scores[0].handRanking;
        const winners = scores.filter(score => JSON.stringify(score.handRanking) === JSON.stringify(highestHand));
    
        if (winners.length === 1) {
            const winningMessage = winners[0].player.name + ' wins with ' + handRatings[highestHand[0]];
            console.log(winningMessage);
            return { message: winningMessage, winner: winners[0].player };
        } else {
            const winningMessage = "Split pot between " + winners.map(winner => winner.player.name).join(", ") + ".";
            console.log(winningMessage);
            return { message: winningMessage, winners: winners.map(winner => winner.player) };
        }
    }   
}

module.exports = { Poker, Board };