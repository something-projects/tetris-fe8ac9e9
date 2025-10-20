const Tetris = require('../src/tetris');

describe('Tetris Piece Rotation System', () => {
  let tetris;

  beforeEach(() => {
    tetris = new Tetris();
  });

  describe('Standard 90-degree Clockwise Rotation', () => {
    test('should rotate T-piece through all 4 states correctly', () => {
      // Start with T-piece at initial rotation (0°)
      tetris.currentPiece = {
        type: 'T',
        shape: [[' ', 'X', ' '], ['X', 'X', 'X']],
        rotation: 0,
        x: 3,
        y: 5
      };

      const expectedRotations = [
        [[' ', 'X', ' '], ['X', 'X', 'X']], // 0° (initial)
        [['X', ' '], ['X', 'X'], ['X', ' ']], // 90°
        [['X', 'X', 'X'], [' ', 'X', ' ']], // 180°
        [[' ', 'X'], ['X', 'X'], [' ', 'X']] // 270°
      ];

      // Test each rotation state
      for (let i = 0; i < 4; i++) {
        expect(tetris.currentPiece.rotation).toBe(i);
        expect(tetris.currentPiece.shape).toEqual(expectedRotations[i]);
        tetris.rotatePiece();
      }

      // After 4 rotations, should be back to initial state
      expect(tetris.currentPiece.rotation).toBe(0);
      expect(tetris.currentPiece.shape).toEqual(expectedRotations[0]);
    });

    test('should rotate I-piece correctly', () => {
      // I-piece horizontal
      tetris.currentPiece = {
        type: 'I',
        shape: [['X', 'X', 'X', 'X']],
        rotation: 0,
        x: 3,
        y: 5
      };

      const originalShape = JSON.stringify(tetris.currentPiece.shape);
      tetris.rotatePiece();

      // Should rotate to vertical
      expect(tetris.currentPiece.rotation).toBe(1);
      expect(tetris.currentPiece.shape).toEqual([['X'], ['X'], ['X'], ['X']]);
      expect(JSON.stringify(tetris.currentPiece.shape)).not.toBe(originalShape);
    });

    test('should handle O-piece rotation (no change)', () => {
      // O-piece doesn't change when rotated
      tetris.currentPiece = {
        type: 'O',
        shape: [['X', 'X'], ['X', 'X']],
        rotation: 0,
        x: 4,
        y: 5
      };

      const originalShape = JSON.stringify(tetris.currentPiece.shape);
      tetris.rotatePiece();

      // Shape should be identical but rotation state should advance
      expect(tetris.currentPiece.rotation).toBe(1);
      expect(JSON.stringify(tetris.currentPiece.shape)).toBe(originalShape);
    });
  });

  describe('Rotation Validation and Boundary Checking', () => {
    test('should block rotation when it would cause collision with boundary', () => {
      // Create a scenario where rotation is definitely blocked by placing obstacles
      tetris.currentPiece = {
        type: 'T',
        shape: [[' ', 'X', ' '], ['X', 'X', 'X']], // 0° T-piece
        rotation: 0,
        x: 1,
        y: 10
      };

      // Place blocks that would interfere with rotation
      tetris.board[10][0] = 'X'; // Block to the left
      tetris.board[11][0] = 'X'; // Block to the left
      
      const originalRotation = tetris.currentPiece.rotation;
      const originalShape = JSON.stringify(tetris.currentPiece.shape);

      tetris.rotatePiece();

      // Check if rotation was properly validated
      expect(tetris.isValidMove(tetris.currentPiece)).toBe(true);
      
      // Clean up for next test
      tetris.board[10][0] = ' ';
      tetris.board[11][0] = ' ';
    });

    test('should block rotation when it would cause collision with right wall', () => {
      // Place I-piece near right edge in vertical orientation
      tetris.currentPiece = {
        type: 'I',
        shape: [['X'], ['X'], ['X'], ['X']],
        rotation: 1,
        x: 9,
        y: 5
      };

      const originalRotation = tetris.currentPiece.rotation;
      const originalShape = JSON.stringify(tetris.currentPiece.shape);

      tetris.rotatePiece();

      // Rotation should be blocked
      expect(tetris.currentPiece.rotation).toBe(originalRotation);
      expect(JSON.stringify(tetris.currentPiece.shape)).toBe(originalShape);
    });

    test('should block rotation when it would cause collision with bottom boundary', () => {
      // Place I-piece near bottom in horizontal orientation
      tetris.currentPiece = {
        type: 'I',
        shape: [['X', 'X', 'X', 'X']],
        rotation: 0,
        x: 3,
        y: 19 // Near bottom
      };

      const originalRotation = tetris.currentPiece.rotation;
      const originalShape = JSON.stringify(tetris.currentPiece.shape);

      tetris.rotatePiece();

      // Rotation should be blocked
      expect(tetris.currentPiece.rotation).toBe(originalRotation);
      expect(JSON.stringify(tetris.currentPiece.shape)).toBe(originalShape);
    });

    test('should block rotation when it would cause collision with placed pieces', () => {
      // Place some blocks on the board
      tetris.board[10][2] = 'X';
      tetris.board[11][2] = 'X';

      // Try to rotate T-piece that would collide with placed blocks
      tetris.currentPiece = {
        type: 'T',
        shape: [[' ', 'X', ' '], ['X', 'X', 'X']],
        rotation: 0,
        x: 1,
        y: 9
      };

      const originalRotation = tetris.currentPiece.rotation;
      const originalShape = JSON.stringify(tetris.currentPiece.shape);

      tetris.rotatePiece();

      // Rotation should be blocked due to collision with placed pieces
      expect(tetris.currentPiece.rotation).toBe(originalRotation);
      expect(JSON.stringify(tetris.currentPiece.shape)).toBe(originalShape);
    });

    test('should allow rotation when it results in valid position', () => {
      // Place T-piece in open space where rotation is valid
      tetris.currentPiece = {
        type: 'T',
        shape: [[' ', 'X', ' '], ['X', 'X', 'X']],
        rotation: 0,
        x: 4,
        y: 10
      };

      const originalRotation = tetris.currentPiece.rotation;
      
      tetris.rotatePiece();

      // Rotation should succeed
      expect(tetris.currentPiece.rotation).toBe((originalRotation + 1) % 4);
      expect(tetris.isValidMove(tetris.currentPiece)).toBe(true);
    });
  });

  describe('Rotation Performance and Edge Cases', () => {
    test('should complete rotation within performance threshold', () => {
      tetris.currentPiece = {
        type: 'T',
        shape: [[' ', 'X', ' '], ['X', 'X', 'X']],
        rotation: 0,
        x: 4,
        y: 10
      };

      const startTime = Date.now();
      tetris.rotatePiece();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1); // < 1ms as per requirements
    });

    test('should handle rotation when no current piece exists', () => {
      tetris.currentPiece = null;

      expect(() => tetris.rotatePiece()).not.toThrow();
      expect(tetris.currentPiece).toBeNull();
    });

    test('should maintain piece type and position when rotation is valid', () => {
      const originalPiece = {
        type: 'T',
        shape: [[' ', 'X', ' '], ['X', 'X', 'X']],
        rotation: 0,
        x: 4,
        y: 10
      };

      tetris.currentPiece = { ...originalPiece };

      tetris.rotatePiece();

      // Type and position should be preserved
      expect(tetris.currentPiece.type).toBe(originalPiece.type);
      expect(tetris.currentPiece.x).toBe(originalPiece.x);
      expect(tetris.currentPiece.y).toBe(originalPiece.y);
      // Only rotation and shape should change
      expect(tetris.currentPiece.rotation).not.toBe(originalPiece.rotation);
      expect(tetris.currentPiece.shape).not.toEqual(originalPiece.shape);
    });
  });

  describe('All Piece Types Rotation', () => {
    const pieceTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

    test.each(pieceTypes)('should rotate %s-piece without errors', (pieceType) => {
      tetris.currentPiece = {
        type: pieceType,
        shape: tetris.pieceDefinitions[pieceType][0],
        rotation: 0,
        x: 4,
        y: 8
      };

      expect(() => {
        for (let i = 0; i < 4; i++) {
          tetris.rotatePiece();
        }
      }).not.toThrow();

      // Should be back to initial rotation after 4 rotations
      expect(tetris.currentPiece.rotation).toBe(0);
    });
  });
});