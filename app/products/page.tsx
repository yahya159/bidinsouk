import ProductCard from '@/components/ProductCard'

// Placeholder data - in a real app this would come from an API
const products = [
  {
    id: 1,
    title: "Casque Audio Sony WH-1000XM5",
    description: "Casque audio sans fil premium avec annulation de bruit, autonomie 30h.",
    price: 2200,
    condition: "NEUF",
    storeName: "TechStore",
    image: ""
  },
  {
    id: 2,
    title: "Montre Apple Watch Series 8",
    description: "Montre connectée avec suivi santé avancé, GPS et étanche.",
    price: 2800,
    condition: "NEUF",
    storeName: "AppleShop",
    image: ""
  },
  {
    id: 3,
    title: "Appareil Photo Canon EOS 250D",
    description: "Boîtier photo reflex avec objectif 18-55mm, parfait pour débutants.",
    price: 4500,
    condition: "OCCASION",
    storeName: "PhotoExpert",
    image: ""
  },
  {
    id: 4,
    title: "Chaise de Bureau Ergonomique",
    description: "Chaise de bureau réglable en hauteur avec support lombaire.",
    price: 1200,
    condition: "NEUF",
    storeName: "MaisonConfort",
    image: ""
  },
  {
    id: 5,
    title: "Robot Cuisine Thermomix TM6",
    description: "Robot multifonctions avec écran tactile et plus de 50 fonctions.",
    price: 12500,
    condition: "NEUF",
    storeName: "ElectroMaroc",
    image: ""
  },
  {
    id: 6,
    title: "Vélo Route Trek Emonda",
    description: "Vélo de route en carbone avec groupe Shimano Ultegra, taille L.",
    price: 18000,
    condition: "OCCASION",
    storeName: "BikePro",
    image: ""
  }
]

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Produits à vendre</h1>
        <p className="text-gray-600 mt-2">
          Découvrez nos produits neufs et d'occasion à des prix compétitifs
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <button className="px-6 py-3 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors">
          Voir plus de produits
        </button>
      </div>
    </div>
  )
}