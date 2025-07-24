import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, Target, AlertCircle, CheckCircle, Eye, EyeOff, Mail, Lock, ArrowLeft, Shield, Wifi, User, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

type AuthMode = 'signin' | 'signup' | 'forgot-password';

interface ValidationState {
  email: { isValid: boolean; message: string; };
  password: { isValid: boolean; message: string; suggestions: string[]; };
}

const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validation, setValidation] = useState<ValidationState>({
    email: { isValid: true, message: '' },
    password: { isValid: true, message: '', suggestions: [] }
  });
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { signIn, signUp, resetPassword, error, clearError, validatePassword, validateEmail } = useAuth();

  // Real-time email validation
  useEffect(() => {
    if (email) {
      const emailValidation = validateEmail(email);
      setValidation(prev => ({
        ...prev,
        email: {
          isValid: emailValidation.isValid,
          message: emailValidation.error || ''
        }
      }));
    } else {
      setValidation(prev => ({
        ...prev,
        email: { isValid: true, message: '' }
      }));
    }
  }, [email, validateEmail]);

  // Real-time password validation and strength calculation
  useEffect(() => {
    if (password && mode === 'signup') {
      const passwordValidation = validatePassword(password);
      setValidation(prev => ({
        ...prev,
        password: {
          isValid: passwordValidation.isValid,
          message: passwordValidation.errors.join(', '),
          suggestions: passwordValidation.suggestions
        }
      }));

      // Calculate password strength (0-5)
      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/\d/.test(password)) strength++;
      if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
      setPasswordStrength(strength);
    } else {
      setValidation(prev => ({
        ...prev,
        password: { isValid: true, message: '', suggestions: [] }
      }));
      setPasswordStrength(0);
    }
  }, [password, mode, validatePassword]);

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 2) return 'bg-orange-500';
    if (strength <= 3) return 'bg-yellow-500';
    if (strength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 1) return 'Very Weak';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength <= 4) return 'Good';
    return 'Strong';
  };

  const getErrorIcon = (errorType?: string) => {
    switch (errorType) {
      case 'network': return <Wifi className="h-4 w-4" />;
      case 'validation': return <AlertTriangle className="h-4 w-4" />;
      case 'password': return <Lock className="h-4 w-4" />;
      case 'confirmation': return <Mail className="h-4 w-4" />;
      case 'auth': return <User className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const clearMessages = () => {
    clearError();
    setSuccessMessage('');
    setResetEmailSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearMessages();

    // Client-side validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setIsSubmitting(false);
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setValidation(prev => ({
        ...prev,
        password: {
          isValid: false,
          message: 'Passwords do not match',
          suggestions: ['Make sure both passwords are identical']
        }
      }));
      setIsSubmitting(false);
      return;
    }

    try {
      let result;
      
      if (mode === 'signup') {
        result = await signUp(email, password);
        if (result) {
          setSuccessMessage('🎉 Account created successfully! Please check your email to verify your account before signing in.');
          setMode('signin');
          setPassword('');
          setConfirmPassword('');
        }
      } else if (mode === 'signin') {
        result = await signIn(email, password);
        // If successful, the auth state will update and redirect automatically
      } else if (mode === 'forgot-password') {
        result = await resetPassword(email);
        if (result !== null) { // null means there was an error
          setResetEmailSent(true);
          setSuccessMessage(`📧 Password reset email sent to ${email}. Please check your inbox and follow the instructions.`);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    clearMessages();
    setPassword('');
    setConfirmPassword('');
    setPasswordStrength(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 sm:p-3 bg-blue-600 rounded-xl shadow-lg">
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">SimplyTask</h1>
              <p className="text-xs sm:text-sm text-gray-600">Executive Suite</p>
            </div>
          </div>
          <p className="text-gray-600 text-base sm:text-lg">Streamline your executive workflow</p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100">
          {/* Mode Header */}
          <div className="mb-6">
            {mode === 'forgot-password' && (
              <button
                onClick={() => handleModeChange('signin')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 text-sm font-medium transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </button>
            )}
            
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {mode === 'signin' && 'Welcome Back'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot-password' && 'Reset Password'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {mode === 'signin' && 'Sign in to access your productivity dashboard'}
              {mode === 'signup' && 'Start managing your executive tasks efficiently'}
              {mode === 'forgot-password' && 'Enter your email to receive reset instructions'}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-green-800 text-sm">
                {successMessage}
              </div>
            </div>
          )}

          {/* Password Reset Success */}
          {resetEmailSent && mode === 'forgot-password' && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Check Your Email</span>
              </div>
              <p className="text-blue-700 text-sm mb-3">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <div className="text-blue-600 text-xs space-y-1">
                <p>• Check your spam folder if you don't see the email</p>
                <p>• The reset link will expire in 24 hours</p>
                <p>• You can request a new reset if needed</p>
              </div>
            </div>
          )}

          {/* Enhanced Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-red-600 mt-0.5">
                  {getErrorIcon((error as any)?.type)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-red-800 mb-1">
                    {(error as any)?.message || error}
                  </div>
                  {(error as any)?.details && (
                    <div className="text-red-700 text-sm mb-2">
                      {(error as any).details}
                    </div>
                  )}
                  {(error as any)?.suggestions && (error as any).suggestions.length > 0 && (
                    <div className="text-red-600 text-sm">
                      <p className="font-medium mb-1">💡 Try this:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {(error as any).suggestions.map((suggestion: string, index: number) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 sm:py-4 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-base touch-manipulation ${
                    validation.email.isValid && email ? 'border-green-300 focus:ring-green-500' :
                    !validation.email.isValid && email ? 'border-red-300 focus:ring-red-500' :
                    'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your email"
                  required
                />
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                {email && validation.email.isValid && (
                  <CheckCircle className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
                )}
              </div>
              {!validation.email.isValid && email && (
                <p className="text-red-600 text-sm mt-1">{validation.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            {mode !== 'forgot-password' && (
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      mode === 'signup' ? (
                        validation.password.isValid && password ? 'border-green-300 focus:ring-green-500' :
                        !validation.password.isValid && password ? 'border-red-300 focus:ring-red-500' :
                        'border-gray-300 focus:ring-blue-500'
                      ) : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Enter your password"
                    required
                    minLength={mode === 'signup' ? 8 : 1}
                  />
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password Strength Indicator for Signup */}
                {mode === 'signup' && password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${
                        passwordStrength <= 2 ? 'text-red-600' :
                        passwordStrength <= 3 ? 'text-yellow-600' :
                        passwordStrength <= 4 ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {getPasswordStrengthText(passwordStrength)}
                      </span>
                    </div>
                    
                    {!validation.password.isValid && (
                      <div className="text-red-600 text-sm space-y-1">
                        <p>{validation.password.message}</p>
                        {validation.password.suggestions.length > 0 && (
                          <div>
                            <p className="font-medium">💡 Suggestions:</p>
                            <ul className="list-disc list-inside">
                              {validation.password.suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Confirm Password Field */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      confirmPassword && password === confirmPassword ? 'border-green-300 focus:ring-green-500' :
                      confirmPassword && password !== confirmPassword ? 'border-red-300 focus:ring-red-500' :
                      'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Confirm your password"
                    required
                  />
                  <Shield className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {confirmPassword && password === confirmPassword && (
                    <CheckCircle className="absolute right-10 top-3.5 h-5 w-5 text-green-500" />
                  )}
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">Passwords do not match</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || (mode === 'signup' && (!validation.email.isValid || !validation.password.isValid || password !== confirmPassword))}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  {mode === 'signin' && <LogIn size={20} />}
                  {mode === 'signup' && <UserPlus size={20} />}
                  {mode === 'forgot-password' && <Mail size={20} />}
                  
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot-password' && 'Send Reset Email'}
                </>
              )}
            </button>
          </form>

          {/* Mode Switching */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => handleModeChange('forgot-password')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200"
                >
                  Forgot your password?
                </button>
                <div>
                  <button
                    onClick={() => handleModeChange('signup')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200"
                  >
                    Don't have an account? Sign up
                  </button>
                </div>
              </>
            )}
            
            {mode === 'signup' && (
              <button
                onClick={() => handleModeChange('signin')}
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200"
              >
                Already have an account? Sign in
              </button>
            )}

            {mode === 'forgot-password' && !resetEmailSent && (
              <div className="text-sm text-gray-600">
                Remember your password?{' '}
                <button
                  onClick={() => handleModeChange('signin')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>

          {/* Security Notice for Signup */}
          {mode === 'signup' && (
            <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Security Notice</span>
              </div>
              <p>Your password is encrypted and stored securely. We never share your personal information.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { AuthForm };