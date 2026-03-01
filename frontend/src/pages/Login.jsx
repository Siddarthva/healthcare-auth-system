import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const setLogin = useAuthStore((state) => state.setLogin);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await api.post('/auth/login', { email, password });

            const { user, accessToken, refreshToken } = data.data;
            setLogin(user, accessToken, refreshToken);
            toast.success('Login Successful');

        } catch (err) {
            const message = err.response?.data?.message || 'Login failed. Please try again.';
            setErrorMessage(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid items-center justify-center bg-dark-bg text-dark-text p-4">
            <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                <div className="relative z-10 text-center mb-10">
                    <div className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-500/20">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">MedAuth Control</h1>
                    <p className="text-dark-textMuted mt-2 text-sm">Secure Authentication & Access Panel</p>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                    {errorMessage && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-4 text-sm text-center">
                            {errorMessage}
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-dark-textMuted block px-1">Email Address</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-textMuted" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-dark-bg border border-dark-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-dark-textMuted/50"
                                placeholder="sidarthvacharyaa@gmail.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-dark-textMuted block px-1">Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-textMuted" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-dark-bg border border-dark-border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-500 hover:bg-teal-400 text-dark-bg font-semibold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Authenticate Access'}
                    </button>
                </form>

                <p className="mt-8 text-sm text-center text-dark-textMuted">
                    Don't have an account? <Link to="/signup" className="text-teal-400 hover:text-teal-300 font-medium">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
