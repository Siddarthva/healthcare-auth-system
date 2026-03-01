import React, { useState, useEffect, useRef } from 'react';
import {
    ShieldCheck,
    Mail,
    Lock,
    User,
    Briefcase,
    Loader2,
    KeyRound,
    ArrowRight,
    RefreshCw,
    PencilLine,
    CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
    // State management
    const [step, setStep] = useState('register'); // register, otp, verified
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'PATIENT'
    });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(300);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [canResendAction, setCanResendAction] = useState(true);

    const navigate = useNavigate();
    const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    // Timer Effect
    useEffect(() => {
        let interval = null;
        if (step === 'otp' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // UI Handlers
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Auto focus jump
        if (value && index < 5) {
            otpRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs[index - 1].current.focus();
        }
    };

    const handleChangeEmail = () => {
        setStep('register');
        setOtp(['', '', '', '', '', '']);
        setTimer(300);
        setErrorMessage('');
    };

    // Action Handlers
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');

        try {
            await api.post('/auth/register', formData);
            toast.success('Registration successful. Verify your email.');
            setStep('otp');
            setTimer(300);
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed. Please try again.';
            setErrorMessage(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!canResendAction) return;

        setResending(true);
        setErrorMessage('');

        try {
            await api.post('/auth/resend-otp', { email: formData.email });
            toast.success('New code sent successfully.');
            setTimer(300);
            setCanResendAction(false);

            // 30s cooldown for resend button
            setTimeout(() => setCanResendAction(true), 30000);
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to resend code.';
            setErrorMessage(message);
            toast.error(message);
        } finally {
            setResending(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();

        const otpString = otp.join('');
        if (otpString.length < 6) {
            setErrorMessage('Please enter the complete 6-digit code.');
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            await api.post('/auth/verify-otp', { email: formData.email, otp: otpString });
            setStep('verified');
            toast.success('Success! Your identity is confirmed.');

            // Redirect after 2s
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            const message = err.response?.data?.message || 'Invalid or expired OTP.';
            setErrorMessage(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid items-center justify-center bg-dark-bg text-dark-text p-4">
            <div className="w-full max-w-lg bg-dark-card border border-dark-border rounded-[2rem] p-10 shadow-2xl relative overflow-hidden">

                {/* Background effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

                <div className="relative z-10 text-center mb-8">
                    <div className="w-20 h-20 bg-teal-500/10 text-teal-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-teal-500/20 shadow-inner">
                        <ShieldCheck size={44} />
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        {step === 'register' ? 'Join MedAuth' : step === 'otp' ? 'Trust Channel' : 'Identity Confirmed'}
                    </h1>

                    <p className="text-dark-textMuted text-sm max-w-xs mx-auto">
                        {step === 'register'
                            ? 'Establish your secure healthcare credentials to begin your journey.'
                            : step === 'otp'
                                ? `Access transmitted to ${formData.email.replace(/(.{3})(.*)(?=@)/, "$1***")}`
                                : 'Your account is now active. Transferring to access panel...'}
                    </p>
                </div>

                {errorMessage && (
                    <div className="relative z-10 bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-2xl mb-6 text-center animate-shake">
                        {errorMessage}
                    </div>
                )}

                <div className="relative z-10">
                    {/* STEP 1: REGISTRATION */}
                    {step === 'register' && (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-dark-textMuted ml-1">Full Name</label>
                                    <div className="relative group">
                                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-textMuted group-focus-within:text-teal-400 transition-colors" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-dark-bg/50 border border-dark-border rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-dark-textMuted/40"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-dark-textMuted ml-1">Role</label>
                                    <div className="relative">
                                        <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-textMuted" />
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="w-full bg-dark-bg/50 border border-dark-border rounded-2xl pl-12 pr-10 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-dark-text appearance-none cursor-pointer"
                                        >
                                            <option value="PATIENT">PATIENT</option>
                                            <option value="DOCTOR">DOCTOR</option>
                                            <option value="NURSE">NURSE</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-dark-textMuted ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-textMuted group-focus-within:text-teal-400 transition-colors" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-dark-bg/50 border border-dark-border rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-dark-textMuted/40"
                                        placeholder="user@hospital.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-dark-textMuted ml-1">Secure Password</label>
                                <div className="relative group">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-textMuted group-focus-within:text-teal-400 transition-colors" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-dark-bg/50 border border-dark-border rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full !mt-8 bg-teal-500 hover:bg-teal-400 text-dark-bg font-bold py-4 rounded-2xl transition-all shadow-[0_10px_30px_rgba(20,184,166,0.3)] disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2 group"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : (
                                    <>
                                        Continue Onboarding
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* STEP 2: OTP VERIFICATION */}
                    {step === 'otp' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex justify-between items-center bg-dark-bg/40 p-5 rounded-2xl border border-dark-border/50">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-dark-textMuted">Trust Email</span>
                                    <p className="text-sm font-medium text-dark-text">{formData.email}</p>
                                </div>
                                <button
                                    onClick={handleChangeEmail}
                                    className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-all"
                                    title="Edit Email"
                                >
                                    <PencilLine size={18} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between gap-2.5">
                                    {otp.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            ref={otpRefs[idx]}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            className="w-12 h-14 bg-dark-bg/60 border-2 border-dark-border rounded-2xl text-center text-xl font-bold text-teal-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all"
                                        />
                                    ))}
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <div className={`px-4 py-2 rounded-full border text-xs font-mono font-bold transition-all ${timer === 0 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-teal-500/5 border-teal-500/10 text-teal-400'}`}>
                                        {timer === 0 ? 'OTP EXPIRED' : `EXPIRES IN ${formatTime(timer)}`}
                                    </div>

                                    {timer === 0 && (
                                        <p className="text-xs text-red-500/80 italic font-medium">Please request a new code to continue verification.</p>
                                    )}
                                </div>

                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={loading || timer === 0 || otp.some(d => !d)}
                                    className="w-full bg-teal-500 hover:bg-teal-400 text-dark-bg font-bold py-4 rounded-2xl transition-all shadow-[0_10px_30px_rgba(20,184,166,0.2)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Digital Identity'}
                                </button>

                                <div className="flex items-center justify-center gap-6">
                                    <button
                                        onClick={handleResendOtp}
                                        disabled={!canResendAction || resending}
                                        className="text-dark-textMuted hover:text-teal-400 text-xs font-bold uppercase tracking-widest transition-all inline-flex items-center gap-2 disabled:opacity-30 disabled:cursor-wait"
                                    >
                                        <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                                        {resending ? 'Dispatched...' : 'Resend Code'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: VERIFIED */}
                    {step === 'verified' && (
                        <div className="text-center py-10 space-y-6 animate-scale-in">
                            <div className="w-24 h-24 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto border-4 border-teal-500 shadow-[0_0_50px_rgba(20,184,166,0.4)]">
                                <CheckCircle2 size={56} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-white">Trust Established</h2>
                                <p className="text-dark-textMuted">Healthcare gateway authorized. Preparing access panel...</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-10 relative z-10 pt-10 border-t border-dark-border/30 text-center">
                    <p className="text-sm text-dark-textMuted">
                        Already possesses access? <Link to="/login" className="text-teal-400 hover:text-teal-300 font-bold ml-1.5 transition-colors">Digital Portal Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
