import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, GraduationCap, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SignupProps {
    onLoginClick: () => void;
}

const Signup: React.FC<SignupProps> = ({ onLoginClick }) => {
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        password: '',
        role: 'student'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const { login } = useAuth();

    useEffect(() => {
        // Check Backend Connection on Mount
        const checkServer = async () => {
            try {
                const res = await fetch('http://localhost:8000/');
                if (res.ok) setServerStatus('online');
                else setServerStatus('offline');
            } catch (e) {
                setServerStatus('offline');
            }
        };
        checkServer();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:8000/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                login({ ...data, full_name: formData.full_name });
            } else {
                setError(data.detail || 'Signup failed. Username may be taken.');
            }
        } catch (err) {
            setError('Cannot reach server. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#020617]">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-[#020617] to-[#020617] pointer-events-none"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="glass-panel w-full max-w-lg p-8 relative z-10 animate-fade-in shadow-2xl border border-white/5">

                <div className="flex justify-between items-center mb-8">
                    <button onClick={onLoginClick} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
                    </button>

                    {/* Server Status Indicator */}
                    <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border ${serverStatus === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        serverStatus === 'offline' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                            'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                        {serverStatus === 'checking' && <Loader2 size={12} className="animate-spin" />}
                        {serverStatus === 'online' && <CheckCircle2 size={12} />}
                        {serverStatus === 'offline' && <AlertCircle size={12} />}
                        {serverStatus === 'checking' ? 'Connecting...' : serverStatus === 'online' ? 'Systems Online' : 'Server Offline'}
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h2>
                    <p className="text-slate-400">Join the VELOX platform today.</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-sm mb-6 flex items-start gap-3">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Role Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, role: 'student' })}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all duration-200 ${formData.role === 'student'
                                ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                : 'bg-slate-800/40 border-slate-700 text-slate-500 hover:bg-slate-800/80 hover:border-slate-600'
                                }`}
                        >
                            <GraduationCap size={28} />
                            <span className="font-medium">Student</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, role: 'teacher' })}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all duration-200 ${formData.role === 'teacher'
                                ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                                : 'bg-slate-800/40 border-slate-700 text-slate-500 hover:bg-slate-800/80 hover:border-slate-600'
                                }`}
                        >
                            <Briefcase size={28} />
                            <span className="font-medium">Teacher</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="input-field"
                            placeholder="Full Name"
                            required
                        />
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="input-field"
                                placeholder="Username"
                                required
                            />
                        </div>
                        <div className="relative">
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input-field"
                                placeholder="Password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || serverStatus === 'offline'}
                        className="btn-primary w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                        {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Signup;
