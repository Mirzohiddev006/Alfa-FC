// @ts-nocheck
import React from 'react';
import { Icon } from './icons';
import {
  apiGetContracts,
  apiGetContract,
  apiGetContractPdf,
  apiRegenerateContractPdf,
  apiGetContractStats,
  apiTerminateContract,
  apiPatchContractMonthlyFee,
  apiPatchContractDates,
  apiPatchContractStatus,
  apiGetGateLogs,
  apiGetGroups,
  apiGetUsers,
  apiCreateUser,
  apiUpdateUser,
  apiDeleteUser,
  apiUpdateUserRoles,
  apiGetRoles,
  apiCreateRole,
  apiUpdateRole,
  apiDeleteRole,
  apiGetPermissions,
  apiGetSettings,
  apiUpdateSettings,
  apiGetArchiveStats,
  apiArchiveYear,
  apiUnarchiveYear,
  apiTriggerManualBackup,
  apiGetBackupStatus,
  apiGetTransactions,
  apiGetTransactionsWithName,
  apiGetTransaction,
  apiGetUnassignedTransactions,
  apiGetTransactionStats,
  apiCreateManualTransaction,
  apiCancelTransaction,
  apiAssignTransaction,
  apiGetReportsSummary,
  apiGetAttendanceGroupsReport,
  apiGetReportsTerminatedSummary,
  apiGetDebtors,
  apiGetFinanceReport,
  apiDebtorsExportUrl,
  apiPayersExportUrl,
  apiPaymentsExcelUrl,
  apiDownloadPaymentsExcel,
  apiGetWaitingList,
  apiCreateWaitingList,
  apiUpdateWaitingList,
  apiDeleteWaitingList,
  apiGetStudent,
} from './api';

const fmt = new Intl.NumberFormat('uz-UZ');

