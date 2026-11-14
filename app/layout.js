import './globals.css' // 👈 이 줄이 반드시 있어야 스타일이 적용됩니다!

export const metadata = {
  title: '누비다 마켓',
  description: '스마트 송장 및 주문 관리',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
