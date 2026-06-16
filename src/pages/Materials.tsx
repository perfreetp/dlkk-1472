import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Upload,
  Folder,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  ArrowLeft,
  ArrowRight,
  History,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useDeclarationStore } from '@/store/declarationStore';
import { formatDate } from '@/utils/dateUtils';
import type { Material, MaterialStatus } from '@/types';

const MATERIAL_CATEGORIES = [
  '企业资质类',
  '人员资质类',
  '场所设施类',
  '安全管理类',
  '其他材料',
] as const;

type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

const CircularProgress = ({ score }: { score: number }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s < 60) return '#ef4444';
    if (s <= 80) return '#f59e0b';
    return '#22c55e';
  };

  const getGrade = (s: number) => {
    if (s < 60) return { text: '不合格', color: 'text-red-500' };
    if (s <= 80) return { text: '待完善', color: 'text-yellow-500' };
    return { text: '合格', color: 'text-green-500' };
  };

  const grade = getGrade(score);

  return (
    <div className="flex items-center gap-8">
      <div className="relative">
        <svg width="160" height="160" className="transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={getColor(score)}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-800">{score}</span>
          <span className="text-sm text-gray-500">分</span>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <span className="text-xl font-semibold">当前等级：</span>
          <span className={`text-xl font-bold ${grade.color}`}>{grade.text}</span>
        </div>
        <div className="text-sm text-gray-500 space-y-1">
          <p>• 企业信息（20分）：信用代码+名称10分，联系人信息10分</p>
          <p>• 许可证（20分）：许可证号10分，有效期{'>'}90天10分</p>
          <p>• 人员资质（20分）：主要负责人10分，安全管理员10分</p>
          <p>• 场所设施（15分）：经营地址5分，储存地址5分，安全设备5分</p>
          <p>• 材料完整性（25分）：必填材料上传比例×25</p>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: MaterialStatus }) => {
  const config = {
    pending: { label: '待上传', icon: Clock, className: 'bg-gray-100 text-gray-600' },
    uploaded: { label: '已上传', icon: CheckCircle2, className: 'bg-green-100 text-green-600' },
    invalid: { label: '不符合要求', icon: XCircle, className: 'bg-red-100 text-red-600' },
  } as const;

  const { label, icon: Icon, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

const MaterialCard = ({ material }: { material: Material }) => {
  const updateMaterial = useDeclarationStore((state) => state.updateMaterial);

  const handleUpload = () => {
    const fakeFileNames = [
      `${material.name}_${Date.now()}.pdf`,
      `${material.name}_扫描件.pdf`,
      `${material.name}_v1.pdf`,
    ];
    const fileName = fakeFileNames[Math.floor(Math.random() * fakeFileNames.length)];
    updateMaterial(material.id, { status: 'uploaded', fileName });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2">
          <FileText className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-gray-800">
              {material.name}
              {material.required && <span className="text-red-500 ml-1">*</span>}
            </h4>
            {material.remark && material.status !== 'invalid' && (
              <p className="text-xs text-gray-400 mt-1">{material.remark}</p>
            )}
            {material.status === 'invalid' && material.remark && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {material.remark}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={material.status} />
      </div>

      <div className="flex items-center justify-between">
        {material.fileName ? (
          <span className="text-sm text-gray-500 truncate flex-1 mr-3">{material.fileName}</span>
        ) : (
          <span className="text-sm text-gray-400 flex-1 mr-3">尚未上传文件</span>
        )}
        <button
          onClick={handleUpload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
        >
          <Upload className="w-4 h-4" />
          {material.fileName ? '重新上传' : '上传'}
        </button>
      </div>
    </div>
  );
};

export function Materials() {
  const navigate = useNavigate();
  const {
    declaration,
    materials,
    versionHistories,
    calculateSelfCheckScore,
    saveVersion,
    runPrecheck,
    isLoading,
  } = useDeclarationStore();

  const [expandedCategory, setExpandedCategory] = useState<MaterialCategory | null>(
    MATERIAL_CATEGORIES[0]
  );
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [versionNote, setVersionNote] = useState('');

  const getCategoryCounts = (category: MaterialCategory) => {
    const categoryMaterials = materials.filter((m) => m.category === category);
    return {
      total: categoryMaterials.length,
      uploaded: categoryMaterials.filter((m) => m.status === 'uploaded').length,
    };
  };

  const handleSaveVersion = () => {
    if (!versionNote.trim()) return;
    saveVersion(versionNote.trim());
    setVersionNote('');
    setShowVersionDialog(false);
  };

  const handleNext = () => {
    runPrecheck();
    setTimeout(() => {
      navigate('/result');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">自查打分</h2>
            <button
              onClick={() => calculateSelfCheckScore()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重新计算
            </button>
          </div>
          <CircularProgress score={declaration.selfCheckScore} />
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">材料目录</h2>
          <div className="flex gap-6">
            <div className="w-56 flex-shrink-0 border-r border-gray-200 pr-4">
              <nav className="space-y-1">
                {MATERIAL_CATEGORIES.map((category) => {
                  const counts = getCategoryCounts(category);
                  const isExpanded = expandedCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() => setExpandedCategory(isExpanded ? null : category)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isExpanded
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <Folder className="w-4 h-4" />
                      <span className="flex-1 text-sm font-medium">{category}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isExpanded
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {counts.uploaded}/{counts.total}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex-1">
              {expandedCategory && (
                <div className="space-y-3">
                  {materials
                    .filter((m) => m.category === expandedCategory)
                    .map((material) => (
                      <MaterialCard key={material.id} material={material} />
                    ))}
                </div>
              )}
              {!expandedCategory && (
                <div className="text-center text-gray-400 py-12">
                  请选择左侧分类查看材料
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <History className="w-5 h-5" />
              修改痕迹 / 版本历史
            </h2>
            <button
              onClick={() => setShowVersionDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Save className="w-4 h-4" />
              保存当前版本
            </button>
          </div>

          {versionHistories.length === 0 ? (
            <div className="text-center text-gray-400 py-8">暂无版本记录</div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {[...versionHistories]
                  .sort((a, b) => b.version - a.version)
                  .map((version) => (
                    <div key={version.id} className="relative pl-10">
                      <div className="absolute left-2 top-2 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow" />
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800">
                            版本 v{version.version}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(version.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{version.changes}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/premises')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            上一步
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVersionDialog(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Save className="w-4 h-4" />
              保存版本
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showVersionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">保存版本</h3>
            <textarea
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
              placeholder="请输入本次修改说明..."
              className="w-full h-28 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowVersionDialog(false);
                  setVersionNote('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveVersion}
                disabled={!versionNote.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
