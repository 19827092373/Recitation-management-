'use client';

import React from 'react';
import { User, Trash2, CheckCircle2, Loader2, Sparkles, Trophy } from 'lucide-react';
import { Student, RANK_LABELS, StudentRank } from '@/types';
import { useStore } from '@/lib/store';
import { generateComment } from '@/lib/ai';

interface StudentCardProps {
  student: Student;
}

export default function StudentCard({ student }: StudentCardProps) {
  const { updateStudent, students, setStudents, config } = useStore();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggleTrait = (trait: string) => {
    const newTraits = student.traits.includes(trait)
      ? student.traits.filter(t => t !== trait)
      : [...student.traits, trait];
    updateStudent(student.id, { traits: newTraits });
  };

  const toggleSelection = () => {
    updateStudent(student.id, { selected: !student.selected });
  };

  const removeStudent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除学生 ${student.name} 吗？`)) {
      setStudents(students.filter(s => s.id !== student.id));
    }
  };

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    updateStudent(student.id, { status: 'generating' });
    try {
      const comment = await generateComment(student, config);
      updateStudent(student.id, { comment, status: 'completed' });
    } catch (error) {
      updateStudent(student.id, { status: 'failed' });
      alert('生成失败，请检查网络或 API 配置');
    }
  };

  const rankColors: Record<string, string> = {
    TOP: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    HIGH: 'bg-green-100 text-green-700 border-green-200',
    MIDDLE: 'bg-blue-100 text-blue-700 border-blue-200',
    LOW: 'bg-orange-100 text-orange-700 border-orange-200',
    NEEDS_SUPPORT: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div
      className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col group relative cursor-pointer ${student.selected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' : 'border-gray-200'
        }`}
      onClick={toggleSelection}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${student.selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'
              }`}
          >
            {student.selected && <CheckCircle2 size={14} />}
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${student.gender === 'MALE' ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'}`}>
            <User size={20} />
          </div>
          <div onClick={e => e.stopPropagation()}>
            <h4 className="font-bold text-gray-900 flex items-center gap-2 group/name">
              <input
                type="text"
                value={student.name}
                onClick={e => e.stopPropagation()}
                onChange={e => updateStudent(student.id, { name: e.target.value })}
                className="bg-transparent border-none focus:ring-1 focus:ring-blue-200 rounded px-1 -ml-1 w-24 outline-none hover:bg-gray-50 transition-colors"
              />
              <select
                value={student.rank}
                onClick={e => e.stopPropagation()}
                onChange={e => updateStudent(student.id, { rank: e.target.value as StudentRank })}
                className={`text-[10px] px-2 py-0.5 rounded-full border font-bold cursor-pointer outline-none transition-all ${rankColors[student.rank]}`}
              >
                {(Object.entries(RANK_LABELS) as [StudentRank, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </h4>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => updateStudent(student.id, { gender: 'MALE' })}
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${student.gender === 'MALE' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              >
                男
              </button>
              <button
                onClick={() => updateStudent(student.id, { gender: 'FEMALE' })}
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${student.gender === 'FEMALE' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              >
                女
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={removeStudent}
          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-3 flex-1" onClick={e => e.stopPropagation()}>
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">性格特征</p>
          <div className="flex flex-wrap gap-1.5">
            {(config.customPersonality || []).map((trait: string) => (
              <button
                key={trait}
                onClick={() => toggleTrait(trait)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all border ${student.traits.includes(trait)
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
              >
                {trait}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">表现/习惯</p>
          <div className="flex flex-wrap gap-1.5">
            {(config.customBehavior || []).map((trait: string) => (
              <button
                key={trait}
                onClick={() => toggleTrait(trait)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all border ${student.traits.includes(trait)
                    ? 'bg-indigo-500 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
              >
                {trait}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Trophy size={12} />
            参与项目/活动
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(config.customProjects || []).map((trait: string) => (
              <button
                key={trait}
                onClick={() => toggleTrait(trait)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all border ${student.traits.includes(trait)
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
              >
                {trait}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 space-y-3" onClick={e => e.stopPropagation()}>
        {student.comment ? (
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className={`text-xs text-gray-600 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
              {student.comment}
            </p>
            <div className="flex justify-end mt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium"
              >
                {isExpanded ? '收起' : '展开'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Sparkles size={12} />
              等待生成评语...
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {student.status === 'generating' ? (
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold px-3 py-2 bg-blue-50 rounded-xl w-full justify-center">
              <Loader2 size={14} className="animate-spin" />
              正在生成...
            </div>
          ) : (
            <button
              onClick={handleRegenerate}
              className={`w-full py-2 text-[11px] font-bold rounded-xl transition-all border ${student.status === 'completed'
                  ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                  : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-100'
                }`}
            >
              {student.status === 'completed' ? '重新生成' : '立即生成评语'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
