import React from 'react';
import { Target } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-blue-600 border-t-transparent rounded-full animate-spin`} />
      {message && (
        <p className="mt-3 text-sm text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );
};

export const LoadingPage: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SimplyTask</h1>
          <LoadingSpinner size="lg" message={message} />
        </div>
      </div>
    </div>
  );
};