import { z } from 'zod'

export const CreateOrderRequestDto = z.object({
  storeId: z.string(),
  source: z.string(),
  address: z.object({
    city: z.string(),
    street: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  })
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