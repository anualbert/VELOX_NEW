import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Clock, Zap, AlertCircle } from 'lucide-react';

const LiveClassView = () => {
    // Mock Data for Graph
    const data = [
        { time: '10:00', engagement: 65 },
        { time: '10:05', engagement: 72 },
        { time: '10:10', engagement: 78 },
        { time: '10:15', engagement: 85 },
        { time: '10:20', engagement: 82 },
        { time: '10:25', engagement: 68 },
        { time: '10:30', engagement: 75 },
        { time: '10:35', engagement: 88 },
        { time: '10:40', engagement: 92 },
    ];

    return (
        <div className="space-y-6">

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<Zap className="text-emerald-500" />}
                    label="Avg. Engagement"
                    value="78%"
                    trend="+5%"
                    trendUp={true}
                    color="border-emerald-500/20 bg-emerald-50"
                />
                <StatCard
                    icon={<Users className="text-blue-500" />}
                    label="Active Students"
                    value="42 / 45"
                    sub="93% Attendance"
                    color="border-blue-500/20 bg-blue-50"
                />
                <StatCard
                    icon={<Clock className="text-amber-500" />}
                    label="Session Time"
                    value="00:42:15"
                    sub="Active Class"
                    color="border-amber-500/20 bg-amber-50"
                />
                <StatCard
                    icon={<AlertCircle className="text-rose-500" />}
                    label="Low Attention"
                    value="3"
                    sub="Students flagged"
                    color="border-rose-500/20 bg-rose-50"
                />
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Graph */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-slate-800">Engagement Trend (Real-time)</h3>
                        <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                            LIVE
                        </span>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="time"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="engagement"
                                    stroke="#0ea5e9"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorEngagement)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Live Feedback Recommendations */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                    <h3 className="font-semibold text-slate-800 mb-4">AI Recommendations</h3>
                    <div className="space-y-4 flex-1">
                        <RecommendationItem
                            title="Engagement Dip Detected"
                            desc="Engagement dropped by 15% in last 5 mins. Consider asking a question or running a poll."
                            severity="medium"
                        />
                        <RecommendationItem
                            title="High Focus Zone"
                            desc="Class attention is peaking. Good time to introduce complex topics."
                            severity="positive"
                        />
                    </div>
                    <button className="mt-4 w-full py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        View Detailed Analysis
                    </button>
                </div>

            </div>

        </div>
    );
};

const StatCard = ({ icon, label, value, sub, trend, trendUp, color }: any) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
        <div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
            <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
            {(sub || trend) && (
                <div className="flex items-center mt-2">
                    {trend && (
                        <span className={`text-xs font-bold mr-2 ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {trend}
                        </span>
                    )}
                    {sub && <span className="text-xs text-slate-400">{sub}</span>}
                </div>
            )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            {icon}
        </div>
    </div>
);

const RecommendationItem = ({ title, desc, severity }: any) => {
    let border = 'border-l-4 border-slate-300';
    let bg = 'bg-slate-50';
    if (severity === 'medium') { border = 'border-l-4 border-amber-400'; bg = 'bg-amber-50/50'; }
    if (severity === 'positive') { border = 'border-l-4 border-emerald-400'; bg = 'bg-emerald-50/50'; }

    return (
        <div className={`p-3 rounded-r-lg ${bg} ${border}`}>
            <h4 className="text-sm font-medium text-slate-800">{title}</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
        </div>
    );
}

export default LiveClassView;
