import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function ProfilePage() {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: BigInt(session.user.id) },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      locale: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">User ID</p>
                <p className="text-lg">{user.id.toString()}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Role</p>
                <p className="text-lg">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-lg">{user.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Locale</p>
                <p className="text-lg">{user.locale || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-lg">{user.phone || 'N/A'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Account Created</p>
                <p className="text-lg font-semibold text-green-600">
                  {new Date(user.createdAt).toLocaleString('en-US', {
                    dateStyle: 'full',
                    timeStyle: 'medium'
                  })}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-lg font-semibold text-blue-600">
                  {new Date(user.updatedAt).toLocaleString('en-US', {
                    dateStyle: 'full',
                    timeStyle: 'medium'
                  })}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold mb-2">Database Confirmation</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">✅ User data successfully saved to database!</p>
                <p className="text-green-700 text-sm mt-2">
                  Your account was registered at: <strong>{user.createdAt.toISOString()}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button asChild>
                <a href="/">Home</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/auth/signout">Logout</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

