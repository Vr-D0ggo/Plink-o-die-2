// This file previously displayed a miniature Plinko board in the instructions
// overlay. The instructions now show a pair of dice that repeatedly roll on
// their own. This script handles that animation while keeping the original
// startMiniPlinkoDemo/stopMiniPlinkoDemo API used elsewhere in the code base.

(function() {
    let dice1El, dice2El;
    let rollIntervalId = null;
    let pauseTimeoutId = null;
    let miniCanvas;
    let ballAnimFrame = null;
    const SCALE = 0.4; // scale used for the mini demo board

    function init() {
        dice1El = document.getElementById('instruction-dice1');
        dice2El = document.getElementById('instruction-dice2');
        miniCanvas = document.getElementById('mini-plinko-canvas');
        if (miniCanvas && typeof drawScaledPlinkoBoardOnCanvas === 'function') {
            drawScaledPlinkoBoardOnCanvas(miniCanvas, SCALE);
        }
    }

    function showRandomValues() {
        if (!dice1El || !dice2El) return;
        dice1El.textContent = Math.floor(Math.random() * 6) + 1;
        dice2El.textContent = Math.floor(Math.random() * 6) + 1;
    }

    function highlightSlotAndBall(slotIndex) {
        if (!miniCanvas) return;
        const ctx = miniCanvas.getContext('2d');
        if (!ctx) return;

        // redraw board first
        if (typeof drawScaledPlinkoBoardOnCanvas === 'function') {
            drawScaledPlinkoBoardOnCanvas(miniCanvas, SCALE);
        }

        const boxSize = PLINKO_CONFIG.BOX_SIZE * SCALE;

        const baseYRow1 = 1 + PLINKO_CONFIG.PEG_HEIGHT_BOXES;
        const baseYRow2 = baseYRow1 + 0.5 + PLINKO_CONFIG.PEG_HEIGHT_BOXES;
        const baseYRow3 = baseYRow2 + 0.5 + PLINKO_CONFIG.PEG_HEIGHT_BOXES;
        const prizeTopBox = baseYRow3 + 0.5;
        const slotY = prizeTopBox * boxSize;

        const slotX = slotIndex * 2 * boxSize;
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(slotX, slotY, 2 * boxSize, miniCanvas.height - slotY);

        const ballX = (slotIndex * 2 + 1) * boxSize;
        const ballRadius = PLINKO_CONFIG.BALL_RADIUS_BOXES * boxSize;
        const ballY = miniCanvas.height - ballRadius - 2;
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = PLINKO_CONFIG.BALL_COLOR;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function animateBallDrop(slotIndex, onComplete) {
        if (!miniCanvas) return;
        const ctx = miniCanvas.getContext('2d');
        if (!ctx) return;

        const boxSize = PLINKO_CONFIG.BOX_SIZE * SCALE;
        const ballX = (slotIndex * 2 + 1) * boxSize;
        const ballRadius = PLINKO_CONFIG.BALL_RADIUS_BOXES * boxSize;
        let ballY = ballRadius + 2;
        const endY = miniCanvas.height - ballRadius - 2;

        function step() {
            if (!miniCanvas) return;
            if (typeof drawScaledPlinkoBoardOnCanvas === 'function') {
                drawScaledPlinkoBoardOnCanvas(miniCanvas, SCALE);
            }

            const baseYRow1 = 1 + PLINKO_CONFIG.PEG_HEIGHT_BOXES;
            const baseYRow2 = baseYRow1 + 0.5 + PLINKO_CONFIG.PEG_HEIGHT_BOXES;
            const baseYRow3 = baseYRow2 + 0.5 + PLINKO_CONFIG.PEG_HEIGHT_BOXES;
            const prizeTopBox = baseYRow3 + 0.5;
            const slotY = prizeTopBox * boxSize;
            const slotX = slotIndex * 2 * boxSize;
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(slotX, slotY, 2 * boxSize, miniCanvas.height - slotY);

            ctx.beginPath();
            ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
            ctx.fillStyle = PLINKO_CONFIG.BALL_COLOR;
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.stroke();

            if (ballY < endY) {
                ballY += 3;
                ballAnimFrame = requestAnimationFrame(step);
            } else {
                ballAnimFrame = null;
                if (typeof onComplete === 'function') {
                    onComplete();
                }
            }
        }

        if (ballAnimFrame) {
            cancelAnimationFrame(ballAnimFrame);
            ballAnimFrame = null;
        }
        step();
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
                const slot = Math.floor(Math.random() * 11);
                animateBallDrop(slot, () => {
                    pauseTimeoutId = setTimeout(rollOnce, 1000);
                });
            }
        }, 100);
    }

    function start() {
        if (!dice1El || !dice2El || !miniCanvas) init();
        stop();
        rollOnce();
        if (miniCanvas && typeof drawScaledPlinkoBoardOnCanvas === 'function') {
            drawScaledPlinkoBoardOnCanvas(miniCanvas, SCALE);
        }
        highlightSlotAndBall(Math.floor(Math.random() * 11));
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
        if (ballAnimFrame) {
            cancelAnimationFrame(ballAnimFrame);
            ballAnimFrame = null;
        }
    }

    // Preserve original API names so other files don't need changes
    window.startMiniPlinkoDemo = start;
    window.stopMiniPlinkoDemo = stop;
})();
