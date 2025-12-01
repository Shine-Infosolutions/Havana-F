import React, { useState } from 'react';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const DEPARTMENTS = [
  { id: 1, name: 'laundry' },
  { id: 2, name: 'reception' },
  { id: 3, name: 'maintenance' },
  { id: 4, name: 'other' },
  { id: 5, name: 'housekeeping' }
];

const departmentOptions = DEPARTMENTS.map(dep => ({ value: dep, label: `${dep.name} (${dep.id})` }));

const Register = ({ onSuccess }) => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: '',
    department: [],
    restaurantRole: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { axios } = useAppContext();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      if (form.role === 'admin') {
        payload.department = DEPARTMENTS;
      }
      if (form.role === 'staff' && Array.isArray(form.department)) {
        // Store as array of objects with id and name
        payload.department = form.department.map(dep => dep.value);
      }
      await axios.post('/api/users/add', payload);
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="min-w-[320px] w-full max-w-md p-8 border border-gray-200 rounded-lg bg-white shadow-md"
      >
        <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Username</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select role</option>
            <option value="ADMIN">Admin</option>
            <option value="GM">General Manager</option>
            <option value="FRONT DESK">Front Desk</option>
            <option value="ACCOUNTS">Accounts</option>
            <option value="STAFF">Staff</option>
          </select>
        </div>
        {form.role === 'staff' && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Department(s)</label>
            <Select
              isMulti
              name="department"
              options={departmentOptions}
              value={form.department}
              onChange={selected => setForm(prev => ({
                ...prev,
                department: selected
              }))}
              className="basic-multi-select"
              classNamePrefix="select"
              required
            />
            <div className="text-xs text-gray-500 mt-1">Select one or more departments. (Number will be stored with department)</div>
          </div>
        )}
        {form.role === 'restaurant' && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Restaurant Role</label>
            <select
              name="restaurantRole"
              value={form.restaurantRole}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select restaurant role</option>
              <option value="staff">Staff</option>
              <option value="cashier">Cashier</option>
              <option value="chef">Chef</option>
            </select>
          </div>
        )}
        {error && (
          <div className="text-red-600 mb-4 text-sm text-center">{error}</div>
        )}
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
         <div className="mt-4 text-center text-sm">
          Have an account?{' '}
          <button
            type="button"
            className="text-blue-600 hover:underline font-medium"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </div>
      </form>

    </div>
  );
};

export default Register;
