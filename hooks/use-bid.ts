'use client'

import { useState, useEffect } from 'react'
import { pusherClient } from '@/lib/realtime/pusher'
import { prisma } from '@/lib/db/prisma'

interface Bid {
  id: number
  amount: number
  createdAt: Date
  userId: number
}

interface Auction {
  id: number
  title: string
  currentBid: number | null
  minIncrement: number | null
  endAt: Date | null
  status: string
  storeId: number
}

export function useBid(auctionId: number) {
  const [auction, setAuction] = useState<Auction | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  
  useEffect(() => {
    // Fetch initial auction data and bids
    const fetchAuctionData = async () => {
      try {
        // In a real app, you'd fetch this from an API endpoint
        // For now, we'll use placeholder data
        const auctionData = await prisma.auction.findUnique({
          where: { id: auctionId }
        })
        
        const bidsData = await prisma.bid.findMany({
          where: { auctionId },
          orderBy: { createdAt: 'desc' },
          take: 20
        })
        
        setAuction(auctionData as any)
        setBids(bidsData as any)
      } catch (error) {
        console.error('Failed to fetch auction data:', error)
      }
    }
    
    fetchAuctionData()
    
    // Subscribe to Pusher events
    const channel = pusherClient.subscribe(`auction-${auctionId}`)
    
    channel.bind('bid:new', (data: any) => {
      setBids(prev => [data, ...prev])
      setAuction(prev => prev ? { ...prev, currentBid: data.amount } : null)
    })
    
    return () => {
      channel.unbind('bid:new')
      pusherClient.unsubscribe(`auction-${auctionId}`)
    }
  }, [auctionId])
  
  const placeBid = async (amount: number) => {
    try {
      const response = await fetch(`/api/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to place bid')
      }
      
      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error placing bid:', error)
      throw error
    }
  }
  
  return {
    auction,
    bids,
    placeBid
  }
}