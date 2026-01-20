'use client';

import React, { useState } from 'react';
import { X, FileText, Upload, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useStore } from '@/lib/store';
import { Student, StudentRank } from '@/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { setStudents } = useStore();
  const [namesText, setNamesText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const calculateRank = (index: number, total: number): StudentRank => {
    const percentile = (index / total) * 100;
    if (percentile < 20) return 'TOP';
    if (percentile < 40) return 'HIGH';
    if (percentile < 60) return 'MIDDLE';
    if (percentile < 80) return 'LOW';
    return 'NEEDS_SUPPORT';
  };

  const processNames = (names: string[]) => {
    const cleanNames = names.map(n => n.trim()).filter(n => n.length > 0);
    if (cleanNames.length === 0) {
      setError('请输入有效的学生姓名');
      return;
    }

    const newStudents: Student[] = cleanNames.map((name, index) => ({
      id: Math.random().toString(36).substr(2, 9),
      name,
      gender: 'MALE', 
      rank: calculateRank(index, cleanNames.length),
      traits: [],
      status: 'pending'
    }));

    setStudents(newStudents);
    onClose();
  };

  const handleTextImport = () => {
    const names = namesText.split('\n');
    processNames(names);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        const names = data.map(row => row[0]?.toString()).filter(Boolean);
        processNames(names);
      } catch (err) {
        setError('解析 Excel 文件失败，请检查文件格式');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">导入学生名单</h3>
            <p className="text-sm text-gray-500">支持 Excel 导入或直接粘贴姓名名单</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                文本粘贴 (一行一个姓名)
              </label>
              <span className="text-xs text-gray-400">系统将根据输入顺序自动划档</span>
            </div>
            <textarea 
              value={namesText}
              onChange={(e) => {
                setNamesText(e.target.value);
                setError(null);
              }}
              placeholder="张三&#10;李四&#10;王五..."
              className="w-full h-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium leading-relaxed"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-100"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-bold">或者</span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Upload size={18} className="text-blue-500" />
              Excel 文件导入
            </label>
            <div className="group relative border-2 border-dashed border-gray-200 rounded-2xl p-8 transition-all hover:border-blue-400 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-3 cursor-pointer">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                <Upload size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-700">点击或拖拽文件到这里</p>
                <p className="text-xs text-gray-500 mt-1">支持 .xlsx, .xls, .csv 格式</p>
              </div>
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept=".xlsx,.xls,.csv" 
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium animate-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-all shadow-sm"
          >
            取消
          </button>
          <button 
            onClick={handleTextImport}
            disabled={!namesText.trim()}
            className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
          >
            确认导入
          </button>
        </div>
      </div>
    </div>
  );
}
