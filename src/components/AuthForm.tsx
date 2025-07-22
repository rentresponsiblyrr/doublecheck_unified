
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { log } from '@/lib/logging/enterprise-logger';

export const AuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  // Debug logging for form field changes
  useEffect(() => {
    log.debug('AuthForm mounted', {
      component: 'AuthForm',
      action: 'mount'
    }, 'AUTHFORM_MOUNTED');
    
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    
    log.debug('Form inputs validation', {
      component: 'AuthForm',
      action: 'validateInputs',
      emailInputFound: !!emailInput,
      passwordInputFound: !!passwordInput,
      emailDisabled: emailInput ? (emailInput as HTMLInputElement).disabled : null,
      passwordDisabled: passwordInput ? (passwordInput as HTMLInputElement).disabled : null
    }, 'FORM_INPUTS_VALIDATED');
  }, []);

  useEffect(() => {
    log.debug('Form state changed', {
      component: 'AuthForm',
      action: 'stateChange',
      emailLength: email.length,
      passwordLength: password.length,
      isLoading: loading,
      isSignUpMode: isSignUp
    }, 'FORM_STATE_CHANGED');
  }, [email, password, loading, isSignUp]);

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
        log.error('Authentication error during form submission', error, {
          component: 'AuthForm',
          action: 'handleSubmit',
          isSignUp,
          emailLength: currentEmail.length,
          hasPassword: !!currentPassword
        }, 'AUTH_FORM_SUBMISSION_ERROR');
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
      log.error('Unexpected authentication error', error as Error, {
        component: 'AuthForm',
        action: 'handleSubmit',
        isSignUp,
        emailLength: currentEmail.length
      }, 'AUTH_UNEXPECTED_ERROR');
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
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <Logo 
              size="xl" 
              showText={false}
              variant="default"
              theme="light"
              className="mb-2"
              imageUrl="/lovable-uploads/ea9dd662-995b-4cd0-95d4-9f31b2aa8d3b.png"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-gray-900">DoubleCheck</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              STR Certified Platform
            </CardDescription>
            <CardDescription className="text-sm text-gray-500">
              Powered by Rent Responsibly
            </CardDescription>
          </div>
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
