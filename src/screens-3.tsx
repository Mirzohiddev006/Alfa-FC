// @ts-nocheck
import React from 'react';
import { Icon } from './icons';
import { MOCK } from './data';
import {
  apiGetGroups, apiGetHeadCoachGroups, apiGetGroup, apiGetGroupStudents, apiCreateGroup, apiUpdateGroup,
  apiGetSessions, apiGetSessionDetails, apiGetCoachSessionDetails, apiCreateSession,
  apiGetCoaches, apiGetGroupStudentsExportUrl, apiDownloadCoachGroupPerformanceTableExport,
  apiMarkAttendance, apiMarkBulkAttendance,
} from './api';
import { useCoachGroupsQuery, useGroupPerformanceTableQuery } from './features/performance-table/model/use-performance-table';

const AVATAR_COLORS = ['#0F1F4D', '#C8202C', '#0E7C5E', '#7B2FBE', '#D97706', '#0284C7'];
function avatarColor(id) { return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length]; }

function sessionStatus(session_date) {
  const today = new Date().toISOString().slice(0, 10);
  if (session_date === today) return 'today';
  if (session_date > today) return 'upcoming';
  return 'completed';
}

export function GroupsScreen({ onOpen, selectedGroupId = null, onCloseGroup } = {}) {
  const I = Icon;
  const [groups, setGroups] = React.useState([]);
  const [coaches, setCoaches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState('cards');
  const [showNew, setShowNew] = React.useState(false);
  const [newGroup, setNewGroup] = React.useState({ name: '', description: '', coach_id: '' });
  const [saving, setSaving] = React.useState(false);
  const [groupDetail, setGroupDetail] = React.useState(null);
  const [groupStudents, setGroupStudents] = React.useState([]);
  const [groupLoading, setGroupLoading] = React.useState(false);
  const [openMenuGroupId, setOpenMenuGroupId] = React.useState(null);
  const [menuPos, setMenuPos] = React.useState({ x: 0, y: 0 });

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

  React.useEffect(() => {
    const closeMenu = () => setOpenMenuGroupId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  React.useEffect(() => {
    if (!selectedGroupId) {
      setGroupDetail(null);
      setGroupStudents([]);
      return;
    }

    setGroupLoading(true);
    Promise.all([
      apiGetGroup(selectedGroupId),
      apiGetGroupStudents(selectedGroupId),
    ])
      .then(([gRes, sRes]) => {
        setGroupDetail(gRes?.data || null);
        setGroupStudents(sRes?.data || []);
      })
      .catch(() => {})
      .finally(() => setGroupLoading(false));
  }, [selectedGroupId]);

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

  const selectedGroup = groupDetail || groups.find(g => g.id === selectedGroupId) || null;

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

      {selectedGroup && (
        <div className="card" style={{ marginBottom: 16, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                <span className="chip success"><span className="chip-dot"></span>Faol guruh</span>
                <span className="chip navy">{groupStudents.length} o'quvchi</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 22 }}>{selectedGroup.name}</h2>
              <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13.5 }}>{selectedGroup.description || "Tavsif yo'q"}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn ghost sm" onClick={() => onCloseGroup?.()}>Yopish</button>
            </div>
          </div>

          {groupLoading ? (
            <div className="empty" style={{ padding: 20 }}>Yuklanmoqda...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginTop: 16 }}>
              <StatCard label="Murabbiy" value={selectedGroup.coach_name || coachMap[selectedGroup.coach_id] || '—'} />
              <StatCard label="Imkoniyat" value={selectedGroup.capacity ?? '—'} />
              <StatCard label="Faol o'quvchi" value={selectedGroup.active_students_count ?? groupStudents.filter(s => s.status === 'active').length} />
              <StatCard label="Jami o'quvchi" value={groupStudents.length} />
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Guruhdagi o'quvchilar</div>
            {groupStudents.length === 0 ? (
              <div className="empty" style={{ padding: 20 }}>O'quvchilar topilmadi</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {groupStudents.slice(0, 12).map((s) => (
                  <div key={s.id} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="avatar sm" style={{ background: avatarColor(s.id) }}>{s.first_name?.[0]}{s.last_name?.[0]}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.first_name} {s.last_name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{s.phone || "Telefon yo'q"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
                    <td style={{ position: 'relative' }}>
                      <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={(e) => {
                        e.stopPropagation();
                        if (openMenuGroupId === g.id) {
                          setOpenMenuGroupId(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuPos({ x: rect.right - 140, y: rect.bottom + 4 });
                          setOpenMenuGroupId(g.id);
                        }
                      }}><I.More size={15}/></button>
                      {openMenuGroupId === g.id && (
                        <div style={{ position: 'fixed', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 9999, minWidth: 140, top: menuPos.y, left: menuPos.x }} onClick={e => e.stopPropagation()}>
                          <button style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => { onOpen?.(g.id); setOpenMenuGroupId(null); }}>
                            <I.Eye size={14} /> Ko'rish
                          </button>
                        </div>
                      )}
                    </td>
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

function StatCard({ label, value }) {
  return (
    <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export function SessionsScreen({ onMark }) {
  const I = Icon;
  const [sessions, setSessions] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('today');
  const [selectedDate, setSelectedDate] = React.useState('');
  const [showCreate, setShowCreate] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const todayIso = new Date().toISOString().slice(0, 10);
  const [newSession, setNewSession] = React.useState({
    group_id: '',
    session_date: todayIso,
    topic: '',
    start_time: '10:00',
    end_time: '11:00',
    station: '',
    description: '',
  });

  const today = new Date().toISOString().slice(0, 10);

  React.useEffect(() => {
    Promise.all([
      apiGetSessions(),
      apiGetHeadCoachGroups(),
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
    if (selectedDate && s.session_date !== selectedDate) return false;
    if (filter === 'all') return true;
    if (filter === 'week') {
      const d = new Date(s.session_date);
      const start = new Date(today);
      start.setDate(start.getDate() - 3);
      const end = new Date(today);
      end.setDate(end.getDate() + 3);
      return d >= start && d <= end;
    }
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

  async function handleCreateSession() {
    if (!newSession.group_id || !newSession.topic.trim() || !newSession.session_date) {
      alert('Guruh, sana va mavzu majburiy');
      return;
    }
    setSaving(true);
    try {
      await apiCreateSession({
        group_id: Number(newSession.group_id),
        session_date: newSession.session_date,
        topic: newSession.topic.trim(),
        start_time: newSession.start_time,
        end_time: newSession.end_time,
        station: newSession.station.trim() || undefined,
        description: newSession.description.trim() || undefined,
      });
      setShowCreate(false);
      setNewSession((p) => ({ ...p, topic: '', station: '', description: '' }));
      const [sRes] = await Promise.all([apiGetSessions()]);
      setSessions(sRes?.data || []);
    } catch (e) {
      alert('Sessiya yaratilmadi: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Trening sessiyalari</h1>
          <div className="page-sub">{sessions.length} ta sessiya · {sessions.filter(s => sessionStatus(s.session_date) === 'upcoming').length} ta kelayotgan</div>
        </div>
        <div className="page-actions">
          <button className={'btn' + (filter === 'week' ? ' primary' : '')} onClick={() => setFilter('week')}>
            <I.Calendar size={15}/> Hafta
          </button>
          <button className="btn primary" onClick={() => setShowCreate(true)}><I.Plus size={15}/> Sessiya rejalashtirish</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {days.map(d => {
            const isToday = d.iso === today;
            const isSelected = d.iso === selectedDate;
            return (
              <div
                key={d.iso}
                onClick={() => { setSelectedDate(d.iso); setFilter('all'); }}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: isSelected ? '1px solid var(--brand-red)' : '1px solid transparent',
                  background: isSelected ? 'var(--selected)' : isToday ? 'var(--brand-navy)' : 'var(--surface-2)',
                  color: isSelected ? 'var(--text)' : isToday ? 'white' : 'var(--text)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, opacity: isSelected ? 0.8 : isToday ? 0.8 : 0.6, fontWeight: 600, textTransform: 'uppercase' }}>{d.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, margin: '4px 0' }}>{d.num}</div>
                <div style={{ fontSize: 11, opacity: isSelected ? 0.85 : isToday ? 0.85 : 0.7 }}>{d.count > 0 ? d.count + ' sessiya' : '—'}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['today', 'Bugun'], ['upcoming', 'Kelayotgan'], ['past', 'Tugagan'], ['all', 'Hammasi']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={'btn sm ' + (filter === k ? '' : 'ghost')} style={{ background: filter === k ? 'var(--selected)' : 'transparent' }}>{l}</button>
        ))}
        {selectedDate && (
          <button className="btn sm ghost" onClick={() => setSelectedDate('')}>
            Kun filtri: {selectedDate} <I.X size={13}/>
          </button>
        )}
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

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120 }} onClick={() => setShowCreate(false)}>
          <div className="card" style={{ width: 560, padding: 22, boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Sessiya rejalashtirish</h3>
              <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => setShowCreate(false)}><I.X size={16}/></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>Guruh <span className="req">*</span></label>
                <select value={newSession.group_id} onChange={e => setNewSession(p => ({ ...p, group_id: e.target.value }))}>
                  <option value="">Tanlang</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Sana <span className="req">*</span></label>
                <input type="date" value={newSession.session_date} onChange={e => setNewSession(p => ({ ...p, session_date: e.target.value }))} />
              </div>
              <div className="field">
                <label>Mavzu <span className="req">*</span></label>
                <input value={newSession.topic} onChange={e => setNewSession(p => ({ ...p, topic: e.target.value }))} placeholder="Masalan: Tezlik mashqi" />
              </div>
              <div className="field">
                <label>Maydon</label>
                <input value={newSession.station} onChange={e => setNewSession(p => ({ ...p, station: e.target.value }))} placeholder="Maydon 1" />
              </div>
              <div className="field">
                <label>Boshlanish vaqti</label>
                <input type="time" value={newSession.start_time} onChange={e => setNewSession(p => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div className="field">
                <label>Tugash vaqti</label>
                <input type="time" value={newSession.end_time} onChange={e => setNewSession(p => ({ ...p, end_time: e.target.value }))} />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Izoh</label>
                <textarea value={newSession.description} onChange={e => setNewSession(p => ({ ...p, description: e.target.value }))} placeholder="Qo'shimcha izoh" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
              <button className="btn ghost" onClick={() => setShowCreate(false)}>Bekor</button>
              <button className="btn primary" onClick={handleCreateSession} disabled={saving}><I.Check size={14}/> {saving ? 'Saqlanmoqda...' : 'Yaratish'}</button>
            </div>
          </div>
        </div>
      )}
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
    apiGetCoachSessionDetails(sessionId).then(async (sRes) => {
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
      await apiMarkBulkAttendance(sessionId, attendances);
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
  const currentYear = new Date().getFullYear();
  const [seasonYear, setSeasonYear] = React.useState(currentYear);

  // -- real API data --
  const groupsQuery = useCoachGroupsQuery();
  const groups = groupsQuery.data || [];

  const [selectedGroupId, setSelectedGroupId] = React.useState(null);
  // Default to first group once groups load
  React.useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  const tableQuery = useGroupPerformanceTableQuery(selectedGroupId, seasonYear);
  const tableData = tableQuery.data || null;
  const matches = tableData?.matches || [];
  const rows = tableData?.rows || [];

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;

  function cellStyle(rawValue) {
    const v = rawValue == null ? null : String(rawValue).toLowerCase().trim();
    switch (v) {
      case 'goal':
      case 'gol':
        return { bg: 'var(--success-soft)', color: 'var(--success)', label: '⚽', numericGoals: 1 };
      case 'assist':
      case 'uzatma':
        return { bg: 'rgba(15,31,77,0.08)', color: 'var(--brand-navy)', label: '↗', numericGoals: 0 };
      case 'yellow':
      case 'sariq':
        return { bg: 'var(--warning-soft)', color: 'var(--warning)', label: '▢', numericGoals: 0 };
      case 'absent':
      case 'kelmagan':
        return { bg: 'var(--accent-soft)', color: 'var(--brand-red)', label: '✗', numericGoals: 0 };
      case null:
      case '':
      case 'played':
        return { bg: 'var(--surface-2)', color: 'var(--text-2)', label: '·', numericGoals: 0 };
      default: {
        // Numeric cell — treat as goal count
        const n = Number(rawValue);
        if (!isNaN(n) && n > 0) return { bg: 'var(--success-soft)', color: 'var(--success)', label: `⚽ ${n}`, numericGoals: n };
        return { bg: 'var(--surface-2)', color: 'var(--text-2)', label: v || '·', numericGoals: 0 };
      }
    }
  }

  async function handleExport() {
    if (!selectedGroupId) return;
    try {
      const blob = await apiDownloadCoachGroupPerformanceTableExport(selectedGroupId, seasonYear);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-table-${selectedGroupId}-${seasonYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      alert('Excel ochilmadi: ' + e.message);
    }
  }

  // Loading / error states
  if (groupsQuery.isLoading) {
    return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;
  }
  if (groupsQuery.isError) {
    return <div className="empty" style={{ padding: 48, color: 'var(--brand-red)' }}>Guruhlarni yuklashda xatolik yuz berdi.</div>;
  }
  if (groups.length === 0) {
    return <div className="empty" style={{ padding: 48 }}>Guruhlar topilmadi.</div>;
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Natijaviy jadval</h1>
          <div className="page-sub">
            {selectedGroup?.name || '—'} · {seasonYear} mavsumi · {matches.length} ta o'yin
          </div>
        </div>
        <div className="page-actions">
          <select
            value={selectedGroupId || ''}
            onChange={e => setSelectedGroupId(Number(e.target.value))}
            style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}
          >
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select
            value={seasonYear}
            onChange={e => setSeasonYear(Number(e.target.value))}
            style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}
          >
            {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn" onClick={handleExport} disabled={!selectedGroupId}><I.Download size={15}/> Excel</button>
          <button className="btn primary"><I.Plus size={15}/> O'yin qo'shish</button>
        </div>
      </div>

      {tableQuery.isLoading && (
        <div className="empty" style={{ padding: 48 }}>Jadval yuklanmoqda...</div>
      )}

      {tableQuery.isError && (
        <div className="empty" style={{ padding: 48, color: 'var(--brand-red)' }}>Jadvalni yuklashda xatolik yuz berdi.</div>
      )}

      {!tableQuery.isLoading && !tableQuery.isError && matches.length === 0 && (
        <div className="empty" style={{ padding: 48 }}>Bu guruh uchun {seasonYear} mavsum ma'lumotlari yo'q.</div>
      )}

      {!tableQuery.isLoading && !tableQuery.isError && matches.length > 0 && (
        <>
          <div className="card" style={{ overflow: 'auto' }}>
            <table className="table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: 'var(--surface-2)', zIndex: 2, minWidth: 220 }}>O'quvchi</th>
                  {matches.map(m => (
                    <th key={m.id} style={{ textAlign: 'center', minWidth: 90 }}>
                      <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{m.match_date?.slice(5)} · {m.tour_label || ''}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', textTransform: 'none', letterSpacing: 0 }}>{m.opponent}</div>
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', minWidth: 80, background: 'var(--surface-2)' }}>Jami</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  let goals = 0;
                  return (
                    <tr key={row.student_id} style={{ cursor: 'default' }}>
                      <td style={{ position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1, borderRight: '1px solid var(--border)' }}>
                        <div className="row-name">
                          <div className="avatar sm" style={{ background: avatarColor(row.student_id) }}>
                            {row.student_name?.split(' ').map(p => p[0]).slice(0, 2).join('') || '??'}
                          </div>
                          <div className="meta">
                            <span className="name" style={{ fontSize: 13 }}>{row.student_name}</span>
                            {row.millati && <span className="sub">{row.millati}</span>}
                          </div>
                        </div>
                      </td>
                      {matches.map((m, mi) => {
                        const rawCell = row.cells?.[mi] ?? null;
                        const st = cellStyle(rawCell);
                        goals += st.numericGoals;
                        return (
                          <td key={m.id} style={{ textAlign: 'center', padding: 4 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 44, height: 30, padding: '0 10px', background: st.bg, color: st.color, borderRadius: 6, fontSize: 13, fontWeight: 700 }}>
                              {st.label}
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
        </>
      )}
    </div>
  );
}
