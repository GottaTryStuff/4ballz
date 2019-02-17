const COLS = 7, LINES = 5, LINE_WIDTH = 2;

function BoardRenderer(canvas) {
	this._cols = COLS;
	this._lines = LINES;
	this.boardLogic = new BoardLogic(this._lines, this._cols);
	
	this.lastActiveColumn = 0;
	
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");
	
	this.lineWidth = LINE_WIDTH;
	
	this.gameOver = false;
	this.winningCells = [];
	
	this.initCanvas();
}

_p = BoardRenderer.prototype;

_p.initCanvas = function() {
	this.resetFullscreenCanvas();
	
	this.boundFollowCursor = this.followCursor.bind(this);
	this.boundHandleClick = this.handleClick.bind(this);
	
	window.addEventListener("resize", this.resetFullscreenCanvas.bind(this));
	window.addEventListener("GameOver", this.pausePlayerInteraction.bind(this));
	window.addEventListener("WinningCells", this.highlightWinningCells.bind(this));
}

_p.resetFullscreenCanvas = function() {
	this.canvas.width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	this.canvas.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	
	this.cellSize = Math.min(
		Math.floor(this.canvas.width / this._cols), 
		Math.floor(this.canvas.height / this._lines)
	) - this.lineWidth;
	
	this.offsetLeft = (this.canvas.width - this.cellSize * this._cols) / 2;
	this.offsetTop = (this.canvas.height - this.cellSize * this._lines) / 2;
	
	this.tokenRadius = Math.floor(this.cellSize * 0.3);
	
	this.dropSpeed = this.cellSize / 6;
	
	this.drawBoard();
}

_p.startGame = function(gameType) {
	this.gameType = gameType;
	this.lastActiveColumn = 0;
	
	this.gameOver = false;
	this.winningCells = [];
	
	this.boardLogic.setGameType(gameType);
	this.boardLogic.resetBoard();
	
	this.drawBoard();
	
	if (gameType === PVP || (gameType === PVAI && this.boardLogic.currPlayer === FIRST_PLAYER))
		this.resumePlayerInteraction();
	else
		this.handleAIMove();
}

//translating coords to column coordinate
_p.getCurrentColumn = function(x, y) {
	var boardWidth = this._cols * this.cellSize,
		boardHeight = this._lines * this.cellSize;
	
	if (y < this.offsetTop || y > this.offsetTop + boardHeight) {
		return this.lastActiveColumn;
	}
	if (x < this.offsetLeft) {
		return 0;
	}
	if (x > this.offsetLeft + boardWidth) {
		return this._cols - 1;
	}
	
	x -= this.offsetLeft;
	
	return x / this.cellSize;
}

//redraws a cell by removing the current one and redrawing the lines
_p.redrawCell = function(x, y, color = "white") {
	var ctx = this.ctx;
	
	ctx.fillStyle = color;
	ctx.strokeStyle = "brown";
	//remove old cell
	ctx.fillRect(x, y, this.cellSize, this.cellSize);
	
	ctx.beginPath();
	
	//redrawing top horizontal line
	ctx.moveTo(x, y);
	ctx.lineTo(x + this.cellSize, y);
	
	
	//redrawing bottom horizontal line
	ctx.moveTo(x, y + this.cellSize);
	ctx.lineTo(x + this.cellSize, y + this.cellSize);
	
	//redrawing left vertical line
	ctx.moveTo(x, y);
	ctx.lineTo(x, y + this.cellSize);
	
	//redrawing right vertical line
	ctx.moveTo(x + this.cellSize, y);
	ctx.lineTo(x + this.cellSize, y + this.cellSize);
	
	ctx.stroke();
	ctx.closePath();
}

_p.removeOldTriangle = function() {
	var ctx = this.ctx,
		lastColPosX = this.lastActiveColumn * this.cellSize;
	
	ctx.translate(this.offsetLeft, this.offsetTop);
	
	//remove the cell with the old position triangle
	this.redrawCell(lastColPosX, 0);
	
	//redraw the token too if there is one
	if (this.boardLogic.board[0][this.lastActiveColumn])
	{
		this.drawToken(0, this.lastActiveColumn);
	}
	
	ctx.translate(-this.offsetLeft, -this.offsetTop);
}

