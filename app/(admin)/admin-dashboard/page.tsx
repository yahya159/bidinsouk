import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  // Placeholder data - in a real app this would come from an API
  const stats = {
    users: 1240,
    vendors: 42,
    products: 856,
    auctions: 128
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord administrateur</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{stats.users}</CardTitle>
            <CardDescription className="text-center">Utilisateurs</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{stats.vendors}</CardTitle>
            <CardDescription className="text-center">Vendeurs</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{stats.products}</CardTitle>
            <CardDescription className="text-center">Produits</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{stats.auctions}</CardTitle>
            <CardDescription className="text-center">Enchères</CardDescription>
          </CardHeader>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Demandes de vendeurs</CardTitle>
            <CardDescription>À approuver ou rejeter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Karim Boutique</h3>
                  <p className="text-sm text-gray-500">karim@example.com</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">Approuver</Button>
                  <Button variant="outline" size="sm">Rejeter</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Fatima Électronique</h3>
                  <p className="text-sm text-gray-500">fatima@example.com</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">Approuver</Button>
                  <Button variant="outline" size="sm">Rejeter</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Signalements</CardTitle>
            <CardDescription>Contenu signalé par les utilisateurs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center p-4 border rounded-lg">
                <div className="flex-grow">
                  <h3 className="font-medium">Produit suspect</h3>
                  <p className="text-sm text-gray-500">Signalé par: Youssef M.</p>
                  <p className="text-sm text-gray-500">Raison: Contrefaçon</p>
                </div>
                <Button variant="outline">Voir</Button>
              </div>
              
              <div className="flex items-center p-4 border rounded-lg">
                <div className="flex-grow">
                  <h3 className="font-medium">Avis inapproprié</h3>
                  <p className="text-sm text-gray-500">Signalé par: Amina K.</p>
                  <p className="text-sm text-gray-500">Raison: Langage offensant</p>
                </div>
                <Button variant="outline">Voir</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}