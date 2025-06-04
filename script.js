document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const playerMoneyDisplayEl = document.getElementById('player-money-display');
    const diceStageEl = document.getElementById('dice-stage');
    const plinkoStageEl = document.getElementById('plinko-stage');
    const gameOverOverlayEl = document.getElementById('game-over-overlay');

    const dice1El = document.getElementById('dice1');
    const dice2El = document.getElementById('dice2');
    const rollDiceBtn = document.getElementById('roll-dice-btn');
    const diceSumTableBody = document.getElementById('dice-sum-table').querySelector('tbody');

    const dropBallBtn = document.getElementById('drop-ball-btn');
    const prizeMessageEl = document.getElementById('prize-message');
    const finalMoneyMessageEl = document.getElementById('final-money-message');
    const highScoreDisplayEl = document.getElementById('high-score-display');
    const highScoreValueEl = document.getElementById('high-score-value');
    const highScorePlayerEl = document.getElementById('high-score-player');
    const playAgainBtn = document.getElementById('play-again-btn');
    const quitSaveBtn = document.getElementById('quit-save-btn'); // New button

    // Game State
    let playerMoney = 6; // Initial player money for a new session
    const initialPlayerMoney = 6; // To reset for new game
    const rollCost = 3;
    let selectedSlotNumber = 0;
    let diceRollAnimationInterval;
    const highScoreKey = 'plinkoDiceHighScore'; // localStorage key

    function updateMoneyDisplay() {
        playerMoneyDisplayEl.textContent = `$${playerMoney}`;
        if (playerMoney < rollCost) {
            rollDiceBtn.disabled = true;
            rollDiceBtn.textContent = "Not enough money!";
        } else {
            rollDiceBtn.disabled = false;
            rollDiceBtn.textContent = `Roll Dice (Cost: $${rollCost})`;
        }
    }

    function loadAndDisplayHighScore() {
        const storedScore = localStorage.getItem(highScoreKey);
        if (storedScore) {
            const { name, score } = JSON.parse(storedScore);
            highScoreValueEl.textContent = `$${score}`;
            highScorePlayerEl.textContent = name;
            highScoreDisplayEl.classList.remove('hidden');
        } else {
            highScoreDisplayEl.classList.add('hidden'); // Hide if no score yet
        }
    }

    function saveScore(playerName, currentMoney) {
        const existingScoreData = localStorage.getItem(highScoreKey);
        let newHighScore = true;

        if (existingScoreData) {
            const { score: existingHighScore } = JSON.parse(existingScoreData);
            if (currentMoney <= existingHighScore) {
                newHighScore = false; // Only save if it's a new high score
            }
        }

        if (newHighScore) {
            localStorage.setItem(highScoreKey, JSON.stringify({ name: playerName, score: currentMoney }));
            loadAndDisplayHighScore(); // Refresh display
            alert(`New high score of $${currentMoney} saved for ${playerName}!`);
        } else if (!newHighScore && existingScoreData) {
             alert(`Your score of $${currentMoney} was not higher than the current high score.`);
        } else {
             localStorage.setItem(highScoreKey, JSON.stringify({ name: playerName, score: currentMoney }));
             loadAndDisplayHighScore(); // Refresh display
             alert(`Score of $${currentMoney} saved for ${playerName}!`);
        }
    }

    function handleQuitAndSave() {
        gameOverOverlayEl.classList.add('hidden'); // Hide overlay temporarily
        let playerName = prompt("Enter your name to save your score (final money will be your score):", "Player");
        if (playerName && playerName.trim() !== "") {
            saveScore(playerName.trim(), playerMoney);
        } else if (playerName === "") {
             alert("No name entered. Score not saved.");
        } else { // User cancelled prompt
            alert("Score not saved.");
        }
        // After saving (or not), show a final message or just end.
        // For now, we'll just effectively end the game session.
        // To fully "quit", you might hide game-container or show a thank you message.
        diceStageEl.classList.add('hidden'); // Hide main game stages
        plinkoStageEl.classList.add('hidden');
        // Optionally display a "Thanks for playing!" message
        alert("Thanks for playing! Refresh to start a new session.");
        // Or disable buttons, etc.
        rollDiceBtn.disabled = true;
        rollDiceBtn.textContent = "Game Over";
    }


    function initGame() {
        playerMoney = initialPlayerMoney; // Reset money for a new game session
        diceStageEl.classList.remove('hidden');
        plinkoStageEl.classList.add('hidden');
        gameOverOverlayEl.classList.add('hidden');
        dropBallBtn.classList.add('hidden');

        dice1El.textContent = '1';
        dice2El.textContent = '1';
        dice1El.classList.remove('rolling');
        dice2El.classList.remove('rolling');
        clearTableHighlights();
        updateMoneyDisplay();

        if (canvas) {
            initializePlinkoCanvas();
        }
        loadAndDisplayHighScore(); // Load high score when game starts (or game over screen shows)
    }

    function startDiceRollAnimation() {
        let animationTicks = 0;
        const maxTicks = 10;
        dice1El.classList.add('rolling');
        dice2El.classList.add('rolling');
        diceRollAnimationInterval = setInterval(() => {
            dice1El.textContent = Math.floor(Math.random() * 6) + 1;
            dice2El.textContent = Math.floor(Math.random() * 6) + 1;
            animationTicks++;
            if (animationTicks >= maxTicks) {
                stopDiceRollAnimationAndProceed();
            }
        }, 100);
    }

    function stopDiceRollAnimationAndProceed() {
        clearInterval(diceRollAnimationInterval);
        dice1El.classList.remove('rolling');
        dice2El.classList.remove('rolling');
        const val1 = Math.floor(Math.random() * 6) + 1;
        const val2 = Math.floor(Math.random() * 6) + 1;
        const sum = val1 + val2;
        dice1El.textContent = val1;
        dice2El.textContent = val2;
        selectedSlotNumber = getSlotFromSum(sum);
        highlightTableRow(sum);
        setTimeout(() => {
            transitionToPlinko();
        }, 2000);
    }

    function rollDice() {
        if (playerMoney < rollCost) {
            // Automatically trigger quit/save if not enough money
            showGameOver(true); // Pass true to indicate "out of money"
            return;
        }
        playerMoney -= rollCost;
        updateMoneyDisplay();
        rollDiceBtn.disabled = true;
        startDiceRollAnimation();
    }

    function getSlotFromSum(sum) {
        if (sum <= 3) return 1;
        if (sum <= 5) return 2;
        if (sum <= 8) return 3;
        if (sum <= 10) return 4;
        if (sum <= 12) return 5;
        return 3;
    }

    function clearTableHighlights() {
        diceSumTableBody.querySelectorAll('tr').forEach(row => {
            row.classList.remove('highlighted');
        });
    }

    function highlightTableRow(sum) {
        clearTableHighlights();
        const rows = diceSumTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const sumKey = row.dataset.sumKey.split(',');
            if (sumKey.includes(String(sum))) {
                row.classList.add('highlighted');
            }
        });
    }

    function transitionToPlinko() {
        diceStageEl.classList.add('hidden');
        plinkoStageEl.classList.remove('hidden');
        if (!canvas) initializePlinkoCanvas();
        drawFullPlinkoBoard();
        resetBall(selectedSlotNumber);
        drawBall(ball);
        dropBallBtn.classList.remove('hidden');
    }
    
    function onDropBallClicked() {
        dropBallBtn.classList.add('hidden');
        startBallAnimation();
    }

    function showGameOver(isOutOfMoney = false) {
        loadAndDisplayHighScore(); // Make sure high score is current
        
        if (isOutOfMoney) {
            prizeMessageEl.textContent = "Out of Money!";
            finalMoneyMessageEl.textContent = `Your final amount is $${playerMoney}.`;
            playAgainBtn.classList.add('hidden'); // Hide play again if no money
        } else {
             playAgainBtn.classList.remove('hidden');
        }
        gameOverOverlayEl.classList.remove('hidden');
    }

    window.handleBallLanded = function(prizeString) {
        let prizeAmount = 0;
        if (prizeString !== "Lost!") {
            const match = prizeString.match(/([+-])?(\d+)/);
            if (match) {
                prizeAmount = parseInt(match[2]);
                if (match[1] === '-') {
                    prizeAmount *= -1;
                }
            }
        }
        playerMoney += prizeAmount;
        // Don't call updateMoneyDisplay() here, as it might re-enable rollDiceBtn prematurely
        prizeMessageEl.textContent = `You won ${prizeString}!`;
        finalMoneyMessageEl.textContent = `Your new total is $${playerMoney}.`;
        
        showGameOver(playerMoney < rollCost); // Show game over, check if out of money for next round
    }

    // Event Listeners
    rollDiceBtn.addEventListener('click', rollDice);
    dropBallBtn.addEventListener('click', onDropBallClicked);
    
    playAgainBtn.addEventListener('click', () => {
        if (playerMoney < rollCost) {
            alert("You don't have enough money to play again. Please save your score or refresh for a new session.");
            // Optionally directly call handleQuitAndSave() here
            // handleQuitAndSave();
            return;
        }
        gameOverOverlayEl.classList.add('hidden');
        // initGame() will reset playerMoney to initialPlayerMoney.
        // If you want the player to continue with their current winnings,
        // you'd need a different reset logic. For now, new game = fresh start.
        initGame(); // This will reset playerMoney to initialPlayerMoney for a "new session"
                    // If you want to continue with current money, just hide overlay and update UI.
                    // For this example, Play Again means a full reset of money to starting amount.
    });

    quitSaveBtn.addEventListener('click', handleQuitAndSave);

    // Initialize
    initGame();
});