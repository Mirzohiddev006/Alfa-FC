// @ts-nocheck
import React from 'react';
import { Icon } from './icons';

export function Sidebar({ active, onNav, role, collapsed, onToggle, user }) {
  return (
    <aside className="sidebar">
      <div className="brand">Alpha CIMS</div>
      <nav>
        <button className={active==='dashboard' ? 'active' : ''} onClick={() => onNav('dashboard')}>Dashboard</button>
        <button className={active==='students' ? 'active' : ''} onClick={() => onNav('students')}>Students</button>
        <button className={active==='groups' ? 'active' : ''} onClick={() => onNav('groups')}>Groups</button>
        <button className={active==='sessions' ? 'active' : ''} onClick={() => onNav('sessions')}>Sessions</button>
        <button className={active==='performance' ? 'active' : ''} onClick={() => onNav('performance')}>Performance</button>
      </nav>
      <div className="bottom">
        <div className="user">{user?.full_name}</div>
        <button onClick={onToggle}>{collapsed ? '>' : '<'}</button>
      </div>
    </aside>
  );
}

export function Topbar({ crumbs, role, user, onRoleSwitch, theme, onTheme, onSignOut }){
  return (
    <header className="topbar">
      <div className="crumbs">{crumbs.join(' / ')}</div>
      <div className="actions">
        <select value={role} onChange={e=>onRoleSwitch?.(e.target.value)}>
          <option>Super Admin</option>
          <option>Admin</option>
        </select>
        <button onClick={onSignOut}>Chiqish</button>
      </div>
    </header>
  );
}
