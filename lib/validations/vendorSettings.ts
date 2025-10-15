import { z } from 'zod'

// Business hours schema for a single day
const DayHoursDto = z.object({
  open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format horaire invalide (HH:MM)'),
  close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format horaire invalide (HH:MM)'),
  closed: z.boolean()
})

// Business hours for all days of the week
const BusinessHoursDto = z.object({
  monday: DayHoursDto,
  tuesday: DayHoursDto,
  wednesday: DayHoursDto,
  thursday: DayHoursDto,
  friday: DayHoursDto,
  saturday: DayHoursDto,
  sunday: DayHoursDto
})

// Address schema
const AddressDto = z.object({
  street: z.string().min(1, 'Rue requise'),
  city: z.string().min(1, 'Ville requise'),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().min(1, 'Pays requis')
})

// Preferences schema
const PreferencesDto = z.object({
  language: z.enum(['fr', 'ar', 'en'], { 
    message: 'Langue invalide'
  }),
  timezone: z.string().min(1, 'Fuseau horaire requis'),
  currency: z.string().length(3, 'Code devise invalide (3 caractères)')
})

// Email notification settings
const EmailNotificationsDto = z.object({
  newOrders: z.boolean(),
  lowStock: z.boolean(),
  newReviews: z.boolean(),
  supportTickets: z.boolean(),
  systemUpdates: z.boolean()
})

// Push notification settings
const PushNotificationsDto = z.object({
  newOrders: z.boolean(),
  urgentSupport: z.boolean(),
  systemAlerts: z.boolean()
})

// Store settings schema
export const StoreSettingsDto = z.object({
  storeName: z.string().min(1, 'Le nom de la boutique est requis').max(100, 'Nom trop long (max 100 caractères)').optional(),
  storeDescription: z.string().max(500, 'Description trop longue (max 500 caractères)').optional(),
  logo: z.string().url('URL de logo invalide').optional(),
  banner: z.string().url('URL de bannière invalide').optional(),
  businessHours: BusinessHoursDto.optional(),
  shippingPolicy: z.string().max(1000, 'Politique d\'expédition trop longue (max 1000 caractères)').optional(),
  returnPolicy: z.string().max(1000, 'Politique de retour trop longue (max 1000 caractères)').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TEMPORARILY_CLOSED'], { 
    message: 'Statut invalide'
  }).optional()
})

// Account settings schema
export const AccountSettingsDto = z.object({
  firstName: z.string().min(1, 'Le prénom est requis').max(50, 'Prénom trop long (max 50 caractères)').optional(),
  lastName: z.string().min(1, 'Le nom est requis').max(50, 'Nom trop long (max 50 caractères)').optional(),
  email: z.string().email('Email invalide').optional(),
  phone: z.string().max(32, 'Numéro de téléphone trop long (max 32 caractères)').optional(),
  businessEmail: z.string().email('Email professionnel invalide').optional(),
  businessPhone: z.string().max(32, 'Numéro de téléphone professionnel trop long (max 32 caractères)').optional(),
  address: AddressDto.optional(),
  preferences: PreferencesDto.optional()
})

// Notification settings schema
export const NotificationSettingsDto = z.object({
  email: EmailNotificationsDto.optional(),
  push: PushNotificationsDto.optional(),
  frequency: z.enum(['IMMEDIATE', 'HOURLY', 'DAILY', 'WEEKLY'], { 
    message: 'Fréquence invalide'
  }).optional()
})

export type StoreSettingsDtoType = z.infer<typeof StoreSettingsDto>
export type AccountSettingsDtoType = z.infer<typeof AccountSettingsDto>
export type NotificationSettingsDtoType = z.infer<typeof NotificationSettingsDto>
