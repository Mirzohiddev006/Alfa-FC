// @ts-nocheck
import React from 'react';
import { apiGetContracts, apiGetTransactions, apiGetGateLogs, apiGetUsers, apiGetReports, apiGetWaitingList } from './api';

export function ContractsScreen(){ return <div>Contracts</div>; }
export function TransactionsScreen({ onToast }) { return <div>Transactions</div>; }
export function GateScreen(){ return <div>Gate logs</div>; }
export function UsersScreen({ initialView='users', onToast }){ return <div>Users & Roles</div>; }
export function SettingsScreen({ theme, setTheme }){ return <div>Settings</div>; }
export function ReportsScreen(){ return <div>Reports</div>; }
export function WaitingListScreen({ onToast }){ return <div>Waiting list</div>; }
