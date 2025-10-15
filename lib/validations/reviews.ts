import { z } from 'zod'

export const CreateReviewDto = z.object({
  productId: z.string(),
  rating: z.number().int('Note doit être un entier').min(1, 'Note minimum: 1').max(5, 'Note maximum: 5'),
  body: z.string().min(10, 'Avis requis (min 10 caractères)'),
  photos: z.array(z.string().url('URL de photo invalide')).optional(),
  verified: z.boolean().default(false),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING')
})

export const CreateQuestionDto = z.object({
  productId: z.string(),
  question: z.string().min(5, 'Question requise (min 5 caractères)')
})

export const AnswerQuestionDto = z.object({
  answer: z.string().min(5, 'Réponse requise (min 5 caractères)')
})
