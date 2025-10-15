import { z } from 'zod'

export const CreateAuctionDto = z.object({
  productId: z.string().optional(),
  storeId: z.string().optional(),
  title: z.string().min(3, 'Titre requis (min 3 caractères)'),
  description: z.string().optional(),
  category: z.string().optional(),
  startPrice: z.number().positive('Prix de départ requis'),
  reservePrice: z.number().positive('Prix de réserve doit être positif').optional(),
  minIncrement: z.number().positive('Incrément minimum requis'),
  startAt: z.string().datetime('Date de début invalide').optional(),
  endAt: z.string().datetime('Date de fin invalide'),
  duration: z.number().int().positive('Durée invalide').optional(),
  autoExtend: z.boolean().default(false),
  extendMinutes: z.number().int().positive('Minutes d\'extension invalides').default(5),
  status: z.enum(['SCHEDULED', 'RUNNING', 'ENDING_SOON', 'ENDED', 'ARCHIVED']).default('SCHEDULED')
})

export const UpdateAuctionDto = CreateAuctionDto.partial().omit({ storeId: true })

export const PlaceBidDto = z.object({
  amount: z.number().positive('Montant requis')
})

export const AutoBidDto = z.object({
  maxAmount: z.number().positive('Montant maximum requis')
})

export const AuctionListQuerySchema = z.object({
  status: z
    .enum(['live', 'ended', 'upcoming', 'ending_soon', 'all'])
    .default('live'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().trim().min(1).optional(),
  sort: z
    .enum(['ending_soon', 'newest', 'price_asc', 'price_desc', 'popular'])
    .default('ending_soon'),
  priceMin: z.coerce.number().nonnegative().default(0),
  priceMax: z.coerce.number().positive().default(999999),
  category: z.string().trim().optional(),
  storeId: z.string().optional()
})

export type AuctionListQuery = z.infer<typeof AuctionListQuerySchema>
