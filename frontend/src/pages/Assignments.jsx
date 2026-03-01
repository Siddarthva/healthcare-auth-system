import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Users, Trash2, PlusCircle, Link as LinkIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const Assignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [users, setUsers] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [staffId, setStaffId] = useState('');
    const [patientId, setPatientId] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [assData, usrData, patData] = await Promise.all([
                api.get('/admin/assignments'),
                api.get('/users'),
                api.get('/patients')
            ]);
            setAssignments(assData.data.data.assignments);
            // Only doctors and nurses can be assigned
            setUsers(usrData.data.data.users.filter(u => u.role === 'DOCTOR' || u.role === 'NURSE'));
            setPatients(patData.data.data.patients);
        } catch (error) {
            toast.error('Failed to load assignments context');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/admin/assignments', { staffId, patientId });
            toast.success('Assignment created successfully');
            setStaffId('');
            setPatientId('');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create assignment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/admin/assignments/${id}`);
            toast.success('Assignment revoked');
            fetchData();
        } catch (error) {
            toast.error('Failed to revoke assignment');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-dark-card border border-dark-border p-6 rounded-2xl shadow-lg flex justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-teal-400">
                        <LinkIcon /> Role Assignment Engine
                    </h2>
                    <p className="text-dark-textMuted text-sm mt-1">
                        Map Clinical Staff to Patients. These assignments dictate default baseline access within the RBAC configuration.
                    </p>
                </div>
            </div>

            <div className="bg-dark-card border border-dark-border p-6 rounded-2xl shadow-lg z-20 relative">
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs uppercase tracking-wider text-dark-textMuted font-bold mb-1 block">Staff Member</label>
                        <select
                            value={staffId}
                            onChange={(e) => setStaffId(e.target.value)}
                            required
                            className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 text-dark-text appearance-none"
                        >
                            <option value="">Select Staff...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wider text-dark-textMuted font-bold mb-1 block">Patient Record</label>
                        <select
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                            required
                            className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 text-dark-text appearance-none"
                        >
                            <option value="">Select Patient...</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.user?.name} [{p.medicalId}]</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-teal-500 hover:bg-teal-400 text-dark-bg font-bold py-2 px-4 rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />} Create Assignment
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-lg mt-8">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-dark-bg text-dark-text uppercase text-xs font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Staff Member</th>
                                <th className="px-6 py-4">Patient Target</th>
                                <th className="px-6 py-4">Created At</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border/50">
                            {assignments.map(a => (
                                <tr key={a.id} className="hover:bg-dark-bg/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-dark-text">{a.staff?.name}</div>
                                        <div className="text-[10px] uppercase font-bold text-teal-400">{a.staff?.role}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-dark-text">{a.patient?.user?.name || 'Unknown Patient'}</div>
                                        <div className="text-xs font-mono text-dark-textMuted uppercase">{a.patient?.medicalId}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-dark-textMuted">
                                        {format(new Date(a.createdAt), 'MMM dd yyyy')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(a.id)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-dark-bg border border-dark-border hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all text-dark-textMuted"
                                        >
                                            <Trash2 size={14} /> Remove Binding
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {assignments.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-dark-textMuted text-sm">
                                        No active assignments found.
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

export default Assignments;
