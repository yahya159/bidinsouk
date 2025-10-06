'use client'

import { useState, useEffect } from 'react'
import { useBid } from '@/hooks/use-bid'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlaceBidDto } from '@/lib/validations/bid'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { CreateOrderRequestDto } from '@/lib/validations/orderRequests'

export default function AuctionPage({ params }: { params: { id: string } }) {
  const { auction, bids, placeBid } = useBid(parseInt(params.id))
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  
  const {
    register: registerBid,
    handleSubmit: handleSubmitBid,
    formState: { errors: bidErrors },
  } = useForm({
    resolver: zodResolver(PlaceBidDto),
  })
  
  const {
    register: registerOrder,
    handleSubmit: handleSubmitOrder,
    formState: { errors: orderErrors },
  } = useForm({
    resolver: zodResolver(CreateOrderRequestDto),
  })
  
  useEffect(() => {
    if (auction?.endAt) {
      const timer = setInterval(() => {
        const remaining = formatDistanceToNow(new Date(auction.endAt!))
        setTimeRemaining(remaining)
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [auction?.endAt])
  
  const onSubmitBid = async (data: { amount: number }) => {
    try {
      await placeBid(data.amount)
    } catch (error) {
      console.error('Failed to place bid:', error)
    }
  }
  
  const onSubmitOrder = async (data: any) => {
    try {
      // For now, we'll use a placeholder storeId
      // In a real app, you'd get this from the auction data or context
      const storeId = '1' // Placeholder - replace with actual store ID
      
      const response = await fetch('/api/orders/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          storeId
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create order request')
      }
      
      toast({
        title: 'Order Request Created',
        description: 'Your order request has been sent to the vendor.',
      })
      
      setIsOrderModalOpen(false)
    } catch (error) {
      console.error('Failed to create order request:', error)
      toast({
        title: 'Error',
        description: 'Failed to create order request. Please try again.',
        variant: 'destructive',
      })
    }
  }
  
  if (!auction) {
    return <div>Loading...</div>
  }
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{auction.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-bold">Current Bid: ${auction.currentBid?.toString() || 'No bids yet'}</h2>
              <p>Minimum increment: ${auction.minIncrement?.toString() || '1'}</p>
              <p>Time remaining: {timeRemaining}</p>
            </div>
            
            <div>
              <form onSubmit={handleSubmitBid(onSubmitBid)} className="space-y-4">
                <div>
                  <Input
                    type="number"
                    placeholder="Bid amount"
                    {...registerBid('amount', { valueAsNumber: true })}
                  />
                  {bidErrors.amount && (
                    <p className="text-red-500 text-sm mt-1">{bidErrors.amount.message}</p>
                  )}
                </div>
                <Button type="submit">Place Bid</Button>
              </form>
              
              <div className="mt-4">
                <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Request Order</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Order</DialogTitle>
                      <DialogDescription>
                        Fill in your address details to request an order for this item.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitOrder(onSubmitOrder)} className="space-y-4">
                      <div>
                        <Input
                          placeholder="City"
                          {...registerOrder('address.city')}
                        />
                        {orderErrors.address?.city && (
                          <p className="text-red-500 text-sm mt-1">{orderErrors.address.city.message}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          placeholder="Street (optional)"
                          {...registerOrder('address.street')}
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="ZIP Code (optional)"
                          {...registerOrder('address.zipCode')}
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Country (optional)"
                          {...registerOrder('address.country')}
                        />
                      </div>
                      <Button type="submit">Submit Request</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Recent Bids</h3>
            <div className="space-y-2">
              {bids.map((bid) => (
                <div key={bid.id} className="flex justify-between items-center p-2 border rounded">
                  <span>Bid: ${bid.amount.toString()}</span>
                  <span>{formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}