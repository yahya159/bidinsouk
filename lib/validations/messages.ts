import { z } from 'zod'

export const CreateThreadDto = z.object({
  title: z.string().optional(),
  participants: z.array(z.string()) // Array of user IDs as strings
})

export const PostMessageDto = z.object({
  body: z.string().min(1, 'Message body is required'),
  attachments: z.any().optional()
})

export type CreateThreadDtoType = z.infer<typeof CreateThreadDto>
export type PostMessageDtoType = z.infer<typeof PostMessageDto>