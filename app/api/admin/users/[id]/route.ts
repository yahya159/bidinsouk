import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/admin/permissions';
import { ActivityLogger } from '@/lib/admin/activity-logger';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = BigInt(params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        client: {
          select: {
            id: true,
            _count: {
              select: {
                orders: true,
                bids: true,
                watchlist: true,
                reviews: true,
              },
            },
          },
        },
        vendor: {
          select: {
            id: true,
            _count: {
              select: {
                stores: true,
              },
            },
          },
        },
        admin: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = BigInt(params.id);
    const body = await request.json();
    const { name, email, phone, role, locale, password } = body;

    // Get existing user for logging
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        locale: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (locale !== undefined) updateData.locale = locale;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Handle role change
    const roleChanged = role && role !== existingUser.role;
    if (roleChanged) {
      if (!['CLIENT', 'VENDOR', 'ADMIN'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be CLIENT, VENDOR, or ADMIN' },
          { status: 400 }
        );
      }
      updateData.role = role as Role;
      // Also update roles array for multi-role support
      updateData.roles = JSON.stringify([role]);
    }

    // Update user
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update basic user info
      const user = await tx.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          roles: true,
          avatarUrl: true,
          locale: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Handle role-specific profile creation/deletion if role changed
      if (roleChanged) {
        // Delete old role profiles
        if (existingUser.role === 'CLIENT') {
          await tx.client.deleteMany({ where: { userId } });
        } else if (existingUser.role === 'VENDOR') {
          await tx.vendor.deleteMany({ where: { userId } });
        } else if (existingUser.role === 'ADMIN') {
          await tx.admin.deleteMany({ where: { userId } });
        }

        // Create new role profile
        if (role === 'CLIENT') {
          await tx.client.create({ data: { userId } });
        } else if (role === 'VENDOR') {
          await tx.vendor.create({ data: { userId } });
        } else if (role === 'ADMIN') {
          await tx.admin.create({ data: { userId } });
        }
      }

      return user;
    });

    // Log activity
    const activityLogger = new ActivityLogger();
    const metadata: any = {
      userName: updatedUser.name,
      userEmail: updatedUser.email,
      changes: {},
    };

    if (name && name !== existingUser.name) metadata.changes.name = { from: existingUser.name, to: name };
    if (email && email !== existingUser.email) metadata.changes.email = { from: existingUser.email, to: email };
    if (phone !== existingUser.phone) metadata.changes.phone = { from: existingUser.phone, to: phone };
    if (locale && locale !== existingUser.locale) metadata.changes.locale = { from: existingUser.locale, to: locale };
    if (roleChanged) metadata.changes.role = { from: existingUser.role, to: role };
    if (password) metadata.changes.password = 'updated';

    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: roleChanged ? 'USER_ROLE_CHANGED' : 'USER_UPDATED',
        entity: 'User',
        entityId: userId,
        metadata,
      },
      request
    );

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = BigInt(params.id);

    // Prevent self-deletion
    if (userId === BigInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get user info before deletion
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log activity
    const activityLogger = new ActivityLogger();
    await activityLogger.log(
      BigInt(session.user.id),
      {
        action: 'USER_DELETED',
        entity: 'User',
        entityId: userId,
        metadata: {
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
        },
      },
      request
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
