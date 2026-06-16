import { create } from 'zustand';
import type {
  Declaration,
  Enterprise,
  License,
  PersonCert,
  Premises,
  Material,
  VersionHistory,
  PrecheckResult,
  PrecheckItem,
  BusinessType,
} from '@/types';
import { mockData } from '@/data/mockData';
import { generateMaterialsByBusinessType } from '@/data/materialTemplates';

const generateId = () => Math.random().toString(36).substring(2, 11);

const STORAGE_KEY = 'declaration-store';

const createEmptyDeclaration = (): Declaration => ({
  id: `DECL-${Date.now()}`,
  businessType: 'gasoline',
  status: 'draft',
  currentStep: 1,
  selfCheckScore: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createEmptyEnterprise = (declarationId: string): Enterprise => ({
  declarationId,
  creditCode: '',
  name: '',
  legalPerson: '',
  establishDate: '',
  registeredAddress: '',
  businessAddress: '',
  contactPerson: '',
  contactPhone: '',
  email: '',
});

const createEmptyLicense = (declarationId: string): License => ({
  declarationId,
  licenseNumber: '',
  validFrom: '',
  validTo: '',
  scope: '',
  changeRecords: [],
});

const createEmptyPremises = (declarationId: string): Premises => ({
  declarationId,
  businessAddress: '',
  businessPropertyType: 'own',
  storageAddress: '',
  storageCapacity: '',
  storagePropertyType: 'own',
  facilities: [],
  safetyEquipments: [],
});

const getDaysUntil = (dateStr: string): number => {
  if (!dateStr) return Infinity;
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

const runPrecheckLogic = (
  declaration: Declaration,
  enterprise: Enterprise,
  license: License,
  personCerts: PersonCert[],
  premises: Premises,
  materials: Material[]
): PrecheckResult => {
  const missingItems: PrecheckItem[] = [];
  const doubtItems: PrecheckItem[] = [];
  const suggestions: PrecheckItem[] = [];
  let itemId = 0;
  const nextId = () => `PI-${++itemId}`;

  if (!enterprise.creditCode) {
    missingItems.push({
      id: nextId(),
      level: 'danger',
      title: '缺少统一社会信用代码',
      description: '企业信息中未填写统一社会信用代码',
      suggestion: '请在企业信息页面填写18位统一社会信用代码',
      relatedPage: 'enterprise',
    });
  }

  if (!enterprise.name) {
    missingItems.push({
      id: nextId(),
      level: 'danger',
      title: '缺少企业名称',
      description: '企业信息中未填写企业名称',
      suggestion: '请在企业信息页面填写企业名称',
      relatedPage: 'enterprise',
    });
  }

  if (!enterprise.contactPerson || !enterprise.contactPhone) {
    missingItems.push({
      id: nextId(),
      level: 'danger',
      title: '缺少联系人信息',
      description: '企业信息中联系人或联系电话未填写',
      suggestion: '请在企业信息页面完善联系人和联系电话',
      relatedPage: 'enterprise',
    });
  }

  if (!license.licenseNumber) {
    missingItems.push({
      id: nextId(),
      level: 'danger',
      title: '缺少原许可证号',
      description: '许可证信息中未填写原许可证号',
      suggestion: '请在证照核验页面填写原危险化学品经营许可证号',
      relatedPage: 'license',
    });
  }

  const licenseDays = getDaysUntil(license.validTo);
  if (license.validTo && licenseDays <= 90) {
    doubtItems.push({
      id: nextId(),
      level: licenseDays <= 30 ? 'danger' : 'warning',
      title: `许可证即将到期（剩余${licenseDays}天）`,
      description: `原许可证有效期至 ${license.validTo}，距离到期不足${licenseDays <= 30 ? '30' : '90'}天`,
      suggestion: '请尽快办理换证手续，避免许可证过期影响经营',
      relatedPage: 'license',
    });
  }

  const hasPrincipal = personCerts.some((c) => c.role === '主要负责人');
  if (!hasPrincipal) {
    missingItems.push({
      id: nextId(),
      level: 'danger',
      title: '缺少主要负责人资格证书',
      description: '未录入主要负责人的安全资格证书信息',
      suggestion: '请在证照核验页面添加主要负责人资格证书',
      relatedPage: 'license',
    });
  }

  const hasSafetyManager = personCerts.some((c) => c.role === '安全管理员');
  if (!hasSafetyManager) {
    missingItems.push({
      id: nextId(),
      level: 'danger',
      title: '缺少安全管理员资格证书',
      description: '未录入安全生产管理人员的安全资格证书信息',
      suggestion: '请在证照核验页面添加安全管理员资格证书',
      relatedPage: 'license',
    });
  }

  personCerts.forEach((cert) => {
    const days = getDaysUntil(cert.validTo);
    if (cert.validTo && days <= 90) {
      doubtItems.push({
        id: nextId(),
        level: days <= 30 ? 'danger' : 'warning',
        title: `${cert.name}的${cert.role}证书即将到期（剩余${days}天）`,
        description: `证书编号 ${cert.certNumber}，有效期至 ${cert.validTo}`,
        suggestion: '请提醒相关人员及时参加继续教育并换发新证',
        relatedPage: 'license',
      });
    }
  });

  if (
    declaration.businessType !== 'bill' &&
    premises.businessAddress &&
    premises.storageAddress &&
    premises.businessAddress !== premises.storageAddress
  ) {
    suggestions.push({
      id: nextId(),
      level: 'warning',
      title: '经营地址与储存地址不一致',
      description: `经营地址：${premises.businessAddress}\n储存地址：${premises.storageAddress}`,
      suggestion: '请确认储存地址是否已按规定备案，并提供相应的产权证明',
      relatedPage: 'premises',
    });
  }

  if (
    enterprise.businessAddress &&
    premises.businessAddress &&
    enterprise.businessAddress !== premises.businessAddress
  ) {
    doubtItems.push({
      id: nextId(),
      level: 'warning',
      title: '企业经营地址与场所地址不一致',
      description: `企业信息经营地址：${enterprise.businessAddress}\n场所信息经营地址：${premises.businessAddress}`,
      suggestion: '请核实两个地址是否一致，如为同一地址请保持填写一致',
      relatedPage: 'premises',
    });
  }

  if (!premises.businessAddress) {
    missingItems.push({
      id: nextId(),
      level: 'danger',
      title: '缺少经营场所地址',
      description: '场所与设施信息中未填写经营地址',
      suggestion: '请在场所与设施页面填写经营地址',
      relatedPage: 'premises',
    });
  }

  if (
    declaration.businessType !== 'bill' &&
    !premises.storageAddress
  ) {
    missingItems.push({
      id: nextId(),
      level: 'danger',
      title: '缺少储存场所地址',
      description: '场所与设施信息中未填写储存地址',
      suggestion: '请在场所与设施页面填写储存地址（票据贸易除外）',
      relatedPage: 'premises',
    });
  }

  materials.forEach((material) => {
    if (material.required && material.status === 'pending') {
      missingItems.push({
        id: nextId(),
        level: 'danger',
        title: `缺少必填材料：${material.name}`,
        description: `材料分类：${material.category}，状态：待上传`,
        suggestion: '请在材料清单页面上传该材料',
        relatedPage: 'materials',
      });
    }
    if (material.status === 'invalid') {
      doubtItems.push({
        id: nextId(),
        level: 'warning',
        title: `材料不符合要求：${material.name}`,
        description: material.remark || '材料审核未通过',
        suggestion: '请根据备注说明重新上传符合要求的材料',
        relatedPage: 'materials',
      });
    }
  });

  return {
    declarationId: declaration.id,
    missingItems,
    doubtItems,
    suggestions,
  };
};

const calculateScore = (
  declaration: Declaration,
  enterprise: Enterprise,
  license: License,
  personCerts: PersonCert[],
  premises: Premises,
  materials: Material[]
): number => {
  let total = 0;
  let max = 0;

  max += 20;
  if (enterprise.creditCode && enterprise.name) total += 10;
  if (enterprise.contactPerson && enterprise.contactPhone) total += 10;

  max += 20;
  if (license.licenseNumber) total += 10;
  if (license.validTo && getDaysUntil(license.validTo) > 90) total += 10;

  max += 20;
  const hasPrincipal = personCerts.some(
    (c) => c.role === '主要负责人' && c.certNumber && c.validTo && getDaysUntil(c.validTo) > 90
  );
  const hasSafetyManager = personCerts.some(
    (c) => c.role === '安全管理员' && c.certNumber && c.validTo && getDaysUntil(c.validTo) > 90
  );
  if (hasPrincipal) total += 10;
  if (hasSafetyManager) total += 10;

  max += 15;
  if (premises.businessAddress) total += 5;
  if (declaration.businessType === 'bill' || premises.storageAddress) total += 5;
  if (premises.safetyEquipments.length > 0) total += 5;

  max += 25;
  const requiredMaterials = materials.filter((m) => m.required);
  const uploadedRequired = requiredMaterials.filter((m) => m.status === 'uploaded');
  if (requiredMaterials.length > 0) {
    total += Math.round((uploadedRequired.length / requiredMaterials.length) * 25);
  } else {
    total += 25;
  }

  return Math.round((total / max) * 100);
};

interface DeclarationStore {
  declaration: Declaration;
  enterprise: Enterprise;
  license: License;
  personCerts: PersonCert[];
  premises: Premises;
  materials: Material[];
  versionHistories: VersionHistory[];
  precheckResult: PrecheckResult | null;
  isLoading: boolean;

  setBusinessType: (type: BusinessType) => void;
  setEnterprise: (data: Partial<Enterprise>) => void;
  setLicense: (data: Partial<License>) => void;
  addPersonCert: (cert: Omit<PersonCert, 'id' | 'declarationId'>) => void;
  updatePersonCert: (id: string, data: Partial<PersonCert>) => void;
  removePersonCert: (id: string) => void;
  setPremises: (data: Partial<Premises>) => void;
  setMaterials: (materials: Material[]) => void;
  updateMaterial: (id: string, data: Partial<Material>) => void;
  saveVersion: (changes: string) => void;
  runPrecheck: () => void;
  calculateSelfCheckScore: () => number;
  resetDeclaration: () => void;
  loadMockData: () => void;
}

const getInitialState = (): Omit<DeclarationStore, keyof { [K in keyof DeclarationStore as DeclarationStore[K] extends Function ? K : never]: never }> => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
  }

  const declaration = createEmptyDeclaration();
  return {
    declaration,
    enterprise: createEmptyEnterprise(declaration.id),
    license: createEmptyLicense(declaration.id),
    personCerts: [],
    premises: createEmptyPremises(declaration.id),
    materials: generateMaterialsByBusinessType(declaration.businessType, declaration.id),
    versionHistories: [],
    precheckResult: null,
    isLoading: false,
  };
};

export const useDeclarationStore = create<DeclarationStore>((set, get) => ({
  ...getInitialState(),

  setBusinessType: (type: BusinessType) => {
    const { declaration } = get();
    const newMaterials = generateMaterialsByBusinessType(type, declaration.id);
    set((state) => ({
      declaration: {
        ...state.declaration,
        businessType: type,
        updatedAt: new Date().toISOString(),
      },
      materials: newMaterials,
    }));
  },

  setEnterprise: (data: Partial<Enterprise>) => {
    set((state) => ({
      enterprise: { ...state.enterprise, ...data },
      declaration: { ...state.declaration, updatedAt: new Date().toISOString() },
    }));
  },

  setLicense: (data: Partial<License>) => {
    set((state) => ({
      license: { ...state.license, ...data },
      declaration: { ...state.declaration, updatedAt: new Date().toISOString() },
    }));
  },

  addPersonCert: (cert: Omit<PersonCert, 'id' | 'declarationId'>) => {
    const { declaration } = get();
    const newCert: PersonCert = {
      ...cert,
      id: generateId(),
      declarationId: declaration.id,
    };
    set((state) => ({
      personCerts: [...state.personCerts, newCert],
      declaration: { ...state.declaration, updatedAt: new Date().toISOString() },
    }));
  },

  updatePersonCert: (id: string, data: Partial<PersonCert>) => {
    set((state) => ({
      personCerts: state.personCerts.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
      declaration: { ...state.declaration, updatedAt: new Date().toISOString() },
    }));
  },

  removePersonCert: (id: string) => {
    set((state) => ({
      personCerts: state.personCerts.filter((c) => c.id !== id),
      declaration: { ...state.declaration, updatedAt: new Date().toISOString() },
    }));
  },

  setPremises: (data: Partial<Premises>) => {
    set((state) => ({
      premises: { ...state.premises, ...data },
      declaration: { ...state.declaration, updatedAt: new Date().toISOString() },
    }));
  },

  setMaterials: (materials: Material[]) => {
    set((state) => ({
      materials,
      declaration: { ...state.declaration, updatedAt: new Date().toISOString() },
    }));
  },

  updateMaterial: (id: string, data: Partial<Material>) => {
    set((state) => ({
      materials: state.materials.map((m) =>
        m.id === id ? { ...m, ...data } : m
      ),
      declaration: { ...state.declaration, updatedAt: new Date().toISOString() },
    }));
  },

  saveVersion: (changes: string) => {
    const { declaration, enterprise, license, personCerts, premises, materials, versionHistories } = get();
    const newVersion: VersionHistory = {
      id: generateId(),
      declarationId: declaration.id,
      version: versionHistories.length + 1,
      snapshot: JSON.stringify({
        enterprise,
        license,
        personCerts,
        premises,
        materials,
      }),
      changes,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      versionHistories: [...state.versionHistories, newVersion],
    }));
  },

  runPrecheck: () => {
    set({ isLoading: true });
    const { declaration, enterprise, license, personCerts, premises, materials } = get();
    const result = runPrecheckLogic(
      declaration,
      enterprise,
      license,
      personCerts,
      premises,
      materials
    );
    const score = calculateScore(
      declaration,
      enterprise,
      license,
      personCerts,
      premises,
      materials
    );
    set({
      precheckResult: result,
      declaration: { ...declaration, selfCheckScore: score, updatedAt: new Date().toISOString() },
      isLoading: false,
    });
  },

  calculateSelfCheckScore: () => {
    const { declaration, enterprise, license, personCerts, premises, materials } = get();
    const score = calculateScore(
      declaration,
      enterprise,
      license,
      personCerts,
      premises,
      materials
    );
    set((state) => ({
      declaration: { ...state.declaration, selfCheckScore: score },
    }));
    return score;
  },

  resetDeclaration: () => {
    const declaration = createEmptyDeclaration();
    set({
      declaration,
      enterprise: createEmptyEnterprise(declaration.id),
      license: createEmptyLicense(declaration.id),
      personCerts: [],
      premises: createEmptyPremises(declaration.id),
      materials: generateMaterialsByBusinessType(declaration.businessType, declaration.id),
      versionHistories: [],
      precheckResult: null,
      isLoading: false,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  loadMockData: () => {
    set({
      declaration: { ...mockData.declaration },
      enterprise: { ...mockData.enterprise },
      license: { ...mockData.license },
      personCerts: mockData.personCerts.map((c) => ({ ...c })),
      premises: {
        ...mockData.premises,
        facilities: mockData.premises.facilities.map((f) => ({ ...f })),
        safetyEquipments: mockData.premises.safetyEquipments.map((s) => ({ ...s })),
      },
      materials: mockData.materials.map((m) => ({ ...m })),
      versionHistories: mockData.versionHistories.map((v) => ({ ...v })),
      precheckResult: null,
      isLoading: false,
    });
  },
}));

useDeclarationStore.subscribe((state) => {
  if (typeof window !== 'undefined') {
    try {
      const {
        declaration,
        enterprise,
        license,
        personCerts,
        premises,
        materials,
        versionHistories,
        precheckResult,
        isLoading,
      } = state;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          declaration,
          enterprise,
          license,
          personCerts,
          premises,
          materials,
          versionHistories,
          precheckResult,
          isLoading,
        })
      );
    } catch {
      // ignore
    }
  }
});

export default useDeclarationStore;
