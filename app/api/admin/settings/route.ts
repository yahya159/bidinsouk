import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin/permissions';
import { ActivityLogger } from '@/lib/admin/activity-logger';

// Default settings structure
const DEFAULT_SETTINGS = {
  auction: {
    defaultDuration: 7, // days
    minIncrement: 1.0,
    autoExtendEnabled: true,
    autoExtendMinutes: 5,
    reservePriceRequired: false,
    commissionRate: 10, // percentage
  },
  user: {
    emailVerificationRequired: true,
    phoneVerificationRequired: false,
    autoApproveVendors: false,
    maxStoresPerVendor: 5,
    allowGuestCheckout: false,
  },
  payment: {
    platformFeeRate: 2.5, // percentage
    vendorCommissionRate: 10, // percentage
    minOrderAmount: 10.0,
    refundWindowDays: 14,
    paymentMethods: ['card', 'paypal'],
  },
  general: {
    siteName: 'Marketplace',
    supportEmail: 'support@marketplace.com',
    maintenanceMode: false,
    allowNewRegistrations: true,
    defaultLocale: 'fr',
    availableLocales: ['en', 'fr', 'ar'],
  },
};

// GET /api/admin/settings - Fetch all settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all settings from database
    const settings = await prisma.platformSettings.findMany({
      orderBy: { category: 'asc' },
    });

    // Organize settings by category
    const organizedSettings: Record<string, any> = {
      auction: {},
      user: {},
      payment: {},
      general: {},
    };

    // Populate with database values or defaults
    for (const category of Object.keys(DEFAULT_SETTINGS)) {
      const categorySettings = settings.filter(s => s.category === category);
      
      if (categorySettings.length > 0) {
        categorySettings.forEach(setting => {
          organizedSettings[category][setting.key] = setting.value;
        });
      } else {
        // Use defaults if no settings exist
        organizedSettings[category] = DEFAULT_SETTINGS[category as keyof typeof DEFAULT_SETTINGS];
      }
    }

    // Get last update info
    const lastUpdated = settings.length > 0
      ? settings.reduce((latest, setting) => 
          setting.updatedAt > latest ? setting.updatedAt : latest,
          settings[0].updatedAt
        )
      : null;

    return NextResponse.json({
      settings: organizedSettings,
      lastUpdated,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    const activityLogger = new ActivityLogger();
    const userId = BigInt(session.user.id);

    // Fetch existing settings for comparison
    const existingSettings = await prisma.platformSettings.findMany();
    const existingMap = new Map(
      existingSettings.map(s => [`${s.category}.${s.key}`, s])
    );

    const updates: any[] = [];
    const beforeValues: Record<string, any> = {};
    const afterValues: Record<string, any> = {};

    // Process each category
    for (const [category, categorySettings] of Object.entries(settings)) {
      if (typeof categorySettings !== 'object' || categorySettings === null) continue;

      for (const [key, value] of Object.entries(categorySettings)) {
        const settingKey = `${category}.${key}`;
        const existing = existingMap.get(settingKey);

        // Track changes for audit log
        if (existing) {
          beforeValues[settingKey] = existing.value;
        }
        afterValues[settingKey] = value;

        updates.push(
          prisma.platformSettings.upsert({
            where: { key: settingKey },
            update: {
              value: value as any,
              updatedBy: userId,
            },
            create: {
              key: settingKey,
              value: value as any,
              category,
              updatedBy: userId,
            },
          })
        );
      }
    }

    // Execute all updates in a transaction
    await prisma.$transaction(updates);

    // Log the settings change
    await activityLogger.log(
      userId,
      {
        action: 'SETTINGS_UPDATED',
        entity: 'PlatformSettings',
        entityId: BigInt(0), // No specific entity ID for settings
        metadata: {
          before: beforeValues,
          after: afterValues,
          changedKeys: Object.keys(afterValues),
        },
      },
      request
    );

    // Fetch updated settings
    const updatedSettings = await prisma.platformSettings.findMany({
      orderBy: { category: 'asc' },
    });

    // Organize for response
    const organizedSettings: Record<string, any> = {
      auction: {},
      user: {},
      payment: {},
      general: {},
    };

    updatedSettings.forEach(setting => {
      const [category, key] = setting.key.split('.');
      if (!organizedSettings[category]) {
        organizedSettings[category] = {};
      }
      organizedSettings[category][key] = setting.value;
    });

    return NextResponse.json({
      success: true,
      settings: organizedSettings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
