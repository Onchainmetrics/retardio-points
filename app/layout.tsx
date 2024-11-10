import './globals.css'

export const metadata = {
  title: 'Retardio Points',
  description: 'Check your Retardio stats',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}