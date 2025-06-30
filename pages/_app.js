import '../styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Land Plot Mapper - Управління земельними ділянками</title>
        <meta name="description" content="Професійний додаток для роботи з земельними ділянками з інтеграцією Google Drive та аналізом дохідності" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Land Plot Mapper" />
        <meta property="og:description" content="Управління земельними ділянками з Google Drive інтеграцією" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
