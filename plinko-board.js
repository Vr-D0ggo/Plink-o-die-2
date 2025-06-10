// --- Plinko Board Configuration & Drawing ---
const PLINKO_CONFIG = {
    BOX_SIZE: 25,
    BOARD_COLS: 22,
    BOARD_ROWS: 11,
    PEG_WIDTH_BOXES: 1,         // Base width for standard pegs and for scaling side pegs
    PEG_HEIGHT_BOXES: 1.25,     // Height of standard pegs
    RA_PEG_WIDTH_BOXES: 1.75,   // Original default width for RA pegs (not directly used for these side pegs)
    RA_PEG_HEIGHT_BOXES: 1.75,  // Base height for scaling side pegs
    PEG_COLOR_FILL: '#03a9f4',
    PEG_COLOR_STROKE: '#01579b',
    GRID_COLOR: '#b0bec5',
    SLOT_LINE_COLOR: '#ff5722',
    TEXT_COLOR: '#b0bec5',
    TEXT_FONT: 'bold 14px Arial',
    BALL_RADIUS_BOXES: 0.35,
    BALL_COLOR: '#ff4081',
};

let canvas, ctx;
let pegs = [];
let bottomPrizeSlots = [];

function initializePlinkoCanvas() {
    if (typeof document !== 'undefined') {
        canvas = document.getElementById('plinkoCanvas');
        if (canvas) {
            ctx = canvas.getContext('2d');
            canvas.width = PLINKO_CONFIG.BOARD_COLS * PLINKO_CONFIG.BOX_SIZE;
            canvas.height = PLINKO_CONFIG.BOARD_ROWS * PLINKO_CONFIG.BOX_SIZE;
        } else {
            console.error("Canvas element with ID 'plinkoCanvas' not found.");
        }
    } else {
        console.error("Document object is not available. Cannot initialize canvas.");
    }
}

function drawGrid() {
    if (!ctx) return;
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
    if (!ctx) return;
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
            x: bottomLeft.x,
            y: apex.y,
            width: pixelWidth,
            height: pixelHeight,
            center: { x: pixelCenterX, y: pixelBaseY - pixelHeight / 2 }
        });
    }
}

function drawInvertedTriangle(apexXInBoxes, apexYInBoxes, widthInBoxes, heightInBoxes, isPeg = true) {
    if (!ctx) return;
    const pixelApexX = apexXInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelApexY = apexYInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelWidth = widthInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelHeight = heightInBoxes * PLINKO_CONFIG.BOX_SIZE;

    const bottomLeft = { x: pixelApexX - pixelWidth / 2, y: pixelApexY + pixelHeight };
    const bottomRight = { x: pixelApexX + pixelWidth / 2, y: pixelApexY + pixelHeight };

    ctx.beginPath();
    ctx.moveTo(pixelApexX, pixelApexY);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.closePath();

    ctx.fillStyle = PLINKO_CONFIG.PEG_COLOR_FILL;
    ctx.fill();
    ctx.strokeStyle = PLINKO_CONFIG.PEG_COLOR_STROKE;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (isPeg) {
        const minX = Math.min(pixelApexX, bottomLeft.x, bottomRight.x);
        const minY = Math.min(pixelApexY, bottomLeft.y, bottomRight.y);
        const maxX = Math.max(pixelApexX, bottomLeft.x, bottomRight.x);
        const maxY = Math.max(pixelApexY, bottomLeft.y, bottomRight.y);
        pegs.push({
            type: 'triangle',
            vertices: [{x: pixelApexX, y: pixelApexY}, bottomLeft, bottomRight],
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
        });
    }
}

