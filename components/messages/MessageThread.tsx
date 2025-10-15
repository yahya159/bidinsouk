'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Box, 
  Paper, 
  TextInput, 
  Button, 
  Stack, 
  Group, 
  Text,
  Avatar,
  Loader,
  Center
} from '@mantine/core'
import { IconSend } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useSession } from 'next-auth/react'

interface Message {
  id: string
  content: string
  senderId: string
  isSystem: boolean
  createdAt: string
  sender: {
    id: string
    name: string
    image?: string
  }
}

interface MessageThreadProps {
  threadId: string
}

export function MessageThread({ threadId }: MessageThreadProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
  }, [threadId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/messages/threads/${threadId}`)
      if (!response.ok) throw new Error('Failed to load messages')
      
      const { thread } = await response.json()
      setMessages(thread.messages)
    } catch (error) {
      console.error('Error loading messages:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load messages',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      setSending(true)
      const response = await fetch(`/api/messages/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const { message } = await response.json()
      setMessages(prev => [...prev, message])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to send message',
        color: 'red'
      })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    )
  }

  return (
    <Stack gap="md" h="100%">
      <Paper 
        p="md" 
        style={{ 
          flex: 1, 
          overflowY: 'auto',
          maxHeight: '500px'
        }}
      >
        <Stack gap="sm">
          {messages.map((message) => {
            const isOwn = message.senderId === session?.user?.id
            const isSystem = message.isSystem

            return (
              <Group
                key={message.id}
                justify={isSystem ? 'center' : isOwn ? 'flex-end' : 'flex-start'}
                gap="xs"
              >
                {!isOwn && !isSystem && (
                  <Avatar 
                    alt={message.sender.name}
                    size="sm"
                  >
                    {message.sender.name.charAt(0)}
                  </Avatar>
                )}
                
                <Paper
                  p="xs"
                  bg={isSystem ? 'gray.1' : isOwn ? 'blue.1' : 'gray.0'}
                  style={{ maxWidth: '70%' }}
                >
                  {!isSystem && !isOwn && (
                    <Text size="xs" c="dimmed" mb={4}>
                      {message.sender.name}
                    </Text>
                  )}
                  <Text size="sm">{message.content}</Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </Text>
                </Paper>

                {isOwn && !isSystem && (
                  <Avatar 
                    alt={session?.user?.name || ''}
                    size="sm"
                  >
                    {session?.user?.name?.charAt(0) || 'U'}
                  </Avatar>
                )}
              </Group>
            )
          })}
          <div ref={messagesEndRef} />
        </Stack>
      </Paper>

      <Group gap="xs">
        <TextInput
          flex={1}
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={sending}
        />
        <Button
          onClick={sendMessage}
          loading={sending}
          disabled={!newMessage.trim()}
        >
          <IconSend size={18} />
        </Button>
      </Group>
    </Stack>
  )
}
