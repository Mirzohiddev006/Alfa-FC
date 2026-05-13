// @ts-nocheck
import React from 'react';
import { Icon } from './icons';
import { MOCK } from './data';
import { Sidebar, Topbar } from './shell';
import { LoginScreen, Dashboard } from './screens-1';
import { StudentsList, StudentProfile, StudentNew } from './screens-2';
import { GroupsScreen, SessionsScreen, AttendanceMark, PerformanceTable } from './screens-3';
import { ContractsScreen, ContractView, GateScreen, UsersScreen, SettingsScreen, TransactionsScreen, ReportsScreen, WaitingListScreen } from './screens-4';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakColor } from './tweaks-panel';
import { apiGetMe, apiLogout, getToken, setUnauthorizedHandler } from './api';

const __TWEAK_DEFAULTS = {
  theme: 'light',
  density: 'default',
  accent: 'red',
  role: 'Super Admin',
};

export default function App() {
  const [t, setTweak] = useTweaks(__TWEAK_DEFAULTS);
  const T = { ...t, setTweak };
  const [loggedIn, setLoggedIn] = React.useState(() => !!getToken());
  const [currentUser, setCurrentUser] = React.useState(null);
  const [permissions, setPermissions] = React.useState([]);
  const [authLoading, setAuthLoading] = React.useState(() => !!getToken());
  const [route, setRoute] = React.useState(() => localStorage.getItem('alpha_route') || 'dashboard');
  const [studentId, setStudentId] = React.useState(null);
  const [sessionId, setSessionId] = React.useState(null);
  const [groupId, setGroupId] = React.useState(null);
  const [contractId, setContractId] = React.useState(null);
  const [navCollapsed, setNavCollapsed] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  React.useEffect(() => {
    setUnauthorizedHandler(() => {
      setLoggedIn(false);
      setCurrentUser(null);
      setPermissions([]);
    });
  }, []);

  React.useEffect(() => {
    if (!loggedIn) { setAuthLoading(false); return; }
    apiGetMe().then(res => {
      if (res) {
        setCurrentUser(res.user);
        setPermissions(res.permissions || []);
        const roleName = res.user?.roles?.[0]?.name || 'Super Admin';
        setTweak('role', roleName);
      } else {
        setLoggedIn(false);
      }
    }).catch(() => setLoggedIn(false))
      .finally(() => setAuthLoading(false));
  }, [loggedIn]);

  React.useEffect(() => { localStorage.setItem('alpha_route', route); }, [route]);
  React.useEffect(() => { document.documentElement.setAttribute('data-theme', T.theme); }, [T.theme]);
  React.useEffect(() => { document.documentElement.setAttribute('data-density', T.density); }, [T.density]);

  React.useEffect(() => {
    if (!T.accent) return;
    const root = document.documentElement;
    const map = {
      red: '#C8202C', navy: '#0F1F4D', gold: '#F5B921', emerald: '#0E7C5E',
    };
    if (map[T.accent]) root.style.setProperty('--accent', map[T.accent]);
  }, [T.accent]);

  function navigate(r) {
    setRoute(r);
    setStudentId(null);
    setSessionId(null);
    setGroupId(null);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  function handleSignOut() {
    apiLogout();
    setLoggedIn(false);
    setCurrentUser(null);
    setPermissions([]);
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ fontSize: 15, color: 'var(--muted)' }}>Yuklanmoqda...</div>
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)}/>;
  }

  let crumbs = ['Alpha CIMS'];
  let activeNav = route;
  if (route === 'dashboard') crumbs.push('Bosh sahifa');
  if (route === 'students') crumbs.push("O'quvchilar");
  if (route === 'students-profile') { crumbs.push("O'quvchilar"); crumbs.push("Profil"); activeNav = 'students'; }
  if (route === 'students-new') { crumbs.push("O'quvchilar"); crumbs.push('Yangi'); activeNav = 'students'; }
  if (route === 'groups') crumbs.push('Guruhlar');
  if (route === 'sessions') crumbs.push('Trening sessiyalari');
  if (route === 'attendance') crumbs.push('Davomat belgilash');
  if (route === 'attendance-mark') { crumbs.push('Sessiyalar'); crumbs.push('Davomat'); activeNav = 'sessions'; }
  if (route === 'performance') crumbs.push('Natijaviy jadval');
  if (route === 'contracts') crumbs.push('Shartnomalar');
  if (route === 'contracts-view') { crumbs.push('Shartnomalar'); crumbs.push('Ko\'rish'); activeNav = 'contracts'; }
  if (route === 'transactions') crumbs.push('Tranzaksiyalar');
  if (route === 'gate') crumbs.push('Darvoza loglari');
  if (route === 'users') crumbs.push('Foydalanuvchilar');
  if (route === 'roles') crumbs.push('Rollar va ruxsatlar');
  if (route === 'settings') crumbs.push('Sozlamalar');
  if (route === 'reports') crumbs.push('Hisobotlar');
  if (route === 'waiting-list') crumbs.push("Kutish ro'yxati");

  return (
    <div className="app" data-nav={navCollapsed ? 'collapsed' : 'expanded'}>
      <Sidebar
        active={activeNav}
        onNav={(id) => {
          navigate(id);
        }}
        role={T.role}
        collapsed={navCollapsed}
        onToggle={() => setNavCollapsed(!navCollapsed)}
        user={currentUser || MOCK.users[0]}
      />
      <div className="main">
        <Topbar
          crumbs={crumbs}
          role={T.role}
          onRoleSwitch={(r) => { T.setTweak('role', r); showToast(`Rol o'zgartirildi: ${r}`); }}
          theme={T.theme}
          onTheme={(th) => T.setTweak('theme', th)}
          onSignOut={handleSignOut}
        />
        <div className="content">
          {route === 'dashboard' && <Dashboard role={T.role} onNav={navigate}/>} 
          {route === 'students' && <StudentsList onOpen={(id) => { setStudentId(id); setRoute('students-profile'); }} onNew={() => setRoute('students-new')}/>} 
          {route === 'students-profile' && <StudentProfile studentId={studentId} onBack={() => navigate('students')}/>} 
          {route === 'students-new' && <StudentNew onBack={() => navigate('students')} onCreated={() => { showToast("O'quvchi muvaffaqiyatli yaratildi"); navigate('students'); }}/>} 
          {route === 'groups' && <GroupsScreen onOpen={(id) => { setGroupId(id); }}/>} 
          {route === 'sessions' && <SessionsScreen onMark={(id) => { setSessionId(id); setRoute('attendance-mark'); }}/>} 
          {route === 'attendance-mark' && <AttendanceMark sessionId={sessionId} onBack={() => navigate('sessions')}/>} 
          {route === 'performance' && <PerformanceTable/>} 
          {route === 'contracts' && <ContractsScreen onOpenContract={(id) => { setContractId(id); setRoute('contracts-view'); }}/>} 
          {route === 'contracts-view' && <ContractView contractId={contractId} onBack={() => navigate('contracts')}/>} 
          {route === 'transactions' && <TransactionsScreen onToast={showToast}/>} 
          {route === 'gate' && <GateScreen/>} 
          {(route === 'users' || route === 'roles') && (
            <UsersScreen
              initialView={route === 'roles' ? 'roles' : 'users'}
              onToast={showToast}
            />
          )}
          {route === 'settings' && <SettingsScreen theme={T.theme} setTheme={(th) => T.setTweak('theme', th)}/>} 
          {route === 'reports' && <ReportsScreen/>} 
          {route === 'waiting-list' && <WaitingListScreen onToast={showToast}/>} 
        </div>
      </div>

      {toast && (
        <div className="toast">
          <Icon.Check size={16} color="var(--success)"/> {toast}
        </div>
      )}

      <AlphaTweaks T={T}/>
    </div>
  );
}

