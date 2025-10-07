import { Input } from "@/components/ui/input";

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="bg-gray-100 text-xs text-gray-600">
        <div className="container mx-auto px-4 h-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Maroc</span>
            <span>Livraison gratuite</span>
            <span>Paiement sécurisé</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" className="hover:text-gray-900">Se connecter</a>
            <a href="/register" className="hover:text-gray-900">S'inscrire</a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center gap-4">
          <a href="/" className="text-2xl font-bold text-blue-600 whitespace-nowrap">
            Bidinsouk
          </a>

          <div className="flex-1">
            <div className="relative">
              <Input placeholder="Rechercher des articles, catégories, vendeurs..." className="h-11 rounded-full pl-12" />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2">
                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 104.243 11.96l3.773 3.774a.75.75 0 101.06-1.06l-3.773-3.774A6.75 6.75 0 0010.5 3.75zm-5.25 6.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a href="/watchlist" className="text-sm hover:text-blue-600">Favoris</a>
            <a href="/cart" className="text-sm hover:text-blue-600">Panier</a>
            <a href="/auctions" className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-md">
              Déposer une enchère
            </a>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 pb-3">
          <a href="/" className="text-sm hover:text-blue-600">Toutes les enchères</a>
          <a href="/auctions" className="text-sm hover:text-blue-600">Les enchères en direct</a>
          <a href="/products" className="text-sm hover:text-blue-600">Administration de Boutique</a>
          <a href="/vendors/apply" className="text-sm hover:text-blue-600">Devenir Vendeur</a>
          <a href="/orders" className="text-sm hover:text-blue-600">Enchères expirées</a>
        </div>
      </div>
    </header>
  )
}