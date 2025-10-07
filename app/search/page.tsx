// Placeholder data - in a real app this would come from an API
const searchResults = {
  auctions: [
    {
      id: 1,
      title: "iPhone 15 Pro Max 256GB - Neuf",
      description: "iPhone 15 Pro Max tout neuf, jamais utilisé",
      startPrice: 9500,
      currentPrice: 10200,
      endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      image: ""
    },
    {
      id: 2,
      title: "MacBook Pro M2 16 pouces",
      description: "MacBook Pro M2 16 pouces avec 16GB RAM",
      startPrice: 18000,
      currentPrice: 19500,
      endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      image: ""
    }
  ],
  products: [
    {
      id: 1,
      title: "Casque Audio Sony WH-1000XM5",
      description: "Casque audio sans fil premium avec annulation de bruit",
      price: 2200,
      condition: "NEUF",
      storeName: "TechStore",
      image: ""
    },
    {
      id: 2,
      title: "Montre Apple Watch Series 8",
      description: "Montre connectée avec suivi santé avancé",
      price: 2800,
      condition: "NEUF",
      storeName: "AppleShop",
      image: ""
    }
  ]
}

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Résultats de recherche</h1>
        <p className="text-gray-600">25 résultats pour "iPhone"</p>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-8">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-full">
          Tous
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200">
          Enchères
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200">
          Produits
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-6">Enchères ({searchResults.auctions.length})</h2>
          <div className="space-y-6">
            {searchResults.auctions.map(auction => (
              <div key={auction.id} className="flex border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24" />
                <div className="p-4 flex-grow">
                  <h3 className="font-semibold text-lg mb-1">{auction.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-1">{auction.description}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Actuellement</p>
                      <p className="font-bold">{auction.currentPrice} MAD</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Enchérir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-6">Produits ({searchResults.products.length})</h2>
          <div className="space-y-6">
            {searchResults.products.map(product => (
              <div key={product.id} className="flex border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24" />
                <div className="p-4 flex-grow">
                  <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-1">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Prix</p>
                      <p className="font-bold">{product.price} MAD</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Acheter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-12 flex justify-center">
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">
            Précédent
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
            1
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">
            2
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">
            3
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">
            Suivant
          </button>
        </div>
      </div>
    </div>
  )
}