'use client';

import React, { useState } from 'react';
import {
  Settings,
  Users,
  FileText,
  Download,
  Play,
  Trash2,
  Plus,
  CheckCircle2,
  Loader2,
  Upload,
  CheckSquare,
  X,
  Wand2,
  Edit,
  Trophy,
  Tag,
  LayoutGrid
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { RANK_LABELS, DEFAULT_PROJECTS, DEFAULT_PERSONALITY, DEFAULT_BEHAVIOR, DEFAULT_PROMPT_TEMPLATE } from '@/types';
import ImportModal from '@/components/ImportModal';
import AddStudentModal from '@/components/AddStudentModal';
import StudentCard from '@/components/StudentCard';
import { generateBatchComments, generateComment } from '@/lib/ai';
import * as XLSX from 'xlsx';

export default function Home() {
  const {
    students, config, setConfig, setStudents, updateStudent, toggleSelectAll,
    addCustomItem, removeCustomItem
  } = useStore();

  const [activeTab, setActiveTab] = useState<'students' | 'features' | 'config'>('students');
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [activeFeatureType, setActiveFeatureType] = useState<'projects' | 'personality' | 'behavior'>('projects');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchConfigOpen, setIsBatchConfigOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState({ current: 0, total: 0 });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const selectedStudents = students.filter(s => s.selected);
  const allSelected = students.length > 0 && selectedStudents.length === students.length;

  const handleSelectAll = () => {
    toggleSelectAll(!allSelected);
  };

  const handleTestApi = async () => {
    if (!config.apiKey) return alert('请输入 API Key');
    setIsTestingApi(true);
    try {
      const result = await generateComment({
        id: 'test',
        name: '测试学生',
        gender: 'MALE',
        rank: 'TOP',
        traits: ['性格开朗'],
        status: 'pending'
      }, config);
      if (result) alert('✅ API 连接成功！生成示例：' + result.substring(0, 30) + '...');
    } catch (error) {
      alert('❌ API 连接失败，请检查 Base URL 和 Key 是否正确。');
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleBatchTrait = (trait: string) => {
    const allHaveIt = selectedStudents.every(s => s.traits.includes(trait));

    selectedStudents.forEach(s => {
      let newTraits = [...s.traits];
      if (allHaveIt) {
        newTraits = newTraits.filter(t => t !== trait);
      } else {
        if (!newTraits.includes(trait)) {
          newTraits.push(trait);
        }
      }
      updateStudent(s.id, { traits: newTraits });
    });
  };

  const handleFeatureToggle = (studentId: string, trait: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    let newTraits = [...student.traits];
    if (newTraits.includes(trait)) {
      newTraits = newTraits.filter(t => t !== trait);
    } else {
      newTraits.push(trait);
    }
    updateStudent(studentId, { traits: newTraits });
  };

  const handleBatchGenerate = async () => {
    if (!config.apiKey) {
      alert('请先在系统配置中设置 API Key');
      setActiveTab('config');
      return;
    }

    const targets = selectedStudents.length > 0 ? selectedStudents : students.filter(s => s.status !== 'completed');

    if (targets.length === 0) {
      alert('没有需要生成的学生');
      return;
    }

    setIsGenerating(true);
    setGeneratingProgress({ current: 0, total: targets.length });

    const CHUNK_SIZE = 5;

    try {
      for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
        const chunk = targets.slice(i, i + CHUNK_SIZE);

        chunk.forEach(s => updateStudent(s.id, { status: 'generating' }));

        try {
          const commentsMap = await generateBatchComments(chunk, config);

          Object.entries(commentsMap).forEach(([id, comment]) => {
            updateStudent(id, { comment, status: 'completed' });
          });

          chunk.forEach(s => {
            if (!commentsMap[s.id]) {
              updateStudent(s.id, { status: 'failed' });
            }
          });

        } catch (error) {
          console.error('Batch error:', error);
          chunk.forEach(s => updateStudent(s.id, { status: 'failed' }));
        }

        setGeneratingProgress(prev => ({ ...prev, current: Math.min(prev.total, i + CHUNK_SIZE) }));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (students.length === 0) return;

    const exportData = students.map(s => ({
      '姓名': s.name,
      '性别': s.gender === 'MALE' ? '男' : '女',
      '成绩档位': RANK_LABELS[s.rank],
      '特征标签': s.traits.join(', '),
      '评语': s.comment || '未生成'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '学生评语');
    XLSX.writeFile(wb, `学生评语导出_${new Date().toLocaleDateString()}.xlsx`);
  };

  const renderTagManager = (
    title: string,
    items: string[],
    type: 'customProjects' | 'customPersonality' | 'customBehavior',
    defaultItems: string[] = []
  ) => {
    const safeItems = items || [];
    const libraryItems = defaultItems.filter(i => !safeItems.includes(i));

    return (
      <div className="space-y-3 border-b border-gray-100 pb-6 last:border-0">
        <h4 className="font-bold text-base text-gray-800 flex items-center justify-between">
          {title}
        </h4>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider font-bold text-blue-600">
              <span>我的班级词库 ({safeItems.length})</span>
            </div>
            <div className="p-4 bg-blue-50/50 border-2 border-blue-100 rounded-xl min-h-[100px] flex flex-wrap gap-2 content-start">
              {safeItems.map(item => (
                <div key={item} className="group flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-700 shadow-sm hover:border-red-300 hover:text-red-600 transition-all cursor-pointer" onClick={() => removeCustomItem(type, item)}>
                  {item}
                  <X size={12} className="text-blue-300 group-hover:text-red-500" />
                </div>
              ))}
              <input
                type="text"
                placeholder="+ 自定义"
                className="w-24 px-3 py-1.5 text-sm bg-white border border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    if (val && !safeItems.includes(val)) {
                      addCustomItem(type, val);
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider font-bold text-gray-500">
              <span>推荐词库 ({libraryItems.length})</span>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl min-h-[100px] flex flex-wrap gap-2 content-start max-h-[200px] overflow-y-auto custom-scrollbar">
              {libraryItems.length === 0 ? (
                <p className="text-xs text-gray-400 w-full text-center py-2">已全部添加</p>
              ) : (
                libraryItems.map(item => (
                  <button
                    key={item}
                    onClick={() => addCustomItem(type, item)}
                    className="group flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm transition-all"
                  >
                    <Plus size={12} className="text-gray-300 group-hover:text-blue-500" />
                    {item}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {isBatchConfigOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[600px] max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit size={20} className="text-blue-600" />
                批量配置 ({selectedStudents.length}人)
              </h3>
              <button onClick={() => setIsBatchConfigOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Trophy size={16} /> 参与项目/活动
                </h4>
                <div className="flex flex-wrap gap-2">
                  {config.customProjects.map(trait => {
                    const isSelected = selectedStudents.every(s => s.traits.includes(trait));
                    const isPartial = !isSelected && selectedStudents.some(s => s.traits.includes(trait));
                    return (
                      <button
                        key={trait}
                        onClick={() => handleBatchTrait(trait)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isSelected
                          ? 'bg-amber-500 text-white border-amber-600'
                          : isPartial
                            ? 'bg-amber-100 text-amber-700 border-amber-300'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        {trait}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider">性格特征</h4>
                <div className="flex flex-wrap gap-2">
                  {config.customPersonality.map(trait => {
                    const isSelected = selectedStudents.every(s => s.traits.includes(trait));
                    return (
                      <button
                        key={trait}
                        onClick={() => handleBatchTrait(trait)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isSelected
                          ? 'bg-blue-500 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        {trait}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider">表现/习惯</h4>
                <div className="flex flex-wrap gap-2">
                  {config.customBehavior.map(trait => {
                    const isSelected = selectedStudents.every(s => s.traits.includes(trait));
                    return (
                      <button
                        key={trait}
                        onClick={() => handleBatchTrait(trait)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isSelected
                          ? 'bg-indigo-500 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        {trait}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setIsBatchConfigOpen(false)}
                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
              >
                完成配置
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <Wand2 size={20} className="text-purple-600" />
                高级设置：AI 提示词模板 (Prompt Template)
              </h3>
              <button
                onClick={() => setConfig({ ...config, promptTemplate: DEFAULT_PROMPT_TEMPLATE })}
                className="text-xs text-gray-500 hover:text-blue-600 underline transition-colors"
              >
                Reset Template
              </button>
            </div>

            <div className="space-y-3">
              <textarea
                value={config.promptTemplate || DEFAULT_PROMPT_TEMPLATE}
                onChange={(e) => setConfig({ ...config, promptTemplate: e.target.value })}
                rows={10}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-transparent outline-none transition-all font-mono text-sm leading-relaxed resize-y"
              />
              <p className="text-xs text-gray-500">
                Available variables: <code className="bg-gray-100 px-1 py-0.5 rounded text-purple-600">{'{{name}}'}</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-purple-600">{'{{gender}}'}</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-purple-600">{'{{rank_strategy}}'}</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-purple-600">{'{{traits}}'}</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-purple-600">{'{{projects}}'}</code>
              </p>
            </div>
          </div>
        </div>
      )}

      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <FileText size={20} />
            </div>
            AI 评语助手
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${activeTab === 'students' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Users size={18} />
            <span>名单管理</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('features');
              if (!activeFeature) {
                setActiveFeatureType('projects');
                setActiveFeature(config.customProjects[0] || null);
              }
            }}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${activeTab === 'features' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Tag size={18} />
            <span>特征分配</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${activeTab === 'config' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Settings size={18} />
            <span>系统配置</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="bg-blue-600 text-white p-4 rounded-xl space-y-3">
            <p className="text-sm opacity-90">一键生成全班评语，支持按成绩自动排名分层。</p>
            <button
              onClick={handleBatchGenerate}
              disabled={isGenerating || students.length === 0}
              className="w-full bg-white text-blue-600 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} className="fill-current" />
              )}
              {isGenerating ? `生成中 ${generatingProgress.current}/${generatingProgress.total}` : (selectedStudents.length > 0 ? `生成选中 (${selectedStudents.length})` : '生成全部')}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-semibold capitalize text-gray-800 flex items-center gap-2">
            {activeTab === 'students' ? '学生名单管理' : activeTab === 'features' ? '特征分配中心' : 'API & 模型配置'}
            {activeTab === 'students' && students.length > 0 && (
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                共 {students.length} 人
              </span>
            )}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExport}
              disabled={students.length === 0}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              导出 Excel
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50/50 pb-24">
          <div className="p-8 max-w-6xl mx-auto">

            {activeTab === 'students' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSelectAll}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 border ${allSelected
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <CheckSquare size={16} className={allSelected ? "fill-blue-600 text-white" : ""} />
                      {allSelected ? '取消全选' : '全选所有'}
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1" />
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
                    >
                      <Plus size={16} />
                      手动添加
                    </button>
                    <label
                      onClick={() => setIsImportModalOpen(true)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Upload size={16} />
                      导入名单
                    </label>
                  </div>
                  <div className="flex items-center gap-6">
                    <button className="text-sm text-red-600 font-medium hover:text-red-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all" onClick={() => setStudents([])}>
                      <Trash2 size={16} />
                      清空全部
                    </button>
                  </div>
                </div>

                {students.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-2xl p-24 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                      <Users size={40} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900">暂无学生名单</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        请通过上方按钮导入 Excel 排名或手动粘贴学生姓名。系统将根据输入顺序自动划定成绩分档。
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                      >
                        立即导入
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                    {students.map(student => (
                      <StudentCard key={student.id} student={student} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'features' && (
              <div className="flex gap-6 h-[calc(100vh-180px)]">
                <div className="w-64 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex gap-1 bg-gray-200 p-1 rounded-lg">
                      {(['projects', 'personality', 'behavior'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            setActiveFeatureType(type);
                            const list = type === 'projects' ? config.customProjects : type === 'personality' ? config.customPersonality : config.customBehavior;
                            setActiveFeature(list[0] || null);
                          }}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeFeatureType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          {type === 'projects' ? '项目' : type === 'personality' ? '性格' : '表现'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {(activeFeatureType === 'projects' ? config.customProjects :
                      activeFeatureType === 'personality' ? config.customPersonality : config.customBehavior).map(item => (
                        <button
                          key={item}
                          onClick={() => setActiveFeature(item)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between group transition-colors ${activeFeature === item
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          {item}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${activeFeature === item ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                            }`}>
                            {students.filter(s => s.traits.includes(item)).length}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Tag size={18} className="text-indigo-500" />
                      正在分配：
                      <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                        {activeFeature || '请选择特征'}
                      </span>
                    </h3>
                    <span className="text-xs text-gray-500">点击学生卡片即可分配/取消</span>
                  </div>

                  {!activeFeature ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                      <LayoutGrid size={48} className="mb-4 opacity-20" />
                      <p>请从左侧选择一个特征开始分配</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {students.map(student => {
                          const hasTrait = student.traits.includes(activeFeature);
                          return (
                            <div
                              key={student.id}
                              onClick={() => handleFeatureToggle(student.id, activeFeature)}
                              className={`
                                 cursor-pointer p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 text-center
                                 ${hasTrait
                                  ? 'border-indigo-500 bg-indigo-50/50 shadow-sm scale-[1.02]'
                                  : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                                }
                               `}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${hasTrait ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'
                                }`}>
                                {hasTrait ? <CheckCircle2 size={16} /> : student.gender === 'MALE' ? '男' : '女'}
                              </div>
                              <div>
                                <p className={`font-bold text-sm ${hasTrait ? 'text-indigo-700' : 'text-gray-700'}`}>{student.name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{RANK_LABELS[student.rank].split(' ')[0]}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                    <Tag size={20} className="text-green-600" />
                    特征库管理
                  </h3>
                  <div className="space-y-6 divide-y divide-gray-100">
                    {renderTagManager('项目/活动库', config.customProjects, 'customProjects', DEFAULT_PROJECTS)}
                    <div className="pt-6">
                      {renderTagManager('性格特征库', config.customPersonality, 'customPersonality', DEFAULT_PERSONALITY)}
                    </div>
                    <div className="pt-6">
                      {renderTagManager('表现/习惯库', config.customBehavior, 'customBehavior', DEFAULT_BEHAVIOR)}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                        <Settings size={20} className="text-blue-600" />
                        API 服务配置
                      </h3>
                      <button
                        onClick={handleTestApi}
                        disabled={isTestingApi}
                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        {isTestingApi ? '测试中...' : '测试连接 (Test Connection)'}
                      </button>
                    </div>

                    <div className="grid gap-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700">接口地址 (Base URL)</label>
                        <input
                          type="text"
                          value={config.baseUrl}
                          onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                          placeholder="https://api.deepseek.com/v1"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700">API Key</label>
                        <input
                          type="password"
                          value={config.apiKey}
                          onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                          placeholder="sk-..."
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700">模型名称 (Model Name)</label>
                        <input
                          type="text"
                          value={config.model}
                          onChange={(e) => setConfig({ ...config, model: e.target.value })}
                          placeholder="deepseek-chat"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-800">高级设置：AI 提示词模板 (Prompt Template)</h4>
                      <button
                        onClick={() => setConfig({ ...config, promptTemplate: DEFAULT_PROMPT_TEMPLATE })}
                        className="text-xs text-blue-600 font-medium hover:underline"
                      >
                        恢复默认模板
                      </button>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-1">
                      <textarea
                        value={config.promptTemplate || DEFAULT_PROMPT_TEMPLATE}
                        onChange={(e) => setConfig({ ...config, promptTemplate: e.target.value })}
                        className="w-full h-64 bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-xs outline-none resize-y leading-relaxed"
                        placeholder="请输入提示词模板..."
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed">
                      <span className="font-bold text-gray-700">可用变量：</span><br />
                      <code className="bg-white px-1 py-0.5 rounded border border-gray-200 mx-1">{'{{name}}'}</code> 学生姓名
                      <code className="bg-white px-1 py-0.5 rounded border border-gray-200 mx-1">{'{{gender}}'}</code> 性别
                      <code className="bg-white px-1 py-0.5 rounded border border-gray-200 mx-1">{'{{rank_strategy}}'}</code> 基于成绩的建议策略
                      <code className="bg-white px-1 py-0.5 rounded border border-gray-200 mx-1">{'{{traits}}'}</code> 性格与习惯
                      <code className="bg-white px-1 py-0.5 rounded border border-gray-200 mx-1">{'{{projects}}'}</code> 参与活动（为空时会自动填“无”）
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-gray-800">常用预设 (Presets)</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const { resetFeatureDefaults } = useStore.getState();
                          if (confirm('确定要清空当前所有自定义特征吗？清空后您可以从推荐库中重新添加。')) {
                            resetFeatureDefaults();
                          }
                        }}
                        className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 hover:border-red-300 transition-all flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        清空所有特征 (Clear All)
                      </button>
                      <button
                        onClick={() => setConfig({ ...config, baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' })}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold hover:border-blue-500 hover:text-blue-600 transition-all"
                      >
                        DeepSeek V3
                      </button>
                      <button
                        onClick={() => setConfig({ ...config, baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-max' })}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold hover:border-blue-500 hover:text-blue-600 transition-all"
                      >
                        通义千问
                      </button>
                      <button
                        onClick={() => setConfig({ ...config, baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' })}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold hover:border-blue-500 hover:text-blue-600 transition-all"
                      >
                        Kimi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedStudents.length > 0 && activeTab === 'students' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-10 z-40">
            <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                {selectedStudents.length}
              </div>
              已选择
            </span>
            <div className="w-px h-6 bg-gray-200" />
            <button
              onClick={() => setIsBatchConfigOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit size={16} />
              批量配置
            </button>
            <button
              onClick={handleBatchGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Wand2 size={16} />
              生成评语
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <button
              onClick={() => {
                if (confirm(`确定要删除选中的 ${selectedStudents.length} 位学生吗？`)) {
                  const ids = selectedStudents.map(s => s.id);
                  setStudents(students.filter(s => !ids.includes(s.id)));
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              删除
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
