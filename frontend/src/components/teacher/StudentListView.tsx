import { useState, useEffect, useRef } from 'react';
import { Search, AlertTriangle, XCircle } from 'lucide-react';

interface Student {
    student_id: number;
    name: string;
    engagement_score: number;
    level: string;
    emotion: string;
    status: string;
    last_update: number;
}

const StudentListView = () => {
    const [students, setStudents] = useState<Record<number, Student>>({});
    const [alerts, setAlerts] = useState<string[]>([]);
    const ws = useRef<WebSocket | null>(null);
    const CLASS_ID = 1; // Default for demo

    useEffect(() => {
        // Connect WS
        ws.current = new WebSocket(`ws://localhost:8000/ws/teacher/${CLASS_ID}`);

        ws.current.onopen = () => console.log("Teacher WS Connected");

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'student_update') {
                setStudents(prev => ({
                    ...prev,
                    [data.student_id]: {
                        student_id: data.student_id,
                        name: `Student ${data.student_id}`, // Placeholder if name not sent
                        engagement_score: data.engagement_score,
                        level: data.level || "Unknown",
                        emotion: data.emotion || "Neutral",
                        status: data.status,
                        last_update: Date.now()
                    }
                }));

                // Logic for Alerts
                if (data.status === "Distracted" || data.status === "Left Meeting") {
                    addAlert(`Student ${data.student_id}: ${data.status}`);
                }
                if (data.engagement_score < 30) {
                    addAlert(`Student ${data.student_id}: Low Engagement (${data.engagement_score}%)`);
                }
            }
        };

        return () => ws.current?.close();
    }, []);

    const addAlert = (msg: string) => {
        setAlerts(prev => [msg, ...prev].slice(0, 5));
        setTimeout(() => setAlerts(prev => prev.filter(a => a !== msg)), 5000);
    };

    const studentList = Object.values(students);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">

            {/* Toast Alerts */}
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
                {alerts.map((alert, i) => (
                    <div key={i} className="bg-rose-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-in slide-in-from-right fade-in duration-300">
                        <AlertTriangle size={16} />
                        {alert}
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by Student ID..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Live Updates Active</span>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Emotion</th>
                            <th className="px-6 py-4">Engagement</th>
                            <th className="px-6 py-4">Analysis</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {studentList.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Waiting for students to join...</td></tr>
                        ) : studentList.map((student) => (
                            <tr key={student.student_id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-700 font-mono">{student.name}</td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={student.status} />
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                        {student.emotion}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${getEngagementColor(student.engagement_score)}`}
                                                style={{ width: `${student.engagement_score}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 w-8">{Math.round(student.engagement_score)}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-bold ${student.level === 'High' ? 'text-emerald-600' :
                                        student.level === 'Medium' ? 'text-blue-600' :
                                            'text-rose-600'
                                        }`}>
                                        {student.level} Attention
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    let color = "bg-slate-100 text-slate-600";
    let icon = <div className="w-2 h-2 rounded-full bg-slate-400 mr-2" />;

    if (status === 'Active') {
        color = "bg-emerald-100 text-emerald-800";
        icon = <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />;
    } else if (status === 'Distracted') {
        color = "bg-amber-100 text-amber-800";
        icon = <AlertTriangle size={12} className="mr-1 text-amber-600" />;
    } else if (status === 'Absent' || status === 'Left Meeting') {
        color = "bg-rose-100 text-rose-800";
        icon = <XCircle size={12} className="mr-1 text-rose-600" />;
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
            {icon}
            {status}
        </span>
    );
}

const getEngagementColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
};

export default StudentListView;
