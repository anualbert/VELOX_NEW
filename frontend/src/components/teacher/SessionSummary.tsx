import { FileText, Download, Share2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const SessionSummary = () => {
    const distributionData = [
        { range: 'Very Low', count: 5, color: '#f43f5e' }, // Rose 500
        { range: 'Low', count: 12, color: '#f59e0b' },      // Amber 500
        { range: 'Medium', count: 18, color: '#3b82f6' },   // Blue 500
        { range: 'High', count: 10, color: '#10b981' },     // Emerald 500
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">

            {/* Report Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center sm:text-left sm:flex sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Class Session Report</h2>
                    <p className="text-slate-500 mt-2">Generated automatically on Jan 29, 2026 • 11:30 AM</p>
                </div>
                <div className="mt-4 sm:mt-0 flex gap-3">
                    <button className="flex items-center px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
                        <Share2 size={18} className="mr-2" /> Share
                    </button>
                    <button className="flex items-center px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
                        <Download size={18} className="mr-2" /> PDF Export
                    </button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReportCard label="Session Duration" value="55 mins" icon={<FileText className="text-slate-400" />} />
                <ReportCard label="Avg. Class Attention" value="72%" sub="Satisfactory" highlight="text-emerald-600" />
                <ReportCard label="Total Attendance" value="45" sub="Students" />
            </div>

            {/* Distribution Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <h3 className="font-semibold text-slate-800 mb-6">Engagement Distribution</h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distributionData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="range" type="category" width={80} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                                {distributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center text-sm text-slate-500">
                    Most students fell into the <span className="font-bold text-blue-600">Medium Engagement</span> range.
                </div>
            </div>

        </div>
    );
};

const ReportCard = ({ label, value, sub, highlight, icon }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
        {icon && <div className="mb-2">{icon}</div>}
        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</div>
        <div className={`text-3xl font-bold text-slate-900 ${highlight || ''}`}>{value}</div>
        {sub && <div className="text-slate-400 text-sm mt-1">{sub}</div>}
    </div>
);

export default SessionSummary;
