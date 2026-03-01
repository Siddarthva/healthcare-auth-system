import React, { useEffect, useState } from 'react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { Search, Info, Loader2, X, ClipboardList, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Patients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const { user } = useAuthStore();

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const res = await api.get('/patients');
            setPatients(res.data.data.patients || []);
        } catch (error) {
            toast.error('Failed to load patients. Access denied or server error.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleDetailedView = async (id) => {
        try {
            setModalLoading(true);
            const res = await api.get(`/patients/${id}`);
            setSelectedPatient(res.data.data.patient);
        } catch (error) {
            toast.error('Access Denied: Missing Context or Consent');
            setSelectedPatient(null);
        } finally {
            setModalLoading(false);
        }
    };

    const filtered = patients.filter(p => p.user?.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-bold">Accessible Patients Data</h1>
                <div className="relative w-full sm:w-64">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-textMuted" />
                    <input
                        type="text"
                        placeholder="Search name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-lg">
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="flex items-center gap-3 text-dark-textMuted"><Loader2 className="animate-spin" /> Loading data context...</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-dark-textMuted">
                            <thead className="bg-dark-bg text-dark-text uppercase font-semibold text-xs tracking-wider border-b border-dark-border">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Med ID</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4 text-right">Context Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => (
                                    <tr key={p.id} className="border-b border-dark-border/50 hover:bg-dark-bg/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-dark-text"> {p.user?.name || "Unknown"}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{p.medicalId}</td>
                                        <td className="px-6 py-4">{new Date(p.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDetailedView(p.id)}
                                                className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 px-3 py-1.5 rounded-lg border border-teal-500/20 transition-all text-xs font-semibold"
                                            >
                                                {modalLoading ? <Loader2 size={14} className="animate-spin" /> : <Info size={14} />} Full Record Access
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center bg-dark-bg text-sm">
                                            No patient records accessible via current ABAC context.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Patient Detail Modal */}
            {selectedPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-dark-border flex justify-between items-center bg-gradient-to-r from-dark-card to-dark-bg">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-teal-400">
                                <ShieldCheck size={24} /> Verified Medical Record
                            </h2>
                            <button onClick={() => setSelectedPatient(null)} className="text-dark-textMuted hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">

                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                                <ShieldCheck className="text-emerald-500 mt-0.5 shrink-0" size={20} />
                                <div>
                                    <h4 className="text-emerald-400 font-bold text-sm mb-1">Zero-Trust Context Authenticated</h4>
                                    <p className="text-xs text-dark-textMuted leading-relaxed">
                                        Access permitted based on cryptographic JWT validation, Role-Based constraints (`{user?.role}`), and Attribute-Based context (Assignment, Consent, or Emergency override).
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-dark-textMuted uppercase">Full Name</p>
                                    <p className="font-semibold text-dark-text">{selectedPatient.user?.name || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-dark-textMuted uppercase">Medical ID</p>
                                    <p className="font-mono text-sm text-blue-400">{selectedPatient.medicalId}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-dark-textMuted uppercase">Date of Birth</p>
                                    <p className="text-sm font-medium">{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-dark-textMuted uppercase">Contact</p>
                                    <p className="text-sm font-medium">{selectedPatient.user?.email || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="border border-dark-border rounded-xl p-4 bg-dark-bg">
                                <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-dark-text">
                                    <ClipboardList size={16} className="text-amber-400" />
                                    Clinical Metadata
                                </h3>
                                <pre className="text-xs font-mono text-emerald-400 bg-dark-card p-4 rounded-lg overflow-x-auto whitespace-pre-wrap border border-dark-border/50 shadow-inner">
                                    {JSON.stringify(selectedPatient, null, 2)}
                                </pre>
                            </div>
                        </div>
                        <div className="p-4 border-t border-dark-border bg-dark-bg flex justify-end">
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="px-5 py-2 rounded-xl border border-dark-border hover:bg-dark-card text-sm font-medium transition-colors"
                            >
                                Close Record
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Patients;
