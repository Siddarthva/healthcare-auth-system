import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Activity, Database, Server, Clock, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Health = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const res = await api.get('/health');
            setHealth(res.data);
            setLastRefresh(new Date());
        } catch (err) {
            toast.error('Failed to probe health metrics. System might be down.');
            setHealth({ status: 'DOWN', database: 'DISCONNECTED', redis: 'DISCONNECTED', uptime: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
    }, []);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchHealth, 10000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const Indicator = ({ status }) => {
        const colors = {
            UP: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
            CONNECTED: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
            DOWN: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
            DISCONNECTED: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
        };
        return <div className={`w-3 h-3 rounded-full ${colors[status] || 'bg-amber-500'} animate-pulse`} />;
    }

    const getUptime = (seconds) => {
        if (!seconds) return '0h 0m 0s';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h}h ${m}m ${s}s`;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-dark-card border border-dark-border p-6 rounded-2xl shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Activity size={28} className="text-teal-400" />
                        Fleet Telemetry
                    </h1>
                    <p className="text-sm text-dark-textMuted mt-1">Real-time underlying API cluster and persistence latency.</p>
                </div>

                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-dark-text cursor-pointer">
                        <input
                            type="checkbox"
                            className="form-checkbox text-teal-500 bg-dark-bg border-dark-border rounded focus:ring-teal-500"
                            checked={autoRefresh}
                            onChange={() => setAutoRefresh(!autoRefresh)}
                        />
                        Live Updates (10s)
                    </label>

                    <button
                        onClick={fetchHealth}
                        disabled={loading}
                        className="bg-dark-bg hover:bg-dark-border border border-dark-border py-2 px-4 rounded-xl flex justify-center items-center gap-2 transition-colors text-sm font-semibold"
                    >
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                        Ping Core
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                <div className="bg-dark-card border border-dark-border p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-dark-bg opacity-40 group-hover:scale-110 transition-transform duration-500">
                        <Server size={120} />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <h3 className="uppercase text-xs font-bold tracking-widest text-dark-textMuted">Express Gateway</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-dark-text">{health?.status || '---'}</span>
                            {health && <Indicator status={health.status} />}
                        </div>
                    </div>
                </div>

                <div className="bg-dark-card border border-dark-border p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-dark-bg opacity-40 group-hover:scale-110 transition-transform duration-500">
                        <Database size={120} />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <h3 className="uppercase text-xs font-bold tracking-widest text-dark-textMuted">PostgreSQL Core</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-dark-text">{health?.database || '---'}</span>
                            {health && <Indicator status={health.database} />}
                        </div>
                    </div>
                </div>

                <div className="bg-dark-card border border-dark-border p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-dark-bg opacity-40 group-hover:scale-110 transition-transform duration-500">
                        <Database size={120} />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <h3 className="uppercase text-xs font-bold tracking-widest text-dark-textMuted">Redis Cache</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-dark-text">{health?.redis || '---'}</span>
                            {health && <Indicator status={health.redis} />}
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex items-center gap-3 text-sm text-dark-textMuted p-4 bg-dark-bg border border-dark-border rounded-xl">
                <Clock size={16} className="text-teal-400" />
                <span className="font-semibold text-dark-text">Uptime:</span> {getUptime(health?.uptime)}
                <span className="mx-2 opacity-30">|</span>
                <span className="font-semibold text-dark-text">Last Sync:</span> {lastRefresh ? format(lastRefresh, 'HH:mm:ss.SSS') : 'Never'}
            </div>
        </div>
    );
};

export default Health;
