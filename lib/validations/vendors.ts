import { z } from 'zod'

export const VendorApplicationDto = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(1, 'Le numéro de téléphone est requis'),
  businessName: z.string().min(1, 'Le nom de votre entreprise est requis'),
  businessType: z.string().min(1, 'Le type de votre entreprise est requis'),
  description: z.string().min(1, 'Une description de votre activité est requise'),
  acceptTerms: z.boolean().refine(val => val === true, 'Vous devez accepter les conditions')
})

export type VendorApplicationType = z.infer<typeof VendorApplicationDto>
