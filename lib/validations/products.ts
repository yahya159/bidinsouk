import { z } from 'zod'

export const CreateProductDto = z.object({
  storeId: z.string(),
  title: z.string().min(3, 'Titre requis (min 3 caractères)'),
  description: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  condition: z.enum(['NEW', 'USED']).default('USED'),
  images: z.array(z.string().url()).optional(),
  attributes: z.record(z.any()).optional()
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
