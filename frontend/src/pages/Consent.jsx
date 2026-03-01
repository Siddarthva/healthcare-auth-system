import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { LockOpen, Lock, Trash2, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Consent = () => {
    const [consents, setConsents] = useState([]);
    const [staffId, setStaffId] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore(); // expected to be patient

    const fetchConsents = async () => {
        try {
            const res = await api.get('/consent');
            setConsents(res.data.data.consents);
        } catch {
            toast.error('Failed to load consents');
        }
    };

    useEffect(() => {
        fetchConsents();
    }, []);

    const handleGrant = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/consent', { staffId });
            toast.success('Access successfully granted');
            setStaffId('');
            fetchConsents();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to grant consent');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id) => {
        try {
            await api.patch(`/consent/${id}/revoke`);
            toast.success('Access successfully revoked');
            fetchConsents();
        } catch {
            toast.error('Failed to revoke access');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-dark-card border border-dark-border p-6 rounded-2xl shadow-lg flex justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold">Data Sovereignty & Access</h2>
                    <p className="text-dark-textMuted text-sm mt-1">
                        {user?.role === 'PATIENT' ? 'Manage who has access to your medical information.' : 'View Active Consents that grant you access to Patient records.'}
                    </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-teal-500/10 flex justify-center items-center text-teal-400">
                    <Lock size={24} />
                </div>
            </div>

            {user?.role === 'PATIENT' && (
                <form onSubmit={handleGrant} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                        placeholder="Enter Doctor UUID to grant access"
                        className="flex-1 bg-dark-bg border border-dark-border pl-4 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-emerald-500 hover:bg-emerald-400 text-dark-bg px-6 py-3 font-semibold rounded-xl text-sm transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        <LockOpen size={16} /> Grant Access
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {consents.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-dark-textMuted text-sm">
                        <AlertCircle size={32} className="mx-auto mb-3 opacity-20" />
                        No active consents found.
                    </div>
                ) : consents.map((c) => (
                    <div key={c.id} className="bg-dark-card border border-dark-border p-5 rounded-2xl flex flex-col justify-between group hover:border-dark-textMuted transition">
                        <div className="mb-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-dark-text">{c.staff?.name || "Unknown Staff"}</h4>
                                {c.status === 'ACTIVE' ? (
                                    <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-md flex items-center gap-1 font-semibold">
                                        <Check size={12} /> Active
                                    </span>
                                ) : (
                                    <span className="bg-red-500/10 text-red-500 text-xs px-2 py-1 rounded-md font-semibold">
                                        Revoked
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-dark-textMuted mt-1">Role: {c.staff?.role || '---'}</p>
                            <p className="text-[10px] text-dark-textMuted mt-4 opacity-50 font-mono">ID: {c.id}</p>
                        </div>

                        {c.status === 'ACTIVE' && user?.role === 'PATIENT' && (
                            <button
                                onClick={() => handleRevoke(c.id)}
                                className="w-full mt-4 flex justify-center items-center gap-2 text-xs font-semibold px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition"
                            >
                                <Trash2 size={14} /> Revoke Context
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Consent;
