import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface SimpleAuthFormProps {
  onAuthSuccess: () => void;
  initialError?: string | null;
}

export const SimpleAuthForm: React.FC<SimpleAuthFormProps> = ({ onAuthSuccess, initialError }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('🔐 Attempting authentication for:', email);
      
      if (isResetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        
        if (error) {
          console.error('❌ Password reset error:', error);
          throw error;
        }
        
        setSuccessMessage('Password reset email sent! Check your inbox and follow the instructions.');
        setIsResetPassword(false);
      } else if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'inspector' // Default role
            }
          }
        });
        console.log('📝 Sign up result:', { data, error });
        
        if (error) {
          console.error('❌ Sign up error:', error);
          throw error;
        }
        setSuccessMessage('Check your email for verification link');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log('🔑 Sign in result:', { data, error });
        
        if (error) {
          console.error('❌ Sign in error:', error);
          throw error;
        }
        
        if (data.user) {
          console.log('✅ Authentication successful for user:', data.user.email);
          onAuthSuccess();
        } else {
          throw new Error('Authentication succeeded but no user data received');
        }
      }
    } catch (error: any) {
      console.error('🚨 Authentication error caught:', error);
      
      // Handle specific Supabase auth errors with user-friendly messages
      let errorMessage = error.message;
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a moment and try again.';
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'No account found with this email address. Please sign up or use a different email.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold">🏠</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">STR Certified</h1>
            <p className="text-gray-600 mt-2">Property Inspection Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {!isResetPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!isResetPassword}
                  minLength={6}
                />
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="text-green-600 text-sm text-center">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : (
                isResetPassword ? 'Send Reset Email' : 
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </button>

            <div className="text-center space-y-2">
              {!isResetPassword && (
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-blue-600 hover:text-blue-800 text-sm block"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              )}
              
              <button
                type="button"
                onClick={() => {
                  setIsResetPassword(!isResetPassword);
                  setIsSignUp(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm block"
              >
                {isResetPassword ? 'Back to sign in' : 'Forgot your password?'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            Secure authentication powered by Supabase
          </div>
        </div>
      </div>
    </div>
  );
};