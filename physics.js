// --- Physics Engine (Simplified) ---
let ball = {
    x: 0,
    y: 0,
    radius: PLINKO_CONFIG.BALL_RADIUS_BOXES * PLINKO_CONFIG.BOX_SIZE,
    vx: 0,
    vy: 0,
    color: PLINKO_CONFIG.BALL_COLOR,
    mass: 1,
    gravity: 0.15,
    restitution: 0.55,
    friction: 0.015,
};

let animationFrameId = null;
let landingTimeoutId = null; // delay timer for landing popup

function resetBall(slotNumber) {
    // Ensure canvas and PLINKO_CONFIG.BOX_SIZE are available
    if (typeof PLINKO_CONFIG === 'undefined' || typeof PLINKO_CONFIG.BOX_SIZE === 'undefined') {
        console.error("PLINKO_CONFIG.BOX_SIZE not defined in resetBall");
        return;
    }

    const slotDropXCenters = [3, 7, 11, 15, 19]; // In Box units

    if (landingTimeoutId) {
        clearTimeout(landingTimeoutId);
        landingTimeoutId = null;
    }

    ball.x = slotDropXCenters[slotNumber - 1] * PLINKO_CONFIG.BOX_SIZE;
    ball.y = 0.5 * PLINKO_CONFIG.BOX_SIZE; // Start slightly above the first row
    ball.vx = (Math.random() - 0.5) * 0.3;
    ball.vy = 0.3;
    ball.radius = PLINKO_CONFIG.BALL_RADIUS_BOXES * PLINKO_CONFIG.BOX_SIZE;
    ball.color = PLINKO_CONFIG.BALL_COLOR;
    // console.log("Ball reset to slot:", slotNumber, "at x:", ball.x, "y:", ball.y);
}


function updateBallPosition() {
    if (!canvas) { // Guard against canvas not being ready
        console.warn("updateBallPosition: canvas not available.");
        return;
    }

    ball.vy += ball.gravity;
    ball.vx *= (1 - ball.friction);
    ball.vy *= (1 - ball.friction);

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall collisions
    if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx *= -ball.restitution;
    } else if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.vx *= -ball.restitution;
    }

    // Peg collisions
    // Ensure pegs is defined and is an array
    if (typeof pegs !== 'undefined' && Array.isArray(pegs)) {
        pegs.forEach(peg => {
            // Basic AABB check first for performance
            if (ball.x + ball.radius > peg.x &&
                ball.x - ball.radius < peg.x + peg.width &&
                ball.y + ball.radius > peg.y &&
                ball.y - ball.radius < peg.y + peg.height) {

                // More precise collision check (circle vs rectangle/triangle center)
                let distToPegCenter = Math.sqrt(Math.pow(ball.x - peg.center.x, 2) + Math.pow(ball.y - peg.center.y, 2));
                const effectivePegRadius = (peg.width / 2) * 0.7; // Effective radius for collision

                if (distToPegCenter < ball.radius + effectivePegRadius && ball.y < peg.center.y + peg.height * 0.6) {
                    let dx = ball.x - peg.center.x;
                    let dy = ball.y - peg.center.y;

                    if (distToPegCenter === 0) { // Avoid division by zero
                        dx = (Math.random() - 0.5) * 2; // Random horizontal direction
                        dy = -1; // Push upwards slightly
                        distToPegCenter = Math.sqrt(dx*dx + dy*dy);
                    }

                    let normalX = dx / distToPegCenter;
                    let normalY = dy / distToPegCenter;

                    let dotProduct = ball.vx * normalX + ball.vy * normalY;

                    // Reflect velocity
                    ball.vx = (ball.vx - 2 * dotProduct * normalX) * ball.restitution;
                    ball.vy = (ball.vy - 2 * dotProduct * normalY) * ball.restitution;

                    // Positional correction to prevent sticking
                    const overlap = (ball.radius + effectivePegRadius) - distToPegCenter;
                    if (overlap > 0) {
                        ball.x += normalX * (overlap + 0.5); // Push out slightly more than overlap
                        ball.y += normalY * (overlap + 0.5);
                    }
                    
                    // Add some randomness to the bounce, especially horizontal
                    ball.vx += (Math.random() - 0.5) * 1.0;
                    if (Math.abs(ball.vy) < 0.5) { // If vertical speed is too low after hit, give a slight downward nudge
                         ball.vy = Math.max(ball.vy, 0.5) + Math.random() * 0.2;
                    }
                }
            }
        });
    } else {
        // console.warn("updateBallPosition: 'pegs' is not defined or not an array.");
    }


    // Check for landing in a bottom slot
    // Ensure bottomPrizeSlots is defined and is an array
    if (typeof bottomPrizeSlots !== 'undefined' && Array.isArray(bottomPrizeSlots)) {
        for (const slot of bottomPrizeSlots) {
            if (ball.x > slot.x && ball.x < slot.x + slot.width) { // horizontal check
                if (ball.y + ball.radius >= canvas.height) { // reached bottom of canvas
                    // Keep the ball at the bottom
                    ball.y = canvas.height - ball.radius;
                    ball.vy = 0;

                    // Bounce off slot walls so it "rolls" around
                    if (ball.x - ball.radius <= slot.x) {
                        ball.x = slot.x + ball.radius;
                        ball.vx *= -ball.restitution;
                    }
                    if (ball.x + ball.radius >= slot.x + slot.width) {
                        ball.x = slot.x + slot.width - ball.radius;
                        ball.vx *= -ball.restitution;
                    }

                    if (!landingTimeoutId) {
                        landingTimeoutId = setTimeout(() => {
                            stopBallAnimation();
                            if (typeof window.handleBallLanded === 'function') {
                                window.handleBallLanded(slot.prize);
                            } else {
                                console.error('window.handleBallLanded is not a function!');
                            }
                            landingTimeoutId = null;
                        }, 3000);
                    }
                }
            }
        }
    } else {
        // console.warn("updateBallPosition: 'bottomPrizeSlots' is not defined or not an array.");
    }

    // If ball falls off bottom of canvas (and hasn't landed in a slot)
    if (ball.y - ball.radius > canvas.height + ball.radius) { // Give a little buffer
        // IMPORTANT: Stop animation BEFORE calling handleBallLanded
        stopBallAnimation();

        if (typeof window.handleBallLanded === 'function') {
            window.handleBallLanded("Lost!");
        } else {
            console.error("window.handleBallLanded is not a function!");
        }
        return; // Exit updateBallPosition
    }
}

