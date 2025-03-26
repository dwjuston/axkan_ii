// Create a deck of 46 cards (excluding jokers and 7s)
export const createDeck = () => {
  const suits = ['♥', '♦', '♠', '♣'];
  const smallCards = ['A', '2', '3', '4', '5', '6'];
  const bigCards = ['8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];

  // Add small cards
  suits.forEach(suit => {
    smallCards.forEach(card => {
      deck.push({ suit, value: card, type: 'small' });
    });
  });

  // Add big cards
  suits.forEach(suit => {
    bigCards.forEach(card => {
      deck.push({ suit, value: card, type: 'big' });
    });
  });

  return shuffleDeck(deck);
};

// Fisher-Yates shuffle algorithm
export const shuffleDeck = (deck) => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// Draw a single pair of cards (1 small + 1 big)
export const drawSinglePair = (deck) => {
  const smallCard = deck.filter(card => card.type === 'small')[0];
  const bigCard = deck.filter(card => card.type === 'big')[0];
  
  const pair = {
    small: smallCard,
    big: bigCard
  };

  // Remove drawn cards from deck
  const remainingDeck = deck.filter(card => 
    !(card.suit === smallCard.suit && card.value === smallCard.value) &&
    !(card.suit === bigCard.suit && card.value === bigCard.value)
  );

  return { pair, remainingDeck };
};

// Draw 3 pairs of cards (3 small + 3 big)
export const drawCards = (deck) => {
  const smallCards = deck.filter(card => card.type === 'small').slice(0, 3);
  const bigCards = deck.filter(card => card.type === 'big').slice(0, 3);
  
  const pairs = smallCards.map((smallCard, index) => ({
    small: smallCard,
    big: bigCards[index]
  }));

  // Remove drawn cards from deck
  const remainingDeck = deck.filter(card => 
    !smallCards.some(drawn => drawn.suit === card.suit && drawn.value === card.value) &&
    !bigCards.some(drawn => drawn.suit === card.suit && drawn.value === card.value)
  );

  return { pairs, remainingDeck };
};

// Format card for display
export const formatCard = (card) => {
  const color = card.suit === '♥' || card.suit === '♦' ? 'red' : 'black';
  return (
    <span style={{ color }}>
      {card.value}{card.suit}
    </span>
  );
};

// Get numeric value for sorting
const getNumericValue = (value) => {
  const valueMap = {
    'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8,
    '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, 'A': 1
  };
  return valueMap[value];
};

// Sort cards by suit and rank
export const sortCards = (deck) => {
  const suitOrder = ['♥', '♦', '♠', '♣'];
  
  return [...deck].sort((a, b) => {
    // First sort by suit
    const suitIndexA = suitOrder.indexOf(a.suit);
    const suitIndexB = suitOrder.indexOf(b.suit);
    
    if (suitIndexA !== suitIndexB) {
      return suitIndexA - suitIndexB;
    }
    
    // Then sort by rank (high to low)
    return getNumericValue(b.value) - getNumericValue(a.value);
  });
}; 