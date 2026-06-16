import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fuel,
  Container,
  Warehouse,
  Receipt,
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  ArrowRight,
  History,
  AlertTriangle,
} from 'lucide-react';
import { useDeclarationStore } from '@/store/declarationStore';
import type { BusinessType } from '@/types';
import { cn } from '@/lib/utils';

interface BusinessOption {
  value: BusinessType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const businessOptions: BusinessOption[] = [
  {
    value: 'gasoline',
    label: '汽油零售',
    description: '从事汽油零售业务的经营企业',
    icon: Fuel,
  },
  {
    value: 'diesel',
    label: '柴油零售',
    description: '从事柴油零售业务的经营企业',
    icon: Container,
  },
  {
    value: 'storage',
    label: '仓储经营',
    description: '从事危险化学品仓储经营业务',
    icon: Warehouse,
  },
  {
    value: 'bill',
    label: '票据贸易',
    description: '不带有储存设施的票据贸易经营',
    icon: Receipt,
  },
  {
    value: 'other',
    label: '其他经营方式',
    description: '其他类型的危险化学品经营业务',
    icon: Briefcase,
  },
];

interface FaqItem {
  title: string;
  content: string[];
}

const faqItems: FaqItem[] = [
  {
    title: '政策要点',
    content: [
      '根据《危险化学品安全管理条例》和《危险化学品经营许可证管理办法》，从事危险化学品经营的企业应当依法取得危险化学品经营许可证。',
      '危险化学品经营许可证有效期为3年，有效期满后企业需要继续从事危险化学品经营活动的，应当在经营许可证有效期满前3个月内向原发证机关提出换证申请。',
      '企业应当确保经营场所、储存设施、安全管理等符合相关法律法规和标准规范的要求。',
    ],
  },
  {
    title: '办理时限',
    content: [
      '申请受理：申请材料齐全、符合法定形式的，自收到申请之日起5个工作日内予以受理。',
      '审查时限：自受理申请之日起20个工作日内完成审查（不含现场核查时间）。',
      '发证时限：经审查符合条件的，自作出批准决定之日起10个工作日内颁发经营许可证。',
    ],
  },
  {
    title: '常见问题',
    content: [
      'Q: 换证申请需要提前多久提交？A: 建议在许可证到期前3个月提交申请。',
      'Q: 企业名称变更需要重新申请吗？A: 企业名称、注册地址、法定代表人等发生变更的，应当自变更之日起20个工作日内申请变更。',
      'Q: 可以委托他人办理吗？A: 可以，但需要提供授权委托书及代理人身份证明。',
    ],
  },
];

export function Home() {
  const navigate = useNavigate();
  const { declaration, materials, setBusinessType } = useDeclarationStore();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleBusinessTypeSelect = (type: BusinessType) => {
    const hasModifiedMaterials = materials.some(m => (m.fileName && m.fileName.length > 0) || m.status === 'uploaded');
    if (type !== declaration.businessType && hasModifiedMaterials) {
      if (!confirm('切换经营方式将清空当前材料清单（文件名、上传状态均会重置），是否继续？')) return;
    }
    setBusinessType(type);
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleStartDeclaration = () => {
    navigate('/enterprise');
  };

  const handleViewHistory = () => {
    alert('暂无历史申报记录');
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <section className="card p-8 bg-gov-gradient text-white">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold font-serif mb-3">
              危化品经营许可证换证预审
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed">
              本平台为危险化学品经营企业提供许可证换证预审服务，
              通过智能审核帮助企业提前发现申报材料中的问题，
              提高申报效率，降低退件风险。
            </p>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="section-title">
            <FileText className="w-5 h-5 text-gov" />
            选择经营方式
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            请选择您企业的危险化学品经营方式，系统将根据经营方式自动生成对应的材料清单
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {businessOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = declaration.businessType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleBusinessTypeSelect(option.value)}
                  className={cn(
                    'relative p-5 rounded-lg border-2 text-left transition-all duration-200',
                    'hover:border-brand-400 hover:shadow-md',
                    isSelected
                      ? 'border-gov bg-brand-50'
                      : 'border-gray-200 bg-white'
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-gov rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center mb-3',
                      isSelected ? 'bg-gov text-white' : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3
                    className={cn(
                      'font-semibold text-base mb-1',
                      isSelected ? 'text-gov' : 'text-gray-900'
                    )}
                  >
                    {option.label}
                  </h3>
                  <p className="text-sm text-gray-500 leading-snug">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="section-title">
            <Receipt className="w-5 h-5 text-gov" />
            申报须知
          </h2>
          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div
                key={item.title}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-800">{item.title}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-5 py-4 bg-white border-t border-gray-100">
                    <ul className="space-y-2">
                      {item.content.map((line, idx) => (
                        <li key={idx} className="text-sm text-gray-600 leading-relaxed flex gap-2">
                          <span className="text-gov mt-1.5">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={handleViewHistory}
            className="btn-secondary flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            查看上次申报记录
          </button>
          <button
            type="button"
            onClick={handleStartDeclaration}
            className="btn-primary flex items-center gap-2"
          >
            开始申报
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </div>
  );
}

