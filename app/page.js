'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Calendar, Search, Plus, Trash2, 
  CheckCircle, FileText, Image as ImageIcon, LogOut, RefreshCw 
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function NubidaMarket() {
  const [currentTab, setCurrentTab] = useState('purchase'); // 'purchase' | 'db' | 'invoice'
  const [currentDate, setCurrentDate] = useState('2026-11-13');
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
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
      setOrders([
        { id: 1, date: currentDate, buyer_name: '비룡(박병도)', nickname: '이월 1', phone: '010-1234-5678', amount: 10000, products: '20번 라코스테 뽀글이 블랙_100', payment_status: '입금', shipping_status: '발송', keep_date: null },
        { id: 2, date: currentDate, buyer_name: '남미애', nickname: '이월 1', phone: '010-9876-5432', amount: 60000, products: '22번 톰브라운 니트티 버건디_L 외 2개', payment_status: '입금', shipping_status: '발송', keep_date: null }
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
    <div className="flex h-screen bg-[#F4F8FB] text-slate-800 font-sans">
      {/* 사이드바 (파스텔 블루 톤 적용) */}
      <aside className="w-64 bg-white border-r border-sky-100 flex flex-col shadow-xs">
        <div className="p-6 border-b border-sky-50">
          <h1 className="text-xl font-bold text-[#3B82F6] flex items-center gap-2">
            🛍️ 누비다마켓
          </h1>
          <p className="text-xs text-slate-400 mt-1">스마트 송장 및 주문 관리</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setCurrentTab('purchase')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${currentTab === 'purchase' ? 'bg-[#E0F2FE] text-[#0284C7] shadow-xs' : 'text-slate-600 hover:bg-sky-50/50'}`}
          >
            <FileText size={18} /> 통합 구매관리
          </button>
          <button 
            onClick={() => setCurrentTab('db')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${currentTab === 'db' ? 'bg-[#E0F2FE] text-[#0284C7] shadow-xs' : 'text-slate-600 hover:bg-sky-50/50'}`}
          >
            <CheckCircle size={18} /> 고객정보 DB
          </button>
          <button 
            onClick={() => setCurrentTab('invoice')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${currentTab === 'invoice' ? 'bg-[#E0F2FE] text-[#0284C7] shadow-xs' : 'text-slate-600 hover:bg-sky-50/50'}`}
          >
            <ImageIcon size={18} /> 송장 · 이미지
          </button>
        </nav>

        <div className="p-4 border-t border-sky-50 space-y-2">
          <button onClick={fetchOrders} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-sm font-medium transition-colors">
            <RefreshCw size={16} /> 새로고침
          </button>
          <button onClick={() => alert('로그아웃 되었습니다.')} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-rose-500 hover:bg-rose-50 rounded-xl text-sm font-medium transition-colors">
            <LogOut size={16} /> 로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {toastMessage && (
          <div className="absolute top-5 right-5 z-50 bg-[#0284C7] text-white px-5 py-3 rounded-xl shadow-lg font-medium text-sm animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* 상단 헤더 */}
        <header className="bg-white border-b border-sky-100 px-8 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-sky-50/70 rounded-xl p-1 border border-sky-100">
              <button onClick={() => handleDateChange(-1)} className="px-3 py-1.5 text-sky-700 hover:bg-white rounded-lg text-sm font-bold transition-all shadow-xs">←</button>
              <span className="px-4 font-semibold text-slate-700 text-sm">{currentDate}</span>
              <button onClick={() => handleDateChange(1)} className="px-3 py-1.5 text-sky-700 hover:bg-white rounded-lg text-sm font-bold transition-all shadow-xs">→</button>
            </div>
            <span className="text-xs text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg font-medium border border-sky-200">
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
                className="pl-9 pr-4 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-sm focus:outline-none focus:border-[#0284C7] w-64"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#0284C7] hover:bg-[#0284C7]/90 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-xs transition-all"
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
                  <button className="px-4 py-2 bg-white border border-sky-200 hover:bg-sky-50/50 text-sky-700 rounded-xl text-sm font-medium shadow-xs">엑셀 업로드</button>
                  <button className="px-4 py-2 bg-white border border-sky-200 hover:bg-sky-50/50 text-sky-700 rounded-xl text-sm font-medium shadow-xs">양식 다운로드</button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-sky-100 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-sky-50/60 border-b border-sky-100 text-slate-500 font-medium">
                      <th className="p-4 w-12 text-center"><input type="checkbox" className="accent-sky-500" /></th>
                      <th className="p-4">구매자 (닉네임)</th>
                      <th className="p-4">연락처</th>
                      <th className="p-4">구매금액</th>
                      <th className="p-4">제품정보</th>
                      <th className="p-4">입금상태</th>
                      <th className="p-4">배송상태 (킵/발송)</th>
                      <th className="p-4 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-50">
                    {orders.filter(o => o.buyer_name.includes(searchTerm) || (o.nickname && o.nickname.includes(searchTerm))).map((order) => (
                      <tr key={order.id} className="hover:bg-sky-50/30 transition-colors">
                        <td className="p-4 text-center"><input type="checkbox" className="accent-sky-500" /></td>
                        <td className="p-4 font-semibold text-slate-800">{order.buyer_name} <span className="text-slate-400 font-normal">({order.nickname})</span></td>
                        <td className="p-4 text-slate-600">{order.phone || '-'}</td>
                        <td className="p-4 font-medium text-slate-700">{order.amount.toLocaleString()}원</td>
                        <td className="p-4 text-slate-600">{order.products}</td>
                        <td className="p-4">
                          <select 
                            value={order.payment_status} 
                            onChange={(e) => handleStatusChange(order.id, 'payment_status', e.target.value)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${order.payment_status === '입금' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}
                          >
                            <option value="입금">입금완료</option>
                            <option value="미입금">미입금</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <select 
                            value={order.shipping_status} 
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              // 킵 선택 시 당일 킵으로 설정 (익일 자동 발송 규칙 적용을 위한 상태값 분기)
                              handleStatusChange(order.id, 'shipping_status', newStatus);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${order.shipping_status === '발송' ? 'bg-sky-100 text-[#0284C7] border-sky-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}
                          >
                            <option value="발송">발송 (익일 자동)</option>
                            <option value="킵">킵 (당일)</option>
                          </select>
                        </td>
                        <td className="p-4 text-center flex items-center justify-center gap-2">
                          <button onClick={() => alert('상세보기')} className="text-sky-600 hover:text-sky-800 text-xs font-medium px-2 py-1 bg-sky-50 rounded-lg">상세</button>
                          <button onClick={() => {
                            setOrders(orders.filter(o => o.id !== order.id));
                            showToast('삭제되었습니다
