import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import havanaLogo from '../assets/hawana golden png.png';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(credentials.username, credentials.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#d1d5db'}}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with Havana branding */}
        <div className="text-center py-2" style={{backgroundColor: '#D4AF37'}}>
          <img src={havanaLogo} alt="Havana" className="mx-auto h-20 w-auto -m-8" />

        </div>
        
        {/* Login Form */}
        <div className="px-8 py-8">
          <h2 className="text-2xl font-semibold mb-6 mt-4" style={{color: '#B8860B'}}>Login</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#B8860B'}}>Username</label>
              <input
                type="text"
                placeholder="Enter username"
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#B8860B'}}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
              style={{backgroundColor: loading ? '#B8860B' : '#D4AF37'}}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#B8860B')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#D4AF37')}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          

        </div>
      </div>
    </div>
  );
};

export default Login;