// This file previously displayed a miniature Plinko board in the instructions
// overlay. The instructions now show a pair of dice that repeatedly roll on
// their own. This script handles that animation while keeping the original
// startMiniPlinkoDemo/stopMiniPlinkoDemo API used elsewhere in the code base.

(function() {
    let dice1El, dice2El;
    let rollIntervalId = null;
    let pauseTimeoutId = null;
    let miniCanvas;

    function init() {
        dice1El = document.getElementById('instruction-dice1');
        dice2El = document.getElementById('instruction-dice2');
        miniCanvas = document.getElementById('mini-plinko-canvas');
        if (miniCanvas && typeof drawScaledPlinkoBoardOnCanvas === 'function') {
            drawScaledPlinkoBoardOnCanvas(miniCanvas, 0.4);
        }
    }

    function showRandomValues() {
        if (!dice1El || !dice2El) return;
        dice1El.textContent = Math.floor(Math.random() * 6) + 1;
        dice2El.textContent = Math.floor(Math.random() * 6) + 1;
    }

    function rollOnce() {
        if (!dice1El || !dice2El) return;
        let ticks = 0;
        const maxTicks = 10; // run animation for ~1s
        dice1El.classList.add('rolling');
        dice2El.classList.add('rolling');

        rollIntervalId = setInterval(() => {
            showRandomValues();
            ticks++;
            if (ticks >= maxTicks) {
                clearInterval(rollIntervalId);
                rollIntervalId = null;
                dice1El.classList.remove('rolling');
                dice2El.classList.remove('rolling');
                showRandomValues();
                pauseTimeoutId = setTimeout(rollOnce, 2000); // pause before next roll
            }
        }, 100);
    }

    function start() {
        if (!dice1El || !dice2El || !miniCanvas) init();
        stop();
        rollOnce();
        if (miniCanvas && typeof drawScaledPlinkoBoardOnCanvas === 'function') {
            drawScaledPlinkoBoardOnCanvas(miniCanvas, 0.4);
        }
    }

    function stop() {
        if (rollIntervalId) {
            clearInterval(rollIntervalId);
            rollIntervalId = null;
        }
        if (pauseTimeoutId) {
            clearTimeout(pauseTimeoutId);
            pauseTimeoutId = null;
        }
    }

    // Preserve original API names so other files don't need changes
    window.startMiniPlinkoDemo = start;
    window.stopMiniPlinkoDemo = stop;
})();
