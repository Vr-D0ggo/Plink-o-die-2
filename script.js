window.onload = function() {
    const canvas = document.getElementById('plinkoCanvas');
    const ctx = canvas.getContext('2d');

    // --- Configuration ---
    const BOX_SIZE = 30; // Pixel size of one grid box (Increased from 25 for a bigger board)
    const BOARD_COLS = 22; // Board is 22 boxes wide
    const BOARD_ROWS = 11; // Board is 11 boxes tall

    const PEG_WIDTH_BOXES = 1;
    const PEG_HEIGHT_BOXES = 1.25;
    const RA_PEG_WIDTH_BOXES = 1.75; // Right-angle triangle width
    const RA_PEG_HEIGHT_BOXES = 1.75; // Right-angle triangle height

    const PEG_COLOR_FILL = '#888888';
    const PEG_COLOR_STROKE = '#333333';
    const GRID_COLOR = '#dddddd';
    const SLOT_LINE_COLOR = '#555555';
    const TEXT_COLOR = '#000000';
    const TEXT_FONT = 'bold 16px Arial'; // Adjusted font size for new BOX_SIZE

    // Calculate canvas dimensions
    canvas.width = BOARD_COLS * BOX_SIZE;
    canvas.height = BOARD_ROWS * BOX_SIZE;

    // --- Helper Functions ---
    function drawGrid() {
        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 1;

        for (let i = 0; i <= BOARD_COLS; i++) {
            ctx.beginPath();
            ctx.moveTo(i * BOX_SIZE, 0);
            ctx.lineTo(i * BOX_SIZE, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i <= BOARD_ROWS; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * BOX_SIZE);
            ctx.lineTo(canvas.width, i * BOX_SIZE);
            ctx.stroke();
        }
    }

    function drawTriangle(centerXInBoxes, baseYInBoxes, widthInBoxes, heightInBoxes) {
        const pixelCenterX = centerXInBoxes * BOX_SIZE;
        const pixelBaseY = baseYInBoxes * BOX_SIZE;
        const pixelWidth = widthInBoxes * BOX_SIZE;
        const pixelHeight = heightInBoxes * BOX_SIZE;

        ctx.beginPath();
        ctx.moveTo(pixelCenterX, pixelBaseY - pixelHeight);
        ctx.lineTo(pixelCenterX - pixelWidth / 2, pixelBaseY);
        ctx.lineTo(pixelCenterX + pixelWidth / 2, pixelBaseY);
        ctx.closePath();

        ctx.fillStyle = PEG_COLOR_FILL;
        ctx.fill();
        ctx.strokeStyle = PEG_COLOR_STROKE;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawRightAngleTriangle(verticalSideXInBoxes, baseYInBoxes, widthInBoxes, heightInBoxes, type) {
        const pixelVerticalSideX = verticalSideXInBoxes * BOX_SIZE;
        const pixelBaseY = baseYInBoxes * BOX_SIZE;
        const pixelWidth = widthInBoxes * BOX_SIZE;
        const pixelHeight = heightInBoxes * BOX_SIZE;

        ctx.beginPath();
        if (type === 'rightFacingApex') {
            ctx.moveTo(pixelVerticalSideX + pixelWidth, pixelBaseY - pixelHeight);
            ctx.lineTo(pixelVerticalSideX, pixelBaseY);
            ctx.lineTo(pixelVerticalSideX, pixelBaseY - pixelHeight);
        } else { // 'leftFacingApex'
            ctx.moveTo(pixelVerticalSideX, pixelBaseY - pixelHeight);
            ctx.lineTo(pixelVerticalSideX + pixelWidth, pixelBaseY - pixelHeight);
            ctx.lineTo(pixelVerticalSideX + pixelWidth, pixelBaseY);
        }
        ctx.closePath();
        
        ctx.fillStyle = PEG_COLOR_FILL;
        ctx.fill();
        ctx.strokeStyle = PEG_COLOR_STROKE;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // --- Drawing Functions ---
    function drawTopSlotLabels() {
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = TEXT_FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const labelY = 0.5 * BOX_SIZE;
        const slotLabels = ["slot1", "slot2", "slot3", "slot4", "slot5"];
        const pegXCentersRow1 = [3, 7, 11, 15, 19];

        slotLabels.forEach((label, index) => {
            ctx.fillText(label, pegXCentersRow1[index] * BOX_SIZE, labelY);
        });
    }

    function drawPegs() {
        // Peg Row 1 (5 pegs)
        const baseYRow1 = (1 + PEG_HEIGHT_BOXES); 
        const pegXCentersRow1 = [3, 7, 11, 15, 19];
        pegXCentersRow1.forEach(centerX => {
            drawTriangle(centerX, baseYRow1, PEG_WIDTH_BOXES, PEG_HEIGHT_BOXES);
        });

        // Peg Row 2 (10 pegs)
        const topYRow2 = baseYRow1 + 0.5;
        const baseYRow2 = topYRow2 + PEG_HEIGHT_BOXES;
        const pegXCentersRow2 = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
        pegXCentersRow2.forEach(centerX => {
            drawTriangle(centerX, baseYRow2, PEG_WIDTH_BOXES, PEG_HEIGHT_BOXES);
        });
        
        // Peg Row 3 (11 pegs: 2 right-angle, 9 standard)
        const topYRow3_standard = baseYRow2 + 0.5;
        const baseYRow3_standard = topYRow3_standard + PEG_HEIGHT_BOXES;
        const topYRow3_RA = baseYRow2 + 0.5; // Align tops for all pegs in this row
        const baseYRow3_RA = topYRow3_RA + RA_PEG_HEIGHT_BOXES; // Base for taller RA pegs

        drawRightAngleTriangle(0, baseYRow3_RA, RA_PEG_WIDTH_BOXES, RA_PEG_HEIGHT_BOXES, 'rightFacingApex');

        const pegXCentersRow3_standard = [3, 5, 7, 9, 11, 13, 15, 17, 19];
         pegXCentersRow3_standard.forEach(centerX => {
            // Standard pegs in row 3 have their tops aligned with RA pegs, so their base is also baseYRow3_standard
            // but since we calculated baseYRow3_RA for the tallest, we use that for return.
            // Standard pegs are shorter, so their individual base Y would be baseYRow3_standard if they were the only ones.
            // For drawing, we use their specific height.
            drawTriangle(centerX, baseYRow3_standard, PEG_WIDTH_BOXES, PEG_HEIGHT_BOXES);
        });

        drawRightAngleTriangle(BOARD_COLS - RA_PEG_WIDTH_BOXES, baseYRow3_RA, RA_PEG_WIDTH_BOXES, RA_PEG_HEIGHT_BOXES, 'leftFacingApex');
        
        return baseYRow3_RA; // Return the Y-coordinate (in box units) of the base of the tallest pegs in row 3
    }

    // Modified to accept the lowest peg base Y-coordinate
    function drawBottomSlotsAndPrizes(lowestPegBaseYInBoxes) {
        ctx.strokeStyle = SLOT_LINE_COLOR;
        ctx.lineWidth = 2;

        const prizeSlotTopY = (lowestPegBaseYInBoxes + 0.5) * BOX_SIZE; // 0.5 box gap

        for (let i = 0; i <= BOARD_COLS; i += 2) {
            if (i === 0 && BOARD_COLS > 0) continue; 
            if (i === BOARD_COLS && BOARD_COLS > 0) continue; 
            
            ctx.beginPath();
            ctx.moveTo(i * BOX_SIZE, prizeSlotTopY);
            ctx.lineTo(i * BOX_SIZE, canvas.height);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(0, prizeSlotTopY);
        ctx.lineTo(canvas.width, prizeSlotTopY);
        ctx.stroke();

        const prizeValues = ["+20$", "+6$", "+3$", "+1$", "+0$", "+2$", "+0$", "+1$", "+3$", "+9$", "+4$"];
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = TEXT_FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const prizeLabelY = ((BOARD_ROWS - 1) + 0.5) * BOX_SIZE;

        for (let i = 0; i < prizeValues.length; i++) {
            const slotCenterX = (i * 2 + 1) * BOX_SIZE;
            ctx.fillText(prizeValues[i], slotCenterX, prizeLabelY);
        }
    }

    // --- Main Drawing ---
    drawGrid();
    drawTopSlotLabels();
    const lowestPegY = drawPegs(); // Call drawPegs and store the returned Y-coordinate
    drawBottomSlotsAndPrizes(lowestPegY); // Pass the Y-coordinate to drawBottomSlotsAndPrizes
};