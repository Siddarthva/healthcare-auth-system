import React from 'react';
import { Menu } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Header = () => {
    const { user } = useAuthStore();


    return (
        <header className="h-16 flex items-center justify-between px-6 bg-dark-bg/80 backdrop-blur border-b border-dark-border sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 text-dark-textMuted hover:text-dark-text rounded-md">
                    <Menu size={20} />
                </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-dark-card border border-dark-border px-4 py-1.5 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                    <span className="text-sm font-semibold text-dark-text tracking-tight uppercase">System Online</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
