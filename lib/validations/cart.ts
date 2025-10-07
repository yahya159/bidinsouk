import { z } from 'zod'

export const AddToCartDto = z.object({
  productId: z.string(),
  offerId: z.string(),
  quantity: z.number().int().positive().default(1)
})

export const UpdateCartItemDto = z.object({
  quantity: z.number().int().positive()
})

export const CheckoutDto = z.object({
  addressId: z.string(),
  paymentMethod: z.enum(['CARD', 'CASH_ON_DELIVERY', 'BANK_TRANSFER']),
  notes: z.string().optional()
})
