const BASE_URL = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:8008').replace(/\/$/, '');

const TOKEN_KEY = 'alpha_token';
const REFRESH_KEY = 'alpha_refresh';

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setTokens(access, refresh) {
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function getRefreshToken() { return localStorage.getItem(REFRESH_KEY); }

let _onUnauthorized = null;
export function setUnauthorizedHandler(fn) { _onUnauthorized = fn; }

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach(v => q.append(key, String(v)));
      return;
    }
    q.set(key, String(value));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

function extractErrorMessage(json, fallback) {
  if (!json) return fallback;
  if (typeof json.detail === 'string') return json.detail;
  if (Array.isArray(json.detail) && json.detail.length) {
    return json.detail.map(d => d?.msg).filter(Boolean).join(', ') || fallback;
  }
  if (typeof json.message === 'string') return json.message;
  return fallback;
}

let _refreshPromise = null;

async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('Sessiya tugagan. Qayta kiring.');

  _refreshPromise = (async () => {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    let json = {};
    try { json = await res.json(); } catch {}
    if (!res.ok) {
      throw new Error(extractErrorMessage(json, 'Token yangilashda xatolik'));
    }
    setTokens(json.access_token, json.refresh_token);
    return json;
  })();

  try {
    return await _refreshPromise;
  } finally {
    _refreshPromise = null;
  }
}

export async function apiFetch(path, options = {}, _isRetry = false) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = { ...options.headers };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  headers['Accept'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE_URL + path, { ...options, headers });

  if (res.status === 401) {
    try {
      if (!_isRetry) {
        await refreshAccessToken();
        return apiFetch(path, options, true);
      }
    } catch {
      // fall through to logout
    }
    clearTokens();
    if (_onUnauthorized) _onUnauthorized();
    return null;
  }

  let json;
  try { json = await res.json(); } catch { json = {}; }

  if (!res.ok) throw new Error(extractErrorMessage(json, `Xatolik: ${res.status}`));
  return json;
}

// Auth
export async function apiLogin(phone_or_email, password) {
  const res = await fetch(BASE_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_or_email, password }),
  });
  let json;
  try { json = await res.json(); } catch { json = {}; }
  if (!res.ok) throw new Error(extractErrorMessage(json, 'Login xatolik'));
  setTokens(json.access_token, json.refresh_token);
  return json;
}

export async function apiGetMe() {
  const json = await apiFetch('/auth/me');
  return json; // { user: UserWithRoles, permissions: string[] }
}

export function apiLogout() { clearTokens(); }

// Users
export async function apiGetUsers(params = {}) {
  return apiFetch(`/users${buildQuery(params)}`);
}

export async function apiGetUser(id) {
  return apiFetch(`/users/${id}`);
}

