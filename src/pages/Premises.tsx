import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Warehouse,
  Building2,
  Shield,
  Plus,
  Upload,
  File,
  X,
  ChevronLeft,
  Save,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Info,
} from 'lucide-react';
import { useDeclarationStore } from '@/store/declarationStore';
import type { Facility, SafetyEquipment } from '@/types';

type SafetyEquipmentWithDate = SafetyEquipment & { lastCheckDate?: string };

const generateId = () => Math.random().toString(36).substring(2, 11);

export function Premises() {
  const navigate = useNavigate();
  const {
    declaration,
    premises,
    setPremises,
    saveVersion,
  } = useDeclarationStore();

  const businessFileRef = useRef<HTMLInputElement>(null);
  const storageFileRef = useRef<HTMLInputElement>(null);
  const [otherFacilityName, setOtherFacilityName] = useState('');

  const addressMatch = premises.businessAddress && premises.storageAddress
    ? premises.businessAddress === premises.storageAddress
    : null;

  const businessType = declaration.businessType;

  const handleBusinessFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPremises({ businessPropertyFileName: file.name });
    }
  };

  const handleStorageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPremises({ storagePropertyFileName: file.name });
    }
  };

  const handleFacilityChange = (index: number, field: keyof Facility, value: string | number) => {
    const newFacilities = [...premises.facilities];
    if (newFacilities[index]) {
      newFacilities[index] = {
        ...newFacilities[index],
        [field]: value,
      };
      setPremises({ facilities: newFacilities });
    }
  };

  const handleAddFacility = (template: { name: string; quantity?: number; specification?: string }) => {
    const newFacility: Facility = {
      id: generateId(),
      name: template.name,
      quantity: template.quantity ?? 0,
      specification: template.specification ?? '',
    };
    setPremises({ facilities: [...premises.facilities, newFacility] });
  };

  const handleAddCustomFacility = () => {
    if (!otherFacilityName.trim()) return;
    handleAddFacility({ name: otherFacilityName.trim() });
    setOtherFacilityName('');
  };

  const handleRemoveFacility = (id: string) => {
    setPremises({ facilities: premises.facilities.filter((f) => f.id !== id) });
  };

  const handleSafetyEquipmentChange = (index: number, field: keyof SafetyEquipmentWithDate, value: string | number) => {
    const newEquipments = [...(premises.safetyEquipments as SafetyEquipmentWithDate[])];
    if (newEquipments[index]) {
      newEquipments[index] = {
        ...newEquipments[index],
        [field]: value,
      };
      setPremises({ safetyEquipments: newEquipments });
    }
  };

  const handleAddSafetyEquipment = () => {
    const newEquipment: SafetyEquipmentWithDate = {
      id: generateId(),
      name: '',
      quantity: 0,
      lastCheckDate: '',
    };
    setPremises({ safetyEquipments: [...premises.safetyEquipments, newEquipment] });
  };

  const handleRemoveSafetyEquipment = (id: string) => {
    setPremises({ safetyEquipments: premises.safetyEquipments.filter((e) => e.id !== id) });
  };

  const handleSaveDraft = () => {
    saveVersion('场所与设施页保存草稿');
  };

  const getFacilityTemplates = () => {
    switch (businessType) {
      case 'gasoline':
        return [
          { name: '油罐', hasCapacity: true, key: '油罐' },
          { name: '加油机', hasModel: true, key: '加油机' },
        ];
      case 'diesel':
        return [
          { name: '柴油储罐', hasCapacity: true, key: '柴油储罐' },
        ];
      case 'storage':
        return [
          { name: '库房', hasArea: true, key: '库房' },
          { name: '储罐区', hasTotalCapacity: true, key: '储罐区' },
        ];
      default:
        return [];
    }
  };

  const renderFacilityFields = (facility: Facility, index: number) => {
    if (businessType === 'gasoline') {
      if (facility.name === '油罐') {
        return (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">数量（个）</label>
              <input
                type="number"
                min="0"
                value={facility.quantity}
                onChange={(e) => handleFacilityChange(index, 'quantity', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">单罐容量（m³）</label>
              <input
                type="text"
                value={facility.specification || ''}
                onChange={(e) => handleFacilityChange(index, 'specification', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="如：30"
              />
            </div>
          </>
        );
      }
      if (facility.name === '加油机') {
        return (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">数量（台）</label>
              <input
                type="number"
                min="0"
                value={facility.quantity}
                onChange={(e) => handleFacilityChange(index, 'quantity', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">型号</label>
              <input
                type="text"
                value={facility.specification || ''}
                onChange={(e) => handleFacilityChange(index, 'specification', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="如：双枪"
              />
            </div>
          </>
        );
      }
    }
    if (businessType === 'diesel' && facility.name === '柴油储罐') {
      return (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1">数量（个）</label>
            <input
              type="number"
              min="0"
              value={facility.quantity}
              onChange={(e) => handleFacilityChange(index, 'quantity', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">单罐容量（m³）</label>
            <input
              type="text"
              value={facility.specification || ''}
              onChange={(e) => handleFacilityChange(index, 'specification', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              placeholder="如：50"
            />
          </div>
        </>
      );
    }
    if (businessType === 'storage') {
      if (facility.name === '库房') {
        return (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">间数</label>
              <input
                type="number"
                min="0"
                value={facility.quantity}
                onChange={(e) => handleFacilityChange(index, 'quantity', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">总面积（㎡）</label>
              <input
                type="text"
                value={facility.specification || ''}
                onChange={(e) => handleFacilityChange(index, 'specification', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="如：200"
              />
            </div>
          </>
        );
      }
      if (facility.name === '储罐区') {
        return (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">储罐数量</label>
              <input
                type="number"
                min="0"
                value={facility.quantity}
                onChange={(e) => handleFacilityChange(index, 'quantity', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">总容量（m³）</label>
              <input
                type="text"
                value={facility.specification || ''}
                onChange={(e) => handleFacilityChange(index, 'specification', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="如：500"
              />
            </div>
          </>
        );
      }
    }
    if (businessType === 'other') {
      return (
        <>
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-500 mb-1">设施名称</label>
            <input
              type="text"
              value={facility.name}
              onChange={(e) => handleFacilityChange(index, 'name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">数量</label>
            <input
              type="number"
              min="0"
              value={facility.quantity}
              onChange={(e) => handleFacilityChange(index, 'quantity', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">规格/型号</label>
            <input
              type="text"
              value={facility.specification || ''}
              onChange={(e) => handleFacilityChange(index, 'specification', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">经营场所信息</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">经营地址</label>
              <input
                type="text"
                value={premises.businessAddress}
                onChange={(e) => setPremises({ businessAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                placeholder="请输入详细经营地址"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产权类型</label>
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="businessPropertyType"
                    checked={premises.businessPropertyType === 'own'}
                    onChange={() => setPremises({ businessPropertyType: 'own' })}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">自有</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="businessPropertyType"
                    checked={premises.businessPropertyType === 'lease'}
                    onChange={() => setPremises({ businessPropertyType: 'lease' })}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">租赁</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">产权证明</label>
              <div className="flex items-center gap-3">
                <input
                  ref={businessFileRef}
                  type="file"
                  onChange={handleBusinessFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <button
                  type="button"
                  onClick={() => businessFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  <Upload className="w-4 h-4" />
                  上传证明
                </button>
                {premises.businessPropertyFileName ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                    <File className="w-4 h-4 text-blue-500" />
                    {premises.businessPropertyFileName}
                    <button
                      onClick={() => { setPremises({ businessPropertyFileName: '' }); if (businessFileRef.current) businessFileRef.current.value = ''; }}
                      className="ml-1 p-0.5 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">支持 PDF、JPG、PNG 格式</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {businessType !== 'bill' && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">储存场所信息</h2>
              </div>
              {addressMatch !== null && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                    addressMatch
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {addressMatch ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      与经营地址一致
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      与经营地址不一致
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">储存地址</label>
                <input
                  type="text"
                  value={premises.storageAddress}
                  onChange={(e) => setPremises({ storageAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                  placeholder="请输入详细储存地址"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">储存能力</label>
                <input
                  type="text"
                  value={premises.storageCapacity}
                  onChange={(e) => setPremises({ storageCapacity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                  placeholder="请描述储存能力，如：汽油储罐4个，总容量120立方米"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">产权类型</label>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="storagePropertyType"
                      checked={premises.storagePropertyType === 'own'}
                      onChange={() => setPremises({ storagePropertyType: 'own' })}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">自有</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="storagePropertyType"
                      checked={premises.storagePropertyType === 'lease'}
                      onChange={() => setPremises({ storagePropertyType: 'lease' })}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">租赁</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">产权证明</label>
                <div className="flex items-center gap-3">
                  <input
                    ref={storageFileRef}
                    type="file"
                    onChange={handleStorageFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <button
                    type="button"
                    onClick={() => storageFileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                  >
                    <Upload className="w-4 h-4" />
                    上传证明
                  </button>
                  {premises.storagePropertyFileName ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                      <File className="w-4 h-4 text-blue-500" />
                      {premises.storagePropertyFileName}
                      <button
                        onClick={() => { setPremises({ storagePropertyFileName: '' }); if (storageFileRef.current) storageFileRef.current.value = ''; }}
                        className="ml-1 p-0.5 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">支持 PDF、JPG、PNG 格式</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">设施信息</h2>
          </div>

          {businessType === 'bill' ? (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">票据贸易无需填报实体设施</p>
                <p className="text-xs text-blue-700 mt-1">您当前选择的经营方式为票据贸易，无需填写仓储、加油等实体设施信息。</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {businessType !== 'other' && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {getFacilityTemplates().map((tpl) => {
                    const alreadyAdded = premises.facilities.some((f) => f.name === tpl.key);
                    return (
                      <button
                        key={tpl.key}
                        onClick={() => !alreadyAdded && handleAddFacility({ name: tpl.name })}
                        disabled={alreadyAdded}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                          alreadyAdded
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        添加{tpl.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {businessType === 'other' && (
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={otherFacilityName}
                    onChange={(e) => setOtherFacilityName(e.target.value)}
                    placeholder="输入设施名称"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                  <button
                    onClick={handleAddCustomFacility}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    添加
                  </button>
                </div>
              )}

              {premises.facilities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">暂无设施信息，请点击上方按钮添加</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {premises.facilities.map((facility, index) => (
                    <div
                      key={facility.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-900">{facility.name}</span>
                        <button
                          onClick={() => handleRemoveFacility(facility.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${
                        businessType === 'other' ? 'md:grid-cols-3' : ''
                      }`}>
                        {renderFacilityFields(facility, index)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">安全设施清单</h2>
            </div>
            <button
              onClick={handleAddSafetyEquipment}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加安全设施
            </button>
          </div>

          {(premises.safetyEquipments as SafetyEquipmentWithDate[]).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">暂无安全设施，请点击上方按钮添加</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(premises.safetyEquipments as SafetyEquipmentWithDate[]).map((equipment, index) => (
                <div
                  key={equipment.id}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 items-end"
                >
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">设施名称</label>
                    <input
                      type="text"
                      value={equipment.name}
                      onChange={(e) => handleSafetyEquipmentChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="如：干粉灭火器"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">数量</label>
                    <input
                      type="number"
                      min="0"
                      value={equipment.quantity}
                      onChange={(e) => handleSafetyEquipmentChange(index, 'quantity', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">最近检查日期</label>
                      <input
                        type="date"
                        value={equipment.lastCheckDate || ''}
                        onChange={(e) => handleSafetyEquipmentChange(index, 'lastCheckDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveSafetyEquipment(equipment.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/license')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            上一步
          </button>
          <button
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Save className="w-4 h-4" />
            保存草稿
          </button>
          <button
            onClick={() => navigate('/materials')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            下一步
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
