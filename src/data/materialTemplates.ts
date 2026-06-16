import type { BusinessType, MaterialStatus, Material } from '@/types';

type MaterialCategory = '企业资质类' | '人员资质类' | '场所设施类' | '安全管理类' | '其他材料';

interface MaterialTemplate {
  name: string;
  category: MaterialCategory;
  required: boolean;
  remark?: string;
}

const baseMaterialTemplates: MaterialTemplate[] = [
  { name: '营业执照副本', category: '企业资质类', required: true },
  { name: '法定代表人身份证明', category: '企业资质类', required: true },
  { name: '原成品油经营批准证书（如有）', category: '企业资质类', required: false },
  { name: '主要负责人安全资格证书', category: '人员资质类', required: true },
  { name: '安全生产管理人员安全资格证书', category: '人员资质类', required: true },
  { name: '从业人员培训合格证明', category: '人员资质类', required: false },
  { name: '经营场所产权证明或租赁协议', category: '场所设施类', required: true },
  { name: '安全管理制度汇编', category: '安全管理类', required: true },
  { name: '安全生产责任制', category: '安全管理类', required: true },
  { name: '生产安全事故应急预案', category: '安全管理类', required: true },
  { name: '应急演练记录', category: '安全管理类', required: false },
  { name: '申报材料真实性承诺书', category: '其他材料', required: true },
];

const gasolineSpecificTemplates: MaterialTemplate[] = [
  { name: '加油机计量检定证书', category: '场所设施类', required: true, remark: '汽油零售特有' },
  { name: '汽油储罐检测报告', category: '场所设施类', required: true },
  { name: '油气回收系统检测报告', category: '场所设施类', required: true },
];

const dieselSpecificTemplates: MaterialTemplate[] = [
  { name: '柴油储罐检测报告', category: '场所设施类', required: true },
];

const storageSpecificTemplates: MaterialTemplate[] = [
  { name: '仓储设施安全检测报告', category: '场所设施类', required: true, remark: '仓储经营特有' },
  { name: '储罐区防雷防静电检测报告', category: '场所设施类', required: true },
  { name: '重大危险源备案证明', category: '安全管理类', required: false },
];

const billSpecificTemplates: MaterialTemplate[] = [
  { name: '上下游购销合同', category: '其他材料', required: true, remark: '票据贸易特有' },
  { name: '货源及销售渠道证明', category: '其他材料', required: true, remark: '票据贸易特有' },
];

function generateMaterialId(index: number): string {
  return `MAT-${String(index + 1).padStart(3, '0')}`;
}

function getTemplatesByBusinessType(businessType: BusinessType): MaterialTemplate[] {
  let templates = [...baseMaterialTemplates];

  switch (businessType) {
    case 'gasoline':
      templates = [...templates, ...gasolineSpecificTemplates, ...dieselSpecificTemplates];
      break;
    case 'diesel':
      templates = [...templates, ...dieselSpecificTemplates];
      break;
    case 'storage':
      templates = [...templates, ...storageSpecificTemplates];
      break;
    case 'bill':
      templates = [...templates, ...billSpecificTemplates];
      break;
    case 'other':
    default:
      break;
  }

  return templates;
}

export function getMaterialTemplate(businessType: BusinessType): Material[] {
  const templates = getTemplatesByBusinessType(businessType);

  return templates.map((template, index) => ({
    id: generateMaterialId(index),
    declarationId: '',
    category: template.category,
    name: template.name,
    required: template.required,
    status: 'pending' as MaterialStatus,
    remark: template.remark,
  }));
}

export function generateMaterialsByBusinessType(
  businessType: BusinessType,
  declarationId: string
): Material[] {
  const templates = getTemplatesByBusinessType(businessType);

  return templates.map((template, index) => ({
    id: generateMaterialId(index),
    declarationId,
    category: template.category,
    name: template.name,
    required: template.required,
    status: 'pending' as MaterialStatus,
    remark: template.remark,
  }));
}
