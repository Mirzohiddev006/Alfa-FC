// @ts-nocheck
import React from 'react';
import { Icon } from './icons';
import { AlphaShield } from './logo';
import { MOCK } from './data';
import { apiLogin, apiGetDashboard, apiGetGroups, apiGetSessions } from './api';

export function LoginScreen({ onLogin }) {
  const I = Icon;
  const [showPw, setShowPw] = React.useState(false);
  const [phone, setPhone] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiLogin(phone.trim(), pw);
      onLogin();
    } catch (err) {
      setError(err.message || 'Login yoki parol noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--bg)',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #0F1F4D 0%, #1B3A6F 60%, #0F1F4D 100%)',
        color: 'white',
        padding: '48px 56px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -120, right: -120, width: 380, height: 380, borderRadius: '50%', background: 'rgba(200,32,44,0.18)', filter: 'blur(10px)' }}></div>
        <div style={{ position: 'absolute', bottom: -100, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(245,185,33,0.10)', filter: 'blur(10px)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <AlphaShield size={48}/>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.05em' }}>ALPHA FC</div>
            <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: '0.18em' }}>CLUB INFORMATION MANAGEMENT</div>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16, textWrap: 'pretty' }}>
            Akademiya boshqaruvini bir joyda.
          </div>
          <div style={{ fontSize: 15, opacity: 0.78, maxWidth: 460, lineHeight: 1.55 }}>
            O'quvchilar, guruhlar, davomat, shartnoma va to'lovlar —
            yagona tizimda. 360° o'quvchi profili va real vaqt darvoza kuzatuvi bilan.
          </div>
          <div style={{ marginTop: 36, display: 'flex', gap: 26, flexWrap: 'wrap' }}>
            {[
              { v: '320+', l: "O'quvchi" },
              { v: '24', l: 'Guruh' },
              { v: '99.2%', l: "Davomat aniqligi" },
            ].map(s => (
              <div key={s.l}>
                <div style={{ fontSize: 26, fontWeight: 700 }}>{s.v}</div>
                <div style={{ fontSize: 12, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.5, position: 'relative' }}>v2.4.1 · © 2026 Alpha Football Club</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 380 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Tizimga kirish</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 30px' }}>Akkountingiz bilan davom eting</p>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Telefon yoki email</label>
            <div style={{ position: 'relative' }}>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998 90 123 45 67" style={{ width: '100%', paddingLeft: 38 }}/>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}><I.Phone size={15}/></span>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Parol</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" style={{ width: '100%', paddingLeft: 38, paddingRight: 38 }}/>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}><I.Lock size={15}/></span>
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--muted)', padding: 6 }}>
                {showPw ? <I.EyeOff size={15}/> : <I.Eye size={15}/>} 
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 22px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
              <input type="checkbox" defaultChecked/> Meni eslab qol
            </label>
            <a href="#" style={{ fontSize: 13, color: 'var(--brand-red)', textDecoration: 'none', fontWeight: 600 }}>Parolni unutdingizmi?</a>
          </div>
          {error && (
            <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--accent-soft)', border: '1px solid var(--brand-red)', borderRadius: 8, fontSize: 13, color: 'var(--brand-red)', fontWeight: 500 }}>
              {error}
            </div>
          )}
          <button className="btn primary" type="submit" style={{ width: '100%', height: 44, justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Tekshirilmoqda...' : 'Kirish'} {!loading && <I.ArrowRight size={16}/>} 
          </button>
        </form>
      </div>
    </div>
  );
}

