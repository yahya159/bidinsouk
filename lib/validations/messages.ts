import { z } from 'zod'

export const CreateThreadDto = z.object({
  title: z.string().optional(),
  participants: z.array(z.string()) // Array of user IDs as strings
})

export const MessageAttachmentDto = z.object({
  filename: z.string().min(1, 'Nom de fichier requis'),
  url: z.string().url('URL invalide'),
  size: z.number().int().positive('Taille de fichier invalide'),
  mimeType: z.string().min(1, 'Type MIME requis')
})

export const PostMessageDto = z.object({
  body: z.string().min(1, 'Message body is required'),
  attachments: z.array(MessageAttachmentDto).optional()
})

export type CreateThreadDtoType = z.infer<typeof CreateThreadDto>
export type PostMessageDtoType = z.infer<typeof PostMessageDto>
export type MessageAttachmentDtoType = z.infer<typeof MessageAttachmentDto>
