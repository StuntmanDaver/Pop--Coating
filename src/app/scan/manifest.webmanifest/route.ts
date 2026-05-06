export function GET() {
  return Response.json({
    name: 'Scan Station',
    short_name: 'Scan',
    start_url: '/scan',
    scope: '/scan/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }],
  })
}
