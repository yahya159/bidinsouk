'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Stack, Text, Code, Container } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to activity log
    this.logErrorToActivityLog(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  async logErrorToActivityLog(error: Error, errorInfo: ErrorInfo) {
    try {
      await fetch('/api/admin/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADMIN_ERROR',
          entity: 'ErrorBoundary',
          entityId: '0',
          metadata: {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
          },
        }),
      });
    } catch (logError) {
      console.error('Failed to log error to activity log:', logError);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container size="md" py="xl">
          <Stack gap="lg">
            <Alert
              icon={<IconAlertCircle size={24} />}
              title="Something went wrong"
              color="red"
              variant="filled"
            >
              <Text size="sm">
                An unexpected error occurred in the admin dashboard. The error has been logged and
                our team has been notified.
              </Text>
            </Alert>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Stack gap="sm">
                <Text fw={600} size="sm">
                  Error Details (Development Only):
                </Text>
                <Code block>{this.state.error.toString()}</Code>
                {this.state.error.stack && (
                  <Code block style={{ fontSize: '0.75rem', maxHeight: '300px', overflow: 'auto' }}>
                    {this.state.error.stack}
                  </Code>
                )}
              </Stack>
            )}

            <Stack gap="sm">
              <Text size="sm" c="dimmed">
                You can try the following actions:
              </Text>
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={this.handleReset}
                variant="light"
              >
                Try Again
              </Button>
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={this.handleReload}
                variant="default"
              >
                Reload Page
              </Button>
              <Button
                component="a"
                href="/admin-dashboard"
                variant="default"
              >
                Go to Dashboard
              </Button>
            </Stack>
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}
