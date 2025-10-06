'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PostMessageDto } from '@/lib/validations/messages'
import { pusherClient } from '@/lib/realtime/pusher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
      console.error('Failed to send message:', error)
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.author.id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.author.id === currentUserId
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <div className="font-semibold text-sm">
                  {message.author.id === currentUserId ? 'You' : message.author.name}
                </div>
                <div className="mt-1">{message.body}</div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Type a message..."
            {...register('body')}
          />
          {errors.body && (
            <p className="text-red-500 text-sm mt-1">{errors.body.message}</p>
          )}
          <Button type="submit">Send</Button>
        </div>
      </form>
    </div>
  )
}