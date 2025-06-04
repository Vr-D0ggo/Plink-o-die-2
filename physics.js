// --- Physics Engine (Simplified) ---
let ball = {
    x: 0,
    y: 0,
    radius: PLINKO_CONFIG.BALL_RADIUS_BOXES * PLINKO_CONFIG.BOX_SIZE,
    vx: 0,
    vy: 0,
    color: PLINKO_CONFIG.BALL_COLOR,
    mass: 1,
    gravity: 0.15, // Reduced gravity for slower fall
    restitution: 0.55, // Slightly reduced bounciness
    friction: 0.015, // Slightly increased friction
};

let animationFrameId = null;

function resetBall(slotNumber) {
    const slotDropXCenters = [3, 7, 11, 15, 19]; // In Box units
    
    ball.x = slotDropXCenters[slotNumber - 1] * PLINKO_CONFIG.BOX_SIZE;
    ball.y = 0.5 * PLINKO_CONFIG.BOX_SIZE;
    ball.vx = (Math.random() - 0.5) * 0.3; // Reduced initial horizontal randomness
    ball.vy = 0.3; // Reduced initial downward speed
    ball.radius = PLINKO_CONFIG.BALL_RADIUS_BOXES * PLINKO_CONFIG.BOX_SIZE;
    ball.color = PLINKO_CONFIG.BALL_COLOR;
}


function updateBallPosition() {
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
    pegs.forEach(peg => {
        if (ball.x + ball.radius > peg.x &&
            ball.x - ball.radius < peg.x + peg.width &&
            ball.y + ball.radius > peg.y &&
            ball.y - ball.radius < peg.y + peg.height) {

            let distToPegCenter = Math.sqrt(Math.pow(ball.x - peg.center.x, 2) + Math.pow(ball.y - peg.center.y, 2));
            const effectivePegRadius = (peg.width / 2) * 0.7; // Adjusted effective radius
            
            // Check if ball is close enough and generally above the peg's vertical center for a downward bounce
            // For flipped RA triangles, the "center" for collision might need more thought,
            // but this broad phase should still mostly work.
            if (distToPegCenter < ball.radius + effectivePegRadius && ball.y < peg.center.y + peg.height * 0.6 ) { // Check if ball is above mid-point

                let dx = ball.x - peg.center.x;
                let dy = ball.y - peg.center.y;
                // Avoid division by zero if distToPegCenter is 0
                if (distToPegCenter === 0) {
                    dx = 1; dy = 0; distToPegCenter = 1; // Give a default push direction
                }
                let normalX = dx / distToPegCenter;
                let normalY = dy / distToPegCenter;

                let dotProduct = ball.vx * normalX + ball.vy * normalY;
                ball.vx = (ball.vx - 2 * dotProduct * normalX) * ball.restitution;
                ball.vy = (ball.vy - 2 * dotProduct * normalY) * ball.restitution;
                
                ball.x += normalX * 1.2; // Slightly reduced push
                ball.y += normalY * 1.2;

                ball.vx += (Math.random() - 0.5) * 1.0; // Reduced random bounce factor
            }
        }
    });


    // Check for landing in a bottom slot
    for (const slot of bottomPrizeSlots) {
        if (ball.y + ball.radius > slot.y &&
            ball.x > slot.x && ball.x < slot.x + slot.width) {
            
            if (ball.y - ball.radius < slot.y + slot.height) {
                ball.vy = 0;
                ball.vx = 0;
                ball.y = slot.y + slot.height - ball.radius - 2;
                stopBallAnimation();
                handleBallLanded(slot.prize);
                return; 
            }
        }
    }

    if (ball.y - ball.radius > canvas.height) {
        stopBallAnimation();
        handleBallLanded("Lost!");
    }
}

function gameLoop() {
    updateBallPosition();
    drawFullPlinkoBoard(); 
    drawBall(ball);      

    animationFrameId = requestAnimationFrame(gameLoop);
}

function startBallAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

function stopBallAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}