import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Akira - Animaciones de Video con IA',
  description: 'Automatiza la creación de animaciones para videos de YouTube con IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-brutal bg-[#f0f0f0] text-brutal-black antialiased">
        {children}
      </body>
    </html>
  )
}
