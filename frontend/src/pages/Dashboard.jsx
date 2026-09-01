import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Dashboard() {
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    api.health().then(() => setApiStatus('ok')).catch(() => setApiStatus('down'));
  }, []);

  return (
    <div className="grid g4">
      <div className="card">
        <div className="lbl">Backend API</div>
        <div className="big">{apiStatus === 'checking' ? '…' : apiStatus === 'ok' ? 'Connected' : 'Unreachable'}</div>
        <div className="sub">GET /api/health</div>
      </div>
    </div>
  );
}
