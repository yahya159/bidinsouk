import { useEffect, useState, useRef } from 'react';

// Note: Install pusher-js first: npm install pusher-js
// import Pusher from 'pusher-js';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}

export function useMessagesRealtime(threadId: string, currentUserId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Uncomment when Pusher is installed and configured
    /*
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });

    const channel = pusher.subscribe(`thread-${threadId}`);

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
      console.log(`✅ Subscribed to thread-${threadId}`);
    });

    channel.bind('new-message', (data: { message: Message }) => {
      setMessages(prev => [...prev, data.message]);

      // Auto-scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);

      // Show browser notification if tab not focused
      if (document.hidden && data.message.senderId !== currentUserId) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Nouveau message', {
            body: `${data.message.senderName}: ${data.message.content}`,
            icon: '/icon.png',
          });
        }
      }
    });

    channel.bind('typing', (data: { userId: string; userName: string }) => {
      if (data.userId !== currentUserId) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userName)) {
            return [...prev, data.userName];
          }
          return prev;
        });

        // Clear after 3 seconds
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers(prev => prev.filter(name => name !== data.userName));
          typingTimeoutRef.current = null;
        }, 3000);
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setIsConnected(false);
    };
    */

    // Mock connection for development
    setIsConnected(false);
    console.log('⚠️ Pusher not configured. Install pusher-js and uncomment code.');
  }, [threadId, currentUserId]);

  const sendTypingIndicator = () => {
    // Uncomment when Pusher is configured
    /*
    fetch('/api/pusher/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: `thread-${threadId}`,
        event: 'typing',
        data: { userId: currentUserId },
      }),
    });
    */
  };

  return { 
    messages, 
    typingUsers, 
    scrollRef, 
    sendTypingIndicator,
    isConnected
  };
}

