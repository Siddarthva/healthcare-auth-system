import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileLock2, ShieldAlert, List, LogOut, Activity } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Sidebar = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'] },
        { name: 'Patients', icon: Users, path: '/patients', roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'] },
        { name: 'Consent Management', icon: FileLock2, path: '/consent', roles: ['PATIENT', 'ADMIN', 'DOCTOR', 'NURSE'] },
        { name: 'Emergency Access', icon: ShieldAlert, path: '/emergency', roles: ['DOCTOR', 'ADMIN'] },
        { name: 'Assignments', icon: List, path: '/assignments', roles: ['ADMIN'] },
        { name: 'Privacy Center', icon: List, path: '/privacy', roles: ['PATIENT'] },
        { name: 'Audit Logs', icon: List, path: '/audit-logs', roles: ['ADMIN'] },
        { name: 'System Health', icon: Activity, path: '/health', roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'] },
    ];

    const allowedMenus = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <div className="w-64 h-screen bg-dark-bg border-r border-dark-border flex flex-col justify-between hidden md:hidden lg:flex">
            <div>
                <div className="p-6 font-bold text-xl text-teal-400 flex items-center gap-2">
                    <Activity />
                    MedAuth Core
                </div>
                <nav className="mt-4 px-4 space-y-2">
                    {allowedMenus.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-teal-500/10 text-teal-400 font-medium'
                                    : 'text-dark-textMuted hover:bg-dark-card hover:text-dark-text'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="p-6 border-t border-dark-border">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <p className="text-sm font-semibold truncate max-w-[120px]">{user?.name}</p>
                        <p className="text-xs text-dark-textMuted">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
