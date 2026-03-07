import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Copy, Users, LogOut, Video } from 'lucide-react';

interface Classroom {
    id: number;
    name: string;
    code: string;
    active_meeting_link: string | null;
}

const HostDashboard = () => {
    const { user, logout } = useAuth();
    const [classes, setClasses] = useState<Classroom[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newClassName, setNewClassName] = useState('');

    const fetchClasses = async () => {
        try {
            const res = await fetch(`http://localhost:8000/classroom/teacher/${user?.id}`);
            const data = await res.json();
            setClasses(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (user) fetchClasses();
    }, [user]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) {
            alert("Error: User session invalid. Please relogin.");
            return;
        }

        try {
            const res = await fetch('http://localhost:8000/classroom/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newClassName, teacher_id: user.id })
            });

            if (res.ok) {
                setShowCreate(false);
                setNewClassName('');
                fetchClasses();
                showToast("Class Created Successfully!", 'success');
            } else {
                const errData = await res.json();
                alert(`Failed to create class: ${errData.detail || 'Unknown Error'}`);
            }
        } catch (err) {
            console.error(err);
            alert("Network Error: Could not reach server.");
        }
    };

    const [selectedReportClass, setSelectedReportClass] = useState<Classroom | null>(null);
    const [reportData, setReportData] = useState<any[]>([]);

    const handleViewReport = async (cls: Classroom) => {
        setSelectedReportClass(cls);
        try {
            const res = await fetch(`http://localhost:8000/classroom/${cls.id}/report`);
            if (res.ok) {
                const data = await res.json();
                setReportData(data);
            }
        } catch (e) { console.error(e); }
    };

    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
    const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);

    // --- LIVE MONITOR STATE ---
    const [liveClass, setLiveClass] = useState<Classroom | null>(null);
    const [liveData, setLiveData] = useState<any>(null);

    const [engagementHistory, setEngagementHistory] = useState<number[]>([]);

    useEffect(() => {
        let ws: WebSocket;

        if (liveClass) {
            // Initial Fetch to populate list
            const fetchInitial = async () => {
                try {
                    const res = await fetch(`http://localhost:8000/classroom/${liveClass.id}/live`);
                    if (res.ok) {
                        const initialData = await res.json();
                        setLiveData(initialData);

                        // Start WebSocket after initial load
                        connectWS(initialData);
                    }
                } catch (e) { console.error(e); }
            };

            const connectWS = (currentData: any) => {
                ws = new WebSocket(`ws://localhost:8000/ws/teacher/${liveClass.id}`);

                ws.onopen = () => console.log("Connected to Live Feed");

                ws.onmessage = (event) => {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'student_update') {
                        setLiveData((prev: any) => {
                            if (!prev) return prev;

                            // Check if student exists
                            let students = [...(prev.students || [])];
                            const idx = students.findIndex((s: any) => s.student_id === msg.student_id);

                            // Update logic
                            if (idx >= 0) {
                                const oldStatus = students[idx].current_status;
                                const newStatus = msg.status;

                                // Trigger Toast for critical status changes
                                if (oldStatus !== newStatus) {
                                    if (newStatus === "Camera Off / Absent") showToast(`Alert: ${students[idx].name} camera is OFF/ABSENT!`, 'error');
                                    else if (newStatus === "Left Meeting") showToast(`Alert: ${students[idx].name} LEFT the meeting!`, 'error');
                                    else if (newStatus === "Monitoring Stopped") showToast(`Alert: ${students[idx].name} STOPPED monitoring!`, 'error');
                                }
                                // Low Engagement Alert
                                if (msg.engagement_score < 30 && students[idx].engagement_score >= 30) {
                                    showToast(`Alert: ${students[idx].name} engagement dropped below 30%!`, 'error');
                                }

                                students[idx] = {
                                    ...students[idx],
                                    engagement_score: msg.engagement_score,
                                    current_status: msg.status, // Use backend field
                                    emotion: msg.emotion
                                };
                            } else {
                                // New Student
                            }

                            // Re-calc average (Exclude inactive?)
                            const total = students.reduce((acc: any, s: any) => acc + s.engagement_score, 0);
                            const avg = students.length ? Math.round(total / students.length) : 0;

                            // Update History
                            setEngagementHistory(prevHist => {
                                const newHist = [...prevHist, avg];
                                if (newHist.length > 50) newHist.shift();
                                return newHist;
                            });

                            return { ...prev, students, class_average: avg, active_students: students.length };
                        });
                    }
                };

                ws.onclose = () => console.log("Live Feed Disconnected");
            };

            fetchInitial();

            return () => {
                if (ws) ws.close();
                setEngagementHistory([]); // Reset history on close
            };
        }
    }, [liveClass]);


    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000); // 4 Seconds
    };

    const handleViewStudents = async (cls: Classroom) => {
        setSelectedClass(cls);
        try {
            const res = await fetch(`http://localhost:8000/classroom/${cls.id}/students`);
            if (res.ok) {
                const data = await res.json();
                setEnrolledStudents(data);
            }
        } catch (e) { console.error(e); }
    };

    const updateLink = async (classId: number, link: string) => {
        try {
            await fetch(`http://localhost:8000/classroom/${classId}/publish?link=${encodeURIComponent(link)}`, { method: 'POST' });
            fetchClasses();
            showToast("Meeting Link Published Successfully!", 'success');
        } catch (e) { showToast("Failed to publish link", 'error'); }
    };

    return (
        <div className="min-h-screen p-6 font-sans relative">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl glass-panel border z-[100] flex items-center gap-3 animate-fade-in ${toast.type === 'success' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/90' : 'border-rose-500/50 text-rose-400 bg-rose-950/90'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                    <span className="font-medium">{toast.msg}</span>
                </div>
            )}

            {/* LIVE MONITOR MODAL */}
            {liveClass && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
                    <div className="w-full h-full p-8 flex flex-col max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                    <span className="w-4 h-4 rounded-full bg-red-600 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.8)]"></span>
                                    Live Monitor: {liveClass.name}
                                </h2>
                                <p className="text-slate-400 mt-1">Real-time Participant Engagement Dashboard (WebSocket Active)</p>
                            </div>
                            <button onClick={() => setLiveClass(null)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors font-bold">
                                End Monitoring
                            </button>
                        </div>

                        {!liveData ? (
                            <div className="flex-1 flex items-center justify-center text-slate-500 text-xl animate-pulse">Connecting to Live Feed...</div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50">
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Class Average</p>
                                        <h3 className={`text-5xl font-bold mt-2 ${(liveData.class_average || 0) >= 70 ? 'text-emerald-400' : (liveData.class_average || 0) >= 40 ? 'text-amber-400' : 'text-rose-400'
                                            }`}>
                                            {liveData.class_average || 0}%
                                        </h3>
                                    </div>
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50">
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Participants</p>
                                        <h3 className="text-5xl font-bold text-blue-400 mt-2">{liveData.active_students || 0}</h3>
                                    </div>
                                    {/* Graph Container */}
                                    <div className="md:col-span-2 bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 relative overflow-hidden">
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Engagement Trend</p>
                                        <div className="h-24 w-full flex items-end gap-1">
                                            {/* Simple CSS Bar Chart for history */}
                                            {engagementHistory.map((val, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-1 bg-blue-500/30 hover:bg-blue-400 transition-colors rounded-t-sm"
                                                    style={{ height: `${val}%` }}
                                                    title={`${val}%`}
                                                ></div>
                                            ))}
                                            {engagementHistory.length === 0 && <div className="text-slate-600 text-sm">Waiting for trend data...</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Student Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                                    {liveData.students && liveData.students.map((stu: any) => (
                                        <div key={stu.student_id} className={`p-6 rounded-2xl border transition-all duration-500 ${stu.engagement_score < 40 ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-900/50 border-slate-700/50'
                                            }`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-lg text-white truncate max-w-[150px]">{stu.name}</h4>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stu.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                                            {stu.status}
                                                        </span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                                            {stu.emotion || 'Neutral'}
                                                        </span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stu.engagement_score >= 70 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                stu.engagement_score >= 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                            }`}>
                                                            {stu.engagement_score >= 80 ? 'High' : stu.engagement_score >= 40 ? 'Medium' : 'Low'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-2xl font-bold ${stu.engagement_score >= 70 ? 'text-emerald-400' :
                                                        stu.engagement_score >= 40 ? 'text-amber-400' : 'text-rose-400'
                                                        }`}>
                                                        {stu.engagement_score}%
                                                    </div>
                                                    <div className="text-xs text-slate-500">Attention</div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className={`h-full transition-all duration-700 ease-out rounded-full ${stu.engagement_score >= 70 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                                                        stu.engagement_score >= 40 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'
                                                        }`}
                                                    style={{ width: `${stu.engagement_score}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {(!liveData.students || liveData.students.length === 0) && (
                                    <div className="text-center py-32 opacity-50">
                                        <Users className="w-24 h-24 mx-auto mb-6 text-slate-600" />
                                        <h3 className="text-2xl font-bold text-slate-500">Waiting for data...</h3>
                                        <p className="text-slate-400 mt-2">Students must use the VELOX Extension in Google Meet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}


            <header className="max-w-7xl mx-auto flex justify-between items-center mb-12 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-emerald-200">
                        Welcome, {user?.full_name}
                    </h1>
                    <p className="text-slate-400 mt-1">Teacher Dashboard</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-6 py-2">
                        <Plus size={18} /> Create Class
                    </button>
                    <button onClick={logout} className="p-3 text-slate-400 hover:text-rose-400 transition-colors bg-slate-900/50 rounded-lg border border-slate-700">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Create Class Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <form onSubmit={handleCreate} className="glass-panel p-8 rounded-2xl w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-6">Create New Class</h3>
                        <input
                            className="input-field mb-6"
                            placeholder="Class Name (e.g. Physics 101)"
                            value={newClassName}
                            onChange={e => setNewClassName(e.target.value)}
                            required
                        />
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">Create</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Student List Modal */}
            {selectedClass && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setSelectedClass(null)}>
                    <div className="glass-panel w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl p-0 m-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0f172a]/95 backdrop-blur-md">
                            <div>
                                <h3 className="text-xl font-bold text-white">Students in {selectedClass.name}</h3>
                                <p className="text-sm text-slate-400">Code: <span className="font-mono text-blue-400">{selectedClass.code}</span></p>
                            </div>
                            <button onClick={() => setSelectedClass(null)} className="text-slate-400 hover:text-white">Close</button>
                        </div>
                        <div className="p-6">
                            {enrolledStudents.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No students have joined yet.</p>
                                    <p className="text-sm mt-2">Share code <span className="text-blue-400 font-mono">{selectedClass.code}</span> to invite them.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {enrolledStudents.map((stu) => (
                                        <div key={stu.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                    {stu.full_name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-white">{stu.full_name}</h4>
                                                    <p className="text-xs text-slate-400">@{stu.username}</p>
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono">
                                                Joined {new Date(stu.joined_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Class Report Modal */}
            {selectedReportClass && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setSelectedReportClass(null)}>
                    <div className="glass-panel w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl p-0 m-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0f172a]/95 backdrop-blur-md">
                            <div>
                                <h3 className="text-xl font-bold text-white">Engagement Report: {selectedReportClass.name}</h3>
                                <p className="text-sm text-slate-400">Average Attention Scores</p>
                            </div>
                            <button onClick={() => setSelectedReportClass(null)} className="text-slate-400 hover:text-white">Close</button>
                        </div>
                        <div className="p-6">
                            {reportData.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <p>No engagement data collected yet.</p>
                                    <p className="text-xs mt-1">Start a session and have students join to see analytics.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Header Row */}
                                    <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider px-4">
                                        <div className="col-span-4">Student</div>
                                        <div className="col-span-6">Average Engagement</div>
                                        <div className="col-span-2 text-right">Score</div>
                                    </div>

                                    {reportData.map((data) => (
                                        <div key={data.student_id} className="grid grid-cols-12 gap-4 items-center p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="col-span-4 font-medium text-white">{data.student_name}</div>
                                            <div className="col-span-6">
                                                <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${data.average_engagement >= 70 ? 'bg-emerald-500' :
                                                            data.average_engagement >= 40 ? 'bg-amber-400' : 'bg-rose-500'
                                                            }`}
                                                        style={{ width: `${Math.min(100, data.average_engagement)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-right font-mono text-sm">
                                                {data.average_engagement}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {classes.map((cls, idx) => (
                    <div
                        key={cls.id}
                        className="glass-card rounded-2xl p-6 relative group border border-white/5 hover:border-blue-500/30 transition-all"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                        {/* Clickable Header Area for Viewing Students */}
                        <div
                            className="flex justify-between items-start mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleViewStudents(cls)}
                        >
                            <div>
                                <h3 className="font-bold text-xl text-white group-hover:text-blue-300 transition-colors">{cls.name}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600 text-slate-300 font-mono text-sm tracking-wider">
                                        {cls.code}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(cls.code);
                                            showToast("Class Code Copied!");
                                        }}
                                        className="text-slate-500 hover:text-blue-400 transition-colors"
                                        title="Copy Code"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                                <Users size={20} className="text-blue-300" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Active Meeting Link</label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <a
                                            href="https://meet.google.com/new"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
                                        >
                                            <Video size={16} /> Create Meet
                                        </a>
                                        <p className="text-xs text-slate-500 self-center">
                                            &larr; Click to generate link, then paste below.
                                        </p>
                                    </div>

                                    <div className="relative flex gap-2">
                                        <div className="relative flex-1">
                                            <Video className="absolute left-3 top-3 text-slate-500" size={16} />
                                            <input
                                                id={`link-input-${cls.id}`}
                                                className="w-full bg-slate-950/30 border border-slate-700/50 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-300 focus:border-blue-500/50 outline-none transition-colors"
                                                placeholder="Paste Google Meet Link..."
                                                defaultValue={cls.active_meeting_link || ''}
                                                key={cls.active_meeting_link}
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const input = document.getElementById(`link-input-${cls.id}`) as HTMLInputElement;
                                                if (input) updateLink(cls.id, input.value);
                                            }}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                                        >
                                            Publish
                                        </button>
                                        {cls.active_meeting_link && (
                                            <button
                                                onClick={() => window.open(cls.active_meeting_link!, '_blank')}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                            >
                                                Start Meeting
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center text-sm text-slate-400 mt-2">
                                <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                    Active Class
                                </span>
                                <button
                                    onClick={() => handleViewReport(cls)}
                                    className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 hover:underline"
                                >
                                    View Report &rarr;
                                </button>
                                <button
                                    onClick={() => setLiveClass(cls)}
                                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse border border-red-400/50"
                                >
                                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></div>
                                    Live Monitor
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HostDashboard;
