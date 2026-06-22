import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <div className="text-7xl font-bold text-white/10 mb-4">404</div>
      <h1 className="text-xl font-bold text-white mb-2">Page Not Found</h1>
      <p className="text-sm text-gray-400 mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 bg-blue-500/20 text-blue-400 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-500/30 transition-colors"
      >
        <Home className="w-4 h-4" /> Back to Dashboard
      </button>
    </div>
  );
};

export default NotFound;
