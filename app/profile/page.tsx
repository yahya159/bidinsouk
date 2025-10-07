import { getSession } from '@/lib/auth/session'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage() {
  const session = await getSession()
  
  // Placeholder data - in a real app this would come from an API
  const user = {
    id: 1,
    name: "Karim Benamar",
    email: "karim.benamar@example.com",
    role: "CLIENT",
    createdAt: new Date("2024-01-15"),
    avatar: "",
    stats: {
      auctionsWon: 12,
      productsBought: 8,
      reviewsWritten: 5
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mon Profil</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex flex-col items-center">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 mb-4" />
                  <CardTitle>{user.name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                  <span className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {user.role}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Membre depuis</p>
                    <p className="font-medium">{user.createdAt.toLocaleDateString('fr-FR')}</p>
                  </div>
                  <Button className="w-full">Modifier le profil</Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Profile Content */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-center">{user.stats.auctionsWon}</CardTitle>
                  <CardDescription className="text-center">Enchères gagnées</CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-center">{user.stats.productsBought}</CardTitle>
                  <CardDescription className="text-center">Produits achetés</CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-center">{user.stats.reviewsWritten}</CardTitle>
                  <CardDescription className="text-center">Avis écrits</CardDescription>
                </CardHeader>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Mes activités récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center p-4 border rounded-lg">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mr-4" />
                    <div>
                      <h3 className="font-medium">Enchère gagnée: iPhone 15 Pro</h3>
                      <p className="text-sm text-gray-500">2 jours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 border rounded-lg">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mr-4" />
                    <div>
                      <h3 className="font-medium">Avis publié: Casque Audio Sony</h3>
                      <p className="text-sm text-gray-500">1 semaine ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 border rounded-lg">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mr-4" />
                    <div>
                      <h3 className="font-medium">Produit acheté: Montre Apple Watch</h3>
                      <p className="text-sm text-gray-500">2 semaines ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}