_p.drawTriangle = function(x, y, col = Math.floor(this.getCurrentColumn(x, y))) {
	var ctx = this.ctx,
		colMid = col * this.cellSize + this.cellSize * 0.5,
		triangleBase = this.cellSize * 0.4;
	
	ctx.translate(this.offsetLeft, this.offsetTop);
	
	//draw position triangle
	ctx.beginPath();
	ctx.fillStyle = (this.boardLogic.currPlayer === FIRST_PLAYER)? "red" : "blue";
	
	ctx.moveTo(colMid - triangleBase, 0);
	ctx.lineTo(colMid + triangleBase, 0);
	ctx.lineTo(colMid, triangleBase / 2);
	ctx.lineTo(colMid - triangleBase, 0);
	
	ctx.fill();
	ctx.closePath();
	ctx.translate(-this.offsetLeft, -this.offsetTop);
}

//redrawing position triangle by removing old triangle and redrawing the new one
_p.redrawTriangle = function(x, y, col = Math.floor(this.getCurrentColumn(x, y))) {
	this.removeOldTriangle();
	
	this.drawTriangle(x, y, col);
	
	this.lastActiveColumn = col;
}

_p.followCursor = function(e) {
	var x = e.clientX,
		y = e.clientY,
		col = Math.floor(this.getCurrentColumn(x, y));
	
	if (col === this.lastActiveColumn)
		return;
	
	this.lastMouseCoords = {x : e.clientX, y : e.clientY};
	
	this.redrawTriangle(x, y, col);
}

_p.handleClick = function(e) {
	var x = e.clientX, y = e.clientY,
		left = this.offsetLeft, top = this.offsetTop,
		bottom = this.offsetTop + this._lines * this.cellSize,
		right = this.offsetLeft + this._cols * this.cellSize;
	
	if (x >= left && x <= right && y >= top && y <= bottom) {
		var occupiedCol = this.lastActiveColumn;
		
		//occupied the first free row found
		var occupiedRow = this.boardLogic.makeMove(occupiedCol);
		
		//-1 if column is full
		if (!(~occupiedRow))
			return;
		
		this.pausePlayerInteraction();
		
		this._playerMoveHandle = (function() {
			this.resumePlayerInteraction();
			
			this.boardLogic.handleMove(occupiedRow, occupiedCol);
			
			window.removeEventListener("TokenAnimationFinished", this._playerMoveHandle);
			
			if (this.gameType === PVAI) {
				this.handleAIMove();
			}
		}).bind(this);
		
		window.addEventListener("TokenAnimationFinished", this._playerMoveHandle);
		
		this.animateTokenDrop(occupiedCol * (this.cellSize) + this.cellSize * 0.5,
							  this.tokenRadius,
							  occupiedRow * (this.cellSize) + this.cellSize * 0.5);
	}
}

_p.handleAIMove = function() {
	if (this.gameOver)
		return;
	
	this.pausePlayerInteraction();
	
	var coords = this.boardLogic.makeAIMove(),
		occupiedRow = coords.row,
		occupiedCol = coords.col;
	
	this._AIHandle = (function() {
		this.resumePlayerInteraction();

		this.boardLogic.handleMove(occupiedRow, occupiedCol);

		window.removeEventListener("TokenAnimationFinished", this._AIHandle);
	}).bind(this);

	window.addEventListener("TokenAnimationFinished", this._AIHandle);

	this.animateTokenDrop(occupiedCol * (this.cellSize) + this.cellSize * 0.5,
						  this.tokenRadius,
						  occupiedRow * (this.cellSize) + this.cellSize * 0.5);
}

_p.pausePlayerInteraction = function() {
	this.removeOldTriangle();
	
	//we keep track of mouse movements even when
	//interaction is turned off
	this.boundKeepTrackOfCursor && 
		(this.boundKeepTrackOfCursor = (function(e) {
			this.lastMouseCoords = {x : e.clientX, y : e.clientY};
		}).bind(this));
	
	this.canvas.removeEventListener("mousemove", this.boundFollowCursor);
	this.canvas.addEventListener("mousemove", this.boundKeepTrackOfCursor);
	
	this.canvas.removeEventListener("click", this.boundHandleClick);
}

_p.resumePlayerInteraction = function() {
	var coords = this.lastMouseCoords;
	coords && this.redrawTriangle(coords.x, coords.y);
	
	this.canvas.removeEventListener("mousemove", this.boundKeepTrackOfCursor);
	this.canvas.addEventListener("mousemove", this.boundFollowCursor);
	
	this.canvas.addEventListener("click", this.boundHandleClick);
}

//the token has to get in the currX and finalY position
//as it "drops" from the top of the board
_p.animateTokenDrop = function(currX, currY, finalY) {	
	if (currY >= finalY) {
		this.drawTokenAnimationFrame(currX, finalY);
		window.dispatchEvent(new CustomEvent("TokenAnimationFinished"));
		
		return;
	}
	
	this.drawTokenAnimationFrame(currX, currY);
	
	var boundAnimate = this.animateTokenDrop.bind(this, currX, currY + this.dropSpeed, finalY);
	
	requestAnimationFrame(boundAnimate);
}

