import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function VendorDashboard() {
  // Placeholder data - in a real app this would come from an API
  const stats = {
    products: 24,
    auctions: 8,
    orders: 15,
    revenue: 42500
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord vendeur</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{stats.orders}</CardTitle>
            <CardDescription className="text-center">Commandes</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{stats.revenue} MAD</CardTitle>
            <CardDescription className="text-center">Revenus ce mois</CardDescription>
          </CardHeader>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Commandes récentes</CardTitle>
            <CardDescription>Dernières commandes à traiter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Commande #12345</h3>
                  <p className="text-sm text-gray-500">2 articles - 4,500 MAD</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    En attente
                  </span>
                  <Button variant="outline" size="sm" className="mt-2">Voir</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Commande #12344</h3>
                  <p className="text-sm text-gray-500">1 article - 2,200 MAD</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Expédiée
                  </span>
                  <Button variant="outline" size="sm" className="mt-2">Voir</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Enchères en cours</CardTitle>
            <CardDescription>Vos enchères actives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center p-4 border rounded-lg">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mr-4" />
                <div className="flex-grow">
                  <h3 className="font-medium">iPhone 15 Pro Max</h3>
                  <p className="text-sm text-gray-500">Prix actuel: 10,200 MAD</p>
                  <p className="text-sm text-gray-500">Temps restant: 1j 4h</p>
                </div>
                <Button variant="outline">Voir</Button>
              </div>
              
              <div className="flex items-center p-4 border rounded-lg">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mr-4" />
                <div className="flex-grow">
                  <h3 className="font-medium">MacBook Pro M2</h3>
                  <p className="text-sm text-gray-500">Prix actuel: 19,500 MAD</p>
                  <p className="text-sm text-gray-500">Temps restant: 3j 12h</p>
                </div>
                <Button variant="outline">Voir</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 text-center">
        <Button className="mr-4">Ajouter un produit</Button>
        <Button variant="outline">Créer une enchère</Button>
      </div>
    </div>
  )
}