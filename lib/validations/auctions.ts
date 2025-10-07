import { z } from 'zod'

export const CreateAuctionDto = z.object({
  productId: z.string(),
  storeId: z.string(),
  title: z.string().min(3),
  description: z.string().optional(),
  startPrice: z.number().positive('Prix de départ requis'),
  reservePrice: z.number().positive().optional(),
  minIncrement: z.number().positive('Incrément minimum requis'),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime()
})

export const UpdateAuctionDto = CreateAuctionDto.partial().omit({ productId: true, storeId: true })

export const PlaceBidDto = z.object({
  amount: z.number().positive('Montant requis')
})

export const AutoBidDto = z.object({
  maxAmount: z.number().positive('Montant maximum requis')
})
