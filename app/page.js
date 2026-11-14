'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Search, Plus, Trash2, Edit3, Eye, X,
  CheckCircle, FileText, Image as ImageIcon, LogOut, RefreshCw 
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const INITIAL_CUSTOMERS = [
  { id: 1, name: '강수연', phone: '010-9758-2893', address: '전남광주통합특별시 보성군 벌교읍 태백산맥길 39-2' },
  { id: 2, name: '진청하(바바)', phone: '010-9354-8734', address: '인천시 남동구 장자로6번길 109 302호' },
  { id: 3, name: '김연주(도토리)', phone: '010-4893-5600', address: '충북 제천시 하소동 206-7 1층' },
  { id: 4, name: '정혜진(쿠루쿠루)', phone: '010-7332-8610', address: '경기도 용인시 기흥구 관곡로53 가현마을신안아파트 604동 1304호' },
  { id: 5, name: '김은영(냥)', phone: '010-2114-0096', address: '서울 구로구 항동로8 우남퍼스트빌더센트럴 603동 1602호' }
];

export default function NubidaMarket() {
  const [currentTab, setCurrentTab] = useState('purchase');
  const [currentDate, setCurrentDate] = useState('2026-11-13');
  const [searchTerm, setSearchTerm] = useState('');
  const [dbSearchTerm, setDbSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

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
        { id: 1, date: currentDate, buyer_name: '비룡(박병도)', nickname: '이월 1', phone: '010-1234-5678', amount: 10000, products: '20번 라코스테 뽀글이 블랙_100', payment_status: '입금', shipping_status: '발송', keep_count: 1, keep_date: '2026-11-10' },
        { id: 2, date: currentDate, buyer_name: '남미애', nickname: '이월 1', phone: '010-9876-5432', amount: 60000, products: '22번 톰브라운 니트티 버건디_L 외 2개', payment_status: '입금', shipping_status: '발송', keep_count: 1, keep_date: '2026-11-10' },
        { id: 3, date: currentDate, buyer_name: '아이비(황옥금)', nickname: '이월 4', phone: '010-5555-4444', amount: 11000, products: '빼빼로 노랑박스 외 3개', payment_status: '입금', shipping_status: '발송', keep_count: 4, keep_date: '2026-11-09' }
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          
          const formattedOrders = json.map((item, index) => ({
            id: Date.now() + index,
            date: item.date || currentDate,
            buyer_name: item.buyer_name || item.구매자 || item.이름 || '미확인',
            nickname: item.nickname || item.닉네임 || '',
            phone: item.phone || item.연락처 || '',
            amount: Number(item.amount || item.구매금액 || item.금액 || 0),
            products: item.products || item.제품정보 || item.상품명 || '상품 정보 없음',
            payment_status: item.payment_status || item.입금상태 || '미입금',
            shipping_status: item.shipping_status || item.배송상태 || '발송',
          }));

          setOrders((prev) => [...formattedOrders, ...prev]);
          showToast(`엑셀 업로드 성공! (${formattedOrders.length}건 추가됨)`);
        } catch (err) {
          console.error(err);
          showToast('엑셀 파일을 읽는 중 오류가 발생했습니다.');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      showToast('엑셀 라이브러리를 로드하지 못했습니다.');
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
      keep_count: 0
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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F4F8FB', color: '#1e293b', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      <aside style={{ width: '256px', backgroundColor: '#ffffff', borderRight: '1px solid #bae6fd', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #f0f9ff' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0284c7', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🛍️ 누비다마켓
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>스마트 송장 및 주문 관리</p>
        </div>
        
        <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setCurrentTab('purchase')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', fontWeight: 500, fontSize: '14px', border: 'none', cursor: 'pointer', backgroundColor: currentTab === 'purchase' ? '#e0f2fe' : 'transparent', color: currentTab === 'purchase' ? '#0369a1' : '#475569', textAlign: 'left' }}
          >
            <FileText size={18} /> 통합 구매관리
          </button>
          <button 
            onClick={() => setCurrentTab('db')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', fontWeight: 500, fontSize: '14px', border: 'none', cursor: 'pointer', backgroundColor: currentTab === 'db' ? '#e0f2fe' : 'transparent', color: currentTab === 'db' ? '#0369a1' : '#475569', textAlign: 'left' }}
          >
            <CheckCircle size={18} /> 고객정보 DB
          </button>
          <button 
            onClick={() => setCurrentTab('invoice')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', fontWeight: 500, fontSize: '14px', border: 'none', cursor: 'pointer', backgroundColor: currentTab === 'invoice' ? '#e0f2fe' : 'transparent', color: currentTab === 'invoice' ? '#0369a1' : '#475569', textAlign: 'left' }}
          >
            <ImageIcon size={18} /> 송장 · 이미지
          </button>
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #f0f9ff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={fetchOrders} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', backgroundColor: '#f0f9ff', color: '#0369a1', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            <RefreshCw size={16} /> 새로고침
          </button>
          <button onClick={() => alert('로그아웃 되었습니다.')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', backgroundColor: 'transparent', color: '#f43f5e', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            <LogOut size={16} /> 로그아웃
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {toastMessage && (
          <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 50, backgroundColor: '#0284c7', color: 'white', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 500, fontSize: '14px' }}>
            {toastMessage}
          </div>
        )}

        <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #bae6fd', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f9ff', borderRadius: '12px', padding: '4px', border: '1px solid #bae6fd' }}>
              <button onClick={() => handleDateChange(-1)} style={{ padding: '6px 12px', color: '#0369a1', backgroundColor: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>←</button>
              <span style={{ padding: '0 16px', fontWeight: 600, color: '#334155', fontSize: '14px' }}>{currentDate}</span>
              <button onClick={() => handleDateChange(1)} style={{ padding: '6px 12px', color: '#0369a1', backgroundColor: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>→</button>
            </div>
            <span style={{ fontSize: '12px', color: '#0369a1', backgroundColor: '#f0f9ff', padding: '8px 12px', borderRadius: '8px', fontWeight: 500, border: '1px solid #bae6fd' }}>
              💡 킵(Keep) 안내: 전일 킵 건은 익일 자동 발송됩니다. (최대 1일)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} size={16} />
              <input 
                type="text" 
                placeholder="구매자 이름 또는 닉네임 검색" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: '#f8fafc', border: '1px solid #bae6fd', borderRadius: '12px', fontSize: '14px', outline: 'none', width: '256px' }}
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0284c7', color: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer' }}
            >
              <Plus size={16} /> 수동 구매 추가
            </button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {currentTab === 'purchase' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>통합 구매관리 리스트 ({orders.length}건)</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #bae6fd', color: '#0369a1', borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                    엑셀 업로드
                    <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleFileUpload} />
                  </label>
                  <button style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #bae6fd', color: '#0369a1', borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>양식 다운로드</button>
                  <button style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #bae6fd', color: '#0369a1', borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>리스트 다운로드</button>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #bae6fd', overflow: 'hidden', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f9ff', borderBottom: '1px solid #bae6fd', color: '#64748b', fontWeight: 500 }}>
                      <th style={{ padding: '16px', width: '48px', textAlign: 'center' }}><input type="checkbox" /></th>
                      <th style={{ padding: '16px' }}>구매자 (닉네임)</th>
                      <th style={{ padding: '16px' }}>연락처</th>
                      <th style={{ padding: '16px' }}>구매금액</th>
                      <th style={{ padding: '16px' }}>제품정보</th>
                      <th style={{ padding: '16px' }}>입금상태</th>
                      <th style={{ padding: '16px' }}>배송상태 (킵/발송)</th>
                      <th style={{ padding: '16px', textAlign: 'center' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(o => (o.buyer_name || '').includes(searchTerm) || ((o.nickname || '').includes(searchTerm))).map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #f0f9ff' }}>
                        <td style={{ padding: '16px', textAlign: 'center' }}><input type="checkbox" /></td>
                        <td style={{ padding: '16px', fontWeight: 600, color: '#1e293b' }}>
                          {order.buyer_name} {order.nickname && <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>({order.nickname})</span>}
                        </td>
                        <td style={{ padding: '16px', color: '#475569' }}>{order.phone || '-'}</td>
                        <td style={{ padding: '16px', fontWeight: 500, color: '#334155' }}>{(Number(order.amount) || 0).toLocaleString()}원</td>
                        <td style={{ padding: '16px', color: '#475569' }}>{order.products}</td>
                        
                        <td style={{ padding: '16px' }}>
                          <select 
                            value={order.payment_status} 
                            onChange={(e) => handleStatusChange(order.id, 'payment_status', e.target.value)}
                            style={{ 
                              padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: '1px solid #bae6fd', 
                              backgroundColor: order.payment_status === '입금' ? '#f0f9ff' : order.payment_status === '주문취소' ? '#f1f5f9' : '#fff1f2', 
                              color: order.payment_status === '입금' ? '#0369a1' : order.payment_status === '주문취소' ? '#64748b' : '#e11d48' 
                            }}
                          >
                            <option value="입금">입금완료</option>
                            <option value="미입금">미입금</option>
                            <option value="주문취소">주문취소</option>
                          </select>
                        </td>

                        <td style={{ padding: '16px' }}>
                          <select 
                            value={order.shipping_status} 
                            onChange={(e) => handleStatusChange(order.id, 'shipping_status', e.target.value)}
                            style={{ 
                              padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: '1px solid #bae6fd', 
                              backgroundColor: order.shipping_status === '발송' ? '#e0f2fe' : order.shipping_status === '미발송' ? '#f1f5f9' : '#fef3c7', 
                              color: order.shipping_status === '발송' ? '#0284c7' : order.shipping_status === '미발송' ? '#64748b' : '#d97706' 
                            }}
                          >
                            <option value="발송">발송 (익일 자동)</option>
                            <option value="킵">킵 (당일)</option>
                            <option value="미발송">미발송</option>
                          </select>
                        </td>

                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <button 
                              onClick={() => setSelectedOrder(order)} 
                              title="상세보기"
                              style={{ color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <Eye size={14} />
                            </button>
                            <button 
                              onClick={() => showToast(`[편집] ${order.buyer_name}님 주문 편집 모드`)} 
                              title="편집"
                              style={{ color: '#0369a1', background: '#e0f2fe', border: '1px solid #bae6fd', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                setOrders(orders.filter(o => o.id !== order.id));
                                showToast('삭제되었습니다.');
                              }} 
                              title="삭제"
                              style={{ color: '#f43f5e', background: '#fff1f2', border: '1px solid #fecdd3', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentTab === 'db' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>고객정보 DB 관리 (총 365명 연동됨)</h2>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} size={16} />
                  <input 
                    type="text" 
                    placeholder="고객 이름 또는 연락처 검색" 
                    value={dbSearchTerm}
                    onChange={(e) => setDbSearchTerm(e.target.value)}
                    style={{ paddingLeft: '36px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: 'white', border: '1px solid #bae6fd', borderRadius: '12px', fontSize: '14px', outline: 'none', width: '280px' }}
                  />
                </div>
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #bae6fd', overflow: 'hidden', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f9ff', borderBottom: '1px solid #bae6fd', color: '#64748b', fontWeight: 500 }}>
                      <th style={{ padding: '16px', width: '60px', textAlign: 'center' }}>No</th>
                      <th style={{ padding: '16px', width: '200px' }}>고객이름(닉네임)</th>
                      <th style={{ padding: '16px', width: '180px' }}>연락처</th>
                      <th style={{ padding: '16px' }}>주소</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.filter(c => (c.name || '').includes(dbSearchTerm) || (c.phone || '').includes(dbSearchTerm)).map((c, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f0f9ff' }}>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ padding: '16px', fontWeight: 600, color: '#1e293b' }}>{c.name}</td>
                        <td style={{ padding: '16px', color: '#475569' }}>{c.phone}</td>
                        <td style={{ padding: '16px', color: '#334155' }}>{c.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentTab === 'invoice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>송장 · 이미지 발급</h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>CJ대한통운 송장 엑셀 발급 및 고객별 전송 이미지를 관리합니다.</p>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #bae6fd' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginTop: 0, marginBottom: '16px' }}>수동 구매 건 추가</h3>
            <form onSubmit={handleAddOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>구매자 이름</label>
                <input type="text" required value={formBuyer} onChange={e => setFormBuyer(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #bae6fd', borderRadius: '12px', fontSize: '14px', outline: 'none' }} placeholder="예: 홍길동" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>닉네임</label>
                <input type="text" required value={formNickname} onChange={e => setFormNickname(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #bae6fd', borderRadius: '12px', fontSize: '14px', outline: 'none' }} placeholder="예: 길동이" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>연락처</label>
                <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #bae6fd', borderRadius: '12px', fontSize: '14px', outline: 'none' }} placeholder="010-0000-0000" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>구매금액</label>
                <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #bae6fd', borderRadius: '12px', fontSize: '14px', outline: 'none' }} placeholder="10000" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>제품정보</label>
                <input type="text" value={formProducts} onChange={e => setFormProducts(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #bae6fd', borderRadius: '12px', fontSize: '14px', outline: 'none' }} placeholder="상품명 외 1개" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', backgroundColor: '#f0f9ff', color: '#0369a1', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>취소</button>
                <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>추가하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #bae6fd', position: 'relative' }}>
            <button onClick={() => setSelectedOrder(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginTop: 0, marginBottom: '16px' }}>
              {selectedOrder.buyer_name} {selectedOrder.nickname && `(${selectedOrder.nickname})`}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#475569' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>주문 정보</div>
                <div>날짜: {selectedOrder.date}</div>
                <div>연락처: {selectedOrder.phone || '-'}</div>
                <div>입금상태: <span style={{ fontWeight: 600, color: selectedOrder.payment_status === '입금' ? '#0369a1' : selectedOrder.payment_status === '주문취소' ? '#64748b' : '#e11d48' }}>{selectedOrder.payment_status}</span></div>
                <div>배송상태: <span style={{ fontWeight: 600, color: selectedOrder.shipping_status === '발송' ? '#0284c7' : selectedOrder.shipping_status === '미발송' ? '#64748b' : '#d97706' }}>{selectedOrder.shipping_status}</span></div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>상품 내역</div>
                <div style={{ fontWeight: 500, color: '#1e293b' }}>{selectedOrder.products}</div>
                {selectedOrder.keep_count > 0 && (
                  <div style={{ fontSize: '12px', color: '#d97706' }}>킵 이월 내역: {selectedOrder.keep_date} 구매 · 킵 {selectedOrder.keep_count}건</div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', fontWeight: 'bold', color: '#0369a1' }}>
                <span>총 구매금액</span>
                <span style={{ fontSize: '16px' }}>{(Number(selectedOrder.amount) || 0).toLocaleString()}원</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setSelectedOrder(null)} style={{ padding: '8px 20px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
