import { z } from 'zod'

export const CreateProductDto = z.object({
  storeId: z.string(),
  title: z.string().min(3, 'Titre requis (min 3 caractères)').max(255, 'Titre trop long (max 255 caractères)'),
  description: z.string().optional(),
  brand: z.string().max(100, 'Marque trop longue (max 100 caractères)').optional(),
  category: z.string().max(100, 'Catégorie trop longue (max 100 caractères)').optional(),
  condition: z.enum(['NEW', 'USED']).default('USED'),
  images: z.array(z.string().url()).optional(),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
})

export const UpdateProductDto = CreateProductDto.partial().omit({ storeId: true })

export const ProductFilterDto = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  condition: z.enum(['NEW', 'USED']).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  storeId: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  page: z.number().default(1),
  limit: z.number().default(20)
})

export const ProductListQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  category: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  condition: z.enum(['NEW', 'USED']).optional(),
  priceMin: z.coerce.number().nonnegative().default(0),
  priceMax: z.coerce.number().positive().default(999999),
  inStock: z.enum(['0', '1']).optional(),
  sort: z
    .enum(['newest', 'price_asc', 'price_desc', 'popular', 'rating'])
    .default('newest'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  storeId: z.string().optional()
})

export type ProductListQuery = z.infer<typeof ProductListQuerySchema>
