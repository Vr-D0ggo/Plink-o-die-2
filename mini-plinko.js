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

    let miniPegs = [];
    let miniSlots = [];
    let miniBall = null;
    let miniBoxSize = 0;
    let miniLandingCallback = null;

    function init() {
        dice1El = document.getElementById('instruction-dice1');
        dice2El = document.getElementById('instruction-dice2');
        miniCanvas = document.getElementById('mini-plinko-canvas');
        if (miniCanvas && typeof drawScaledPlinkoBoardOnCanvas === 'function') {
            const data = drawScaledPlinkoBoardOnCanvas(miniCanvas, SCALE, true);
            if (data) {
                miniPegs = data.pegs;
                miniSlots = data.bottomPrizeSlots;
            }
        }
        miniBoxSize = PLINKO_CONFIG.BOX_SIZE * SCALE;
    }

    function showRandomValues() {
        if (!dice1El || !dice2El) return;
        dice1El.textContent = Math.floor(Math.random() * 6) + 1;
        dice2El.textContent = Math.floor(Math.random() * 6) + 1;
    }

    function getSlotFromSum(sum) {
        if (sum <= 3) return 1;
        if (sum <= 5) return 2;
        if (sum <= 8) return 3;
        if (sum <= 10) return 4;
        return 5;
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

    function resetMiniBall(slotNumber) {
        const slotDropXCenters = [3, 7, 11, 15, 19];
        miniBall = {
            x: slotDropXCenters[slotNumber - 1] * miniBoxSize,
            y: 0.5 * miniBoxSize,
            radius: PLINKO_CONFIG.BALL_RADIUS_BOXES * miniBoxSize,
            vx: (Math.random() - 0.5) * 0.3,
            vy: 0.3,
            color: PLINKO_CONFIG.BALL_COLOR,
            gravity: 0.15,
            restitution: 0.55,
            friction: 0.015
        };
    }

    function updateMiniBallPosition() {
        if (!miniCanvas || !miniBall) return;

        miniBall.vy += miniBall.gravity;
        miniBall.vx *= (1 - miniBall.friction);
        miniBall.vy *= (1 - miniBall.friction);

        miniBall.x += miniBall.vx;
        miniBall.y += miniBall.vy;

        if (miniBall.x - miniBall.radius < 0) {
            miniBall.x = miniBall.radius;
            miniBall.vx *= -miniBall.restitution;
        } else if (miniBall.x + miniBall.radius > miniCanvas.width) {
            miniBall.x = miniCanvas.width - miniBall.radius;
            miniBall.vx *= -miniBall.restitution;
        }

        miniPegs.forEach(peg => {
            if (miniBall.x + miniBall.radius > peg.x &&
                miniBall.x - miniBall.radius < peg.x + peg.width &&
                miniBall.y + miniBall.radius > peg.y &&
                miniBall.y - miniBall.radius < peg.y + peg.height) {

                let dist = Math.hypot(miniBall.x - peg.center.x, miniBall.y - peg.center.y);
                const eff = (peg.width / 2) * 0.7;

                if (dist < miniBall.radius + eff && miniBall.y < peg.center.y + peg.height * 0.6) {
                    let dx = miniBall.x - peg.center.x;
                    let dy = miniBall.y - peg.center.y;
                    if (dist === 0) {
                        dx = (Math.random() - 0.5) * 2;
                        dy = -1;
                        dist = Math.hypot(dx, dy);
                    }
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const dot = miniBall.vx * nx + miniBall.vy * ny;
                    miniBall.vx = (miniBall.vx - 2 * dot * nx) * miniBall.restitution;
                    miniBall.vy = (miniBall.vy - 2 * dot * ny) * miniBall.restitution;
                    const overlap = (miniBall.radius + eff) - dist;
                    if (overlap > 0) {
                        miniBall.x += nx * (overlap + 0.5);
                        miniBall.y += ny * (overlap + 0.5);
                    }
                    miniBall.vx += (Math.random() - 0.5) * 1.0;
                    if (Math.abs(miniBall.vy) < 0.5) {
                        miniBall.vy = Math.max(miniBall.vy, 0.5) + Math.random() * 0.2;
                    }
                }
            }
        });

        let landedIndex = null;
        miniSlots.forEach(slot => {
            if (miniBall.x > slot.x && miniBall.x < slot.x + slot.width) {
                if (miniBall.y + miniBall.radius >= miniCanvas.height) {
                    miniBall.y = miniCanvas.height - miniBall.radius;
                    miniBall.vy = 0;

                    if (miniBall.x - miniBall.radius <= slot.x) {
                        miniBall.x = slot.x + miniBall.radius;
                        miniBall.vx *= -miniBall.restitution;
                    }
                    if (miniBall.x + miniBall.radius >= slot.x + slot.width) {
                        miniBall.x = slot.x + slot.width - miniBall.radius;
                        miniBall.vx *= -miniBall.restitution;
                    }
                    landedIndex = slot.index;
                }
            }
        });

        if (miniBall.y - miniBall.radius > miniCanvas.height + miniBall.radius) {
            landedIndex = -1;
        }

        if (landedIndex !== null) {
            if (typeof miniLandingCallback === 'function') {
                const cb = miniLandingCallback;
                miniLandingCallback = null;
                setTimeout(() => cb(landedIndex), 500);
            }
        }
    }

    function physicsStep() {
        updateMiniBallPosition();
        if (typeof drawScaledPlinkoBoardOnCanvas === 'function') {
            drawScaledPlinkoBoardOnCanvas(miniCanvas, SCALE);
        }
        const ctx = miniCanvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(miniBall.x, miniBall.y, miniBall.radius, 0, Math.PI * 2);
        ctx.fillStyle = PLINKO_CONFIG.BALL_COLOR;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (miniLandingCallback) {
            ballAnimFrame = requestAnimationFrame(physicsStep);
        } else {
            ballAnimFrame = null;
        }
    }

    function animateBallDrop(slotNumber, onComplete) {
        if (!miniCanvas) return;
        if (ballAnimFrame) {
            cancelAnimationFrame(ballAnimFrame);
            ballAnimFrame = null;
        }
        resetMiniBall(slotNumber);
        miniLandingCallback = function(index) {
            highlightSlotAndBall(index >= 0 ? index : 0);
            if (typeof onComplete === 'function') onComplete();
        };
        ballAnimFrame = requestAnimationFrame(physicsStep);
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
                const val1 = Math.floor(Math.random() * 6) + 1;
                const val2 = Math.floor(Math.random() * 6) + 1;
                dice1El.textContent = val1;
                dice2El.textContent = val2;
                const slot = getSlotFromSum(val1 + val2);
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
        miniLandingCallback = null;
    }

    // Preserve original API names so other files don't need changes
    window.startMiniPlinkoDemo = start;
    window.stopMiniPlinkoDemo = stop;
})();
