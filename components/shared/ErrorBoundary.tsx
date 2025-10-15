'use client';

import { Component, ReactNode } from 'react';
import { Alert, Button, Stack, Text, Title, Container } from '@mantine/core';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to error reporting service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container size="sm" py="xl">
          <Alert 
            icon={<AlertTriangle size={24} />} 
            color="red" 
            title="Une erreur est survenue"
            variant="filled"
          >
            <Stack gap="md" mt="md">
              <div>
                <Text size="sm" fw={500} mb="xs">
                  Détails de l'erreur:
                </Text>
                <Text size="sm" opacity={0.9}>
                  {this.state.error?.message || 'Une erreur inattendue s\'est produite'}
                </Text>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <div>
                  <Text size="xs" fw={500} mb="xs">
                    Stack trace:
                  </Text>
                  <pre style={{ 
                    fontSize: '10px', 
                    overflow: 'auto', 
                    padding: '8px',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                  }}>
                    {this.state.error.stack}
                  </pre>
                </div>
              )}

              <Button 
                variant="white"
                leftSection={<RefreshCw size={16} />}
                onClick={this.handleReset}
              >
                Réessayer
              </Button>
            </Stack>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

