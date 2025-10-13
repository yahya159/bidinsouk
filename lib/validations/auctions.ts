import { z } from 'zod'

export const CreateAuctionDto = z.object({
  category: z.string().min(1, 'La catégorie est requise'), // Rendre category obligatoire
  storeId: z.string().optional(), // Rendre storeId facultatif
  title: z.string().min(3),
  description: z.string().optional(),
  startPrice: z.number().positive('Prix de départ requis'),
  reservePrice: z.number().min(0).optional().nullable(),
  minIncrement: z.number().positive('Incrément minimum requis'),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime()
})

export const UpdateAuctionDto = CreateAuctionDto.partial().omit({ storeId: true })

export const PlaceBidDto = z.object({
  amount: z.number().positive('Montant requis')
})

export const AutoBidDto = z.object({
  maxAmount: z.number().positive('Montant maximum requis')
})