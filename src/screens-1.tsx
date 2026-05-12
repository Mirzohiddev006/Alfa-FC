// @ts-nocheck
import React from 'react';
import { Icon } from './icons';
import { AlphaShield } from './logo';
import { apiLogin, apiGetDashboard, apiGetGroups, apiGetSessions } from './api';

export function LoginScreen({ onLogin }) {
  const I = Icon;
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      await apiLogin(phone, password);
      onLogin?.();
    } catch (e) {
      alert('Login failed: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <AlphaShield />
        <div className="field"><label>Telefon yoki email</label><input value={phone} onChange={e => setPhone(e.target.value)} /></div>
        <div className="field"><label>Parol</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn primary" onClick={handleLogin} disabled={loading}><I.Key size={14}/> Kirish</button>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  return <div>Dashboard</div>;
}
