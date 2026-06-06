import { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';

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
  return `${sanitized}_${formatTime(new Date())}.png`;
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
  const exportRef = useRef<HTMLDivElement | null>(null);
  const answerRefs = useRef<Array<HTMLInputElement | null>>([]);
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
    if (value.length === 1 && index > 0) {
      window.setTimeout(() => answerRefs.current[index - 1]?.focus(), 0);
    }
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

  const passCount = results.filter((entry) => entry.passed).length;
  const exportImage = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, {
      backgroundColor: '#f5edea',
      scale: 2
    });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = createFileName(name);
    link.click();
  };

  return (
    <div className="app-shell">
      <div className="export-card" ref={exportRef}>
        <div className="export-badge">SumSprint</div>
        <h1>{name || 'Player'}</h1>
        <div className="export-metrics">
          <div className="metric-block">
            <span>Score</span>
            <strong>{score}</strong>
          </div>
          <div className="metric-block">
            <span>Passed</span>
            <strong>{passCount}/{results.length}</strong>
          </div>
        </div>
      </div>
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
          <button className="small-button share-button" onClick={exportImage} title="Share score">
            <span className="share-icon">📤</span>
            Share Score
          </button>
        </div>
      </header>

      <main className="main-card">
        <div className="score-summary">
          <div className="summary-block score-block">
            <span>Score</span>
            <strong>{score}</strong>
          </div>
          <div className="summary-block pass-block">
            <span>Passed</span>
            <strong>{passCount}/{results.length}</strong>
          </div>
          <div className="summary-block total-block">
            <span>Puzzles</span>
            <strong>{results.length}</strong>
          </div>
        </div>
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
                ref={(el) => (answerRefs.current[index] = el)}
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
        <div className="status-card score-card">
          <span>Score</span>
          <strong>{score}</strong>
        </div>
        <div className="status-card pass-card">
          <span>Passed</span>
          <strong>{passCount}/{results.length}</strong>
        </div>
        <div className="status-card total-card">
          <span>Total</span>
          <strong>{results.length}</strong>
        </div>
      </footer>
    </div>
  );
}

export default App;
