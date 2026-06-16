export type BusinessType = 'gasoline' | 'diesel' | 'storage' | 'bill' | 'other';

export type DeclarationStatus = 'draft' | 'submitted';

export type MaterialStatus = 'pending' | 'uploaded' | 'invalid';

export type AlertLevel = 'normal' | 'warning' | 'danger';

export interface Declaration {
  id: string;
  businessType: BusinessType;
  status: DeclarationStatus;
  currentStep: number;
  selfCheckScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Enterprise {
  declarationId: string;
  creditCode: string;
  name: string;
  legalPerson: string;
  establishDate: string;
  registeredAddress: string;
  businessAddress: string;
  contactPerson: string;
  contactPhone: string;
  email: string;
}

export interface ChangeRecord {
  id: string;
  date: string;
  type: string;
  before: string;
  after: string;
}

export interface License {
  declarationId: string;
  licenseNumber: string;
  validFrom: string;
  validTo: string;
  scope: string;
  changeRecords: ChangeRecord[];
}

export interface PersonCert {
  id: string;
  declarationId: string;
  role: '主要负责人' | '安全管理员';
  name: string;
  certNumber: string;
  validTo: string;
}

export interface Facility {
  id: string;
  name: string;
  quantity: number;
  specification?: string;
}

export interface SafetyEquipment {
  id: string;
  name: string;
  quantity: number;
}

export interface Premises {
  declarationId: string;
  businessAddress: string;
  businessPropertyType: 'own' | 'lease';
  businessPropertyFileName: string;
  storageAddress: string;
  storageCapacity: string;
  storagePropertyType: 'own' | 'lease';
  storagePropertyFileName: string;
  facilities: Facility[];
  safetyEquipments: SafetyEquipment[];
}

export interface Material {
  id: string;
  declarationId: string;
  category: string;
  name: string;
  required: boolean;
  status: MaterialStatus;
  fileName?: string;
  remark?: string;
}

export interface VersionHistory {
  id: string;
  declarationId: string;
  version: number;
  snapshot: string;
  changes: string;
  createdAt: string;
}

export interface PrecheckItem {
  id: string;
  level: AlertLevel;
  title: string;
  description: string;
  suggestion: string;
  relatedPage?: string;
}

export type ReportOperationType = 'preview' | 'print' | 'download';

export interface ReportLogSnapshot {
  declaration: { id: string; businessType: BusinessType; selfCheckScore: number };
  enterprise: { name: string; creditCode: string };
  license: { scope: string };
  precheckResult: PrecheckResult;
}

export interface ReportLog {
  id: string;
  operationType: ReportOperationType;
  operationName: string;
  createdAt: string;
  selfCheckScore: number;
  missingCount: number;
  doubtCount: number;
  suggestionCount: number;
  version?: number;
  enterpriseName: string;
  enterpriseCreditCode: string;
  dateKey: string;
  snapshot: ReportLogSnapshot;
}

export interface PrecheckResult {
  declarationId: string;
  missingItems: PrecheckItem[];
  doubtItems: PrecheckItem[];
  suggestions: PrecheckItem[];
  reportUrl?: string;
}
