'use client'

import { useEffect, useState } from 'react'

export default function TestApiPage() {
  const [storesResult, setStoresResult] = useState<any>(null)
  const [vendorsResult, setVendorsResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testApis = async () => {
      try {
        // Test stores API
        const storesResponse = await fetch('/api/admin/stores/pending')
        const storesData = await storesResponse.json()
        setStoresResult({
          status: storesResponse.status,
          data: storesData
        })

        // Test vendors API
        const vendorsResponse = await fetch('/api/admin/vendors/pending', {
          credentials: 'include'
        })
        const vendorsData = await vendorsResponse.json()
        setVendorsResult({
          status: vendorsResponse.status,
          data: vendorsData
        })
      } catch (error) {
        console.error('Error testing APIs:', error)
      } finally {
        setLoading(false)
      }
    }

    testApis()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>API Test Results</h1>
      
      <h2>Stores API</h2>
      <pre>Status: {storesResult?.status}</pre>
      <pre>{JSON.stringify(storesResult?.data, null, 2)}</pre>
      
      <h2>Vendors API</h2>
      <pre>Status: {vendorsResult?.status}</pre>
      <pre>{JSON.stringify(vendorsResult?.data, null, 2)}</pre>
    </div>
  )
}