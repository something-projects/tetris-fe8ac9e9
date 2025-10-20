class Tetris {
  constructor() {
    this.board = this.createBoard(20, 10);
    this.currentPiece = null;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.dropTime = 0;
    this.dropInterval = 1000; // 1 cell per second as per PRD
    this.lockDelay = 500; // 500ms lock delay as per PRD
    this.lockTimer = 0;
    this.isLocking = false;
    
    // Standard Tetris pieces with 4 rotation states each (as per Tech Design)
    this.pieceDefinitions = {
      'I': [
        [['X', 'X', 'X', 'X']], // 0°
        [['X'], ['X'], ['X'], ['X']], // 90°
        [['X', 'X', 'X', 'X']], // 180° 
        [['X'], ['X'], ['X'], ['X']] // 270°
      ],
      'O': [
        [['X', 'X'], ['X', 'X']], // All rotations identical
        [['X', 'X'], ['X', 'X']],
        [['X', 'X'], ['X', 'X']],
        [['X', 'X'], ['X', 'X']]
      ],
      'T': [
        [[' ', 'X', ' '], ['X', 'X', 'X']], // 0°
        [['X', ' '], ['X', 'X'], ['X', ' ']], // 90°
        [['X', 'X', 'X'], [' ', 'X', ' ']], // 180°
        [[' ', 'X'], ['X', 'X'], [' ', 'X']] // 270°
      ],
      'S': [
        [[' ', 'X', 'X'], ['X', 'X', ' ']], // 0°
        [['X', ' '], ['X', 'X'], [' ', 'X']], // 90°
        [[' ', 'X', 'X'], ['X', 'X', ' ']], // 180°
        [['X', ' '], ['X', 'X'], [' ', 'X']] // 270°
      ],
      'Z': [
        [['X', 'X', ' '], [' ', 'X', 'X']], // 0°
        [[' ', 'X'], ['X', 'X'], ['X', ' ']], // 90°
        [['X', 'X', ' '], [' ', 'X', 'X']], // 180°
        [[' ', 'X'], ['X', 'X'], ['X', ' ']] // 270°
      ],
      'J': [
        [['X', ' ', ' '], ['X', 'X', 'X']], // 0°
        [['X', 'X'], ['X', ' '], ['X', ' ']], // 90°
        [['X', 'X', 'X'], [' ', ' ', 'X']], // 180°
        [[' ', 'X'], [' ', 'X'], ['X', 'X']] // 270°
      ],
      'L': [
        [[' ', ' ', 'X'], ['X', 'X', 'X']], // 0°
        [['X', ' '], ['X', ' '], ['X', 'X']], // 90°
        [['X', 'X', 'X'], ['X', ' ', ' ']], // 180°
        [['X', 'X'], [' ', 'X'], [' ', 'X']] // 270°
      ]
    };
    
    this.pieceTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  }

  createBoard(height, width) {
    return Array.from({ length: height }, () => 
      Array.from({ length: width }, () => ' ')
    );
  }

  spawnPiece() {
    const pieceTypeIndex = Math.floor(Math.random() * this.pieceTypes.length);
    const pieceType = this.pieceTypes[pieceTypeIndex];
    const shape = this.pieceDefinitions[pieceType][0]; // Start with rotation 0
    
    this.currentPiece = {
      type: pieceType,
      shape: shape,
      rotation: 0,
      x: Math.floor((10 - shape[0].length) / 2),
      y: 0
    };
    
    if (!this.isValidMove(this.currentPiece)) {
      this.gameOver = true;
    }
  }

  isValidMove(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] === 'X') {
          const newX = piece.x + x;
          const newY = piece.y + y;
          
          if (newX < 0 || newX >= 10 || newY >= 20) {
            return false;
          }
          
          if (newY >= 0 && this.board[newY][newX] !== ' ') {
            return false;
          }
        }
      }
    }
    return true;
  }

  movePiece(dx, dy, isSoftDrop = false) {
    if (!this.currentPiece) return false;
    
    const newPiece = {
      ...this.currentPiece,
      x: this.currentPiece.x + dx,
      y: this.currentPiece.y + dy
    };
    
    if (this.isValidMove(newPiece)) {
      this.currentPiece = newPiece;
      
      // Add soft drop scoring according to Tech Design
      if (isSoftDrop && dy > 0) {
        this.score += 1; // 1 point per cell for soft drop
      }
      
      return true;
    }
    return false;
  }

  rotatePiece(clockwise = true) {
    if (!this.currentPiece) return;
    
    // Use proper 4-state rotation system as per Tech Design
    let nextRotation;
    if (clockwise) {
      nextRotation = (this.currentPiece.rotation + 1) % 4;
    } else {
      // Counterclockwise rotation as per Tech Design
      nextRotation = (this.currentPiece.rotation - 1 + 4) % 4;
    }
    const rotatedShape = this.pieceDefinitions[this.currentPiece.type][nextRotation];
    
    const rotatedPiece = {
      ...this.currentPiece,
      shape: rotatedShape,
      rotation: nextRotation
    };
    
    if (this.isValidMove(rotatedPiece)) {
      this.currentPiece = rotatedPiece;
    }
  }

  placePiece() {
    if (!this.currentPiece) return;
    
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x] === 'X') {
          const boardX = this.currentPiece.x + x;
          const boardY = this.currentPiece.y + y;
          if (boardY >= 0) {
            this.board[boardY][boardX] = 'X';
          }
        }
      }
    }
    
    this.clearLines();
    this.currentPiece = null;
  }

  clearLines() {
    let linesCleared = 0;
    
    for (let y = this.board.length - 1; y >= 0; y--) {
      if (this.board[y].every(cell => cell === 'X')) {
        this.board.splice(y, 1);
        this.board.unshift(Array(10).fill(' '));
        linesCleared++;
        y++;
      }
    }
    
    if (linesCleared > 0) {
      this.lines += linesCleared;
      
      // Implement proper Tetris scoring system according to PRD (fixed values)
      let scorePoints;
      switch (linesCleared) {
      case 1:
        scorePoints = 100; // Single line
        break;
      case 2:
        scorePoints = 300; // Double lines
        break;
      case 3:
        scorePoints = 500; // Triple lines
        break;
      case 4:
        scorePoints = 800; // Tetris (4 lines)
        break;
      default:
        scorePoints = 100; // Fallback
      }
      
      this.score += scorePoints; // Fixed values as per PRD, no level multiplier
      this.level = Math.floor(this.lines / 10) + 1; // Level progression tracking only
      // Note: Level progression marked as out of scope in PRD, no speed changes
    }
  }

  drop() {
    if (!this.movePiece(0, 1)) { // Don't add scoring for automatic drops
      // Start lock delay as per PRD specification (500ms)
      if (!this.isLocking) {
        this.isLocking = true;
        this.lockTimer = 0;
      }
    }
  }

  hardDrop() {
    let dropDistance = 0;
    while (this.movePiece(0, 1)) {
      dropDistance++;
    }
    
    // Add hard drop scoring according to Tech Design: 2 points per cell
    this.score += dropDistance * 2;
    
    this.placePiece();
    this.spawnPiece();
  }

  update(deltaTime) {
    if (this.gameOver) return;
    
    // Handle lock delay timer
    if (this.isLocking) {
      this.lockTimer += deltaTime;
      if (this.lockTimer >= this.lockDelay) {
        this.placePiece();
        this.spawnPiece();
        this.isLocking = false;
        this.lockTimer = 0;
      }
    }
    
    // Handle gravity dropping
    this.dropTime += deltaTime;
    if (this.dropTime >= this.dropInterval) {
      this.drop();
      this.dropTime = 0;
    }
  }

  getDisplay() {
    const display = this.board.map(row => [...row]);
    
    if (this.currentPiece) {
      for (let y = 0; y < this.currentPiece.shape.length; y++) {
        for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
          if (this.currentPiece.shape[y][x] === 'X') {
            const boardX = this.currentPiece.x + x;
            const boardY = this.currentPiece.y + y;
            if (boardX >= 0 && boardX < 10 && boardY >= 0 && boardY < 20) {
              display[boardY][boardX] = 'X';
            }
          }
        }
      }
    }
    
    return display;
  }

  reset() {
    this.board = this.createBoard(20, 10);
    this.currentPiece = null;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.dropTime = 0;
    this.dropInterval = 1000;
    this.lockTimer = 0;
    this.isLocking = false;
  }
}

module.exports = Tetris;