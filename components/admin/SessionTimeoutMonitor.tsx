'use client';

import { useEffect, useState } from 'react';
import { Modal, Button, Text, Group, Progress } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { SessionTimeoutHandler } from '@/lib/admin/permissions';

interface SessionTimeoutMonitorProps {
  /**
   * Session timeout in milliseconds
   * Default: 1 hour (3600000ms)
   */
  timeout?: number;
  
  /**
   * Warning threshold in milliseconds before timeout
   * Default: 5 minutes (300000ms)
   */
  warningThreshold?: number;
}

export function SessionTimeoutMonitor({
  timeout = 3600000,
  warningThreshold = 300000,
}: SessionTimeoutMonitorProps) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeout);

  useEffect(() => {
    // Initialize session tracking
    SessionTimeoutHandler.initialize();

    // Check for timeout periodically
    const checkInterval = setInterval(() => {
      if (SessionTimeoutHandler.isExpired()) {
        handleTimeout();
      } else if (SessionTimeoutHandler.isNearExpiry()) {
        const lastActivity = SessionTimeoutHandler.getLastActivity();
        const remaining = timeout - (Date.now() - lastActivity);
        setTimeRemaining(remaining);
        setShowWarning(true);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(checkInterval);
    };
  }, [timeout]);

  const handleTimeout = async () => {
    SessionTimeoutHandler.clear();
    await signOut({ redirect: false });
    router.push('/login?reason=session_expired');
  };

  const handleExtendSession = () => {
    SessionTimeoutHandler.updateActivity();
    setShowWarning(false);
    setTimeRemaining(timeout);
  };

  const handleLogout = async () => {
    SessionTimeoutHandler.clear();
    await signOut({ redirect: false });
    router.push('/login');
  };

  const progressValue = (timeRemaining / warningThreshold) * 100;
  const minutesRemaining = Math.ceil(timeRemaining / 60000);

  return (
    <Modal
      opened={showWarning}
      onClose={() => setShowWarning(false)}
      title="Session Expiring Soon"
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <Text size="sm" mb="md">
        Your session will expire in approximately {minutesRemaining} minute
        {minutesRemaining !== 1 ? 's' : ''} due to inactivity.
      </Text>
      
      <Progress
        value={progressValue}
        color={progressValue > 50 ? 'blue' : progressValue > 25 ? 'yellow' : 'red'}
        size="sm"
        mb="lg"
      />

      <Group justify="flex-end">
        <Button variant="outline" onClick={handleLogout}>
          Logout Now
        </Button>
        <Button onClick={handleExtendSession}>
          Continue Session
        </Button>
      </Group>
    </Modal>
  );
}
