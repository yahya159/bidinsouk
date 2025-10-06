import { z } from 'zod'

export const PlaceBidDto = z.object({
  amount: z.number().positive()
})

export type PlaceBidDtoType = z.infer<typeof PlaceBidDto>