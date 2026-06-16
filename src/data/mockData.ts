import type {
  Declaration,
  Enterprise,
  License,
  PersonCert,
  Premises,
  Material,
  VersionHistory,
  BusinessType,
  Facility,
  SafetyEquipment,
  ChangeRecord,
} from '@/types';
import { generateMaterialsByBusinessType } from './materialTemplates';

const declarationId = 'DECL-2024001';

export const mockDeclaration: Declaration = {
  id: declarationId,
  businessType: 'gasoline',
  status: 'draft',
  currentStep: 4,
  selfCheckScore: 75,
  createdAt: '2026-05-15T09:30:00Z',
  updatedAt: '2026-06-10T14:20:00Z',
};

export const mockEnterprise: Enterprise = {
  declarationId,
  creditCode: '91310000MA1FL3XXXXX',
  name: '上海华油石油销售有限公司',
  legalPerson: '张明',
  establishDate: '2015-06-18',
  registeredAddress: '上海市浦东新区张江高科技园区科苑路88号',
  businessAddress: '上海市浦东新区张江高科技园区科苑路88号',
  contactPerson: '李华',
  contactPhone: '13812345678',
  email: 'lihua@huayou-oil.com',
};

export const mockChangeRecords: ChangeRecord[] = [
  {
    id: 'CHG-001',
    date: '2023-03-15',
    type: '法定代表人变更',
    before: '李伟',
    after: '张明',
  },
  {
    id: 'CHG-002',
    date: '2022-08-20',
    type: '经营地址变更',
    before: '上海市浦东新区张江高科技园区科苑路66号',
    after: '上海市浦东新区张江高科技园区科苑路88号',
  },
];

export const mockLicense: License = {
  declarationId,
  licenseNumber: '沪油销证字[2021]第0123号',
  validFrom: '2021-10-01',
  validTo: '2026-09-30',
  scope: '汽油、柴油零售',
  changeRecords: mockChangeRecords,
};

export const mockPersonCerts: PersonCert[] = [
  {
    id: 'CERT-001',
    declarationId,
    role: '主要负责人',
    name: '张明',
    certNumber: 'AYJ-2023-001234',
    validTo: '2026-08-15',
  },
  {
    id: 'CERT-002',
    declarationId,
    role: '安全管理员',
    name: '王强',
    certNumber: 'AYJ-2023-005678',
    validTo: '2025-12-20',
  },
];

export const mockPremises: Premises = {
  declarationId,
  businessAddress: '上海市浦东新区张江高科技园区科苑路88号',
  businessPropertyType: 'own',
  storageAddress: '上海市浦东新区张江高科技园区科苑路88号',
  storageCapacity: '汽油储罐4个，总容量120立方米；柴油储罐2个，总容量60立方米',
  storagePropertyType: 'own',
  facilities: [
    { id: 'FAC-001', name: '汽油储罐', quantity: 4, specification: '30m³' },
    { id: 'FAC-002', name: '柴油储罐', quantity: 2, specification: '30m³' },
    { id: 'FAC-003', name: '汽油加油机', quantity: 4, specification: '双枪' },
  ],
  safetyEquipments: [
    { id: 'SAFE-001', name: '干粉灭火器', quantity: 12 },
    { id: 'SAFE-002', name: '可燃气体报警器', quantity: 6 },
    { id: 'SAFE-003', name: '防爆通风设备', quantity: 4 },
  ],
};

export const mockFacilities: Record<BusinessType, Facility[]> = {
  gasoline: [
    { id: 'TPL-G-001', name: '汽油储罐', quantity: 0, specification: '' },
    { id: 'TPL-G-002', name: '汽油加油机', quantity: 0, specification: '' },
  ],
  diesel: [
    { id: 'TPL-D-001', name: '柴油储罐', quantity: 0, specification: '' },
  ],
  storage: [
    { id: 'TPL-S-001', name: '库房', quantity: 0, specification: '' },
    { id: 'TPL-S-002', name: '储罐区', quantity: 0, specification: '' },
  ],
  bill: [],
  other: [],
};

export const mockSafetyEquipments: SafetyEquipment[] = [
  { id: 'TPL-SAFE-001', name: '干粉灭火器', quantity: 0 },
  { id: 'TPL-SAFE-002', name: '二氧化碳灭火器', quantity: 0 },
  { id: 'TPL-SAFE-003', name: '可燃气体报警器', quantity: 0 },
  { id: 'TPL-SAFE-004', name: '烟雾报警器', quantity: 0 },
  { id: 'TPL-SAFE-005', name: '防爆通风设备', quantity: 0 },
  { id: 'TPL-SAFE-006', name: '应急照明设备', quantity: 0 },
  { id: 'TPL-SAFE-007', name: '防静电接地装置', quantity: 0 },
];

export const mockMaterials: Material[] = generateMaterialsByBusinessType(
  'gasoline',
  declarationId
).map((m, i) => ({
  ...m,
  status: i < 10 ? 'uploaded' : i < 13 ? 'pending' : 'invalid',
  fileName: i < 10 ? `${m.name}.pdf` : undefined,
  remark: i >= 13 ? '文件格式不符合要求，请上传PDF格式' : undefined,
}));

export const mockVersionHistories: VersionHistory[] = [
  {
    id: 'VH001',
    declarationId,
    version: 1,
    snapshot: JSON.stringify({
      enterprise: mockEnterprise,
      license: mockLicense,
    }),
    changes: '初始化企业与许可证基本信息',
    createdAt: '2026-05-15T10:00:00Z',
  },
  {
    id: 'VH002',
    declarationId,
    version: 2,
    snapshot: JSON.stringify({
      enterprise: mockEnterprise,
      license: mockLicense,
      personCerts: mockPersonCerts,
      premises: mockPremises,
    }),
    changes: '补充人员证书、场所与设施信息',
    createdAt: '2026-06-01T15:30:00Z',
  },
];

export interface MockData {
  declaration: Declaration;
  enterprise: Enterprise;
  license: License;
  personCerts: PersonCert[];
  premises: Premises;
  materials: Material[];
  versionHistories: VersionHistory[];
  changeRecords: ChangeRecord[];
  facilities: Record<BusinessType, Facility[]>;
  safetyEquipments: SafetyEquipment[];
}

export const mockData: MockData = {
  declaration: mockDeclaration,
  enterprise: mockEnterprise,
  license: mockLicense,
  personCerts: mockPersonCerts,
  premises: mockPremises,
  materials: mockMaterials,
  versionHistories: mockVersionHistories,
  changeRecords: mockChangeRecords,
  facilities: mockFacilities,
  safetyEquipments: mockSafetyEquipments,
};

export default mockData;
