// --- Plinko Board Configuration & Drawing ---
const PLINKO_CONFIG = {
    BOX_SIZE: 25, // Slightly smaller to fit better with other elements initially
    BOARD_COLS: 22,
    BOARD_ROWS: 11,
    PEG_WIDTH_BOXES: 1,
    PEG_HEIGHT_BOXES: 1.25,
    RA_PEG_WIDTH_BOXES: 1.75,
    RA_PEG_HEIGHT_BOXES: 1.75,
    PEG_COLOR_FILL: '#888888',
    PEG_COLOR_STROKE: '#333333',
    GRID_COLOR: '#dddddd',
    SLOT_LINE_COLOR: '#555555',
    TEXT_COLOR: '#000000',
    TEXT_FONT: 'bold 14px Arial',
    BALL_RADIUS_BOXES: 0.35, // Ball radius in box units
    BALL_COLOR: 'red',
};

let canvas, ctx;
let pegs = []; // To store peg data for physics
let bottomPrizeSlots = []; // To store bottom slot data

function initializePlinkoCanvas() {
    canvas = document.getElementById('plinkoCanvas');
    ctx = canvas.getContext('2d');

    canvas.width = PLINKO_CONFIG.BOARD_COLS * PLINKO_CONFIG.BOX_SIZE;
    canvas.height = PLINKO_CONFIG.BOARD_ROWS * PLINKO_CONFIG.BOX_SIZE;
}

function drawGrid() {
    ctx.strokeStyle = PLINKO_CONFIG.GRID_COLOR;
    ctx.lineWidth = 1;
    for (let i = 0; i <= PLINKO_CONFIG.BOARD_COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * PLINKO_CONFIG.BOX_SIZE, 0);
        ctx.lineTo(i * PLINKO_CONFIG.BOX_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= PLINKO_CONFIG.BOARD_ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * PLINKO_CONFIG.BOX_SIZE);
        ctx.lineTo(canvas.width, i * PLINKO_CONFIG.BOX_SIZE);
        ctx.stroke();
    }
}

