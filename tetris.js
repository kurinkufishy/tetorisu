const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");
const holdCanvas = document.getElementById("hold");
const holdContext = holdCanvas.getContext("2d");

const ROWS = 20;
const COLUMNS = 10;
const BLOCK_SIZE = 30;
let score = 0;
let dropInterval = 500;
let holdPiece = null;
let canHold = true;

canvas.width = COLUMNS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;
context.scale(BLOCK_SIZE, BLOCK_SIZE);
holdContext.scale(30, 30);

const COLORS = [null, "cyan", "blue", "orange", "yellow", "green", "purple", "red"];
const SHAPES = [
    [],
    [[1, 1, 1, 1]], // I
    [[1, 1, 1], [0, 0, 1]], // L
    [[1, 1, 1], [1, 0, 0]], // J
    [[1, 1], [1, 1]], // O
    [[0, 1, 1], [1, 1, 0]], // S
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 1, 0], [0, 1, 1]]  // Z
];

function createMatrix(rows, columns) {
    return Array.from({ length: rows }, () => Array(columns).fill(0));
}

function collide(board, piece) {
    return piece.shape.some((row, y) =>
        row.some((value, x) =>
            value && (board[y + piece.y]?.[x + piece.x] !== 0)
        )
    );
}

function merge(board, piece) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[y + piece.y][x + piece.x] = piece.type;
            }
        });
    });
}

function rotate(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
}

function removeLines(board) {
    let linesCleared = 0;
    let newBoard = board.filter(row => {
        if (row.every(cell => cell !== 0)) {
            linesCleared++;
            return false;
        }
        return true;
    });

    while (newBoard.length < ROWS) {
        newBoard.unshift(Array(COLUMNS).fill(0));
    }

    if (linesCleared > 0) {
        score += linesCleared * 100;
        document.getElementById("score").innerText = score;
        updateSpeed();
    }

    return newBoard;
}

function drawMatrix(matrix, offset, ctx = context) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(board, { x: 0, y: 0 });
    drawMatrix(piece.shape, { x: piece.x, y: piece.y });
    drawHold();
}

function dropPiece() {
    piece.y++;
    if (collide(board, piece)) {
        piece.y--;
        merge(board, piece);
        board = removeLines(board);
        resetPiece();
        canHold = true;
        if (collide(board, piece)) {
            board = createMatrix(ROWS, COLUMNS);
            score = 0;
            document.getElementById("score").innerText = score;
            dropInterval = 500;
        }
    }
}

function movePiece(dir) {
    piece.x += dir;
    if (collide(board, piece)) {
        piece.x -= dir;
    }
}

function rotatePiece() {
    const rotated = rotate(piece.shape);
    const oldShape = piece.shape;
    piece.shape = rotated;
    if (collide(board, piece)) {
        piece.shape = oldShape;
    }
}

function resetPiece() {
    piece.type = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
    piece.shape = SHAPES[piece.type];
    piece.x = Math.floor(COLUMNS / 2) - Math.floor(piece.shape[0].length / 2);
    piece.y = 0;
}

function updateSpeed() {
    dropInterval = Math.max(100, 500 - Math.floor(score / 500) * 50);
}

function hold() {
    if (!canHold) return;
    if (holdPiece === null) {
        holdPiece = { type: piece.type, shape: piece.shape };
        resetPiece();
    } else {
        [holdPiece, piece] = [{ type: piece.type, shape: piece.shape }, holdPiece];
        piece.x = Math.floor(COLUMNS / 2) - Math.floor(piece.shape[0].length / 2);
        piece.y = 0;
    }
    canHold = false;
}

function drawHold() {
    holdContext.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (holdPiece) {
        drawMatrix(holdPiece.shape, { x: 1, y: 1 }, holdContext);
    }
}

document.addEventListener("keydown", (event) => {
    if (event.key === "a") movePiece(-1);
    if (event.key === "d") movePiece(1);
    if (event.key === "s") dropPiece();
    if (event.key === "w") rotatePiece();
    if (event.key === "Shift") hold();
});

let board = createMatrix(ROWS, COLUMNS);
let piece = { type: 0, shape: [], x: 0, y: 0 };

resetPiece();

function update() {
    dropPiece();
    draw();
    setTimeout(update, dropInterval);
}

update();
