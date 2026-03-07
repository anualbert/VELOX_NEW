import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, ArrowRight, Activity, Loader2, AlertCircle } from 'lucide-react';

interface LoginProps {
    onSignupClick: () => void;
}

const Login: React.FC<LoginProps> = ({ onSignupClick }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:8000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (res.ok) {
                login(data);
            } else {
                setError(data.detail || 'Invalid username or password');
            }
        } catch (err) {
            setError('Cannot connect to server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#020617]">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#020617] to-[#020617] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="glass-panel w-full max-w-md p-8 relative z-10 animate-fade-in shadow-2xl">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 shadow-lg shadow-blue-500/30">
                        <Activity className="text-white" size={32} />
                    </div>
                    <h2 className="text-4xl font-bold text-white tracking-tight mb-2">VELOX</h2>
                    <p className="text-slate-400">Next-Gen Student Engagement</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-sm mb-6 flex items-start gap-3">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">Username</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                        {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-slate-700/50">
                    <p className="text-slate-400 text-sm">
                        Don't have an account? {' '}
                        <button onClick={onSignupClick} className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline">
                            Create one now
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
