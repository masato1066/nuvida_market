'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { 
  Search, Plus, Trash2, Edit3, Eye, X,
  CheckCircle, FileText, Image as ImageIcon, LogOut, RefreshCw, Upload 
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// 업로드해주신 실제 고객 DB (총 365명 연동 기반 샘플)
const INITIAL_CUSTOMERS = [
  { id: 1, name: '강수연', phone: '010-9758-2893', address: '전남광주통합특별시 보성군 벌교읍 태백산맥길 39-2' },
  { id: 2, name: '진청하(바바)', phone: '010-9354-8734', address: '인천시 남동구 장자로6번길 109 302호' },
  { id: 3, name: '김연주(도토리)', phone: '010-4893-5600', address: '충북 제천시 하소동 206-7 1층' },
  { id: 4, name: '정혜진(쿠루쿠루)', phone: '010-7332-8610', address: '경기도 용인시 기흥구 관곡로53 가현마을신안아파트 604동 1304호' },
  { id: 5, name: '김은영(냥)', phone: '010-2114-0096', address: '서울 구로구 항동로8 우남퍼스트빌더센트럴 603동 1602호' }
];

export default function NubidaMarket() {
  const [currentTab, setCurrentTab] = useState('purchase'); // 'purchase' | 'db' | 'invoice'
  const [currentDate, setCurrentDate] = useState('2026-11-13');
  const [searchTerm, setSearchTerm] = useState('');
  const [dbSearchTerm, setDbSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  
  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); // 상세보기용
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

  // 엑셀 파일 업로드 처리 함수
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // 엑셀 데이터를 앱 형식에 맞게 변환
        const importedOrders = data.map(row => ({
          date: currentDate,
          buyer_name: row['구매자'] || row['구매자 이름'] || row['buyer_name'] || '이름없음',
          nickname: row['닉네임'] || row['nickname'] || '',
          phone: String(row['연락처'] || row['전화번호'] || row['phone'] || ''),
          amount: Number(row['구매금액'] || row['금액'] || row['amount'] || 0),
          products: row['제품정보'] || row['상품명'] || row['products'] || '',
          payment_status: row['입금상태'] || '미입금',
          shipping_status: row['배송상태'] || '발송',
          keep_count: 0
        }));

        if (supabase && importedOrders.length > 0) {
          const { data: inserted, error } = await supabase.from('orders').insert(importedOrders).select();
          if (error) throw error;
          if (inserted) setOrders([...orders, ...inserted]);
        } else {
          const mockAdded = importedOrders.map((o, i) => ({ ...o, id: Date.now() + i }));
          setOrders([...orders, ...mockAdded]);
        }

        showToast(`엑셀에서 ${importedOrders.length}건을 성공적으로 불러왔습니다.`);
      } catch (err) {
        console.error(err);
        showToast('엑셀 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F4F8FB', color: '#1e293b', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {/* 사이드바 */}
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

      {/* 메인 콘텐츠 영역 */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {toastMessage && (
          <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 50, backgroundColor: '#0284c7', color: 'white', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 500, fontSize: '14px' }}>
            {toastMessage}
          </div>
        )}

        {/* 상단 헤더 */}
        <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #bae6fd', padding: '16px 32px', display: 'flex',
