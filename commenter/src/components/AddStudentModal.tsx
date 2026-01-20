'use client';

import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { StudentRank, RANK_LABELS } from '@/types';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddStudentModal({ isOpen, onClose }: AddStudentModalProps) {
    const { students, setStudents } = useStore();
    const [name, setName] = useState('');
    const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
    const [rank, setRank] = useState<StudentRank>('MIDDLE');

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!name.trim()) return;

        const newStudent = {
            id: crypto.randomUUID(),
            name: name.trim(),
            gender,
            rank,
            traits: [],
            status: 'pending' as const,
            selected: false
        };

        setStudents([...students, newStudent]);
        setName('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <UserPlus size={22} className="text-blue-600" />
                        手动添加学生
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">学生姓名</label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            placeholder="请输入学生姓名"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">性别</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setGender('MALE')}
                                className={`py-2 px-4 rounded-xl text-sm font-bold border transition-all ${gender === 'MALE' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-200'
                                    }`}
                            >
                                男
                            </button>
                            <button
                                onClick={() => setGender('FEMALE')}
                                className={`py-2 px-4 rounded-xl text-sm font-bold border transition-all ${gender === 'FEMALE' ? 'bg-pink-50 border-pink-500 text-pink-600' : 'bg-white border-gray-200 text-gray-500 hover:border-pink-200'
                                    }`}
                            >
                                女
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">预估成绩档位</label>
                        <div className="grid grid-cols-1 gap-2">
                            {(Object.keys(RANK_LABELS) as StudentRank[]).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRank(r)}
                                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${rank === r ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    {RANK_LABELS[r]}
                                    {rank === r && <CheckCircle2 size={16} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-all text-sm"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!name.trim()}
                        className="flex-[2] py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 text-sm"
                    >
                        确定添加
                    </button>
                </div>
            </div>
        </div>
    );
}
