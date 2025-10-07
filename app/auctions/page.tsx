import AuctionCard from '@/components/AuctionCard'

// Placeholder data - in a real app this would come from an API
const auctions = [
  {
    id: 1,
    title: "iPhone 15 Pro Max 256GB - Neuf",
    description: "iPhone 15 Pro Max tout neuf, jamais utilisé, avec tous les accessoires d'origine.",
    startPrice: 9500,
    currentPrice: 10200,
    endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    image: ""
  },
  {
    id: 2,
    title: "MacBook Pro M2 16 pouces",
    description: "MacBook Pro M2 16 pouces avec 16GB RAM et 512GB SSD, acheté en janvier 2024.",
    startPrice: 18000,
    currentPrice: 19500,
    endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    image: ""
  },
  {
    id: 3,
    title: "Téléviseur Samsung 65 pouces QLED",
    description: "Téléviseur Samsung 65 pouces QLED 4K Smart TV, acheté en décembre 2023.",
    startPrice: 6500,
    currentPrice: 7200,
    endAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    image: ""
  },
  {
    id: 4,
    title: "Vélo électrique Xiaomi Pro 2",
    description: "Vélo électrique Xiaomi Pro 2 avec batterie amovible de 48V, peu utilisé.",
    startPrice: 3200,
    currentPrice: 3800,
    endAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    image: ""
  },
  {
    id: 5,
    title: "Appareil photo Canon EOS R5",
    description: "Canon EOS R5 avec objectif 24-105mm, peu utilisé, tous accessoires inclus.",
    startPrice: 12000,
    currentPrice: 13500,
    endAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    image: ""
  },
  {
    id: 6,
    title: "Console PlayStation 5",
    description: "PlayStation 5 avec lecteur disque, état neuf, avec manette supplémentaire.",
    startPrice: 4500,
    currentPrice: 5100,
    endAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    image: ""
  }
]

export default function AuctionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Enchères en cours</h1>
        <p className="text-gray-600 mt-2">
          Découvrez les meilleures offres et participez aux enchères en temps réel
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map(auction => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <button className="px-6 py-3 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors">
          Voir plus d'enchères
        </button>
      </div>
    </div>
  )
}