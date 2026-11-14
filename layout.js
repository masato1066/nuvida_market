import './globals.css' // 이 줄이 꼭 있어야 합니다!

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
