import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ClientDashboard() {
  // Placeholder data - in a real app this would come from an API
  const stats = {
    activeBids: 3,
    watchlistItems: 12,
    orders: 5,
    savedSearches: 4
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord client</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{stats.activeBids}</CardTitle>
            <CardDescription className="text-center">Enchères actives</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{stats.watchlistItems}</CardTitle>
            <CardDescription className="text-center">Articles surveillés</CardDescription>
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
            <CardTitle className="text-2xl text-center">{stats.savedSearches}</CardTitle>
            <CardDescription className="text-center">Recherches sauvegardées</CardDescription>
          </CardHeader>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Enchères actives</CardTitle>
            <CardDescription>Vos enchères en cours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center p-4 border rounded-lg">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mr-4" />
                <div className="flex-grow">
                  <h3 className="font-medium">iPhone 15 Pro Max</h3>
                  <p className="text-sm text-gray-500">Votre enchère: 10,200 MAD</p>
                  <p className="text-sm text-gray-500">Temps restant: 1j 4h</p>
                </div>
                <Button variant="outline">Voir</Button>
              </div>
              
              <div className="flex items-center p-4 border rounded-lg">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mr-4" />
                <div className="flex-grow">
                  <h3 className="font-medium">MacBook Pro M2</h3>
                  <p className="text-sm text-gray-500">Votre enchère: 19,500 MAD</p>
                  <p className="text-sm text-gray-500">Temps restant: 3j 12h</p>
                </div>
                <Button variant="outline">Voir</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Articles surveillés</CardTitle>
            <CardDescription>Vos articles favoris</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center p-4 border rounded-lg">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mr-4" />
                <div className="flex-grow">
                  <h3 className="font-medium">Casque Audio Sony</h3>
                  <p className="text-sm text-gray-500">Prix: 2,200 MAD</p>
                  <p className="text-sm text-green-600">En stock</p>
                </div>
                <Button variant="outline">Voir</Button>
              </div>
              
              <div className="flex items-center p-4 border rounded-lg">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mr-4" />
                <div className="flex-grow">
                  <h3 className="font-medium">Montre Apple Watch</h3>
                  <p className="text-sm text-gray-500">Prix: 2,800 MAD</p>
                  <p className="text-sm text-green-600">En stock</p>
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