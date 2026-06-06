import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';

const formatTime = (date: Date) => {
  const iso = date.toISOString().replace(/[:.]/g, '-');
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const pad = (value: number) => String(Math.abs(value)).padStart(2, '0');
  const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = pad(Math.abs(offset) % 60);
  return `${iso}${sign}${offsetHours}${offsetMinutes}`;
};

const randomDigit = (max = 9) => Math.floor(Math.random() * (max + 1));

const createPuzzle = () => {
  const length = 3;
  const aDigits: number[] = [];
  const bDigits: number[] = [];

  for (let index = 0; index < length; index += 1) {
    const a = randomDigit(9);
    const b = randomDigit(9 - a);
    aDigits.push(a);
    bDigits.push(b);
  }

  return {
    aDigits,
    bDigits,
    resultDigits: aDigits.map((value, index) => value + bDigits[index])
  };
};

const createFileName = (name: string) => {
  const sanitized = name.trim().replace(/\s+/g, '') || 'result';
  return `${sanitized}_${formatTime(new Date())}.pdf`;
};

const toDisplayDigits = (digits: number[]) => digits.map((value) => value.toString());

function App() {
  const [name, setName] = useState('');
  const [score, setScore] = useState(0);
  const [puzzleId, setPuzzleId] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'pass' | 'fail' | ''>('');
  const [results, setResults] = useState<Array<{ puzzle: string; passed: boolean }>>([]);
  const [answerDigits, setAnswerDigits] = useState(['', '', '']);
  const puzzle = useMemo(createPuzzle, [puzzleId]);
  const resultDigits = useMemo(() => puzzle.resultDigits.map((d) => d.toString()), [puzzle]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [message]);

  const resetAnswers = () => setAnswerDigits(['', '', '']);

  const setNewPuzzle = () => {
    setPuzzleId((id) => id + 1);
    resetAnswers();
  };

  const handleNewGame = () => {
    setScore(0);
    setResults([]);
    setNewPuzzle();
  };

  const handleAnswerChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    setAnswerDigits((current) => current.map((item, idx) => (idx === index ? value : item)));
  };

  const handleSubmit = () => {
    const isComplete = answerDigits.every((digit) => digit.length === 1);
    if (!isComplete) {
      setMessage('Please fill all digits.');
      setMessageType('fail');
      return;
    }

    const correct = answerDigits.every((digit, index) => digit === resultDigits[index]);
    setResults((prev) => [
      {
        puzzle: `${puzzle.aDigits.join('')} + ${puzzle.bDigits.join('')} = ${answerDigits.join('')}`,
        passed: correct
      },
      ...prev
    ]);

    if (correct) {
      setScore((value) => value + 1);
      setMessage('PASS');
      setMessageType('pass');
    } else {
      setMessage('FAIL');
      setMessageType('fail');
    }

    setTimeout(() => {
      setNewPuzzle();
    }, 300);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFontSize(20);
    doc.text('Math Player Test Results', 40, 60);

    doc.setFontSize(14);
    doc.text(`Name: ${name || 'Anonymous'}`, 40, 100);
    doc.text(`Score: ${score}`, 40, 122);
    doc.text(`Completed puzzles: ${results.length}`, 40, 144);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 166);

    doc.setFontSize(12);
    let y = 200;
    results.slice(0, 20).forEach((entry, index) => {
      doc.text(`${index + 1}. ${entry.puzzle} — ${entry.passed ? 'PASS' : 'FAIL'}`, 40, y);
      y += 18;
      if (y > 760) {
        doc.addPage();
        y = 60;
      }
    });

    doc.save(createFileName(name));
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <button className="new-game-button" onClick={handleNewGame}>
          New Game
        </button>
        <div className="name-row">
          <label htmlFor="player-name">Name</label>
          <input
            id="player-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter name"
          />
        </div>
        <div className="top-actions">
          <button className="small-button" onClick={setNewPuzzle}>New Puzzle</button>
          <button className="small-button" onClick={exportPdf} title="Download results PDF">
            Share
          </button>
        </div>
      </header>

      <main className="main-card">
        <div className="puzzle-state">
          <div className="number-row first-row">
            {toDisplayDigits(puzzle.aDigits).map((digit, index) => (
              <div key={`a-${index}`} className="digit-cell">
                {digit}
              </div>
            ))}
          </div>
          <div className="number-row second-row">
            {toDisplayDigits(puzzle.bDigits).map((digit, index) => (
              <div key={`b-${index}`} className="digit-cell">
                {digit}
              </div>
            ))}
            <div className="plus-sign">+</div>
          </div>
          <div className="separator" />
          <div className="answer-row">
            {answerDigits.map((digit, index) => (
              <input
                key={`answer-${index}`}
                className="digit-input"
                value={digit}
                onChange={(event) => handleAnswerChange(index, event.target.value)}
                maxLength={1}
                inputMode="numeric"
              />
            ))}
          </div>
        </div>

        <div className="action-panel">
          <button className="check-button" onClick={handleSubmit}>Check</button>
          {message && <div className={`feedback ${messageType}`}>{message}</div>}
        </div>
      </main>

      <footer className="status-bar">
        <div className="score-card">
          <span>Score</span>
          <strong>{score}</strong>
        </div>
        <div className="result-count">
          <span>Puzzles</span>
          <strong>{results.length}</strong>
        </div>
      </footer>
    </div>
  );
}

export default App;
