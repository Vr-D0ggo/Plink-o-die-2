(function() {
    const CONFIG = {
        SLOT_COUNT: 5,
        SLOT_WIDTH: 40,
        BOARD_HEIGHT: 160,
        BOARD_PADDING: 10,
        BALL_RADIUS: 5,
        GRAVITY: 0.3
    };

    let canvas, ctx;
    let ball;
    let vy;
    let vx;
    let animationId = null;
    let nextPegIndex;

    function init() {
        canvas = document.getElementById('miniPlinkoCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        canvas.width = CONFIG.SLOT_WIDTH * CONFIG.SLOT_COUNT + CONFIG.BOARD_PADDING * 2;
        canvas.height = CONFIG.BOARD_HEIGHT + CONFIG.BOARD_PADDING * 2;
        resetBall();
    }

    function resetBall() {
        if (!canvas) return;
        const slot = Math.floor(Math.random() * CONFIG.SLOT_COUNT);
        const startX = CONFIG.BOARD_PADDING + CONFIG.SLOT_WIDTH * slot + CONFIG.SLOT_WIDTH / 2;
        ball = { x: startX, y: CONFIG.BOARD_PADDING + CONFIG.BALL_RADIUS, radius: CONFIG.BALL_RADIUS };
        vy = 1;
        vx = 0;
        nextPegIndex = 0;
        drawBoard();
    }

    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#0ff';
        for (let i = 0; i <= CONFIG.SLOT_COUNT; i++) {
            const x = CONFIG.BOARD_PADDING + i * CONFIG.SLOT_WIDTH;
            ctx.beginPath();
            ctx.moveTo(x, CONFIG.BOARD_PADDING);
            ctx.lineTo(x, canvas.height - CONFIG.BOARD_PADDING);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(CONFIG.BOARD_PADDING, canvas.height - CONFIG.BOARD_PADDING);
        ctx.lineTo(CONFIG.BOARD_PADDING + CONFIG.SLOT_WIDTH * CONFIG.SLOT_COUNT, canvas.height - CONFIG.BOARD_PADDING);
        ctx.stroke();
    }

    const PEG_Y_POSITIONS = [30, 60, 90, 120];

    function update() {
        ball.y += vy;
        ball.x += vx;

        if (nextPegIndex < PEG_Y_POSITIONS.length &&
            ball.y - CONFIG.BOARD_PADDING >= PEG_Y_POSITIONS[nextPegIndex]) {
            vx += (Math.random() - 0.5) * 2;
            nextPegIndex++;
        }

        const leftBound = CONFIG.BOARD_PADDING + ball.radius;
        const rightBound = CONFIG.BOARD_PADDING + CONFIG.SLOT_WIDTH * CONFIG.SLOT_COUNT - ball.radius;
        if (ball.x <= leftBound || ball.x >= rightBound) {
            ball.x = Math.max(leftBound, Math.min(rightBound, ball.x));
            vx *= -0.6;
        }

        vy += CONFIG.GRAVITY;

        if (ball.y >= canvas.height - CONFIG.BOARD_PADDING - ball.radius) {
            ball.y = canvas.height - CONFIG.BOARD_PADDING - ball.radius;
            vy = 0;
            vx = 0;
            cancelAnimationFrame(animationId);
            animationId = null;
            setTimeout(() => {
                resetBall();
                start();
            }, 1000);
        }
    }

    function draw() {
        drawBoard();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4081';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }

    function loop() {
        update();
        draw();
        animationId = requestAnimationFrame(loop);
    }

    function start() {
        if (!canvas) init();
        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(loop);
    }

    function stop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    window.startMiniPlinkoDemo = start;
    window.stopMiniPlinkoDemo = stop;
})();
