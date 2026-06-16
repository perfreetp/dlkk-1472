import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Search,
  AlertTriangle,
  ArrowLeft,
  Save,
  ArrowRight,
  Loader2,
  CreditCard,
} from 'lucide-react';
import { useDeclarationStore } from '@/store/declarationStore';
import { validateCreditCode, validatePhone, validateEmail } from '@/utils/validators';
import { mockEnterprise } from '@/data/mockData';
import { cn } from '@/lib/utils';

const enterpriseSchema = z.object({
  creditCode: z
    .string()
    .min(1, '请输入统一社会信用代码')
    .refine((val) => validateCreditCode(val), '请输入有效的18位统一社会信用代码'),
  businessAddress: z.string().min(1, '请输入经营地址'),
  contactPerson: z.string().min(1, '请输入联系人'),
  contactPhone: z
    .string()
    .min(1, '请输入联系电话')
    .refine((val) => validatePhone(val), '请输入有效的11位手机号码'),
  email: z
    .string()
    .min(1, '请输入电子邮箱')
    .refine((val) => validateEmail(val), '请输入有效的电子邮箱地址'),
});

type EnterpriseFormData = z.infer<typeof enterpriseSchema>;

export function Enterprise() {
  const navigate = useNavigate();
  const { enterprise, setEnterprise, saveVersion } = useDeclarationStore();
  const [isReading, setIsReading] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(
    Boolean(enterprise.name && enterprise.legalPerson)
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<EnterpriseFormData>({
    resolver: zodResolver(enterpriseSchema),
    mode: 'onBlur',
    defaultValues: {
      creditCode: enterprise.creditCode || '',
      businessAddress: enterprise.businessAddress || '',
      contactPerson: enterprise.contactPerson || '',
      contactPhone: enterprise.contactPhone || '',
      email: enterprise.email || '',
    },
  });

  const creditCodeValue = watch('creditCode');
  const businessAddressValue = watch('businessAddress');

  const showAddressWarning =
    isAutoFilled &&
    enterprise.registeredAddress &&
    businessAddressValue &&
    enterprise.registeredAddress !== businessAddressValue;

  const handleReadEnterpriseInfo = async () => {
    if (!validateCreditCode(creditCodeValue)) {
      return;
    }

    setIsReading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setEnterprise({
      creditCode: mockEnterprise.creditCode,
      name: mockEnterprise.name,
      legalPerson: mockEnterprise.legalPerson,
      establishDate: mockEnterprise.establishDate,
      registeredAddress: mockEnterprise.registeredAddress,
    });

    setValue('creditCode', mockEnterprise.creditCode, { shouldValidate: true });
    setValue('businessAddress', mockEnterprise.businessAddress, { shouldValidate: true });
    setValue('contactPerson', mockEnterprise.contactPerson, { shouldValidate: true });
    setValue('contactPhone', mockEnterprise.contactPhone, { shouldValidate: true });
    setValue('email', mockEnterprise.email, { shouldValidate: true });

    setIsAutoFilled(true);
    setIsReading(false);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleSaveDraft = () => {
    setEnterprise({
      creditCode: creditCodeValue,
      businessAddress: businessAddressValue,
      contactPerson: watch('contactPerson'),
      contactPhone: watch('contactPhone'),
      email: watch('email'),
    });
    saveVersion('保存企业信息草稿');
    alert('草稿已保存');
  };

  const onSubmit = (data: EnterpriseFormData) => {
    setEnterprise({
      creditCode: data.creditCode,
      businessAddress: data.businessAddress,
      contactPerson: data.contactPerson,
      contactPhone: data.contactPhone,
      email: data.email,
    });
    navigate('/license');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
        <section className="card p-6">
          <h2 className="section-title">
            <CreditCard className="w-5 h-5 text-gov" />
            统一社会信用代码
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            请输入企业的18位统一社会信用代码，系统将自动读取企业工商登记信息
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="请输入18位统一社会信用代码"
                className={cn(
                  'input-field text-lg py-4 font-mono tracking-wider',
                  errors.creditCode && 'input-field-error'
                )}
                maxLength={18}
                {...register('creditCode')}
              />
              {errors.creditCode && (
                <p className="mt-1.5 text-sm text-status-danger">
                  {errors.creditCode.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleReadEnterpriseInfo}
              disabled={!validateCreditCode(creditCodeValue) || isReading}
              className="btn-primary flex items-center justify-center gap-2 px-8 whitespace-nowrap"
            >
              {isReading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  读取中...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  读取信息
                </>
              )}
            </button>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="section-title">
            <Building2 className="w-5 h-5 text-gov" />
            企业基础信息
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            以下信息由系统自动读取自工商登记系统，不可编辑
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">
                <Building2 className="w-4 h-4 inline mr-1 text-gray-400" />
                企业名称
              </label>
              <input
                type="text"
                value={enterprise.name || ''}
                disabled
                placeholder="请先读取统一社会信用代码"
                className="input-field bg-gray-50"
              />
            </div>
            <div>
              <label className="label">
                <User className="w-4 h-4 inline mr-1 text-gray-400" />
                法定代表人
              </label>
              <input
                type="text"
                value={enterprise.legalPerson || ''}
                disabled
                placeholder="请先读取统一社会信用代码"
                className="input-field bg-gray-50"
              />
            </div>
            <div>
              <label className="label">
                <Calendar className="w-4 h-4 inline mr-1 text-gray-400" />
                成立日期
              </label>
              <input
                type="text"
                value={enterprise.establishDate || ''}
                disabled
                placeholder="请先读取统一社会信用代码"
                className="input-field bg-gray-50"
              />
            </div>
            <div>
              <label className="label">
                <MapPin className="w-4 h-4 inline mr-1 text-gray-400" />
                注册地址
              </label>
              <input
                type="text"
                value={enterprise.registeredAddress || ''}
                disabled
                placeholder="请先读取统一社会信用代码"
                className="input-field bg-gray-50"
              />
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="section-title">
            <User className="w-5 h-5 text-gov" />
            联系信息
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            请填写本次申报的联系人及联系方式
          </p>

          {showAddressWarning && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">注册地址与经营地址不一致</p>
                <p className="text-sm text-amber-700 mt-1">
                  您填写的经营地址与工商登记的注册地址不一致，如确为实际经营地址请继续填写；
                  如属误填，请修改为与注册地址一致。
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="label label-required">
                <MapPin className="w-4 h-4 inline mr-1 text-gray-400" />
                经营地址
              </label>
              <input
                type="text"
                placeholder="请输入实际经营地址"
                className={cn(
                  'input-field',
                  errors.businessAddress && 'input-field-error'
                )}
                {...register('businessAddress')}
              />
              {errors.businessAddress && (
                <p className="mt-1.5 text-sm text-status-danger">
                  {errors.businessAddress.message}
                </p>
              )}
            </div>
            <div>
              <label className="label label-required">
                <User className="w-4 h-4 inline mr-1 text-gray-400" />
                联系人
              </label>
              <input
                type="text"
                placeholder="请输入联系人姓名"
                className={cn(
                  'input-field',
                  errors.contactPerson && 'input-field-error'
                )}
                {...register('contactPerson')}
              />
              {errors.contactPerson && (
                <p className="mt-1.5 text-sm text-status-danger">
                  {errors.contactPerson.message}
                </p>
              )}
            </div>
            <div>
              <label className="label label-required">
                <Phone className="w-4 h-4 inline mr-1 text-gray-400" />
                联系电话
              </label>
              <input
                type="tel"
                placeholder="请输入11位手机号码"
                maxLength={11}
                className={cn(
                  'input-field',
                  errors.contactPhone && 'input-field-error'
                )}
                {...register('contactPhone')}
              />
              {errors.contactPhone && (
                <p className="mt-1.5 text-sm text-status-danger">
                  {errors.contactPhone.message}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="label label-required">
                <Mail className="w-4 h-4 inline mr-1 text-gray-400" />
                电子邮箱
              </label>
              <input
                type="email"
                placeholder="请输入电子邮箱"
                className={cn(
                  'input-field',
                  errors.email && 'input-field-error'
                )}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-status-danger">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            上一步
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn-secondary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存草稿
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="btn-primary flex items-center gap-2"
            >
              下一步
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </form>
  );
}
