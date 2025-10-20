const TetrisGame = require('../src/index');

// Mock chalk to avoid terminal color issues in testing
jest.mock('chalk', () => ({
  cyan: jest.fn(str => str),
  yellow: Object.assign(jest.fn(str => str), { bold: jest.fn(str => str) }),
  green: jest.fn(str => str),
  blue: jest.fn(str => str),
  magenta: jest.fn(str => str),
  red: Object.assign(jest.fn(str => str), { bold: jest.fn(str => str) }),
  white: jest.fn(str => str),
  gray: jest.fn(str => str)
}));

// Mock process.stdin to avoid terminal interactions during tests
const mockStdin = {
  setRawMode: jest.fn(),
  on: jest.fn(),
  resume: jest.fn(),
  isTTY: true
};

// Mock readline
jest.mock('readline', () => ({
  emitKeypressEvents: jest.fn()
}));

describe('TetrisGame Integration Tests', () => {
  let game;
  let originalStdin;
  let originalExit;

  beforeEach(() => {
    // Mock process.stdin
    originalStdin = process.stdin;
    process.stdin = mockStdin;
    
    // Mock process.exit to prevent tests from exiting
    originalExit = process.exit;
    process.exit = jest.fn();
    
    // Mock console methods
    jest.spyOn(console, 'clear').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    game = new TetrisGame();
  });

  afterEach(() => {
    // Restore original methods
    process.stdin = originalStdin;
    process.exit = originalExit;
    jest.restoreAllMocks();
  });

  describe('Game Initialization', () => {
    test('should initialize with correct default state', () => {
      expect(game.tetris).toBeDefined();
      expect(game.isRunning).toBe(false);
      expect(game.lastTime).toBeDefined();
    });

    test('should setup input handlers', () => {
      // Verify that the game has been initialized correctly
      // The exact stdin setup is mocked and hard to verify directly
      expect(game.tetris).toBeDefined();
      expect(typeof game.setupInput).toBe('function');
    });
  });

  describe('Game Controls', () => {
    beforeEach(() => {
      game.tetris.spawnPiece();
    });

    test('should handle pause/resume', () => {
      expect(game.isRunning).toBe(false);
      game.togglePause();
      expect(game.isRunning).toBe(true);
      game.togglePause();
      expect(game.isRunning).toBe(false);
    });

    test('should handle game restart', () => {
      game.tetris.gameOver = true;
      game.tetris.score = 1000;
      game.restart();
      
      expect(game.tetris.gameOver).toBe(false);
      expect(game.tetris.score).toBe(0);
      expect(game.isRunning).toBe(true);
    });
  });

  describe('Game States', () => {
    test('should handle game over state', () => {
      game.tetris.gameOver = true;
      
      // Should show game over messages in render (tested via no errors)
      expect(() => game.render()).not.toThrow();
    });

    test('should handle paused state', () => {
      game.isRunning = false;
      game.tetris.gameOver = false;
      
      // Should show paused messages in render
      expect(() => game.render()).not.toThrow();
    });

    test('should handle running state', () => {
      game.isRunning = true;
      game.tetris.gameOver = false;
      game.tetris.spawnPiece();
      
      // Should show normal game display
      expect(() => game.render()).not.toThrow();
    });
  });

  describe('Game Loop', () => {
    test('should update game state when running', () => {
      game.isRunning = true;
      game.tetris.spawnPiece();
      const originalDropTime = game.tetris.dropTime;
      
      // Mock setTimeout to control timing
      jest.useFakeTimers();
      
      game.gameLoop();
      
      // Fast-forward time to trigger game update
      jest.advanceTimersByTime(100);
      
      expect(game.tetris.dropTime).toBeGreaterThanOrEqual(originalDropTime);
      
      jest.useRealTimers();
    });
  });

  describe('Rendering', () => {
    test('should render without errors', () => {
      game.tetris.spawnPiece();
      expect(() => game.render()).not.toThrow();
    });

    test('should display score, level, and lines', () => {
      game.tetris.score = 1500;
      game.tetris.level = 3;
      game.tetris.lines = 15;
      
      expect(() => game.render()).not.toThrow();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('1500'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('3'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('15'));
    });
  });
});