import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Database, Search, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/audit-logs');
            setLogs(res.data.data.logs || []);
        } catch {
            toast.error('Failed to load audit logs. Ensure you have ADMIN role.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-dark-card border border-dark-border p-5 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="bg-teal-500/20 text-teal-400 p-2 rounded-lg">
                        <Database size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">Global Audit Trails</h2>
                        <p className="text-xs text-dark-textMuted mt-1">Immutable security ledger for all sensitive mutations and data access.</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-textMuted" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Filter by email or action..."
                            className="w-full bg-dark-bg border border-dark-border pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:border-teal-400 focus:ring-teal-400/50"
                        />
                    </div>
                    <button onClick={fetchLogs} className="p-2 border border-dark-border bg-dark-bg hover:bg-dark-border rounded-xl text-dark-text transition-colors">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-dark-bg text-dark-text uppercase text-xs font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Resource</th>
                                <th className="px-6 py-4">Result</th>
                                <th className="px-6 py-4">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border/50">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-dark-bg/50 transition-colors">
                                    <td className="px-6 py-3 text-dark-textMuted font-mono text-[11px]">
                                        {format(new Date(log.timestamp), 'MMM dd yyyy HH:mm:ss')}
                                    </td>
                                    <td className="px-6 py-3">
                                        <p className="font-semibold text-dark-text leading-tight">{log.user?.email || 'System / Unknown'}</p>
                                        <p className="text-[10px] text-teal-400 uppercase tracking-wide">{log.user?.role}</p>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded inline-flex items-center gap-1 text-[11px] font-bold ${log.emergency ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-dark-border text-dark-text'}`}>
                                            {log.emergency && <AlertTriangle size={12} />}
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 font-mono text-xs">{log.resource}</td>
                                    <td className="px-6 py-3">
                                        <span className={log.result === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}>
                                            {log.result}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 font-mono text-[11px] text-dark-textMuted">{log.ipAddress}</td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-dark-textMuted text-sm">
                                        No logs found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
