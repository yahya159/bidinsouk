'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@mantine/core';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { SessionTimeoutHandler } from '../security/SessionTimeoutHandler';
import { KeyboardShortcuts } from '../shared/KeyboardShortcuts';
import { KeyboardShortcutsHelp } from '../shared/KeyboardShortcutsHelp';

interface AdminLayoutShellProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AdminLayoutShell({ children, user }: AdminLayoutShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [helpOpened, setHelpOpened] = useState(false);

  // Load sidebar preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    if (saved) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save sidebar preference to localStorage
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <>
      <SessionTimeoutHandler timeoutMinutes={60} warningMinutes={5} />
      <KeyboardShortcuts onShowHelp={() => setHelpOpened(true)} />
      <KeyboardShortcutsHelp opened={helpOpened} onClose={() => setHelpOpened(false)} />
      <AppShell
        header={{ height: 64 }}
        navbar={{
          width: sidebarCollapsed ? 84 : 280,
          breakpoint: 'md',
        }}
        padding={0}
        styles={{
          main: {
            backgroundColor: '#f8fafc',
          },
        }}
      >
        <AppShell.Header style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
          <AdminHeader user={user} />
        </AppShell.Header>

        <AppShell.Navbar style={{ backgroundColor: '#1e293b', borderRight: '1px solid #334155' }}>
          <AdminSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </AppShell.Navbar>

        <AppShell.Main>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 'calc(100vh - 64px)',
              padding: '2rem',
            }}
          >
            <div style={{ flex: 1 }}>{children}</div>
          </div>
        </AppShell.Main>
      </AppShell>
    </>
  );
}
