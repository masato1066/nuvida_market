'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function Home() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);

  // 엑셀 업로드 함수 (SSR 충돌 방지를 위해 내부에서 await import 사용)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // 함수 내부에서 동적으로 xlsx 모듈을 불러옵니다
      const XLSX = await import('xlsx');
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          
          console.log('엑셀 파싱 데이터:', json);
          alert('엑셀 파일이 성공적으로 읽어와졌습니다!');
        } catch (err) {
          console.error('엑셀 파싱 에러:', err);
          alert('엑셀 파일을 읽는 중 오류가 발생했습니다.');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('xlsx 모듈 로드 에러:', err);
      alert('엑셀 라이브러리를 불러오지 못했습니다.');
    }
  };

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">송장 작업실 (통합 구매관리)</h1>
      
      {/* 엑셀 업로드 버튼 예시 */}
      <div className="mb-6 flex gap-4 items-center">
        <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
          엑셀 업로드
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            onChange={handleFileUpload} 
          />
        </label>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">구매내역</h2>
        <p className="text-gray-500">데이터를 불러오는 중이거나 정상 대기 중입니다.</p>
      </div>
    </main>
  );
}
