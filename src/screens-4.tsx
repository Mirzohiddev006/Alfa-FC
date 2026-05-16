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
  apiGetSettingsRaw,
  apiUpdateSettings,
  apiGetArchiveStats,
  apiArchiveYear,
  apiUnarchiveYear,
  apiTriggerManualBackup,
  apiGetBackupStatus,
  apiImportStudents,
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
  apiGetPayers,
  apiDebtorsExportUrl,
  apiDownloadDebtors,
  apiDownloadPayers,
  apiPayersExportUrl,
  apiPaymentsExcelUrl,
  apiDownloadPaymentsExcel,
  apiGetWaitingList,
  apiCreateWaitingList,
  apiUpdateWaitingList,
  apiDeleteWaitingList,
  apiGetStudent,
  apiDeleteUsersBulk,
  apiGetTerminatedContracts,
  apiUpdateContract,
  apiDeleteTransaction,
  apiDeleteTransactionsBulk,
  apiCreateManualTransactionWithProof,
  apiGetWaitingListNext,
  apiGetAuditLogs,
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
  const [terminated, setTerminated] = React.useState([]);
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [tab, setTab] = React.useState('active');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [terminating, setTerminating] = React.useState(null);
  const [terminateReason, setTerminateReason] = React.useState('');
  const [terminateModal, setTerminateModal] = React.useState(false);
  const PAGE_SIZE = 50;

  async function loadActive(overrides = {}) {
    setLoading(true);
    try {
      const params = { page: overrides.page ?? page, page_size: PAGE_SIZE };
      if (overrides.query !== undefined ? overrides.query : query) params.search = overrides.query !== undefined ? overrides.query : query;
      if ((overrides.status !== undefined ? overrides.status : statusFilter) !== 'all') params.status = overrides.status !== undefined ? overrides.status : statusFilter;
      const [cRes, sRes] = await Promise.allSettled([
        apiGetContracts(params),
        apiGetContractStats(),
      ]);
      const cData = cRes.status === 'fulfilled' ? cRes.value : null;
      setContracts(cData?.data || []);
      setTotalPages(cData?.meta?.total_pages || 1);
      setTotalCount(cData?.meta?.total || 0);
      setStats(sRes.status === 'fulfilled' ? (sRes.value?.data || null) : null);
    } finally {
      setLoading(false);
    }
  }

  async function loadTerminated() {
    setLoading(true);
    try {
      const res = await apiGetTerminatedContracts({ page_size: 200 });
      setTerminated(res?.data || []);
    } catch { setTerminated([]); }
    finally { setLoading(false); }
  }

  React.useEffect(() => {
    apiGetContractStats().then(r => setStats(r?.data || null)).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (tab === 'terminated') { loadTerminated(); return; }
    const timer = setTimeout(() => {
      setPage(1);
      loadActive({ page: 1, query, status: statusFilter });
    }, query ? 400 : 0);
    return () => clearTimeout(timer);
  }, [query, statusFilter, tab]);

  function openTerminate(contract) {
    setTerminating(contract);
    setTerminateReason('');
    setTerminateModal(true);
  }

  async function confirmTerminate() {
    if (!terminating || !terminateReason.trim()) return;
    try {
      await apiTerminateContract(terminating.id, { termination_reason: terminateReason });
      setTerminateModal(false);
      loadActive({ page: 1 });
    } catch (e) {
      alert('Bekor qilish xatosi: ' + e.message);
    }
  }

  const rows = tab === 'terminated' ? terminated : contracts;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Shartnomalar</h1>
          <div className="page-sub">{totalCount} ta shartnoma</div>
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

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { key: 'active', label: 'Faol shartnomalar' },
          { key: 'terminated', label: 'Bekor qilinganlar' },
        ].map(t => (
          <button
            key={t.key}
            className={`btn${tab === t.key ? ' primary' : ' ghost'}`}
            style={{ fontSize: 13 }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="search" style={{ maxWidth: 320 }}>
            <span className="icon-l"><I.Search size={15} /></span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Shartnoma raqami yoki mijoz..." />
          </div>
          {tab === 'active' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}
            >
              <option value="all">Barcha statuslar</option>
              <option value="ACTIVE">Faol</option>
              <option value="EXPIRED">Tugagan</option>
              <option value="ARCHIVED">Arxivlangan</option>
            </select>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--muted)' }}>{rows.length} natija</div>
        </div>

        {loading ? (
          <div className="empty" style={{ padding: 32 }}>Yuklanmoqda...</div>
        ) : (
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
                  <td style={{ color: 'var(--text-2)' }}>{c.custom_fields?.customer?.full_name || '—'}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12.5 }}>
                    {c.start_date || '—'} <span style={{ color: 'var(--muted)' }}>→</span> {c.end_date || '—'}
                  </td>
                  <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt.format(c.monthly_fee || 0)} so'm</td>
                  <td>{statusChip(c.status)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    {c.status === 'ACTIVE' && (
                      <button className="btn ghost sm" style={{ color: 'var(--brand-red)', fontSize: 12 }} onClick={() => openTerminate(c)}>
                        <I.XCircle size={13} /> Bekor
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'active' && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '10px 0' }}>
            <button className="btn ghost sm" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); loadActive({ page: p }); }}>‹ Oldingi</button>
            <span style={{ lineHeight: '30px', fontSize: 13, color: 'var(--muted)' }}>{page} / {totalPages}</span>
            <button className="btn ghost sm" disabled={page >= totalPages} onClick={() => { const p = page + 1; setPage(p); loadActive({ page: p }); }}>Keyingi ›</button>
          </div>
        )}
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
  const [saving, setSaving] = React.useState(false);

  // modals
  const [terminateModal, setTerminateModal] = React.useState(false);
  const [terminateReason, setTerminateReason] = React.useState('');
  const [feeModal, setFeeModal] = React.useState(false);
  const [newFee, setNewFee] = React.useState('');
  const [datesModal, setDatesModal] = React.useState(false);
  const [datesForm, setDatesForm] = React.useState({ start_date: '', end_date: '' });
  const [editModal, setEditModal] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ monthly_fee: '', customer_full_name: '', customer_passport_number: '', customer_address: '' });
  const [statusModal, setStatusModal] = React.useState(false);
  const [newStatus, setNewStatus] = React.useState('');

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
    } finally { setSaving(false); }
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
    } finally { setSaving(false); }
  }

  async function saveDates() {
    if (!datesForm.start_date || !datesForm.end_date) return;
    setSaving(true);
    try {
      await apiPatchContractDates(contractId, { start_date: datesForm.start_date, end_date: datesForm.end_date });
      setDatesModal(false);
      load();
    } catch (e) {
      alert('Xatolik: ' + e.message);
    } finally { setSaving(false); }
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const body = {
        monthly_fee: Number(editForm.monthly_fee) || undefined,
        custom_fields: {
          customer: {
            full_name: editForm.customer_full_name || undefined,
            passport_number: editForm.customer_passport_number || undefined,
            address: editForm.customer_address || undefined,
          },
        },
      };
      await apiUpdateContract(contractId, body);
      setEditModal(false);
      load();
    } catch (e) {
      alert('Xatolik: ' + e.message);
    } finally { setSaving(false); }
  }

  async function saveStatus() {
    if (!newStatus) return;
    setSaving(true);
    try {
      await apiPatchContractStatus(contractId, { status: newStatus });
      setStatusModal(false);
      load();
    } catch (e) {
      alert('Xatolik: ' + e.message);
    } finally { setSaving(false); }
  }

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;
  if (!contract) return <div className="empty" style={{ padding: 48 }}>Shartnoma topilmadi</div>;

  const cf = contract.custom_fields || {};
  const cust = cf.customer || {};
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
          <button className="btn ghost" onClick={() => {
            setEditForm({
              monthly_fee: String(contract.monthly_fee || ''),
              customer_full_name: cust.full_name || '',
              customer_passport_number: cust.passport_number || '',
              customer_address: cust.address || '',
            });
            setEditModal(true);
          }}>
            <I.Edit size={15} /> Tahrirlash
          </button>
          <button className="btn ghost" onClick={() => {
            setDatesForm({ start_date: contract.start_date || '', end_date: contract.end_date || '' });
            setDatesModal(true);
          }}>
            <I.Calendar size={15} /> Sanalarni o'zgartirish
          </button>
          {contract.status !== 'TERMINATED' && (
            <button className="btn ghost" onClick={() => { setNewStatus(contract.status); setStatusModal(true); }}>
              <I.ShieldOff size={15} /> Status
            </button>
          )}
          {contract.status === 'ACTIVE' && (
            <button className="btn ghost" onClick={() => { setTerminateReason(''); setTerminateModal(true); }} style={{ color: 'var(--brand-red)', borderColor: 'var(--brand-red)' }}>
              <I.XCircle size={15} /> Bekor qilish
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
              ['Mijoz', cust.full_name || '—'],
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
              ['Pasport', cust.passport_number || '—'],
              ['Manzil', cust.address || '—'],
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

      {/* Terminate modal */}
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

      {/* Fee modal */}
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

      {/* Dates modal */}
      {datesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setDatesModal(false)}>
          <div className="card" style={{ width: 400, padding: 18 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Sanalarni o'zgartirish</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setDatesModal(false)}><I.X size={15} /></button>
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Boshlanish sanasi *</label>
              <input type="date" value={datesForm.start_date} onChange={e => setDatesForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Tugash sanasi *</label>
              <input type="date" value={datesForm.end_date} onChange={e => setDatesForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost" onClick={() => setDatesModal(false)}>Bekor</button>
              <button className="btn primary" onClick={saveDates} disabled={saving || !datesForm.start_date || !datesForm.end_date}>
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setEditModal(false)}>
          <div className="card" style={{ width: 460, padding: 18 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Shartnomani tahrirlash</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setEditModal(false)}><I.X size={15} /></button>
            </div>
            {[
              ['Oylik to\'lov (so\'m)', 'monthly_fee', 'number', '500000'],
              ['Mijoz ismi', 'customer_full_name', 'text', 'To\'liq ism'],
              ['Pasport raqami', 'customer_passport_number', 'text', 'AA1234567'],
              ['Manzil', 'customer_address', 'text', 'Shahar, ko\'cha'],
            ].map(([label, key, type, ph]) => (
              <div className="field" key={key} style={{ marginBottom: 10 }}>
                <label>{label}</label>
                <input type={type} value={editForm[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button className="btn ghost" onClick={() => setEditModal(false)}>Bekor</button>
              <button className="btn primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status modal */}
      {statusModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setStatusModal(false)}>
          <div className="card" style={{ width: 360, padding: 18 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Statusni o'zgartirish</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setStatusModal(false)}><I.X size={15} /></button>
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Yangi status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ height: 38, width: '100%', padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}>
                <option value="ACTIVE">Faol (ACTIVE)</option>
                <option value="EXPIRED">Tugagan (EXPIRED)</option>
                <option value="ARCHIVED">Arxivlangan (ARCHIVED)</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn ghost" onClick={() => setStatusModal(false)}>Bekor</button>
              <button className="btn primary" onClick={saveStatus} disabled={saving || !newStatus}>
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
  const todayIso = new Date().toISOString().slice(0, 10);
  const [logs, setLogs] = React.useState([]);
  const [meta, setMeta] = React.useState({ total: 0, total_pages: 1, page: 1 });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [fromDate, setFromDate] = React.useState(todayIso);
  const [toDate, setToDate] = React.useState(todayIso);
  const [allowedFilter, setAllowedFilter] = React.useState('');
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setLoading(true);
    setError('');
    const params = { page, page_size: 50 };
    if (fromDate) params.from_date = fromDate + 'T00:00:00';
    if (toDate) params.to_date = toDate + 'T23:59:59';
    if (allowedFilter !== '') params.allowed = allowedFilter;
    apiGetGateLogs(params)
      .then((res) => {
        setLogs(res?.data || []);
        setMeta(res?.meta || { total: 0, total_pages: 1, page: 1 });
      })
      .catch(() => {
        setError('Darvoza loglari yuklashda xatolik yuz berdi');
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, [fromDate, toDate, allowedFilter, page]);

  const allowedCount = logs.filter((l) => l.allowed !== false).length;
  const deniedCount = logs.filter((l) => l.allowed === false).length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Darvoza loglari</h1>
          <div className="page-sub">{meta.total} ta hodisa</div>
        </div>
        <div className="page-actions">
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }} />
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>—</span>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }} />
          <select value={allowedFilter} onChange={e => { setAllowedFilter(e.target.value); setPage(1); }} style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}>
            <option value="">Hammasi</option>
            <option value="true">Ruxsat</option>
            <option value="false">Rad etilgan</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
        <Stat label="Ruxsat" value={allowedCount} tone="success" icon={I.LogIn} />
        <Stat label="Rad etilgan" value={deniedCount} tone="danger" icon={I.ShieldOff} />
        <Stat label="Jami (sahifa)" value={meta.total} icon={I.Users} />
      </div>

      {error && <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--accent-soft)', borderRadius: 8, fontSize: 13, color: 'var(--brand-red)' }}>{error}</div>}

      {loading ? (
        <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr><th>O'quvchi ID</th><th>Holat</th><th>Sabab</th><th>Vaqt</th></tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 18, color: 'var(--muted)' }}>Log topilmadi</td></tr>
              )}
              {logs.map((l, idx) => (
                <tr key={l.id || idx}>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: l.allowed !== false ? 'var(--success-soft)' : 'var(--accent-soft)', color: l.allowed !== false ? 'var(--success)' : 'var(--brand-red)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        {l.allowed !== false ? <I.LogIn size={14} /> : <I.ShieldOff size={14} />}
                      </div>
                      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>O'quvchi #{l.student_id || '—'}</span>
                    </div>
                  </td>
                  <td>
                    {l.allowed !== false
                      ? <span className="chip success"><span className="chip-dot"></span>Ruxsat</span>
                      : <span className="chip danger"><span className="chip-dot"></span>Rad etilgan</span>}
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{l.reason || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
                    {(l.gate_timestamp || l.created_at || '').replace('T', ' ').slice(0, 19)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta.total_pages > 1 && (
            <div style={{ display: 'flex', gap: 6, padding: '12px 16px', borderTop: '1px solid var(--border)', alignItems: 'center' }}>
              <button className="btn sm ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ Oldingi</button>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{page} / {meta.total_pages} · Jami: {meta.total}</span>
              <button className="btn sm ghost" disabled={page >= meta.total_pages} onClick={() => setPage(p => p + 1)}>Keyingi ›</button>
            </div>
          )}
        </div>
      )}
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

const PERM_CATS = {
  students:   "O'quvchilar",
  groups:     'Guruhlar',
  attendance: 'Davomat',
  sessions:   'Sessiyalar',
  reports:    'Hisobotlar',
  settings:   'Sozlamalar',
  roles:      'Rollar',
  users:      'Foydalanuvchilar',
  gate:       'Darvoza',
  contracts:  'Shartnomalar',
  finance:    'Moliya',
};

function getPermGroups(perms) {
  const map = {};
  perms.forEach(p => {
    const cat = p.code.split(':')[0];
    if (!map[cat]) map[cat] = { label: PERM_CATS[cat] || cat, items: [] };
    map[cat].items.push(p);
  });
  return Object.values(map);
}

function PermSelector({ ids, onChange, permissions }) {
  const groups = getPermGroups(permissions);
  return (
    <div style={{ maxHeight: 270, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {groups.map(g => {
        const groupIds = g.items.map(p => p.id);
        const allChecked = groupIds.length > 0 && groupIds.every(id => ids.includes(id));
        const someChecked = groupIds.some(id => ids.includes(id));
        function toggleGroup(e) {
          onChange(e.target.checked ? [...new Set([...ids, ...groupIds])] : ids.filter(id => !groupIds.includes(id)));
        }
        return (
          <div key={g.label}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, padding: '7px 0 3px', cursor: 'pointer' }}>
              <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }} onChange={toggleGroup} />
              {g.label}
            </label>
            {g.items.map(p => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, paddingLeft: 20, paddingBottom: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={ids.includes(p.id)} onChange={e => {
                  onChange(e.target.checked ? [...ids, p.id] : ids.filter(x => x !== p.id));
                }} />
                <span>{p.description}</span>
              </label>
            ))}
          </div>
        );
      })}
    </div>
  );
}

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

  // User edit modal
  const [editingUser, setEditingUser] = React.useState(null);
  const [editUserForm, setEditUserForm] = React.useState({ full_name: '', phone: '', email: '', password: '', status: 'active', role_ids: [] });
  const [savingEditUser, setSavingEditUser] = React.useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);

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
      setSelectedIds(prev => prev.filter(id => id !== userId));
      onToast?.("Foydalanuvchi o'chirildi");
      load();
    } catch (e) {
      onToast?.('Xatolik: ' + e.message);
    } finally {
      setDeletingUserId(null);
    }
  }

  async function bulkDeleteUsers() {
    if (selectedIds.length === 0) return;
    if (!confirm(`${selectedIds.length} ta foydalanuvchini o'chirasizmi?`)) return;
    setBulkDeleting(true);
    try {
      await apiDeleteUsersBulk(selectedIds);
      setSelectedIds([]);
      onToast?.(`${selectedIds.length} ta foydalanuvchi o'chirildi`);
      load();
    } catch (e) {
      onToast?.('Xatolik: ' + e.message);
    } finally {
      setBulkDeleting(false);
    }
  }

  function openEditUser(u) {
    setEditingUser(u);
    setEditUserForm({
      full_name: u.full_name || '',
      phone: u.phone || '',
      email: u.email || '',
      password: '',
      status: u.status || 'active',
      role_ids: (u.roles || []).map(r => r.id),
    });
    setOpenMenuUserId(null);
  }

  async function saveEditUser() {
    if (!editUserForm.full_name || !editUserForm.phone) { onToast?.("Majburiy maydonlar to'ldirilmagan"); return; }
    setSavingEditUser(true);
    try {
      const payload = {
        full_name: editUserForm.full_name,
        phone: editUserForm.phone,
        email: editUserForm.email || undefined,
        status: editUserForm.status,
      };
      if (editUserForm.password) payload.password = editUserForm.password;
      await apiUpdateUser(editingUser.id, payload);
      await apiUpdateUserRoles(editingUser.id, editUserForm.role_ids.map(Number));
      setEditingUser(null);
      onToast?.('Foydalanuvchi yangilandi');
      load();
    } catch (e) {
      onToast?.('Xatolik: ' + e.message);
    } finally {
      setSavingEditUser(false);
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

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const selectableUsers = users.filter(u => !u.is_super_admin);
  const allSelected = selectableUsers.length > 0 && selectableUsers.every(u => selectedIds.includes(u.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableUsers.map(u => u.id));
    }
  }

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Foydalanuvchilar va rollar</h1>
          <div className="page-sub">{users.length} foydalanuvchi · {roles.length} rol</div>
        </div>
        {tab === 'users' && (
          <div className="page-actions">
            {selectedIds.length > 0 && (
              <button className="btn danger" onClick={bulkDeleteUsers} disabled={bulkDeleting}>
                <I.Trash2 size={14} /> {bulkDeleting ? "O'chirilmoqda..." : `${selectedIds.length} ta o'chirish`}
              </button>
            )}
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
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} title="Hammasini tanlash" />
                </th>
                <th>F.I.O.</th>
                <th>Telefon / Email</th>
                <th>Rol</th>
                <th>Status</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={6} style={{ padding: 18, color: 'var(--muted)' }}>Foydalanuvchi topilmadi</td></tr>}
              {users.map((u) => {
                const isSelected = selectedIds.includes(u.id);
                return (
                  <tr key={u.id} style={isSelected ? { background: 'var(--brand-blue-dim, rgba(59,130,246,0.07))' } : {}}>
                    <td>
                      {!u.is_super_admin && (
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(u.id)} />
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
                      <div>{u.phone || '—'}</div>
                      {u.email && <div style={{ color: 'var(--muted)', fontSize: 11.5 }}>{u.email}</div>}
                    </td>
                    <td>
                      {u.is_super_admin
                        ? <span className="chip navy">Super Admin</span>
                        : (u.roles || []).length > 0
                          ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{(u.roles).map(r => <span key={r.id} className="chip navy">{r.name}</span>)}</div>
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
                          setMenuPos({ x: rect.right - 160, y: rect.bottom + 4 });
                          setOpenMenuUserId(u.id);
                        }
                      }}><I.More size={15} /></button>
                      {openMenuUserId === u.id && (
                        <div style={{ position: 'fixed', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 9999, minWidth: 160, top: menuPos.y, left: menuPos.x }} onClick={e => e.stopPropagation()}>
                          <button style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }} onClick={() => openEditUser(u)}>
                            <I.Edit size={14} /> Tahrirlash
                          </button>
                          {!u.is_super_admin && (
                            <button style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-red)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => deleteUser(u.id)} disabled={deletingUserId === u.id}>
                              <I.Trash2 size={14} /> {deletingUserId === u.id ? "O'chirilmoqda..." : "O'chirish"}
                            </button>
                          )}
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

      {tab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Rol nomi</th><th>Ruxsatlar</th><th style={{ width: 72 }}></th></tr></thead>
              <tbody>
                {roles.length === 0 && <tr><td colSpan={3} style={{ padding: 18, color: 'var(--muted)' }}>Rol topilmadi</td></tr>}
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      {r.description && <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 1 }}>{r.description}</div>}
                    </td>
                    <td>
                      {(r.permissions || []).length === 0
                        ? <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                        : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {(r.permissions || []).slice(0, 5).map(p => (
                              <span key={p.id} style={{ fontSize: 10.5, background: 'var(--surface-2, #f1f5f9)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{p.description}</span>
                            ))}
                            {(r.permissions || []).length > 5 && (
                              <span style={{ fontSize: 10.5, color: 'var(--muted)', padding: '1px 2px', alignSelf: 'center' }}>+{(r.permissions || []).length - 5} ta</span>
                            )}
                          </div>
                      }
                    </td>
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
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Ruxsatlar</div>
            <PermSelector
              ids={newRole.permission_ids}
              onChange={ids => setNewRole(p => ({ ...p, permission_ids: ids }))}
              permissions={permissions}
            />
            <button className="btn primary" style={{ marginTop: 12 }} onClick={createRole}><I.Check size={14} /> Saqlash</button>
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

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setEditingUser(null)}>
          <div className="card" style={{ width: 520, padding: 18 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Foydalanuvchini tahrirlash</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setEditingUser(null)}><I.X size={15} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>F.I.O. *</label>
                <input value={editUserForm.full_name} onChange={e => setEditUserForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Ism Familiya" />
              </div>
              <div className="field">
                <label>Telefon *</label>
                <input value={editUserForm.phone} onChange={e => setEditUserForm(p => ({ ...p, phone: e.target.value }))} placeholder="+998901234567" />
              </div>
              <div className="field">
                <label>Email</label>
                <input value={editUserForm.email} onChange={e => setEditUserForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
              </div>
              <div className="field">
                <label>Yangi parol</label>
                <input type="password" value={editUserForm.password} onChange={e => setEditUserForm(p => ({ ...p, password: e.target.value }))} placeholder="O'zgartirmasangiz bo'sh qoldiring" />
              </div>
              <div className="field">
                <label>Status</label>
                <select value={editUserForm.status} onChange={e => setEditUserForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="active">Faol</option>
                  <option value="inactive">Nofaol</option>
                </select>
              </div>
              {!editingUser.is_super_admin && (
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <label>Rollar</label>
                  <select multiple value={editUserForm.role_ids} onChange={e => {
                    const vals = Array.from(e.target.selectedOptions).map(o => Number(o.value));
                    setEditUserForm(p => ({ ...p, role_ids: vals }));
                  }} style={{ height: 100 }}>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Ctrl+click bilan bir nechta tanlash mumkin</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn ghost" onClick={() => setEditingUser(null)}>Bekor</button>
              <button className="btn primary" onClick={saveEditUser} disabled={savingEditUser}>
                {savingEditUser ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setEditingRole(null)}>
          <div className="card" style={{ width: 500, padding: 18 }} onClick={e => e.stopPropagation()}>
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
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Ruxsatlar</div>
            <PermSelector
              ids={editingRole.permission_ids}
              onChange={ids => setEditingRole(p => ({ ...p, permission_ids: ids }))}
              permissions={permissions}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
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
  const [rawSettings, setRawSettings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('general');

  // admin / archive
  const [adminYear, setAdminYear] = React.useState(new Date().getFullYear());
  const [archiveStats, setArchiveStats] = React.useState(null);
  const [adminLoading, setAdminLoading] = React.useState(false);

  // backup
  const [backupStatus, setBackupStatus] = React.useState(null);
  const [backupLoading, setBackupLoading] = React.useState(false);
  const [backupRunning, setBackupRunning] = React.useState(false);
  const [backupMsg, setBackupMsg] = React.useState('');

  // import
  const [importFile, setImportFile] = React.useState(null);
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState(null);

  const tabDefs = [
    { id: 'general', label: 'Umumiy', icon: I.Settings },
    { id: 'billing', label: "To'lov", icon: I.CreditCard },
    { id: 'security', label: 'Xavfsizlik', icon: I.Shield },
    { id: 'integrations', label: 'Integratsiya', icon: I.Link },
    { id: 'import', label: 'Import', icon: I.Upload },
    { id: 'backup', label: 'Backup', icon: I.Save },
    { id: 'admin', label: 'Admin', icon: I.AlertTriangle },
  ];

  React.useEffect(() => {
    Promise.allSettled([
      apiGetSettings(),
      apiGetSettingsRaw(),
    ]).then(([flatRes, rawRes]) => {
      setSettings(flatRes.status === 'fulfilled' ? (flatRes.value || {}) : {});
      setRawSettings(rawRes.status === 'fulfilled' ? (rawRes.value?.data || []) : []);
    }).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (activeTab !== 'backup') return;
    setBackupLoading(true);
    apiGetBackupStatus()
      .then(res => setBackupStatus(res?.data || null))
      .catch(() => setBackupStatus(null))
      .finally(() => setBackupLoading(false));
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== 'admin') return;
    setAdminLoading(true);
    apiGetArchiveStats(adminYear)
      .then(res => setArchiveStats(res?.data || null))
      .catch(() => setArchiveStats(null))
      .finally(() => setAdminLoading(false));
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
    setBackupRunning(true);
    setBackupMsg('');
    try {
      const res = await apiTriggerManualBackup();
      setBackupMsg(res?.data?.message || "Backup muvaffaqiyatli boshlandi. Telegram kanaliga yuborilmoqda...");
      const bRes = await apiGetBackupStatus();
      setBackupStatus(bRes?.data || null);
    } catch (e) {
      setBackupMsg('Xatolik: ' + e.message);
    } finally {
      setBackupRunning(false);
    }
  }

  async function refreshBackupStatus() {
    setBackupLoading(true);
    try {
      const res = await apiGetBackupStatus();
      setBackupStatus(res?.data || null);
    } finally {
      setBackupLoading(false);
    }
  }

  async function archiveYear(action) {
    try {
      const year = Number(adminYear);
      if (!year) return;
      if (action === 'archive') await apiArchiveYear(year);
      else await apiUnarchiveYear(year);
      const aRes = await apiGetArchiveStats(year);
      setArchiveStats(aRes?.data || null);
      alert(action === 'archive' ? 'Arxivlandi' : 'Arxivdan olindi');
    } catch (e) {
      alert('Admin amali xatoligi: ' + e.message);
    }
  }

  async function handleImport() {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const res = await apiImportStudents(fd);
      setImportResult({ ok: true, data: res?.data || res });
    } catch (e) {
      setImportResult({ ok: false, message: e.message });
    } finally {
      setImporting(false);
    }
  }

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  const isSavingTab = ['general', 'billing', 'security', 'integrations'].includes(activeTab);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Sozlamalar</h1>
          <div className="page-sub">Tizim parametrlarini boshqarish</div>
        </div>
        <div className="page-actions">
          {isSavingTab && (
            <button className="btn primary" onClick={save} disabled={saving}>
              <I.Save size={15} /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 10, height: 'fit-content' }}>
          {tabDefs.map((t) => {
            const Ic = t.icon;
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', marginBottom: 4, background: active ? 'var(--selected)' : 'transparent', color: active ? 'var(--brand-navy)' : 'var(--text-2)', fontWeight: active ? 700 : 500, cursor: 'pointer', fontSize: 13 }}>
                <Ic size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="card" style={{ padding: 20 }}>

          {activeTab === 'general' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field"><label>Klub / Kompaniya nomi</label><input value={settings.club_name || settings.company_name || ''} onChange={(e) => setVal('club_name', e.target.value)} /></div>
                <div className="field"><label>INN</label><input value={settings.inn || settings.company_inn || ''} onChange={(e) => setVal('inn', e.target.value)} /></div>
                <div className="field" style={{ gridColumn: 'span 2' }}><label>Manzil</label><input value={settings.address || settings.company_address || ''} onChange={(e) => setVal('address', e.target.value)} /></div>
                <div className="field"><label>Telefon</label><input value={settings.phone || settings.company_phone || ''} onChange={(e) => setVal('phone', e.target.value)} /></div>
                <div className="field"><label>Email</label><input value={settings.email || settings.company_email || ''} onChange={(e) => setVal('email', e.target.value)} /></div>
              </div>

              {rawSettings.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Barcha tizim sozlamalari</div>
                  <table className="table">
                    <thead><tr><th>Kalit</th><th>Qiymat</th><th>Tavsif</th></tr></thead>
                    <tbody>
                      {rawSettings.map((s) => (
                        <tr key={s.id || s.key}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--muted)' }}>{s.key}</td>
                          <td>
                            <input
                              value={settings[s.key] ?? s.value ?? ''}
                              onChange={e => setVal(s.key, e.target.value)}
                              style={{ width: '100%', height: 30, border: '1px solid var(--border)', borderRadius: 6, padding: '0 8px', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}
                            />
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--muted)' }}>{s.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

          {activeTab === 'import' && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>O'quvchilarni Excel orqali import qilish</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                Faylda quyidagi ustunlar bo'lishi kerak:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
                {[
                  ['first_name', 'Ism', true],
                  ['last_name', 'Familiya', true],
                  ['date_of_birth', 'Tug\'ilgan sana (YYYY-MM-DD)', true],
                  ['height', 'Bo\'y (sm)', true],
                  ['weight', 'Vazn (kg)', true],
                  ['pnfl', 'JSHSHIR (14 raqam)', true],
                  ['phone', 'Telefon', false],
                  ['address', 'Manzil', false],
                  ['ampula', 'Pozitsiya', false],
                  ['millati', 'Millati', false],
                  ['status', 'Status (ACTIVE/INACTIVE/GRADUATED/EXPELLED)', false],
                  ['group_name', 'Guruh nomi', false],
                ].map(([key, label, required]) => (
                  <div key={key} style={{ padding: '8px 12px', background: required ? 'var(--success-soft)' : 'var(--surface-2)', borderRadius: 8, border: '1px solid ' + (required ? 'transparent' : 'var(--border)') }}>
                    <div style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: required ? 'var(--success)' : 'var(--text)' }}>{key}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{label}{required ? ' *' : ''}</div>
                  </div>
                ))}
              </div>

              <div className="field" style={{ marginBottom: 12 }}>
                <label>Excel fayl (.xlsx)</label>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={e => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }} />
              </div>
              {importFile && (
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                  Tanlangan: <strong style={{ color: 'var(--text)' }}>{importFile.name}</strong> ({(importFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
              <button className="btn primary" onClick={handleImport} disabled={!importFile || importing}>
                <I.Upload size={14} /> {importing ? 'Yuklanmoqda...' : 'Import qilish'}
              </button>

              {importResult && (
                <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: importResult.ok ? 'var(--success-soft)' : 'var(--accent-soft)', border: '1px solid ' + (importResult.ok ? 'var(--success)' : 'var(--brand-red)') }}>
                  {importResult.ok ? (
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: 6 }}>Import muvaffaqiyatli!</div>
                      {importResult.data && typeof importResult.data === 'object' && (
                        <div style={{ fontSize: 12.5, color: 'var(--text)' }}>
                          {importResult.data.created_count != null && <div>Yaratildi: <strong>{importResult.data.created_count}</strong></div>}
                          {importResult.data.updated_count != null && <div>Yangilandi: <strong>{importResult.data.updated_count}</strong></div>}
                          {importResult.data.skipped_count != null && <div>O'tkazib yuborildi: <strong>{importResult.data.skipped_count}</strong></div>}
                          {importResult.data.errors?.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <div style={{ fontWeight: 600, color: 'var(--warning)' }}>Xatolar:</div>
                              {importResult.data.errors.map((e, i) => <div key={i} style={{ fontSize: 12 }}>{e}</div>)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--brand-red)', fontWeight: 600 }}>Xatolik: {importResult.message}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'backup' && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Ma'lumotlar bazasi Backup</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Qo'lda backup yarating yoki joriy holatni tekshiring</div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button className="btn primary" onClick={runBackup} disabled={backupRunning}>
                  <I.Save size={14} /> {backupRunning ? 'Yaratilmoqda...' : 'Backup yaratish'}
                </button>
                <button className="btn ghost" onClick={refreshBackupStatus} disabled={backupLoading}>
                  <I.ArrowRight size={14} /> Statusni yangilash
                </button>
              </div>

              {backupMsg && (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: 8, fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>
                  {backupMsg}
                </div>
              )}

              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Backup holati</div>

              {backupLoading ? (
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>Yuklanmoqda...</div>
              ) : backupStatus ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {Object.entries(backupStatus).map(([k, v]) => (
                    <div key={k} style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.replace(/_/g, ' ')}</div>
                      <div style={{ marginTop: 4, fontSize: 13.5, fontWeight: 600, wordBreak: 'break-all' }}>
                        {typeof v === 'boolean' ? (v ? 'Ha' : "Yo'q") : String(v ?? '—')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 20, background: 'var(--surface-2)', borderRadius: 10, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
                  Backup holati ma'lumotlari topilmadi
                </div>
              )}
            </div>
          )}

          {activeTab === 'admin' && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Arxiv boshqaruvi</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>Yil</label>
                  <input type="number" value={adminYear} onChange={(e) => setAdminYear(e.target.value)} style={{ width: 120 }} />
                </div>
                <button className="btn" onClick={() => archiveYear('archive')} disabled={adminLoading}>Arxivlash</button>
                <button className="btn ghost" onClick={() => archiveYear('unarchive')} disabled={adminLoading}>Arxivdan olish</button>
              </div>

              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Arxiv statistikasi</div>
              {adminLoading ? (
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>Yuklanmoqda...</div>
              ) : archiveStats ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {Object.entries(archiveStats).map(([k, v]) => (
                    <div key={k} style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.replace(/_/g, ' ')}</div>
                      <div style={{ marginTop: 4, fontSize: 13.5, fontWeight: 600 }}>{String(v ?? '—')}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 20, background: 'var(--surface-2)', borderRadius: 10, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
                  Ma'lumot yo'q
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Transactions ─────────────────────────────────────────────────────────────

const MONTH_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
function monthName(n) { return MONTH_UZ[(n - 1) % 12] || `Oy ${n}`; }

export function TransactionsScreen({ onToast } = {}) {
  const I = Icon;
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [source, setSource] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [scope, setScope] = React.useState('all');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [paymentYear, setPaymentYear] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [stats, setStats] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [deleting, setDeleting] = React.useState(false);

  const [showManual, setShowManual] = React.useState(false);
  const [manualWithProof, setManualWithProof] = React.useState(false);
  const [manualForm, setManualForm] = React.useState({
    contract_number: '', amount: '', payment_months: [], source: 'cash',
    comment: '', payment_year: new Date().getFullYear(), paid_at: '', proof_file: null,
  });
  const [manualSaving, setManualSaving] = React.useState(false);

  const [assignTxId, setAssignTxId] = React.useState(null);
  const [assignForm, setAssignForm] = React.useState({ student_id: '', contract_id: '' });
  const [assigning, setAssigning] = React.useState(false);

  async function loadData() {
    setLoading(true);
    setLoadError('');
    try {
      let res;
      if (scope === 'unassigned') {
        res = await apiGetUnassignedTransactions({ page, page_size: 50 });
      } else {
        const params = { page, page_size: 50 };
        if (source) params.source = source;
        if (statusFilter) params.status = statusFilter;
        if (fromDate) params.from_date = fromDate + 'T00:00:00';
        if (toDate) params.to_date = toDate + 'T23:59:59';
        if (paymentYear) params.payment_year = Number(paymentYear);
        res = await apiGetTransactionsWithName(params);
      }
      const meta = res?.meta;
      setRows(res?.data || []);
      setTotalPages(meta?.total_pages || 1);
      setTotalCount(meta?.total || 0);
      setSelectedIds([]);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
    apiGetTransactionStats().then(r => setStats(r?.data || null)).catch(() => {});
  }

  React.useEffect(() => { loadData(); }, [scope, source, statusFilter, fromDate, toDate, paymentYear, page]);

  async function handleExport() {
    try {
      const blob = await apiDownloadPaymentsExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `transactions-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) { alert('Export xatoligi: ' + e.message); }
  }

  async function openDetail(id) {
    setDetailLoading(true);
    setDetail({ id });
    try {
      const res = await apiGetTransaction(id);
      setDetail(res?.data || null);
    } catch (e) { setDetail(null); alert('Tranzaksiya ochilmadi: ' + e.message); }
    finally { setDetailLoading(false); }
  }

  async function handleCancel(id) {
    if (!confirm("To'lovni bekor qilasizmi?")) return;
    try {
      await apiCancelTransaction(id);
      setDetail(null); onToast?.("To'lov bekor qilindi"); loadData();
    } catch (e) { alert('Xatolik: ' + e.message); }
  }

  async function handleDelete(id) {
    if (!confirm("Tranzaksiyani o'chirasizmi? Bu amalni ortga qaytarib bo'lmaydi.")) return;
    try {
      await apiDeleteTransaction(id);
      setDetail(null); onToast?.("Tranzaksiya o'chirildi"); loadData();
    } catch (e) { alert('Xatolik: ' + e.message); }
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) return;
    if (!confirm(`${selectedIds.length} ta tranzaksiyani o'chirasizmi?`)) return;
    setDeleting(true);
    try {
      await apiDeleteTransactionsBulk(selectedIds);
      setSelectedIds([]); onToast?.(`${selectedIds.length} ta tranzaksiya o'chirildi`); loadData();
    } catch (e) { alert('Xatolik: ' + e.message); }
    finally { setDeleting(false); }
  }

  async function handleAssign() {
    if (!assignTxId || !assignForm.student_id || !assignForm.contract_id) return;
    setAssigning(true);
    try {
      await apiAssignTransaction(assignTxId, {
        student_id: Number(assignForm.student_id), contract_id: Number(assignForm.contract_id),
      });
      setAssignTxId(null); setAssignForm({ student_id: '', contract_id: '' });
      onToast?.("Tranzaksiya biriktirildi"); loadData();
    } catch (e) { alert('Xatolik: ' + e.message); }
    finally { setAssigning(false); }
  }

  async function submitManual() {
    if (!manualForm.contract_number || !manualForm.amount || manualForm.payment_months.length === 0) {
      onToast?.("Barcha majburiy maydonlarni to'ldiring"); return;
    }
    setManualSaving(true);
    try {
      if (manualWithProof && manualForm.proof_file) {
        const fd = new FormData();
        fd.append('contract_number', manualForm.contract_number);
        fd.append('source', manualForm.source);
        fd.append('amount', String(Number(manualForm.amount)));
        fd.append('payment_year', String(manualForm.payment_year));
        fd.append('payment_months', manualForm.payment_months.join(','));
        if (manualForm.comment) fd.append('comment', manualForm.comment);
        if (manualForm.paid_at) fd.append('paid_at', new Date(manualForm.paid_at).toISOString());
        fd.append('proof_file', manualForm.proof_file);
        await apiCreateManualTransactionWithProof(fd);
      } else {
        await apiCreateManualTransaction({
          contract_number: manualForm.contract_number,
          amount: Number(manualForm.amount),
          source: manualForm.source,
          payment_year: manualForm.payment_year,
          payment_months: manualForm.payment_months,
          comment: manualForm.comment || undefined,
          paid_at: manualForm.paid_at ? new Date(manualForm.paid_at).toISOString() : undefined,
        });
      }
      setShowManual(false); setManualWithProof(false);
      setManualForm({ contract_number: '', amount: '', payment_months: [], source: 'cash', comment: '', payment_year: new Date().getFullYear(), paid_at: '', proof_file: null });
      onToast?.("To'lov kiritildi"); loadData();
    } catch (e) { onToast?.('Xatolik: ' + e.message); }
    finally { setManualSaving(false); }
  }

  function sourceLabel(v) {
    const s = String(v || '').trim().toLowerCase();
    if (s === 'cash') return 'Naqd';
    if (s === 'click') return 'Click';
    if (s === 'payme') return 'Payme';
    if (s === 'bank') return 'Bank';
    return String(v || '—');
  }

  function statusLabel(v) {
    const s = String(v || '').trim().toLowerCase();
    if (s === 'success') return { cls: 'success', text: "To'langan" };
    if (s === 'pending') return { cls: 'warning', text: 'Kutilmoqda' };
    if (s === 'cancelled' || s === 'failed') return { cls: 'danger', text: 'Bekor' };
    return { cls: '', text: v || '—' };
  }

  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  const pageTotal = rows.reduce((s, r) => s + (r.amount || 0), 0);
  const colCount = scope === 'unassigned' ? 8 : 7;

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">To'lovlar</h1>
          <div className="page-sub">{totalCount} ta tranzaksiya · {fmt.format(pageTotal)} so'm (sahifa)</div>
        </div>
        <div className="page-actions">
          <button className="btn primary" onClick={() => setShowManual(true)}><I.Plus size={15} /> Qo'lda to'lov</button>
          {selectedIds.length > 0 && (
            <button className="btn ghost" style={{ color: 'var(--brand-red)', borderColor: 'var(--brand-red)' }} onClick={handleBulkDelete} disabled={deleting}>
              <I.Trash2 size={15} /> O'chirish ({selectedIds.length})
            </button>
          )}
          <button className="btn" onClick={handleExport}><I.Download size={15} /> Export</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <select value={scope} onChange={e => { setScope(e.target.value); setPage(1); }} style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}>
          <option value="all">Barcha</option>
          <option value="unassigned">Biriktirilmagan</option>
        </select>
        <select value={source} onChange={e => { setSource(e.target.value); setPage(1); }} style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}>
          <option value="">Barcha manba</option>
          <option value="cash">Naqd</option>
          <option value="click">Click</option>
          <option value="payme">Payme</option>
          <option value="bank">Bank</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}>
          <option value="">Barcha status</option>
          <option value="success">To'langan</option>
          <option value="pending">Kutilmoqda</option>
          <option value="cancelled">Bekor</option>
        </select>
        <input type="number" placeholder="Yil" value={paymentYear} onChange={e => { setPaymentYear(e.target.value); setPage(1); }} style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: 13, width: 80 }} />
        <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }} />
        <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }} />
        {(source || statusFilter || fromDate || toDate || paymentYear) && (
          <button className="btn ghost" onClick={() => { setSource(''); setStatusFilter(''); setFromDate(''); setToDate(''); setPaymentYear(''); setPage(1); }} style={{ height: 36, fontSize: 13 }}>
            <I.X size={13} /> Tozalash
          </button>
        )}
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
          <Stat label="Jami to'lov" value={`${fmt.format(stats.total_paid || 0)} so'm`} tone="success" icon={I.Wallet} />
          <Stat label="Muvaffaqiyatli" value={stats.successful_transactions || 0} tone="navy" icon={I.Check} />
          <Stat label="Click" value={stats.click_transactions || 0} icon={I.CreditCard} />
          <Stat label="Payme" value={stats.payme_transactions || 0} icon={I.CreditCard} />
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 36, padding: '0 8px' }}>
                <input type="checkbox" checked={allSelected} onChange={e => setSelectedIds(e.target.checked ? rows.map(r => r.id) : [])} />
              </th>
              <th>Sana</th><th>O'quvchi</th><th>Manba</th><th>Oylar</th>
              <th style={{ textAlign: 'right' }}>Summa</th><th>Status</th>
              {scope === 'unassigned' && <th></th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={colCount} style={{ padding: 18, color: 'var(--muted)' }}>{loadError || 'Tranzaksiya topilmadi'}</td></tr>
            )}
            {rows.map(t => {
              const st = statusLabel(t.status);
              const checked = selectedIds.includes(t.id);
              return (
                <tr key={t.id}>
                  <td style={{ padding: '0 8px' }} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={checked} onChange={e => setSelectedIds(p => e.target.checked ? [...p, t.id] : p.filter(x => x !== t.id))} />
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', cursor: 'pointer' }} onClick={() => openDetail(t.id)}>{(t.paid_at || t.created_at || '').slice(0, 10)}</td>
                  <td style={{ cursor: 'pointer' }} onClick={() => openDetail(t.id)}>{t.student_full_name || `#${t.student_id || '—'}`}</td>
                  <td style={{ cursor: 'pointer' }} onClick={() => openDetail(t.id)}><span className="chip">{sourceLabel(t.source)}</span></td>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5, cursor: 'pointer' }} onClick={() => openDetail(t.id)}>{(t.payment_months || []).map(m => monthName(m)).join(', ') || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', cursor: 'pointer' }} onClick={() => openDetail(t.id)}>{fmt.format(t.amount || 0)} so'm</td>
                  <td style={{ cursor: 'pointer' }} onClick={() => openDetail(t.id)}><span className={'chip' + (st.cls ? ` ${st.cls}` : '')}>{st.text}</span></td>
                  {scope === 'unassigned' && (
                    <td>
                      <button className="btn ghost" style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => setAssignTxId(t.id)}>Biriktirish</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 14px' }}>‹ Oldingi</button>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{page} / {totalPages}</span>
          <button className="btn ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 14px' }}>Keyingi ›</button>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setDetail(null)}>
          <div className="card" style={{ width: 560, padding: 18 }} onClick={e => e.stopPropagation()}>
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
                    ['Manba', sourceLabel(detail.source)],
                    ['Status', statusLabel(detail.status).text],
                    ['Sana', (detail.paid_at || detail.created_at || '').slice(0, 19).replace('T', ' ')],
                    ['Oylar', (detail.payment_months || []).map(m => monthName(m)).join(', ') || '—'],
                    ["O'quvchi", detail.student_full_name || (detail.student_id ? `#${detail.student_id}` : '—')],
                    ['Shartnoma', detail.contract_id ? `#${detail.contract_id}` : '—'],
                    ["To'lov yili", detail.payment_year || '—'],
                    ['External ID', detail.external_id || '—'],
                    ['Izoh', detail.comment || '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, marginBottom: 4 }}>{k}</div>
                      <div style={{ fontSize: 13.5 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {detail.settlement_document_url && (
                  <div style={{ marginBottom: 10 }}>
                    <a href={detail.settlement_document_url} target="_blank" rel="noopener noreferrer" className="btn ghost" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <I.File size={13} /> Hujjatni ko'rish
                    </a>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  {detail.status !== 'cancelled' && detail.status !== 'failed' && (
                    <button className="btn ghost" style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }} onClick={() => handleCancel(detail.id)}>
                      <I.XCircle size={14} /> Bekor qilish
                    </button>
                  )}
                  <button className="btn ghost" style={{ color: 'var(--brand-red)', borderColor: 'var(--brand-red)' }} onClick={() => handleDelete(detail.id)}>
                    <I.Trash2 size={14} /> O'chirish
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignTxId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setAssignTxId(null)}>
          <div className="card" style={{ width: 420, padding: 18 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Tranzaksiyani biriktirish</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setAssignTxId(null)}><I.X size={15} /></button>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div className="field">
                <label>O'quvchi ID *</label>
                <input type="number" value={assignForm.student_id} onChange={e => setAssignForm(p => ({ ...p, student_id: e.target.value }))} placeholder="O'quvchi ID raqami" />
              </div>
              <div className="field">
                <label>Shartnoma ID *</label>
                <input type="number" value={assignForm.contract_id} onChange={e => setAssignForm(p => ({ ...p, contract_id: e.target.value }))} placeholder="Shartnoma ID raqami" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn ghost" onClick={() => setAssignTxId(null)}>Bekor</button>
              <button className="btn primary" onClick={handleAssign} disabled={assigning}>
                {assigning ? 'Biriktirimoqda...' : 'Biriktirish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual transaction modal */}
      {showManual && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setShowManual(false)}>
          <div className="card" style={{ width: 520, padding: 18, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>Qo'lda to'lov kiritish</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => { setShowManual(false); setManualWithProof(false); }}><I.X size={15} /></button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={manualWithProof} onChange={e => setManualWithProof(e.target.checked)} />
              Hujjat bilan to'lov (fayl yuklash)
            </label>
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
                <label>Manba *</label>
                <select value={manualForm.source} onChange={e => setManualForm(p => ({ ...p, source: e.target.value }))}>
                  <option value="cash">Naqd</option>
                  <option value="click">Click</option>
                  <option value="payme">Payme</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
              <div className="field">
                <label>To'lov yili *</label>
                <input type="number" value={manualForm.payment_year} onChange={e => setManualForm(p => ({ ...p, payment_year: Number(e.target.value) }))} />
              </div>
              <div className="field">
                <label>To'lov sanasi</label>
                <input type="datetime-local" value={manualForm.paid_at} onChange={e => setManualForm(p => ({ ...p, paid_at: e.target.value }))} />
              </div>
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Oylar * (tanlang)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <label key={m} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, padding: '5px 4px', borderRadius: 6, border: '1px solid var(--border)', background: manualForm.payment_months.includes(m) ? 'var(--accent-soft,rgba(200,32,44,0.1))' : 'var(--surface)', cursor: 'pointer', fontWeight: manualForm.payment_months.includes(m) ? 700 : 400 }}>
                      <input type="checkbox" checked={manualForm.payment_months.includes(m)} onChange={e => setManualForm(p => ({ ...p, payment_months: e.target.checked ? [...p.payment_months, m] : p.payment_months.filter(x => x !== m) }))} style={{ display: 'none' }} />
                      {monthName(m)}
                    </label>
                  ))}
                </div>
                {manualForm.payment_months.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Tanlangan: {manualForm.payment_months.map(m => monthName(m)).join(', ')}</div>
                )}
              </div>
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Izoh</label>
                <input value={manualForm.comment} onChange={e => setManualForm(p => ({ ...p, comment: e.target.value }))} placeholder="Ixtiyoriy izoh" />
              </div>
              {manualWithProof && (
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <label>Hujjat fayli (PDF, JPG, PNG) *</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setManualForm(p => ({ ...p, proof_file: e.target.files?.[0] || null }))} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn ghost" onClick={() => { setShowManual(false); setManualWithProof(false); }}>Bekor</button>
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
  const [payers, setPayers] = React.useState([]);
  const [payersLoading, setPayersLoading] = React.useState(false);
  const [payersYear, setPayersYear] = React.useState(new Date().getFullYear());
  const [payersMonth, setPayersMonth] = React.useState('');
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

  React.useEffect(() => {
    if (tab !== 'payers') return;
    setPayersLoading(true);
    const params = { payment_year: payersYear, page_size: 100 };
    if (payersMonth) params.payment_month = payersMonth;
    apiGetPayers(params)
      .then(res => setPayers(res?.data || []))
      .catch(() => setPayers([]))
      .finally(() => setPayersLoading(false));
  }, [tab, payersYear, payersMonth]);

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  const safeSummary = summary || {};

  async function handleExcel() {
    try {
      const blob = await apiDownloadPaymentsExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      alert('Export xatoligi: ' + e.message);
    }
  }
  async function handleDebtorsExport() {
    try {
      const blob = await apiDownloadDebtors();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debtors-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      alert('Export xatoligi: ' + e.message);
    }
  }

  async function handlePayersExport() {
    try {
      const params = { payment_year: payersYear };
      if (payersMonth) params.payment_month = payersMonth;
      const blob = await apiDownloadPayers(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payers-${payersYear}${payersMonth ? '-' + String(payersMonth).padStart(2, '0') : ''}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      alert('Export xatoligi: ' + e.message);
    }
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
            { id: 'payers', label: "To'lovchilar" },
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
            <Stat label="Bugungi tushum" value={safeSummary.today_revenue != null ? `${fmt.format(safeSummary.today_revenue)} so'm` : '—'} tone="success" icon={I.TrendingUp} />
            <Stat label="Qarzdorlar soni" value={safeSummary.total_debtors ?? '—'} tone="danger" icon={I.AlertTriangle} />
            <Stat label="Bugungi sessiyalar" value={safeSummary.today_sessions ?? '—'} tone="navy" icon={I.Calendar} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
            <Stat label="7 kunlik daromad" value={safeSummary.last_7_days?.total_inflow != null ? `${fmt.format(safeSummary.last_7_days.total_inflow)} so'm` : '—'} tone="success" icon={I.TrendingUp} />
            <Stat label="30 kunlik daromad" value={safeSummary.last_30_days?.total_inflow != null ? `${fmt.format(safeSummary.last_30_days.total_inflow)} so'm` : '—'} tone="navy" icon={I.TrendingUp} />
            <Stat label="30 kunlik tranzaksiyalar" value={safeSummary.last_30_days?.successful_transactions ?? '—'} icon={I.Check} />
          </div>

          {safeSummary.last_7_days?.source_breakdown?.length > 0 && (
            <div className="card" style={{ padding: 16, marginBottom: 14 }}>
              <div className="card-title" style={{ marginBottom: 10 }}>7 kunlik to'lov manbalari</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {safeSummary.last_7_days.source_breakdown.map((s, i) => (
                  <div key={i} style={{ flex: '1 1 140px', padding: 12, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>{s.source}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{fmt.format(s.amount)} so'm</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.transaction_count} tranzaksiya</div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                {(financeReport.total_income !== undefined || financeReport.total_revenue !== undefined) && <Stat label="Jami daromad" value={`${fmt.format((financeReport.total_income || financeReport.total_revenue) || 0)} so'm`} tone="success" icon={I.TrendingUp} />}
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
              {financeReport.breakdown && Array.isArray(financeReport.breakdown) && financeReport.breakdown.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 10 }}>TO'LOV MANBAI BO'YICHA</div>
                  <table className="table">
                    <thead><tr><th>Manbai</th><th style={{ textAlign: 'right' }}>Summa</th><th style={{ textAlign: 'right' }}>Miqdori</th></tr></thead>
                    <tbody>
                      {financeReport.breakdown.map((b, i) => (
                        <tr key={i}>
                          <td>{b.source || '—'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt.format(b.total_amount || 0)} so'm</td>
                          <td style={{ textAlign: 'right', color: 'var(--muted)' }}>{b.transaction_count || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                    <th>Shartnoma</th>
                    <th>Guruh</th>
                    <th>Telefon</th>
                    <th>Muddati o'tgan oylar</th>
                    <th style={{ textAlign: 'right' }}>Qarz miqdori</th>
                  </tr>
                </thead>
                <tbody>
                  {debtors.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 18, color: 'var(--muted)' }}>Qarzdor topilmadi</td></tr>
                  )}
                  {debtors.map((d, idx) => (
                    <tr key={d.student_id || d.id || idx}>
                      <td style={{ fontWeight: 600 }}>{d.student_name || `#${d.student_id || idx}`}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{d.contract_number || '—'}</td>
                      <td style={{ color: 'var(--text-2)' }}>{d.group_name || '—'}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{d.primary_phone || d.father_phone || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(d.overdue_months || []).map((m, mi) => (
                            <span key={mi} className="chip danger" style={{ fontSize: 11 }}>{m.label}</span>
                          ))}
                          {(!d.overdue_months || d.overdue_months.length === 0) && <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brand-red)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt.format(d.debt_amount || Math.abs(d.debt || d.balance || 0))} so'm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'payers' && (
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <select value={payersYear} onChange={e => setPayersYear(Number(e.target.value))} style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}>
              {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={payersMonth} onChange={e => setPayersMonth(e.target.value)} style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}>
              <option value="">Barcha oylar</option>
              {['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'].map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{payers.length} ta to'lovchi</div>
            <button className="btn" onClick={handlePayersExport}><I.Download size={15} /> Excel export</button>
          </div>
          {payersLoading ? (
            <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>O'quvchi</th>
                    <th>Shartnoma</th>
                    <th>Guruh</th>
                    <th>To'langan oylar</th>
                    <th style={{ textAlign: 'right' }}>Jami to'lov</th>
                  </tr>
                </thead>
                <tbody>
                  {payers.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 18, color: 'var(--muted)' }}>To'lovchilar topilmadi</td></tr>
                  )}
                  {payers.map((p, idx) => {
                    const MONTH_NAMES = ['','Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
                    return (
                      <tr key={p.student_id || idx}>
                        <td style={{ fontWeight: 600 }}>{p.student_name || `#${p.student_id}`}</td>
                        <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{p.contract_number || '—'}</td>
                        <td style={{ color: 'var(--text-2)' }}>{p.group_name || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(p.payment_months || []).map((m, mi) => (
                              <span key={mi} className="chip success" style={{ fontSize: 11 }}>{MONTH_NAMES[m] || m}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>
                          {fmt.format(p.total_paid || 0)} so'm
                        </td>
                      </tr>
                    );
                  })}
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
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  // filters
  const [groupFilter, setGroupFilter] = React.useState('');
  const [birthYearFilter, setBirthYearFilter] = React.useState('');

  // add/edit modal
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    student_first_name: '', student_last_name: '', birth_year: '',
    father_name: '', father_phone: '', mother_name: '', mother_phone: '',
    group_id: '', priority: 0, notes: '',
  });

  // next in queue
  const [nextLoading, setNextLoading] = React.useState(false);
  const [nextEntry, setNextEntry] = React.useState(null);
  const [showNextModal, setShowNextModal] = React.useState(false);

  async function loadList(overrides = {}) {
    setLoading(true);
    try {
      const params = { page_size: 50, page, ...overrides };
      if (groupFilter) params.group_id = groupFilter;
      if (birthYearFilter) params.birth_year = birthYearFilter;
      const res = await apiGetWaitingList(params);
      setRows(res?.data || []);
      setTotalPages(res?.meta?.total_pages || 1);
      setTotalCount(res?.meta?.total || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    apiGetGroups({ page_size: 100 }).then(r => setGroups(r?.data || [])).catch(() => {});
  }, []);

  React.useEffect(() => { loadList(); }, [groupFilter, birthYearFilter, page]);

  async function loadNext() {
    if (!groupFilter) { alert("Guruhni tanlang"); return; }
    setNextLoading(true);
    try {
      const res = await apiGetWaitingListNext(Number(groupFilter));
      setNextEntry(res?.data || null);
      setShowNextModal(true);
    } catch (e) {
      alert('Xatolik: ' + e.message);
    } finally {
      setNextLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ student_first_name: '', student_last_name: '', birth_year: '', father_name: '', father_phone: '', mother_name: '', mother_phone: '', group_id: groupFilter || '', priority: 0, notes: '' });
    setShowModal(true);
  }

  function openEdit(r) {
    setEditing(r);
    setForm({
      student_first_name: r.student_first_name || '', student_last_name: r.student_last_name || '',
      birth_year: r.birth_year || '', father_name: r.father_name || '', father_phone: r.father_phone || '',
      mother_name: r.mother_name || '', mother_phone: r.mother_phone || '',
      group_id: String(r.group_id || ''), priority: r.priority ?? 0, notes: r.notes || '',
    });
    setShowModal(true);
  }

  async function save() {
    if (!form.student_first_name.trim() || !form.student_last_name.trim() || !form.birth_year) {
      onToast?.("Majburiy maydonlarni to'ldiring");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        student_first_name: form.student_first_name.trim(),
        student_last_name: form.student_last_name.trim(),
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
      loadList();
    } catch (e) {
      onToast?.('Xatolik: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm("Rostdan ham o'chirasizmi?")) return;
    try {
      await apiDeleteWaitingList(id);
      onToast?.("Nomzod o'chirildi");
      loadList();
    } catch (e) {
      onToast?.('Xatolik: ' + e.message);
    }
  }

  const groupMap = React.useMemo(() => {
    const m = {};
    groups.forEach(g => { m[g.id] = g.name; });
    return m;
  }, [groups]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Kutish ro'yxati</h1>
          <div className="page-sub">{totalCount} ta nomzod</div>
        </div>
        <div className="page-actions">
          {groupFilter && (
            <button className="btn ghost" onClick={loadNext} disabled={nextLoading}>
              <I.Users size={15}/> {nextLoading ? 'Yuklanmoqda...' : 'Navbatdagi'}
            </button>
          )}
          <button className="btn primary" onClick={openNew}><I.UserPlus size={15} /> Nomzod qo'shish</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={groupFilter} onChange={e => { setGroupFilter(e.target.value); setPage(1); }}
          style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: 13, minWidth: 160 }}>
          <option value="">Barcha guruhlar</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input
          type="number" placeholder="Tug'ilgan yil" value={birthYearFilter}
          onChange={e => { setBirthYearFilter(e.target.value); setPage(1); }}
          style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: 13, width: 130 }}
        />
        {(groupFilter || birthYearFilter) && (
          <button className="btn sm ghost" onClick={() => { setGroupFilter(''); setBirthYearFilter(''); setPage(1); }}>
            <I.X size={13}/> Filtrni tozalash
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>O'quvchi</th>
                <th>Ota-ona</th>
                <th>Tug'ilgan yil</th>
                <th>Guruh</th>
                <th>Prioritet</th>
                <th>Qo'shilgan</th>
                <th>Izoh</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={8} style={{ padding: 18, color: 'var(--muted)' }}>Nomzod topilmadi</td></tr>}
              {rows.map((r) => {
                const p = Number(r.priority || 0);
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.student_first_name} {r.student_last_name}</td>
                    <td style={{ fontSize: 12.5 }}>
                      {(r.father_name || r.father_phone) && (
                        <div><span style={{ color: 'var(--muted)' }}>Ota:</span> {r.father_name || '—'} {r.father_phone ? `· ${r.father_phone}` : ''}</div>
                      )}
                      {(r.mother_name || r.mother_phone) && (
                        <div><span style={{ color: 'var(--muted)' }}>Ona:</span> {r.mother_name || '—'} {r.mother_phone ? `· ${r.mother_phone}` : ''}</div>
                      )}
                      {!r.father_name && !r.father_phone && !r.mother_name && !r.mother_phone && <span style={{ color: 'var(--muted)' }}>—</span>}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{r.birth_year || '—'}</td>
                    <td>{groupMap[r.group_id] || (r.group_id ? `#${r.group_id}` : '—')}</td>
                    <td>
                      <span className={'chip' + (p >= 8 ? ' danger' : p >= 4 ? ' warning' : ' success')} style={{ fontSize: 11.5, fontWeight: 700 }}>
                        {p}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {(r.created_at || '').slice(0, 10)}
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12.5, maxWidth: 160 }}>{r.notes || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="icon-btn" style={{ width: 30, height: 30 }} title="Tahrirlash" onClick={() => openEdit(r)}><I.Edit size={13} /></button>
                        <button className="icon-btn" style={{ width: 30, height: 30, color: 'var(--brand-red)' }} title="O'chirish" onClick={() => remove(r.id)}><I.Trash size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6, padding: '12px 16px', borderTop: '1px solid var(--border)', alignItems: 'center' }}>
              <button className="btn sm ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ Oldingi</button>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{page} / {totalPages} · Jami: {totalCount}</span>
              <button className="btn sm ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Keyingi ›</button>
            </div>
          )}
        </div>
      )}

      {/* Next in queue modal */}
      {showNextModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 120 }} onClick={() => setShowNextModal(false)}>
          <div className="card" style={{ width: 460, padding: 24, boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17 }}>Navbatdagi nomzod — {groupMap[groupFilter] || `Guruh #${groupFilter}`}</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setShowNextModal(false)}><I.X size={15}/></button>
            </div>
            {nextEntry ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '12px 14px', background: 'var(--success-soft)', borderRadius: 10, border: '1px solid var(--success)' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>{nextEntry.student_first_name} {nextEntry.student_last_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 2 }}>Tug'ilgan yil: {nextEntry.birth_year || '—'} · Prioritet: <strong>{nextEntry.priority ?? 0}</strong></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {nextEntry.father_name && <div style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8 }}><div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>OTA</div><div style={{ fontSize: 13, fontWeight: 600 }}>{nextEntry.father_name}</div>{nextEntry.father_phone && <div style={{ fontSize: 12.5, color: 'var(--accent)' }}>{nextEntry.father_phone}</div>}</div>}
                  {nextEntry.mother_name && <div style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8 }}><div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>ONA</div><div style={{ fontSize: 13, fontWeight: 600 }}>{nextEntry.mother_name}</div>{nextEntry.mother_phone && <div style={{ fontSize: 12.5, color: 'var(--accent)' }}>{nextEntry.mother_phone}</div>}</div>}
                </div>
                {nextEntry.notes && <div style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, color: 'var(--muted)' }}>{nextEntry.notes}</div>}
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Qo'shilgan: {(nextEntry.created_at || '').slice(0, 10)}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button className="btn ghost" onClick={() => { setShowNextModal(false); openEdit(nextEntry); }}>
                    <I.Edit size={13}/> Tahrirlash
                  </button>
                  <button className="btn ghost" style={{ color: 'var(--brand-red)', borderColor: 'var(--brand-red)' }}
                    onClick={() => { setShowNextModal(false); remove(nextEntry.id); }}>
                    <I.Trash size={13}/> O'chirish
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty" style={{ padding: 24 }}>Bu guruh uchun kutish ro'yxati bo'sh</div>
            )}
          </div>
        </div>
      )}

      {/* Add/edit modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: 540, padding: 22, boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{editing ? 'Nomzodni tahrirlash' : 'Yangi nomzod'}</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setShowModal(false)}><I.X size={15} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field"><label>Ismi <span className="req">*</span></label><input value={form.student_first_name} onChange={(e) => setForm((p) => ({ ...p, student_first_name: e.target.value }))} /></div>
              <div className="field"><label>Familiyasi <span className="req">*</span></label><input value={form.student_last_name} onChange={(e) => setForm((p) => ({ ...p, student_last_name: e.target.value }))} /></div>
              <div className="field"><label>Tug'ilgan yil <span className="req">*</span></label><input type="number" min={2000} max={2020} value={form.birth_year} onChange={(e) => setForm((p) => ({ ...p, birth_year: e.target.value }))} placeholder="2010" /></div>
              <div className="field"><label>Guruh</label>
                <select value={form.group_id} onChange={(e) => setForm((p) => ({ ...p, group_id: e.target.value }))}>
                  <option value="">Tanlanmagan</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="field"><label>Ota ismi</label><input value={form.father_name} onChange={(e) => setForm((p) => ({ ...p, father_name: e.target.value }))} /></div>
              <div className="field"><label>Ota telefoni</label><input value={form.father_phone} onChange={(e) => setForm((p) => ({ ...p, father_phone: e.target.value }))} placeholder="+998..." /></div>
              <div className="field"><label>Ona ismi</label><input value={form.mother_name} onChange={(e) => setForm((p) => ({ ...p, mother_name: e.target.value }))} /></div>
              <div className="field"><label>Ona telefoni</label><input value={form.mother_phone} onChange={(e) => setForm((p) => ({ ...p, mother_phone: e.target.value }))} placeholder="+998..." /></div>
              <div className="field"><label>Prioritet (0–100)</label><input type="number" min={0} max={100} value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} /></div>
              <div className="field" style={{ gridColumn: 'span 2' }}><label>Izoh</label><textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button className="btn ghost" onClick={() => setShowModal(false)}>Bekor</button>
              <button className="btn primary" onClick={save} disabled={saving}><I.Check size={14} /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export function AuditLogsScreen() {
  const I = Icon;
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [entityType, setEntityType] = React.useState('');
  const [action, setAction] = React.useState('');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [searchInput, setSearchInput] = React.useState('');
  const [detail, setDetail] = React.useState(null);

  async function loadData() {
    setLoading(true);
    setLoadError('');
    try {
      const params = { page, page_size: 50 };
      if (entityType) params.entity_type = entityType;
      if (action) params.action = action;
      if (fromDate) params.from_date = fromDate + 'T00:00:00';
      if (toDate) params.to_date = toDate + 'T23:59:59';
      if (search) params.search = search;
      const res = await apiGetAuditLogs(params);
      setRows(res?.data || []);
      const meta = res?.meta;
      setTotalPages(meta?.total_pages || 1);
      setTotalCount(meta?.total || 0);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { loadData(); }, [page, entityType, action, fromDate, toDate, search]);

  function actionChip(a) {
    const s = String(a || '').toUpperCase();
    if (s === 'CREATE') return <span className="chip success">{a}</span>;
    if (s === 'UPDATE' || s === 'PATCH') return <span className="chip warning">{a}</span>;
    if (s === 'DELETE') return <span className="chip danger">{a}</span>;
    if (s === 'LOGIN') return <span className="chip navy">{a}</span>;
    if (s === 'CANCEL' || s === 'TERMINATE') return <span className="chip danger">{a}</span>;
    return <span className="chip">{a || '—'}</span>;
  }

  const hasFilters = entityType || action || fromDate || toDate || search;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Audit log</h1>
          <div className="page-sub">{totalCount} ta yozuv</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1); }} style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}>
          <option value="">Barcha ob'ekt</option>
          <option value="student">student</option>
          <option value="user">user</option>
          <option value="contract">contract</option>
          <option value="session">session</option>
          <option value="group">group</option>
          <option value="transaction">transaction</option>
          <option value="attendance">attendance</option>
        </select>
        <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }} style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}>
          <option value="">Barcha amal</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="LOGIN">LOGIN</option>
          <option value="CANCEL">CANCEL</option>
          <option value="TERMINATE">TERMINATE</option>
        </select>
        <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }} />
        <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }} />
        <div style={{ display: 'flex', gap: 0 }}>
          <input placeholder="Qidiruv..." value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }} style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: '8px 0 0 8px', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, width: 180 }} />
          <button className="btn" style={{ borderRadius: '0 8px 8px 0', height: 36 }} onClick={() => { setSearch(searchInput); setPage(1); }}><I.Search size={14} /></button>
        </div>
        {hasFilters && (
          <button className="btn ghost" onClick={() => { setEntityType(''); setAction(''); setFromDate(''); setToDate(''); setSearch(''); setSearchInput(''); setPage(1); }} style={{ height: 36, fontSize: 13 }}>
            <I.X size={13} /> Tozalash
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Foydalanuvchi</th>
                <th>Amal</th>
                <th>Ob'ekt</th>
                <th>Nomi</th>
                <th>Tavsif</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 18, color: 'var(--muted)' }}>{loadError || 'Yozuv topilmadi'}</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setDetail(r)}>
                  <td style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', fontSize: 12.5 }}>{(r.created_at || '').slice(0, 19).replace('T', ' ')}</td>
                  <td style={{ fontSize: 13 }}>{r.user_full_name || `#${r.user_id || '—'}`}</td>
                  <td>{actionChip(r.action)}</td>
                  <td><span className="chip">{r.entity_type || '—'}</span></td>
                  <td style={{ fontSize: 13 }}>{r.entity_label || (r.entity_id ? `#${r.entity_id}` : '—')}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 14px' }}>‹ Oldingi</button>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{page} / {totalPages}</span>
          <button className="btn ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 14px' }}>Keyingi ›</button>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,20,38,0.6)', display: 'grid', placeItems: 'center', zIndex: 140 }} onClick={() => setDetail(null)}>
          <div className="card" style={{ width: 560, padding: 18 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>Audit log #{detail.id}</h3>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setDetail(null)}><I.X size={15} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Sana', (detail.created_at || '').slice(0, 19).replace('T', ' ')],
                ['Foydalanuvchi', detail.user_full_name || `#${detail.user_id}`],
                ['Amal', detail.action],
                ["Ob'ekt turi", detail.entity_type],
                ["Ob'ekt ID", detail.entity_id],
                ["Ob'ekt nomi", detail.entity_label],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 13.5 }}>{v || '—'}</div>
                </div>
              ))}
            </div>
            {detail.description && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, marginBottom: 4 }}>Tavsif</div>
                <div style={{ fontSize: 13.5 }}>{detail.description}</div>
              </div>
            )}
            {detail.extra && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, marginBottom: 6 }}>Qo'shimcha ma'lumot</div>
                <pre style={{ fontSize: 12, background: 'var(--bg)', padding: 10, borderRadius: 8, overflowX: 'auto', margin: 0 }}>{typeof detail.extra === 'string' ? detail.extra : JSON.stringify(detail.extra, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
