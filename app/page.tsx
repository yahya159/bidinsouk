import { getSession } from '@/lib/auth/session'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AuctionCard from "@/components/AuctionCard";
import ProductCard from "@/components/ProductCard";
import { listAuctions } from "@/lib/services/auctions";

export default async function Home() {
  const session = await getSession()
  const { auctions: liveAuctions } = await listAuctions({ status: 'RUNNING', page: 1, limit: 8 })
  const { auctions: endingSoon } = await listAuctions({ status: 'ENDING_SOON', page: 1, limit: 8 })

  return (
    <div className="min-h-screen">
      <section className="relative">
        <div className="h-[360px] w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white">
          <div className="container mx-auto px-4 h-full flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Découvrez les Meilleures Enchères</h1>
            <p className="text-lg md:text-xl opacity-90 mb-6">Trouvez des articles uniques aux meilleurs prix</p>
            <Button asChild className="bg-white text-orange-600 hover:bg-white/90 font-semibold">
              <a href="/auctions">ENCHÉRIR</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Ending Soon</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {endingSoon.map((a: any) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Enchères en Direct</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {liveAuctions.map((a: any) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold mb-6">Catégories populaires</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
            {['Femmes','Vins','Chaussures','Livres','Vêtements','Bébé','Maison','Montres','Sport','Art'].map((c) => (
              <div key={c} className="rounded-xl bg-white border p-4 text-center text-sm hover:shadow">
                {c}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold text-center mb-8">Pourquoi Bidinsouk ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card><CardHeader><CardTitle>Achats sécurisés</CardTitle></CardHeader><CardContent>Paiement 100% sécurisé avec protection acheteur</CardContent></Card>
            <Card><CardHeader><CardTitle>Vendeurs vérifiés</CardTitle></CardHeader><CardContent>Nos vendeurs sont authentifiés et notés</CardContent></Card>
            <Card><CardHeader><CardTitle>Livraison rapide</CardTitle></CardHeader><CardContent>Sous 24-48h dans tout le Maroc</CardContent></Card>
            <Card><CardHeader><CardTitle>Service client</CardTitle></CardHeader><CardContent>Support 7/7 en français et arabe</CardContent></Card>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold text-center mb-8">Avis vérifiés</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-base">Client satisfait #{i}</CardTitle>
                  <CardDescription>03/10/2025</CardDescription>
                </CardHeader>
                <CardContent>
                  Excellente plateforme d'enchères. Interface intuitive et processus d'achat sécurisés.
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            {session?.user ? (
              <Button asChild>
                <a href="/auctions">Parcourir les enchères</a>
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Button asChild>
                  <a href="/register">Inscrivez-vous maintenant</a>
                </Button>
                <Button asChild variant="outline">
                  <a href="/login">Se connecter</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}