// @ts-nocheck
import React from 'react';
import { Icon } from './icons';
import { MOCK } from './data';
import {
  apiGetContracts,
  apiGetContract,
  apiGetContractPdf,
  apiRegenerateContractPdf,
  apiGetGateLogs,
  apiGetUsers,
  apiGetRoles,
  apiCreateRole,
  apiUpdateRole,
  apiDeleteRole,
  apiGetSettings,
  apiUpdateSettings,
  apiGetTransactions,
  apiGetReportsSummary,
  apiGetReportsRevenueDynamics,
  apiGetReportsPaymentsBySource,
  apiGetWaitingList,
  apiCreateWaitingList,
  apiUpdateWaitingList,
  apiDeleteWaitingList,
} from './api';

const fmt = new Intl.NumberFormat('uz-UZ');

function Stat({ label, value, sub, tone = 'default', icon: Ic }) {
  const toneStyle = {
    default: { bg: 'var(--surface)', border: 'var(--border)', val: 'var(--text)' },
    success: { bg: 'var(--success-soft)', border: 'transparent', val: 'var(--success)' },
    warning: { bg: 'var(--warning-soft)', border: 'transparent', val: 'var(--warning)' },
    danger: { bg: 'var(--accent-soft)', border: 'transparent', val: 'var(--brand-red)' },
    navy: { bg: 'rgba(15,31,77,0.08)', border: 'transparent', val: 'var(--brand-navy)' },
  }[tone];

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

// Contracts
export function ContractsScreen({ onOpenContract }) {
  const I = Icon;
  const [contracts, setContracts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  React.useEffect(() => {
    apiGetContracts({ page_size: 200 })
      .then((res) => setContracts(res?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rows = contracts.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      if (!(c.contract_number || '').toLowerCase().includes(q) && !(c.student_name || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Shartnomalar</h1>
          <div className="page-sub">{contracts.length} ta shartnoma</div>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Download size={15} /> Export</button>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="search" style={{ maxWidth: 320 }}>
            <span className="icon-l"><I.Search size={15} /></span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Raqam yoki o'quvchi..." />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}
          >
            <option value="all">Barcha statuslar</option>
            <option value="active">Faol</option>
            <option value="cancelled">Bekor qilingan</option>
            <option value="finished">Tugagan</option>
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--muted)' }}>{rows.length} natija</div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Shartnoma №</th>
              <th>O'quvchi</th>
              <th>Mijoz</th>
              <th>Davr</th>
              <th>Oylik to'lov</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} onClick={() => onOpenContract?.(c.id)}>
                <td style={{ fontWeight: 700 }}>{c.contract_number}</td>
                <td>{c.student_name || '—'}</td>
                <td style={{ color: 'var(--text-2)' }}>{c.customer_name || c.custom_fields?.customer_full_name || '—'}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {c.start_date || '—'}
                  {' '}
                  <span style={{ color: 'var(--muted)' }}>→</span>
                  {' '}
                  {c.end_date || '—'}
                </td>
                <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt.format(c.monthly_fee || 0)} so'm</td>
                <td>
                  {c.status === 'active' && <span className="chip success"><span className="chip-dot"></span>Faol</span>}
                  {c.status === 'cancelled' && <span className="chip"><span className="chip-dot"></span>Bekor</span>}
                  {c.status === 'finished' && <span className="chip warning"><span className="chip-dot"></span>Tugagan</span>}
                </td>
                <td><button className="icon-btn" style={{ width: 30, height: 30 }}><I.More size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ContractView({ contractId, onBack }) {
  const I = Icon;
  const [contract, setContract] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [regenerating, setRegenerating] = React.useState(false);

  React.useEffect(() => {
    if (!contractId) return;
    setLoading(true);
    apiGetContract(contractId)
      .then((res) => setContract(res?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [contractId]);

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

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;
  if (!contract) return <div className="empty" style={{ padding: 48 }}>Shartnoma topilmadi</div>;

  const cf = contract.custom_fields || {};

  return (
    <div>
      <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 14 }}><I.ArrowLeft size={14} /> Shartnomalar</button>
      <div className="page-head">
        <div>
          <h1 className="page-title">{contract.contract_number}</h1>
          <div className="page-sub">Shartnoma ma'lumotlari va PDF</div>
        </div>
        <div className="page-actions">
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
              ['Status', contract.status],
              ["O'quvchi", contract.student_name || '—'],
              ['Mijoz', contract.customer_name || cf.customer_full_name || '—'],
              ['Boshlanish sanasi', contract.start_date || '—'],
              ['Tugash sanasi', contract.end_date || '—'],
              ["Oylik to'lov", `${fmt.format(contract.monthly_fee || 0)} so'm`],
              ["Forma to'lovi", `${fmt.format(contract.uniform_fee || 0)} so'm`],
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
            <div style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Pasport</div>
              <div style={{ fontWeight: 600 }}>{cf.customer_passport_number || '—'}</div>
            </div>
            <div style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Manzil</div>
              <div style={{ fontWeight: 600 }}>{cf.customer_address || '—'}</div>
            </div>
            <div style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Yaratilgan</div>
              <div style={{ fontWeight: 600 }}>{(contract.created_at || '').slice(0, 19).replace('T', ' ') || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Gate
export function GateLogsScreen() {
  const I = Icon;
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState('today');

  React.useEffect(() => {
    apiGetGateLogs({ page_size: 200 })
      .then((res) => setLogs(res?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rows = logs.filter((l) => {
    if (period === 'all') return true;
    const d = (l.timestamp || '').slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    if (period === 'today') return d === today;
    const w = new Date();
    w.setDate(w.getDate() - 7);
    if (period === 'week') return d >= w.toISOString().slice(0, 10);
    return true;
  });

  const inCount = rows.filter((l) => l.direction === 'in').length;
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
          <button className="btn"><I.Download size={15} /> CSV</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
        <Stat label="Kirishlar" value={inCount} tone="success" icon={I.LogIn} />
        <Stat label="Chiqishlar" value={outCount} tone="navy" icon={I.LogOut} />
        <Stat label="Rad etilgan" value={denied} tone="danger" icon={I.ShieldOff} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {rows.length === 0 && <div className="empty">Log topilmadi</div>}
        {rows.map((l) => (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: l.direction === 'in' ? 'var(--success-soft)' : 'rgba(15,31,77,0.08)', color: l.direction === 'in' ? 'var(--success)' : 'var(--brand-navy)', display: 'grid', placeItems: 'center' }}>
              {l.direction === 'in' ? <I.LogIn size={16} /> : <I.LogOut size={16} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{l.student_name || `#${l.student_id || '—'}`}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{l.method === 'face' ? 'Face ID' : 'Manual'} · {l.allowed ? 'Ruxsat' : 'Rad etilgan'}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{(l.timestamp || '').replace('T', ' ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const GateScreen = GateLogsScreen;

// Users
export function UsersScreen() {
  const I = Icon;
  const [users, setUsers] = React.useState([]);
  const [roles, setRoles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState('users');
  const [newRole, setNewRole] = React.useState({ name: '', display_name: '', permissions: [] });

  const PERMS = ['students.read', 'students.write', 'groups.read', 'groups.write', 'payments.read', 'payments.write', 'users.read', 'users.write', 'settings.write'];

  async function load() {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([apiGetUsers({ page_size: 200 }), apiGetRoles()]);
      setUsers(uRes?.data || []);
      setRoles(rRes?.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function createRole() {
    if (!newRole.name || !newRole.display_name) return;
    await apiCreateRole(newRole);
    setNewRole({ name: '', display_name: '', permissions: [] });
    load();
  }

  async function toggleRoleActive(role) {
    await apiUpdateRole(role.id, { ...role, is_active: !role.is_active });
    load();
  }

  async function removeRole(roleId) {
    if (!confirm("Rostdan ham o'chirasizmi?")) return;
    await apiDeleteRole(roleId);
    load();
  }

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Foydalanuvchilar va rollar</h1>
          <div className="page-sub">{users.length} foydalanuvchi · {roles.length} rol</div>
        </div>
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
            <thead><tr><th>F.I.O.</th><th>Username</th><th>Rol</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td>{u.username}</td>
                  <td><span className="chip navy">{u.role_name || '—'}</span></td>
                  <td>{u.is_active ? <span className="chip success">Faol</span> : <span className="chip">Nofaol</span>}</td>
                  <td><button className="icon-btn" style={{ width: 30, height: 30 }}><I.More size={15} /></button></td>
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
              <thead><tr><th>Rol</th><th>Tizim nomi</th><th>Huquqlar</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.display_name}</td>
                    <td>{r.name}</td>
                    <td style={{ color: 'var(--muted)' }}>{(r.permissions || []).length} ta</td>
                    <td>
                      <button className="btn sm" onClick={() => toggleRoleActive(r)} style={{ background: r.is_active ? 'var(--success-soft)' : 'var(--surface-2)', color: r.is_active ? 'var(--success)' : 'var(--muted)', border: 'none' }}>
                        {r.is_active ? 'Faol' : 'Nofaol'}
                      </button>
                    </td>
                    <td>
                      <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => removeRole(r.id)}>
                        <I.Trash2 size={15} color="var(--brand-red)" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Yangi rol</div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Display name</label>
              <input value={newRole.display_name} onChange={(e) => setNewRole((p) => ({ ...p, display_name: e.target.value }))} placeholder="Masalan: Menejer" />
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Tizim nomi</label>
              <input value={newRole.name} onChange={(e) => setNewRole((p) => ({ ...p, name: e.target.value }))} placeholder="manager" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Ruxsatlar</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {PERMS.map((p) => {
                const checked = newRole.permissions.includes(p);
                return (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setNewRole((prev) => ({
                          ...prev,
                          permissions: e.target.checked ? [...prev.permissions, p] : prev.permissions.filter((x) => x !== p),
                        }));
                      }}
                    />
                    {p}
                  </label>
                );
              })}
            </div>
            <button className="btn primary" onClick={createRole}><I.Check size={14} /> Saqlash</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Settings
export function SettingsScreen() {
  const I = Icon;
  const [settings, setSettings] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('general');

  const tabDefs = [
    { id: 'general', label: 'Umumiy', icon: I.Settings },
    { id: 'billing', label: "To'lov", icon: I.CreditCard },
    { id: 'security', label: 'Xavfsizlik', icon: I.Shield },
    { id: 'integrations', label: 'Integratsiya', icon: I.Link },
  ];

  React.useEffect(() => {
    apiGetSettings().then((res) => setSettings(res || {})).catch(() => {}).finally(() => setLoading(false));
  }, []);

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
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  marginBottom: 6,
                  background: active ? 'var(--selected)' : 'transparent',
                  color: active ? 'var(--brand-navy)' : 'var(--text-2)',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                <Ic size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="card" style={{ padding: 18 }}>
          {activeTab === 'general' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field"><label>Kompaniya nomi</label><input value={settings.company_name || ''} onChange={(e) => setVal('company_name', e.target.value)} /></div>
              <div className="field"><label>INN</label><input value={settings.company_inn || ''} onChange={(e) => setVal('company_inn', e.target.value)} /></div>
              <div className="field" style={{ gridColumn: 'span 2' }}><label>Manzil</label><input value={settings.company_address || ''} onChange={(e) => setVal('company_address', e.target.value)} /></div>
              <div className="field"><label>Telefon</label><input value={settings.company_phone || ''} onChange={(e) => setVal('company_phone', e.target.value)} /></div>
              <div className="field"><label>Email</label><input value={settings.company_email || ''} onChange={(e) => setVal('company_email', e.target.value)} /></div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field"><label>Valyuta</label><input value={settings.currency || "so'm"} onChange={(e) => setVal('currency', e.target.value)} /></div>
              <div className="field"><label>Default oylik to'lov</label><input type="number" value={settings.default_monthly_fee || ''} onChange={(e) => setVal('default_monthly_fee', Number(e.target.value))} /></div>
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
        </div>
      </div>
    </div>
  );
}

// Transactions
export function TransactionsScreen() {
  const I = Icon;
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [source, setSource] = React.useState('all');

  React.useEffect(() => {
    apiGetTransactions({ page_size: 200 }).then((res) => setRows(res?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const list = rows.filter((r) => source === 'all' ? true : r.source === source);
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
          <select value={source} onChange={(e) => setSource(e.target.value)} style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }}>
            <option value="all">Barchasi</option>
            <option value="cash">Naqd</option>
            <option value="click">Click</option>
            <option value="payme">Payme</option>
            <option value="terminal">Terminal</option>
          </select>
          <button className="btn"><I.Download size={15} /> Export</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Sana</th><th>O'quvchi</th><th>Manba</th><th>Oylar</th><th style={{ textAlign: 'right' }}>Summa</th><th>Status</th></tr></thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id}>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{(t.paid_at || '').slice(0, 10)}</td>
                <td>{t.student_name || `#${t.student_id}`}</td>
                <td><span className="chip">{t.source}</span></td>
                <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{(t.payment_months || []).join(', ') || '—'}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt.format(t.amount || 0)} so'm</td>
                <td>
                  {t.status === 'SETTLED' && <span className="chip success">To'langan</span>}
                  {t.status === 'UNASSIGNED' && <span className="chip warning">Biriktirilmagan</span>}
                  {t.status === 'CANCELLED' && <span className="chip">Bekor</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Reports
export function ReportsScreen() {
  const I = Icon;
  const [summary, setSummary] = React.useState(null);
  const [dyn, setDyn] = React.useState([]);
  const [bySource, setBySource] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([apiGetReportsSummary(), apiGetReportsRevenueDynamics('month'), apiGetReportsPaymentsBySource()])
      .then(([s, d, p]) => {
        setSummary(s || null);
        setDyn(d || []);
        setBySource(p || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty" style={{ padding: 48 }}>Yuklanmoqda...</div>;
  if (!summary) return <div className="empty" style={{ padding: 48 }}>Hisobotlar mavjud emas</div>;

  const maxRevenue = Math.max(1, ...dyn.map((d) => d.total_revenue || 0));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Hisobotlar</h1>
          <div className="page-sub">Dashboard va moliyaviy ko'rsatkichlar</div>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Download size={15} /> PDF</button>
          <button className="btn"><I.Download size={15} /> Excel</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
        <Stat label="Faol o'quvchilar" value={summary.active_students} icon={I.Users} />
        <Stat label="Shu oy tushumi" value={`${fmt.format(summary.current_month_revenue || 0)} so'm`} tone="success" icon={I.TrendingUp} />
        <Stat label="Qarzdorlik" value={`${fmt.format(summary.current_debt || 0)} so'm`} tone="danger" icon={I.AlertTriangle} />
        <Stat label="Davomat" value={`${summary.attendance_rate || 0}%`} tone="navy" icon={I.Activity} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Tushum dinamikasi</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, dyn.length)}, 1fr)`, gap: 8, alignItems: 'end', minHeight: 220 }}>
            {dyn.map((d) => {
              const h = Math.max(8, Math.round(((d.total_revenue || 0) / maxRevenue) * 180));
              return (
                <div key={d.period} style={{ textAlign: 'center' }}>
                  <div style={{ height: h, borderRadius: 8, background: 'linear-gradient(180deg,#1B3A6F,#0F1F4D)', marginBottom: 8 }} />
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{d.period}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700 }}>{fmt.format(d.total_revenue || 0)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>To'lov manbalari</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bySource.map((s) => (
              <div key={s.source}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12.5 }}>
                  <span style={{ textTransform: 'capitalize' }}>{s.source}</span>
                  <span>{s.percentage}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${s.percentage}%`, height: '100%', background: 'var(--brand-navy)' }} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>{fmt.format(s.total_amount || 0)} so'm</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Waiting list
export function WaitingListScreen() {
  const I = Icon;
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ first_name: '', last_name: '', phone: '', date_of_birth: '', preferred_position: '', notes: '', status: 'new' });

  async function load() {
    setLoading(true);
    try {
      const res = await apiGetWaitingList({ page_size: 200 });
      setRows(res?.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ first_name: '', last_name: '', phone: '', date_of_birth: '', preferred_position: '', notes: '', status: 'new' });
    setShowModal(true);
  }

  function openEdit(r) {
    setEditing(r);
    setForm({
      first_name: r.first_name || '',
      last_name: r.last_name || '',
      phone: r.phone || '',
      date_of_birth: r.date_of_birth || '',
      preferred_position: r.preferred_position || '',
      notes: r.notes || '',
      status: r.status || 'new',
    });
    setShowModal(true);
  }

  async function save() {
    if (!form.first_name || !form.last_name || !form.phone) return;
    if (editing) await apiUpdateWaitingList(editing.id, form);
    else await apiCreateWaitingList(form);
    setShowModal(false);
    load();
  }

  async function remove(id) {
    if (!confirm("Rostdan ham o'chirasizmi?")) return;
    await apiDeleteWaitingList(id);
    load();
  }

  const byStatus = {
    new: rows.filter((r) => r.status === 'new').length,
    contacted: rows.filter((r) => r.status === 'contacted').length,
    accepted: rows.filter((r) => r.status === 'accepted').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
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
        <Stat label="Yangi" value={byStatus.new} tone="navy" />
        <Stat label="Bog'langan" value={byStatus.contacted} tone="warning" />
        <Stat label="Qabul qilingan" value={byStatus.accepted} tone="success" />
        <Stat label="Rad etilgan" value={byStatus.rejected} tone="danger" />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>F.I.O.</th><th>Telefon</th><th>Tug'ilgan sana</th><th>Pozitsiya</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.first_name} {r.last_name}</td>
                <td>{r.phone}</td>
                <td>{r.date_of_birth || '—'}</td>
                <td>{r.preferred_position || '—'}</td>
                <td>
                  {r.status === 'new' && <span className="chip">Yangi</span>}
                  {r.status === 'contacted' && <span className="chip warning">Bog'langan</span>}
                  {r.status === 'accepted' && <span className="chip success">Qabul</span>}
                  {r.status === 'rejected' && <span className="chip">Rad</span>}
                </td>
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
              <div className="field"><label>Ism</label><input value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} /></div>
              <div className="field"><label>Familiya</label><input value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} /></div>
              <div className="field"><label>Telefon</label><input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
              <div className="field"><label>Tug'ilgan sana</label><input type="date" value={form.date_of_birth} onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))} /></div>
              <div className="field"><label>Pozitsiya</label><input value={form.preferred_position} onChange={(e) => setForm((p) => ({ ...p, preferred_position: e.target.value }))} /></div>
              <div className="field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="new">Yangi</option>
                  <option value="contacted">Bog'langan</option>
                  <option value="accepted">Qabul</option>
                  <option value="rejected">Rad</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: 'span 2' }}><label>Izoh</label><textarea rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></div>
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
