import { useState, useCallback } from 'react';

interface ErrorState {
  error: string | null;
  isLoading: boolean;
}

export function useErrorHandler() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false
  });

  const handleAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    setErrorState({ error: null, isLoading: true });
    
    try {
      const result = await asyncFn();
      setErrorState({ error: null, isLoading: false });
      return result;
    } catch (error) {
      const message = errorMessage || 
        (error instanceof Error ? error.message : 'An unexpected error occurred');
      
      setErrorState({ error: message, isLoading: false });
      // console.error('Error in async operation:', error);
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(prev => ({ ...prev, error: null }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setErrorState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  return {
    error: errorState.error,
    isLoading: errorState.isLoading,
    handleAsync,
    clearError,
    setLoading
  };
}