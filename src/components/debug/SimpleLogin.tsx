import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export const SimpleLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('🔄 Attempting simple login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Login error:', error);
        setMessage(`Login failed: ${error.message}`);
      } else {
        console.log('✅ Login successful:', data);
        setMessage('Login successful! Check console for details.');
        
        // Test session immediately
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
        } else {
          console.log('✅ Session after login:', sessionData);
        }
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setMessage(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('🔄 Attempting simple signup...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        console.error('❌ Signup error:', error);
        setMessage(`Signup failed: ${error.message}`);
      } else {
        console.log('✅ Signup successful:', data);
        setMessage('Signup successful! Check your email for confirmation.');
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setMessage(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setMessage('');

    try {
      console.log('🔄 Testing Supabase connection...');
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Connection error:', error);
        setMessage(`Connection failed: ${error.message}`);
      } else {
        console.log('✅ Connection successful:', data);
        setMessage(`Connection successful! Session: ${data.session ? 'Active' : 'None'}`);
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setMessage(`Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Simple Login Test</h2>
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
          
          <button
            type="button"
            onClick={handleSignup}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Signup'}
          </button>
        </div>
      </form>
      
      <button
        onClick={testConnection}
        disabled={loading}
        className="w-full mt-4 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50"
      >
        Test Connection
      </button>
      
      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Check browser console for detailed logs</p>
      </div>
    </div>
  );
};
