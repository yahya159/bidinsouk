'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PostMessageDto } from '@/lib/validations/messages'
import { pusherClient } from '@/lib/realtime/pusher'
import { Button, TextInput, Text, Stack, Group, Box, Paper } from '@mantine/core'
import { notifications } from '@mantine/notifications'

interface Message {
  id: number
  body: string
  author: {
    id: number
    name: string
  }
  createdAt: Date
}

interface ChatProps {
  threadId: number
  initialMessages: Message[]
  currentUserId: number
}

export default function Chat({ threadId, initialMessages, currentUserId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(PostMessageDto),
  })
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  useEffect(() => {
    // Subscribe to Pusher events
    const channel = pusherClient.subscribe(`thread-${threadId}`)
    
    channel.bind('message:new', (data: any) => {
      setMessages(prev => [...prev, data.message])
    })
    
    return () => {
      channel.unbind('message:new')
      pusherClient.unsubscribe(`thread-${threadId}`)
    }
  }, [threadId])
  
  const onSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      reset()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to send message',
        color: 'red',
      })
      console.error('Failed to send message:', error)
    }
  }
  
  return (
    <Stack h="100%" gap={0}>
      <Box style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <Stack gap="md">
          {messages.map((message) => (
            <Group
              key={message.id}
              justify={message.author.id === currentUserId ? 'flex-end' : 'flex-start'}
            >
              <Paper
                p="sm"
                radius="md"
                style={{
                  maxWidth: '70%',
                  backgroundColor: message.author.id === currentUserId ? '#228be6' : '#e9ecef',
                  color: message.author.id === currentUserId ? 'white' : '#212529',
                }}
              >
                <Text size="sm" fw={600}>
                  {message.author.id === currentUserId ? 'You' : message.author.name}
                </Text>
                <Text size="sm" mt={4}>{message.body}</Text>
                <Text size="xs" opacity={0.7} mt={4}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </Paper>
            </Group>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
      </Box>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Group gap="xs" p="md" style={{ borderTop: '1px solid #dee2e6' }}>
          <TextInput
            placeholder="Type a message..."
            {...register('body')}
            error={errors.body?.message as string}
            style={{ flex: 1 }}
          />
          <Button type="submit">Send</Button>
        </Group>
      </form>
    </Stack>
  )
}