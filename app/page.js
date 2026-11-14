'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Calendar, Search, Upload, Download, Plus, Trash2, RotateCcw, 
  CheckCircle, Clock, FileText, Image as ImageIcon, LogOut, RefreshCw 
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function NubidaMarket() {
  const [currentTab, setCurrentTab] = useState('purchase'); // 'purchase' | 'db' | 'invoice'
  const [currentDate, setCurrentDate] = useState('2026-11-14');
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 새 구매 입력 폼 상태
  const [formBuyer, setFormBuyer] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formProducts, setFormProducts] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [currentDate]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchOrders = async () => {
    if (!supabase) {
      // Supabase 미설정 시 기본 가상 데이터
      setOrders([
        { id: 1, date: currentDate, buyer_name: '홍길동', nickname: '길동이', phone: '010-1234-5678', amount: 15000, products: '원피스 외 1개', payment_status: '입금', shipping_status: '발송', keep_date: null },
        { id: 2, date: currentDate, buyer_name: '김영희', nickname: '영희짱', phone: '010-9876-5432', amount: 32000, products: '블라우스', payment_status: '미입금', shipping_status: '킵', keep_date: currentDate }
      ]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('date', currentDate);
      
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
      showToast('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 킵 규칙 적용: 전일(D-1) 킵된 건은 익일(D일)에 자동 발송 전환 로직 시뮬레이션
  const handleDateChange = (days) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    const nextDateStr = d.toISOString().split('T')[0];
    setCurrentDate(nextDateStr);
  };

  const handleStatusChange = async (id, field, value) => {
    const updated = orders.map(o => o.id === id ? { ...o, [field]: value } : o);
    setOrders(updated);
    if (supabase) {
      await supabase.from('orders').update({ [field]: value }).eq('id', id);
    }
    showToast('상태가 변경되었습니다.');
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    const newOrder = {
      date: currentDate,
      buyer_name: formBuyer,
      nickname: formNickname,
      phone: formPhone,
      amount: Number(formAmount) || 0,
      products: formProducts,
      payment_status: '미입금',
      shipping_status: '발송',
      keep_date: null
    };

    if (supabase) {
      const { data, error } = await supabase.from('orders').insert([newOrder]).select();
      if (!error && data) {
        setOrders([...orders, data[0]]);
      }
    } else {
      setOrders([...orders, { ...newOrder, id: Date.now() }]);
    }

    setIsModalOpen(false);
    setFormBuyer(''); setFormNickname(''); setFormPhone(''); setFormAmount(''); setFormProducts('');
    showToast('새 구매 건이 등록되었습니다.');
  };

  return (
    <div className="flex h-screen bg-[#F0F5FA] text-slate-800 font-sans">
      {/* 사이드바 (파스텔 블루 포인트) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-[#2563EB] flex items-center gap-2">
            🛍️ 누비다마켓
          </h1>
          <p className="text-xs text-slate-400 mt-1">스마트 송장 및 주문 관리</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setCurrentTab('purchase')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${currentTab === 'purchase' ? 'bg-[#E0F2FE] text-[#1D4ED8]' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <FileText size={18} /> 통합 구매관리
          </button>
          <button 
            onClick={() => setCurrentTab('db')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${currentTab === 'db' ? 'bg-[#E0F2FE] text-[#1D4ED8]' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <CheckCircle size={18} /> 고객정보 DB
          </button>
          <button 
            onClick={() => setCurrentTab('invoice')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${currentTab === 'invoice' ? 'bg-[#E0F2FE] text-[#1D4ED8]' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ImageIcon size={18} /> 송장 · 이미지
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <button onClick={fetchOrders} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-colors">
            <RefreshCw size={16} /> 새로고침
          </button>
          <button onClick={() => alert('로그아웃 되었습니다.')} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-rose-500 hover:bg-rose-50 rounded-xl text-sm font-medium transition-colors">
            <LogOut size={16} /> 로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 토스트 메시지 */}
        {toastMessage && (
          <div className="absolute top-5 right-5 z-50 bg-[#2563EB] text-white px-5 py-3 rounded-xl shadow-lg font-medium text-sm animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* 상단 헤더 (날짜 및 검색) */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button onClick={() => handleDateChange(-1)} className="px-3 py-1.5 text-slate-600 hover:bg-white rounded-lg text-sm font-bold shadow-xs transition-all">←</button>
              <span className="px-4 font-semibold text-slate-700 text-sm">{currentDate}</span>
              <button onClick={() => handleDateChange(1)} className="px-3 py-1.5 text-slate-600 hover:bg-white rounded-lg text-sm font-bold shadow-xs transition-all">→</button>
            </div>
            <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg font-medium border border-amber-200">
              💡 킵(Keep) 안내: 전일 킵 건은 익일 자동 발송됩니다. (최대 1일)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="구매자 이름 또는 닉네임 검색" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] w-64"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all"
            >
              <Plus size={16} /> 수동 구매 추가
            </button>
          </div>
        </header>

        {/* 컨텐츠 뷰 */}
        <div className="flex-1 p-8 overflow-y-auto">
          {currentTab === 'purchase' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">통합 구매관리 리스트 ({orders.length}건)</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-medium shadow-xs">엑셀 업로드</button>
                  <button className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-medium shadow-xs">양식 다운로드</button>
                </div>
              </div>

              {/* 테이블 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                      <th className="p-4 w-12 text-center"><input type="checkbox" /></th>
                      <th className="p-4">구매자 (닉네임)</th>
                      <th className="p-4">연락처</th>
                      <th className="p-4">구매금액</th>
                      <th className="p-4">제품정보</th>
                      <th className="p-4">입금상태</th>
                      <th className="p-4">배송상태</th>
                      <th className="p-4 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.filter(o => o.buyer_name.includes(searchTerm) || o.nickname.includes(searchTerm)).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 text-center"><input type="checkbox" /></td>
                        <td className="p-4 font-semibold text-slate-800">{order.buyer_name} <span className="text-slate-400 font-normal">({order.nickname})</span></td>
                        <td className="p-4 text-slate-600">{order.phone || '-'}</td>
                        <td className="p-4 font-medium text-slate-700">{order.amount.toLocaleString()}원</td>
                        <td className="p-4 text-slate-600">{order.products}</td>
                        <td className="p-4">
                          <select 
                            value={order.payment_status} 
                            onChange={(e) => handleStatusChange(order.id, 'payment_status', e.target.value)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${order.payment_status === '입금' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}
                          >
                            <option value="입금">입금완료</option>
                            <option value="미입금">미입금</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <select 
                            value={order.shipping_status} 
                            onChange={(e) => handleStatusChange(order.id, 'shipping_status', e.target.value)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${order.shipping_status === '발송' ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]' : 'bg-amber-50 text-amber-600 border-amber-200'}`}
                          >
                            <option value="발송">발송 (익일 자동)</option>
                            <option value="킵">킵 (당일)</option>
                          </select>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => {
                            setOrders(orders.filter(o => o.id !== order.id));
                            showToast('삭제되었습니다.');
                          }} className="text-slate-400 hover:text-rose-500 p-1">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentTab === 'db' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">고객정보 DB 관리</h2>
              <p className="text-sm text-slate-500">등록된 고객들의 연락처 및 주소 정보를 통합 관리하는 공간입니다.</p>
            </div>
          )}

          {currentTab === 'invoice' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">송장 · 이미지 발급</h2>
              <p className="text-sm text-slate-500">CJ대한통운 송장 엑셀 발급 및 고객별 전송 이미지를 관리합니다.</p>
            </div>
          )}
        </div>
      </main>

      {/* 수동 구매 추가 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">수동 구매 건 추가</h3>
            <form onSubmit={handleAddOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">구매자 이름</label>
                <input type="text" required value={formBuyer} onChange={e => setFormBuyer(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB]" placeholder="예: 홍길동" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">닉네임</label>
                <input type="text" required value={formNickname} onChange={e => setFormNickname(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB]" placeholder="예: 길동이" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">연락처</label>
                <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB]" placeholder="010-0000-0000" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">구매금액</label>
                <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB]" placeholder="10000" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">제품정보</label>
                <input type="text" value={formProducts} onChange={e => setFormProducts(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB]" placeholder="상품명 외 1개" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium">취소</button>
                <button type="submit" className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-medium">추가하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