export async function apiCreateUser(data) {
  return apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateUser(id, data) {
  return apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiUpdateUserRoles(id, role_ids) {
  return apiFetch(`/users/${id}/roles`, { method: 'PATCH', body: JSON.stringify({ role_ids }) });
}

export async function apiDeleteUser(id) {
  return apiFetch(`/users/${id}`, { method: 'DELETE' });
}

export async function apiChangePassword(id, data) {
  return apiFetch(`/users/${id}/change-password`, { method: 'POST', body: JSON.stringify(data) });
}

// Roles
export async function apiGetRoles() {
  return apiFetch('/roles');
}

export async function apiCreateRole(data) {
  return apiFetch('/roles', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateRole(id, data) {
  return apiFetch(`/roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiDeleteRole(id) {
  return apiFetch(`/roles/${id}`, { method: 'DELETE' });
}

export async function apiGetPermissions() {
  return apiFetch('/roles/permissions');
}

// Students
export async function apiGetStudents(params = {}) {
  return apiFetch(`/students${buildQuery(params)}`);
}

export async function apiGetStudent(id) {
  return apiFetch(`/students/${id}`);
}

export async function apiCreateStudent(formData) {
  return apiFetch('/students', { method: 'POST', body: formData });
}

export async function apiUpdateStudent(id, formData) {
  return apiFetch(`/students/${id}`, { method: 'PATCH', body: formData });
}

export async function apiDeleteStudent(id) {
  return apiFetch(`/students/${id}`, { method: 'DELETE' });
}

export async function apiGetStudentFullInfo(id) {
  return apiFetch(`/students/fullinfo/${id}`);
}

export async function apiGetStudentAttendance(id, params = {}) {
  return apiFetch(`/students/${id}/attendance${buildQuery(params)}`);
}

export async function apiGetStudentTransactions(id) {
  return apiFetch(`/students/${id}/transactions`);
}

export async function apiGetStudentGateLogs(id) {
  return apiFetch(`/students/${id}/gatelogs`);
}

export async function apiGetStudentContracts(id) {
  return apiFetch(`/students/${id}/contract`);
}

// Coaches
export async function apiGetCoaches() {
  return apiFetch('/users/coaches');
}

export async function apiGetCoachGroups() {
  return apiFetch('/coach/groups');
}

export async function apiGetGroupPerformanceTable(groupId, season_year) {
  return apiFetch(`/coach/groups/${groupId}/performance-table${buildQuery({ season_year })}`);
}

export async function apiSaveGroupPerformanceTable(groupId, data) {
  return apiFetch(`/coach/groups/${groupId}/performance-table`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Groups
export async function apiGetGroups(params = {}) {
  return apiFetch(`/groups${buildQuery(params)}`);
}

export async function apiGetGroup(id) {
  return apiFetch(`/groups/${id}`);
}

export async function apiCreateGroup(data) {
  return apiFetch('/groups', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateGroup(id, data) {
  return apiFetch(`/groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiDeleteGroup(id) {
  return apiFetch(`/groups/${id}`, { method: 'DELETE' });
}

export async function apiGetGroupStudents(id) {
  return apiFetch(`/groups/${id}/students`);
}

// Sessions
export async function apiGetSessions(params = {}) {
  const normalized = { ...params };
  if (normalized.session_date && !normalized.date) {
    normalized.date = normalized.session_date;
    delete normalized.session_date;
  }
  return apiFetch(`/head-coach/sessions${buildQuery(normalized)}`);
}

export async function apiCreateSession(data) {
  return apiFetch('/head-coach/sessions', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateSession(id, data) {
  return apiFetch(`/head-coach/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function apiDeleteSession(id) {
  return apiFetch(`/head-coach/sessions/${id}`, { method: 'DELETE' });
}

export async function apiGetSessionDetails(id) {
  return apiFetch(`/head-coach/sessions/${id}`);
}

// Attendance (coach)
export async function apiGetCoachSessions(params = {}) {
  return apiFetch(`/coach/sessions${buildQuery(params)}`);
}

export async function apiMarkAttendance(sessionId, data) {
  if (Array.isArray(data?.attendances)) {
    return apiFetch(`/coach/sessions/${sessionId}/bulk-attendance`, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, attendances: data.attendances }),
    });
  }
  return apiFetch(`/coach/sessions/${sessionId}/attendance`, { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateAttendance(sessionId, data) {
  return apiFetch(`/coach/sessions/${sessionId}/attendance`, { method: 'PUT', body: JSON.stringify(data) });
}

// Contracts
export async function apiGetContracts(params = {}) {
  return apiFetch(`/contracts${buildQuery(params)}`);
}

export async function apiGetContractStats() {
  return apiFetch('/contracts/stats');
}

export async function apiGetContract(id) {
  return apiFetch(`/contracts/${id}`);
}

export async function apiTerminateContract(id, data) {
  return apiFetch(`/contracts/${id}/terminate`, { method: 'POST', body: JSON.stringify(data) });
}

export async function apiPatchContractStatus(id, data) {
  return apiFetch(`/contracts/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiPatchContractMonthlyFee(id, data) {
  return apiFetch(`/contracts/${id}/monthly-fee`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiPatchContractDates(id, data) {
  return apiFetch(`/contracts/${id}/dates`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiRegenerateContractPdf(id) {
  return apiFetch(`/contracts/${id}/regenerate-pdf`, { method: 'POST' });
}

export function apiContractPdfUrl(id) {
  return `${BASE_URL}/contracts/${id}/pdf`;
}

// Transactions
export async function apiGetTransactions(params = {}) {
  return apiFetch(`/transactions${buildQuery(params)}`);
}

export async function apiGetTransactionsWithName(params = {}) {
  return apiFetch(`/transactions/withname${buildQuery(params)}`);
}

export async function apiGetTransactionStats(params = {}) {
  return apiFetch(`/transactions/transactionstatistics${buildQuery(params)}`);
}

export async function apiCreateManualTransaction(data) {
  return apiFetch('/transactions/manual', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiCreateManualTransactionWithProof(formData) {
  return apiFetch('/transactions/manual/with-proof', { method: 'POST', body: formData });
}

export async function apiAssignTransaction(id, data) {
  return apiFetch(`/transactions/${id}/assign`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiCancelTransaction(id) {
  return apiFetch(`/transactions/${id}/cancel`, { method: 'PATCH' });
}

export async function apiDeleteTransaction(id) {
  return apiFetch(`/transactions/${id}`, { method: 'DELETE' });
}

// Gate
export async function apiGetGateLogs(params = {}) {
  const normalized = { ...params };
  if (normalized.date && !normalized.from_date && !normalized.to_date) {
    normalized.from_date = `${normalized.date}T00:00:00`;
    normalized.to_date = `${normalized.date}T23:59:59`;
    delete normalized.date;
  }
  return apiFetch(`/gate/logs${buildQuery(normalized)}`);
}

// Reports
export async function apiGetDashboard() {
  return apiFetch('/reports/dashboard/summary');
}

export async function apiGetDebtors(params = {}) {
  return apiFetch(`/reports/debtors${buildQuery(params)}`);
}

export async function apiGetPayers(params = {}) {
  return apiFetch(`/reports/payers${buildQuery(params)}`);
}

export async function apiGetFinanceReport(params = {}) {
  return apiFetch(`/reports/finance${buildQuery(params)}`);
}

export async function apiGetAttendanceGroupsReport(params = {}) {
  return apiFetch(`/reports/attendance/groups${buildQuery(params)}`);
}

export function apiDebtorsExportUrl() {
  return `${BASE_URL}/reports/debtors/export`;
}

export function apiPaymentsExcelUrl(params = {}) {
  return `${BASE_URL}/reports/payments-excel${buildQuery(params)}`;
}

// Settings
export async function apiGetSettings() {
  return apiFetch('/settings/system');
}

export async function apiPatchSettings(data) {
  return apiFetch('/settings/system', { method: 'PATCH', body: JSON.stringify(data) });
}

// Waiting List
export async function apiGetWaitingList(params = {}) {
  return apiFetch(`/waiting-list${buildQuery(params)}`);
}

export async function apiCreateWaitingList(data) {
  return apiFetch('/waiting-list', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateWaitingList(id, data) {
  return apiFetch(`/waiting-list/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiDeleteWaitingList(id) {
  return apiFetch(`/waiting-list/${id}`, { method: 'DELETE' });
}

// Students extra
export async function apiChangeStudentGroup(id, group_id) {
  return apiFetch(`/students/${id}/group?group_id=${encodeURIComponent(group_id)}`, { method: 'PATCH' });
}

export async function apiUploadStudentPhoto(id, formData) {
  return apiFetch(`/students/${id}/photo`, { method: 'POST', body: formData });
}

export async function apiUploadStudentPassport(id, formData) {
  return apiFetch(`/students/${id}/passport`, { method: 'POST', body: formData });
}

export async function apiUploadStudentExtraFile(id, formData) {
  return apiFetch(`/students/${id}/extra-file`, { method: 'POST', body: formData });
}
