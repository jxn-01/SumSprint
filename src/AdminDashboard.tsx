import { forwardRef, useMemo, useState } from 'react';
import type { AdminOverview } from './supabaseApi';

export type ResultEntry = {
  puzzle: string;
  passed: boolean;
};

interface AdminDashboardProps {
  authorized: boolean;
  playerName: string;
  score: number;
  results: ResultEntry[];
  message: string;
  onAuthorize: (key: string) => void;
  onLogout: () => void;
  onClose: () => void;
  onExportImage: () => Promise<void>;
  onExportPdf: () => Promise<void>;
  overview?: AdminOverview | null;
  loading?: boolean;
  supabaseEnabled: boolean;
}

const AdminDashboard = forwardRef<HTMLDivElement, AdminDashboardProps>(
  (
    {
      authorized,
      playerName,
      score,
      results,
      message,
      onAuthorize,
      onLogout,
      onClose,
      onExportImage,
      onExportPdf,
      overview,
      loading,
      supabaseEnabled
    },
    ref
  ) => {
    const [adminKey, setAdminKey] = useState('');
    const passed = useMemo(() => results.filter((entry) => entry.passed).length, [results]);
    const failed = results.length - passed;
    const accuracy = results.length ? Math.round((passed / results.length) * 100) : 0;
    const activeUsers = playerName.trim() ? 1 : 0;
    const userCount = activeUsers || 1;
    const recentResults = results.slice(0, 6);

    const handleUnlock = () => {
      onAuthorize(adminKey);
      setAdminKey('');
    };

    return (
      <section className="admin-screen">
        <div className="admin-card" ref={ref}>
          <div className="admin-header">
            <div>
              <span className="badge">Admin</span>
              <h2>Admin console</h2>
              <p>Realtime score metrics, usage KPIs, and downloadable reports.</p>
            </div>
            <div className="admin-top-actions">
              <button className="small-button" onClick={onClose}>Close</button>
              {authorized && (
                <button className="small-button logout-button" onClick={onLogout}>
                  Logout
                </button>
              )}
            </div>
          </div>

          {!authorized ? (
            <div className="admin-login-panel">
              <div className="admin-login-row">
                <label htmlFor="admin-key">Enter admin key</label>
                <input
                  id="admin-key"
                  type="password"
                  value={adminKey}
                  onChange={(event) => setAdminKey(event.target.value)}
                  placeholder="Secret key"
                />
              </div>
              <button className="check-button" onClick={handleUnlock}>
                Unlock Dashboard
              </button>
              <p className="admin-note">
                Use the secret key <strong>sumadmin</strong> to view the console.
              </p>
              {message && <p className="admin-status-message">{message}</p>}
            </div>
          ) : (
            <>
              {message && <p className="admin-status-message success">{message}</p>}
              <div className="admin-metrics-grid">
                <div className="admin-metric-card">
                  <span>Active Users</span>
                  <strong>{userCount}</strong>
                </div>
                <div className="admin-metric-card">
                  <span>Total Score</span>
                  <strong>{score}</strong>
                </div>
                <div className="admin-metric-card">
                  <span>Passed</span>
                  <strong>{passed}</strong>
                </div>
                <div className="admin-metric-card">
                  <span>Accuracy</span>
                  <strong>{accuracy}%</strong>
                </div>
              </div>

              <div className="admin-dashboard-grid">
                <div className="admin-panel-block">
                  <h3>Application usage</h3>
                  <div className="chart-row">
                    <div className="chart-label">Total attempts</div>
                    <div className="chart-bar">
                      <div className="chart-bar-fill" style={{ width: `${Math.min(100, results.length * 12)}%`, background: '#4d5df6' }} />
                    </div>
                    <div className="chart-detail">{results.length}</div>
                  </div>
                  <div className="chart-row">
                    <div className="chart-label">Passed attempts</div>
                    <div className="chart-bar">
                      <div className="chart-bar-fill" style={{ width: `${Math.min(100, passed * 12)}%`, background: '#43aa8b' }} />
                    </div>
                    <div className="chart-detail">{passed}</div>
                  </div>
                  <div className="chart-row">
                    <div className="chart-label">Failed attempts</div>
                    <div className="chart-bar">
                      <div className="chart-bar-fill" style={{ width: `${Math.min(100, failed * 12)}%`, background: '#dd4545' }} />
                    </div>
                    <div className="chart-detail">{failed}</div>
                  </div>
                </div>

                <div className="admin-panel-block admin-table-block">
                  <h3>Recent performance</h3>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Attempt</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentResults.length === 0 ? (
                        <tr>
                          <td colSpan={2}>No attempts yet</td>
                        </tr>
                      ) : (
                        recentResults.map((entry, index) => (
                          <tr key={`${entry.puzzle}-${index}`}>
                            <td>{entry.puzzle}</td>
                            <td className={entry.passed ? 'status-pass' : 'status-fail'}>
                              {entry.passed ? 'PASS' : 'FAIL'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {supabaseEnabled ? (
                loading ? (
                  <p className="admin-note">Loading monthly stats...</p>
                ) : overview && overview.monthlyStats.length > 0 ? (
                  <div className="admin-panel-block">
                    <h3>Monthly analytics</h3>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Attempts</th>
                          <th>Passed</th>
                          <th>Failed</th>
                          <th>Avg Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.monthlyStats.map((item) => (
                          <tr key={item.month}>
                            <td>{item.month}</td>
                            <td>{item.attempts}</td>
                            <td>{item.passed}</td>
                            <td>{item.failed}</td>
                            <td>{item.avgScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="admin-note">No monthly data available yet. Play the game and refresh the dashboard.</p>
                )
              ) : (
                <p className="admin-note">Supabase is not configured. Add your Supabase URL and anon key in .env.</p>
              )}

              <div className="admin-actions-row">
                <button className="small-button" onClick={onExportImage}>
                  Download Image
                </button>
                <button className="small-button share-button" onClick={onExportPdf}>
                  Download PDF
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }
);

AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;
