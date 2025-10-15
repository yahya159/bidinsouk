import { z } from 'zod'

export const CreateStoreDto = z.object({
  name: z.string().min(2, 'Nom de boutique requis'),
  slug: z.string().min(2, 'Slug requis (min 2 caractères)').regex(/^[a-z0-9-]+$/, 'Slug invalide (lettres minuscules, chiffres et tirets uniquement)'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  address: z.object({
    city: z.string().min(1, 'Ville requise'),
    address: z.string().optional(),
    postalCode: z.string().optional()
  }).optional(),
  socials: z.record(z.string(), z.string().url('URL invalide')).optional(),
  seo: z.record(z.string(), z.string()).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING']).default('ACTIVE')
})

export const UpdateStoreDto = CreateStoreDto.partial().omit({ slug: true })