function Stat({ label, value, sub, tone = 'default', icon: Ic }) {
  const toneStyle = {
    default: { bg: 'var(--surface)', border: 'var(--border)', val: 'var(--text)' },
    success: { bg: 'var(--success-soft)', border: 'transparent', val: 'var(--success)' },
    warning: { bg: 'var(--warning-soft)', border: 'transparent', val: 'var(--warning)' },
    danger: { bg: 'var(--accent-soft)', border: 'transparent', val: 'var(--brand-red)' },
    navy: { bg: 'rgba(15,31,77,0.08)', border: 'transparent', val: 'var(--brand-navy)' },
  }[tone] || { bg: 'var(--surface)', border: 'var(--border)', val: 'var(--text)' };

  return (
    <div className="stat" style={{ background: toneStyle.bg, borderColor: toneStyle.border }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div className="stat-label">{label}</div>
        {Ic && <Ic size={15} color={toneStyle.val} />}
      </div>
      <div className="stat-value" style={{ color: toneStyle.val }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function statusChip(status) {
  const s = (status || '').toUpperCase();
  if (s === 'ACTIVE') return <span className="chip success"><span className="chip-dot"></span>Faol</span>;
  if (s === 'TERMINATED') return <span className="chip danger"><span className="chip-dot"></span>Bekor</span>;
  if (s === 'EXPIRED') return <span className="chip warning"><span className="chip-dot"></span>Tugagan</span>;
  if (s === 'ARCHIVED') return <span className="chip"><span className="chip-dot"></span>Arxiv</span>;
  return <span className="chip">{status || '—'}</span>;
}

// ─── Contracts ───────────────────────────────────────────────────────────────

export function ContractsScreen({ onOpenContract }) {
  const I = Icon;
  const [contracts, setContracts] = React.useState([]);
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [openMenuContractId, setOpenMenuContractId] = React.useState(null);
  const [menuPos, setMenuPos] = React.useState({ x: 0, y: 0 });
  const [terminating, setTerminating] = React.useState(null);
  const [terminateReason, setTerminateReason] = React.useState('');
  const [terminateModal, setTerminateModal] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.allSettled([
        apiGetContracts({ page_size: 200 }),
        apiGetContractStats(),
      ]);
      setContracts(cRes.status === 'fulfilled' ? (cRes.value?.data || []) : []);
      setStats(sRes.status === 'fulfilled' ? (sRes.value?.data || null) : null);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  React.useEffect(() => {
    const closeMenu = () => setOpenMenuContractId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const rows = contracts.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const num = (c.contract_number || '').toLowerCase();
      const sid = String(c.student_id || '');
      if (!num.includes(q) && !sid.includes(q)) return false;
    }
    return true;
  });

  async function openTerminate(contract) {
    setTerminating(contract);
    setTerminateReason('');
    setTerminateModal(true);
    setOpenMenuContractId(null);
  }

  async function confirmTerminate() {
    if (!terminating || !terminateReason.trim()) return;
    try {
      await apiTerminateContract(terminating.id, { termination_reason: terminateReason });
      setTerminateModal(false);
      load();
    } catch (e) {
      alert('Bekor qilish xatosi: ' + e.message);
    }
  }

  function handleExport() {
    window.open(apiPaymentsExcelUrl(), '_blank', 'noopener,noreferrer');
  }

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Shartnomalar</h1>
          <div className="page-sub">{contracts.length} ta shartnoma</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={handleExport}><I.Download size={15} /> Export</button>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 14 }}>
          <Stat label="Jami" value={stats.total || 0} icon={I.FileText} />
          <Stat label="Faol" value={stats.active || 0} tone="success" icon={I.Check} />
          <Stat label="Bekor qilingan" value={stats.terminated || 0} tone="danger" icon={I.XCircle} />
          <Stat label="Tugagan" value={stats.expired || 0} tone="warning" icon={I.Clock} />
          <Stat label="Jami oylik" value={`${fmt.format(stats.total_monthly_fee || 0)} so'm`} tone="navy" icon={I.Wallet} />
        </div>
      )}

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="search" style={{ maxWidth: 320 }}>
            <span className="icon-l"><I.Search size={15} /></span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Shartnoma raqami..." />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}
          >
            <option value="all">Barcha statuslar</option>
            <option value="ACTIVE">Faol</option>
            <option value="TERMINATED">Bekor qilingan</option>
            <option value="EXPIRED">Tugagan</option>
            <option value="ARCHIVED">Arxivlangan</option>
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--muted)' }}>{rows.length} natija</div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Shartnoma №</th>
              <th>O'quvchi ID</th>
              <th>Mijoz</th>
              <th>Davr</th>
              <th>Oylik to'lov</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 18, color: 'var(--muted)' }}>Shartnoma topilmadi</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} onClick={() => onOpenContract?.(c.id)} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 700 }}>{c.contract_number}</td>
                <td style={{ color: 'var(--text-2)' }}>#{c.student_id || '—'}</td>
                <td style={{ color: 'var(--text-2)' }}>{c.custom_fields?.customer_full_name || '—'}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12.5 }}>
                  {c.start_date || '—'} <span style={{ color: 'var(--muted)' }}>→</span> {c.end_date || '—'}
                </td>
                <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt.format(c.monthly_fee || 0)} so'm</td>
                <td>{statusChip(c.status)}</td>
                <td style={{ position: 'relative' }}>
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={(e) => {
                    e.stopPropagation();
                    if (openMenuContractId === c.id) {
                      setOpenMenuContractId(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuPos({ x: rect.right - 160, y: rect.bottom + 4 });
                      setOpenMenuContractId(c.id);
                    }
                  }}><I.More size={15} /></button>
                  {openMenuContractId === c.id && (
                    <div style={{ position: 'fixed', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 9999, minWidth: 160, top: menuPos.y, left: menuPos.x }} onClick={e => e.stopPropagation()}>
                      <button style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => { onOpenContract?.(c.id); setOpenMenuContractId(null); }}>
                        <I.Eye size={14} /> Ko'rish
                      </button>
                      {c.status === 'ACTIVE' && (
                        <button style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-red)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => openTerminate(c)}>
                          <I.XCircle size={14} /> Bekor qilish
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {terminateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setTerminateModal(false)}>
          <div className="card" style={{ width: 440, padding: 18 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Shartnomani bekor qilish</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setTerminateModal(false)}><I.X size={15} /></button>
            </div>
            <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--muted)' }}>Shartnoma: <strong>{terminating?.contract_number}</strong></div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Bekor qilish sababi *</label>
              <textarea rows={3} value={terminateReason} onChange={e => setTerminateReason(e.target.value)} placeholder="Sababni kiriting..." />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost" onClick={() => setTerminateModal(false)}>Bekor</button>
              <button className="btn" style={{ background: 'var(--brand-red)', color: '#fff', border: 'none' }} onClick={confirmTerminate} disabled={!terminateReason.trim()}>
                <I.XCircle size={14} /> Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ContractView({ contractId, onBack }) {
  const I = Icon;
  const [contract, setContract] = React.useState(null);
  const [student, setStudent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [regenerating, setRegenerating] = React.useState(false);
  const [terminateModal, setTerminateModal] = React.useState(false);
  const [terminateReason, setTerminateReason] = React.useState('');
  const [feeModal, setFeeModal] = React.useState(false);
  const [newFee, setNewFee] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  async function load() {
    if (!contractId) return;
    setLoading(true);
    try {
      const res = await apiGetContract(contractId);
      const c = res?.data || null;
      setContract(c);
      if (c?.student_id) {
        apiGetStudent(c.student_id).then(sr => setStudent(sr?.data || null)).catch(() => {});
      }
    } catch { }
    finally { setLoading(false); }
  }

  React.useEffect(() => { load(); }, [contractId]);

  async function openPdf() {
    try {
      const blob = await apiGetContractPdf(contractId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      alert('PDF ochilmadi: ' + e.message);
    }
  }

  async function regenerate() {
    try {
      setRegenerating(true);
      await apiRegenerateContractPdf(contractId);
      await openPdf();
    } catch (e) {
      alert('Qayta generatsiya xatosi: ' + e.message);
    } finally {
      setRegenerating(false);
    }
  }

  async function confirmTerminate() {
    if (!terminateReason.trim()) return;
    setSaving(true);
    try {
      await apiTerminateContract(contractId, { termination_reason: terminateReason });
      setTerminateModal(false);
      load();
    } catch (e) {
      alert('Xatolik: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveFee() {
    if (!newFee) return;
    setSaving(true);
    try {
      await apiPatchContractMonthlyFee(contractId, { monthly_fee_amount: Number(newFee) });
      setFeeModal(false);
      load();
    } catch (e) {
      alert('Xatolik: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;
  if (!contract) return <div className="empty" style={{ padding: 48 }}>Shartnoma topilmadi</div>;

  const cf = contract.custom_fields || {};
  const studentName = student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : `#${contract.student_id || '—'}`;

  return (
    <div>
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 14 }}><I.ArrowLeft size={14} /> Shartnomalar</button>
      <div className="page-head">
        <div>
          <h1 className="page-title">{contract.contract_number}</h1>
          <div className="page-sub">Shartnoma ma'lumotlari va PDF</div>
        </div>
        <div className="page-actions">
          {contract.status === 'ACTIVE' && (
            <button className="btn ghost" onClick={() => { setTerminateReason(''); setTerminateModal(true); }} style={{ color: 'var(--brand-red)', borderColor: 'var(--brand-red)' }}>
              <I.XCircle size={15} /> Bekor qilish
            </button>
          )}
          {contract.status === 'ACTIVE' && (
            <button className="btn ghost" onClick={() => { setNewFee(String(contract.monthly_fee || '')); setFeeModal(true); }}>
              <I.Edit size={15} /> Oylik to'lovni o'zgartirish
            </button>
          )}
          <button className="btn" onClick={openPdf}><I.FileText size={15} /> PDF ochish</button>
          <button className="btn primary" onClick={regenerate} disabled={regenerating}>
            <I.RefreshCw size={15} /> {regenerating ? 'Yuklanmoqda...' : 'PDF qayta yaratish'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Asosiy ma'lumotlar</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Shartnoma raqami', contract.contract_number],
              ['Status', statusChip(contract.status)],
              ["O'quvchi", studentName],
              ['Mijoz', cf.customer_full_name || '—'],
              ['Boshlanish sanasi', contract.start_date || '—'],
              ['Tugash sanasi', contract.end_date || '—'],
              ["Oylik to'lov", `${fmt.format(contract.monthly_fee || 0)} so'm`],
              ['Shartnoma yili', contract.contract_year || '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>{k}</div>
                <div style={{ fontSize: 13.5, marginTop: 4, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Qo'shimcha</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Pasport', cf.customer_passport_number || '—'],
              ['Manzil', cf.customer_address || '—'],
              ["Tug'ilish yili", contract.birth_year || '—'],
              ['Yaratilgan', (contract.created_at || '').slice(0, 19).replace('T', ' ') || '—'],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{l}</div>
                <div style={{ fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          {contract.termination_reason && (
            <div style={{ marginTop: 10, padding: 10, background: 'var(--accent-soft)', borderRadius: 8, border: '1px solid var(--brand-red)' }}>
              <div style={{ fontSize: 11, color: 'var(--brand-red)', fontWeight: 700 }}>Bekor qilish sababi</div>
              <div style={{ fontSize: 13 }}>{contract.termination_reason}</div>
            </div>
          )}
        </div>
      </div>

      {terminateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setTerminateModal(false)}>
          <div className="card" style={{ width: 440, padding: 18 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Shartnomani bekor qilish</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setTerminateModal(false)}><I.X size={15} /></button>
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Bekor qilish sababi *</label>
              <textarea rows={3} value={terminateReason} onChange={e => setTerminateReason(e.target.value)} placeholder="Sababni kiriting..." />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost" onClick={() => setTerminateModal(false)}>Bekor</button>
              <button className="btn" style={{ background: 'var(--brand-red)', color: '#fff', border: 'none' }} onClick={confirmTerminate} disabled={saving || !terminateReason.trim()}>
                {saving ? 'Yuklanmoqda...' : 'Bekor qilish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {feeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setFeeModal(false)}>
          <div className="card" style={{ width: 380, padding: 18 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Oylik to'lovni o'zgartirish</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setFeeModal(false)}><I.X size={15} /></button>
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Yangi oylik to'lov (so'm) *</label>
              <input type="number" value={newFee} onChange={e => setNewFee(e.target.value)} placeholder="500000" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost" onClick={() => setFeeModal(false)}>Bekor</button>
              <button className="btn primary" onClick={saveFee} disabled={saving || !newFee}>
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Gate ────────────────────────────────────────────────────────────────────

export function GateLogsScreen() {
  const I = Icon;
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState('today');

  React.useEffect(() => {
    setLoading(true);
    apiGetGateLogs({ page_size: 200 })
      .then((res) => setLogs(res?.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const rows = logs.filter((l) => {
    if (period === 'all') return true;
    const d = (l.timestamp || l.created_at || '').slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    if (period === 'today') return d === today;
    const w = new Date();
    w.setDate(w.getDate() - 7);
    if (period === 'week') return d >= w.toISOString().slice(0, 10);
    return true;
  });

  const inCount = rows.filter((l) => l.direction === 'in' || l.allowed === true).length;
  const outCount = rows.filter((l) => l.direction === 'out').length;
  const denied = rows.filter((l) => l.allowed === false).length;

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Darvoza loglari</h1>
          <div className="page-sub">{rows.length} ta hodisa</div>
        </div>
        <div className="page-actions">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}>
            <option value="today">Bugun</option>
            <option value="week">So'nggi 7 kun</option>
            <option value="all">Hammasi</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
        <Stat label="Kirishlar / Ruxsat" value={inCount} tone="success" icon={I.LogIn} />
        <Stat label="Chiqishlar" value={outCount} tone="navy" icon={I.LogOut} />
        <Stat label="Rad etilgan" value={denied} tone="danger" icon={I.ShieldOff} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {rows.length === 0 && <div className="empty">Log topilmadi</div>}
        {rows.map((l, idx) => (
          <div key={l.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: l.allowed !== false ? 'var(--success-soft)' : 'var(--accent-soft)', color: l.allowed !== false ? 'var(--success)' : 'var(--brand-red)', display: 'grid', placeItems: 'center' }}>
              {l.allowed !== false ? <I.LogIn size={16} /> : <I.ShieldOff size={16} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{l.student_name || `O'quvchi #${l.student_id || '—'}`}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {l.allowed !== false ? 'Ruxsat' : 'Rad etilgan'}
                {l.face_id && ` · Face ID: ${l.face_id}`}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
              {(l.timestamp || l.created_at || '').replace('T', ' ').slice(0, 19)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const GateScreen = GateLogsScreen;

// ─── Users ────────────────────────────────────────────────────────────────────

const ALL_PERMS = [
  { code: 'students:view', label: "O'quvchilarni ko'rish" },
  { code: 'students:edit', label: "O'quvchilarni tahrirlash" },
  { code: 'groups:view', label: "Guruhlarni ko'rish" },
  { code: 'groups:edit', label: 'Guruhlarni tahrirlash' },
  { code: 'attendance:coach:mark', label: 'Davomat belgilash' },
  { code: 'attendance:view', label: "Davomatni ko'rish" },
  { code: 'sessions:create', label: 'Sessiya yaratish' },
  { code: 'sessions:manage', label: 'Sessiyalarni boshqarish' },
  { code: 'reports:dashboard:view', label: 'Dashboard' },
  { code: 'reports:attendance:view', label: 'Davomat hisobotlari' },
  { code: 'settings:system:view', label: "Sozlamalarni ko'rish" },
  { code: 'settings:system:edit', label: 'Sozlamalarni tahrirlash' },
  { code: 'roles:manage', label: 'Rollarni boshqarish' },
  { code: 'users:manage', label: 'Foydalanuvchilarni boshqarish' },
  { code: 'gate:logs:view', label: "Darvoza loglarini ko'rish" },
  { code: 'contracts:view', label: "Shartnomalarni ko'rish" },
  { code: 'contracts:edit', label: 'Shartnomalarni tahrirlash' },
  { code: 'finance:transactions:view', label: "To'lovlarni ko'rish" },
  { code: 'finance:transactions:manual', label: "Qo'lda to'lov kiritish" },
  { code: 'finance:transactions:cancel', label: "To'lovni bekor qilish" },
  { code: 'finance:unassigned:view', label: "Biriktirilmagan to'lovlar" },
  { code: 'finance:unassigned:assign', label: "To'lovlarni biriktirish" },
];

export function UsersScreen({ initialView = 'users', onToast } = {}) {
  const I = Icon;
  const [users, setUsers] = React.useState([]);
  const [roles, setRoles] = React.useState([]);
  const [permissions, setPermissions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState(initialView);

  // Role form
  const [newRole, setNewRole] = React.useState({ name: '', description: '', permission_ids: [] });
  const [editingRole, setEditingRole] = React.useState(null);

  // User create modal
  const [showCreateUser, setShowCreateUser] = React.useState(false);
  const [userForm, setUserForm] = React.useState({ full_name: '', phone: '', email: '', password: '', status: 'active', is_super_admin: false, role_ids: [] });
  const [savingUser, setSavingUser] = React.useState(false);

  // Menus
  const [openMenuUserId, setOpenMenuUserId] = React.useState(null);
  const [deletingUserId, setDeletingUserId] = React.useState(null);
  const [menuPos, setMenuPos] = React.useState({ x: 0, y: 0 });

  async function load() {
    setLoading(true);
    try {
      const [uRes, rRes, pRes] = await Promise.allSettled([
        apiGetUsers({ page_size: 200 }),
        apiGetRoles(),
        apiGetPermissions(),
      ]);
      setUsers(uRes.status === 'fulfilled' ? (uRes.value?.data || []) : []);
      setRoles(rRes.status === 'fulfilled' ? (rRes.value?.data || []) : []);
      setPermissions(pRes.status === 'fulfilled' ? (pRes.value?.data || []) : []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  React.useEffect(() => {
    const closeMenu = () => setOpenMenuUserId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Role CRUD
  async function createRole() {
    if (!newRole.name.trim()) { onToast?.('Rol nomi kiritilmagan'); return; }
    try {
      await apiCreateRole({ name: newRole.name, description: newRole.description, permission_ids: newRole.permission_ids });
      setNewRole({ name: '', description: '', permission_ids: [] });
      onToast?.('Rol yaratildi');
      load();
    } catch (e) {
      onToast?.('Xatolik: ' + e.message);
    }
  }

  function openEditRole(role) {
    setEditingRole({
      ...role,
      permission_ids: (role.permissions || []).map(p => p.id),
    });
  }

  async function saveEditRole() {
    if (!editingRole) return;
    try {
      await apiUpdateRole(editingRole.id, { name: editingRole.name, description: editingRole.description, permission_ids: editingRole.permission_ids });
      setEditingRole(null);
      onToast?.('Rol yangilandi');
      load();
    } catch (e) {
      onToast?.('Xatolik: ' + e.message);
    }
  }

  async function removeRole(roleId) {
    if (!confirm("Rostdan ham o'chirasizmi?")) return;
    try {
      await apiDeleteRole(roleId);
      onToast?.("Rol o'chirildi");
      load();
    } catch (e) {
      onToast?.('Xatolik: ' + e.message);
    }
  }

  // User CRUD
  async function deleteUser(userId) {
    if (!confirm("Foydalanuvchini o'chirasizmi?")) return;
    setDeletingUserId(userId);
    try {
      await apiDeleteUser(userId);
      setOpenMenuUserId(null);
      onToast?.("Foydalanuvchi o'chirildi");
      load();
    } catch (e) {
      onToast?.('Xatolik: ' + e.message);
    } finally {
      setDeletingUserId(null);
    }
  }

  async function createUser() {
    if (!userForm.full_name || !userForm.phone || !userForm.password) { onToast?.("Majburiy maydonlar to'ldirilmagan"); return; }
    setSavingUser(true);
    try {
      const res = await apiCreateUser({
        full_name: userForm.full_name,
        phone: userForm.phone,
        email: userForm.email || undefined,
        password: userForm.password,
        status: userForm.status,
        is_super_admin: userForm.is_super_admin,
      });
      const newUserId = res?.data?.id;
      if (newUserId && userForm.role_ids.length > 0) {
        await apiUpdateUserRoles(newUserId, userForm.role_ids.map(Number));
      }
      setShowCreateUser(false);
      setUserForm({ full_name: '', phone: '', email: '', password: '', status: 'active', is_super_admin: false, role_ids: [] });
      onToast?.('Foydalanuvchi yaratildi');
      load();
    } catch (e) {
      onToast?.('Xatolik: ' + e.message);
    } finally {
      setSavingUser(false);
    }
  }

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  const permMap = {};
  permissions.forEach(p => { permMap[p.id] = p; });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Foydalanuvchilar va rollar</h1>
          <div className="page-sub">{users.length} foydalanuvchi · {roles.length} rol</div>
        </div>
        {tab === 'users' && (
          <div className="page-actions">
            <button className="btn primary" onClick={() => setShowCreateUser(true)}><I.UserPlus size={15} /> Yangi foydalanuvchi</button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="tabs">
          <div className={'tab' + (tab === 'users' ? ' active' : '')} onClick={() => setTab('users')}>Foydalanuvchilar</div>
          <div className={'tab' + (tab === 'roles' ? ' active' : '')} onClick={() => setTab('roles')}>Rollar</div>
        </div>
      </div>

      {tab === 'users' && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>F.I.O.</th><th>Telefon / Email</th><th>Rol</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={5} style={{ padding: 18, color: 'var(--muted)' }}>Foydalanuvchi topilmadi</td></tr>}
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{u.phone || u.email || '—'}</td>
                  <td>
                    {u.is_super_admin
                      ? <span className="chip navy">Super Admin</span>
                      : (u.roles || []).length > 0
                        ? <span className="chip navy">{u.roles[0].name}</span>
                        : <span className="chip">—</span>
                    }
                  </td>
                  <td>{u.status === 'active' ? <span className="chip success">Faol</span> : <span className="chip">Nofaol</span>}</td>
                  <td style={{ position: 'relative', overflow: 'visible' }}>
                    <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={(e) => {
                      e.stopPropagation();
                      if (openMenuUserId === u.id) {
                        setOpenMenuUserId(null);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuPos({ x: rect.right - 140, y: rect.bottom + 4 });
                        setOpenMenuUserId(u.id);
                      }
                    }}><I.More size={15} /></button>
                    {openMenuUserId === u.id && (
                      <div style={{ position: 'fixed', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 9999, minWidth: 140, top: menuPos.y, left: menuPos.x }} onClick={e => e.stopPropagation()}>
                        {!u.is_super_admin && (
                          <button style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-red)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => deleteUser(u.id)} disabled={deletingUserId === u.id}>
                            <I.Trash2 size={14} /> {deletingUserId === u.id ? "O'chirilmoqda..." : "O'chirish"}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Rol nomi</th><th>Tavsif</th><th>Ruxsatlar</th><th></th></tr></thead>
              <tbody>
                {roles.length === 0 && <tr><td colSpan={4} style={{ padding: 18, color: 'var(--muted)' }}>Rol topilmadi</td></tr>}
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{r.description || '—'}</td>
                    <td style={{ color: 'var(--muted)' }}>{(r.permissions || []).length} ta</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => openEditRole(r)}><I.Edit size={14} /></button>
                        <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => removeRole(r.id)}><I.Trash2 size={15} color="var(--brand-red)" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Yangi rol</div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Rol nomi *</label>
              <input value={newRole.name} onChange={(e) => setNewRole((p) => ({ ...p, name: e.target.value }))} placeholder="Masalan: Menejer" />
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Tavsif</label>
              <input value={newRole.description} onChange={(e) => setNewRole((p) => ({ ...p, description: e.target.value }))} placeholder="Qisqacha tavsif" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Ruxsatlar</div>
            <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {permissions.length > 0
                ? permissions.map((p) => {
                  const checked = newRole.permission_ids.includes(p.id);
                  return (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        setNewRole((prev) => ({
                          ...prev,
                          permission_ids: e.target.checked ? [...prev.permission_ids, p.id] : prev.permission_ids.filter((x) => x !== p.id),
                        }));
                      }} />
                      <span>{p.description || p.code}</span>
                    </label>
                  );
                })
                : ALL_PERMS.map((p) => {
                  const apiPerm = permissions.find(ap => ap.code === p.code);
                  const checked = apiPerm ? newRole.permission_ids.includes(apiPerm.id) : false;
                  return (
                    <label key={p.code} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                      <input type="checkbox" checked={checked} disabled={!apiPerm} onChange={(e) => {
                        if (!apiPerm) return;
                        setNewRole((prev) => ({
                          ...prev,
                          permission_ids: e.target.checked ? [...prev.permission_ids, apiPerm.id] : prev.permission_ids.filter((x) => x !== apiPerm.id),
                        }));
                      }} />
                      {p.label}
                    </label>
                  );
                })
              }
            </div>
            <button className="btn primary" onClick={createRole}><I.Check size={14} /> Saqlash</button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setShowCreateUser(false)}>
          <div className="card" style={{ width: 520, padding: 18 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Yangi foydalanuvchi</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setShowCreateUser(false)}><I.X size={15} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>F.I.O. *</label>
                <input value={userForm.full_name} onChange={e => setUserForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Ism Familiya" />
              </div>
              <div className="field">
                <label>Telefon *</label>
                <input value={userForm.phone} onChange={e => setUserForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
              </div>
              <div className="field">
                <label>Email</label>
                <input value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
              </div>
              <div className="field">
                <label>Parol *</label>
                <input type="password" value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
              </div>
              <div className="field">
                <label>Status</label>
                <select value={userForm.status} onChange={e => setUserForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="active">Faol</option>
                  <option value="inactive">Nofaol</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Rol</label>
                <select multiple value={userForm.role_ids} onChange={e => {
                  const vals = Array.from(e.target.selectedOptions).map(o => Number(o.value));
                  setUserForm(p => ({ ...p, role_ids: vals }));
                }} style={{ height: 100 }}>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Ctrl+click bilan bir nechta tanlash mumkin</div>
              </div>
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={userForm.is_super_admin} onChange={e => setUserForm(p => ({ ...p, is_super_admin: e.target.checked }))} />
                  Super Admin
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn ghost" onClick={() => setShowCreateUser(false)}>Bekor</button>
              <button className="btn primary" onClick={createUser} disabled={savingUser}>
                {savingUser ? 'Saqlanmoqda...' : 'Yaratish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setEditingRole(null)}>
          <div className="card" style={{ width: 480, padding: 18 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Rolni tahrirlash</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setEditingRole(null)}><I.X size={15} /></button>
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Rol nomi *</label>
              <input value={editingRole.name} onChange={e => setEditingRole(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Tavsif</label>
              <input value={editingRole.description || ''} onChange={e => setEditingRole(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Ruxsatlar</div>
            <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {permissions.map((p) => {
                const checked = editingRole.permission_ids.includes(p.id);
                return (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                    <input type="checkbox" checked={checked} onChange={(e) => {
                      setEditingRole((prev) => ({
                        ...prev,
                        permission_ids: e.target.checked ? [...prev.permission_ids, p.id] : prev.permission_ids.filter((x) => x !== p.id),
                      }));
                    }} />
                    {p.description || p.code}
                  </label>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost" onClick={() => setEditingRole(null)}>Bekor</button>
              <button className="btn primary" onClick={saveEditRole}><I.Check size={14} /> Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function SettingsScreen({ theme, setTheme } = {}) {
  const I = Icon;
  const [settings, setSettings] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('general');
  const [adminYear, setAdminYear] = React.useState(new Date().getFullYear());
  const [archiveStats, setArchiveStats] = React.useState(null);
  const [backupStatus, setBackupStatus] = React.useState(null);
  const [adminLoading, setAdminLoading] = React.useState(false);

  const tabDefs = [
    { id: 'general', label: 'Umumiy', icon: I.Settings },
    { id: 'billing', label: "To'lov", icon: I.CreditCard },
    { id: 'security', label: 'Xavfsizlik', icon: I.Shield },
    { id: 'integrations', label: 'Integratsiya', icon: I.Link },
    { id: 'admin', label: 'Admin', icon: I.AlertTriangle },
  ];

  React.useEffect(() => {
    apiGetSettings()
      .then((res) => setSettings(res || {}))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (activeTab !== 'admin') return;
    setAdminLoading(true);
    Promise.allSettled([
      apiGetArchiveStats(adminYear),
      apiGetBackupStatus(),
    ]).then(([aRes, bRes]) => {
      setArchiveStats(aRes.status === 'fulfilled' ? (aRes.value?.data || null) : null);
      setBackupStatus(bRes.status === 'fulfilled' ? (bRes.value?.data || null) : null);
    }).finally(() => setAdminLoading(false));
  }, [activeTab, adminYear]);

  function setVal(k, v) { setSettings((p) => ({ ...p, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      await apiUpdateSettings(settings);
      alert('Sozlamalar saqlandi');
    } catch (e) {
      alert('Xatolik: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function runBackup() {
    try {
      await apiTriggerManualBackup();
      alert('Backup boshlandi');
    } catch (e) {
      alert('Backup xatoligi: ' + e.message);
    }
  }

  async function archiveYear(action) {
    try {
      const year = Number(adminYear);
      if (!year) return;
      if (action === 'archive') await apiArchiveYear(year);
      else await apiUnarchiveYear(year);
      const [aRes, bRes] = await Promise.allSettled([apiGetArchiveStats(year), apiGetBackupStatus()]);
      setArchiveStats(aRes.status === 'fulfilled' ? (aRes.value?.data || null) : null);
      setBackupStatus(bRes.status === 'fulfilled' ? (bRes.value?.data || null) : null);
      alert(action === 'archive' ? 'Arxivlandi' : 'Arxivdan olindi');
    } catch (e) {
      alert('Admin amali xatoligi: ' + e.message);
    }
  }

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Sozlamalar</h1>
          <div className="page-sub">Tizim parametrlarini boshqarish</div>
        </div>
        <div className="page-actions">
          <button className="btn primary" onClick={save} disabled={saving}>
            <I.Save size={15} /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 10, height: 'fit-content' }}>
          {tabDefs.map((t) => {
            const Ic = t.icon;
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', marginBottom: 6, background: active ? 'var(--selected)' : 'transparent', color: active ? 'var(--brand-navy)' : 'var(--text-2)', fontWeight: active ? 700 : 500, cursor: 'pointer' }}>
                <Ic size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="card" style={{ padding: 18 }}>
          {activeTab === 'general' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field"><label>Klub / Kompaniya nomi</label><input value={settings.club_name || settings.company_name || ''} onChange={(e) => setVal('club_name', e.target.value)} /></div>
              <div className="field"><label>INN</label><input value={settings.inn || settings.company_inn || ''} onChange={(e) => setVal('inn', e.target.value)} /></div>
              <div className="field" style={{ gridColumn: 'span 2' }}><label>Manzil</label><input value={settings.address || settings.company_address || ''} onChange={(e) => setVal('address', e.target.value)} /></div>
              <div className="field"><label>Telefon</label><input value={settings.phone || settings.company_phone || ''} onChange={(e) => setVal('phone', e.target.value)} /></div>
              <div className="field"><label>Email</label><input value={settings.email || settings.company_email || ''} onChange={(e) => setVal('email', e.target.value)} /></div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field"><label>Valyuta</label><input value={settings.currency || "so'm"} onChange={(e) => setVal('currency', e.target.value)} /></div>
              <div className="field"><label>Default oylik to'lov</label><input type="number" value={settings.monthly_fee_default || settings.default_monthly_fee || ''} onChange={(e) => setVal('monthly_fee_default', Number(e.target.value))} /></div>
              <div className="field"><label>Kechikish jarimasi %</label><input type="number" value={settings.late_fee_percent || ''} onChange={(e) => setVal('late_fee_percent', Number(e.target.value))} /></div>
              <div className="field"><label>Hisobot kuni</label><input type="number" value={settings.report_day || ''} onChange={(e) => setVal('report_day', Number(e.target.value))} /></div>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              {[
                ['allow_multiple_sessions', 'Bir foydalanuvchi uchun bir nechta sessiya ruxsat etilsin'],
                ['require_2fa_admin', 'Adminlar uchun 2FA majburiy'],
                ['ip_whitelist_enabled', 'IP whitelist yoqilsin'],
              ].map(([k, l]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
                  <input type="checkbox" checked={!!settings[k]} onChange={(e) => setVal(k, e.target.checked)} /> {l}
                </label>
              ))}
            </div>
          )}

          {activeTab === 'integrations' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <div className="field"><label>Click merchant id</label><input value={settings.click_merchant_id || ''} onChange={(e) => setVal('click_merchant_id', e.target.value)} /></div>
              <div className="field"><label>Payme merchant id</label><input value={settings.payme_merchant_id || ''} onChange={(e) => setVal('payme_merchant_id', e.target.value)} /></div>
              <div className="field"><label>SMS provider token</label><input value={settings.sms_token || ''} onChange={(e) => setVal('sms_token', e.target.value)} /></div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="card" style={{ padding: 16 }}>
                <div className="card-title" style={{ marginBottom: 12 }}>Arxiv boshqaruvi</div>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label>Yil</label>
                  <input type="number" value={adminYear} onChange={(e) => setAdminYear(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button className="btn" onClick={() => archiveYear('archive')} disabled={adminLoading}>Arxivlash</button>
                  <button className="btn ghost" onClick={() => archiveYear('unarchive')} disabled={adminLoading}>Arxivdan olish</button>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 8 }}>Arxiv statistikasi</div>
                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {archiveStats ? JSON.stringify(archiveStats, null, 2) : (adminLoading ? 'Yuklanmoqda...' : "Ma'lumot yo'q (endpoint mavjud emas)")}
                </div>
              </div>

              <div className="card" style={{ padding: 16 }}>
                <div className="card-title" style={{ marginBottom: 12 }}>Backup</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>Qo'lda backup yaratish va statusni ko'rish</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button className="btn primary" onClick={runBackup} disabled={adminLoading}>Backup yaratish</button>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 8 }}>Backup holati</div>
                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {backupStatus ? JSON.stringify(backupStatus, null, 2) : (adminLoading ? 'Yuklanmoqda...' : "Ma'lumot yo'q")}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Transactions ─────────────────────────────────────────────────────────────

function genMonths(count = 12) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

export function TransactionsScreen({ onToast } = {}) {
  const I = Icon;
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [source, setSource] = React.useState('all');
  const [scope, setScope] = React.useState('all');
  const [stats, setStats] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  // Manual transaction modal
  const [showManual, setShowManual] = React.useState(false);
  const [manualForm, setManualForm] = React.useState({
    contract_number: '',
    amount: '',
    months: [],
    payment_method: 'cash',
    note: '',
  });
  const [manualSaving, setManualSaving] = React.useState(false);
  const availableMonths = genMonths(12);

  async function loadData() {
    setLoading(true);
    setLoadError('');
    try {
      const loadRows = scope === 'unassigned'
        ? apiGetUnassignedTransactions({ page_size: 200 })
        : apiGetTransactionsWithName({ page_size: 200 });

      const [rowsRes, statsRes] = await Promise.allSettled([loadRows, apiGetTransactionStats()]);

      let nextRows = [];
      if (rowsRes.status === 'fulfilled') {
        nextRows = rowsRes.value?.data || [];
      } else if (scope !== 'unassigned') {
        try {
          const fallback = await apiGetTransactions({ page_size: 200 });
          nextRows = fallback?.data || [];
        } catch { nextRows = []; }
      }

      setRows(nextRows);
      setStats(statsRes.status === 'fulfilled' ? (statsRes.value?.data || null) : null);

      if (rowsRes.status === 'rejected' && statsRes.status === 'rejected') {
        setLoadError('Tranzaksiyalar API javobi olinmadi');
      }
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { loadData(); }, [scope]);

  async function handleExport() {
    try {
      const blob = await apiDownloadPaymentsExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      alert('Export xatoligi: ' + e.message);
    }
  }

  async function openDetail(id) {
    setDetailLoading(true);
    setDetail({ id });
    try {
      const res = await apiGetTransaction(id);
      setDetail(res?.data || null);
    } catch (e) {
      setDetail(null);
      alert('Tranzaksiya ochilmadi: ' + e.message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleCancel(id) {
    if (!confirm("To'lovni bekor qilasizmi?")) return;
    try {
      await apiCancelTransaction(id);
      setDetail(null);
      onToast?.("To'lov bekor qilindi");
      loadData();
    } catch (e) {
      alert('Xatolik: ' + e.message);
    }
  }

  async function submitManual() {
    if (!manualForm.contract_number || !manualForm.amount || manualForm.months.length === 0) {
      onToast?.("Barcha majburiy maydonlarni to'ldiring");
      return;
    }
    const expectedAmount = Number(manualForm.amount);
    setManualSaving(true);
    try {
      await apiCreateManualTransaction({
        contract_number: manualForm.contract_number,
        amount: expectedAmount,
        months: manualForm.months,
        payment_method: manualForm.payment_method,
        note: manualForm.note || undefined,
      });
      setShowManual(false);
      setManualForm({ contract_number: '', amount: '', months: [], payment_method: 'cash', note: '' });
      onToast?.("To'lov kiritildi");
      loadData();
    } catch (e) {
      onToast?.('Xatolik: ' + e.message);
    } finally {
      setManualSaving(false);
    }
  }

  function normSource(v) {
    const s = String(v || '').trim().toLowerCase();
    if (!s) return 'unknown';
    if (s === 'cash') return 'cash';
    if (s === 'click' || s === 'click_up') return 'click';
    if (s === 'payme') return 'payme';
    if (s === 'terminal' || s === 'card' || s === 'uzcard' || s === 'humo') return 'terminal';
    return s;
  }

  function sourceLabel(v) {
    const s = normSource(v);
    if (s === 'cash') return 'Naqd';
    if (s === 'click') return 'Click';
    if (s === 'payme') return 'Payme';
    if (s === 'terminal') return 'Terminal';
    return String(v || '—');
  }

  function statusLabel(v) {
    const s = String(v || '').trim().toUpperCase();
    if (s === 'SETTLED' || s === 'PAID' || s === 'SUCCESS') return { cls: 'success', text: "To'langan" };
    if (s === 'UNASSIGNED' || s === 'PENDING') return { cls: 'warning', text: 'Biriktirilmagan' };
    if (s === 'CANCELLED' || s === 'FAILED') return { cls: '', text: 'Bekor' };
    return { cls: '', text: v || '—' };
  }

  const list = rows.filter((r) => source === 'all' ? true : normSource(r.source) === source);
  const total = list.reduce((s, r) => s + (r.amount || 0), 0);

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">To'lovlar</h1>
          <div className="page-sub">{list.length} ta tranzaksiya · {fmt.format(total)} so'm</div>
        </div>
        <div className="page-actions">
          <button className="btn primary" onClick={() => setShowManual(true)}><I.Plus size={15} /> Qo'lda to'lov</button>
          <select value={scope} onChange={(e) => setScope(e.target.value)} style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}>
            <option value="all">Barcha to'lovlar</option>
            <option value="unassigned">Biriktirilmagan</option>
          </select>
          <select value={source} onChange={(e) => setSource(e.target.value)} style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}>
            <option value="all">Barchasi</option>
            <option value="cash">Naqd</option>
            <option value="click">Click</option>
            <option value="payme">Payme</option>
            <option value="terminal">Terminal</option>
          </select>
          <button className="btn" onClick={handleExport}><I.Download size={15} /> Export</button>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
          <Stat label="Jami to'lov" value={`${fmt.format(stats.total_paid || 0)} so'm`} tone="success" icon={I.Wallet} />
          <Stat label="Muvaffaqiyatli" value={stats.successful_transactions || 0} tone="navy" icon={I.Check} />
          <Stat label="Click / Payme" value={(stats.click_transactions || 0) + (stats.payme_transactions || 0)} icon={I.CreditCard} />
          <Stat label="Bank" value={stats.bank_transactions || 0} icon={I.TrendingUp} />
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Sana</th><th>O'quvchi</th><th>Manba</th><th>Oylar</th><th style={{ textAlign: 'right' }}>Summa</th><th>Status</th></tr></thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 18, color: 'var(--muted)' }}>{loadError || 'Tranzaksiya topilmadi'}</td></tr>
            )}
            {list.map((t) => (
              <tr key={t.id} onClick={() => openDetail(t.id)} style={{ cursor: 'pointer' }}>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{(t.paid_at || t.created_at || '').slice(0, 10)}</td>
                <td>{t.student_name || t.student_full_name || `#${t.student_id || '—'}`}</td>
                <td><span className="chip">{sourceLabel(t.source || t.payment_method)}</span></td>
                <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{(t.payment_months || t.months || []).join(', ') || '—'}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt.format(t.amount || 0)} so'm</td>
                <td>{(() => { const st = statusLabel(t.status); return <span className={'chip' + (st.cls ? ` ${st.cls}` : '')}>{st.text}</span>; })()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setDetail(null)}>
          <div className="card" style={{ width: 560, padding: 18 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Tranzaksiya #{detail.id}</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setDetail(null)}><I.X size={15} /></button>
            </div>
            {detailLoading ? (
              <div className="empty" style={{ padding: 24 }}>Yuklanmoqda...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  {[
                    ['Summa', `${fmt.format(detail.amount || 0)} so'm`],
                    ['Manba', sourceLabel(detail.source || detail.payment_method)],
                    ['Status', statusLabel(detail.status).text],
                    ['Sana', (detail.paid_at || detail.created_at || '').slice(0, 19).replace('T', ' ')],
                    ['Oylar', (detail.payment_months || detail.months || []).join(', ') || '—'],
                    ["O'quvchi", detail.student_name || detail.student_full_name || (detail.student_id ? `#${detail.student_id}` : '—')],
                    ['Shartnoma', detail.contract_id ? `#${detail.contract_id}` : (detail.contract_number || '—')],
                    ['External ID', detail.external_id || '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, marginBottom: 4 }}>{k}</div>
                      <div style={{ fontSize: 13.5 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {detail.status !== 'CANCELLED' && detail.status !== 'FAILED' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn ghost" style={{ color: 'var(--brand-red)', borderColor: 'var(--brand-red)' }} onClick={() => handleCancel(detail.id)}>
                      <I.XCircle size={14} /> Bekor qilish
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Manual transaction modal */}
      {showManual && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setShowManual(false)}>
          <div className="card" style={{ width: 500, padding: 18 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Qo'lda to'lov kiritish</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setShowManual(false)}><I.X size={15} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Shartnoma raqami *</label>
                <input value={manualForm.contract_number} onChange={e => setManualForm(p => ({ ...p, contract_number: e.target.value }))} placeholder="1-2026" />
              </div>
              <div className="field">
                <label>Summa (so'm) *</label>
                <input type="number" value={manualForm.amount} onChange={e => setManualForm(p => ({ ...p, amount: e.target.value }))} placeholder="500000" />
              </div>
              <div className="field">
                <label>To'lov usuli *</label>
                <select value={manualForm.payment_method} onChange={e => setManualForm(p => ({ ...p, payment_method: e.target.value }))}>
                  <option value="cash">Naqd</option>
                  <option value="click">Click</option>
                  <option value="payme">Payme</option>
                  <option value="terminal">Terminal</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Oylar * (bir yoki bir nechta tanlang)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                  {availableMonths.map(m => (
                    <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: manualForm.months.includes(m) ? 'var(--selected)' : 'var(--surface)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={manualForm.months.includes(m)} onChange={e => {
                        setManualForm(p => ({
                          ...p,
                          months: e.target.checked ? [...p.months, m] : p.months.filter(x => x !== m),
                        }));
                      }} style={{ display: 'none' }} />
                      {m}
                    </label>
                  ))}
                </div>
                {manualForm.months.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    Tanlangan: {manualForm.months.join(', ')}
                  </div>
                )}
              </div>
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Izoh</label>
                <input value={manualForm.note} onChange={e => setManualForm(p => ({ ...p, note: e.target.value }))} placeholder="Ixtiyoriy izoh" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn ghost" onClick={() => setShowManual(false)}>Bekor</button>
              <button className="btn primary" onClick={submitManual} disabled={manualSaving}>
                {manualSaving ? 'Saqlanmoqda...' : "To'lovni kiritish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export function ReportsScreen() {
  const I = Icon;
  const [tab, setTab] = React.useState('dashboard');
  const [summary, setSummary] = React.useState(null);
  const [financeReport, setFinanceReport] = React.useState(null);
  const [txStats, setTxStats] = React.useState(null);
  const [attendanceGroups, setAttendanceGroups] = React.useState([]);
  const [terminatedSummary, setTerminatedSummary] = React.useState(null);
  const [debtors, setDebtors] = React.useState([]);
  const [debtorsLoading, setDebtorsLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [financeFrom, setFinanceFrom] = React.useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [financeTo, setFinanceTo] = React.useState(new Date().toISOString().slice(0, 10));

  React.useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      setLoadError('');
      try {
        const results = await Promise.allSettled([
          apiGetReportsSummary(),
          apiGetFinanceReport({ from_date: financeFrom, to_date: financeTo }),
          apiGetTransactionStats({ from_date: financeFrom, to_date: financeTo }),
          apiGetAttendanceGroupsReport(),
          apiGetReportsTerminatedSummary(),
        ]);

        if (!mounted) return;

        const [s, f, tx, a, t] = results;
        setSummary(s.status === 'fulfilled' ? (s.value || {}) : {});
        setFinanceReport(f.status === 'fulfilled' ? (f.value?.data || null) : null);
        setTxStats(tx.status === 'fulfilled' ? (tx.value?.data || null) : null);
        setAttendanceGroups(a.status === 'fulfilled' ? (a.value?.data || []) : []);
        setTerminatedSummary(t.status === 'fulfilled' ? (t.value?.data || null) : null);

        if (results.every((r) => r.status === 'rejected')) {
          setLoadError('Hisobot API javobi olinmadi');
        } else if (results.some((r) => r.status === 'rejected')) {
          setLoadError("Ba'zi hisobot endpointlari javob bermadi");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [financeFrom, financeTo]);

  React.useEffect(() => {
    if (tab !== 'debtors') return;
    setDebtorsLoading(true);
    apiGetDebtors({ page_size: 100 })
      .then(res => setDebtors(res?.data || []))
      .catch(() => setDebtors([]))
      .finally(() => setDebtorsLoading(false));
  }, [tab]);

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  const safeSummary = summary || {};

  function handleExcel() {
    window.open(apiPaymentsExcelUrl(), '_blank', 'noopener,noreferrer');
  }
  function handleDebtorsExport() {
    window.open(apiDebtorsExportUrl(), '_blank', 'noopener,noreferrer');
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Hisobotlar</h1>
          <div className="page-sub">Dashboard va moliyaviy ko'rsatkichlar</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={handleDebtorsExport}><I.Download size={15} /> Qarzdorlar</button>
          <button className="btn" onClick={handleExcel}><I.Download size={15} /> Excel</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="tabs">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'finance', label: 'Moliya hisoboti' },
            { id: 'attendance', label: 'Davomat' },
            { id: 'debtors', label: 'Qarzdorlar' },
          ].map(t => (
            <div key={t.id} className={'tab' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>{t.label}</div>
          ))}
        </div>
      </div>

      {loadError && <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--warning-soft)', borderRadius: 8, fontSize: 13, color: 'var(--warning)', fontWeight: 500 }}>{loadError}</div>}

      {tab === 'dashboard' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
            <Stat label="Faol o'quvchilar" value={safeSummary.active_students ?? '—'} icon={I.Users} />
            <Stat label="Shu oy tushumi" value={safeSummary.current_month_revenue ? `${fmt.format(safeSummary.current_month_revenue)} so'm` : '—'} tone="success" icon={I.TrendingUp} />
            <Stat label="Qarzdorlik" value={safeSummary.current_debt ? `${fmt.format(safeSummary.current_debt)} so'm` : '—'} tone="danger" icon={I.AlertTriangle} />
            <Stat label="Davomat" value={safeSummary.attendance_rate ? `${safeSummary.attendance_rate}%` : '—'} tone="navy" icon={I.Activity} />
          </div>

          {txStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
              <Stat label="Jami to'lovlar" value={`${fmt.format(txStats.total_paid || 0)} so'm`} tone="success" icon={I.Wallet} />
              <Stat label="Muvaffaqiyatli" value={txStats.successful_transactions || 0} icon={I.Check} />
              <Stat label="Click / Payme" value={(txStats.click_transactions || 0) + (txStats.payme_transactions || 0)} icon={I.CreditCard} />
              <Stat label="Naqd" value={txStats.cash_transactions || 0} icon={I.Wallet} />
            </div>
          )}

          {terminatedSummary && (
            <div className="card" style={{ padding: 16 }}>
              <div className="card-title" style={{ marginBottom: 12 }}>Bekor qilingan shartnomalar xulosasi</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <Stat label="Bekor qilingan" value={terminatedSummary.terminated_count || 0} icon={I.XCircle} />
                <Stat label="Jami kutilgan" value={`${fmt.format(terminatedSummary.total_expected || 0)} so'm`} tone="navy" icon={I.FileText} />
                <Stat label="Jami to'langan" value={`${fmt.format(terminatedSummary.total_paid || 0)} so'm`} tone="success" icon={I.Check} />
                <Stat label="Jami qarz" value={`${fmt.format(terminatedSummary.total_debt || 0)} so'm`} tone="danger" icon={I.AlertTriangle} />
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'finance' && (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontSize: 12 }}>Dan</label>
              <input type="date" value={financeFrom} onChange={e => setFinanceFrom(e.target.value)} style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontSize: 12 }}>Gacha</label>
              <input type="date" value={financeTo} onChange={e => setFinanceTo(e.target.value)} style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }} />
            </div>
          </div>

          {financeReport ? (
            <div className="card" style={{ padding: 16 }}>
              <div className="card-title" style={{ marginBottom: 12 }}>Moliya hisoboti</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                {financeReport.total_income !== undefined && <Stat label="Jami daromad" value={`${fmt.format(financeReport.total_income || 0)} so'm`} tone="success" icon={I.TrendingUp} />}
                {financeReport.total_paid !== undefined && <Stat label="To'langan" value={`${fmt.format(financeReport.total_paid || 0)} so'm`} tone="navy" icon={I.Check} />}
                {financeReport.total_debt !== undefined && <Stat label="Qarz" value={`${fmt.format(financeReport.total_debt || 0)} so'm`} tone="danger" icon={I.AlertTriangle} />}
              </div>
              {financeReport.by_month && Array.isArray(financeReport.by_month) && financeReport.by_month.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 10 }}>OY BO'YICHA</div>
                  <table className="table">
                    <thead><tr><th>Oy</th><th style={{ textAlign: 'right' }}>Daromad</th><th style={{ textAlign: 'right' }}>Kutilgan</th></tr></thead>
                    <tbody>
                      {financeReport.by_month.map((m, i) => (
                        <tr key={i}>
                          <td>{m.month || m.period}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt.format(m.income || m.total_income || m.amount || 0)} so'm</td>
                          <td style={{ textAlign: 'right', color: 'var(--muted)' }}>{fmt.format(m.expected || 0)} so'm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!financeReport.total_income && !financeReport.total_paid && (
                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(financeReport, null, 2)}
                </div>
              )}
            </div>
          ) : (
            <div className="empty" style={{ padding: 48 }}>Moliya hisoboti bo'sh</div>
          )}
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card" style={{ padding: 16 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Davomat bo'yicha guruhlar</div>
          {attendanceGroups.length === 0 ? (
            <div className="empty" style={{ padding: 18 }}>Hisobot topilmadi</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {attendanceGroups.map((g) => (
                <div key={g.group_id || g.id} style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{g.group_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                    {g.total_sessions} sessiya · {g.total_students} o'quvchi
                  </div>
                  <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${g.attendance_percentage || g.attendance_rate || 0}%`, height: '100%', background: 'var(--brand-navy)' }} />
                  </div>
                  <div style={{ fontSize: 12.5, marginTop: 6, fontWeight: 700 }}>{g.attendance_percentage || g.attendance_rate || 0}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'debtors' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{debtors.length} ta qarzdor o'quvchi</div>
            <button className="btn" onClick={handleDebtorsExport}><I.Download size={15} /> Excel export</button>
          </div>
          {debtorsLoading ? (
            <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>O'quvchi</th>
                    <th>Telefon</th>
                    <th>Guruh</th>
                    <th style={{ textAlign: 'right' }}>Qarz miqdori</th>
                  </tr>
                </thead>
                <tbody>
                  {debtors.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: 18, color: 'var(--muted)' }}>Qarzdor topilmadi</td></tr>
                  )}
                  {debtors.map((d, idx) => (
                    <tr key={d.student_id || d.id || idx}>
                      <td style={{ fontWeight: 600 }}>{d.student_name || d.full_name || `#${d.student_id || idx}`}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{d.phone || '—'}</td>
                      <td style={{ color: 'var(--text-2)' }}>{d.group_name || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-red)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt.format(Math.abs(d.debt || d.balance || 0))} so'm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Waiting List ─────────────────────────────────────────────────────────────

export function WaitingListScreen({ onToast } = {}) {
  const I = Icon;
  const [rows, setRows] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({
    student_first_name: '',
    student_last_name: '',
    birth_year: '',
    father_name: '',
    father_phone: '',
    mother_name: '',
    mother_phone: '',
    group_id: '',
    priority: 0,
    notes: '',
  });

  async function load() {
    setLoading(true);
    try {
      const [wRes, gRes] = await Promise.allSettled([
        apiGetWaitingList({ page_size: 100 }),
        apiGetGroups({ page_size: 100 }),
      ]);
      setGroups(gRes.status === 'fulfilled' ? (gRes.value?.data || []) : []);
      setRows(wRes.status === 'fulfilled' ? (wRes.value?.data || []) : []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ student_first_name: '', student_last_name: '', birth_year: '', father_name: '', father_phone: '', mother_name: '', mother_phone: '', group_id: '', priority: 0, notes: '' });
    setShowModal(true);
  }

  function openEdit(r) {
    setEditing(r);
    setForm({
      student_first_name: r.student_first_name || '',
      student_last_name: r.student_last_name || '',
      birth_year: r.birth_year || '',
      father_name: r.father_name || '',
      father_phone: r.father_phone || '',
      mother_name: r.mother_name || '',
      mother_phone: r.mother_phone || '',
      group_id: r.group_id || '',
      priority: r.priority ?? 0,
      notes: r.notes || '',
    });
    setShowModal(true);
  }

  async function save() {
    if (!form.student_first_name || !form.student_last_name || !form.birth_year) {
      onToast?.('Majburiy maydonlarni to\'ldiring');
      return;
    }
    try {
      const payload = {
        student_first_name: form.student_first_name,
        student_last_name: form.student_last_name,
        birth_year: Number(form.birth_year),
        father_name: form.father_name || undefined,
        father_phone: form.father_phone || undefined,
        mother_name: form.mother_name || undefined,
        mother_phone: form.mother_phone || undefined,
        group_id: form.group_id ? Number(form.group_id) : undefined,
        priority: Number(form.priority || 0),
        notes: form.notes || undefined,
      };
      if (editing) await apiUpdateWaitingList(editing.id, payload);
      else await apiCreateWaitingList(payload);
      onToast?.(editing ? "Nomzod o'zgartirildi" : "Nomzod qo'shildi");
      setShowModal(false);
      load();
    } catch (e) {
      onToast?.('Xatolik: ' + e.message);
    }
  }

  async function remove(id) {
    if (!confirm("Rostdan ham o'chirasizmi?")) return;
    try {
      await apiDeleteWaitingList(id);
      onToast?.("Nomzod o'chirildi");
      load();
    } catch (e) {
      onToast?.('Xatolik: ' + e.message);
    }
  }

  const byPriority = {
    high: rows.filter((r) => Number(r.priority || 0) >= 8).length,
    medium: rows.filter((r) => { const p = Number(r.priority || 0); return p >= 4 && p < 8; }).length,
    low: rows.filter((r) => Number(r.priority || 0) < 4).length,
  };

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Kutish ro'yxati</h1>
          <div className="page-sub">{rows.length} ta nomzod</div>
        </div>
        <div className="page-actions">
          <button className="btn primary" onClick={openNew}><I.UserPlus size={15} /> Nomzod qo'shish</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
        <Stat label="Jami" value={rows.length} tone="navy" icon={I.Users} />
        <Stat label="Yuqori prioritet" value={byPriority.high} tone="danger" icon={I.AlertTriangle} />
        <Stat label="O'rta prioritet" value={byPriority.medium} tone="warning" />
        <Stat label="Past prioritet" value={byPriority.low} tone="success" />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>O'quvchi</th><th>Ota-ona</th><th>Tug'ilgan yil</th><th>Guruh</th><th>Prioritet</th><th>Izoh</th><th></th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} style={{ padding: 18, color: 'var(--muted)' }}>Nomzod topilmadi</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.student_first_name} {r.student_last_name}</td>
                <td style={{ fontSize: 12.5 }}>
                  <div>{r.father_name || '—'} · {r.father_phone || '—'}</div>
                  <div style={{ color: 'var(--muted)' }}>{r.mother_name || '—'} · {r.mother_phone || '—'}</div>
                </td>
                <td>{r.birth_year || '—'}</td>
                <td>{groups.find(g => g.id === r.group_id)?.name || (r.group_id ? `#${r.group_id}` : '—')}</td>
                <td>
                  <span className={'chip' + (Number(r.priority || 0) >= 8 ? ' danger' : Number(r.priority || 0) >= 4 ? ' warning' : ' success')}>
                    {r.priority ?? 0}
                  </span>
                </td>
                <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{r.notes || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => openEdit(r)}><I.Edit size={14} /></button>
                    <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => remove(r.id)}><I.Trash2 size={14} color="var(--brand-red)" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: 520, padding: 18 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>{editing ? 'Nomzodni tahrirlash' : 'Yangi nomzod'}</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setShowModal(false)}><I.X size={15} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field"><label>O'quvchi ismi *</label><input value={form.student_first_name} onChange={(e) => setForm((p) => ({ ...p, student_first_name: e.target.value }))} /></div>
              <div className="field"><label>O'quvchi familiyasi *</label><input value={form.student_last_name} onChange={(e) => setForm((p) => ({ ...p, student_last_name: e.target.value }))} /></div>
              <div className="field"><label>Tug'ilgan yil *</label><input type="number" value={form.birth_year} onChange={(e) => setForm((p) => ({ ...p, birth_year: e.target.value }))} /></div>
              <div className="field"><label>Guruh</label>
                <select value={form.group_id} onChange={(e) => setForm((p) => ({ ...p, group_id: e.target.value }))}>
                  <option value="">Tanlanmagan</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="field"><label>Ota ismi</label><input value={form.father_name} onChange={(e) => setForm((p) => ({ ...p, father_name: e.target.value }))} /></div>
              <div className="field"><label>Ota telefoni</label><input value={form.father_phone} onChange={(e) => setForm((p) => ({ ...p, father_phone: e.target.value }))} /></div>
              <div className="field"><label>Ona ismi</label><input value={form.mother_name} onChange={(e) => setForm((p) => ({ ...p, mother_name: e.target.value }))} /></div>
              <div className="field"><label>Ona telefoni</label><input value={form.mother_phone} onChange={(e) => setForm((p) => ({ ...p, mother_phone: e.target.value }))} /></div>
              <div className="field"><label>Prioritet (0-10)</label><input type="number" min={0} max={10} value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} /></div>
              <div className="field" style={{ gridColumn: 'span 2' }}><label>Izoh</label><textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn ghost" onClick={() => setShowModal(false)}>Bekor</button>
              <button className="btn primary" onClick={save}><I.Check size={14} /> Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
