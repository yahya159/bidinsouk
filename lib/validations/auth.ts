import { z } from 'zod'

export const RegisterDto = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(2, 'Nom requis (min 2 caractères)'),
  password: z.string().min(4, 'Mot de passe requis (min 4 caractères)'),
  phone: z.string().optional(),
  locale: z.enum(['fr', 'ar']).default('fr'),
  acceptTerms: z.boolean().optional().default(true)
})

export const LoginDto = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis')
})

export const VerifyEmailDto = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Code à 6 chiffres requis')
})

export const ForgotPasswordDto = z.object({
  email: z.string().email('Email invalide')
})

export const ResetPasswordDto = z.object({
  token: z.string(),
  password: z.string().min(4, 'Mot de passe requis (min 4 caractères)')
})

export const UpdateProfileDto = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caractères)').optional(),
  phone: z.string().max(32, 'Numéro de téléphone trop long (max 32 caractères)').optional(),
  avatarUrl: z.string().url('URL invalide').max(512, 'URL trop longue (max 512 caractères)').optional(),
  locale: z.enum(['fr', 'ar'], { 
    message: 'Langue invalide'
  }).optional()
})

export const AddressDto = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2),
  phone: z.string(),
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().optional(),
  country: z.string().default('MA'),
  isDefault: z.boolean().default(false)
})
