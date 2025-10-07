import { Button } from "@/components/ui/button";

// Placeholder data - in a real app this would come from an API
const auction = {
  id: 1,
  title: "iPhone 15 Pro Max 256GB - Neuf",
  description: "iPhone 15 Pro Max tout neuf, jamais utilisé, avec tous les accessoires d'origine. Garantie 1 an Apple. Boîte d'origine incluse.",
  startPrice: 9500,
  currentPrice: 10200,
  minIncrement: 100,
  startAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started 1 day ago
  endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Ends in 2 days
  condition: "NEUF",
  category: "Smartphones",
  brand: "Apple",
  images: ["", "", ""],
  store: {
    id: 1,
    name: "TechStore",
    rating: 4.8,
    reviewCount: 124
  },
  bids: [
    { id: 1, amount: 10200, userId: 5, userName: "Karim B.", timestamp: new Date(Date.now() - 10 * 60 * 1000) },
    { id: 2, amount: 10100, userId: 3, userName: "Youssef M.", timestamp: new Date(Date.now() - 30 * 60 * 1000) },
    { id: 3, amount: 10000, userId: 7, userName: "Fatima Z.", timestamp: new Date(Date.now() - 60 * 60 * 1000) },
  ]
}

export default function AuctionDetailPage() {
  // Format date
  const endDate = new Date(auction.endAt);
  const now = new Date();
  const timeLeft = endDate.getTime() - now.getTime();
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-96 mb-4" />
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-24" />
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-24" />
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-24" />
          </div>
        </div>
        
        {/* Auction Details */}
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{auction.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded">
                  {auction.condition}
                </span>
                <span className="text-gray-600">Par <a href="#" className="text-blue-600 hover:underline">{auction.store.name}</a></span>
              </div>
            </div>
            <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
          
          <p className="text-gray-700 mb-6">{auction.description}</p>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-gray-600">Prix actuel</p>
                <p className="text-3xl font-bold text-blue-600">{auction.currentPrice} MAD</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600">Prochaine enchère</p>
                <p className="text-xl font-semibold">{auction.currentPrice + auction.minIncrement} MAD</p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Temps restant</span>
                <span className="font-medium">
                  {days > 0 ? `${days}j ${hours}h` : `${hours}h ${minutes}m`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, 100 - (timeLeft / (1000 * 60 * 60 * 24 * 10))))}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Votre enchère (MAD)
                </label>
                <input 
                  type="number" 
                  min={auction.currentPrice + auction.minIncrement}
                  defaultValue={auction.currentPrice + auction.minIncrement}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full py-2">
                  Placer une enchère
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Marque</p>
              <p className="font-medium">{auction.brand}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Catégorie</p>
              <p className="font-medium">{auction.category}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bid History */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Historique des enchères</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auction.bids.map(bid => (
                <tr key={bid.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{bid.userName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-blue-600">{bid.amount} MAD</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bid.timestamp.toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}