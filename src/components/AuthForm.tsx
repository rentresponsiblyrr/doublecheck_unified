
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/MobileFastAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';

export const AuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  // Debug logging for form field changes
  useEffect(() => {
    console.log('📱 AuthForm mounted');
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    console.log('📱 Email input found:', emailInput ? {
      disabled: (emailInput as HTMLInputElement).disabled,
      readOnly: (emailInput as HTMLInputElement).readOnly,
      value: (emailInput as HTMLInputElement).value,
      style: (emailInput as HTMLInputElement).style
    } : 'not found');
    console.log('📱 Password input found:', passwordInput ? {
      disabled: (passwordInput as HTMLInputElement).disabled,
      readOnly: (passwordInput as HTMLInputElement).readOnly,
      value: (passwordInput as HTMLInputElement).value,
      style: (passwordInput as HTMLInputElement).style
    } : 'not found');
  }, []);

  useEffect(() => {
    console.log('📱 Form state changed:', { email: email.length, password: password.length, loading });
  }, [email, password, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Store current values to prevent form clearing
    const currentEmail = email;
    const currentPassword = password;

    try {
      const { error } = isSignUp 
        ? await signUp(currentEmail, currentPassword)
        : await signIn(currentEmail, currentPassword);

      if (error) {
        console.error('Auth error:', error);
        // Restore form values if there was an error
        setEmail(currentEmail);
        setPassword(currentPassword);
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
      } else if (isSignUp) {
        // Clear form on successful signup
        setEmail('');
        setPassword('');
        toast({
          title: "Account Created",
          description: "Please check your email to verify your account.",
        });
      } else {
        // Keep form values for successful signin (will be cleared by auth redirect)
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      // Restore form values on error
      setEmail(currentEmail);
      setPassword(currentPassword);
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">DoubleCheck</CardTitle>
          <CardDescription className="text-gray-600">
            Powered by Rent Responsibly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                autoComplete="current-password"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
              className="text-blue-600"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : 'Need an account? Sign up'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
