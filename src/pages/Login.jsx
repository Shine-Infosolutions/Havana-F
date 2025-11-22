import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import havanaLogo from '../assets/hawana png11.png';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('token', 'dummy-token');
    localStorage.setItem('role', 'admin');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#d1d5db'}}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with Havana branding */}
        <div className="text-center py-2" style={{backgroundColor: '#D4AF37'}}>
          <img src={havanaLogo} alt="Havana" className="mx-auto h-40 w-au                                                                                                                                                 to -m-8" />

        </div>
        
        {/* Login Form */}
        <div className="px-8 py-8">
          <h2 className="text-2xl font-semibold mb-6 mt-4" style={{color: '#B8860B'}}>Login</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: '#B8860B'}}>Username</label>
              <input
                type="text"
                placeholder="Admin123"
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
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
              />
            </div>
            
            <button
              type="submit"
              className="w-full text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200"
              style={{backgroundColor: '#D4AF37'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#B8860B'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#D4AF37'}
            >
              Login
            </button>
          </form>
          

        </div>
      </div>
    </div>
  );
};

export default Login;