// @ts-nocheck
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8008';
let _token = null;
export function getToken(){ return _token || localStorage.getItem('alpha_token'); }
export function setToken(t){ _token = t; localStorage.setItem('alpha_token', t); }
export function clearToken(){ _token = null; localStorage.removeItem('alpha_token'); }

export async function apiLogin(phone, password){
  const res = await fetch(BASE + '/auth/login', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ phone, password }) });
  const json = await res.json();
  if (json.access_token) { setToken(json.access_token); return json; }
  throw new Error(json.message || 'Login failed');
}

export async function apiLogout(){ clearToken(); }

export async function apiGetMe(){
  const res = await fetch(BASE + '/auth/me', { headers: { Authorization: 'Bearer ' + getToken() } });
  if (!res.ok) return null;
  return await res.json();
}

export async function apiGetStudents(id){
  const res = await fetch(BASE + (id ? '/students/'+id : '/students'), { headers: { Authorization: 'Bearer ' + getToken() } });
  return await res.json();
}

export async function apiCreateStudent(payload){
  const res = await fetch(BASE + '/students', { method: 'POST', headers: {'content-type':'application/json', Authorization: 'Bearer ' + getToken()}, body: JSON.stringify(payload) });
  return await res.json();
}

export async function apiGetDashboard(){ return {}; }

export async function apiGetGroups(){ const r = await fetch(BASE + '/coach/groups', { headers: { Authorization: 'Bearer ' + getToken() } }); return await r.json(); }
export async function apiGetGroupPerformance(groupId, seasonYear=2024){ const r = await fetch(BASE + '/coach/groups/'+groupId+'/performance-table?season_year='+seasonYear, { headers: { Authorization: 'Bearer ' + getToken() } }); return await r.json(); }

export default { apiLogin, apiGetMe };
