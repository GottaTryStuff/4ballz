const FIRST_PLAYER = 1, SECOND_PLAYER = 2, EMPTY = 0;

function BoardModel(lines, cols) {
	this._lines = lines;
	this._cols = cols;
	
	this.board = [];
	
	for (let i = 0; i < lines; i++) {
		this.board[i] = [];
		
		for (let j = 0; j < cols; j++) {
			this.board[i][j] = EMPTY;
		}
	}
}

_p = BoardModel.prototype;

_p.getFreeRow = function(col) {
	
	for (let i = this._lines - 1; i >= 0; i--) {
		if (this.board[i][col] === EMPTY)
			return i;
	}
	
	return -1;
}

_p.resetBoard = function() {
	for (let i = 0; i < this._lines; i++)
		for (let j = 0; j < this._cols; j++) {
			this.board[i][j] = EMPTY;
		}
}

function BoardLogic(lines, cols) {
	BoardModel.call(this, lines, cols);
	
	this.currPlayer = Math.round(Math.random()) + 1;
}

extend(BoardModel, BoardLogic);

_p = BoardLogic.prototype;

_p.setGameType = function(gameType) {
	this.gameType = gameType;
}

_p.goFurthest = function(row, col, deltaRow, deltaCol) {
	var tokensNo = 0;
	for 
		(
			let i = row + deltaRow, j = col + deltaCol;
			i >= 0 && i < this._lines && j >= 0 && j < this._cols;
			i += deltaRow, j += deltaCol
		) {
			
			if (this.board[i][j] !== this.board[row][col])
				return tokensNo;
			tokensNo++;
		}
	return tokensNo;
}

_p.checkBothDirections = function(row, col, deltaRow, deltaCol) {
	return 1 + this.goFurthest(row, col, deltaRow, deltaCol) + this.goFurthest(row, col, -deltaRow, -deltaCol);
}

_p.checkWinCondition = function(row, col) {
	if (this.checkBothDirections(row, col, 0, 1) >= 4) {
		this.notifyGameOfWinningCells(row, col, 0, 1);
		return true;
	}
	if (this.checkBothDirections(row, col, 1, 0) >= 4) {
		this.notifyGameOfWinningCells(row, col, 1, 0);
		return true;
	}
	if (this.checkBothDirections(row, col, 1, 1) >= 4) {
		this.notifyGameOfWinningCells(row, col, 1, 1);
		return true;
	}
	if (this.checkBothDirections(row, col, -1, 1) >= 4) { 
		this.notifyGameOfWinningCells(row, col, -1, 1);
		return true;
	}
	
	return false;
}

_p.notifyGameOfWinningCells = function(row, col, deltaRow, deltaCol) {
	var cellsArr = [];
	for 
		(
			let i = row + deltaRow, j = col + deltaCol;
			i >= 0 && i < this._lines && j >= 0 && j < this._cols;
			i += deltaRow, j += deltaCol
		) {
			
			if (this.board[i][j] === this.board[row][col])
				cellsArr.push({i, j});
			else
				break;
		}
	
	for 
		(
			let i = row - deltaRow, j = col - deltaCol;
			i >= 0 && i < this._lines && j >= 0 && j < this._cols;
			i -= deltaRow, j -= deltaCol
		) {
			
			if (this.board[i][j] === this.board[row][col])
				cellsArr.push({i, j});
			else 
				break;
		}
	
	cellsArr.push({
		i : row,
		j : col
	})
	
	var winningCellsEvent = new CustomEvent("WinningCells", {
		detail : cellsArr
	});
	
	window.dispatchEvent(winningCellsEvent);
}

_p.countMaxPossible = function(row, col, deltaRow, deltaCol) {
	var maxPossible = 0;
	for 
		(
			i = row + deltaRow, j = col + deltaCol;
			i >= 0 && i < this._lines && j >= 0 && j < this._cols;
			i += deltaRow, j += deltaCol
		) {
			
			if (this.board[i][j] === this.board[row][col] || this.board[i][j] === EMPTY) {
				maxPossible++;
			}
			else 
				break;
		}

	for 
		(
			i = row - deltaRow, j = col - deltaCol;
			i >= 0 && i < this._lines && j >= 0 && j < this._cols;
			i -= deltaRow, j -= deltaCol
		) {
			
			if (this.board[i][j] === this.board[row][col] || this.board[i][j] === EMPTY) {
				maxPossible++;
			}
			else 
				break;
		}

	return maxPossible;
}

