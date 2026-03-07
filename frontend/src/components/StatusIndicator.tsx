import React from 'react';
import { Activity, PauseCircle, CameraOff, EyeOff } from 'lucide-react';

export type MonitoringState = 'active' | 'paused' | 'camera-error' | 'no-face';

interface StatusIndicatorProps {
    state: MonitoringState;
    variant?: 'tray' | 'floating';
    onClick?: () => void;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ state, variant = 'tray', onClick }) => {

    // State configurations
    const config = {
        active: {
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
            icon: Activity,
            label: 'Monitoring Active',
            pulse: true
        },
        paused: {
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
            icon: PauseCircle,
            label: 'Monitoring Paused',
            pulse: false
        },
        'camera-error': {
            color: 'text-rose-500',
            bgColor: 'bg-rose-500/10',
            borderColor: 'border-rose-500/20',
            icon: CameraOff,
            label: 'Camera Not Found',
            pulse: false
        },
        'no-face': {
            color: 'text-slate-400',
            bgColor: 'bg-slate-500/10',
            borderColor: 'border-slate-500/20',
            icon: EyeOff,
            label: 'No Face Detected',
            pulse: false
        }
    };

    const currentConfig = config[state] || config['active'];
    const Icon = currentConfig.icon;

    if (variant === 'tray') {
        return (
            <div
                onClick={onClick}
                className={`
          flex items-center justify-center w-8 h-8 rounded-md 
          hover:bg-white/10 transition-all cursor-pointer relative group
        `}
                title={currentConfig.label}
            >
                <Icon className={`w-5 h-5 ${currentConfig.color}`} />

                {/* Status Dot for Tray */}
                {currentConfig.pulse && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg">
                    {currentConfig.label}
                </div>
            </div>
        );
    }

    // Floating Variant
    return (
        <div
            onClick={onClick}
            className={`
        flex items-center gap-2 px-3 py-2 rounded-full 
        bg-white/90 backdrop-blur-sm border shadow-lg 
        cursor-pointer hover:scale-105 transition-all
        ${currentConfig.borderColor}
      `}
        >
            <div className={`p-1.5 rounded-full ${currentConfig.bgColor}`}>
                <Icon className={`w-4 h-4 ${currentConfig.color}`} />
            </div>
            <span className="text-sm font-medium text-slate-700 pr-1">
                {currentConfig.label}
            </span>
            {currentConfig.pulse && (
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
            )}
        </div>
    );
};

export default StatusIndicator;
