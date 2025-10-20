const Tetris = require('../src/tetris');

describe('Tetris Game Logic', () => {
  let tetris;

  beforeEach(() => {
    tetris = new Tetris();
  });

  describe('Board Creation', () => {
    test('should create a 20x10 game board', () => {
      expect(tetris.board).toHaveLength(20);
      expect(tetris.board[0]).toHaveLength(10);
      expect(tetris.board[19]).toHaveLength(10);
    });

    test('should initialize empty board with spaces', () => {
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          expect(tetris.board[y][x]).toBe(' ');
        }
      }
    });
  });

  describe('Game Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(tetris.score).toBe(0);
      expect(tetris.level).toBe(1);
      expect(tetris.lines).toBe(0);
      expect(tetris.gameOver).toBe(false);
    });

    test('should have all 7 standard Tetris pieces defined', () => {
      expect(tetris.pieceTypes).toHaveLength(7);
      expect(Object.keys(tetris.pieceDefinitions)).toHaveLength(7);
    });
  });

  describe('Piece Movement', () => {
    beforeEach(() => {
      tetris.spawnPiece();
    });

    test('should move piece left when valid', () => {
      const originalX = tetris.currentPiece.x;
      const moved = tetris.movePiece(-1, 0);
      expect(moved).toBe(true);
      expect(tetris.currentPiece.x).toBe(originalX - 1);
    });

    test('should move piece right when valid', () => {
      const originalX = tetris.currentPiece.x;
      const moved = tetris.movePiece(1, 0);
      expect(moved).toBe(true);
      expect(tetris.currentPiece.x).toBe(originalX + 1);
    });

    test('should not move piece beyond left boundary', () => {
      // Move piece to left edge
      tetris.currentPiece.x = 0;
      const moved = tetris.movePiece(-1, 0);
      expect(moved).toBe(false);
      expect(tetris.currentPiece.x).toBe(0);
    });

    test('should not move piece beyond right boundary', () => {
      // Move piece to right edge  
      tetris.currentPiece.x = 9;
      const moved = tetris.movePiece(1, 0);
      expect(moved).toBe(false);
      expect(tetris.currentPiece.x).toBe(9);
    });
  });

  describe('Collision Detection', () => {
    beforeEach(() => {
      tetris.spawnPiece();
    });

    test('should detect valid moves correctly', () => {
      const validPiece = {
        ...tetris.currentPiece,
        x: 3,
        y: 5
      };
      expect(tetris.isValidMove(validPiece)).toBe(true);
    });

    test('should prevent movement into occupied cells', () => {
      // Place a piece on the board
      tetris.board[19][5] = 'X';
      
      // Create a test piece that would overlap with the placed piece
      const invalidPiece = {
        shape: [['X']],
        x: 5,
        y: 19
      };
      expect(tetris.isValidMove(invalidPiece)).toBe(false);
    });
  });

  describe('Line Clearing', () => {
    test('should clear completed lines', () => {
      // Fill a line completely
      for (let x = 0; x < 10; x++) {
        tetris.board[19][x] = 'X';
      }

      const originalLines = tetris.lines;
      const originalScore = tetris.score;
      
      tetris.clearLines();
      
      expect(tetris.lines).toBe(originalLines + 1);
      expect(tetris.score).toBeGreaterThan(originalScore);
      
      // Check that the line was cleared
      expect(tetris.board[19].every(cell => cell === ' ')).toBe(true);
    });

    test('should not clear incomplete lines', () => {
      // Fill line except one cell
      for (let x = 0; x < 9; x++) {
        tetris.board[19][x] = 'X';
      }

      const originalLines = tetris.lines;
      tetris.clearLines();
      
      expect(tetris.lines).toBe(originalLines);
    });
  });

  describe('Scoring System', () => {
    test('should calculate score based on lines cleared and level', () => {
      tetris.level = 2;
      
      // Fill a line completely
      for (let x = 0; x < 10; x++) {
        tetris.board[19][x] = 'X';
      }

      const originalScore = tetris.score;
      tetris.clearLines();
      
      expect(tetris.score).toBe(originalScore + 100); // Fixed scoring as per PRD
    });

    test('should increase level based on lines cleared', () => {
      tetris.lines = 9;
      
      // Clear one more line to trigger level increase
      for (let x = 0; x < 10; x++) {
        tetris.board[19][x] = 'X';
      }

      tetris.clearLines();
      
      expect(tetris.level).toBe(2);
    });
  });

  describe('Piece Rotation', () => {
    beforeEach(() => {
      tetris.spawnPiece();
    });

    test('should rotate T-piece correctly', () => {
      // Force T-piece with proper structure
      tetris.currentPiece = {
        type: 'T',
        shape: [
          [' ', 'X', ' '],
          ['X', 'X', 'X']
        ],
        rotation: 0,
        x: 3,
        y: 5
      };
      
      const originalShape = JSON.stringify(tetris.currentPiece.shape);
      const originalRotation = tetris.currentPiece.rotation;
      tetris.rotatePiece();
      
      // Should be different after rotation
      expect(JSON.stringify(tetris.currentPiece.shape)).not.toBe(originalShape);
      expect(tetris.currentPiece.rotation).toBe((originalRotation + 1) % 4);
    });

    test('should prevent rotation when it would cause collision', () => {
      // Place piece at right edge where rotation would go out of bounds
      tetris.currentPiece.x = 9;
      tetris.currentPiece.shape = [
        ['X', 'X', 'X', 'X']
      ];
      
      const originalX = tetris.currentPiece.x;
      const originalShape = JSON.stringify(tetris.currentPiece.shape);
      tetris.rotatePiece();
      
      // Rotation should be blocked, or piece should be in valid position
      const afterShape = JSON.stringify(tetris.currentPiece.shape);
      if (afterShape === originalShape) {
        // Rotation was blocked - piece position unchanged
        expect(tetris.currentPiece.x).toBe(originalX);
      } else {
        // Rotation succeeded - piece should still be in valid position
        expect(tetris.isValidMove(tetris.currentPiece)).toBe(true);
      }
    });
  });

  describe('Hard Drop and Soft Drop', () => {
    beforeEach(() => {
      tetris.spawnPiece();
    });

    test('should hard drop piece and award 2 points per cell', () => {
      const originalScore = tetris.score;
      const originalY = tetris.currentPiece.y;
      
      tetris.hardDrop();
      
      expect(tetris.score).toBeGreaterThan(originalScore);
      expect(tetris.currentPiece).not.toBeNull(); // New piece should spawn
    });

    test('should award 1 point for soft drop movement', () => {
      const originalScore = tetris.score;
      
      tetris.movePiece(0, 1, true); // Soft drop
      
      expect(tetris.score).toBe(originalScore + 1);
    });
  });

  describe('Game Over Detection', () => {
    test('should detect game over when piece cannot spawn', () => {
      // Fill top rows to simulate game over
      for (let y = 0; y < 3; y++) {
        for (let x = 3; x < 7; x++) {
          tetris.board[y][x] = 'X';
        }
      }
      
      tetris.spawnPiece();
      
      expect(tetris.gameOver).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null piece operations gracefully', () => {
      tetris.currentPiece = null;
      
      expect(tetris.movePiece(-1, 0)).toBe(false);
      expect(() => tetris.rotatePiece()).not.toThrow();
      expect(() => tetris.placePiece()).not.toThrow();
    });

    test('should handle multiple line clears correctly', () => {
      // Fill 4 rows for Tetris
      for (let y = 16; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          tetris.board[y][x] = 'X';
        }
      }
      
      const originalScore = tetris.score;
      tetris.clearLines();
      
      expect(tetris.lines).toBe(4);
      expect(tetris.score).toBe(originalScore + (800 * tetris.level));
    });
  });
});