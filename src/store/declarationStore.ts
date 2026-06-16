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
  ReportLog,
  ReportOperationType,
  MaterialStatus,
  ReportLogSnapshot,
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
  businessPropertyFileName: '',
  storageAddress: '',
  storageCapacity: '',
  storagePropertyType: 'own',
  storagePropertyFileName: '',
  facilities: [],
  safetyEquipments: [],
});

const getDaysUntil = (dateStr: string): number => {
  if (!dateStr) return Infinity;
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

const businessTypeKeywords: Record<BusinessType, { must: string[]; alias: string[] }> = {
  gasoline: { must: ['汽油'], alias: ['汽油零售', '车用汽油', '乙醇汽油'] },
  diesel: { must: ['柴油'], alias: ['柴油零售', '车用柴油'] },
  storage: { must: ['仓储', '储存'], alias: ['仓储经营', '储存经营', '带储存'] },
  bill: { must: ['票据', '无储存', '不带储存', '批发'], alias: ['票据贸易', '票据经营', '批发（无储存）', '批发（不带储存）', '不带储存设施经营'] },
  other: { must: [], alias: [] },
};

const businessTypeNames: Record<BusinessType, string> = {
  gasoline: '汽油零售',
  diesel: '柴油零售',
  storage: '仓储经营',
  bill: '票据贸易',
  other: '其他经营方式',
};

const businessTypeDescriptions: Record<BusinessType, string> = {
  gasoline: '汽油字样（许可范围中应包含「汽油」）',
  diesel: '柴油字样（许可范围中应包含「柴油」）',
  storage: '仓储或储存字样（许可范围中应包含「仓储」或「储存」）',
  bill: '票据/无储存/批发字样（许可范围应包含「票据」「无储存」「不带储存」「批发」等）',
  other: '其他经营方式',
};

const checkBusinessScopeMatch = (businessType: BusinessType, scope: string): { matched: boolean; matchedText: string } => {
  if (!scope) {
    return { matched: false, matchedText: '许可范围为空' };
  }
  const keywords = businessTypeKeywords[businessType];
  if (keywords.must.length === 0) {
    return { matched: true, matchedText: '其他经营方式，无需特定范围' };
  }
  const allKeywords = [...keywords.must, ...keywords.alias];
  const matchedKeyword = allKeywords.find((k) => scope.includes(k));
  if (matchedKeyword) {
    return { matched: true, matchedText: `匹配到关键词「${matchedKeyword}」，与经营方式相符` };
  }
  return {
    matched: false,
    matchedText: `未包含${businessTypeDescriptions[businessType]}，当前范围为「${scope}」`,
  };
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

  if (!license.scope) {
    missingItems.push({
      id: nextId(),
      level: 'danger',
      title: '缺少许可范围',
      description: '原许可证信息中未填写许可范围',
      suggestion: '请在证照核验页面填写原许可证的许可范围，需与营业执照和实际经营方式一致',
      relatedPage: 'license',
    });
  } else {
    const scopeCheck = checkBusinessScopeMatch(declaration.businessType, license.scope);
    if (!scopeCheck.matched) {
      const btName = businessTypeNames[declaration.businessType];
      doubtItems.push({
        id: nextId(),
        level: 'warning',
        title: '经营方式与许可范围不匹配',
        description: `您选择的经营方式为「${btName}」，${scopeCheck.matchedText}。\n当前许可范围：${license.scope}`,
        suggestion: `请核实：\n1. 经营方式选择是否正确；\n2. 原许可证的许可范围是否完整录入；\n3. 如许可范围确实不包含拟经营的品种，建议先办理许可范围变更，再申请换证。`,
        relatedPage: 'license',
      });
    }
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

  if (!premises.businessPropertyFileName) {
    missingItems.push({
      id: nextId(),
      level: 'danger',
      title: '缺少经营场所产权或租赁证明',
      description: '经营场所的产权证明或租赁协议尚未上传',
      suggestion: '请在场所与设施页面上传经营场所的产权证明（房产证复印件）或房屋租赁协议',
      relatedPage: 'premises',
    });
  }

  if (
    declaration.businessType !== 'bill' &&
    !premises.storagePropertyFileName
  ) {
    missingItems.push({
      id: nextId(),
      level: 'danger',
      title: '缺少储存场所产权或租赁证明',
      description: '储存场所的产权证明或租赁协议尚未上传',
      suggestion: '请在场所与设施页面上传储存场所的产权证明或租赁协议',
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
        relatedCategory: material.category,
        relatedMaterialId: material.id,
        relatedMaterialName: material.name,
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
        relatedCategory: material.category,
        relatedMaterialId: material.id,
        relatedMaterialName: material.name,
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
  reportLogs: ReportLog[];
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
  batchUpdateMaterialsStatus: (status: MaterialStatus) => number | void;
  fillMockMaterials: () => void;
  batchUpdateCategoryMaterialsStatus: (category: string, status: MaterialStatus) => void;
  fillMockCategoryMaterials: (category: string) => void;
  saveVersion: (changes: string) => void;
  runPrecheck: () => void;
  calculateSelfCheckScore: () => number;
  addReportLog: (operationType: ReportOperationType, operationName: string) => void;
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
    reportLogs: [],
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

  batchUpdateMaterialsStatus: (status: MaterialStatus) => {
    set((state) => ({
      materials: state.materials.map((m) =>
        m.required
          ? {
              ...m,
              status,
              fileName: status === 'uploaded' ? (m.fileName || `${m.name}_示例.pdf`) : m.fileName,
            }
          : m
      ),
      declaration: { ...state.declaration, updatedAt: new Date().toISOString() },
    }));
    const score = get().calculateSelfCheckScore();
    return score;
  },

  fillMockMaterials: () => {
    const mockFileNames: Record<string, string> = {
      '营业执照副本': '营业执照_2026.jpg',
      '法定代表人身份证明': '法人身份证正反面.jpg',
      '原成品油经营批准证书（如有）': '成品油批准证书.pdf',
      '主要负责人安全资格证书': '主要负责人证_张明.pdf',
      '安全生产管理人员安全资格证书': '安全员证_王强.pdf',
      '从业人员培训合格证明': '从业人员培训合格证.pdf',
      '从业人员安全培训记录': '年度安全培训记录.xlsx',
      '经营场所产权证明或租赁协议': '经营场所房产证.pdf',
      '储存场所产权证明或租赁协议': '储存场所租赁协议.pdf',
      '安全评价报告': '安全评价现状报告_2026.pdf',
      '安全管理制度汇编': '安全管理制度汇编_v3.pdf',
      '安全生产责任制': '安全生产责任制文件.pdf',
      '生产安全事故应急预案': '应急预案_v2.pdf',
      '应急预案备案登记表': '应急预案备案回执.pdf',
      '应急演练记录': '年度应急演练记录.docx',
      '消防设施验收或检测合格证明': '消防检测报告_2026.pdf',
      '申报材料真实性承诺书': '承诺书_签字盖章.pdf',
      '加油机计量检定证书': '加油机检定证书.pdf',
      '油气回收系统检测报告': '油气回收检测报告.pdf',
      '柴油储罐检测报告': '储罐年度检测报告.pdf',
      '仓储设施安全检测报告': '仓储设施检测报告.pdf',
      '危险化学品购销合同': '购销合同样本.pdf',
      '供货单位资质证明': '上游供货单位资质.pdf',
    };
    set((state) => ({
      materials: state.materials.map((m) => ({
        ...m,
        status: 'uploaded' as MaterialStatus,
        fileName: mockFileNames[m.name] || `${m.name}_示例.pdf`,
      })),
      declaration: { ...state.declaration, updatedAt: new Date().toISOString() },
    }));
    get().calculateSelfCheckScore();
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

  addReportLog: (operationType: ReportOperationType, operationName: string) => {
    const { declaration, precheckResult, reportLogs, versionHistories, enterprise, license, premises, materials } = get();
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const snapshot: ReportLogSnapshot = {
      declaration: { ...declaration },
      enterprise: { ...enterprise },
      license: { ...license },
      premises: { ...premises },
      precheckResult: precheckResult || {
        declarationId: declaration.id,
        missingItems: [],
        doubtItems: [],
        suggestions: [],
      },
      materials: materials.map((m) => ({ ...m })),
    };
    const log: ReportLog = {
      id: generateId(),
      operationType,
      operationName,
      createdAt: now.toISOString(),
      selfCheckScore: declaration.selfCheckScore,
      missingCount: precheckResult?.missingItems.length || 0,
      doubtCount: precheckResult?.doubtItems.length || 0,
      suggestionCount: precheckResult?.suggestions.length || 0,
      version: versionHistories.length > 0 ? versionHistories[versionHistories.length - 1].version : undefined,
      enterpriseName: enterprise.name || '未命名企业',
      enterpriseCreditCode: enterprise.creditCode || '',
      dateKey,
      snapshot,
    };
    set({
      reportLogs: [log, ...reportLogs].slice(0, 50),
    });
  },

  batchUpdateCategoryMaterialsStatus: (category: string, status: MaterialStatus) => {
    set((state) => ({
      materials: state.materials.map((m) =>
        m.category === category
          ? {
              ...m,
              status,
              fileName: status === 'uploaded' ? (m.fileName || `${m.name}_示例.pdf`) : m.fileName,
            }
          : m
      ),
      declaration: { ...state.declaration, updatedAt: new Date().toISOString() },
    }));
    get().calculateSelfCheckScore();
  },

  fillMockCategoryMaterials: (category: string) => {
    const mockFileNames: Record<string, string> = {
      '营业执照副本': '营业执照_2026.jpg',
      '法定代表人身份证明': '法人身份证正反面.jpg',
      '原成品油经营批准证书（如有）': '成品油批准证书.pdf',
      '主要负责人安全资格证书': '主要负责人证_张明.pdf',
      '安全生产管理人员安全资格证书': '安全员证_王强.pdf',
      '从业人员培训合格证明': '从业人员培训合格证.pdf',
      '从业人员安全培训记录': '年度安全培训记录.xlsx',
      '经营场所产权证明或租赁协议': '经营场所房产证.pdf',
      '储存场所产权证明或租赁协议': '储存场所租赁协议.pdf',
      '安全评价报告': '安全评价现状报告_2026.pdf',
      '安全管理制度汇编': '安全管理制度汇编_v3.pdf',
      '安全生产责任制': '安全生产责任制文件.pdf',
      '生产安全事故应急预案': '应急预案_v2.pdf',
      '应急预案备案登记表': '应急预案备案回执.pdf',
      '应急演练记录': '年度应急演练记录.docx',
      '消防设施验收或检测合格证明': '消防检测报告_2026.pdf',
      '申报材料真实性承诺书': '承诺书_签字盖章.pdf',
      '加油机计量检定证书': '加油机检定证书.pdf',
      '油气回收系统检测报告': '油气回收检测报告.pdf',
      '柴油储罐检测报告': '储罐年度检测报告.pdf',
      '仓储设施安全检测报告': '仓储设施检测报告.pdf',
      '危险化学品购销合同': '购销合同样本.pdf',
      '供货单位资质证明': '上游供货单位资质.pdf',
    };
    set((state) => ({
      materials: state.materials.map((m) =>
        m.category === category
          ? {
              ...m,
              status: 'uploaded' as MaterialStatus,
              fileName: mockFileNames[m.name] || `${m.name}_示例.pdf`,
            }
          : m
      ),
      declaration: { ...state.declaration, updatedAt: new Date().toISOString() },
    }));
    get().calculateSelfCheckScore();
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
      reportLogs: [],
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
      reportLogs: [],
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
        reportLogs,
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
          reportLogs,
          isLoading,
        })
      );
    } catch {
      // ignore
    }
  }
});

export { businessTypeNames };

export default useDeclarationStore;