function drawTriangle(centerXInBoxes, baseYInBoxes, widthInBoxes, heightInBoxes, isPeg = true) {
    const pixelCenterX = centerXInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelBaseY = baseYInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelWidth = widthInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelHeight = heightInBoxes * PLINKO_CONFIG.BOX_SIZE;

    const apex = { x: pixelCenterX, y: pixelBaseY - pixelHeight };
    const bottomLeft = { x: pixelCenterX - pixelWidth / 2, y: pixelBaseY };
    const bottomRight = { x: pixelCenterX + pixelWidth / 2, y: pixelBaseY };

    ctx.beginPath();
    ctx.moveTo(apex.x, apex.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.closePath();

    ctx.fillStyle = PLINKO_CONFIG.PEG_COLOR_FILL;
    ctx.fill();
    ctx.strokeStyle = PLINKO_CONFIG.PEG_COLOR_STROKE;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (isPeg) {
        pegs.push({
            type: 'triangle',
            vertices: [apex, bottomLeft, bottomRight],
            // For simpler AABB collision, though triangle is more accurate
            x: bottomLeft.x, // Bounding box x
            y: apex.y,       // Bounding box y
            width: pixelWidth,
            height: pixelHeight,
            center: {x: pixelCenterX, y: pixelBaseY - pixelHeight/2} // rough center
        });
    }
}

function drawRightAngleTriangle(verticalSideXInBoxes, baseYInBoxes, widthInBoxes, heightInBoxes, type, isPeg = true) {
    const pixelVerticalSideX = verticalSideXInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelBaseY = baseYInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelWidth = widthInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelHeight = heightInBoxes * PLINKO_CONFIG.BOX_SIZE;

    let p1, p2, p3; // vertices

    if (type === 'rightFacingApex') {
        p1 = { x: pixelVerticalSideX + pixelWidth, y: pixelBaseY - pixelHeight }; // Apex
        p2 = { x: pixelVerticalSideX, y: pixelBaseY }; // Bottom-left
        p3 = { x: pixelVerticalSideX, y: pixelBaseY - pixelHeight }; // Top-left
    } else { // 'leftFacingApex'
        p1 = { x: pixelVerticalSideX, y: pixelBaseY - pixelHeight }; // Apex
        p2 = { x: pixelVerticalSideX + pixelWidth, y: pixelBaseY - pixelHeight }; // Top-right
        p3 = { x: pixelVerticalSideX + pixelWidth, y: pixelBaseY }; // Bottom-right
    }

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();

    ctx.fillStyle = PLINKO_CONFIG.PEG_COLOR_FILL;
    ctx.fill();
    ctx.strokeStyle = PLINKO_CONFIG.PEG_COLOR_STROKE;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (isPeg) {
        const allX = [p1.x, p2.x, p3.x];
        const allY = [p1.y, p2.y, p3.y];
        const minX = Math.min(...allX);
        const minY = Math.min(...allY);
        const maxX = Math.max(...allX);
        const maxY = Math.max(...allY);

        pegs.push({
            type: 'raTriangle',
            vertices: [p1, p2, p3],
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            center: {x: (minX + maxX)/2, y: (minY + maxY)/2} // rough center
        });
    }
}

function drawTopSlotLabels() {
    ctx.fillStyle = PLINKO_CONFIG.TEXT_COLOR;
    ctx.font = PLINKO_CONFIG.TEXT_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labelY = 0.5 * PLINKO_CONFIG.BOX_SIZE;
    const slotLabels = ["slot1", "slot2", "slot3", "slot4", "slot5"];
    const pegXCentersRow1 = [3, 7, 11, 15, 19];
    slotLabels.forEach((label, index) => {
        ctx.fillText(label, pegXCentersRow1[index] * PLINKO_CONFIG.BOX_SIZE, labelY);
    });
}

function definePegsAndDraw() {
    pegs = []; // Clear previous pegs before redrawing

    // Peg Row 1
    const baseYRow1 = (1 + PLINKO_CONFIG.PEG_HEIGHT_BOXES);
    const pegXCentersRow1 = [3, 7, 11, 15, 19];
    pegXCentersRow1.forEach(centerX => {
        drawTriangle(centerX, baseYRow1, PLINKO_CONFIG.PEG_WIDTH_BOXES, PLINKO_CONFIG.PEG_HEIGHT_BOXES);
    });

    // Peg Row 2
    const topYRow2 = baseYRow1 + 0.5;
    const baseYRow2 = topYRow2 + PLINKO_CONFIG.PEG_HEIGHT_BOXES;
    const pegXCentersRow2 = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
    pegXCentersRow2.forEach(centerX => {
        drawTriangle(centerX, baseYRow2, PLINKO_CONFIG.PEG_WIDTH_BOXES, PLINKO_CONFIG.PEG_HEIGHT_BOXES);
    });

    // Peg Row 3
    const topYRow3_standard = baseYRow2 + 0.5;
    const baseYRow3_standard = topYRow3_standard + PLINKO_CONFIG.PEG_HEIGHT_BOXES;
    const topYRow3_RA = baseYRow2 + 0.5;
    const baseYRow3_RA = topYRow3_RA + PLINKO_CONFIG.RA_PEG_HEIGHT_BOXES;

    drawRightAngleTriangle(0, baseYRow3_RA, PLINKO_CONFIG.RA_PEG_WIDTH_BOXES, PLINKO_CONFIG.RA_PEG_HEIGHT_BOXES, 'rightFacingApex');
    const pegXCentersRow3_standard = [3, 5, 7, 9, 11, 13, 15, 17, 19];
    pegXCentersRow3_standard.forEach(centerX => {
        drawTriangle(centerX, baseYRow3_standard, PLINKO_CONFIG.PEG_WIDTH_BOXES, PLINKO_CONFIG.PEG_HEIGHT_BOXES);
    });
    drawRightAngleTriangle(PLINKO_CONFIG.BOARD_COLS - PLINKO_CONFIG.RA_PEG_WIDTH_BOXES, baseYRow3_RA, PLINKO_CONFIG.RA_PEG_WIDTH_BOXES, PLINKO_CONFIG.RA_PEG_HEIGHT_BOXES, 'leftFacingApex');
    
    return baseYRow3_RA; // Y-coordinate of the base of the tallest pegs in row 3
}

function defineBottomSlotsAndDraw(lowestPegBaseYInBoxes) {
    bottomPrizeSlots = []; // Clear previous slots

    ctx.strokeStyle = PLINKO_CONFIG.SLOT_LINE_COLOR;
    ctx.lineWidth = 2;
    const prizeSlotTopYBox = lowestPegBaseYInBoxes + 0.5;
    const prizeSlotTopYPixel = prizeSlotTopYBox * PLINKO_CONFIG.BOX_SIZE;

    for (let i = 0; i <= PLINKO_CONFIG.BOARD_COLS; i += 2) {
        if (i > 0 && i < PLINKO_CONFIG.BOARD_COLS) { // Only draw internal dividers
            ctx.beginPath();
            ctx.moveTo(i * PLINKO_CONFIG.BOX_SIZE, prizeSlotTopYPixel);
            ctx.lineTo(i * PLINKO_CONFIG.BOX_SIZE, canvas.height);
            ctx.stroke();
        }
    }
    ctx.beginPath();
    ctx.moveTo(0, prizeSlotTopYPixel);
    ctx.lineTo(canvas.width, prizeSlotTopYPixel);
    ctx.stroke();

    const prizeValues = ["+20$", "+6$", "+3$", "+1$", "+0$", "+2$", "+0$", "+1$", "+3$", "+9$", "+4$"];
    ctx.fillStyle = PLINKO_CONFIG.TEXT_COLOR;
    ctx.font = PLINKO_CONFIG.TEXT_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const prizeLabelY = ((PLINKO_CONFIG.BOARD_ROWS - 1) + 0.5) * PLINKO_CONFIG.BOX_SIZE;

    for (let i = 0; i < prizeValues.length; i++) {
        const slotStartX = i * 2 * PLINKO_CONFIG.BOX_SIZE;
        const slotCenterX = (i * 2 + 1) * PLINKO_CONFIG.BOX_SIZE;
        ctx.fillText(prizeValues[i], slotCenterX, prizeLabelY);
        bottomPrizeSlots.push({
            x: slotStartX,
            y: prizeSlotTopYPixel,
            width: 2 * PLINKO_CONFIG.BOX_SIZE,
            height: canvas.height - prizeSlotTopYPixel,
            prize: prizeValues[i],
            index: i
        });
    }
}

function drawBall(ball) {
    if (!ctx || !ball) return;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawFullPlinkoBoard() {
    if (!ctx) initializePlinkoCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawTopSlotLabels();
    const lowestPegY = definePegsAndDraw();
    defineBottomSlotsAndDraw(lowestPegY);
}