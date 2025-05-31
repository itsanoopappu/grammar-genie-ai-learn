
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  showRetry = true 
}) => {
  return (
    <div className="text-center p-4">
      <div className="flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-red-500 mr-2" />
        <span className="text-red-500 font-medium">Error</span>
      </div>
      <p className="text-red-500 mb-4">{error}</p>
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorDisplay;