_p.countTokensInRow = function(row, col, deltaRow, deltaCol, countEmptySpaces) {
	var endA, endB, tokensNo = 0, spacesNo = 0;
	
	var i, j;
	for 
		(
			i = row + deltaRow, j = col + deltaCol;
			i >= 0 && i < this._lines && j >= 0 && j < this._cols;
			i += deltaRow, j += deltaCol
		) {
			if (this.board[i][j] === this.board[row][col]) {
				tokensNo++;
			}
			else if (this.board[i][j] === EMPTY && countEmptySpaces && spacesNo < 2) {
				spacesNo++;
			}
			else {
				//removing ending spaces
				let r = i - deltaRow, c = j - deltaCol;
				
				while (this.board[r][c] === EMPTY) {
					spacesNo--;
					r = r - deltaRow, c = c - deltaCol;
				}
				
				r += deltaRow, c += deltaCol;
				endA = {
					i : r, j : c
				};
				break;
			}
		}
	
	if (endA === undefined) {
		//removing ending spaces
		let r = i - deltaRow, c = j - deltaCol;
		
		if (this.board[r][c] === EMPTY) {
			while (this.board[r][c] === EMPTY) {
				spacesNo--;
				r = r - deltaRow, c = c - deltaCol;
			}

			r += deltaRow, c += deltaCol;
			endA = {
				i : r, j : c
			};
		}
	}
	
	for 
		(
			i = row - deltaRow, j = col - deltaCol;
			i >= 0 && i < this._lines && j >= 0 && j < this._cols;
			i -= deltaRow, j -= deltaCol
		) {
			if (this.board[i][j] === this.board[row][col]) {
				tokensNo++;
			}
			else if (this.board[i][j] === EMPTY && countEmptySpaces && spacesNo < 2) {
				spacesNo++;
			}
			else {
				//removing ending spaces
				let r = i + deltaRow, c = j + deltaCol;
				
				while (this.board[r][c] === EMPTY) {
					spacesNo--;
					r = r + deltaRow, c = c + deltaCol;
				}
				
				
				r -= deltaRow, c -= deltaCol;
				endB = {
					i : r, j : c
				};
				break;
			}
		}
	
	if (endB === undefined) {
		//removing ending spaces
		let r = i + deltaRow, c = j + deltaCol;
		
		if (this.board[r][c] === EMPTY) {
			while (this.board[r][c] === EMPTY) {
				spacesNo--;
				r = r + deltaRow, c = c + deltaCol;
			}

			r -= deltaRow, c -= deltaCol;
			endA = {
				i : r, j : c
			};
		}
	}
	
	tokensNo++;
	return {
		tokensNo,
		spacesNo,
		endA,
		endB
	};
}

_p.getMaxTokensInRow = function(i, j, countEmptySpaces = false) {
	var endA, endB, max = 0, spacesNo = 0, maxPossible = 0, isDiagonal = false,
		horVertDirections = [[0, 1], [1, 0]], diagDirections = [[1, 1], [1, -1]];
	
	for (let dir of diagDirections) {
		let retVal, possible;
		
		if ((possible = this.countMaxPossible(i, j, dir[0], dir[1])) > maxPossible) {
			maxPossible = possible;
		}
		
		if ((retVal = this.countTokensInRow(i, j, dir[0], dir[1], countEmptySpaces)).tokensNo > max) {
			max = retVal.tokensNo;
			spacesNo = retVal.spacesNo;
			endA = retVal.endA;
			endB = retVal.endB;
			isDiagonal = true;
		}
	}
	
	for (let dir of horVertDirections) {
		let retVal;
		
		if ((possible = this.countMaxPossible(i, j, dir[0], dir[1])) > maxPossible) {
			maxPossible = possible;
		}
		
		if ((retVal = this.countTokensInRow(i, j, dir[0], dir[1], countEmptySpaces)).tokensNo > max) {
			
			max = retVal.tokensNo;
			spacesNo = retVal.spacesNo;
			endA = retVal.endA;
			endB = retVal.endB;
			isDiagonal = false
		}
	}
	
	return {
		maxPossible , max, spacesNo, endA, endB, isDiagonal
	};
}

