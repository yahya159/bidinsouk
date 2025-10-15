import { z } from 'zod'

export const CreateOrderRequestDto = z.object({
  storeId: z.string(),
  source: z.enum(['BUY_NOW', 'AUCTION_CLAIM'], { 
    message: 'Source invalide'
  }),
  address: z.object({
    city: z.string().min(1, 'Ville requise'),
    street: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }),
  notes: z.string().optional(),
  status: z.enum(['REQUESTED', 'SELLER_ACCEPTED', 'SELLER_REFUSED', 'EXPIRED', 'CONVERTED']).default('REQUESTED')
})

export const AcceptOrderRequestDto = z.object({
  id: z.string()
})

export const RefuseOrderRequestDto = z.object({
  id: z.string(),
  reason: z.string().optional()
})

export type CreateOrderRequestDtoType = z.infer<typeof CreateOrderRequestDto>
export type AcceptOrderRequestDtoType = z.infer<typeof AcceptOrderRequestDto>
export type RefuseOrderRequestDtoType = z.infer<typeof RefuseOrderRequestDto>
