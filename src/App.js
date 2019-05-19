import React, {Component} from 'react';
import './App.css';
import {isEqual} from 'lodash';

class App extends Component {
  constructor(...props) {
    super(...props);

    this.state = {
      field: this.getSmthFromStorage('field', [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
      currentScore: +this.getSmthFromStorage('currentScore', 0),
      bestScore: +this.getSmthFromStorage('bestScore', 0),
      isGameActive: this.getSmthFromStorage('isActive', false),
      isWin: this.getSmthFromStorage('isWin', 'false'),
      isLose: this.getSmthFromStorage('isLose', false),
    };

    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentWillMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentDidMount() {
    let {isGameActive} = this.state;

    if (!isGameActive) {
      this.spawnTiles(2);
      this.setState({isGameActive: true})
    }
  }

  spawnTiles(count) {
    let {field} = this.state;
    let freeCells = [];
    let finalCells = [];

    for (let row = 0; row<4; row++) {
      for (let col = 0; col<4; col++) {
        if (field[row][col] === 0) {
          freeCells.push([row, col])
        }
      }
    }

    for (let i = 0; i < count; i++) {
      let cellToSpawn = Math.floor(Math.random() * freeCells.length);

      finalCells.push(freeCells.splice(cellToSpawn, 1)[0]);
    }

    this.setState(prevState => {
      let newField = [...prevState.field];

      for (let cell of finalCells) {
        let [row, col] = cell;
        newField[row][col] = this.generateNewTileValue();
      }

      return {
        field: newField
      }
    }, () => {
      let {field} = this.state;

      if (this.isLose(field)) {
        localStorage.setItem('isLose', 'true');

        this.setState({
          isLose: true,
          isActive: false
        });
      }

      localStorage.setItem('field', JSON.stringify(field));
      localStorage.setItem('isActive', 'true');
    })

  }

  generateNewTileValue() {
    let number = Math.floor(Math.random() * 10) + 1;

    if (number === 1) {
      return 4;
    } else {
      return 2;
    }
  }

  handleKeyDown(event) {
    let availableKeys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
    let {key} = event;

    if (!availableKeys.includes(key)) {
      return;
    }

    // prevents scrolling by arrows when viewport is smaller than content
    event.preventDefault();

    this.handleMove(key);
  }

  handleMove(moveKey) {
    let {field} = this.state;
    let fieldAfterMove = [];

    if (moveKey === 'ArrowRight' || moveKey === 'ArrowLeft') {
      for (let row = 0; row<4; row++) {
        let shiftedRow = field[row].filter(col => col > 0);

        shiftedRow = this.collapseSameTiles(shiftedRow, moveKey);

        while (shiftedRow.length < 4) {
          if (moveKey === 'ArrowRight') {
            shiftedRow.unshift(0);
          } else if (moveKey === 'ArrowLeft') {
            shiftedRow.push(0);
          }
        }

        fieldAfterMove.push(shiftedRow);
      }
    } else if (moveKey === 'ArrowUp' || moveKey === 'ArrowDown') {
      let transcendedField = [[],[],[],[]];

      for (let row = 0; row<4; row++) {
        for (let col = 0; col<4; col++) {
          if (field[row][col] !== 0) {
            transcendedField[col].push(field[row][col]);
          }
        }
      }

      for (let row = 0; row<4; row++) {
        let shiftedRow = transcendedField[row].filter(col => col > 0);

        shiftedRow = this.collapseSameTiles(shiftedRow, moveKey);

        while (shiftedRow.length < 4) {
          if (moveKey === 'ArrowDown') {
            shiftedRow.unshift(0);
          } else if (moveKey === 'ArrowUp') {
            shiftedRow.push(0);
          }
        }

        transcendedField[row] = shiftedRow;
      }

      fieldAfterMove = [[],[],[],[]];

      for (let row = 0; row<4; row++) {
        for (let col = 0; col<4; col++) {
          fieldAfterMove[row].push(
            transcendedField[col][row]
          );
        }
      }
    }

    if (isEqual(field, fieldAfterMove)) {
      // no move has been done
      return;
    }

    this.setState({field: fieldAfterMove}, () => {
      this.spawnTiles(1);
    });

  }

  collapseSameTiles(row, direction) {
    let collapsableRow = [...row];

    if (direction === 'ArrowRight' || direction === 'ArrowDown') {
      for (let i = collapsableRow.length - 1; i > 0; i--) {
        if (collapsableRow[i] === collapsableRow[i-1]) {
          collapsableRow[i] += collapsableRow[i];
          collapsableRow[i-1] = 0;

          this.applyWithNewTileCollapsed(collapsableRow[i]);
        }

      }
    } else if (direction === 'ArrowLeft' || direction === 'ArrowUp') {
      for (let i = 0; i < collapsableRow.length - 1; i++) {
        if (collapsableRow[i] === collapsableRow[i+1]) {
          collapsableRow[i] += collapsableRow[i];
          collapsableRow[i+1] = 0;

          this.applyWithNewTileCollapsed(collapsableRow[i]);
        }
      }
    }

    collapsableRow = collapsableRow.filter(col => col > 0);

    return collapsableRow;
  }

  applyWithNewTileCollapsed(collapsedTile) {
    this.setState((prevState) => {
      let isWinStatus;
      let nextScore = prevState.currentScore + collapsedTile;
      localStorage.setItem('currentScore', nextScore);

      if (nextScore > prevState.bestScore) {
        localStorage.setItem('bestScore', nextScore);
      }

      if (prevState.isWin === 'false' && collapsedTile === 2048) {
        document.removeEventListener('keydown', this.handleKeyDown);
        isWinStatus = 'true';
      } else if (prevState.isWin === 'keep') {
        isWinStatus = 'keep';
      } else {
        isWinStatus = prevState.isWin;
      }

      localStorage.setItem('isWin', JSON.stringify(isWinStatus));

      return {
        currentScore: nextScore,
        bestScore: nextScore > prevState.bestScore ? nextScore : prevState.bestScore,
        isWin: isWinStatus
      }
    });
  }

  isLose(pendingField) {
    for (let row=0; row<4; row++) {
      for (let col=0; col<4; col++) {
        if (pendingField[row][col] === 0) {
          return false
        }

        if (pendingField[row][col] === pendingField[row][col+1]) {
          return false;
        }

        if (row === 3) {
          continue
        }

        if (pendingField[row][col] === pendingField[row+1][col]) {
          return false;
        }
      }
    }

    return true;
  }

  newGameHandler() {
    let { isWin } = this.state;

    localStorage.setItem('currentScore', '0');
    localStorage.setItem('isWin', '"false"');
    localStorage.setItem('isLose', 'false');

    if (isWin === 'true') {
      document.addEventListener('keydown', this.handleKeyDown);
    }

    this.setState({
      field: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      currentScore: 0,
      isWin: 'false',
      isLose: false,
    }, () => {
      this.spawnTiles(2);
    });
  }

  keepGoingHandler() {
    document.addEventListener('keydown', this.handleKeyDown);
    localStorage.setItem('isWin', '"keep"');

    this.setState({
      isWin: 'keep'
    })
  }

  getSmthFromStorage(byField, elseValue) {
    let fromStorage = localStorage.getItem(byField);

    if (fromStorage) {
      fromStorage = JSON.parse(fromStorage);
    } else {
      fromStorage = elseValue;
    }

    return fromStorage;
  }

  render() {
    let {field, currentScore, bestScore, isLose, isWin} = this.state;

    return (
      <div className="App">
        <div className="App-nav">
          <div className="App-nav-status-bar">
            <span className="App-nav-status-bar-2048-label">
              2048
            </span>
            <div className="App-nav-status-bar-score-table">
              <div className="App-nav-status-bar-score-table-cur">
                <p>SCORE</p>
                <span>{currentScore}</span>
              </div>
              <div className="App-nav-status-bar-score-table-best">
                <p>BEST</p>
                <span>{bestScore}</span>
              </div>
            </div>
          </div>
          <p className="App-nav-restart-bar">
            <span className="App-nav-restart-bar-join-label">
              Join the numbers and get to the <b>2048 tile!</b>
            </span>
            <button
              className="App-nav-restart-bar-join-btn"
              onClick={() => this.newGameHandler()}
            >
              New Game
            </button>
          </p>
        </div>
        <div className="App-field">
          {isLose && (
            <div className="App-field-lose-modal">
              <div className="App-field-lose-modal-message">
                <p>Game over!</p>
                <button
                  onClick={() => this.newGameHandler()}
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {(isWin === 'true') && (
            <div className="App-field-win-modal">
              <div className="App-field-win-modal-message">
                <p>You win!</p>
                <button
                  onClick={() => this.keepGoingHandler()}
                >
                  Keep going
                </button>
                <button
                  onClick={() => this.newGameHandler()}
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {
            field.map((row, i) => {
              return (<div key={`row ${i}`} className="App-field-row">

                {
                  row.map((cell, j) => {
                    return (
                      <div key={`cell ${i}_${j}`} className="App-field-cell">

                        {
                          (cell > 0) &&
                          <div
                            className="App-field-cell-tile"
                            data-tile-value={cell}
                          >
                            {cell}
                          </div>
                        }

                      </div>
                    )
                  })
                }

              </div>)
            })
          }

        </div>
      </div>
    )
  }
}

export default App;
