export const metadata = {
  title: '누비다 마켓',
  description: '파스텔 블루 테마의 나만의 마켓',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
