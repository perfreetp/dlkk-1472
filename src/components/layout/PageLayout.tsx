import { useLocation, Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { StepSidebar } from './StepSidebar';
import { useDeclarationStore } from '@/store/declarationStore';

const pathToStep: Record<string, number> = {
  '/': 1,
  '/enterprise': 2,
  '/license': 3,
  '/premises': 4,
  '/materials': 5,
  '/result': 6,
};

export function PageLayout() {
  const location = useLocation();
  const { declaration } = useDeclarationStore();

  const currentStep = pathToStep[location.pathname] || 1;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <AppHeader currentStep={currentStep} />
      <div className="flex-1 flex overflow-hidden">
        <StepSidebar
          currentStep={currentStep}
          businessType={declaration.businessType}
        />
        <main className="flex-1 overflow-auto">
          <div className="min-h-full p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
