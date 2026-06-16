import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  Save,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
} from 'lucide-react';
import { useDeclarationStore } from '@/store/declarationStore';
import { getDaysRemaining, getAlertLevelByDate } from '@/utils/dateUtils';
import type { PersonCert, AlertLevel } from '@/types';

interface CertFormData {
  name: string;
  role: '主要负责人' | '安全管理员';
  certNumber: string;
  validTo: string;
}

const emptyCertForm: CertFormData = {
  name: '',
  role: '主要负责人',
  certNumber: '',
  validTo: '',
};

function getProgressColor(level: AlertLevel): string {
  switch (level) {
    case 'danger':
      return 'bg-red-500';
    case 'warning':
      return 'bg-yellow-500';
    default:
      return 'bg-green-500';
  }
}

function getProgressTextColor(level: AlertLevel): string {
  switch (level) {
    case 'danger':
      return 'text-red-600';
    case 'warning':
      return 'text-yellow-600';
    default:
      return 'text-green-600';
  }
}

function getBadgeStyles(level: AlertLevel): string {
  switch (level) {
    case 'danger':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default:
      return 'bg-green-100 text-green-700 border-green-200';
  }
}

export function License() {
  const navigate = useNavigate();
  const {
    license,
    personCerts,
    setLicense,
    addPersonCert,
    updatePersonCert,
    removePersonCert,
    saveVersion,
  } = useDeclarationStore();

  const [showModal, setShowModal] = useState(false);
  const [editingCert, setEditingCert] = useState<PersonCert | null>(null);
  const [certForm, setCertForm] = useState<CertFormData>(emptyCertForm);

  const daysRemaining = license.validTo ? getDaysRemaining(license.validTo) : 0;
  const alertLevel = license.validTo ? getAlertLevelByDate(license.validTo) : 'normal';
  const totalDays = license.validFrom && license.validTo
    ? getDaysRemaining(license.validFrom) * -1 + daysRemaining
    : 365;
  const progressPercent = Math.max(0, Math.min(100, (daysRemaining / Math.max(totalDays, 1)) * 100));

  const handleOpenAddModal = () => {
    setEditingCert(null);
    setCertForm(emptyCertForm);
    setShowModal(true);
  };

  const handleOpenEditModal = (cert: PersonCert) => {
    setEditingCert(cert);
    setCertForm({
      name: cert.name,
      role: cert.role,
      certNumber: cert.certNumber,
      validTo: cert.validTo,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCert(null);
    setCertForm(emptyCertForm);
  };

  const handleSubmitCert = () => {
    if (!certForm.name || !certForm.certNumber || !certForm.validTo) {
      return;
    }
    if (editingCert) {
      updatePersonCert(editingCert.id, certForm);
    } else {
      addPersonCert(certForm);
    }
    handleCloseModal();
  };

  const handleSaveDraft = () => {
    saveVersion('证照核验页保存草稿');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">原许可证信息</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">原许可证号</label>
              <input
                type="text"
                value={license.licenseNumber}
                onChange={(e) => setLicense({ licenseNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                placeholder="请输入原许可证号"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">发证日期</label>
              <input
                type="date"
                value={license.validFrom}
                onChange={(e) => setLicense({ validFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">有效期至</label>
              <input
                type="date"
                value={license.validTo}
                onChange={(e) => setLicense({ validTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">许可范围</label>
              <input
                type="text"
                value={license.scope}
                onChange={(e) => setLicense({ scope: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                placeholder="请输入许可范围"
              />
            </div>
          </div>

          {license.validTo && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">有效期进度</span>
                </div>
                <div className="flex items-center gap-2">
                  {alertLevel === 'danger' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : alertLevel === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  <span className={`text-sm font-medium ${getProgressTextColor(alertLevel)}`}>
                    {daysRemaining >= 0 ? `剩余${daysRemaining}天` : `已过期${Math.abs(daysRemaining)}天`}
                  </span>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(alertLevel)}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">人员资格证管理</h2>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加证书
            </button>
          </div>

          {personCerts.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">暂无人员资格证书，请点击上方按钮添加</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personCerts.map((cert) => {
                const certAlertLevel = getAlertLevelByDate(cert.validTo);
                const certDays = getDaysRemaining(cert.validTo);
                return (
                  <div
                    key={cert.id}
                    className="relative p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    {certAlertLevel !== 'normal' && (
                      <span
                        className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getBadgeStyles(certAlertLevel)}`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {certDays >= 0 ? `剩${certDays}天` : '已过期'}
                      </span>
                    )}
                    <div className="pr-16">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                          cert.role === '主要负责人'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {cert.role}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-16">姓名：</span>
                          <span className="text-sm font-medium text-gray-900">{cert.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-16">证书编号：</span>
                          <span className="text-sm text-gray-700">{cert.certNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-16">有效期至：</span>
                          <span className={`text-sm ${getProgressTextColor(certAlertLevel)}`}>
                            {cert.validTo}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleOpenEditModal(cert)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        编辑
                      </button>
                      <button
                        onClick={() => removePersonCert(cert.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">变更记录</h2>
          </div>

          {license.changeRecords.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <History className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">暂无变更记录</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-3 top-1 bottom-1 w-px bg-gray-200" />
              <div className="space-y-5">
                {license.changeRecords.map((record, index) => (
                  <div key={record.id} className="relative pl-10">
                    <div
                      className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                        index === 0 ? 'bg-blue-600' : 'bg-gray-400'
                      }`}
                    >
                      {license.changeRecords.length - index}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{record.type}</span>
                        <span className="text-xs text-gray-500">{record.date}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-gray-500">变更前：</span>
                          <p className="text-gray-700 mt-0.5">{record.before}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">变更后：</span>
                          <p className="text-gray-900 font-medium mt-0.5">{record.after}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                {editingCert ? '编辑资格证书' : '添加资格证书'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名</label>
                <input
                  type="text"
                  value={certForm.name}
                  onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">角色</label>
                <select
                  value={certForm.role}
                  onChange={(e) => setCertForm({ ...certForm, role: e.target.value as '主要负责人' | '安全管理员' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm bg-white"
                >
                  <option value="主要负责人">主要负责人</option>
                  <option value="安全管理员">安全管理员</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">证书编号</label>
                <input
                  type="text"
                  value={certForm.certNumber}
                  onChange={(e) => setCertForm({ ...certForm, certNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                  placeholder="请输入证书编号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">有效期至</label>
                <input
                  type="date"
                  value={certForm.validTo}
                  onChange={(e) => setCertForm({ ...certForm, validTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitCert}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingCert ? '保存修改' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/enterprise')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            上一步
          </button>
          <button
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Save className="w-4 h-4" />
            保存草稿
          </button>
          <button
            onClick={() => navigate('/premises')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            下一步
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
