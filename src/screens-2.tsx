// @ts-nocheck
import React from 'react';
import { Icon } from './icons';
import { MOCK } from './data';
import {
  apiGetStudents, apiGetStudentFullInfo, apiGetStudentTransactions, apiGetStudentGateLogs,
  apiGetGroups, apiCreateStudent,
} from './api';

const AVATAR_COLORS = ['#0F1F4D', '#C8202C', '#0E7C5E', '#7B2FBE', '#D97706', '#0284C7'];
function avatarColor(id) { return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length]; }

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return '—';
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function fullName(s) { return `${s.first_name} ${s.last_name}`; }

export function StudentsList({ onOpen, onNew }) {
  const I = Icon;
  const [students, setStudents] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [groupId, setGroupId] = React.useState('all');
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 30;

  React.useEffect(() => {
    Promise.all([
      apiGetStudents({ page_size: 200 }),
      apiGetGroups({ page_size: 100 }),
    ]).then(([sRes, gRes]) => {
      setStudents(sRes?.data || []);
      setGroups(gRes?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const groupMap = React.useMemo(() => {
    const m = {};
    groups.forEach(g => { m[g.id] = g.name; });
    return m;
  }, [groups]);

  const filtered = students.filter(s => {
    if (status !== 'all' && s.status !== status) return false;
    if (groupId !== 'all' && String(s.group_id) !== groupId) return false;
    if (q) {
      const name = fullName(s).toLowerCase();
      const qLow = q.toLowerCase();
      if (!name.includes(qLow) && !(s.phone || '').includes(q) && !(s.pnfl || '').includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allSelected = paginated.length > 0 && paginated.every(s => selected.includes(s.id));

  React.useEffect(() => { setPage(1); }, [q, status, groupId]);

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">O'quvchilar</h1>
          <div className="page-sub">Akademiyaning barcha o'quvchilari · jami {students.length} ta</div>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Download size={15}/> Excel export</button>
          <button className="btn primary" onClick={onNew}><I.UserPlus size={15}/> Yangi o'quvchi</button>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="search" style={{ maxWidth: 320 }}>
            <span className="icon-l"><I.Search size={15}/></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ism, telefon yoki PNFL..."/>
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}>
            <option value="all">Barcha statuslar</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
            <option value="archived">Arxiv</option>
          </select>
          <select value={groupId} onChange={e => setGroupId(e.target.value)} style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}>
            <option value="all">Barcha guruhlar</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 12.5 }}>
            {selected.length > 0 && <span style={{ color: 'var(--text)', fontWeight: 600 }}>{selected.length} tanlangan</span>}
            <span>{filtered.length} natija</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 36, paddingRight: 0 }}>
                  <input type="checkbox" checked={allSelected} onChange={e => setSelected(e.target.checked ? paginated.map(s => s.id) : [])}/>
                </th>
                <th>Ism Familiya</th>
                <th>Guruh</th>
                <th>Tug'ilgan</th>
                <th>Telefon</th>
                <th>Status</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(s => {
                const name = fullName(s);
                const age = calcAge(s.date_of_birth);
                const grpName = groupMap[s.group_id] || '—';
                return (
                  <tr key={s.id} onClick={() => onOpen(s.id)}>
                    <td onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={e => setSelected(e.target.checked ? [...selected, s.id] : selected.filter(x => x !== s.id))}/>
                    </td>
                    <td>
                      <div className="row-name">
                        <div className="avatar sm" style={{ background: avatarColor(s.id) }}>{s.first_name[0]}{s.last_name[0]}</div>
                        <div className="meta">
                          <span className="name">{name}</span>
                          <span className="sub">#{String(s.id).padStart(4, '0')} · {age} yosh</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="chip navy">{grpName}</span></td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-2)' }}>{s.date_of_birth}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-2)' }}>{s.phone || '—'}</td>
                    <td>
                      {s.status === 'active' && <span className="chip success"><span className="chip-dot"></span>Faol</span>}
                      {s.status === 'inactive' && <span className="chip warning"><span className="chip-dot"></span>Nofaol</span>}
                      {s.status === 'archived' && <span className="chip"><span className="chip-dot"></span>Arxiv</span>}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="icon-btn" style={{ width: 32, height: 32, border: 'none', background: 'transparent' }}><I.More size={16}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--muted)' }}>
          <span>{filtered.length === 0 ? '0 natija' : `${(page-1)*PAGE_SIZE+1} — ${Math.min(page*PAGE_SIZE, filtered.length)} / ${filtered.length}`}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn sm ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><I.ChevronLeft size={14}/></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={'btn sm ' + (page === p ? '' : 'ghost')}
                style={{ minWidth: 32, justifyContent: 'center', ...(page === p ? { background: 'var(--brand-navy)', color: 'white', borderColor: 'var(--brand-navy)' } : {}) }}
                onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="btn sm ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><I.ChevronRight size={14}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentProfile({ studentId, onBack }) {
  const I = Icon;
  const [info, setInfo] = React.useState(null);
  const [transactions, setTransactions] = React.useState([]);
  const [gateLogs, setGateLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState('overview');

  React.useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    Promise.all([
      apiGetStudentFullInfo(studentId),
      apiGetStudentTransactions(studentId),
      apiGetStudentGateLogs(studentId),
    ]).then(([infoRes, txRes, gateRes]) => {
      setInfo(infoRes?.data || null);
      setTransactions(txRes?.data || []);
      setGateLogs(gateRes?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;
  if (!info) return <div className="empty" style={{ padding: 48 }}>O'quvchi topilmadi</div>;

  const s = info.student;
  const group = info.group;
  const coach = info.coach;
  const contract = info.contract;
  const attendances = info.attendances || [];
  const name = fullName(s);
  const age = calcAge(s.date_of_birth);

  const presentCount = attendances.filter(a => a.status === 'present').length;
  const absentCount = attendances.filter(a => a.status === 'absent').length;
  const lateCount = attendances.filter(a => a.status === 'late').length;

  return (
    <div>
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 14 }}><I.ArrowLeft size={14}/> O'quvchilar ro'yxati</button>

      <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: 90, background: 'linear-gradient(120deg, #0F1F4D 0%, #1B3A6F 100%)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 14, right: 16, display: 'flex', gap: 8 }}>
            <button className="btn sm"><I.Edit size={13}/> Tahrirlash</button>
            {contract && <button className="btn sm"><I.FileText size={13}/> Shartnoma</button>}
            <button className="icon-btn" style={{ width: 32, height: 32 }}><I.More size={15}/></button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, padding: '0 22px 18px', marginTop: -42 }}>
          <div className="avatar xl" style={{ background: avatarColor(s.id), border: '4px solid var(--surface)', fontSize: 28 }}>
            {s.first_name[0]}{s.last_name[0]}
          </div>
          <div style={{ flex: 1, paddingBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>{name}</h1>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 13, color: 'var(--muted)', flexWrap: 'wrap' }}>
              <span>#{String(s.id).padStart(4, '0')}</span>
              <span>·</span>
              <span>{age} yosh ({s.date_of_birth})</span>
              {group && <><span>·</span><span>{group.name}</span></>}
              {coach && <><span>·</span><span>Murabbiy: {coach.full_name}</span></>}
            </div>
          </div>
          <div style={{ paddingBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            {s.status === 'active' && <span className="chip success"><span className="chip-dot"></span>Faol o'quvchi</span>}
            {attendances.length > 0 && (
              <span className="chip navy">Davomat {Math.round((presentCount / attendances.length) * 100)}%</span>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="tabs">
          {[
            { id: 'overview', label: 'Umumiy' },
            { id: 'attendance', label: 'Davomat' },
            { id: 'contract', label: 'Shartnoma' },
            { id: 'transactions', label: "To'lovlar" },
            { id: 'gatelogs', label: 'Darvoza' },
            { id: 'files', label: 'Fayllar' },
          ].map(t => (
            <div key={t.id} className={'tab' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>
              {t.label}
            </div>
          ))}
        </div>

        {tab === 'overview' && (
          <div style={{ padding: 22, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 22 }}>
            <div>
              <div className="card-title" style={{ marginBottom: 14 }}>Shaxsiy ma'lumotlar</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                {[
                  ['Tug\'ilgan sana', s.date_of_birth],
                  ['Millati', s.millati || '—'],
                  ['Qon guruhi', s.ampula || '—'],
                  ["Bo'yi / vazni", `${s.height} sm · ${s.weight} kg`],
                  ['PNFL', s.pnfl],
                  ['Telefon', s.phone || '—'],
                  ['Manzil', s.address || '—'],
                  ["Qo'shilgan", s.created_at ? s.created_at.slice(0, 10) : '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 13.5, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="card-title" style={{ marginBottom: 14 }}>Tezkor statistika</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { l: 'Jami trening', v: String(attendances.length), sub: 'shu mavsumda' },
                  { l: 'Kelgan / Kelmagan', v: `${presentCount}/${absentCount}`, sub: 'davomat' },
                  { l: 'Kechikishlar', v: String(lateCount), sub: "so'nggi qaydlar" },
                  { l: "Joriy oy to'lovi", v: contract ? `${contract.monthly_fee.toLocaleString()} so'm` : '—', sub: "shartnoma" },
                ].map(it => (
                  <div key={it.l} style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{it.l}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{it.sub}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{it.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'attendance' && (
          <div style={{ padding: 22 }}>
            <div className="card-title" style={{ marginBottom: 14 }}>So'nggi {Math.min(attendances.length, 14)} trening</div>
            {attendances.length === 0 && <div className="empty">Hech qanday davomat qayd etilmagan</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 6 }}>
              {attendances.slice(0, 14).map((a, i) => {
                const color = a.status === 'present' ? 'var(--success)' : a.status === 'absent' ? 'var(--brand-red)' : 'var(--brand-gold)';
                const label = a.status === 'present' ? '✓' : a.status === 'absent' ? '✗' : 'L';
                return (
                  <div key={i} title={a.status} style={{ aspectRatio: '1', borderRadius: 6, background: color, opacity: 0.85, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                    {label}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 16, fontSize: 12.5 }}>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>● Kelgan {presentCount}</span>
              <span style={{ color: 'var(--brand-gold)', fontWeight: 600 }}>● Kechikkan {lateCount}</span>
              <span style={{ color: 'var(--brand-red)', fontWeight: 600 }}>● Kelmagan {absentCount}</span>
            </div>
          </div>
        )}

        {tab === 'contract' && (
          <div style={{ padding: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <div className="card-title" style={{ marginBottom: 14 }}>Joriy shartnoma</div>
              {!contract && <div className="empty">Shartnoma topilmadi</div>}
              {contract && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['Raqami', contract.contract_number],
                    ['Status', <span className="chip success" key="s"><span className="chip-dot"></span>Faol</span>],
                    ['Boshlanishi', contract.start_date || '—'],
                    ['Tugashi', contract.end_date || '—'],
                    ["Oylik to'lov", `${contract.monthly_fee.toLocaleString()} so'm`],
                  ].map(([k, v], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--muted)', fontSize: 13 }}>{k}</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn"><I.Download size={14}/> PDF yuklab olish</button>
                <button className="btn ghost"><I.Edit size={14}/> Tahrirlash</button>
              </div>
            </div>
            <div>
              <div className="card-title" style={{ marginBottom: 14 }}>Mijoz (ota-ona)</div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14, fontSize: 13.5 }}>
                {contract?.custom_fields ? (
                  <>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{contract.custom_fields.customer_full_name || '—'}</div>
                    <div style={{ color: 'var(--muted)', marginBottom: 8 }}>Pasport: {contract.custom_fields.customer_passport_number || '—'}</div>
                    <div style={{ color: 'var(--muted)' }}>{contract.custom_fields.customer_address || '—'}</div>
                  </>
                ) : <div className="empty">Ma'lumot yo'q</div>}
              </div>
            </div>
          </div>
        )}

        {tab === 'transactions' && (
          <div style={{ padding: 22 }}>
            {transactions.length === 0 && <div className="empty">To'lovlar topilmadi</div>}
            {transactions.length > 0 && (
              <table className="table" style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
                <thead>
                  <tr><th>Sana</th><th>Manba</th><th>Oylar</th><th style={{ textAlign: 'right' }}>Summa</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map(tx => (
                    <tr key={tx.id}>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{tx.paid_at ? tx.paid_at.slice(0, 10) : '—'}</td>
                      <td><span className="chip">{tx.source}</span></td>
                      <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{tx.payment_months?.join(', ') || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{tx.amount.toLocaleString()} so'm</td>
                      <td>
                        {tx.status === 'SETTLED' && <span className="chip success"><span className="chip-dot"></span>To'langan</span>}
                        {tx.status === 'UNASSIGNED' && <span className="chip warning"><span className="chip-dot"></span>Biriktirilmagan</span>}
                        {tx.status === 'CANCELLED' && <span className="chip"><span className="chip-dot"></span>Bekor</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'gatelogs' && (
          <div style={{ padding: 22 }}>
            {gateLogs.length === 0 && <div className="empty">Hech qanday log topilmadi</div>}
            {gateLogs.slice(0, 20).map(log => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: log.direction === 'in' ? 'var(--success-soft)' : 'var(--accent-soft)',
                  color: log.direction === 'in' ? 'var(--success)' : 'var(--brand-red)' }}>
                  {log.direction === 'in' ? <I.Login size={15}/> : <I.Logout size={15}/>} 
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{log.direction === 'in' ? 'Kirish' : 'Chiqish'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{log.method === 'face' ? 'Yuz aniqlash' : "Qo'lda kiritish"} · {log.allowed ? 'ruxsat berildi' : 'rad etildi'}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{log.timestamp}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'files' && (
          <div style={{ padding: 22, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { name: 'Profil rasmi', url: s.photo_url, icon: 'Camera', size: s.photo_url ? 'Mavjud' : "Yo'q" },
              { name: 'Pasport nusxasi', url: s.passport_url, icon: 'File', size: s.passport_url ? 'Mavjud' : "Yo'q" },
              { name: "Qo'shimcha fayl", url: s.extra_file_url, icon: 'FileText', size: s.extra_file_url ? 'Mavjud' : "Yo'q" },
            ].map((f, i) => {
              const Ic = I[f.icon];
              return (
                <div key={i} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: f.url ? 'var(--success-soft)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.url ? 'var(--success)' : 'var(--muted)' }}>
                    <Ic size={20}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{f.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{f.size}</div>
                  </div>
                  {f.url && <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => window.open(f.url, '_blank')}><I.Download size={13}/></button>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function StudentNew({ onBack, onCreated }) {
  const I = Icon;
  const [groups, setGroups] = React.useState([]);
  const [step, setStep] = React.useState(1);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const steps = ["O'quvchi ma'lumotlari", 'Ota-ona va shartnoma', 'Fayllar va tasdiqlash'];

  const [form, setForm] = React.useState({
    first_name: '', last_name: '', date_of_birth: '', height: '', weight: '',
    pnfl: '', phone: '', ampula: 'O(+)', millati: "O'zbek", address: '', group_id: '',
    customer_full_name: '', customer_passport_number: '', customer_address: '',
    monthly_fee_amount: '500000', uniform_fee_amount: '',
    contract_start_date: new Date().toISOString().slice(0, 10),
    contract_end_date: new Date().getFullYear() + '-12-31',
  });
  const [files, setFiles] = React.useState({ photo: null, passport: null, extra_file: null });

  function setF(field, value) { setForm(p => ({ ...p, [field]: value })); }

  React.useEffect(() => {
    apiGetGroups({ page_size: 100 }).then(res => setGroups(res?.data || [])).catch(() => {});
  }, []);

  async function handleSubmit() {
    setError('');
    if (!form.first_name || !form.last_name || !form.date_of_birth || !form.pnfl) {
      setError('Ism, familiya, tug\'ilgan sana va PNFL majburiy');
      return;
    }
    if (!form.customer_full_name || !form.monthly_fee_amount) {
      setError('Mijoz ismi va oylik to\'lov majburiy');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      const studentFields = ['first_name', 'last_name', 'date_of_birth', 'height', 'weight', 'pnfl', 'phone', 'ampula', 'millati', 'address', 'group_id'];
      studentFields.forEach(k => { if (form[k]) fd.append(k, form[k]); });
      const contractFields = ['customer_full_name', 'customer_passport_number', 'customer_address', 'monthly_fee_amount', 'uniform_fee_amount', 'contract_start_date', 'contract_end_date'];
      contractFields.forEach(k => { if (form[k]) fd.append(k, form[k]); });
      if (files.photo) fd.append('photo', files.photo);
      if (files.passport) fd.append('passport_file', files.passport);
      if (files.extra_file) fd.append('extra_file', files.extra_file);
      await apiCreateStudent(fd);
      onCreated?.();
    } catch (e) {
      setError(e.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 14 }}><I.ArrowLeft size={14}/> Orqaga</button>
      <div className="page-head">
        <div>
          <h1 className="page-title">Yangi o'quvchi qo'shish</h1>
          <div className="page-sub">O'quvchi va shartnoma bir vaqtda yaratiladi · POST /students</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 22, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 6 }}>
        {steps.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div key={n} onClick={() => setStep(n)} style={{ flex: 1, padding: '10px 14px', borderRadius: 6, background: active ? 'var(--selected)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: done ? 'var(--success)' : active ? 'var(--brand-navy)' : 'var(--surface-2)', color: done || active ? 'white' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                {done ? <I.Check size={14}/> : n}
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>Qadam {n}</div>
                <div style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 24 }}>
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div className="field"><label>Ism <span className="req">*</span></label><input value={form.first_name} onChange={e => setF('first_name', e.target.value)} placeholder="Ali"/></div>
              <div className="field"><label>Familiya <span className="req">*</span></label><input value={form.last_name} onChange={e => setF('last_name', e.target.value)} placeholder="Karimov"/></div>
              <div className="field"><label>Tug'ilgan sana <span className="req">*</span></label><input type="date" value={form.date_of_birth} onChange={e => setF('date_of_birth', e.target.value)}/></div>
              <div className="field"><label>Bo'yi (sm) <span className="req">*</span></label><input type="number" value={form.height} onChange={e => setF('height', e.target.value)} placeholder="140"/></div>
              <div className="field"><label>Vazn (kg) <span className="req">*</span></label><input type="number" value={form.weight} onChange={e => setF('weight', e.target.value)} placeholder="35"/></div>
              <div className="field"><label>PNFL <span className="req">*</span></label><input maxLength={14} value={form.pnfl} onChange={e => setF('pnfl', e.target.value)} placeholder="14 ta raqam"/></div>
              <div className="field"><label>Telefon</label><input value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+998 90 123 45 67"/></div>
              <div className="field"><label>Qon guruhi</label>
                <select value={form.ampula} onChange={e => setF('ampula', e.target.value)}>
                  <option>O(+)</option><option>A(+)</option><option>B(+)</option><option>AB(+)</option>
                </select>
              </div>
              <div className="field"><label>Millati</label><input value={form.millati} onChange={e => setF('millati', e.target.value)} placeholder="O'zbek"/></div>
              <div className="field" style={{ gridColumn: 'span 2' }}><label>Manzil</label><input value={form.address} onChange={e => setF('address', e.target.value)} placeholder="Toshkent sh., Chilonzor t."/></div>
              <div className="field"><label>Guruh</label>
                <select value={form.group_id} onChange={e => setF('group_id', e.target.value)}>
                  <option value="">Tanlanmagan</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
          )}
          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field" style={{ gridColumn: 'span 2' }}><label>Mijoz to'liq ismi (ota-ona) <span className="req">*</span></label><input value={form.customer_full_name} onChange={e => setF('customer_full_name', e.target.value)} placeholder="Karimov Ravshan Akmalovich"/></div>
              <div className="field"><label>Pasport raqami</label><input value={form.customer_passport_number} onChange={e => setF('customer_passport_number', e.target.value)} placeholder="AB 1234567"/></div>
              <div className="field"><label>Manzil</label><input value={form.customer_address} onChange={e => setF('customer_address', e.target.value)} placeholder="Toshkent sh., Chilonzor t."/></div>
              <div className="field"><label>Oylik to'lov (so'm) <span className="req">*</span></label><input type="number" value={form.monthly_fee_amount} onChange={e => setF('monthly_fee_amount', e.target.value)} placeholder="500000"/></div>
              <div className="field"><label>Forma to'lovi (so'm)</label><input type="number" value={form.uniform_fee_amount} onChange={e => setF('uniform_fee_amount', e.target.value)} placeholder="0"/></div>
              <div className="field"><label>Shartnoma boshlanishi</label><input type="date" value={form.contract_start_date} onChange={e => setF('contract_start_date', e.target.value)}/></div>
              <div className="field"><label>Shartnoma tugashi</label><input type="date" value={form.contract_end_date} onChange={e => setF('contract_end_date', e.target.value)}/></div>
            </div>
          )}
          {step === 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[
                { key: 'photo', label: 'Profil rasmi', desc: 'JPG yoki PNG · 2 MB gacha', icon: 'Camera' },
                { key: 'passport', label: 'Pasport nusxasi', desc: 'PDF yoki rasm', icon: 'File' },
                { key: 'extra_file', label: "Qo'shimcha fayl", desc: 'Ixtiyoriy', icon: 'FileText' },
              ].map(f => {
                const Ic = I[f.icon];
                return (
                  <div key={f.key} className="dropzone" style={{ minHeight: 160 }}>
                    <Ic size={28}/>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{f.label}</div>
                    <div>{files[f.key] ? files[f.key].name : f.desc}</div>
                    <label className="btn sm" style={{ marginTop: 6, cursor: 'pointer' }}>
                      <I.Upload size={13}/> Yuklash
                      <input type="file" style={{ display: 'none' }} onChange={e => setFiles(p => ({ ...p, [f.key]: e.target.files[0] || null }))}/>
                    </label>
                  </div>
                );
              })}
              <div style={{ gridColumn: 'span 3', padding: 14, background: 'var(--success-soft)', color: 'var(--success)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                <I.Check size={18}/>
                <div>
                  <div style={{ fontWeight: 600 }}>Tayyor</div>
                  <div style={{ opacity: 0.85 }}>O'quvchi va shartnoma serverda yaratiladi, shartnoma PDFi avtomatik tayyorlanadi.</div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--accent-soft)', border: '1px solid var(--brand-red)', borderRadius: 8, fontSize: 13, color: 'var(--brand-red)' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <button className="btn ghost" onClick={onBack}>Bekor qilish</button>
            <div style={{ flex: 1 }}></div>
            {step > 1 && <button className="btn" onClick={() => setStep(step - 1)}><I.ArrowLeft size={14}/> Oldingi</button>}
            {step < 3 && <button className="btn primary" onClick={() => setStep(step + 1)}>Keyingi <I.ArrowRight size={14}/></button>}
            {step === 3 && (
              <button className="btn primary" onClick={handleSubmit} disabled={saving}>
                <I.Check size={14}/> {saving ? 'Yuklanmoqda...' : "O'quvchini yaratish"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
