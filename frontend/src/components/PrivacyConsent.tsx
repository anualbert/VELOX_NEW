import { Shield, Lock, Eye, CheckCircle, AlertCircle } from 'lucide-react';

interface PrivacyConsentProps {
    onEnable: () => void;
}

const PrivacyConsent: React.FC<PrivacyConsentProps> = ({ onEnable }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900 px-8 py-6 text-center">
                    <h1 className="text-2xl font-semibold text-white tracking-wide">VELOX Environment</h1>
                    <p className="text-slate-400 text-sm mt-1">Student-Side Background Monitor</p>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">

                    {/* Main Statement */}
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-medium text-slate-800">Privacy & Ethics Statement</h2>
                        <p className="text-slate-600 leading-relaxed">
                            This system is designed for academic observation research.
                            It runs silently to minimize distraction while gathering anonymous engagement metrics.
                        </p>
                    </div>

                    {/* Privacy Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PrivacyCard
                            icon={<Lock className="w-5 h-5 text-emerald-600" />}
                            title="No Video Stored"
                            description="Video is processed in RAM and discarded immediately."
                        />
                        <PrivacyCard
                            icon={<Shield className="w-5 h-5 text-emerald-600" />}
                            title="Local Processing"
                            description="All facial analysis happens on your device. No images are sent to the cloud."
                        />
                        <PrivacyCard
                            icon={<Eye className="w-5 h-5 text-emerald-600" />}
                            title="Anonymous Data"
                            description="Only numerical scores are generated. No personal identifiable data is linked."
                        />
                        <PrivacyCard
                            icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
                            title="Academic Use Only"
                            description="Data is strictly for research evaluation purposes."
                        />
                    </div>

                    {/* Consent Action */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col items-center space-y-4">
                        <button
                            onClick={onEnable}
                            className="group relative flex items-center justify-center py-3 px-8 border border-transparent text-base font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all duration-200 shadow-md hover:shadow-lg w-full md:w-auto"
                        >
                            <CheckCircle className="w-5 h-5 mr-2 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                            Enable Monitoring Environment
                        </button>
                        <p className="text-xs text-slate-400 text-center max-w-md">
                            By enabling, you consent to the automated engagement analysis described above.
                            You can pause or disable the system at any time from the status tray.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

interface PrivacyCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const PrivacyCard: React.FC<PrivacyCardProps> = ({ icon, title, description }) => (
    <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg flex flex-col items-start gap-2 hover:border-slate-300 transition-colors">
        <div className="bg-white p-2 rounded-md shadow-sm border border-slate-100">
            {icon}
        </div>
        <div>
            <h3 className="font-medium text-slate-800 text-sm">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-snug">{description}</p>
        </div>
    </div>
);

export default PrivacyConsent;
