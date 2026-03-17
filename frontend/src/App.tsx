import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import HostDashboard from './components/teacher/HostDashboard';
import StudentDashboard from './components/student/StudentDashboard';

function AppContent() {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // If not logged in, show Auth screens
  if (!user) {
    if (isLogin) return <Login onSignupClick={() => setIsLogin(false)} />;
    return <Signup onLoginClick={() => setIsLogin(true)} />;
  }

  // Logged in Routing
  if (user.role === 'teacher') {
    return <HostDashboard />;
  }

  // Default to Student
  return <StudentDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