_p.makeAIMove = function() {
	var colsWithPriority = [];
	
	function cmp(a, b) {
		return b.priority - a.priority;
	}
	
	for (let col = 0; col < this._cols; col++) {
		let freeRow;
		
		if ((freeRow = this.getFreeRow(col)) == -1)
			continue;
		
		/*
			PREVENTING ENEMY MOVES
		*/
		
		this.board[freeRow][col] = FIRST_PLAYER;
		var result = this.getMaxTokensInRow(freeRow, col, false),
			endA = result.endA,
			endB = result.endB;
		this.board[freeRow][col] = EMPTY;
		
		//next enemy move makes it a sure win or is a winning move
		if (result.max === 3 && endA != undefined && endB != undefined 
			&& this.board[endA.i][endA.j] === EMPTY && this.board[endB.i][endB.j] === EMPTY 
			&& this.getFreeRow(endA.j) === endA.i && this.getFreeRow(endB.j) === endB.i 
			|| result.max >= 4) {
			
			colsWithPriority.push({
				col,
				priority : 4.5
			});
		}
		
		/*
			CHECKING EFFECTS OF AI MOVE
		*/
		
		this.board[freeRow][col] = SECOND_PLAYER;
		var result = this.getMaxTokensInRow(freeRow, col, false);
		this.board[freeRow][col] = EMPTY;
		
		if (result.max >= 4) {
			colsWithPriority.push({
				col,
				priority : 5
			});
			
			continue;
		}
		
		//putting the AI token here gives the enemy the oportunity to win
		
		if (freeRow - 1 >= 0) {
			this.board[freeRow - 1][col] = FIRST_PLAYER;
			var result = this.getMaxTokensInRow(freeRow - 1, col, false);
			this.board[freeRow - 1][col] = EMPTY;

			if (result.max >= 4) {
				colsWithPriority.push({
					col,
					priority : -1
				});

				continue;
			}
		}
		
		this.board[freeRow][col] = SECOND_PLAYER;
		var result = this.getMaxTokensInRow(freeRow, col, true);
		this.board[freeRow][col] = EMPTY;
		
		if (result.maxPossible >= 4) {
			colsWithPriority.push({
				col,
				priority : result.max - result.spacesNo / 10 + (result.isDiagonal? 0.2 : 0)
			});
		}
		else {
			colsWithPriority.push({
				col,
				priority : 0
			});
		}
	}
	
	colsWithPriority.sort(cmp);
	
	function getRandomPosition(l, r) {
		return Math.floor(Math.random() * (r - l) + l);
	}
	
	var equalPriorities = [colsWithPriority[0]];
	
	for (var i = 1; i < colsWithPriority.length; i++) {
		if (colsWithPriority[i].priority === equalPriorities[0].priority)
			equalPriorities.push(colsWithPriority[i]);
	}
	
	console.log(colsWithPriority);console.log(equalPriorities);
	
	var pos = getRandomPosition(0, equalPriorities.length - 1);
	console.log(pos);
	return {
		row : this.makeMove(equalPriorities[pos].col),
		col : equalPriorities[pos].col
	}
}

_p.makeMove = function(col) {
	var freeRow = this.getFreeRow(col);
	
	if (!(~freeRow))
		return freeRow;
	
	this.board[freeRow][col] = this.currPlayer;
	
	this.currPlayer = (this.currPlayer === FIRST_PLAYER)? SECOND_PLAYER : FIRST_PLAYER;
	
	return freeRow;
}

_p.handleMove = function(row, col) {
	var gameOverMessage = "";
	
	if (this.checkWinCondition(row, col)) {
		//switching back to last player -> the wining player
		this.currPlayer = (this.currPlayer === FIRST_PLAYER)? SECOND_PLAYER : FIRST_PLAYER;
		
		console.log
		(
			((this.currPlayer === FIRST_PLAYER)? "Red" : "Blue") + " wins"
		);
		
		gameOverMessage += ((this.currPlayer === FIRST_PLAYER)? "Red" : "Blue") + " wins";
		
	}
	
	else if (row === 0) {
		var filledTops = 0;
		for (let j = 0; j < this._cols; j++)
			if (this.board[0][j])
				filledTops++;
		
		if (filledTops === this._cols) {
			console.log("It's a draw!");
			
			gameOverMessage += "It's a draw!";
		}
	}
	
	if (gameOverMessage) {
		var winEv = new CustomEvent("GameOver", {
			detail : {
				message : gameOverMessage
			}
		})
		
		window.dispatchEvent(winEv);
	}
}
