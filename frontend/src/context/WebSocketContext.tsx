import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface StudentUpdate {
    type: 'student_update';
    student_id: number;
    engagement_score: number;
    status: string;
}

interface WebSocketContextType {
    connected: boolean;
    liveData: Record<number, StudentUpdate>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children, classId }: { children: ReactNode; classId: number | null }) => {
    const { user } = useAuth();
    const [connected, setConnected] = useState(false);
    const [liveData, setLiveData] = useState<Record<number, StudentUpdate>>({});

    useEffect(() => {
        if (!classId || !user) return;

        const ws = new WebSocket(`ws://localhost:8000/ws/teacher/${classId}`);

        ws.onopen = () => {
            console.log(`Connected to Live Class ${classId}`);
            setConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'student_update') {
                    setLiveData(prev => ({
                        ...prev,
                        [data.student_id]: data
                    }));
                }
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        ws.onclose = () => {
            console.log("Disconnected");
            setConnected(false);
        };

        return () => {
            ws.close();
        };
    }, [classId, user]);

    return (
        <WebSocketContext.Provider value={{ connected, liveData }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useLiveClass = () => {
    const context = useContext(WebSocketContext);
    if (!context) throw new Error("useLiveClass must be used within WebSocketProvider");
    return context;
};
