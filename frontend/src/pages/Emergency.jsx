import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ShieldAlert, AlertTriangle, KeySquare, Clock, XCircle, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Emergency = () => {
    const { user } = useAuthStore();
    const [patientId, setPatientId] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [emergencies, setEmergencies] = useState([]);
    const [fetching, setFetching] = useState(false);
    const [timers, setTimers] = useState({});

    const fetchEmergencies = async () => {
        setFetching(true);
        try {
            const res = await api.get('/emergency');
            const now = new Date().getTime();
            const active = (res.data.data.emergencies || []).filter(e => new Date(e.expiresAt).getTime() > now);
            setEmergencies(active);
        } catch (err) {
            toast.error('Failed to load emergency logs');
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchEmergencies();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const newTimers = {};
            emergencies.forEach(e => {
                const diff = new Date(e.expiresAt).getTime() - now;
                if (diff > 0) {
                    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);
                    newTimers[e.id] = `${h}h ${m}m ${s}s`;
                } else {
                    newTimers[e.id] = 'EXPIRED';
                }
            });
            setTimers(newTimers);
        }, 1000);
        return () => clearInterval(interval);
    }, [emergencies]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/emergency', { patientId, reason });
            toast.success('Emergency Access GRANTED. Context set for 2 hours.');
            setPatientId('');
            setReason('');
            fetchEmergencies();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Emergency override failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id) => {
        try {
            await api.patch(`/emergency/${id}/revoke`);
            toast.success('Emergency access instantly revoked.');
            fetchEmergencies();
        } catch {
            toast.error('Failed to revoke access');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            <div className="bg-rose-500/10 border-l-4 border-rose-500 p-6 rounded-r-2xl rounded-l-md text-dark-text relative overflow-hidden group">
                <div className="absolute top-1/2 right-4 -translate-y-1/2 text-rose-500/20 group-hover:scale-110 transition-transform duration-500">
                    <AlertTriangle size={80} />
                </div>
                <div className="relative z-10 space-y-2">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-rose-400">
                        <ShieldAlert /> Real-Time Emergency Monitor
                    </h2>
                    <p className="text-xs text-rose-300 max-w-lg leading-relaxed">
                        Provides immediate 2-hour elevated access to any patient record bypassing normal RBAC rules.
                        <strong> ALL ACTIONS ARE HEAVILY LOGGED.</strong> Provide a detailed medical justification below.
                    </p>
                </div>
            </div>

            {user?.role === 'DOCTOR' && (
                <div className="bg-dark-card border border-dark-border p-8 rounded-2xl shadow-xl z-20 relative">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-dark-textMuted font-bold">Patient UUID</label>
                            <input
                                type="text"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-dark-textMuted font-bold">Clinical Justification</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full h-32 bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                                placeholder="Describe life-threatening emergency or explicit verbal consent bypass"
                                required
                            ></textarea>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <KeySquare size={18} />} Request Override
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-lg mt-8">
                <div className="p-6 border-b border-dark-border flex items-center justify-between bg-dark-bg/50">
                    <div>
                        <h2 className="text-lg font-bold text-dark-text">Active Emergency Corridors</h2>
                        <p className="text-xs text-dark-textMuted mt-1">Temporary bypass sessions currently active.</p>
                    </div>
                    {fetching && <Loader2 size={18} className="animate-spin text-dark-textMuted" />}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-dark-bg text-dark-text uppercase text-xs font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                {user?.role === 'ADMIN' && <th className="px-6 py-4">Doctor</th>}
                                <th className="px-6 py-4">Patient</th>
                                <th className="px-6 py-4">Time Remaining</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border/50">
                            {emergencies.map(e => (
                                <tr key={e.id} className="hover:bg-dark-bg/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-semibold text-rose-400">
                                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                            ACTIVE
                                        </div>
                                    </td>
                                    {user?.role === 'ADMIN' && (
                                        <td className="px-6 py-4 font-semibold text-dark-text">
                                            {e.doctor?.name} <span className="text-xs text-dark-textMuted font-mono">({e.doctor?.email})</span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 font-semibold text-dark-text">
                                        {e.patient?.user?.name || 'Unknown'} <span className="text-xs font-mono text-blue-400">[{e.patient?.medicalId}]</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-mono text-sm tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20 w-fit">
                                            <Clock size={14} />
                                            {timers[e.id] || '0h 0m 0s'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleRevoke(e.patientId)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-dark-bg border border-dark-border hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all text-dark-textMuted"
                                        >
                                            <XCircle size={14} /> Revoke
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {emergencies.length === 0 && !fetching && (
                                <tr>
                                    <td colSpan={user?.role === 'ADMIN' ? 5 : 4} className="px-6 py-8 text-center text-dark-textMuted text-sm">
                                        No active emergency corridors.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Emergency;
