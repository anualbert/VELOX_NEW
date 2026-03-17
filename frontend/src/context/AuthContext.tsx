import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface User {
    id: number;
    username: string;
    role: 'student' | 'teacher';
    full_name: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('velox_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('velox_user');
        window.location.reload();
    };

    // Check local storage on mount (simplified for this plan)
    // In a real app we'd likely validate token, but this works for persistence demo
    React.useEffect(() => {
        const stored = localStorage.getItem('velox_user');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
