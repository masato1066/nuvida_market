import './globals.css'

export const metadata = {
  title: '누비다 마켓',
  description: '스마트 송장 및 주문 관리',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-800 min-h-screen">
        {children}
      </body>
    </html>
  )
}
