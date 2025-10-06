'use client'

import { UploadButton } from '@uploadthing/react'
import { OurFileRouter } from '@/app/api/uploadthing/route'

export function UploadButtonComponent() {
  return (
    <UploadButton<OurFileRouter>
      endpoint="imageUploader"
      onClientUploadComplete={(res) => {
        // Do something with the response
        console.log('Files uploaded successfully!', res)
      }}
      onUploadError={(error: Error) => {
        // Do something with the error
        console.error('Upload error:', error)
      }}
    />
  )
}