class Card {
    constructor(suit, rank, name, imagePath) {
        this.suit = suit;
        this.rank = rank;
        this.name = name;
        this.imagePath = imagePath;
    }

    toString() {
        if (this.rank === 14) {
            return `A of ${this.suit}`;
        } else if (this.rank === 13) {
            return `K of ${this.suit}`;
        } else if (this.rank === 12) {
            return `Q of ${this.suit}`;
        } else if (this.rank === 11) {
            return `J of ${this.suit}`;
        } else {
            return `${this.rank} of ${this.suit}`;
        }
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.create();
    }

    get length() {
        return this.cards.length;
    }

    create() {
        const suits = ["Spades", "Hearts", "Clubs", "Diamonds"];
        const rankNames = {
            14: 'Ace',
            13: 'King',
            12: 'Queen',
            11: 'Jack',
            10: '10',
            9: '9',
            8: '8',
            7: '7',
            6: '6',
            5: '5',
            4: '4',
            3: '3',
            2: '2'
        };
    
        for (let suit of suits) {
            for (let rank = 14; rank >= 2; rank--) {
                const cardName = `${rankNames[rank]} Of ${suit}`;
                const imagePath = `/assets/${suit.toLowerCase()}_${rankNames[rank].toLowerCase()}.png`;
                this.cards.push(new Card(suit, rank, cardName, imagePath));
            }
        }
    }

    showDeck() {
        for (let card of this.cards) {
            console.log(card.toString());
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    drawCard() {
        return this.cards.pop();
    }
}

class Player {
    constructor(name, chips, socketId, position) {
        this.name = name;
        this.cardImages = [],
        this.cardNames = [],
        this.chips = chips;
        this.status = '';
        this.betAmount = 0;
        this.socketId = socketId;

        this.intermediateBetMade = 0;

        this.showCards = false;


        this.position = position;
        this.hasActed = false;

        this.hand = [];
        this.chipsWon = 0;
    }

    updateBetAmount(amount) {
        this.betAmount = amount;
        this.chips -= amount;
    }

    updatePlayerStatus(status) {
        this.status = status;
    }

    getPlayerStatus() {
        return this.status;
    }

    draw(card) {
        this.hand.push(card);
        return this;
    }

    showHand() {
        let handStr = this.hand.map(card => card.toString()).join(", ");
        return handStr;
    }
}

module.exports = { Card, Deck, Player };
