// @ts-nocheck
import React from 'react';
import { Icon } from './icons';
import { MOCK } from './data';
import {
  apiGetGroups, apiGetGroupStudents, apiCreateGroup, apiUpdateGroup,
  apiGetSessions, apiGetSessionDetails, apiCreateSession,
  apiGetCoaches, apiGetGroupStudentsExportUrl, apiGetCoachGroupPerformanceTableExportUrl,
  apiMarkAttendance,
} from './api';

const AVATAR_COLORS = ['#0F1F4D', '#C8202C', '#0E7C5E', '#7B2FBE', '#D97706', '#0284C7'];
function avatarColor(id) { return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length]; }

function sessionStatus(session_date) {
  const today = new Date().toISOString().slice(0, 10);
  if (session_date === today) return 'today';
  if (session_date > today) return 'upcoming';
  return 'completed';
}

export function GroupsScreen({ onOpen }) {
  const I = Icon;
  const [groups, setGroups] = React.useState([]);
  const [coaches, setCoaches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState('cards');
  const [showNew, setShowNew] = React.useState(false);
  const [newGroup, setNewGroup] = React.useState({ name: '', description: '', coach_id: '' });
  const [saving, setSaving] = React.useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [gRes, cRes] = await Promise.all([
        apiGetGroups({ page_size: 100 }),
        apiGetCoaches(),
      ]);
      setGroups(gRes?.data || []);
      setCoaches(cRes?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { loadData(); }, []);

  async function handleExport() {
    try {
      const groupId = groups[0]?.id;
      if (!groupId) return;
      const url = await apiGetGroupStudentsExportUrl(groupId);
      if (!url) return;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      alert('Export ochilmadi: ' + e.message);
    }
  }

  const coachMap = React.useMemo(() => {
    const m = {};
    coaches.forEach(c => { m[c.id] = c.full_name; });
    return m;
  }, [coaches]);

  async function handleCreateGroup() {
    if (!newGroup.name.trim()) return;
    setSaving(true);
    try {
      await apiCreateGroup({
        name: newGroup.name.trim(),
        description: newGroup.description.trim() || undefined,
        coach_id: newGroup.coach_id ? Number(newGroup.coach_id) : undefined,
      });
      setShowNew(false);
      setNewGroup({ name: '', description: '', coach_id: '' });
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Guruhlar</h1>
          <div className="page-sub">{groups.length} ta faol guruh</div>
        </div>
        <div className="page-actions">
          <div style={{ display: 'inline-flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 2 }}>
            <button className={'btn sm ' + (view === 'cards' ? '' : 'ghost')} style={{ height: 30, border: 'none', background: view === 'cards' ? 'var(--selected)' : 'transparent' }} onClick={() => setView('cards')}>Kartochkalar</button>
            <button className={'btn sm ' + (view === 'list' ? '' : 'ghost')} style={{ height: 30, border: 'none', background: view === 'list' ? 'var(--selected)' : 'transparent' }} onClick={() => setView('list')}>Ro'yxat</button>
          </div>
          <button className="btn" onClick={handleExport}><I.Download size={15}/> Export</button>
          <button className="btn primary" onClick={() => setShowNew(true)}><I.Plus size={15}/> Yangi guruh</button>
        </div>
      </div>

      {view === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {groups.map(g => {
            const coachName = coachMap[g.coach_id] || '—';
            const count = g.active_students_count ?? 0;
            return (
              <div key={g.id} className="card" style={{ padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12 }} onClick={() => onOpen && onOpen(g.id)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    {g.description && <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{g.description}</div>}
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: g.description ? 4 : 0 }}>{g.name}</div>
                  </div>
                  <span className="chip success"><span className="chip-dot"></span>Faol</span>
                </div>
                {g.coach_id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                    <div className="avatar sm" style={{ background: 'var(--brand-navy)' }}>
                      {coachName.split(' ').map(p => p[0]).slice(0, 2).join('')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{coachName}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Murabbiy</div>
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: 'var(--muted)' }}>Faol o'quvchilar</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'list' && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Guruh</th><th>Tavsif</th><th>Murabbiy</th><th>O'quvchilar</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {groups.map(g => {
                const coachName = coachMap[g.coach_id] || '—';
                return (
                  <tr key={g.id} onClick={() => onOpen && onOpen(g.id)}>
                    <td style={{ fontWeight: 600 }}>{g.name}</td>
                    <td style={{ color: 'var(--muted)' }}>{g.description || '—'}</td>
                    <td>{coachName}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{g.active_students_count ?? '—'}</td>
                    <td><span className="chip success">Faol</span></td>
                    <td><button className="icon-btn" style={{ width: 30, height: 30 }}><I.More size={15}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowNew(false)}>
          <div className="card" style={{ width: 460, padding: 24, boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Yangi guruh</h3>
              <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => setShowNew(false)}><I.X size={16}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field"><label>Guruh nomi <span className="req">*</span></label><input value={newGroup.name} onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))} placeholder="Masalan: Alpha-2012"/></div>
              <div className="field"><label>Tavsif</label><input value={newGroup.description} onChange={e => setNewGroup(p => ({ ...p, description: e.target.value }))} placeholder="Qisqacha ma'lumot"/></div>
              <div className="field"><label>Murabbiy</label>
                <select value={newGroup.coach_id} onChange={e => setNewGroup(p => ({ ...p, coach_id: e.target.value }))}>
                  <option value="">Tanlanmagan</option>
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => setShowNew(false)}>Bekor</button>
              <button className="btn primary" onClick={handleCreateGroup} disabled={saving}>
                <I.Check size={14}/> {saving ? 'Saqlanmoqda...' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SessionsScreen({ onMark }) {
  const I = Icon;
  const [sessions, setSessions] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('today');

  const today = new Date().toISOString().slice(0, 10);

  React.useEffect(() => {
    Promise.all([
      apiGetSessions({ page_size: 100 }),
      apiGetGroups({ page_size: 100 }),
    ]).then(([sRes, gRes]) => {
      setSessions(sRes?.data || []);
      setGroups(gRes?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const groupMap = React.useMemo(() => {
    const m = {};
    groups.forEach(g => { m[g.id] = g.name; });
    return m;
  }, [groups]);

  const sessionsWithStatus = sessions.map(s => ({ ...s, _status: sessionStatus(s.session_date) }));

  const list = sessionsWithStatus.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'today') return s._status === 'today';
    if (filter === 'upcoming') return s._status === 'upcoming';
    if (filter === 'past') return s._status === 'completed';
    return true;
  });

  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    days.push({
      date: d, iso,
      label: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'][(d.getDay() + 6) % 7],
      num: d.getDate(),
      count: sessions.filter(s => s.session_date === iso).length,
    });
  }

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Trening sessiyalari</h1>
          <div className="page-sub">{sessions.length} ta sessiya · {sessions.filter(s => sessionStatus(s.session_date) === 'upcoming').length} ta kelayotgan</div>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Calendar size={15}/> Hafta</button>
          <button className="btn primary"><I.Plus size={15}/> Sessiya rejalashtirish</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {days.map(d => {
            const isToday = d.iso === today;
            return (
              <div key={d.iso} style={{ padding: 12, borderRadius: 10, background: isToday ? 'var(--brand-navy)' : 'var(--surface-2)', color: isToday ? 'white' : 'var(--text)', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: 11, opacity: isToday ? 0.8 : 0.6, fontWeight: 600, textTransform: 'uppercase' }}>{d.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, margin: '4px 0' }}>{d.num}</div>
                <div style={{ fontSize: 11, opacity: isToday ? 0.85 : 0.7 }}>{d.count > 0 ? d.count + ' sessiya' : '—'}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['today', 'Bugun'], ['upcoming', 'Kelayotgan'], ['past', 'Tugagan'], ['all', 'Hammasi']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={'btn sm ' + (filter === k ? '' : 'ghost')} style={{ background: filter === k ? 'var(--selected)' : 'transparent' }}>{l}</button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Sana</th><th>Vaqt</th><th>Mavzu</th><th>Guruh</th><th>Maydon</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.slice(0, 20).map(s => (
              <tr key={s.id} onClick={() => onMark(s.id)}>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{s.session_date}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{s.start_time} – {s.end_time}</td>
                <td>{s.topic}</td>
                <td><span className="chip navy">{groupMap[s.group_id] || '—'}</span></td>
                <td style={{ color: 'var(--muted)' }}>{s.station || '—'}</td>
                <td>
                  {s._status === 'completed' && <span className="chip success"><span className="chip-dot"></span>Tugadi</span>}
                  {s._status === 'today' && <span className="chip warning"><span className="chip-dot"></span>Bugun</span>}
                  {s._status === 'upcoming' && <span className="chip"><span className="chip-dot"></span>Kelayotgan</span>}
                </td>
                <td><button className="btn sm" onClick={e => { e.stopPropagation(); onMark(s.id); }}>Davomat <I.ArrowRight size={13}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AttendanceMark({ sessionId, onBack }) {
  const I = Icon;
  const [session, setSession] = React.useState(null);
  const [students, setStudents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [marks, setMarks] = React.useState({});
  const [comments, setComments] = React.useState({});

  React.useEffect(() => {
    if (!sessionId) return;
    apiGetSessionDetails(sessionId).then(async (sRes) => {
      const sess = sRes?.data;
      setSession(sess);
      if (sess?.group_id) {
        const stuRes = await apiGetGroupStudents(sess.group_id);
        const active = (stuRes?.data || []).filter(s => s.status === 'active');
        setStudents(active);
        const init = {};
        active.forEach(s => { init[s.id] = 'present'; });
        setMarks(init);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [sessionId]);

  function setMark(id, status) { setMarks(prev => ({ ...prev, [id]: status })); }

  const counts = { present: 0, absent: 0, late: 0 };
  Object.values(marks).forEach(m => { if (counts[m] !== undefined) counts[m]++; });

  async function handleSave() {
    if (!sessionId) return;
    setSaving(true);
    try {
      const attendances = students.map(s => ({
        student_id: s.id,
        status: marks[s.id] || 'absent',
        comment: comments[s.id] || undefined,
      }));
      await apiMarkAttendance(sessionId, { attendances });
      onBack?.();
    } catch (e) {
      alert('Xatolik: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;
  if (!session) return <div className="empty" style={{ padding: 48 }}>Sessiya topilmadi</div>;

  return (
    <div>
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 14 }}><I.ArrowLeft size={14}/> Sessiyalar</button>

      <div className="page-head">
        <div>
          <h1 className="page-title">{session.topic}</h1>
          <div className="page-sub" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span><I.Calendar size={12} style={{ verticalAlign: -2 }}/> {session.session_date}</span>
            <span><I.Clock size={12} style={{ verticalAlign: -2 }}/> {session.start_time} – {session.end_time}</span>
            {session.station && <span><I.MapPin size={12} style={{ verticalAlign: -2 }}/> {session.station}</span>}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn primary" onClick={handleSave} disabled={saving}>
            <I.Save size={15}/> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div className="stat" style={{ padding: 14 }}>
          <div className="stat-label">Jami</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{students.length}</div>
        </div>
        <div className="stat" style={{ padding: 14, background: 'var(--success-soft)', borderColor: 'transparent' }}>
          <div className="stat-label" style={{ color: 'var(--success)' }}>Kelgan</div>
          <div className="stat-value" style={{ color: 'var(--success)', fontSize: 22 }}>{counts.present}</div>
        </div>
        <div className="stat" style={{ padding: 14, background: 'var(--warning-soft)', borderColor: 'transparent' }}>
          <div className="stat-label" style={{ color: 'var(--warning)' }}>Kechikkan</div>
          <div className="stat-value" style={{ color: 'var(--warning)', fontSize: 22 }}>{counts.late}</div>
        </div>
        <div className="stat" style={{ padding: 14, background: 'var(--accent-soft)', borderColor: 'transparent' }}>
          <div className="stat-label" style={{ color: 'var(--brand-red)' }}>Kelmagan</div>
          <div className="stat-value" style={{ color: 'var(--brand-red)', fontSize: 22 }}>{counts.absent}</div>
        </div>
      </div>

      {students.length > 0 && (
        <div className="card" style={{ marginBottom: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Hammasini belgilash:</span>
          <button className="btn sm" onClick={() => { const m = {}; students.forEach(s => m[s.id] = 'present'); setMarks(m); }}>
            <I.Check size={13} color="var(--success)"/> Kelgan
          </button>
          <button className="btn sm" onClick={() => { const m = {}; students.forEach(s => m[s.id] = 'absent'); setMarks(m); }}>
            <I.X size={13} color="var(--brand-red)"/> Kelmagan
          </button>
          <div style={{ flex: 1 }}></div>
          {students.length > 0 && <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Davomat: <strong style={{ color: 'var(--text)' }}>{Math.round(counts.present / students.length * 100)}%</strong></span>}
        </div>
      )}

      {students.length === 0 && <div className="empty">Bu guruhda faol o'quvchilar yo'q</div>}

      {students.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr><th>O'quvchi</th><th style={{ width: 380, textAlign: 'center' }}>Status</th><th>Izoh</th></tr>
            </thead>
            <tbody>
              {students.map(s => {
                const m = marks[s.id] || 'present';
                const name = `${s.first_name} ${s.last_name}`;
                return (
                  <tr key={s.id} style={{ cursor: 'default' }}>
                    <td>
                      <div className="row-name">
                        <div className="avatar sm" style={{ background: avatarColor(s.id) }}>{s.first_name[0]}{s.last_name[0]}</div>
                        <div className="meta">
                          <span className="name">{name}</span>
                          <span className="sub">#{String(s.id).padStart(4, '0')}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        {[
                          { k: 'present', l: 'Kelgan', color: 'var(--success)', soft: 'var(--success-soft)', icon: 'Check' },
                          { k: 'late', l: 'Kech', color: 'var(--warning)', soft: 'var(--warning-soft)', icon: 'Clock' },
                          { k: 'absent', l: "Yo'q", color: 'var(--brand-red)', soft: 'var(--accent-soft)', icon: 'X' },
                        ].map(b => {
                          const Ic = I[b.icon];
                          const sel = m === b.k;
                          return (
                            <button key={b.k} onClick={() => setMark(s.id, b.k)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid ' + (sel ? b.color : 'var(--border)'), background: sel ? b.soft : 'var(--surface)', color: sel ? b.color : 'var(--text-2)', fontWeight: sel ? 700 : 500, fontSize: 12.5, cursor: 'pointer' }}>
                              <Ic size={13}/> {b.l}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <input placeholder={m !== 'present' ? 'Sabab yozish...' : 'Izoh ixtiyoriy'} value={comments[s.id] || ''} onChange={e => setComments({ ...comments, [s.id]: e.target.value })} style={{ width: '100%', height: 32, border: '1px solid var(--border)', borderRadius: 6, padding: '0 10px', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function PerformanceTable() {
  const I = Icon;
  const M = MOCK;
  const group = M.groups[3];
  const students = M.students.filter(s => s.group_id === group.id && s.status === 'active').slice(0, 12);

  async function handleExport() {
    try {
      const url = await apiGetCoachGroupPerformanceTableExportUrl(group.id, 2026);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      alert('Excel ochilmadi: ' + e.message);
    }
  }

  function cellFor(sid, mi) {
    const code = ((sid * 13 + mi * 7) % 11);
    if (code < 2) return { v: 'goal', n: 2 };
    if (code < 4) return { v: 'goal', n: 1 };
    if (code < 5) return { v: 'assist', n: 1 };
    if (code < 6) return { v: 'yellow', n: 1 };
    if (code < 7) return { v: 'absent', n: 0 };
    return { v: 'played', n: 0 };
  }

  function cellStyle(v) {
    switch (v) {
      case 'goal': return { bg: 'var(--success-soft)', color: 'var(--success)', label: '⚽' };
      case 'assist': return { bg: 'rgba(15,31,77,0.08)', color: 'var(--brand-navy)', label: '↗' };
      case 'yellow': return { bg: 'var(--warning-soft)', color: 'var(--warning)', label: '▢' };
      case 'absent': return { bg: 'var(--accent-soft)', color: 'var(--brand-red)', label: '✗' };
      default: return { bg: 'var(--surface-2)', color: 'var(--text-2)', label: '·' };
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Natijaviy jadval</h1>
          <div className="page-sub">{group.name} · 2026 mavsumi · {M.matches.length} ta o'yin</div>
        </div>
        <div className="page-actions">
          <select style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}>
            {M.groups.map(g => <option key={g.id} defaultValue={g.id === group.id}>{g.name}</option>)}
          </select>
          <button className="btn" onClick={handleExport}><I.Download size={15}/> Excel</button>
          <button className="btn primary"><I.Plus size={15}/> O'yin qo'shish</button>
        </div>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table className="table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, background: 'var(--surface-2)', zIndex: 2, minWidth: 220 }}>O'quvchi</th>
              {M.matches.map(m => (
                <th key={m.id} style={{ textAlign: 'center', minWidth: 90 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{m.match_date.slice(5)} · {m.is_home ? 'Uy' : 'Mehmon'}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', textTransform: 'none', letterSpacing: 0 }}>{m.opponent}</div>
                </th>
              ))}
              <th style={{ textAlign: 'center', minWidth: 80, background: 'var(--surface-2)' }}>Jami</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => {
              let goals = 0;
              return (
                <tr key={s.id} style={{ cursor: 'default' }}>
                  <td style={{ position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1, borderRight: '1px solid var(--border)' }}>
                    <div className="row-name">
                      <div className="avatar sm" style={{ background: s.avatar_color }}>{s.first_name[0]}{s.last_name[0]}</div>
                      <div className="meta"><span className="name" style={{ fontSize: 13 }}>{s.full_name}</span><span className="sub">{s.age} yosh</span></div>
                    </div>
                  </td>
                  {M.matches.map((m, mi) => {
                    const c = cellFor(s.id, mi);
                    const st = cellStyle(c.v);
                    if (c.v === 'goal') goals += c.n;
                    return (
                      <td key={m.id} style={{ textAlign: 'center', padding: 4 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 44, height: 30, padding: '0 10px', background: st.bg, color: st.color, borderRadius: 6, fontSize: 13, fontWeight: 700 }}>
                          {st.label}{c.n > 1 ? ' ' + c.n : ''}
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'center', background: 'var(--surface-2)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{goals}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 14, padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', gap: 18, fontSize: 12.5, flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 22, background: 'var(--success-soft)', color: 'var(--success)', borderRadius: 4, marginRight: 6, fontWeight: 700 }}>⚽</span>Gol</span>
        <span><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 22, background: 'rgba(15,31,77,0.08)', color: 'var(--brand-navy)', borderRadius: 4, marginRight: 6, fontWeight: 700 }}>↗</span>Uzatma</span>
        <span><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 22, background: 'var(--warning-soft)', color: 'var(--warning)', borderRadius: 4, marginRight: 6, fontWeight: 700 }}>▢</span>Sariq kartochka</span>
        <span><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 22, background: 'var(--accent-soft)', color: 'var(--brand-red)', borderRadius: 4, marginRight: 6, fontWeight: 700 }}>✗</span>Kelmagan</span>
      </div>
    </div>
  );
}
