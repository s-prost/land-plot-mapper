import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// Динамічний імпорт для компонента з картою (SSR off)
const LandPlotMapper = dynamic(() => import('../components/LandPlotMapper'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Завантаження додатку...</p>
      </div>
    </div>
  )
})

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Ініціалізація...</p>
        </div>
      </div>
    )
  }

  return <LandPlotMapper />
}
