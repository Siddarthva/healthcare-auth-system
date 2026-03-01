import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import { ShieldAlert, Users, Activity, FileLock2, Info, CheckCircle, XCircle, Power, UserCheck, Stethoscope, HeartPulse } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import SecurityAlertsPanel from '../components/SecurityAlertsPanel';

const Dashboard = () => {
    const { user } = useAuthStore();
    const [health, setHealth] = useState(null);
    const [adminUsers, setAdminUsers] = useState([]);

    useEffect(() => {
        api.get('/health').then((res) => setHealth(res.data)).catch(() => { });

        if (user?.role === 'ADMIN') {
            fetchUsers();
        }
    }, [user?.role]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setAdminUsers(res.data.data.users);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const toggleUserStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
            await api.patch(`/users/${id}/status`, { status: newStatus });
            toast.success(`User status updated to ${newStatus}`);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update user status');
        }
    };

    const stats = [
        { label: 'Role Context', value: user?.role, icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-400/10' },
        { label: 'System Uptime', value: health?.uptime ? `${Math.floor(health.uptime / 60)} mins` : 'Pending', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { label: 'API Connection', value: health?.status === 'UP' ? 'Online' : 'Connecting...', icon: Power, color: 'text-teal-400', bg: 'bg-teal-400/10' },
        { label: 'Security Protocols', value: 'Active', icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent tracking-tight">
                        Welcome, {user?.name}
                    </h1>
                    <p className="text-dark-textMuted mt-1">Healthcare Authorization Control Portal</p>
                </div>
                <div className="flex items-center gap-2 bg-dark-card border border-dark-border px-4 py-2 rounded-xl text-sm font-medium shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                    Connected as {user?.email}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-dark-card border border-dark-border flexitems-center rounded-2xl p-5 hover:border-dark-textMuted transition-colors text-left flex gap-4 pr-10 relative overflow-hidden">
                        <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-dark-text mb-0.5">{stat.value}</p>
                            <p className="text-xs font-medium text-dark-textMuted uppercase tracking-wider">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>



            {user?.role === 'ADMIN' && (
                <div className="bg-dark-card border border-dark-border rounded-2xl shadow-lg overflow-hidden mt-8">
                    <div className="p-6 border-b border-dark-border flex items-center gap-3">
                        <Users className="text-blue-400" />
                        <div>
                            <h2 className="text-lg font-bold">User Management</h2>
                            <p className="text-xs text-dark-textMuted mt-1">Global platform user control</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-dark-bg text-dark-text uppercase text-xs font-semibold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-border/50">
                                {adminUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-dark-bg/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-dark-text">{u.name}</td>
                                        <td className="px-6 py-4 text-dark-textMuted">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs font-bold text-teal-400">{u.role}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => toggleUserStatus(u.id, u.status)}
                                                disabled={u.id === user.id}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 transition-all ${u.status === 'ACTIVE' ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                                            >
                                                {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {adminUsers.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-dark-textMuted text-sm">Loading users...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {user?.role === 'ADMIN' && (
                <div className="mt-8">
                    <SecurityAlertsPanel />
                </div>
            )}
        </div>
    );
};

export default Dashboard;
