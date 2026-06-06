import { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import AdminDashboard, { ResultEntry } from './AdminDashboard';
import { hasSupabase } from './supabaseClient';
import { saveAttempt, fetchAdminOverview, AdminOverview } from './supabaseApi';

const ADMIN_KEY = 'sumadmin';

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
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [answerDigits, setAnswerDigits] = useState(['', '', '']);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminAuthorized, setAdminAuthorized] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [isSupabaseEnabled] = useState(hasSupabase);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const adminExportRef = useRef<HTMLDivElement | null>(null);
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
    const newScore = correct ? score + 1 : score;

    setResults((prev) => [
      {
        puzzle: `${puzzle.aDigits.join('')} + ${puzzle.bDigits.join('')} = ${answerDigits.join('')}`,
        passed: correct
      },
      ...prev
    ]);

    if (correct) {
      setScore(newScore);
      setMessage('PASS');
      setMessageType('pass');
    } else {
      setMessage('FAIL');
      setMessageType('fail');
    }

    void saveAttempt({
      playerName: name.trim() || 'Guest',
      puzzle: `${puzzle.aDigits.join('')} + ${puzzle.bDigits.join('')} = ${answerDigits.join('')}`,
      passed: correct,
      score: newScore,
      createdAt: new Date().toISOString()
    });

    setTimeout(() => {
      setNewPuzzle();
    }, 300);
  };

  const handleAdminAuthorize = (key: string) => {
    if (key.trim() === ADMIN_KEY) {
      setAdminAuthorized(true);
      setAdminMessage('Admin access granted.');
      return;
    }

    setAdminAuthorized(false);
    setAdminMessage('Invalid admin key, try again.');
  };

  const handleAdminLogout = () => {
    setAdminAuthorized(false);
    setShowAdmin(false);
    setAdminMessage('Admin session closed.');
  };

  const handleAdminClose = () => setShowAdmin(false);

  const fetchAdminMetrics = async () => {
    if (!isSupabaseEnabled) {
      setAdminOverview(null);
      return;
    }

    setAdminLoading(true);
    const overview = await fetchAdminOverview();
    setAdminOverview(overview);
    setAdminLoading(false);
  };

  useEffect(() => {
    if (showAdmin && adminAuthorized) {
      void fetchAdminMetrics();
    }
  }, [showAdmin, adminAuthorized]);

  const passCount = results.filter((entry) => entry.passed).length;
  const userCount = name.trim() ? 1 : 0;

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

  const exportAdminImage = async () => {
    if (!adminExportRef.current) return;
    const canvas = await html2canvas(adminExportRef.current, {
      backgroundColor: '#f7f5ef',
      scale: 2
    });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `admin-report_${formatTime(new Date())}.png`;
    link.click();
  };

  const exportAdminPdf = async () => {
    if (!adminExportRef.current) return;
    const canvas = await html2canvas(adminExportRef.current, {
      backgroundColor: '#ffffff',
      scale: 2
    });
    const imageData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`admin-report_${formatTime(new Date())}.pdf`);
  };

  const adminButtonLabel = adminAuthorized && showAdmin ? 'Hide Admin' : 'Admin Console';

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
          <button className="small-button admin-button" onClick={() => setShowAdmin((open) => !open)}>
            {adminButtonLabel}
          </button>
        </div>
      </header>

      {showAdmin && (
        <AdminDashboard
          ref={adminExportRef}
          authorized={adminAuthorized}
          playerName={name}
          score={score}
          results={results}
          message={adminMessage}
          onAuthorize={handleAdminAuthorize}
          onLogout={handleAdminLogout}
          onClose={handleAdminClose}
          onExportImage={exportAdminImage}
          onExportPdf={exportAdminPdf}
          overview={adminOverview}
          loading={adminLoading}
          supabaseEnabled={isSupabaseEnabled}
        />
      )}

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
