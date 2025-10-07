export default function AuctionCard(props: { auction: any }) {
  const { auction } = props;
  
  // Format date
  const endDate = new Date(auction.endAt);
  const now = new Date();
  const timeLeft = endDate.getTime() - now.getTime();
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  return (
    <div className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48" />
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{auction.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{auction.description}</p>
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-500">Prix de départ</p>
            <p className="font-bold text-lg">{auction.startPrice} MAD</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Dernière enchère</p>
            <p className="font-bold text-lg">{auction.currentPrice || auction.startPrice} MAD</p>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Temps restant</span>
            <span className="font-medium">
              {days > 0 ? `${days}j ${hours}h` : `${hours}h ${minutes}m`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(0, 100 - (timeLeft / (1000 * 60 * 60 * 24 * 10))))}%` }}
            ></div>
          </div>
        </div>
        
        <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
          Placer une enchère
        </button>
      </div>
    </div>
  )
}