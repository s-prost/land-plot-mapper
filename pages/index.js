import dynamic from 'next/dynamic'
import Head from 'next/head'

// Динамічне завантаження компонента для уникнення проблем з SSR
const LandPlotMapper = dynamic(() => import('../components/LandPlotMapper'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#407E6D] mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Завантаження додатку...</h2>
        <p className="text-gray-500">Підготовка інтерфейсу для роботи з земельними ділянками</p>
      </div>
    </div>
  )
})

export default function Home() {
  return (
    <>
      <Head>
        <title>Land Plot Mapper | Головна сторінка</title>
        <meta name="description" content="Професійний додаток для управління земельними ділянками з інтеграцією Google Drive" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="min-h-screen bg-gray-50">
        <LandPlotMapper />
      </main>
    </>
  )
}
