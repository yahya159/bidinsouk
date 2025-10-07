import { getSession } from '@/lib/auth/session'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const session = await getSession()

  return (
    <div className="font-sans min-h-screen flex items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold">
            Welcome to <span className="text-blue-600">Bidinsouk</span>
          </h1>
          <p className="text-xl text-gray-600">
            Marketplace & Auction Platform
          </p>
        </div>

        {session?.user ? (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">✅ You're Logged In!</CardTitle>
              <CardDescription>Welcome back, {session.user.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{session.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-medium">{session.user.role}</p>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button asChild>
                  <a href="/profile">View Full Profile & Database Info</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/api/auth/signout">Logout</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>New User?</CardTitle>
                <CardDescription>Create an account to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a href="/register">Register Now</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing User?</CardTitle>
                <CardDescription>Sign in to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <a href="/login">Login</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>🚀 Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2">
              <p className="font-semibold">Step 1: Register a New Account</p>
              <p className="text-gray-600">Click "Register Now" and create an account with your details</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Step 2: Login</p>
              <p className="text-gray-600">After registration, login with your credentials</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Step 3: View Profile</p>
              <p className="text-gray-600">Click "View Full Profile" to see your user data including creation date saved in the database</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
              <p className="text-blue-800 font-medium">✨ Database Timestamps</p>
              <p className="text-blue-700 text-sm mt-1">
                When you register, the system automatically saves your account with <strong>createdAt</strong> and <strong>updatedAt</strong> timestamps to the MySQL database.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
