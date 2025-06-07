document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const currentPlayerNameDisplayEl = document.getElementById('current-player-name-display');
    const playerMoneyDisplayEl = document.getElementById('player-money-display');
    const playerInfoEl = document.getElementById('player-info');

    const namePromptStageEl = document.getElementById('name-prompt-stage');
    const playerNameInputEl = document.getElementById('player-name-input');
    const startGameBtn = document.getElementById('start-game-btn');

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
    const highScoreListEl = document.getElementById('high-score-list');

    const playAgainBtn = document.getElementById('play-again-btn');
    const quitGameBtn = document.getElementById('quit-game-btn');

    // Game State
    let currentPlayerName = "";
    let playerMoney = 0;
    // --- MODIFICATION START ---
    let sessionMaxMoney = 0; // To track the peak money during the current session
    // --- MODIFICATION END ---
    const initialPlayerMoney = 6;
    const rollCost = 3;
    let selectedSlotNumber = 0;
    let diceRollAnimationInterval;
    const topScoresKey = 'plinkoDiceTopScores';
    const maxTopScores = 10;
    let isGameActive = false;
    let isOverlayVisible = false;

    console.log("Script loaded. Initial isGameActive:", isGameActive, "isOverlayVisible:", isOverlayVisible);

    function getTopScores() {
        const scoresJSON = localStorage.getItem(topScoresKey);
        return scoresJSON ? JSON.parse(scoresJSON) : [];
    }

    function saveScoreToTopList(name, score) {
        let topScores = getTopScores();
        topScores.push({ name, score });
        topScores.sort((a, b) => b.score - a.score);
        topScores = topScores.slice(0, maxTopScores);
        localStorage.setItem(topScoresKey, JSON.stringify(topScores));
        return topScores;
    }

    function displayTopScores(scores) {
        highScoreListEl.innerHTML = '';
        if (scores && scores.length > 0) {
            scores.forEach(entry => {
                const listItem = document.createElement('li');
                listItem.textContent = `${entry.name}: $${entry.score}`;
                highScoreListEl.appendChild(listItem);
            });
            highScoreDisplayEl.classList.remove('hidden');
        } else {
            highScoreListEl.innerHTML = '<li>No scores yet!</li>';
            highScoreDisplayEl.classList.remove('hidden');
        }
    }

    // --- UI UPDATE FUNCTIONS ---
    function updatePlayerInfoDisplay() {
        currentPlayerNameDisplayEl.textContent = currentPlayerName || "Guest";
        playerMoneyDisplayEl.textContent = `$${playerMoney}`;

        if (rollDiceBtn) {
            if (!isGameActive || playerMoney < rollCost) {
                rollDiceBtn.disabled = true;
                rollDiceBtn.textContent = !isGameActive ? "Game Over" : "Not enough money!";
            } else {
                rollDiceBtn.disabled = false;
                rollDiceBtn.textContent = `Roll Dice (Cost: $${rollCost})`;
            }
        }
    }

    // --- GAME FLOW & STATE MANAGEMENT ---
    function resetForNewRound() {
        console.log("resetForNewRound called. Current isGameActive:", isGameActive, "isOverlayVisible:", isOverlayVisible);
        isGameActive = true;
        isOverlayVisible = false;
        gameOverOverlayEl.classList.add('hidden');

        diceStageEl.classList.remove('hidden');
        plinkoStageEl.classList.add('hidden');
        dropBallBtn.classList.add('hidden');
        dice1El.textContent = '1';
        dice2El.textContent = '1';
        clearTableHighlights();
        updatePlayerInfoDisplay();
        if (rollDiceBtn) rollDiceBtn.disabled = (playerMoney < rollCost);
        console.log("resetForNewRound finished. New isGameActive:", isGameActive, "isOverlayVisible:", isOverlayVisible);
    }

    function prepareForNewGameSession() {
        console.log("prepareForNewGameSession called.");
        isGameActive = false;
        isOverlayVisible = false;
        namePromptStageEl.classList.remove('hidden');
        diceStageEl.classList.add('hidden');
        plinkoStageEl.classList.add('hidden');
        gameOverOverlayEl.classList.add('hidden');
        playerInfoEl.classList.add('hidden');
        playerNameInputEl.value = '';
        displayTopScores(getTopScores());
        updatePlayerInfoDisplay();
    }

    function startGameSession() {
        console.log("startGameSession called.");
        currentPlayerName = playerNameInputEl.value.trim();
        if (!currentPlayerName) {
            alert("Please enter a name to start!");
            return;
        }
        playerMoney = initialPlayerMoney;
        // --- MODIFICATION START ---
        sessionMaxMoney = initialPlayerMoney; // Initialize session max money
        // --- MODIFICATION END ---

        namePromptStageEl.classList.add('hidden');
        playerInfoEl.classList.remove('hidden');
        if (typeof initializePlinkoCanvas === 'function' && document.getElementById('plinkoCanvas')) {
            initializePlinkoCanvas();
        }
        resetForNewRound();
    }

    function handleQuitGame() {
        console.log("handleQuitGame called.");
        isGameActive = false;
        isOverlayVisible = false;
        if (typeof stopBallAnimation === 'function') {
            console.log("Stopping ball animation in handleQuitGame");
            stopBallAnimation();
        }

        // --- MODIFICATION START ---
        // Save sessionMaxMoney instead of current playerMoney
        const updatedScores = saveScoreToTopList(currentPlayerName, sessionMaxMoney);
        displayTopScores(updatedScores);
        alert(`${currentPlayerName}, your session high score of $${sessionMaxMoney} has been recorded. Thanks for playing!`);
        // --- MODIFICATION END ---

        gameOverOverlayEl.classList.add('hidden');
        prepareForNewGameSession();
    }

    // --- MODIFICATION START ---
    // Added roundPrizeAmount parameter
    function showRoundOverScreen(isOutOfMoneyForNextRound = false, roundPrizeAmount = 0) {
    // --- MODIFICATION END ---
        console.log("showRoundOverScreen called. isOutOfMoney:", isOutOfMoneyForNextRound, "Current playerMoney:", playerMoney, "Round Prize:", roundPrizeAmount);
        if (isOverlayVisible) {
            console.warn("showRoundOverScreen called while overlay is already considered visible. Aborting to prevent multiple triggers.");
            return;
        }

        isGameActive = false;
        isOverlayVisible = true;
        if (typeof stopBallAnimation === 'function') {
            console.log("Stopping ball animation in showRoundOverScreen");
            stopBallAnimation();
        }

        const currentTopScores = getTopScores();
        displayTopScores(currentTopScores);

        // --- MODIFICATION START ---
        // Update prize message text and Play Again button behaviour
        if (isOutOfMoneyForNextRound) {
            prizeMessageEl.textContent = "Out of Money for Next Round!";
            if (playAgainBtn) {
                playAgainBtn.textContent = "End Game";
                playAgainBtn.disabled = false;
            }
        } else {
            if (roundPrizeAmount > 0) {
                prizeMessageEl.textContent = `Game Over! You Won $${roundPrizeAmount}`;
            } else if (roundPrizeAmount < 0) {
                prizeMessageEl.textContent = `Game Over! You Lost $${Math.abs(roundPrizeAmount)}`;
            } else {
                prizeMessageEl.textContent = `Game Over! You Won $0`;
            }
            if (playAgainBtn) {
                playAgainBtn.textContent = "Play Next Round";
                playAgainBtn.disabled = false;
            }
        }
        // --- MODIFICATION END ---
        finalMoneyMessageEl.textContent = `${currentPlayerName}, your current total is $${playerMoney}.`;
        gameOverOverlayEl.classList.remove('hidden');
        updatePlayerInfoDisplay();
        console.log("showRoundOverScreen finished. isGameActive:", isGameActive, "isOverlayVisible:", isOverlayVisible);
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
        if (!isGameActive || isOverlayVisible) {
            console.warn("Roll dice attempt while game not active or overlay visible.");
            return;
        }
        if (playerMoney < rollCost) {
            // --- MODIFICATION START ---
            // This condition means the game should end. Pass the current prize (0 for dice roll phase)
            showRoundOverScreen(true, 0); // Go to game over if somehow clicked with no money
            // --- MODIFICATION END ---
            return;
        }
        playerMoney -= rollCost;
        updatePlayerInfoDisplay();
        if (rollDiceBtn) rollDiceBtn.disabled = true;
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
        if (!isGameActive || isOverlayVisible) {
            console.warn("Transition to Plinko attempt while game not active or overlay visible.");
            return;
        }

        diceStageEl.classList.add('hidden');
        plinkoStageEl.classList.remove('hidden');

        if (typeof initializePlinkoCanvas === 'function' && document.getElementById('plinkoCanvas') && !window.canvas) {
            initializePlinkoCanvas();
        }
        if (typeof drawFullPlinkoBoard === 'function') drawFullPlinkoBoard();
        if (typeof resetBall === 'function') resetBall(selectedSlotNumber);
        if (typeof drawBall === 'function' && window.ball) drawBall(window.ball);
        if (dropBallBtn) dropBallBtn.classList.remove('hidden');
    }

    function onDropBallClicked() {
        if (!isGameActive || isOverlayVisible) {
            console.warn("Drop ball attempt while game not active or overlay visible.");
            return;
        }

        if (dropBallBtn) dropBallBtn.classList.add('hidden');
        if (typeof startBallAnimation === 'function') startBallAnimation();
    }

    window.handleBallLanded = function(prizeString) {
        console.log("handleBallLanded called. isGameActive:", isGameActive, "isOverlayVisible:", isOverlayVisible, "Prize:", prizeString);

        if (isOverlayVisible || !isGameActive) {
            console.warn("handleBallLanded: Ball landed but overlay is already visible or game is inactive. Stopping animation if any and returning.");
            if (typeof stopBallAnimation === 'function') stopBallAnimation();
            return;
        }

        let prizeAmount = 0;
        if (prizeString !== "Lost!") {
            const match = prizeString.match(/([+-])?(\d+)/);
            if (match) {
                prizeAmount = parseInt(match[2]);
                if (match[1] === '-') { prizeAmount *= -1; }
            }
        }
        console.log("Prize amount calculated:", prizeAmount);
        playerMoney += prizeAmount;
        console.log("Player money after prize:", playerMoney);

        // --- MODIFICATION START ---
        // Update sessionMaxMoney if current playerMoney is higher
        if (playerMoney > sessionMaxMoney) {
            sessionMaxMoney = playerMoney;
            console.log("New sessionMaxMoney:", sessionMaxMoney);
        }
        // Pass prizeAmount to showRoundOverScreen
        showRoundOverScreen(playerMoney < rollCost, prizeAmount);
        // --- MODIFICATION END ---
    }

    // --- EVENT LISTENERS ---
    if (startGameBtn) startGameBtn.addEventListener('click', startGameSession);
    if (rollDiceBtn) rollDiceBtn.addEventListener('click', rollDice);
    if (dropBallBtn) dropBallBtn.addEventListener('click', onDropBallClicked);

    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            console.log("Play Again button clicked. isGameActive:", isGameActive, "isOverlayVisible:", isOverlayVisible, "Player Money:", playerMoney);
            // If player can't afford the next round, behave exactly like the
            // "Quit Game & Save" button.
            if (playerMoney < rollCost) {
                gameOverOverlayEl.classList.add('hidden');
                isOverlayVisible = false;
                isGameActive = false;
                handleQuitGame();
                return;
            }

            if (!isOverlayVisible && isGameActive) {
                console.warn("Play Again clicked, but overlay isn't visible or game is already active. This shouldn't happen.");
            }

            gameOverOverlayEl.classList.add('hidden');
            isOverlayVisible = false;
            resetForNewRound();
        });
    }

    if (quitGameBtn) {
        quitGameBtn.addEventListener('click', () => {
            console.log("Quit Game button clicked.");
            gameOverOverlayEl.classList.add('hidden');
            isOverlayVisible = false;
            isGameActive = false;
            handleQuitGame();
        });
    }

    // --- INITIALIZATION ---
    displayTopScores(getTopScores());
    prepareForNewGameSession();
});