import { z } from 'zod'

export const AddToCartDto = z.object({
  productId: z.string().min(1, 'ID produit requis'),
  offerId: z.string().optional(), // Make offerId optional
  quantity: z.number().int('Quantité doit être un entier').positive('Quantité doit être positive').default(1)
})

export const UpdateCartItemDto = z.object({
  quantity: z.number().int('Quantité doit être un entier').positive('Quantité doit être positive')
})

export const CheckoutDto = z.object({
  addressId: z.string().min(1, 'Adresse requise'),
  paymentMethod: z.enum(['CARD', 'CASH_ON_DELIVERY', 'BANK_TRANSFER'], { 
    message: 'Méthode de paiement invalide'
  }),
  notes: z.string().optional()
})
