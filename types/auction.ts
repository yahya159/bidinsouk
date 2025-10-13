export type AuctionProduct = {
  id: string;
  slug: string;
  title: string;
  descriptionHtml: string;
  images: { url: string; alt: string }[];
  category: { id: string; name: string; slug: string };
  seller: {
    id: string;
    name: string;
    avatarUrl?: string;
    rating?: number;
    storeSlug: string;
  };
  specs?: Record<string, string>;
  condition: "Neuf" | "Très bon" | "Bon" | "Acceptable";
  startingBidMAD: number;
  currentBidMAD: number;
  minIncrementMAD: number;
  reserveMet: boolean;
  endsAtISO: string;
  timezone: string;
  watchlisted?: boolean;
};

export type Bid = {
  id: string;
  bidder: { 
    id: string; 
    displayName: string; 
    avatarUrl?: string; 
    isSeller?: boolean; 
  };
  amountMAD: number;
  placedAtISO: string;
};

export type ProductPageData = {
  product: AuctionProduct;
  bids: Bid[];
  similar: AuctionProduct[];
};