function drawRightAngleTriangle(
    verticalSideXInBoxes,
    horizontalLegYInBoxes, 
    widthInBoxes,
    heightInBoxes,
    type, 
    isPeg = true,
    isUpsideDown = false
) {
    if (!ctx) return;
    const pixelVerticalSideX = verticalSideXInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelHorizontalLegY = horizontalLegYInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelWidth = widthInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelHeight = heightInBoxes * PLINKO_CONFIG.BOX_SIZE;

    let p1, p2, p3;

    if (isUpsideDown) {
        if (type === 'rightFacingApex') {
            p3 = { x: pixelVerticalSideX, y: pixelHorizontalLegY };
            p2 = { x: pixelVerticalSideX, y: pixelHorizontalLegY + pixelHeight };
            p1 = { x: pixelVerticalSideX + pixelWidth, y: pixelHorizontalLegY + pixelHeight };
        } else { // leftFacingApex
            p3 = { x: pixelVerticalSideX + pixelWidth, y: pixelHorizontalLegY };
            p2 = { x: pixelVerticalSideX + pixelWidth, y: pixelHorizontalLegY + pixelHeight };
            p1 = { x: pixelVerticalSideX, y: pixelHorizontalLegY + pixelHeight };
        }
    } else {
        if (type === 'rightFacingApex') {
            p1 = { x: pixelVerticalSideX + pixelWidth, y: pixelHorizontalLegY - pixelHeight };
            p2 = { x: pixelVerticalSideX, y: pixelHorizontalLegY };
            p3 = { x: pixelVerticalSideX, y: pixelHorizontalLegY - pixelHeight };
        } else { // leftFacingApex
            p1 = { x: pixelVerticalSideX, y: pixelHorizontalLegY - pixelHeight };
            p2 = { x: pixelVerticalSideX + pixelWidth, y: pixelHorizontalLegY - pixelHeight };
            p3 = { x: pixelVerticalSideX + pixelWidth, y: pixelHorizontalLegY };
        }
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
            center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
            isUpsideDown: isUpsideDown
        });
    }
}

function drawRectPeg(xInBoxes, yInBoxes, widthInBoxes, heightInBoxes) {
    if (!ctx) return;
    const pixelX = xInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelY = yInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelWidth = widthInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelHeight = heightInBoxes * PLINKO_CONFIG.BOX_SIZE;

    ctx.fillStyle = PLINKO_CONFIG.PEG_COLOR_FILL;
    ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
    ctx.strokeStyle = PLINKO_CONFIG.PEG_COLOR_STROKE;
    ctx.lineWidth = 2;
    ctx.strokeRect(pixelX, pixelY, pixelWidth, pixelHeight);

    pegs.push({
        type: 'rect',
        x: pixelX,
        y: pixelY,
        width: pixelWidth,
        height: pixelHeight,
        center: { x: pixelX + pixelWidth / 2, y: pixelY + pixelHeight / 2 }
    });
}

function addRectPeg(xInBoxes, yInBoxes, widthInBoxes, heightInBoxes) {
    if (!ctx) return;
    const pixelX = xInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelY = yInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelWidth = widthInBoxes * PLINKO_CONFIG.BOX_SIZE;
    const pixelHeight = heightInBoxes * PLINKO_CONFIG.BOX_SIZE;

    pegs.push({
        type: 'rect',
        x: pixelX,
        y: pixelY,
        width: pixelWidth,
        height: pixelHeight,
        center: { x: pixelX + pixelWidth / 2, y: pixelY + pixelHeight / 2 }
    });
}