function AlphaTweaks({ T }) {
  return (
    <TweaksPanel title="Tweaks · Alpha CIMS">
      <TweakSection label="Tema">
        <TweakRadio label="Rejim" value={T.theme} options={[{ label: 'Yorugʼ', value: 'light' }, { label: "Qorong'i", value: 'dark' }]} onChange={v => T.setTweak('theme', v)}/>
        <TweakRadio label="Zichlik" value={T.density} options={[{ label: 'Compact', value: 'compact' }, { label: 'Default', value: 'default' }, { label: 'Roomy', value: 'comfortable' }]} onChange={v => T.setTweak('density', v)}/>
      </TweakSection>
      <TweakSection label="Rang">
        <TweakColor label="Aksent" value={T.accent} options={['red', 'navy', 'gold', 'emerald']} onChange={v => T.setTweak('accent', v)}/>
      </TweakSection>
      <TweakSection label="Foydalanuvchi roli">
        <TweakSelect label="Rol" value={T.role}
          options={[
            { label: 'Super Admin (barchasi)', value: 'Super Admin' },
            { label: "Admin (o'quvchilar, guruh)", value: 'Admin' },
            { label: "Director (faqat ko'rish)", value: 'Director' },
            { label: 'Head Coach (sessiya, davomat)', value: 'Head Coach' },
            { label: "Coach (o'z guruhi)", value: 'Coach' },
            { label: 'Accountant (moliya)', value: 'Accountant' },
          ]}
          onChange={v => T.setTweak('role', v)}/>
      </TweakSection>
    </TweaksPanel>
  );
}
