import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin/permissions';
import { ActivityLogger } from '@/lib/admin/activity-logger';
import { getClientIp } from '@/lib/utils/ip-extractor';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

// GET /api/admin/users - List users with pagination, search, and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') as Role | null;
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Note: Status filter would require additional field in User model
    // For now, we'll skip it or implement based on existing fields

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          avatarUrl: true,
          locale: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Convert BigInt IDs to strings for JSON serialization
    const serializedUsers = users.map(user => ({
      ...user,
      id: user.id.toString(),
    }));

    return NextResponse.json({
      users: serializedUsers,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, role, password, locale } = body;

    // Validation
    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, role, password' },
        { status: 400 }
      );
    }

    if (!['CLIENT', 'VENDOR', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be CLIENT, VENDOR, or ADMIN' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role-specific profile
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role: role as Role,
        password: hashedPassword,
        locale: locale || 'fr',
        ...(role === 'CLIENT' && {
          client: {
            create: {},
          },
        }),
        ...(role === 'VENDOR' && {
          vendor: {
            create: {},
          },
        }),
        ...(role === 'ADMIN' && {
          admin: {
            create: {},
          },
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log activity
    const activityLogger = new ActivityLogger();
    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: 'USER_CREATED',
        entity: 'User',
        entityId: user.id,
        metadata: {
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
        },
      },
      request
    );

    // Convert BigInt ID to string for JSON serialization
    const serializedUser = {
      ...user,
      id: user.id.toString(),
    };

    return NextResponse.json({ user: serializedUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
