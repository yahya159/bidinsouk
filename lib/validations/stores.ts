import { z } from 'zod'

export const CreateStoreDto = z.object({
  name: z.string().min(2, 'Nom de boutique requis'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug invalide'),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.object({
    city: z.string(),
    address: z.string().optional(),
    postalCode: z.string().optional()
  }).optional()
})

export const UpdateStoreDto = CreateStoreDto.partial().omit({ slug: true })
