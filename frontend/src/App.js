import React, { useState, useEffect } from 'react';
import './App.css';
import { createDeck, drawCards, drawSinglePair, formatCard, sortCards } from './utils/cardUtils';

function App() {
  // Game state
  const [turnNumber, setTurnNumber] = useState(1);
  const [deck, setDeck] = useState(createDeck());
  const [currentPairs, setCurrentPairs] = useState([]);
  const [selectedPairs, setSelectedPairs] = useState([]);
  const [hasSelectedPair, setHasSelectedPair] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const [stockPrice, setStockPrice] = useState(null);
  const [isInitialRoll, setIsInitialRoll] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [showDrawPile, setShowDrawPile] = useState(false);
  const [extraPair, setExtraPair] = useState(null);
  const [sevenCards, setSevenCards] = useState([
    { suit: '♥', value: '7', highlighted: false },
    { suit: '♠', value: '7', highlighted: false }
  ]);

  // Constants
  const MAX_TURNS = 8;

  // Utility functions
  const getCardValue = (value) => {
    const valueMap = {
      'A': 1, 'J': 11, 'Q': 12, 'K': 13
    };
    return valueMap[value] || parseInt(value);
  };

  const rollDice = (mode = 'normal') => {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    
    if (mode === 'inflation') {
      const dice3 = Math.floor(Math.random() * 6) + 1;
      return { 
        dice1, 
        dice2, 
        dice3, 
        result: (dice1 + dice2) - dice3 
      };
    } else if (mode === 'tapering') {
      const dice3 = Math.floor(Math.random() * 6) + 1;
      return { 
        dice1, 
        dice2, 
        dice3, 
        result: dice1 - dice2 - dice3 
      };
    }
    
    return { dice1, dice2, result: dice1 - dice2 };
  };

  const updateStockPrice = (result) => {
    if (stockPrice === null) return;
    
    let newPrice = stockPrice + result;
    if (newPrice <= 0) newPrice += 20;
    if (newPrice > 20) newPrice -= 20;
    setStockPrice(newPrice);
  };

  const getBreakevenPrice = (pair) => {
    const bigValue = getCardValue(pair.big.value);
    const smallValue = getCardValue(pair.small.value);
    const isRed = pair.big.suit === '♥' || pair.big.suit === '♦';
    
    const breakeven = isRed ? bigValue + smallValue : bigValue - smallValue;
    const prefix = isRed ? '>=' : '<=';
    
    return `${prefix}${breakeven}`;
  };

  // Game actions
  const handleInitialRoll = () => {
    const { dice1, dice2 } = rollDice();
    const initialPrice = dice1 + dice2 >= 7 ? 11 : 10;
    setStockPrice(initialPrice);
    setIsInitialRoll(false);
  };

  const handleGameStart = () => {
    const { pairs, remainingDeck } = drawCards(deck);
    setCurrentPairs(pairs);
    setDeck(remainingDeck);
    setGameStarted(true);

    // Draw one extra pair for the bottom right
    const { pair, remainingDeck: newDeck } = drawSinglePair(remainingDeck);
    setExtraPair(pair);
    setDeck(newDeck);
  };

  const handleNextTurn = (mode = 'normal') => {
    if (!hasSelectedPair && turnNumber > 1) return;

    const nextTurn = turnNumber + 1;
    setTurnNumber(nextTurn);
    setHasSelectedPair(false);

    // Roll dice and update stock price
    const result = rollDice(mode);
    setDiceResult(result);
    updateStockPrice(result.result);

    // Draw cards only if not at turn 8
    if (nextTurn < MAX_TURNS) {
      const { pairs, remainingDeck } = drawCards(deck);
      setCurrentPairs(pairs);
      setDeck(remainingDeck);
    } else {
      setGameEnded(true);
    }

    // Remove highlighted seven card if used
    if (mode !== 'normal') {
      setSevenCards(prev => prev.filter(card => !card.highlighted));
    }
  };

  const handleSelectPair = (pair) => {
    if (hasSelectedPair) return;
    
    setSelectedPairs(prev => {
      const newPairs = [...prev, pair];
      return sortCards(newPairs.map(p => p.big)).map(bigCard => 
        newPairs.find(p => p.big.suit === bigCard.suit && p.big.value === bigCard.value)
      );
    });
    setCurrentPairs(prev => prev.filter(p => p !== pair));
    setHasSelectedPair(true);
  };

  const handleSevenCardClick = (index) => {
    setSevenCards(prev => prev.map((card, i) => 
      i === index ? { ...card, highlighted: !card.highlighted } : card
    ));
  };

  const hasHighlightedSeven = sevenCards.some(card => card.highlighted);

  const handleCardColorChange = (card, isExtraPair = false) => {
    if (!hasHighlightedSeven || turnNumber !== MAX_TURNS) return;

    // Define color conversion mapping
    const colorConversion = {
      '♥': '♠',
      '♠': '♥',
      '♦': '♣',
      '♣': '♦'
    };

    const newSuit = colorConversion[card.suit];
    const newCard = { ...card, suit: newSuit };

    if (isExtraPair) {
      setExtraPair(prev => ({
        ...prev,
        big: newCard
      }));
    } else {
      setSelectedPairs(prev => prev.map(pair => 
        pair.big.suit === card.suit && pair.big.value === card.value
          ? { ...pair, big: newCard }
          : pair
      ));
    }

    // Remove the highlighted seven card
    setSevenCards(prev => prev.filter(card => !card.highlighted));
  };

  // Card info calculations
  const getSelectedCardsInfo = () => {
    const bigRedCards = selectedPairs
      .filter(pair => pair.big.suit === '♥' || pair.big.suit === '♦')
      .map(pair => pair.big);

    const bigBlackCards = selectedPairs
      .filter(pair => pair.big.suit === '♠' || pair.big.suit === '♣')
      .map(pair => pair.big);

    const totalCost = selectedPairs.reduce((sum, pair) => 
      sum + getCardValue(pair.small.value), 0);

    const totalValue = selectedPairs.reduce((sum, pair) => {
      if (stockPrice === null) return 0;
      
      const rank = getCardValue(pair.big.value);
      const isRed = pair.big.suit === '♥' || pair.big.suit === '♦';
      
      return sum + (isRed 
        ? Math.max(stockPrice - rank, 0)
        : Math.max(rank - stockPrice, 0));
    }, 0);

    // Include extra pair in calculations if game has ended
    let finalTotalCost = totalCost;
    let finalTotalValue = totalValue;

    if (gameEnded && extraPair) {
      finalTotalCost += getCardValue(extraPair.small.value);
      const rank = getCardValue(extraPair.big.value);
      const isRed = extraPair.big.suit === '♥' || extraPair.big.suit === '♦';
      finalTotalValue += isRed 
        ? Math.max(stockPrice - rank, 0)
        : Math.max(rank - stockPrice, 0);
    }

    return { 
      bigRedCards, 
      bigBlackCards, 
      totalCost: finalTotalCost, 
      totalValue: finalTotalValue, 
      pnl: finalTotalValue - finalTotalCost 
    };
  };

  // Render functions
  const renderDrawPile = () => {
    const sortedDeck = sortCards(deck);
    const suits = ['♥', '♦', '♠', '♣'];
    
    return (
      <div className="draw-pile">
        {suits.map(suit => (
          <div key={suit} className="suit-column">
            <div className="suit-header">{suit}</div>
            {sortedDeck
              .filter(card => card.suit === suit)
              .map((card, index) => (
                <div key={`${suit}-${index}`} className="card">
                  {formatCard(card)}
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  };

  const { bigRedCards, bigBlackCards, totalCost, totalValue, pnl } = getSelectedCardsInfo();

  return (
    <div className="App">
      <header className="App-header">
        {/* Selected Cards Info */}
        <div className="selected-cards-info">
          <div className="selected-red">
            <h3>Selected Red Cards:</h3>
            <div className="selected-cards">
              {bigRedCards.map((card, index) => (
                <div 
                  key={`red-${index}`} 
                  className={`card ${hasHighlightedSeven && turnNumber === MAX_TURNS ? 'convertible' : ''}`}
                  onClick={() => handleCardColorChange(card)}
                >
                  {formatCard(card)}
                </div>
              ))}
            </div>
          </div>
          <div className="selected-black">
            <h3>Selected Black Cards:</h3>
            <div className="selected-cards">
              {bigBlackCards.map((card, index) => (
                <div 
                  key={`black-${index}`} 
                  className={`card ${hasHighlightedSeven && turnNumber === MAX_TURNS ? 'convertible' : ''}`}
                  onClick={() => handleCardColorChange(card)}
                >
                  {formatCard(card)}
                </div>
              ))}
            </div>
          </div>
          <div className="selected-value">
            <h3>Total Cost: {totalCost}</h3>
            <h3>Total Value: {totalValue}</h3>
            <h3>PnL: {pnl}</h3>
          </div>
        </div>

        {/* Game Status Info */}
        <div className="game-status">
          <div className="turn-display">
            <h2>Turn: {turnNumber}</h2>
          </div>
          
          <div className="stock-price">
            <h3>
              Stock Price: {stockPrice !== null ? (
                <>
                  {stockPrice}
                  {diceResult && (
                    <span className="price-change">
                      ({diceResult.result > 0 ? '+' : ''}{diceResult.result})
                    </span>
                  )}
                </>
              ) : 'Roll to start'}
            </h3>
            {isInitialRoll && (
              <button onClick={handleInitialRoll} className="roll-button">
                Roll for Initial Price
              </button>
            )}
          </div>

          <div className="dice-result">
            {diceResult && (
              <div>
                <h3>Dice:</h3>
                <p>
                  {diceResult.dice1},{diceResult.dice2}
                  {diceResult.dice3 && `,${diceResult.dice3}`}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Card Pairs Display */}
        {!gameEnded && (
          <div className="card-pairs">
            {currentPairs.map((pair, index) => (
              <div key={index} className="card-pair">
                <div className="card big">{formatCard(pair.big)}</div>
                <div className="card small">{formatCard(pair.small)}</div>
                <div className="breakeven-price">
                  Breakeven: {getBreakevenPrice(pair)}
                </div>
                <button 
                  onClick={() => handleSelectPair(pair)}
                  className="select-pair-button"
                  disabled={hasSelectedPair}
                >
                  Select Pair
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Extra Pair Display */}
        {gameStarted && extraPair && (
          <div className="extra-pair">
            <div className="card-pair">
              <div 
                className={`card big ${hasHighlightedSeven && turnNumber === MAX_TURNS ? 'convertible' : ''}`}
                onClick={() => handleCardColorChange(extraPair.big, true)}
              >
                {formatCard(extraPair.big)}
              </div>
              <div className="card small">{formatCard(extraPair.small)}</div>
              <div className="breakeven-price">
                Breakeven: {getBreakevenPrice(extraPair)}
              </div>
            </div>
          </div>
        )}

        {/* Seven Cards Display */}
        {gameStarted && (
          <div className="seven-cards">
            {sevenCards.map((card, index) => (
              <div 
                key={index} 
                className={`seven-card ${card.highlighted ? 'highlighted' : ''}`}
                onClick={() => handleSevenCardClick(index)}
              >
                {formatCard(card)}
              </div>
            ))}
          </div>
        )}

        {/* Game Control Buttons */}
        {!gameStarted ? (
          <button 
            onClick={handleGameStart} 
            className="game-start-button"
            disabled={isInitialRoll}
          >
            Game Start
          </button>
        ) : !gameEnded ? (
          hasHighlightedSeven ? (
            <div className="special-turn-buttons">
              <button 
                onClick={() => handleNextTurn('inflation')} 
                className="next-turn-button inflation"
                disabled={!hasSelectedPair}
              >
                Next Turn: Inflation
              </button>
              <button 
                onClick={() => handleNextTurn('tapering')} 
                className="next-turn-button tapering"
                disabled={!hasSelectedPair}
              >
                Next Turn: Tapering
              </button>
            </div>
          ) : (
            <button 
              onClick={() => handleNextTurn()} 
              className="next-turn-button"
              disabled={!hasSelectedPair}
            >
              Next Turn
            </button>
          )
        ) : (
          <div className="game-ended">
            <h3>Game Ended</h3>
            <p>Final Results:</p>
            <p>Total Cost: {totalCost}</p>
            <p>Total Value: {totalValue}</p>
            <p>PnL: {pnl}</p>
          </div>
        )}

        {/* Draw Pile Button and Display */}
        <div className="draw-pile-container">
          <button onClick={() => setShowDrawPile(!showDrawPile)} className="draw-pile-button">
            Draw Pile ({deck.length})
          </button>
          {showDrawPile && renderDrawPile()}
        </div>
      </header>
    </div>
  );
}

export default App;