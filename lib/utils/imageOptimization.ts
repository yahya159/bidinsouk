/**
 * Image Optimization Utilities
 * 
 * Helper functions for optimizing images in the marketplace.
 * Use these when working with Next.js Image component.
 */

/**
 * Generate optimized image sizes for responsive images
 */
export const imageSizes = {
  thumbnail: 80,
  small: 200,
  medium: 400,
  large: 800,
  xlarge: 1200,
  xxlarge: 1920,
} as const

/**
 * Common image aspect ratios
 */
export const aspectRatios = {
  square: 1, // 1:1
  landscape: 4 / 3, // 4:3
  widescreen: 16 / 9, // 16:9
  portrait: 3 / 4, // 3:4
  product: 1.25, // 5:4 (common for product images)
} as const

/**
 * Generate srcset for responsive images
 * 
 * @example
 * ```tsx
 * const srcset = generateSrcSet('/images/product.jpg', [400, 800, 1200])
 * // Returns: "/images/product.jpg?w=400 400w, /images/product.jpg?w=800 800w, ..."
 * ```
 */
export function generateSrcSet(src: string, widths: number[]): string {
  return widths
    .map((width) => `${src}?w=${width} ${width}w`)
    .join(', ')
}

/**
 * Generate sizes attribute for responsive images
 * 
 * @example
 * ```tsx
 * const sizes = generateSizes({
 *   sm: 100,
 *   md: 50,
 *   lg: 33,
 *   xl: 25
 * })
 * // Returns: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, ..."
 * ```
 */
export function generateSizes(breakpoints: {
  sm?: number // % of viewport
  md?: number
  lg?: number
  xl?: number
}): string {
  const sizes: string[] = []

  if (breakpoints.sm !== undefined) {
    sizes.push(`(max-width: 640px) ${breakpoints.sm}vw`)
  }
  if (breakpoints.md !== undefined) {
    sizes.push(`(max-width: 768px) ${breakpoints.md}vw`)
  }
  if (breakpoints.lg !== undefined) {
    sizes.push(`(max-width: 1024px) ${breakpoints.lg}vw`)
  }
  if (breakpoints.xl !== undefined) {
    sizes.push(`${breakpoints.xl}vw`)
  }

  return sizes.join(', ')
}

/**
 * Get optimized image URL from Unsplash
 * 
 * @example
 * ```tsx
 * const url = getUnsplashOptimized('https://images.unsplash.com/photo-123', {
 *   width: 400,
 *   quality: 80
 * })
 * ```
 */
export function getUnsplashOptimized(
  url: string,
  options: {
    width?: number
    height?: number
    quality?: number
    fit?: 'cover' | 'contain' | 'fill'
    format?: 'jpg' | 'webp' | 'avif'
  } = {}
): string {
  const { width, height, quality = 80, fit = 'cover', format = 'webp' } = options

  const params = new URLSearchParams()
  if (width) params.set('w', width.toString())
  if (height) params.set('h', height.toString())
  params.set('q', quality.toString())
  params.set('fit', fit)
  params.set('auto', format)

  return `${url}?${params.toString()}`
}

/**
 * Generate placeholder blur data URL
 * 
 * @example
 * ```tsx
 * const blurDataURL = generatePlaceholderDataURL()
 * <Image src={src} placeholder="blur" blurDataURL={blurDataURL} />
 * ```
 */
export function generatePlaceholderDataURL(
  width: number = 8,
  height: number = 8,
  color: string = '#f3f4f6'
): string {
  const canvas =
    typeof window !== 'undefined' ? document.createElement('canvas') : null

  if (!canvas) {
    // Server-side fallback
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='${color}' width='${width}' height='${height}'/%3E%3C/svg%3E`
  }

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
  }

  return canvas.toDataURL()
}

/**
 * Preload critical images
 * 
 * @example
 * ```tsx
 * useEffect(() => {
 *   preloadImages([
 *     '/images/hero.jpg',
 *     '/images/logo.png'
 *   ])
 * }, [])
 * ```
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = reject
          img.src = url
        })
    )
  )
}

/**
 * Lazy load image with intersection observer
 * 
 * @example
 * ```tsx
 * const imgRef = useRef<HTMLImageElement>(null)
 * 
 * useEffect(() => {
 *   if (imgRef.current) {
 *     lazyLoadImage(imgRef.current, '/images/product.jpg')
 *   }
 * }, [])
 * ```
 */
export function lazyLoadImage(
  element: HTMLImageElement,
  src: string,
  options: IntersectionObserverInit = {}
): () => void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        img.src = src
        observer.unobserve(img)
      }
    })
  }, options)

  observer.observe(element)

  // Return cleanup function
  return () => observer.disconnect()
}

/**
 * Get image dimensions from URL
 * 
 * @example
 * ```tsx
 * const { width, height } = await getImageDimensions('/images/product.jpg')
 * ```
 */
export async function getImageDimensions(
  url: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = reject
    img.src = url
  })
}

/**
 * Compress image file before upload
 * 
 * @example
 * ```tsx
 * const compressed = await compressImage(file, {
 *   maxWidth: 1920,
 *   maxHeight: 1920,
 *   quality: 0.8
 * })
 * ```
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'image/jpeg' | 'image/png' | 'image/webp'
  } = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    format = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Could not compress image'))
            }
          },
          format,
          quality
        )
      }

      img.onerror = reject
    }

    reader.onerror = reject
  })
}

/**
 * Convert image to WebP format
 * 
 * @example
 * ```tsx
 * const webpBlob = await convertToWebP(file, 0.8)
 * ```
 */
export async function convertToWebP(
  file: File,
  quality: number = 0.8
): Promise<Blob> {
  return compressImage(file, {
    quality,
    format: 'image/webp',
  })
}

/**
 * Generate responsive image config for Next.js Image
 * 
 * @example
 * ```tsx
 * const imageConfig = getResponsiveImageConfig('product')
 * <Image {...imageConfig} src="/images/product.jpg" alt="Product" />
 * ```
 */
export function getResponsiveImageConfig(type: 'product' | 'auction' | 'avatar' | 'banner') {
  const configs = {
    product: {
      sizes: '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
      width: 400,
      height: 400,
      quality: 85,
    },
    auction: {
      sizes: '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw',
      width: 400,
      height: 400,
      quality: 85,
    },
    avatar: {
      sizes: '(max-width: 640px) 40px, 48px',
      width: 48,
      height: 48,
      quality: 90,
    },
    banner: {
      sizes: '100vw',
      width: 1920,
      height: 400,
      quality: 80,
    },
  }

  return configs[type]
}

/**
 * Check if image format is supported
 */
export function isImageFormatSupported(format: string): boolean {
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
  return supportedFormats.includes(format.toLowerCase())
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/avif': 'avif',
  }
  return extensions[mimeType.toLowerCase()] || 'jpg'
}

