#!/usr/bin/env node

const Tetris = require('./tetris');
const chalk = require('chalk');

class TetrisGame {
  constructor() {
    this.tetris = new Tetris();
    this.isRunning = false;
    this.lastTime = Date.now();
    this.setupInput();
  }

  setupInput() {
    const readline = require('readline');
    
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    process.stdin.on('keypress', (str, key) => {
      if (key && key.ctrl && key.name === 'c') {
        this.quit();
        return;
      }

      if (key && key.name === 'q') {
        this.quit();
        return;
      }

      if (this.tetris.gameOver) {
        if (key.name === 'r') {
          this.restart();
        } else if (key.name === 'q') {
          this.quit();
        }
        return;
      }

      if (!this.isRunning && key && key.name !== 'p') {
        return;
      }

      if (key) {
        switch (key.name) {
        case 'left':
        case 'a':
          this.tetris.movePiece(-1, 0);
          break;
        case 'right':
        case 'd':
          this.tetris.movePiece(1, 0);
          break;
        case 'down':
        case 's':
          this.tetris.movePiece(0, 1, true); // Use soft drop with scoring
          break;
        case 'up':
        case 'w':
          if (key.shift) {
            this.tetris.rotatePiece(false); // Counterclockwise
          } else {
            this.tetris.rotatePiece(); // Clockwise (default)
          }
          break;
        case 'space':
          this.tetris.hardDrop();
          break;
        case 'p':
          this.togglePause();
          break;
        }
        this.render();
      }
    });
    
    process.stdin.resume();
    process.on('SIGINT', this.quit.bind(this));
  }

  togglePause() {
    this.isRunning = !this.isRunning;
  }

  restart() {
    this.tetris.reset();
    this.tetris.spawnPiece();
    this.isRunning = true;
    this.lastTime = Date.now();
  }

  quit() {
    console.clear();
    console.log('Thanks for playing Tetris!');
    process.exit(0);
  }

  render() {
    console.clear();
    
    console.log(chalk.cyan('='.repeat(22)));
    console.log(chalk.yellow.bold('       TETRIS'));
    console.log(chalk.cyan('='.repeat(22)));
    
    const display = this.tetris.getDisplay();
    
    for (let row of display) {
      console.log(chalk.cyan('|') + row.map(cell => 
        cell === ' ' ? chalk.gray('·') : chalk.red('█')
      ).join('') + chalk.cyan('|'));
    }
    
    console.log(chalk.cyan('=' + '='.repeat(20) + '='));
    console.log(chalk.green(`Score: ${this.tetris.score.toString().padStart(8, '0')}`));
    console.log(chalk.blue(`Level: ${this.tetris.level.toString().padStart(8, '0')}`));
    console.log(chalk.magenta(`Lines: ${this.tetris.lines.toString().padStart(8, '0')}`));
    console.log();
    
    if (this.tetris.gameOver) {
      console.log(chalk.red.bold('GAME OVER!'));
      console.log(chalk.yellow('Press R to restart or Q to quit'));
    } else if (!this.isRunning) {
      console.log(chalk.yellow.bold('PAUSED'));
      console.log(chalk.white('Press P to resume'));
    } else {
      console.log(chalk.white('Controls:'));
      console.log(chalk.white('← → ↓ ↑ / WASD : Move/Rotate'));
      console.log(chalk.white('Shift+↑ / Shift+W : Rotate CCW'));
      console.log(chalk.white('Space          : Hard Drop'));
      console.log(chalk.white('P              : Pause'));
      console.log(chalk.white('Q              : Quit'));
    }
  }

  gameLoop() {
    const now = Date.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    if (this.isRunning && !this.tetris.gameOver) {
      this.tetris.update(deltaTime);
    }

    this.render();

    if (!this.tetris.gameOver || this.isRunning) {
      setTimeout(() => this.gameLoop(), 33); // ~30fps (33ms per frame)
    } else {
      setTimeout(() => this.gameLoop(), 200); // 200ms idle intervals as per PRD
    }
  }

  start() {
    console.log('Starting Tetris...');
    console.log('Use arrow keys to play, Q to quit');
    
    this.isRunning = true;
    this.lastTime = Date.now();
    this.tetris.spawnPiece();
    
    setTimeout(() => this.gameLoop(), 100);
  }
}

if (require.main === module) {
  const game = new TetrisGame();
  game.start();
}

module.exports = TetrisGame;