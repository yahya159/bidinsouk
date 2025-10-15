'use client';

import { useEffect, useState, useCallback } from 'react';
import { Modal, Text, Button, Group, Progress } from '@mantine/core';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SessionTimeoutHandlerProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
}

export function SessionTimeoutHandler({
  timeoutMinutes = 60,
  warningMinutes = 5,
}: SessionTimeoutHandlerProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(warningMinutes * 60);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningMinutes * 60 * 1000;

  const handleLogout = useCallback(async () => {
    try {
      // Log session expiration
      await fetch('/api/admin/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADMIN_SESSION_EXPIRED',
          entity: 'Session',
          entityId: session?.user?.id || '0',
          metadata: { reason: 'timeout' },
        }),
      });
    } catch (error) {
      console.error('Failed to log session expiration:', error);
    }

    await signOut({ redirect: false });
    router.push('/login?session=expired');
  }, [session, router]);

  const extendSession = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
    setTimeLeft(warningMinutes * 60);
  }, [warningMinutes]);

  // Track user activity
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;

    const handleActivity = () => {
      setLastActivity(Date.now());
      if (showWarning) {
        setShowWarning(false);
        setTimeLeft(warningMinutes * 60);
      }
    };

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [status, session, showWarning, warningMinutes]);

  // Check for timeout
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;

    const interval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      const timeUntilTimeout = timeoutMs - timeSinceActivity;

      // Show warning
      if (timeUntilTimeout <= warningMs && timeUntilTimeout > 0 && !showWarning) {
        setShowWarning(true);
        setTimeLeft(Math.floor(timeUntilTimeout / 1000));
      }

      // Auto logout
      if (timeUntilTimeout <= 0) {
        handleLogout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, session, lastActivity, timeoutMs, warningMs, showWarning, handleLogout]);

  // Countdown timer when warning is shown
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning, handleLogout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressValue = (timeLeft / (warningMinutes * 60)) * 100;

  return (
    <Modal
      opened={showWarning}
      onClose={() => {}}
      title="Session Timeout Warning"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      centered
    >
      <Text size="sm" mb="md">
        Your session will expire due to inactivity. You will be automatically logged out in:
      </Text>

      <Text size="xl" fw={700} ta="center" mb="md" c="red">
        {formatTime(timeLeft)}
      </Text>

      <Progress value={progressValue} color="red" size="lg" mb="xl" animated />

      <Group justify="space-between">
        <Button variant="default" onClick={handleLogout}>
          Logout Now
        </Button>
        <Button onClick={extendSession}>Stay Logged In</Button>
      </Group>
    </Modal>
  );
}
