import { useNavigate } from 'react-router-dom';
import {
  Home,
  Building2,
  FileCheck,
  MapPin,
  FolderOpen,
  ClipboardCheck,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BusinessType } from '@/types';

interface StepSidebarProps {
  currentStep: number;
  businessType: BusinessType;
}

const steps = [
  {
    step: 1,
    name: '申报首页',
    icon: Home,
    path: '/',
  },
  {
    step: 2,
    name: '企业信息',
    icon: Building2,
    path: '/enterprise',
  },
  {
    step: 3,
    name: '证照核验',
    icon: FileCheck,
    path: '/license',
  },
  {
    step: 4,
    name: '场所与设施',
    icon: MapPin,
    path: '/premises',
  },
  {
    step: 5,
    name: '材料清单',
    icon: FolderOpen,
    path: '/materials',
  },
  {
    step: 6,
    name: '预审结果',
    icon: ClipboardCheck,
    path: '/result',
  },
];

const businessTypeNames: Record<BusinessType, string> = {
  gasoline: '汽油零售',
  diesel: '柴油零售',
  storage: '仓储经营',
  bill: '票据贸易',
  other: '其他类型',
};

export function StepSidebar({ currentStep, businessType }: StepSidebarProps) {
  const navigate = useNavigate();

  const handleStepClick = (path: string) => {
    navigate(path);
  };

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500">业务类型</span>
        </div>
        <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-brand-50 text-gov text-sm font-medium border border-brand-100">
          {businessTypeNames[businessType]}
        </div>
      </div>

      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {steps.map((item) => {
            const Icon = item.icon;
            const isActive = item.step === currentStep;
            const isCompleted = item.step < currentStep;
            const isPending = item.step > currentStep;

            return (
              <li key={item.step}>
                <button
                  onClick={() => handleStepClick(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative',
                    isActive &&
                      'bg-gov text-white shadow-gov font-medium',
                    !isActive &&
                      !isCompleted &&
                      'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
                    isCompleted &&
                      'text-gray-700 hover:bg-emerald-50 hover:text-status-success'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200',
                      isActive && 'bg-white/15 text-white',
                      isCompleted && 'bg-emerald-100 text-status-success',
                      isPending && 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                    ) : (
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex flex-col items-start flex-1">
                    <span className="font-medium">{item.name}</span>
                    <span
                      className={cn(
                        'text-xs',
                        isActive ? 'text-white/60' : 'text-gray-400'
                      )}
                    >
                      步骤 {item.step}/6
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">完成进度</span>
            <span className="text-xs font-medium text-gov">
              {Math.round(((currentStep - 1) / 5) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-gov h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
