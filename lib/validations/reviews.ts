import { z } from 'zod'

export const CreateReviewDto = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  body: z.string().min(10, 'Avis requis (min 10 caractères)'),
  photos: z.array(z.string().url()).optional()
})

export const CreateQuestionDto = z.object({
  productId: z.string(),
  question: z.string().min(5, 'Question requise (min 5 caractères)')
})

export const AnswerQuestionDto = z.object({
  answer: z.string().min(5, 'Réponse requise (min 5 caractères)')
})
