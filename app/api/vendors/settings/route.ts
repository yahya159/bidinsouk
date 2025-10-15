import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { 
  StoreSettingsDto, 
  AccountSettingsDto, 
  NotificationSettingsDto 
} from '@/lib/validations/vendorSettings';

// Default settings structure
const getDefaultSettings = () => ({
  store: {
    storeName: 'Ma Boutique',
    storeDescription: 'Description de ma boutique',
    logo: '',
    banner: '',
    businessHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true },
    },
    shippingPolicy: 'Livraison gratuite pour les commandes de plus de 500 MAD.',
    returnPolicy: 'Retours acceptés dans les 30 jours.',
    status: 'ACTIVE' as const,
  },
  account: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+212 6 12 34 56 78',
    businessEmail: 'contact@maboutique.com',
    businessPhone: '+212 5 22 12 34 56',
    address: {
      street: '123 Rue Mohammed V',
      city: 'Casablanca',
      state: 'Grand Casablanca',
      zipCode: '20000',
      country: 'Maroc',
    },
    preferences: {
      language: 'fr',
      timezone: 'Africa/Casablanca',
      currency: 'MAD',
    },
  },
  notifications: {
    email: {
      newOrders: true,
      lowStock: true,
      newReviews: true,
      supportTickets: true,
      systemUpdates: false,
    },
    push: {
      newOrders: true,
      urgentSupport: true,
      systemAlerts: true,
    },
    frequency: 'IMMEDIATE' as const,
  },
});

// GET /api/vendors/settings - Get all settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    // Get user ID for database operations
    const userId = BigInt(session.user.id);

    try {
      // Find user with vendor profile
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          vendor: {
            include: {
              stores: true
            }
          }
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }

      // Check if vendor profile exists
      const vendor = user.vendor;
      if (!vendor) {
        return NextResponse.json(
          { 
            error: 'Vendor profile required',
            message: 'Please complete vendor application first'
          },
          { status: 403 }
        );
      }

      // Check if vendor has at least one active store
      const activeStore = vendor.stores.find(s => s.status === 'ACTIVE');
      if (!activeStore) {
        return NextResponse.json(
          { 
            error: 'Active store required',
            message: 'Please create and get approval for a store first'
          },
          { status: 403 }
        );
      }

      // Get settings from user's active store
      const store = activeStore;
      let settings = getDefaultSettings();

      if (store) {
        // Load settings from store data
        settings.store.storeName = store.name;
        settings.account.email = user.email;
        settings.account.firstName = user.name.split(' ')[0] || 'John';
        settings.account.lastName = user.name.split(' ')[1] || 'Doe';
        
        // Load additional settings from store JSON fields if they exist
        if (store.seo) {
          const seoData = store.seo as any;
          if (seoData.storeSettings) {
            settings.store = { ...settings.store, ...seoData.storeSettings };
          }
          if (seoData.accountSettings) {
            settings.account = { ...settings.account, ...seoData.accountSettings };
          }
          if (seoData.notificationSettings) {
            settings.notifications = { ...settings.notifications, ...seoData.notificationSettings };
          }
        }
      }

      if (section) {
        // Return specific section
        if (section in settings) {
          return NextResponse.json({
            [section]: settings[section as keyof typeof settings]
          });
        } else {
          return NextResponse.json({ error: 'Section non trouvée' }, { status: 404 });
        }
      }

      // Return all settings
      return NextResponse.json(settings);

    } catch (dbError) {
      console.error('Database error:', dbError);
      // Fallback to default settings if database fails
      const defaultSettings = getDefaultSettings();
      
      if (section) {
        return NextResponse.json({
          [section]: defaultSettings[section as keyof typeof defaultSettings]
        });
      }
      
      return NextResponse.json(defaultSettings);
    }

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/vendors/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session?.user?.role !== 'VENDOR' && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { error: 'Section et données requises' },
        { status: 400 }
      );
    }

    let validatedData;

    // Validate based on section
    switch (section) {
      case 'store':
        validatedData = StoreSettingsDto.parse(data);
        break;
      case 'account':
        validatedData = AccountSettingsDto.parse(data);
        break;
      case 'notifications':
        validatedData = NotificationSettingsDto.parse(data);
        break;
      default:
        return NextResponse.json(
          { error: 'Section invalide' },
          { status: 400 }
        );
    }

    // Get user ID for database operations
    const userId = BigInt(session.user.id);

    try {
      // Find user with vendor profile
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          vendor: {
            include: {
              stores: true
            }
          }
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }

      // Check if vendor profile exists
      const vendor = user.vendor;
      if (!vendor) {
        return NextResponse.json(
          { 
            error: 'Vendor profile required',
            message: 'Please complete vendor application first'
          },
          { status: 403 }
        );
      }

      // Check if vendor has at least one active store
      const activeStore = vendor.stores.find(s => s.status === 'ACTIVE');
      if (!activeStore) {
        return NextResponse.json(
          { 
            error: 'Active store required',
            message: 'Please create and get approval for a store first'
          },
          { status: 403 }
        );
      }

      const store = activeStore;
      
      // Get current settings
      let currentSeo = store.seo as any || {};
      
      // Update the specific section
      currentSeo[`${section}Settings`] = validatedData;
      
      // Also update basic store/user info if needed
      let updateData: any = {
        seo: currentSeo
      };

      if (section === 'store') {
        const storeSettings = validatedData as z.infer<typeof StoreSettingsDto>;
        if (storeSettings.storeName !== undefined) {
          updateData.name = storeSettings.storeName || store.name;
        }
      }

      if (section === 'account') {
        // Update user info
        await prisma.user.update({
          where: { id: userId },
          data: {
            name: user.name,
            email: user.email,
            phone: user.phone || '',
          }
        });
      }

      // Update store with settings
      await prisma.store.update({
        where: { id: store.id },
        data: updateData
      });

      return NextResponse.json({
        message: 'Paramètres mis à jour avec succès',
        [section]: validatedData,
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        error: 'Erreur lors de la sauvegarde en base de données',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error updating settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
