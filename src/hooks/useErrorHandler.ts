
import { useState, useCallback } from 'react';

interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
  details?: any;
}

export const useErrorHandler = () => {
  const [error, setError] = useState<ErrorState | null>(null);

  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    setError({
      message: errorMessage,
      type: 'error',
      details: error
    });
  }, []);

  const handleWarning = useCallback((message: string, details?: any) => {
    console.warn('Warning:', message, details);
    setError({
      message,
      type: 'warning',
      details
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryableError = useCallback((error: any, retryFn: () => void, context?: string) => {
    handleError(error, context);
    // Could add retry logic here in the future
  }, [handleError]);

  return {
    error,
    handleError,
    handleWarning,
    clearError,
    retryableError
  };
};
