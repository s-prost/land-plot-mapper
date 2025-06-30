import '../styles/globals.css'
import Head from 'next/head'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Land Plot Mapper | Управління земельними ділянками</title>
        <meta name="description" content="Професійний додаток для управління земельними ділянками з інтеграцією Google Drive та аналізом дохідності" />
        <meta name="keywords" content="земельні ділянки, кадастр, google drive, карти, геоінформаційні системи, дохідність, аналіз" />
        <meta name="author" content="Land Plot Mapper Team" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_APP_URL || 'https://land-plot-mapper.vercel.app'} />
        <meta property="og:title" content="Land Plot Mapper | Управління земельними ділянками" />
        <meta property="og:description" content="Професійний додаток для управління земельними ділянками з інтеграцією Google Drive та аналізом дохідності" />
        <meta property="og:image" content="/og-image.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={process.env.NEXT_PUBLIC_APP_URL || 'https://land-plot-mapper.vercel.app'} />
        <meta property="twitter:title" content="Land Plot Mapper | Управління земельними ділянками" />
        <meta property="twitter:description" content="Професійний додаток для управління земельними ділянками з інтеграцією Google Drive та аналізом дохідності" />
        <meta property="twitter:image" content="/og-image.jpg" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link rel="preconnect" href="https://apis.google.com" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#407E6D" />
        <meta name="msapplication-TileColor" content="#407E6D" />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        
        {/* PWA support */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Land Plot Mapper" />
        
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
      </Head>
      
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
