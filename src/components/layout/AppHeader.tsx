import { Shield, HelpCircle, RotateCcw, Database } from 'lucide-react';
import { useDeclarationStore } from '@/store/declarationStore';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  currentStep: number;
}

const stepNames = [
  '申报首页',
  '企业信息',
  '证照核验',
  '场所与设施',
  '材料清单',
  '预审结果',
];

export function AppHeader({ currentStep }: AppHeaderProps) {
  const { resetDeclaration, loadMockData } = useDeclarationStore();

  const handleReset = () => {
    if (window.confirm('确定要重置所有申报数据吗？此操作不可撤销。')) {
      resetDeclaration();
    }
  };

  const handleLoadMock = () => {
    if (window.confirm('确定要加载示例数据吗？当前数据将被覆盖。')) {
      loadMockData();
    }
  };

  const handleHelp = () => {
    window.open('#', '_blank');
  };

  return (
    <header className="bg-header-gradient text-white shadow-gov h-16 flex items-center px-6 relative z-20">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
          <Shield className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold font-serif tracking-wide leading-tight">
            危化品经营许可证换证预审平台
          </h1>
          <span className="text-xs text-white/60 leading-tight">
            Hazardous Chemicals Business License Renewal Pre-check System
          </span>
        </div>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-5 py-1.5">
          <span className="text-sm text-white/70">当前进度</span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 6 }, (_, i) => i + 1).map((step) => (
              <div
                key={step}
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300',
                  step < currentStep && 'bg-status-success text-white',
                  step === currentStep && 'bg-white text-gov shadow-md scale-110',
                  step > currentStep && 'bg-white/20 text-white/60'
                )}
              >
                {step < currentStep ? '✓' : step}
              </div>
            ))}
          </div>
          <span className="text-sm font-medium">
            第 {currentStep} 步 · {stepNames[currentStep - 1]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-1 justify-end">
        <button
          onClick={handleHelp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <HelpCircle className="w-4 h-4" />
          <span>帮助中心</span>
        </button>
        <div className="w-px h-5 bg-white/20 mx-1" />
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4" />
          <span>重置</span>
        </button>
        <button
          onClick={handleLoadMock}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-white/10 text-white hover:bg-white/20 transition-all duration-200 border border-white/20"
        >
          <Database className="w-4 h-4" />
          <span>使用示例数据</span>
        </button>
      </div>
    </header>
  );
}
