import { toast } from 'sonner';

export function useErrorHandler() {
  const handleError = (error: Error | unknown, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const contextMessage = context ? `${context}: ` : '';
    
    console.error(`${contextMessage}${errorMessage}`, error);
    
    toast.error(errorMessage, {
      description: 'Please try again or contact support if the problem persists.',
      duration: 5000,
    });
  };

  return { handleError };
}