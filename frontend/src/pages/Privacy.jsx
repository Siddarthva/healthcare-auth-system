import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ShieldCheck, UserCheck, Clock, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const Privacy = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/patients/privacy');
            setLogs(res.data.data.logs || []);
        } catch {
            toast.error('Failed to load privacy logs. Ensure you have PATIENT role.');
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
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-dark-card border border-dark-border p-6 rounded-2xl shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="bg-teal-500/20 text-teal-400 p-3 rounded-xl border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">Privacy & Access Timeline</h2>
                        <p className="text-xs text-dark-textMuted mt-1">Immutable ledger tracking exactly who accessed your medical records and when.</p>
                    </div>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-textMuted" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search accesses..."
                        className="w-full bg-dark-bg border border-dark-border pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:border-teal-400 focus:ring-teal-400/50 transition-all font-mono"
                    />
                </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-xl">
                {loading ? (
                    <div className="p-12 flex justify-center items-center gap-3 text-dark-textMuted">
                        <Loader2 size={24} className="animate-spin text-teal-500" />
                        <span className="text-sm font-medium">Decrypting access ledger...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-dark-bg text-dark-text uppercase text-xs font-semibold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 border-b border-dark-border">Timestamp</th>
                                    <th className="px-6 py-4 border-b border-dark-border">Accessor Profile</th>
                                    <th className="px-6 py-4 border-b border-dark-border">Action Performed</th>
                                    <th className="px-6 py-4 border-b border-dark-border">Access Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-border/50">
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-dark-bg/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-dark-textMuted font-mono text-[11px] bg-dark-bg/50 px-2.5 py-1 rounded-lg w-fit border border-dark-border/50">
                                                <Clock size={12} className="text-teal-500/70" />
                                                {format(new Date(log.timestamp), 'MMM dd yyyy HH:mm:ss')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-dark-bg border border-dark-border p-1.5 rounded-lg text-dark-textMuted">
                                                    <UserCheck size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-dark-text leading-tight">{log.user?.name || log.user?.email || 'System Operation'}</p>
                                                    <p className="text-[10px] text-teal-400 uppercase tracking-wide mt-0.5">{log.user?.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 text-[11px] font-bold ${log.emergency ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-dark-bg border border-dark-border text-dark-text'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${log.result === 'SUCCESS' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]'}`}></div>
                                                <span className={`text-xs font-semibold ${log.result === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {log.result}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-dark-textMuted text-sm">
                                            <div className="flex flex-col items-center gap-3">
                                                <ShieldCheck size={32} className="text-dark-border" />
                                                <p>No external access recorded.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Privacy;