function MiniSpark({ values, color = 'var(--brand-navy)', height = 36 }) {
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const W = 120, H = height;
  const step = W / (values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(H - ((v - min) / range) * (H - 6) - 3).toFixed(1)}`).join(' ');
  const area = `0,${H} ${points} ${W},${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <polygon points={area} fill={color} opacity="0.10"/>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function fmtMln(v) {
  if (!v) return '0';
  return (v / 1_000_000).toFixed(1) + ' mln';
}

export function Dashboard({ role, onNav }) {
  const I = Icon;
  const [summary, setSummary] = React.useState(null);
  const [todaySessions, setTodaySessions] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const todayIso = new Date().toISOString().slice(0, 10);

  React.useEffect(() => {
    Promise.all([
      apiGetDashboard(),
      apiGetSessions({ date: todayIso }),
      apiGetGroups({ page_size: 50 }),
    ]).then(([dashRes, sessRes, grpRes]) => {
      setSummary(dashRes?.data || null);
      setTodaySessions(sessRes?.data || []);
      setGroups(grpRes?.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const m30 = summary?.last_30_days;
  const inflow30 = m30?.total_inflow || 0;
  const trendPoints = m30?.trend?.map(p => p.inflow) || [0];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Bosh sahifa</h1>
          <div className="page-sub">Bugun · {loading ? '...' : (summary?.today_sessions ?? todaySessions.length) + ' ta sessiya rejalashtirilgan'}</div>
        </div>
        <div className="page-actions">
          <button className="btn primary" onClick={() => onNav('students-new')}><I.Plus size={15}/> Yangi o'quvchi</button>
        </div>
      </div>

      <div className="grid-4">
        {[
          { label: "Faol o'quvchilar", value: loading ? '...' : (summary?.active_students ?? '-'), spark: [60,62,64,68,70,75,78,80,82,84], color: 'var(--brand-navy)' },
          { label: "Bugun sessiyalar", value: loading ? '...' : (summary?.today_sessions ?? '-'), spark: [2,3,2,3,4,3,4,3,4,3], color: 'var(--success)' },
          { label: 'Oylik tushum (30 kun)', value: loading ? '...' : fmtMln(inflow30), spark: trendPoints.length > 1 ? trendPoints : [0,1], color: 'var(--brand-gold)' },
          { label: 'Qarzdorlar', value: loading ? '...' : (summary?.total_debtors ?? '-'), spark: [8,9,8,10,11,10,9,10,11,12], color: 'var(--brand-red)' },
        ].map(s => (
          <div key={s.label} className="stat">
            <div className="stat-label">{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
              <div className="stat-value">{s.value}</div>
              <div style={{ width: 100 }}><MiniSpark values={s.spark} color={s.color}/></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 16 }}></div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <I.Calendar size={16} color="var(--muted)"/>
            <div className="card-title">Bugungi sessiyalar</div>
            <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => onNav('sessions')}>Hammasini ko'rish <I.ArrowRight size={13}/></button>
          </div>
          <div style={{ padding: 6 }}>
            {loading && <div className="empty">Yuklanmoqda...</div>}
            {!loading && todaySessions.length === 0 && <div className="empty">Bugun sessiyalar yo'q</div>}
            {todaySessions.map((s) => (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '74px 1fr', gap: 14, padding: '12px 14px', borderRadius: 8, alignItems: 'center' }}>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{s.start_time || '--:--'}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{s.end_time || ''}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{s.topic || 'Trening'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 12, alignItems: 'center' }}>
                    {s.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><I.MapPin size={12}/> {s.location}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <I.Group size={16} color="var(--muted)"/>
            <div className="card-title">Guruhlar</div>
            <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => onNav('groups')}>Barchasi <I.ArrowRight size={13}/></button>
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {loading && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Yuklanmoqda...</div>}
            {groups.slice(0, 6).map(g => {
              const count = g.active_students_count || 0;
              const maxCapacity = 25;
              const pct = Math.min(Math.round((count / maxCapacity) * 100), 100);
              return (
                <div key={g.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600 }}>{g.name}</span>
                    <span style={{ color: 'var(--muted)' }}>{count} ta</span>
                  </div>
                  <div className={'progress ' + (pct >= 95 ? 'red' : pct >= 70 ? 'gold' : 'green')}>
                    <span style={{ width: pct + '%' }}></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ height: 16 }}></div>

      <div className="card">
        <div className="card-header">
          <I.Wallet size={16} color="var(--muted)"/>
          <div className="card-title">Moliya — so'nggi 30 kun</div>
          <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => onNav('transactions')}>Tranzaksiyalar <I.ArrowRight size={13}/></button>
        </div>
        <div style={{ padding: 18, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Jami tushum', value: fmtMln(m30?.total_inflow), color: 'var(--success)' },
            { label: 'Tranzaksiyalar', value: (m30?.successful_transactions || 0) + ' ta', color: 'var(--brand-navy)' },
            ...( m30?.source_breakdown?.map(s => ({ label: s.source === 'payme' ? 'Payme' : s.source === 'click' ? 'Click' : 'Boshqa', value: fmtMln(s.amount), color: 'var(--brand-gold)' })) || []),
          ].map((item, i) => (
            <div key={i} style={{ flex: '1 1 140px', padding: 14, background: 'var(--surface-2)', borderRadius: 10 }}>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: item.color }}>{loading ? '...' : item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