function gameLoop() {
    // If stopBallAnimation was called (e.g., by updateBallPosition in a previous logical step,
    // or by an external event), animationFrameId will be null.
    // In that case, don't continue the loop.
    if (!animationFrameId) {
        // console.log("gameLoop: animationFrameId is null, loop will not re-request.");
        return;
    }

    updateBallPosition();

    // IMPORTANT: Check animationFrameId AGAIN here.
    // updateBallPosition might have called stopBallAnimation() internally if the ball landed,
    // making animationFrameId null. If it's null, we shouldn't draw or request another frame.
    if (animationFrameId) {
        if (typeof drawFullPlinkoBoard === 'function') {
            drawFullPlinkoBoard();
        } else {
            console.warn("gameLoop: drawFullPlinkoBoard is not a function.");
        }
        if (typeof drawBall === 'function') {
            drawBall(ball);
        } else {
            console.warn("gameLoop: drawBall is not a function.");
        }
        // Only request the next frame if the loop is still supposed to be active
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        // console.log("gameLoop: Ball landed (or animation stopped) within this frame's update. No redraw or re-request.");
    }
}

function startBallAnimation() {
    // console.log("startBallAnimation called");
    if (animationFrameId) { // If an old animation is somehow running, cancel it
        cancelAnimationFrame(animationFrameId);
        // console.log("startBallAnimation: Canceled existing animationFrameId:", animationFrameId);
    }
    // Set animationFrameId to a truthy value (like true, or 1) *before* the first
    // requestAnimationFrame call. This makes the `if (!animationFrameId)` check
    // in gameLoop pass for the first scheduled frame.
    // The actual ID will be assigned by requestAnimationFrame.
    animationFrameId = true; // Indicates the loop is intended to be active
    animationFrameId = requestAnimationFrame(gameLoop);
    // console.log("startBallAnimation: New animationFrameId:", animationFrameId);
}

function stopBallAnimation() {
    // console.log("stopBallAnimation called. Current animationFrameId:", animationFrameId);
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null; // Crucially set to null to stop the gameLoop
        // console.log("stopBallAnimation: animationFrameId set to null.");
    }
    if (landingTimeoutId) {
        clearTimeout(landingTimeoutId);
        landingTimeoutId = null;
    }
}

// Expose functions to global scope if they need to be called from other files (like script.js)
// This is often done by default if not using modules.
// If using modules, you'd use `export { resetBall, startBallAnimation, stopBallAnimation };`

// Make sure these are globally available for script.js to call
window.resetBall = resetBall;
window.startBallAnimation = startBallAnimation;
window.stopBallAnimation = stopBallAnimation;
window.ball = ball; // If script.js needs direct access to ball properties