import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Printer,
  AlertTriangle,
  XCircle,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  CheckCircle2,
  Clock,
  FileText,
  GitCompare,
  Eye,
} from 'lucide-react';
import { useDeclarationStore } from '@/store/declarationStore';
import { formatDate } from '@/utils/dateUtils';
import { generatePDF, printReport, previewReport } from '@/services/reportService';
import type { PrecheckItem } from '@/types';

const getConclusion = (score: number, missingCount: number) => {
  if (score >= 80 && missingCount === 0) {
    return { text: '通过', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
  }
  if (score >= 60) {
    return { text: '有条件通过', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
  }
  return { text: '不建议提交', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
};

const getPageRoute = (page?: string) => {
  const routes: Record<string, string> = {
    enterprise: '/enterprise',
    license: '/license',
    premises: '/premises',
    materials: '/materials',
  };
  return routes[page || ''] || '/materials';
};

const ProblemCard = ({
  item,
  color,
}: {
  item: PrecheckItem;
  color: 'red' | 'yellow' | 'blue';
}) => {
  const navigate = useNavigate();
  const colorConfig = {
    red: {
      border: 'border-l-red-500',
      badge: 'bg-red-100 text-red-600',
      icon: XCircle,
      iconColor: 'text-red-500',
    },
    yellow: {
      border: 'border-l-yellow-500',
      badge: 'bg-yellow-100 text-yellow-600',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
    },
    blue: {
      border: 'border-l-blue-500',
      badge: 'bg-blue-100 text-blue-600',
      icon: Lightbulb,
      iconColor: 'text-blue-500',
    },
  }[color];

  const Icon = colorConfig.icon;

  return (
    <div className={`bg-white rounded-lg border-l-4 ${colorConfig.border} border border-gray-200 p-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-5 h-5 ${colorConfig.iconColor}`} />
            <h4 className="font-medium text-gray-800">{item.title}</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2 whitespace-pre-line">{item.description}</p>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-500 mb-1">修改建议：</p>
            <p className="text-sm text-gray-700">{item.suggestion}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(getPageRoute(item.relatedPage))}
          className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          前往修正
        </button>
      </div>
    </div>
  );
};

const CollapsibleSection = ({
  title,
  count,
  icon: Icon,
  iconColor,
  badgeColor,
  children,
  defaultOpen = true,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
  iconColor: string;
  badgeColor: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <span className="font-medium text-gray-800">{title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
            {count}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
};

export function Result() {
  const navigate = useNavigate();
  const {
    declaration,
    enterprise,
    license,
    premises,
    materials,
    precheckResult,
    versionHistories,
    reportLogs,
    runPrecheck,
    addReportLog,
    isLoading,
  } = useDeclarationStore();

  const [showDownloadToast, setShowDownloadToast] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const missingItems = precheckResult?.missingItems || [];
  const doubtItems = precheckResult?.doubtItems || [];
  const suggestions = precheckResult?.suggestions || [];
  const conclusion = getConclusion(declaration.selfCheckScore, missingItems.length);

  const reportData = {
    declaration,
    enterprise,
    license,
    premises,
    precheckResult,
    selfCheckScore: declaration.selfCheckScore,
    addReportLog: (t: any, n: string) => addReportLog(t, n),
  };

  const handleDownload = async () => {
    await generatePDF(reportData);
    setShowDownloadToast(true);
    setTimeout(() => setShowDownloadToast(false), 3000);
  };

  const handlePrint = async () => {
    await printReport(reportData);
  };

  const handlePreview = () => {
    previewReport(reportData);
  };

  const toggleVersion = (versionId: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  const uploadedMaterialCount = materials.filter((m) => m.status === 'uploaded').length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">预审概览</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="md:col-span-1 flex flex-col items-center justify-center">
              <div className={`text-5xl font-bold ${conclusion.color} mb-2`}>
                {declaration.selfCheckScore}
              </div>
              <div className="text-sm text-gray-500">自查分数</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-red-500 mb-2">{missingItems.length}</div>
              <div className="text-sm text-gray-500">缺失项</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-yellow-500 mb-2">{doubtItems.length}</div>
              <div className="text-sm text-gray-500">疑点数量</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">{suggestions.length}</div>
              <div className="text-sm text-gray-500">建议数量</div>
            </div>
            <div className={`flex flex-col items-center justify-center rounded-lg p-4 ${conclusion.bgColor} border ${conclusion.borderColor}`}>
              <div className={`text-2xl font-bold ${conclusion.color} mb-1`}>
                {conclusion.text}
              </div>
              <div className="text-xs text-gray-500">综合评估结论</div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">问题汇总</h2>
          <div className="space-y-4">
            <CollapsibleSection
              title="缺失项清单"
              count={missingItems.length}
              icon={XCircle}
              iconColor="text-red-500"
              badgeColor="bg-red-100 text-red-600"
            >
              {missingItems.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-gray-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>暂无缺失项</span>
                </div>
              ) : (
                missingItems.map((item) => (
                  <ProblemCard key={item.id} item={item} color="red" />
                ))
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="疑点说明"
              count={doubtItems.length}
              icon={AlertTriangle}
              iconColor="text-yellow-500"
              badgeColor="bg-yellow-100 text-yellow-600"
            >
              {doubtItems.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-gray-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>暂无疑点</span>
                </div>
              ) : (
                doubtItems.map((item) => (
                  <ProblemCard key={item.id} item={item} color="yellow" />
                ))
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="修改建议"
              count={suggestions.length}
              icon={Lightbulb}
              iconColor="text-blue-500"
              badgeColor="bg-blue-100 text-blue-600"
            >
              {suggestions.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-gray-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>暂无建议</span>
                </div>
              ) : (
                suggestions.map((item) => (
                  <ProblemCard key={item.id} item={item} color="blue" />
                ))
              )}
            </CollapsibleSection>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">预审报告预览</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreview}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                预览
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Printer className="w-4 h-4" />
                打印
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                下载PDF
              </button>
            </div>
          </div>

          <div className="bg-gray-100 p-8 rounded-lg">
            <div className="bg-white mx-auto shadow-lg max-w-2xl p-12 relative">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-gray-100 select-none rotate-12 pointer-events-none whitespace-nowrap">
                预审专用
              </div>

              <div className="text-center mb-8 border-b border-gray-200 pb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  危险化学品经营许可证换证预审报告
                </h3>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">
                    企业基本信息
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">企业名称：</span>
                      <span className="text-gray-800">{enterprise.name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">统一社会信用代码：</span>
                      <span className="text-gray-800">{enterprise.creditCode || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">法定代表人：</span>
                      <span className="text-gray-800">{enterprise.legalPerson || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">经营类型：</span>
                      <span className="text-gray-800">
                        {declaration.businessType === 'gasoline' && '汽油零售'}
                        {declaration.businessType === 'diesel' && '柴油零售'}
                        {declaration.businessType === 'storage' && '仓储经营'}
                        {declaration.businessType === 'bill' && '票据贸易'}
                        {declaration.businessType === 'other' && '其他'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">
                    预审项目清单
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">自查分数</span>
                      <span className={`font-semibold ${conclusion.color}`}>
                        {declaration.selfCheckScore} 分
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">材料完整性</span>
                      <span className="text-gray-800">
                        {uploadedMaterialCount} / {materials.length} 项已上传
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">缺失项</span>
                      <span className="text-red-600 font-medium">{missingItems.length} 项</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">疑点</span>
                      <span className="text-yellow-600 font-medium">{doubtItems.length} 项</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">建议</span>
                      <span className="text-blue-600 font-medium">{suggestions.length} 项</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">
                    预审结论
                  </h4>
                  <div className={`rounded-lg p-4 ${conclusion.bgColor} border ${conclusion.borderColor}`}>
                    <p className={`text-lg font-semibold ${conclusion.color} mb-2`}>
                      结论：{conclusion.text}
                    </p>
                    {missingItems.length > 0 && (
                      <p className="text-sm text-gray-600">
                        请先修正所有缺失项后再提交正式申请。
                      </p>
                    )}
                    {missingItems.length === 0 && doubtItems.length > 0 && (
                      <p className="text-sm text-gray-600">
                        存在部分待核实疑点，建议补充相关说明后提交。
                      </p>
                    )}
                    {missingItems.length === 0 && doubtItems.length === 0 && (
                      <p className="text-sm text-gray-600">
                        预审各项指标符合要求，可以提交正式申请。
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right text-sm text-gray-500 pt-4 border-t border-gray-200">
                  <p>预审日期：{formatDate(new Date())}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <FileText className="w-5 h-5" />
            报告生成记录
          </h2>

          {reportLogs.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无报告生成记录</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-3">
                {reportLogs.map((log) => {
                  const badgeConfig = {
                    preview: {
                      bg: 'bg-blue-100',
                      text: 'text-blue-600',
                      border: 'border-blue-200',
                      icon: Eye,
                      label: '预览',
                    },
                    print: {
                      bg: 'bg-blue-50',
                      text: 'text-blue-600',
                      border: 'border-blue-200',
                      icon: Printer,
                      label: '打印',
                    },
                    download: {
                      bg: 'bg-green-100',
                      text: 'text-green-600',
                      border: 'border-green-200',
                      icon: Download,
                      label: '下载',
                    },
                  }[log.operationType];
                  const BadgeIcon = badgeConfig.icon;

                  return (
                    <div key={log.id} className="relative pl-10">
                      <div className="absolute left-2 top-3 w-5 h-5 rounded-full bg-white border-4 border-gray-300" />
                      <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badgeConfig.bg} ${badgeConfig.text} ${badgeConfig.border}`}
                            >
                              <BadgeIcon className="w-3 h-3" />
                              {badgeConfig.label}
                            </span>
                            <span className="font-medium text-gray-800">{log.operationName}</span>
                            {log.version && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                V{log.version}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                            自查 {log.selfCheckScore} 分
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-red-600">
                            缺失 {log.missingCount}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-50 text-yellow-600">
                            疑点 {log.doubtCount}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                            建议 {log.suggestionCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            历史记录对比
          </h2>

          {versionHistories.length < 2 ? (
            <div className="text-center text-gray-400 py-8">
              至少需要两个版本才能进行对比
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                请选择两个版本进行对比（已选 {selectedVersions.length}/2）
              </p>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-3">
                  {[...versionHistories]
                    .sort((a, b) => b.version - a.version)
                    .map((version) => {
                      const isSelected = selectedVersions.includes(version.id);
                      return (
                        <div key={version.id} className="relative pl-10">
                          <div
                            className={`absolute left-2 top-3 w-5 h-5 rounded-full border-4 ${
                              isSelected
                                ? 'bg-blue-500 border-blue-200'
                                : 'bg-white border-gray-200'
                            }`}
                          />
                          <button
                            onClick={() => toggleVersion(version.id)}
                            className={`w-full text-left rounded-lg p-4 border transition-colors ${
                              isSelected
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-gray-800">
                                版本 v{version.version}
                              </span>
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDate(version.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{version.changes}</p>
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
              {selectedVersions.length === 2 && (
                <div className="mt-4 text-center">
                  <button className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    <GitCompare className="w-4 h-4" />
                    对比选中版本
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/materials')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回修改
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => runPrecheck()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              重新预审
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              打印报告
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              下载PDF
            </button>
          </div>
        </div>
      </div>

      {showDownloadToast && (
        <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-right">
          <FileText className="w-5 h-5" />
          <span>预审报告下载成功</span>
        </div>
      )}
    </div>
  );
}