_p.drawTokenAnimationFrame = function(x, y) {
	var oldRow = Math.floor((y - this.dropSpeed) / this.cellSize),
		oldCol = Math.floor(x / this.cellSize);
	
	this.ctx.translate(this.offsetLeft, this.offsetTop);
	
	this.redrawCell(oldCol * this.cellSize, oldRow * this.cellSize);
	
	var anotherOldRow;
	
	//the old top of the token was in another cell than the center
	if ((anotherOldRow = 
		 Math.floor((y - this.dropSpeed - this.tokenRadius) / this.cellSize)) != oldRow) {
		if (anotherOldRow >= 0 && anotherOldRow < this._cols)
			this.redrawCell(oldCol * this.cellSize, anotherOldRow * this.cellSize);
	}
	
	//the player already switched so if the current player is the first_player we're animating
	//the second's player previous move
	this.drawTokenOnCoord(x, y, 
						 (this.boardLogic.currPlayer === FIRST_PLAYER)? "blue" : "red")
	
	
	this.ctx.translate(-this.offsetLeft, -this.offsetTop);
}

_p.drawTokenOnCoord = function(x, y, color) {
	var ctx = this.ctx;
	ctx.fillStyle = color;
	ctx.strokeStyle = "black";
	
	ctx.beginPath();
	ctx.arc(x, y, this.tokenRadius, 0, 2 * Math.PI);
	ctx.fill();
	ctx.stroke();
	ctx.closePath();

	ctx.fillStyle = "rgba(255, 249, 222, 1)";
	ctx.globalAlpha = 0.6;

	ctx.beginPath();
	ctx.arc(x + this.tokenRadius * 0.25,
			y - this.tokenRadius * 0.25,
			Math.floor(this.cellSize * 0.125),
			0, 2 * Math.PI);
	ctx.fill();
	ctx.closePath();

	ctx.globalAlpha = 1;
}

_p.drawToken = function(i, j) {
	var tokenCenterX = j * (this.cellSize) + this.cellSize * 0.5,
		tokenCenterY = i * (this.cellSize) + this.cellSize * 0.5;
	
	if (this.boardLogic.board[i][j] === FIRST_PLAYER) {
		this.drawTokenOnCoord(tokenCenterX, tokenCenterY, "red");
	}
	else if (this.boardLogic.board[i][j] === SECOND_PLAYER) {
		this.drawTokenOnCoord(tokenCenterX, tokenCenterY, "blue");
	}
}

_p.drawBoard = function() {
	var ctx = this.ctx;
	
	ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	
	ctx.translate(this.offsetLeft, this.offsetTop);
	
	ctx.strokeStyle = "brown";
	ctx.lineWidth = this.lineWidth;
	
	for (var i = 0; i <= this._lines; i++) {
		ctx.beginPath();
		ctx.moveTo(0, i * this.cellSize);
		ctx.lineTo(this.cellSize * this._cols, i * this.cellSize);
		ctx.stroke();
		ctx.closePath();
	}
	
	for (var i = 0; i <= this._cols; i++) {
		ctx.beginPath();
		ctx.moveTo(i * this.cellSize, 0);
		ctx.lineTo(i * this.cellSize, this.cellSize * this._lines);
		ctx.stroke();
		ctx.closePath();
	}
	
	if (this.gameOver && this.winningCells.length != 0) {
		for (let cellCoord of this.winningCells)
			this.redrawCell(cellCoord.x * this.cellSize, cellCoord.y * this.cellSize, "yellow");
	}
	
	for (var i = 0; i < this._lines; i++) {
		for (var j = 0; j < this._cols; j++) {
			if (this.boardLogic.board[i][j])
				this.drawToken(i, j);
		}
	}
	
	ctx.translate(-this.offsetLeft, -this.offsetTop);
}

_p.highlightWinningCells = function(e) {
	var cellsArr = e.detail;
	this.gameOver = true;
	this.winningCells = [];
	
	this.ctx.translate(this.offsetLeft, this.offsetTop);
	
	for (let coord of cellsArr) {
		var cellCoord = {
			x : coord.j,
			y : coord.i
		}
		this.winningCells.push(cellCoord);
		
		this.redrawCell(cellCoord.x * this.cellSize, cellCoord.y * this.cellSize, "yellow");
		this.drawToken(coord.i, coord.j);
	}
	
	this.ctx.translate(-this.offsetLeft, -this.offsetTop);
} 