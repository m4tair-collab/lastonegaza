import React, { useState } from 'react';
import { Users, Upload, Send, CheckCircle, AlertTriangle, FileText, Download, Package, MapPin, Phone, Eye, Edit, Filter, Search, X, Plus, Trash2, Calendar, Clock, Star, TrendingUp, Building2, Heart, RefreshCw } from 'lucide-react';
import { 
  type Beneficiary, 
  mockBeneficiaries, 
  mockOrganizations, 
  mockPackageTemplates,
  mockFamilies,
  type Organization,
  type PackageTemplate,
  type Family,
  addOrUpdateBeneficiaryFromImport,
  validateImportedBeneficiary,
  generateBeneficiariesCSVTemplate
} from '../../data/mockData';

interface BulkTasksPageProps {
  preselectedBeneficiaryIds?: string[];
  onNavigateBack?: () => void;
}

export default function BulkTasksPage({ preselectedBeneficiaryIds = [], onNavigateBack }: BulkTasksPageProps) {
  const [sourceType, setSourceType] = useState<'internal' | 'organization' | 'family'>('internal');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [familySearch, setFamilySearch] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>(preselectedBeneficiaryIds);
  
  // Filters
  const [filters, setFilters] = useState({
    benefitStatus: '',
    familySize: '',
    hasChildren: '',
    hasElderly: '',
    area: '',
    lastReceived: '',
    dateAdded: ''
  });

  // استخدام البيانات الوهمية مباشرة
  const institutions = mockOrganizations;
  const packageTemplates = mockPackageTemplates;
  const families = mockFamilies;
  const allBeneficiaries = mockBeneficiaries;
  const loading = false;
  const organizationsError = null;
  const packageTemplatesError = null;
  const beneficiariesError = null;

  const regions = ['شمال غزة', 'مدينة غزة', 'الوسط', 'خان يونس', 'رفح'];

  const handleSourceSelect = (type: 'internal' | 'organization' | 'family', sourceId: string = '') => {
    setSourceType(type);
    setSelectedSourceId(sourceId);
    setSelectedTemplate(''); // Reset template selection
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
  };

  const getFilteredBeneficiaries = () => {
    let filtered = selectedBeneficiaries.length > 0 
      ? allBeneficiaries.filter(b => selectedBeneficiaries.includes(b.id))
      : allBeneficiaries;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(beneficiary => 
        beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficiary.nationalId.includes(searchTerm) || 
        beneficiary.phone.includes(searchTerm)
      );
    }

    // Apply other filters
    if (filters.benefitStatus === 'never' && filtered.some(b => b.totalPackages > 0)) {
      filtered = filtered.filter(b => b.totalPackages === 0);
    }
    if (filters.benefitStatus === 'recent' && filtered.some(b => b.totalPackages === 0)) {
      filtered = filtered.filter(b => b.totalPackages > 0);
    }
    
    if (filters.area) {
      filtered = filtered.filter(b => b.detailedAddress.governorate === getGovernorateFromFilter(filters.area));
    }
    
    return filtered;
  };

  const getGovernorateFromFilter = (area: string) => {
    const areaMap: { [key: string]: string } = {
      'north': 'شمال غزة',
      'gaza': 'غزة',
      'middle': 'الوسطى',
      'khan-younis': 'خان يونس',
      'rafah': 'رفح'
    };
    return areaMap[area] || area;
  };

  const filteredInstitutions = institutions.filter(inst =>
    inst.name.toLowerCase().includes(institutionSearch.toLowerCase())
  );

  const filteredFamilies = families.filter(family =>
    family.name.toLowerCase().includes(familySearch.toLowerCase())
  );

  const getAvailableTemplates = () => {
    if (sourceType === 'internal') {
      return packageTemplates.filter(template => template.organization_id === 'org-internal');
    } else if (sourceType === 'organization') {
      return packageTemplates.filter(template => template.organization_id === selectedSourceId);
    } else if (sourceType === 'family') {
      return packageTemplates.filter(template => template.family_id === selectedSourceId);
    }
    return [];
  };

  const availableTemplates = getAvailableTemplates();
  const selectedTemplateData = packageTemplates.find(t => t.id === selectedTemplate);
  const selectedSourceData = sourceType === 'organization' 
    ? institutions.find(i => i.id === selectedSourceId)
    : sourceType === 'family'
    ? families.find(f => f.id === selectedSourceId)
    : { name: 'طرود داخلية - من المنصة' };
  const filteredBeneficiaries = getFilteredBeneficiaries();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      // محاكاة معالجة الملف
      setTimeout(() => {
        // محاكاة تحليل ملف CSV
        const mockImportedData = [
          { name: 'أحمد محمد الخالدي', nationalId: '900123456', phone: '0597123456', alternativePhone: '0598123456' },
          { name: 'فاطمة سالم النجار', nationalId: '900234567', phone: '0598234567', alternativePhone: '' },
          { name: 'محمد علي الغزاوي', nationalId: '900345678', phone: '0599345678', alternativePhone: '0597345678' },
          { name: 'سارة أحمد الفرا', nationalId: '900456789', phone: '0596456789', alternativePhone: '' },
          { name: 'خالد يوسف النجار', nationalId: '900567890', phone: '0595567890', alternativePhone: '0599567890' }
        ];

        let imported = 0;
        let updated = 0;
        let errors = 0;
        const errorDetails: string[] = [];

        mockImportedData.forEach((data, index) => {
          const validation = validateImportedBeneficiary(data);
          if (validation.isValid) {
            const result = addOrUpdateBeneficiaryFromImport(data);
            if (result.isNew) {
              imported++;
            } else {
              updated++;
            }
          } else {
            errors++;
            errorDetails.push(`الصف ${index + 2}: ${validation.errors.join(', ')}`);
          }
        });

        setImportResults({
          imported,
          updated,
          errors,
          total: mockImportedData.length,
          errorDetails
        });

        alert(`تم تحليل الملف: ${file.name}\nتم استيراد ${imported} مستفيد جديد\nتم تحديث ${updated} مستفيد موجود\nأخطاء: ${errors}`);
        setShowUploadModal(false);
      }, 2000);
    }
  };

  const handleBulkSend = () => {
    if (!selectedSourceId && sourceType !== 'internal') {
      alert('يرجى اختيار مصدر الطرود');
      return;
    }
    if (!selectedTemplate || filteredBeneficiaries.length === 0) {
      alert('يرجى اختيار القالب والتأكد من وجود مستفيدين');
      return;
    }

    const sourceName = selectedSourceData?.name || 'غير محدد';
    const templateName = selectedTemplateData?.name;
    const count = filteredBeneficiaries.length;
    const totalCost = count * (selectedTemplateData?.estimatedCost || 0);

    if (confirm(`تأكيد الإرسال الجماعي:\n\nمصدر الطرود: ${sourceName}\nالقالب: ${templateName}\nعدد المستفيدين: ${count}\nالتكلفة المتوقعة: ${totalCost} ₪\n\nهل تريد المتابعة؟`)) {
      const sendId = `SEND-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      alert(`تم تأكيد الإرسال بنجاح!\n\nرقم الإرسالية: ${sendId}\nسيتم البدء في التحضير والتوزيع`);
      
      // Reset form
      setSourceType('internal');
      setSelectedSourceId('');
      setSelectedTemplate('');
      setFilters({
        benefitStatus: '',
        familySize: '',
        hasChildren: '',
        hasElderly: '',
        area: '',
        lastReceived: '',
        dateAdded: ''
      });
    }
  };

  const handlePreview = () => {
    if ((sourceType !== 'internal' && !selectedSourceId) || !selectedTemplate) {
      alert('يرجى اختيار مصدر الطرود والقالب أولاً');
      return;
    }
    setShowPreviewModal(true);
  };

  const downloadTemplate = () => {
    const csvContent = generateBeneficiariesCSVTemplate();
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'قالب_المستفيدين.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            البيانات الوهمية محملة - {institutions.length} مؤسسة، {families.length} عائلة، {packageTemplates.length} قالب، {allBeneficiaries.length} مستفيد
          </span>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">خطوات الإرسال الجماعي</h3>
          <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>الخطوة {sourceType !== 'internal' && selectedSourceId ? (selectedTemplate ? '3' : '2') : sourceType !== 'internal' ? '1' : selectedTemplate ? '2' : '1'} من 3</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className={`flex items-center space-x-2 space-x-reverse ${(sourceType !== 'internal' && selectedSourceId) || sourceType === 'internal' ? 'text-green-600' : 'text-blue-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(sourceType !== 'internal' && selectedSourceId) || sourceType === 'internal' ? 'bg-green-100' : 'bg-blue-100'}`}>
              {(sourceType !== 'internal' && selectedSourceId) || sourceType === 'internal' ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">1</span>}
            </div>
            <span className="text-sm font-medium">اختيار مصدر الطرود</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center space-x-2 space-x-reverse ${selectedTemplate ? 'text-green-600' : ((sourceType !== 'internal' && selectedSourceId) || sourceType === 'internal') ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedTemplate ? 'bg-green-100' : ((sourceType !== 'internal' && selectedSourceId) || sourceType === 'internal') ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {selectedTemplate ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">2</span>}
            </div>
            <span className="text-sm font-medium">اختيار القالب</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center space-x-2 space-x-reverse ${selectedTemplate && ((sourceType !== 'internal' && selectedSourceId) || sourceType === 'internal') ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedTemplate && ((sourceType !== 'internal' && selectedSourceId) || sourceType === 'internal') ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <span className="text-sm font-bold">3</span>
            </div>
            <span className="text-sm font-medium">اختيار المستفيدين</span>
          </div>
        </div>
      </div>

      {/* Package Source Selection */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">اختيار مصدر الطرود</h3>
          {((sourceType !== 'internal' && selectedSourceId) || sourceType === 'internal') && (
            <div className="flex items-center space-x-2 space-x-reverse text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">تم الاختيار</span>
            </div>
          )}
        </div>

        {/* Internal Packages - Always at Top */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 space-x-reverse mb-3">
            <Package className="w-4 h-4 text-green-600" />
            <h4 className="font-medium text-gray-900">الطرود الداخلية</h4>
          </div>
          <div
            onClick={() => handleSourceSelect('internal')}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
              sourceType === 'internal'
                ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">طرود داخلية - من المنصة</h4>
                  <p className="text-gray-600">طرود من مخزون المنصة الداخلي</p>
                  <div className="flex items-center space-x-2 space-x-reverse mt-2">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">داخلي</span>
                    <span className="text-sm text-gray-600">• متاح دائماً</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">1000+</p>
                <p className="text-sm text-gray-600">طرد متاح</p>
                <p className="text-xs text-gray-500 mt-1">10 قوالب</p>
              </div>
            </div>
          </div>
        </div>

        {/* External Organizations */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 space-x-reverse mb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-gray-900">المؤسسات الخيرية والدولية</h4>
          </div>

          {/* Institution Search */}
          <div className="relative mb-4">
            <Search className="w-5 h-5 absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن المؤسسة..."
              value={institutionSearch}
              onChange={(e) => setInstitutionSearch(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Popular Institutions */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              <Star className="w-4 h-4 text-yellow-500" />
              <h5 className="font-medium text-gray-900">المؤسسات الأكثر استخداماً</h5>
            </div>
            <div className="flex flex-wrap gap-2">
              {institutions.filter(inst => inst.isPopular && inst.id !== 'org-internal').map(institution => (
                <button
                  key={institution.id}
                  onClick={() => handleSourceSelect('organization', institution.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    sourceType === 'organization' && selectedSourceId === institution.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {institution.name}
                </button>
              ))}
            </div>
          </div>

          {/* All Institutions */}
          <div>
            <h5 className="font-medium text-gray-900 mb-3">جميع المؤسسات</h5>
            {filteredInstitutions.filter(inst => inst.id !== 'org-internal').length > 0 ? (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
                {filteredInstitutions.filter(inst => inst.id !== 'org-internal').map(institution => (
                  <div
                    key={institution.id}
                    onClick={() => handleSourceSelect('organization', institution.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                      sourceType === 'organization' && selectedSourceId === institution.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{institution.name}</p>
                          <p className="text-sm text-gray-600">
                            {institution.packagesAvailable || 0} طرد متاح • {institution.templatesCount || 0} قوالب
                          </p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded border-2 ${
                        sourceType === 'organization' && selectedSourceId === institution.id 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-300'
                      }`}>
                        {sourceType === 'organization' && selectedSourceId === institution.id && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>لا توجد مؤسسات متاحة</p>
                <p className="text-sm">يرجى إضافة مؤسسات أولاً</p>
              </div>
            )}
          </div>
        </div>

        {/* Supported Families */}
        <div>
          <div className="flex items-center space-x-2 space-x-reverse mb-3">
            <Heart className="w-4 h-4 text-purple-600" />
            <h4 className="font-medium text-gray-900">العائلات المدعومة</h4>
          </div>

          {/* Family Search */}
          <div className="relative mb-4">
            <Search className="w-5 h-5 absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن العائلة..."
              value={familySearch}
              onChange={(e) => setFamilySearch(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Families List */}
          {filteredFamilies.length > 0 ? (
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
              {filteredFamilies.map(family => {
                const supportingOrg = institutions.find(inst => inst.id === family.supportingOrganizationId);
                return (
                  <div
                    key={family.id}
                    onClick={() => handleSourceSelect('family', family.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                      sourceType === 'family' && selectedSourceId === family.id ? 'bg-purple-50 border-purple-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Heart className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{family.name}</p>
                          <p className="text-sm text-gray-600">
                            رب الأسرة: {family.headOfFamily} • {family.membersCount} فرد
                          </p>
                          {supportingOrg && (
                            <p className="text-xs text-purple-600 mt-1">
                              بدعم من: {supportingOrg.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded border-2 ${
                        sourceType === 'family' && selectedSourceId === family.id 
                          ? 'bg-purple-600 border-purple-600' 
                          : 'border-gray-300'
                      }`}>
                        {sourceType === 'family' && selectedSourceId === family.id && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Heart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>لا توجد عائلات متاحة</p>
              <p className="text-sm">يرجى إضافة عائلات أولاً</p>
            </div>
          )}
        </div>
      </div>

      {/* Template Selection */}
      {((sourceType !== 'internal' && selectedSourceId) || sourceType === 'internal') && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">اختيار قالب الطرد</h3>
            {selectedTemplate && (
              <div className="flex items-center space-x-2 space-x-reverse text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">تم الاختيار</span>
              </div>
            )}
          </div>

          {availableTemplates.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableTemplates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl">
                        {template.type === 'food' ? '🍚' : 
                         template.type === 'clothing' ? '👕' : 
                         template.type === 'medical' ? '💊' : 
                         template.type === 'hygiene' ? '🧼' : '🚨'}
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-green-600">{template.estimatedCost} ₪</span>
                        <p className="text-xs text-gray-500">{template.totalWeight} كيلو</p>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{template.contents.length} أصناف</p>
                    <div className="text-xs text-gray-500">
                      {template.contents.slice(0, 2).map(item => item.name).join(', ')}
                      {template.contents.length > 2 && '...'}
                    </div>

                    {template.usageCount > 0 && (
                      <div className="mt-2 flex items-center space-x-1 space-x-reverse text-xs text-blue-600">
                        <Star className="w-3 h-3" />
                        <span>استُخدم {template.usageCount} مرة</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>لا توجد قوالب متاحة لهذا المصدر</p>
              <p className="text-sm">يرجى إضافة قوالب طرود للمصدر المحدد</p>
            </div>
          )}
        </div>
      )}

      {/* Import Section */}
      {selectedTemplate && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">استيراد مستفيدين جدد</h3>
          
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
            onClick={() => setShowUploadModal(true)}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">استيراد قائمة مستفيدين من ملف Excel</h4>
            <p className="text-gray-600 mb-4">اسحب الملف هنا أو اضغط للاختيار (xlsx, xls, csv)</p>
            <div className="flex space-x-3 space-x-reverse justify-center">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Upload className="w-4 h-4 ml-2" />
                اختيار ملف
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadTemplate();
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 ml-2" />
                تحميل قالب جاهز
              </button>
            </div>
          </div>

          {importResults && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-medium text-green-800 mb-2">نتائج الاستيراد:</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div><strong>تم الاستيراد:</strong> {importResults.imported}</div>
                <div><strong>تم التحديث:</strong> {importResults.updated}</div>
                <div><strong>أخطاء:</strong> {importResults.errors}</div>
                <div><strong>الإجمالي:</strong> {importResults.total}</div>
              </div>
              {importResults.errorDetails && importResults.errorDetails.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-medium text-red-800 mb-2">تفاصيل الأخطاء:</h5>
                  <div className="text-sm text-red-700 space-y-1">
                    {importResults.errorDetails.map((error: string, index: number) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Beneficiaries Filters */}
      {selectedTemplate && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">فلاتر المستفيدين</h3>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">حالة الاستفادة</label>
              <select
                value={filters.benefitStatus}
                onChange={(e) => handleFilterChange('benefitStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع الحالات</option>
                <option value="never">لم يستفيدوا مطلقاً</option>
                <option value="recent">استفادوا مؤخراً</option>
                <option value="old">لم يستفيدوا منذ فترة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">حجم الأسرة</label>
              <select
                value={filters.familySize}
                onChange={(e) => handleFilterChange('familySize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع الأحجام</option>
                <option value="small">أقل من 5 أشخاص</option>
                <option value="medium">5-10 أشخاص</option>
                <option value="large">أكبر من 10 أشخاص</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة</label>
              <select
                value={filters.area}
                onChange={(e) => handleFilterChange('area', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع المناطق</option>
                <option value="north">شمال غزة</option>
                <option value="gaza">مدينة غزة</option>
                <option value="middle">الوسط</option>
                <option value="khan-younis">خان يونس</option>
                <option value="rafah">رفح</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">آخر استلام</label>
              <select
                value={filters.lastReceived}
                onChange={(e) => handleFilterChange('lastReceived', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">غير محدد</option>
                <option value="week">خلال أسبوع</option>
                <option value="month">خلال شهر</option>
                <option value="quarter">خلال 3 أشهر</option>
                <option value="never">لم يستلم أبداً</option>
              </select>
            </div>
          </div>

          {/* Beneficiaries Preview */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-800">المستفيدين المطابقين</h4>
              <span className="text-2xl font-bold text-blue-900">{filteredBeneficiaries.length}</span>
            </div>
            
            {filteredBeneficiaries.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredBeneficiaries.slice(0, 10).map(beneficiary => (
                  <div key={beneficiary.id} className="bg-white p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{beneficiary.name}</p>
                      <p className="text-sm text-gray-600">{beneficiary.detailedAddress?.district || 'غير محدد'} - {beneficiary.phone}</p>
                    </div>
                    <span className="text-xs text-gray-500">#{beneficiary.id}</span>
                  </div>
                ))}
                {filteredBeneficiaries.length > 10 && (
                  <div className="text-center text-gray-600 text-sm py-2">
                    ... و {filteredBeneficiaries.length - 10} مستفيد آخر
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-600 py-8">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>لا يوجد مستفيدين مطابقين للفلاتر المحددة</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Summary */}
      {selectedTemplate && ((sourceType !== 'internal' && selectedSourceId) || sourceType === 'internal') && filteredBeneficiaries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">ملخص الإرسال</h3>
          
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">عدد المستفيدين</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{filteredBeneficiaries.length}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <Package className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">نوع الطرد</span>
              </div>
              <p className="text-lg font-bold text-green-900">{selectedTemplateData?.name}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-800">التكلفة المتوقعة</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {(filteredBeneficiaries.length * (selectedTemplateData?.estimatedCost || 0)).toLocaleString()} ₪
              </p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <Star className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-800">الوزن الإجمالي</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {(filteredBeneficiaries.length * (selectedTemplateData?.totalWeight || 0)).toFixed(1)} كيلو
              </p>
            </div>
          </div>

          {/* Source Information */}
          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">معلومات المصدر</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">مصدر الطرود:</span>
                <span className="font-medium text-gray-900 mr-2">{selectedSourceData?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">نوع المصدر:</span>
                <span className="font-medium text-gray-900 mr-2">
                  {sourceType === 'internal' ? 'طرود داخلية' :
                   sourceType === 'organization' ? 'مؤسسة خارجية' :
                   'عائلة مدعومة'}
                </span>
              </div>
              {sourceType === 'family' && selectedSourceId && (
                <div className="md:col-span-2">
                  <span className="text-gray-600">المؤسسة الداعمة:</span>
                  <span className="font-medium text-purple-900 mr-2">
                    {(() => {
                      const family = families.find(f => f.id === selectedSourceId);
                      const supportingOrg = family ? institutions.find(inst => inst.id === family.supportingOrganizationId) : null;
                      return supportingOrg?.name || 'غير محدد';
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3 space-x-reverse justify-end">
            <button
              onClick={handlePreview}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center"
            >
              <Eye className="w-4 h-4 ml-2" />
              معاينة الإرسال
            </button>
            <button
              onClick={handleBulkSend}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center"
            >
              <Send className="w-5 h-5 ml-2" />
              تأكيد الإرسال ({filteredBeneficiaries.length} طرد)
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">رفع ملف المستفيدين</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-center py-8">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">اختر ملف Excel أو CSV يحتوي على بيانات المستفيدين</p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center"
              >
                <Upload className="w-4 h-4 ml-2" />
                اختيار ملف
              </label>
              <p className="text-xs text-gray-500 mt-4">
                الصيغ المدعومة: CSV, XLSX, XLS (حد أقصى 10 ميجابايت)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplateData && selectedSourceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">معاينة الإرسال الجماعي</h3>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">تفاصيل الإرسال</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">مصدر الطرود:</span>
                      <span className="font-medium">{selectedSourceData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">قالب الطرد:</span>
                      <span className="font-medium">{selectedTemplateData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">عدد المستفيدين:</span>
                      <span className="font-medium">{filteredBeneficiaries.length} مستفيد</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">التكلفة المتوقعة:</span>
                      <span className="font-medium text-green-600">
                        {(filteredBeneficiaries.length * selectedTemplateData.estimatedCost).toLocaleString()} ₪
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">الفلاتر المطبقة</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(filters).map(([key, value]) => {
                      if (!value) return null;
                      return (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600">{getFilterLabel(key)}:</span>
                          <span className="font-medium">{getFilterDisplayValue(key, value)}</span>
                        </div>
                      );
                    })}
                    {Object.values(filters).every(v => !v) && (
                      <p className="text-gray-500 italic">لا توجد فلاتر مطبقة</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sample Beneficiaries */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">عينة من المستفيدين (أول 10)</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredBeneficiaries.slice(0, 10).map((beneficiary, index) => (
                    <div key={beneficiary.id} className="bg-white p-3 rounded-lg flex justify-between items-center">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{beneficiary.name}</p>
                          <p className="text-sm text-gray-600">{beneficiary.detailedAddress?.district || 'غير محدد'}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{beneficiary.nationalId}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 space-x-reverse justify-end pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  العودة للتعديل
                </button>
                <button 
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleBulkSend();
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Send className="w-4 h-4 ml-2" />
                  تأكيد الإرسال النهائي
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getFilterLabel(key: string): string {
  const labels: { [key: string]: string } = {
    benefitStatus: 'حالة الاستفادة',
    familySize: 'حجم الأسرة',
    hasChildren: 'وجود أطفال',
    hasElderly: 'كبار السن',
    area: 'المنطقة',
    lastReceived: 'آخر استلام',
    dateAdded: 'تاريخ الإضافة'
  };
  return labels[key] || key;
}

function getFilterDisplayValue(key: string, value: string): string {
  const displayValues: { [key: string]: { [value: string]: string } } = {
    benefitStatus: {
      'never': 'لم يستفيدوا مطلقاً',
      'recent': 'استفادوا مؤخراً',
      'old': 'لم يستفيدوا منذ فترة'
    },
    familySize: {
      'small': 'أقل من 5 أشخاص',
      'medium': '5-10 أشخاص',
      'large': 'أكبر من 10 أشخاص'
    },
    area: {
      'north': 'شمال غزة',
      'gaza': 'مدينة غزة',
      'middle': 'الوسط',
      'khan-younis': 'خان يونس',
      'rafah': 'رفح'
    }
  };
  
  return displayValues[key]?.[value] || value;
}