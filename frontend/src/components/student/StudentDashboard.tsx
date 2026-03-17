import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Video, LogOut, Search } from 'lucide-react';

interface Classroom {
    id: number;
    name: string;
    code: string;
    active_meeting_link: string | null;
    teacher_name: string;
}

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const [classes, setClasses] = useState<Classroom[]>([]);
    const [showJoin, setShowJoin] = useState(false);
    const [code, setCode] = useState('');
    const [activeMonitorClass, setActiveMonitorClass] = useState<Classroom | null>(null);

    const fetchClasses = async () => {
        try {
            const res = await fetch(`http://localhost:8000/classroom/student/${user?.id}`);
            const data = await res.json();
            setClasses(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (user) fetchClasses();
    }, [user]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:8000/classroom/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, student_id: user?.id })
            });
            if (res.ok) {
                setShowJoin(false);
                setCode('');
                fetchClasses();
            } else {
                alert("Invalid Code");
            }
        } catch (err) { console.error(err); }
    };

    const launchClass = (cls: Classroom) => {
        if (cls.active_meeting_link) {
            window.open(cls.active_meeting_link, '_blank');
            setActiveMonitorClass(cls);
        } else {
            alert("No active meeting for this class right now.");
        }
    };

    const handleLeaveClass = async (classId: number) => {
        if (!confirm("Are you sure you want to leave this class?")) return;
        if (!user?.id) return;

        try {
            const res = await fetch('http://localhost:8000/classroom/leave_db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: user.id, class_id: classId })
            });

            if (res.ok) {
                fetchClasses();
            } else {
                alert("Failed to leave class");
            }
        } catch (e) { console.error(e); }
    };

    if (activeMonitorClass && user) {
        // ... (Keep existing monitor overlay code but rename Student ID -> Participant ID if visible)
        // Actually, let's just replace the whole return block to be safe and consistent.
        return (
            <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-6">
                <div className="max-w-lg w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 text-center animate-fade-in">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-blue-500/50 mb-6">
                        <Video className="w-10 h-10 text-blue-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Class Session Active</h2>
                    <p className="text-slate-400 mb-8">
                        The class <strong>{activeMonitorClass.name}</strong> is in progress.
                    </p>

                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 text-left space-y-4 mb-8">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                            <div>
                                <h4 className="text-white font-medium">Join Google Meet</h4>
                                <p className="text-sm text-slate-500">Click the link below to join the call.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                            <div>
                                <h4 className="text-white font-medium">Enable Extension</h4>
                                <p className="text-sm text-slate-500">Click the VELOX icon in your browser toolbar and enter your details to start monitoring.</p>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-800 rounded font-mono text-xs text-slate-300 border border-slate-700">
                            Participant ID: <span className="text-blue-400">{user.id}</span> <br />
                            Class ID: <span className="text-blue-400">{activeMonitorClass.id}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setActiveMonitorClass(null)}
                            className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            Back to Dashboard
                        </button>
                        <button
                            onClick={() => window.open(activeMonitorClass.active_meeting_link!, '_blank')}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                            <Video size={18} /> Resend Link
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 font-sans">
            <header className="max-w-7xl mx-auto flex justify-between items-center mb-12 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 to-cyan-200">
                        Hello, {user?.full_name}
                    </h1>
                    <p className="text-slate-400 mt-1">Participant Dashboard</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setShowJoin(true)} className="btn-primary bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 flex items-center gap-2 px-6 py-2">
                        <Plus size={18} /> Join Class
                    </button>
                    <button onClick={logout} className="p-3 text-slate-400 hover:text-rose-400 transition-colors bg-slate-900/50 rounded-lg border border-slate-700">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {showJoin && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <form onSubmit={handleJoin} className="glass-panel p-8 rounded-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold text-white mb-6">Join Class</h3>
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
                            <input
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none uppercase font-mono tracking-widest transition-all"
                                placeholder="CODE"
                                maxLength={6}
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setShowJoin(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">Join</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {classes.length === 0 && (
                    <div className="col-span-1 md:col-span-3 text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/50 mb-4 ring-1 ring-slate-700">
                            <Plus size={32} className="text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-300">No classes yet</h3>
                        <p className="text-slate-500 mt-2">Click "Join Class" to get started with your learning journey.</p>
                    </div>
                )}

                {Array.isArray(classes) && classes.map((cls,idx) => (
                    <div key={cls.id} className="glass-card rounded-2xl p-6 relative group" style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-2xl text-white mb-1">{cls.name}</h3>
                                    <p className="text-slate-400 text-sm">Host: <span className="text-white font-medium">{cls.teacher_name}</span></p>
                                </div>
                                <button
                                    onClick={() => handleLeaveClass(cls.id)}
                                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-all"
                                    title="Leave Class"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>

                            {cls.active_meeting_link ? (
                                <button
                                    onClick={() => launchClass(cls)}
                                    className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-300 py-4 rounded-xl font-medium border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-lg shadow-emerald-900/10 animate-pulse"
                                >
                                    <Video size={20} /> Join Active Session
                                </button>
                            ) : (
                                <div className="w-full py-4 text-center text-slate-500 text-sm bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                                    Waiting for session...
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
    


export default StudentDashboard;
