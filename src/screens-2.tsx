// @ts-nocheck
import React from 'react';
import { apiGetStudents, apiCreateStudent } from './api';

export function StudentsList({ onOpen, onNew }) {
  const [students, setStudents] = React.useState([]);
  React.useEffect(() => { apiGetStudents().then(res => setStudents(res || [])); }, []);
  return (
    <div className="students-list">
      <div className="toolbar"><button className="btn" onClick={onNew}>Yangi</button></div>
      <div className="list">
        {students.map(s => (
          <div key={s.id} className="item" onClick={() => onOpen?.(s.id)}>{s.full_name}</div>
        ))}
      </div>
    </div>
  );
}

export function StudentProfile({ studentId, onBack }) {
  const [student, setStudent] = React.useState(null);
  React.useEffect(() => { if (studentId) apiGetStudents(studentId).then(res => setStudent(res)); }, [studentId]);
  if (!student) return <div>Loading...</div>;
  return (
    <div>
      <button className="btn" onClick={onBack}>Back</button>
      <h2>{student.full_name}</h2>
      <div>Phone: {student.phone}</div>
    </div>
  );
}

export function StudentNew({ onBack, onCreated }) {
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  async function create() {
    setLoading(true);
    try { await apiCreateStudent({ full_name: name, phone }); onCreated?.(); }
    catch (e) { alert(e); }
    finally { setLoading(false); }
  }
  return (
    <div>
      <button className="btn" onClick={onBack}>Back</button>
      <div className="field"><label>Ism</label><input value={name} onChange={e => setName(e.target.value)}/></div>
      <div className="field"><label>Telefon</label><input value={phone} onChange={e => setPhone(e.target.value)}/></div>
      <button className="btn primary" onClick={create} disabled={loading}>Yaratish</button>
    </div>
  );
}
