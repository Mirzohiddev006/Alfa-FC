// @ts-nocheck
import React from 'react';
import { apiGetGroups, apiGetGroupPerformance } from './api';

export function GroupsScreen({ onOpen }){
  const [groups, setGroups] = React.useState([]);
  React.useEffect(()=>{ apiGetGroups().then(r=>setGroups(r||[])); }, []);
  return (
    <div>
      <h3>Guruhlar</h3>
      <div className="list">{groups.map(g=> <div key={g.id} onClick={()=>onOpen?.(g.id)}>{g.name}</div>)}</div>
    </div>
  );
}

export function SessionsScreen({ onMark }){
  return <div>Sessions list <button onClick={()=>onMark?.(1)}>Mark</button></div>;
}

export function AttendanceMark({ sessionId, onBack }){
  return <div>Attendance for {sessionId} <button onClick={onBack}>Back</button></div>;
}

export function PerformanceTable(){
  const [rows, setRows] = React.useState([]);
  React.useEffect(()=>{ /* placeholder */ }, []);
  return <div className="performance-table">Performance Table</div>;
}

export default PerformanceTable;
