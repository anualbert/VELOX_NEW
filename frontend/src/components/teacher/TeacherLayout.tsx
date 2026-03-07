import React, { useState } from 'react';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Menu, X, Bell } from 'lucide-react';

interface TeacherLayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children, onLogout, activeTab, onTabChange }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Navigation Items
    const navItems = [
        { id: 'live', label: 'Live Class', icon: LayoutDashboard },
        { id: 'students', label: 'Student List', icon: Users },
        { id: 'reports', label: 'Session Reports', icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-white/10">
                    <h1 className="text-xl font-bold tracking-wide">VELOX <span className="text-blue-500 text-sm font-normal ml-1">Admin</span></h1>
                    <button
                        className="ml-auto lg:hidden text-slate-400"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id);
                                    setSidebarOpen(false);
                                }}
                                className={`
                  w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                `}
                            >
                                <Icon size={18} className="mr-3" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 space-y-1">
                    <button className="w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                        <Settings size={18} className="mr-3" />
                        Settings
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={18} className="mr-3" />
                        Logout Role
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">

                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
                    <div className="flex items-center">
                        <button
                            className="mr-4 lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {navItems.find(i => i.id === activeTab)?.label}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-slate-400 hover:text-slate-600 relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs border border-blue-200">
                            T
                        </div>
                    </div>
                </header>

                {/* Scrollable Page Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>

            </main>

        </div>
    );
};

export default TeacherLayout;
