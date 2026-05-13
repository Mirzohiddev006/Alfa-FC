// @ts-nocheck
const BASE_URL = 'https://api.alpha.cognilabs.org';

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

let _onUnauthorized = null;
export function setUnauthorizedHandler(fn) { _onUnauthorized = fn; }

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = { ...options.headers };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE_URL + path, { ...options, headers });

  if (res.status === 401) {
    clearTokens();
    if (_onUnauthorized) _onUnauthorized();
    return null;
  }

  let json;
  try { json = await res.json(); } catch { json = {}; }

  if (!res.ok) throw new Error(json.detail || `Xatolik: ${res.status}`);
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
  if (!res.ok) throw new Error(json.detail || 'Login xatolik');
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
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/users${q ? '?' + q : ''}`);
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
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/students${q ? '?' + q : ''}`);
}

export async function apiGetStudent(id) {
  return apiFetch(`/students/${id}`);
}

export async function apiCreateStudent(formData) {
  return apiFetch('/students', { method: 'POST', body: formData });
}

export async function apiUpdateStudent(id, formData) {
  return apiFetch(`/students/${id}`, { method: 'PUT', body: formData });
}

export async function apiDeleteStudent(id) {
  return apiFetch(`/students/${id}`, { method: 'DELETE' });
}

export async function apiGetStudentFullInfo(id) {
  return apiFetch(`/students/fullinfo/${id}`);
}

export async function apiGetStudentAttendance(id, params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/students/${id}/attendance${q ? '?' + q : ''}`);
}

export async function apiGetStudentTransactions(id) {
  return apiFetch(`/students/${id}/transactions`);
}

export async function apiGetStudentGateLogs(id) {
  return apiFetch(`/students/${id}/gatelogs`);
}

export async function apiGetStudentContracts(id) {
  return apiFetch(`/students/${id}/contracts`);
}

// Coaches
export async function apiGetCoaches() {
  return apiFetch('/users/coaches');
}

// Groups
export async function apiGetGroups(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/groups${q ? '?' + q : ''}`);
}

export async function apiGetGroup(id) {
  return apiFetch(`/groups/${id}`);
}

export async function apiCreateGroup(data) {
  return apiFetch('/groups', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateGroup(id, data) {
  return apiFetch(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function apiDeleteGroup(id) {
  return apiFetch(`/groups/${id}`, { method: 'DELETE' });
}

export async function apiGetGroupStudents(id) {
  return apiFetch(`/groups/${id}/students`);
}

// Sessions
export async function apiGetSessions(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/head-coach/sessions${q ? '?' + q : ''}`);
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
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/coach/sessions${q ? '?' + q : ''}`);
}

export async function apiMarkAttendance(sessionId, data) {
  return apiFetch(`/coach/sessions/${sessionId}/attendance`, { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateAttendance(sessionId, data) {
  return apiFetch(`/coach/sessions/${sessionId}/attendance`, { method: 'PUT', body: JSON.stringify(data) });
}

// Contracts
export async function apiGetContracts(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/contracts${q ? '?' + q : ''}`);
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

export async function apiGetContractPdf(id) {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/contracts/${id}/pdf`, { headers });
  if (!res.ok) throw new Error(`Xatolik: ${res.status}`);
  return res.blob();
}

export function apiContractPdfUrl(id) {
  return `${BASE_URL}/contracts/${id}/pdf`;
}

// Transactions
export async function apiGetTransactions(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/transactions${q ? '?' + q : ''}`);
}

export async function apiGetTransactionsWithName(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/transactions/withname${q ? '?' + q : ''}`);
}

export async function apiGetTransactionStats(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/transactions/transactionstatistics${q ? '?' + q : ''}`);
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
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/gate/logs${q ? '?' + q : ''}`);
}

// Reports
export async function apiGetDashboard() {
  return apiFetch('/reports/dashboard/summary');
}

export async function apiGetDebtors(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/reports/debtors${q ? '?' + q : ''}`);
}

export async function apiGetPayers(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/reports/payers${q ? '?' + q : ''}`);
}

export async function apiGetFinanceReport(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/reports/finance${q ? '?' + q : ''}`);
}

export async function apiGetReportsSummary() {
  return apiGetDashboard();
}

export async function apiGetReportsRevenueDynamics(group_by = 'month') {
  const q = new URLSearchParams({ group_by }).toString();
  return apiFetch(`/reports/revenue-dynamics${q ? '?' + q : ''}`);
}

export async function apiGetReportsPaymentsBySource() {
  return apiFetch('/reports/payments-by-source');
}

export async function apiGetAttendanceGroupsReport(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/reports/attendance/groups${q ? '?' + q : ''}`);
}

export function apiDebtorsExportUrl() {
  return `${BASE_URL}/reports/debtors/export`;
}

export function apiPaymentsExcelUrl(params = {}) {
  const q = new URLSearchParams(params).toString();
  return `${BASE_URL}/reports/payments-excel${q ? '?' + q : ''}`;
}

// Settings
export async function apiGetSettings() {
  return apiFetch('/settings/system');
}

export async function apiPatchSettings(data) {
  return apiFetch('/settings/system', { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiUpdateSettings(data) {
  return apiPatchSettings(data);
}

// Waiting List
export async function apiGetWaitingList(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/waiting-list${q ? '?' + q : ''}`);
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
  return apiFetch(`/students/${id}/group`, { method: 'PATCH', body: JSON.stringify({ group_id }) });
}

export async function apiUploadStudentPhoto(id, formData) {
  return apiFetch(`/students/${id}/photo`, { method: 'POST', body: formData });
}
