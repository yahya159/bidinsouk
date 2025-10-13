'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useMessageCounts } from '@/hooks/useMessageCounts';

interface MessageCountsContextType {
  counts: {
    support: number;
    messages: number;
    total: number;
  };
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const MessageCountsContext = createContext<MessageCountsContextType | undefined>(undefined);

export function MessageCountsProvider({ children }: { children: React.ReactNode }) {
  const messageCounts = useMessageCounts();

  const contextValue: MessageCountsContextType = {
    counts: messageCounts.counts,
    loading: messageCounts.loading,
    error: messageCounts.error,
    refresh: messageCounts.refresh
  };

  return (
    <MessageCountsContext.Provider value={contextValue}>
      {children}
    </MessageCountsContext.Provider>
  );
}

export function useMessageCountsContext() {
  const context = useContext(MessageCountsContext);
  if (context === undefined) {
    throw new Error('useMessageCountsContext must be used within a MessageCountsProvider');
  }
  return context;
}

// Hook for refreshing message counts from anywhere in the app
export function useRefreshMessageCounts() {
  const context = useContext(MessageCountsContext);
  return context?.refresh || (() => {});
}