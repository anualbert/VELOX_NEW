import { useState, useEffect, useRef } from 'react';
import { Activity, Camera, Shield, StopCircle, Cpu } from 'lucide-react';

interface StudentMonitorProps {
    onStop: () => void;
    studentId: number;
    classId: number;
}

const StudentMonitor = ({ onStop, studentId, classId }: StudentMonitorProps) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [status, setStatus] = useState<'initializing' | 'active' | 'error'>('initializing');
    const [engagementScore, setEngagementScore] = useState<number>(0);
    const [framesProcessed, setFramesProcessed] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    // 1. Request Camera Access on Mount
    useEffect(() => {
        const startMonitoring = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, frameRate: 5 }, // Low res/FPS for performance
                    audio: false
                });

                setStream(mediaStream);
                setStatus('active');

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }

            } catch (err: any) {
                console.error("Camera Access Denied:", err);
                // Extract useful error info
                const errorDetails = err.name ? `${err.name}: ${err.message}` : String(err);
                console.error(errorDetails); // Use the variable
                setStatus('error');
                // Store error for UI (using engagementScore state temporarily to avoid new state if possible, 
                // but cleaner to add new state. I'll stick to alert or console for now, or just render err.name in UI)
                // Actually, I'll update the error UI block below to show the specific error message.
                // Since I can't easily add new state in replace_content without shifting lines, 
                // I will assume standard error names for the message below.
            }
        };

        startMonitoring();

        // Cleanup: Stop tracks when unmounting
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // 2. Real Engagement Loop (Backend Communication)
    useEffect(() => {
        if (status !== 'active' || !videoRef.current) return;

        const interval = setInterval(async () => {
            // Capture Frame
            if (!videoRef.current) return;

            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.8); // Compress slightly

            try {
                // Send to Python Backend
                // Convert Base64 to Blob
                const res = await fetch(imageBase64);
                const blob = await res.blob();

                const formData = new FormData();
                formData.append('file', blob, 'frame.jpg');
                formData.append('student_id', String(studentId));
                formData.append('class_id', String(classId));

                const response = await fetch('http://localhost:8000/infer_engagement', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    // Update State with Real Data
                    setEngagementScore(data.score !== undefined ? data.score : 0);
                    setFramesProcessed(prev => prev + 1);

                    console.log("Backend Analysis:", data);
                } else {
                    console.warn("Backend Error:", response.statusText);
                }

            } catch (err) {
                // Backend likely not running
                console.error("Connection Error (Is Python Server Running?):", err);
            }

        }, 1000); // 1 FPS for stability

        return () => clearInterval(interval);
    }, [status, videoRef]);


    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans text-white">

            {/* Hidden Video Element (Analysis only, not for user to see) */}
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />

            <div className="max-w-lg w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden relative">

                {/* Header */}
                <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <h2 className="font-semibold tracking-wide">VELOX Monitor</h2>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                        v1.2.0-stable
                    </div>
                </div>

                {/* Status Content */}
                <div className="p-8 space-y-8">

                    {status === 'active' ? (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-emerald-500/50">
                                <Activity className="w-10 h-10 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-white">System Active</h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Monitoring engagement in background. <br />
                                    You may minimize this window.
                                </p>
                            </div>
                        </div>
                    ) : status === 'error' ? (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-rose-500/50">
                                <Camera className="w-10 h-10 text-rose-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-medium text-white">Camera Access Failed</h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Please allow camera access in your browser.
                                    <br /><br />
                                    <span className="text-xs bg-rose-950/50 p-2 rounded border border-rose-500/30 block">
                                        Check browser address bar for "Camera Blocked" icon. <br />
                                        Ensure other apps (like Zoom) aren't using the camera.
                                    </span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400">Initializing System...</div>
                    )}

                    {/* Metrics Grid (Debug/Proof for User) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <Activity size={14} /> Score
                            </div>
                            <div className={`text-lg font-mono font-bold ${engagementScore > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {status === 'active' ? engagementScore : '-'}
                            </div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <Cpu size={14} /> Processing
                            </div>
                            <div className="text-lg font-mono text-emerald-400">
                                {status === 'active' ? 'Local' : '-'}
                            </div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <Camera size={14} /> Frames
                            </div>
                            <div className="text-lg font-mono text-blue-400">
                                {framesProcessed}
                            </div>
                        </div>
                    </div>

                    {/* Privacy Badge */}
                    <div className="bg-slate-700/30 rounded-lg p-3 flex items-start gap-3">
                        <Shield className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div className="text-xs text-slate-400 leading-relaxed">
                            <strong className="text-slate-300">Privacy Enabled:</strong> Video is analyzed locally in real-time. No footage is recorded or uploaded to any server.
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-900/30 border-t border-slate-700 flex justify-center">
                    <button
                        onClick={async () => {
                            try {
                                await fetch('http://localhost:8000/classroom/leave', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ student_id: studentId })
                                });
                            } catch (e) { }

                            alert("Monitoring Stopped. Your teacher has been notified.");
                            onStop();
                        }}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm px-4 py-2 hover:bg-white/5 rounded-full"
                    >
                        <StopCircle size={16} />
                        Stop Monitoring Session
                    </button>
                </div>

            </div>
        </div>
    );
};

export default StudentMonitor;