function drawTopSlotLabels() {
    if (!ctx) return;
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

// MODIFIED FUNCTION
function definePegsAndDraw() {
    if (!ctx) return 0;
    pegs = [];

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
    const topYRow3 = baseYRow2 + 0.5; 
    const baseYRow3_standard = topYRow3 + PLINKO_CONFIG.PEG_HEIGHT_BOXES; // Bottom Y of standard pegs in Row 3
    const pegXCentersRow3_standard = [3, 5, 7, 9, 11, 13, 15, 17, 19];
    pegXCentersRow3_standard.forEach(centerX => {
        drawTriangle(centerX, baseYRow3_standard, PLINKO_CONFIG.PEG_WIDTH_BOXES, PLINKO_CONFIG.PEG_HEIGHT_BOXES);
    });

    // Right-Angle Triangles on the sides of Row 3 (UPSIDE DOWN, SCALED 1.1x)
    const scaleFactor = 1.1;
    const baseSidePegWidth = PLINKO_CONFIG.PEG_WIDTH_BOXES;         // Base width from previous "steeper" step (1.0)
    const baseSidePegHeight = PLINKO_CONFIG.RA_PEG_HEIGHT_BOXES;    // Base height from previous "steeper" step (1.75)

    const scaledSidePegWidth = baseSidePegWidth * scaleFactor;     // New scaled width
    const scaledSidePegHeight = baseSidePegHeight * scaleFactor;   // New scaled height

    // Calculate the top Y for these scaled upside-down RA pegs to maintain bottom alignment.
    // We want: upsideDownRAPegTopY + scaledSidePegHeight = baseYRow3_standard
    // So: upsideDownRAPegTopY = baseYRow3_standard - scaledSidePegHeight
    const upsideDownRAPegTopY = baseYRow3_standard - scaledSidePegHeight;

    // Leftmost RA triangle (upside down, scaled)
    drawRightAngleTriangle(
        0, 
        upsideDownRAPegTopY, 
        scaledSidePegWidth,   // Use the new scaled width
        scaledSidePegHeight,  // Use the new scaled height
        'rightFacingApex', 
        true, 
        true  
    );

    // Rightmost RA triangle (upside down, scaled)
    // Adjust X-start based on the new scaled width
    const rightRATriangleStartX = PLINKO_CONFIG.BOARD_COLS - scaledSidePegWidth; 
    drawRightAngleTriangle(
        rightRATriangleStartX,
        upsideDownRAPegTopY,
        scaledSidePegWidth,   // Use the new scaled width
        scaledSidePegHeight,  // Use the new scaled height
        'leftFacingApex',
        true,
        true
    );

    // Peg Row 4 - inverted triangles aligned with slot dividers
    const tipYRow4 = baseYRow3_standard + 0.5;
    const pegXCentersRow4 = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
    pegXCentersRow4.forEach(centerX => {
        drawInvertedTriangle(centerX, tipYRow4, PLINKO_CONFIG.PEG_WIDTH_BOXES, PLINKO_CONFIG.PEG_HEIGHT_BOXES);
    });

    return baseYRow3_standard; // Bottom alignment is still with standard pegs
}


function defineBottomSlotsAndDraw(lowestPegBaseYInBoxes) {
    if (!ctx) return;
    bottomPrizeSlots = [];

    ctx.strokeStyle = PLINKO_CONFIG.SLOT_LINE_COLOR;
    ctx.lineWidth = 2;
    const prizeSlotTopYBox = lowestPegBaseYInBoxes + 0.5;
    const prizeSlotTopYPixel = prizeSlotTopYBox * PLINKO_CONFIG.BOX_SIZE;

    for (let i = 0; i <= PLINKO_CONFIG.BOARD_COLS; i += 2) {
        if (i > 0 && i < PLINKO_CONFIG.BOARD_COLS) {
            ctx.beginPath();
            ctx.moveTo(i * PLINKO_CONFIG.BOX_SIZE, prizeSlotTopYPixel);
            ctx.lineTo(i * PLINKO_CONFIG.BOX_SIZE, canvas.height);
            ctx.stroke();

            const pegWidth = 0.2;
            // Base collision peg for the visible divider section
            addRectPeg(
                i - pegWidth / 2,
                prizeSlotTopYBox,
                pegWidth,
                PLINKO_CONFIG.BOARD_ROWS - prizeSlotTopYBox
            );

            // If this divider borders an end slot, extend the collision area
            // upward so the entire divider is solid
            if (i === 2 || i === PLINKO_CONFIG.BOARD_COLS - 2) {
                addRectPeg(
                    i - pegWidth / 2,
                    0,
                    pegWidth,
                    prizeSlotTopYBox
                );
            }
        }
    }
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.moveTo(0, prizeSlotTopYPixel);
    ctx.lineTo(canvas.width, prizeSlotTopYPixel);
    ctx.stroke();
    ctx.strokeStyle = PLINKO_CONFIG.SLOT_LINE_COLOR;

    const prizeValues = ["+20$", "+9$", "+3$", "+1$", "+0$", "+2$", "+0$", "+1$", "+3$", "+9$", "+20$"];
    ctx.fillStyle = PLINKO_CONFIG.TEXT_COLOR;
    ctx.font = PLINKO_CONFIG.TEXT_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const prizeLabelY = prizeSlotTopYPixel + (canvas.height - prizeSlotTopYPixel) / 2;

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
    if (!canvas) initializePlinkoCanvas();
    if (!ctx) {
        console.error("Canvas context not available for drawing.");
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawTopSlotLabels();
    const lowestPegY = definePegsAndDraw();
    defineBottomSlotsAndDraw(lowestPegY);
}

// --- Example Usage (ensure you have an HTML file with <canvas id="plinkoCanvas"></canvas>) ---
//
// window.onload = () => {
//     initializePlinkoCanvas(); 
//     if (ctx) { 
//         drawFullPlinkoBoard();
//     }
// };