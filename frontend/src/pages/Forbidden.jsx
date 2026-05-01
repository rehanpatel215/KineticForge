import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';

export default function Forbidden() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleReturn = () => {
    if (role === 'mentor') navigate('/dashboard');
    else if (role === 'student') navigate('/me/attendance');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger-bg text-danger mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h1 className="text-h1 text-primary mb-4 font-display">Access Denied</h1>
        <p className="text-body-lg text-secondary mb-8">
          You don't have permission to access this page. If you believe this is a mistake, please contact an administrator.
        </p>
        <button 
          onClick={handleReturn}
          className="bg-surface-raised text-primary border border-default rounded-md px-5 py-3 font-body text-[14px] hover:bg-surface transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
