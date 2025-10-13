// Removed cn import - using inline styles instead

interface PriceLabelProps {
  label: string;
  amount: number;
  className?: string;
}

export function PriceLabel({ label, amount, className }: PriceLabelProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className={`flex items-baseline gap-2 ${className || ''}`}>
      <span className="text-sm text-gray-600">{label}:</span>
      <span className="font-bold">
        {formatPrice(amount)} د.م
      </span>
    </div>
  );
}