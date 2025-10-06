'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { pusherClient } from '@/lib/realtime/pusher'

const data = [
  { name: 'Jan', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 2000 },
  { name: 'Apr', sales: 2780 },
  { name: 'May', sales: 1890 },
  { name: 'Jun', sales: 2390 },
]

interface OrderRequest {
  id: number
  userId: number
  storeId: number
  source: string
  status: string
  requestAt: Date
  expiresAt: Date | null
  address: any
}

export default function VendorDashboard() {
  const [orderRequests, setOrderRequests] = useState<OrderRequest[]>([])
  
  useEffect(() => {
    // Fetch initial order requests
    const fetchOrderRequests = async () => {
      try {
        // In a real app, you'd fetch this from an API endpoint
        // For now, we'll use placeholder data
        const requests = [
          {
            id: 1,
            userId: 2,
            storeId: 1,
            source: 'buy_now',
            status: 'requested',
            requestAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            address: { city: 'Casablanca' }
          }
        ]
        setOrderRequests(requests)
      } catch (error) {
        console.error('Failed to fetch order requests:', error)
      }
    }
    
    fetchOrderRequests()
    
    // Subscribe to Pusher events for store-1 (placeholder)
    // In a real app, you'd get the actual store ID from the session
    const channel = pusherClient.subscribe('store-1')
    
    channel.bind('order_request:created', (data: any) => {
      setOrderRequests(prev => [data.orderRequest, ...prev])
    })
    
    channel.bind('order_request:accepted', (data: any) => {
      setOrderRequests(prev => 
        prev.map(req => 
          req.id === data.orderRequest.id 
            ? { ...req, status: 'seller_accepted' } 
            : req
        )
      )
    })
    
    channel.bind('order_request:refused', (data: any) => {
      setOrderRequests(prev => 
        prev.map(req => 
          req.id === data.orderRequest.id 
            ? { ...req, status: 'seller_refused' } 
            : req
        )
      )
    })
    
    return () => {
      channel.unbind('order_request:created')
      channel.unbind('order_request:accepted')
      channel.unbind('order_request:refused')
      pusherClient.unsubscribe('store-1')
    }
  }, [])
  
  const handleAcceptRequest = async (requestId: number) => {
    try {
      const response = await fetch(`/api/orders/requests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      
      if (!response.ok) {
        throw new Error('Failed to accept order request')
      }
      
      // Update the local state optimistically
      setOrderRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'seller_accepted' } 
            : req
        )
      )
    } catch (error) {
      console.error('Failed to accept order request:', error)
    }
  }
  
  const handleRefuseRequest = async (requestId: number) => {
    try {
      const response = await fetch(`/api/orders/requests/${requestId}/refuse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      
      if (!response.ok) {
        throw new Error('Failed to refuse order request')
      }
      
      // Update the local state optimistically
      setOrderRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'seller_refused' } 
            : req
        )
      )
    } catch (error) {
      console.error('Failed to refuse order request:', error)
    }
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Vendor Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">My Products</h2>
          <p>Manage your products and auctions</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Sales</h2>
          <p>View your sales and revenue</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Orders</h2>
          <p>Manage incoming orders</p>
        </div>
      </div>
      
      {/* Incoming Requests Section */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Incoming Requests</h2>
        {orderRequests.length === 0 ? (
          <p>No incoming requests</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.address?.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === 'requested' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'seller_accepted' ? 'bg-green-100 text-green-800' :
                        request.status === 'seller_refused' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.status === 'requested' && (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRefuseRequest(request.id)}
                          >
                            Refuse
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Sales Overview</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}