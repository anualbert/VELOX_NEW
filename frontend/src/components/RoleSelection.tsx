import React from 'react';
import { GraduationCap, Presentation, ChevronRight } from 'lucide-react';

interface RoleSelectionProps {
    onSelectRole: (role: 'student' | 'teacher') => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans">

            <div className="text-center mb-12 space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    VELOX
                </h1>
                <p className="text-slate-400 text-lg max-w-xl mx-auto">
                    Visual Engagement and Learning Observation eXpert
                </p>
                <div className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs tracking-wider uppercase mt-4">
                    Academic Research Prototype
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">

                {/* Student Card */}
                <button
                    onClick={() => onSelectRole('student')}
                    className="group relative bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 p-8 rounded-2xl transition-all duration-300 text-left flex flex-col h-64 shadow-xl hover:shadow-2xl hover:shadow-emerald-900/20"
                >
                    <div className="mb-auto">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <GraduationCap className="w-6 h-6 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-semibold text-white mb-2">Student</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Join a managed session. Runs silently in the background to monitor engagement anonymously.
                        </p>
                    </div>
                    <div className="mt-4 flex items-center text-emerald-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                        Enter Environment <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                </button>

                {/* Teacher Card */}
                <button
                    onClick={() => onSelectRole('teacher')}
                    className="group relative bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 p-8 rounded-2xl transition-all duration-300 text-left flex flex-col h-64 shadow-xl hover:shadow-2xl hover:shadow-blue-900/20"
                >
                    <div className="mb-auto">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Presentation className="w-6 h-6 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-semibold text-white mb-2">Teacher</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            View live class analytics, monitored student list, and post-session engagement summaries.
                        </p>
                    </div>
                    <div className="mt-4 flex items-center text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                        Access Dashboard <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                </button>

            </div>

            <div className="mt-16 text-slate-600 text-xs text-center max-w-md">
                © 2026 VELOX Project. Authorized for academic evaluation only.
                <br />Strict privacy protocols active.
            </div>

        </div>
    );
};

export default RoleSelection;
