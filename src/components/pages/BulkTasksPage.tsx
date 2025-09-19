import React, { useState } from 'react';
import { Package, Users, Send, CheckCircle, AlertTriangle, Clock, Building2, Search, Filter, Plus, Eye, Edit, X, ArrowLeft, Calendar, MapPin, Phone, FileText, Star, TrendingUp, Upload, Download, RefreshCw, UserPlus, Trash2 } from 'lucide-react';
import { 
  mockBeneficiaries, 
  mockOrganizations, 
  mockPackageTemplates,
  addOrUpdateBeneficiaryFromImport,
  generateBeneficiariesCSVTemplate,
  validateImportedBeneficiary,
  type Beneficiary,
  type Organization,
  type PackageTemplate
} from '../../data/mockData';
import { Button, Card, Input, Badge, Modal } from '../ui';
import { useErrorLogger } from '../../utils/errorLogger';

interface BulkTasksPageProps {
  preselectedBeneficiaryIds?: string[];
  onNavigateBack?: () => void;
}

export default function BulkTasksPage({ preselectedBeneficiaryIds = [], onNavigateBack }: BulkTasksPageProps) {
  const { logInfo, logError } = useErrorLogger();
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>(preselectedBeneficiaryIds);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [packageCode, setPackageCode] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [institutionSearch, setInstitutionSearch] = useState('');
  
  // حالة استيراد المستفيدين
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    imported: number;
    updated: number;
    errors: Array<{ row: number; errors: string[] }>;
    importedBeneficiaries: Beneficiary[];
  } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Get beneficiaries data
  const allBeneficiaries = mockBeneficiaries;
  const organizations = mockOrganizations;
  const families = mockFamilies;
  const packageTemplates = mockPackageTemplates;

  // Filter beneficiaries for search
  const filteredBeneficiaries = allBeneficiaries.filter(ben =>
    ben.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ben.nationalId.includes(searchTerm) ||
    ben.phone.includes(searchTerm)
  );

  const selectedBeneficiariesData = allBeneficiaries.filter(b => selectedBeneficiaries.includes(b.id));
  const selectedOrganizationData = organizations.find(org => org.id === selectedOrganization);
  const selectedFamilyData = families.find(f => f.id === selectedFamily);
  const selectedTemplateData = packageTemplates.find(t => t.id === selectedTemplate);
  
  // الحصول على القوالب المتاحة بناءً على المصدر المحدد
  const availableTemplates = selectedOrganization 
    ? packageTemplates.filter(t => t.organization_id === selectedOrganization)
    : selectedFamily 
    ? packageTemplates.filter(t => t.family_id === selectedFamily)
    : [];

  const filteredInstitutions = organizations.filter(inst =>
    inst.name.toLowerCase().includes(institutionSearch.toLowerCase())
  );

  const handleSelectBeneficiary = (beneficiaryId: string) => {
    setSelectedBeneficiaries(prev => 
      prev.includes(beneficiaryId) 
        ? prev.filter(id => id !== beneficiaryId)
        : [...prev, beneficiaryId]
    );
  };

  const handleRemoveBeneficiary = (beneficiaryId: string) => {
    setSelectedBeneficiaries(prev => prev.filter(id => id !== beneficiaryId));
  };

  const handleCreateTasks = () => {
    if (selectedBeneficiaries.length === 0) {
      alert('يرجى تحديد مستفيدين أولاً');
      return;
    }

    if ((!selectedOrganization && !selectedFamily) || (!selectedTemplate && !packageCode)) {
      alert('يرجى اختيار مصدر الطرد (مؤسسة أو عائلة) والطرد (قالب أو كود)');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeCreateTasks = () => {
    const taskId = `TASK-${Date.now()}`;
    const packageInfo = selectedTemplateData ? selectedTemplateData.name : `طرد برقم: ${packageCode}`;
    const sourceInfo = selectedOrganizationData ? selectedOrganizationData.name : selectedFamilyData ? selectedFamilyData.name : 'غير محدد';
    
    // محاكاة إنشاء المهام
    logInfo(`تم إنشاء ${selectedBeneficiaries.length} مهمة جديدة`, 'BulkTasksPage');
    
    alert(`تم إنشاء المهام بنجاح!\n\nرقم المهمة: ${taskId}\nعدد المستفيدين: ${selectedBeneficiaries.length}\nالطرد: ${packageInfo}\nالمصدر: ${sourceInfo}\n\nسيتم إشعار المندوبين قريباً`);
    
    // Reset form
    setSelectedBeneficiaries([]);
    setSelectedOrganization('');
    setSelectedFamily('');
    setSelectedTemplate('');
    setPackageCode('');
    setNotes('');
    setShowConfirmModal(false);
  };

  // وظائف استيراد المستفيدين
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImportBeneficiaries = async () => {
    if (!importFile) {
      setNotification({ message: 'يرجى اختيار ملف أولاً', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      // محاكاة قراءة الملف
      await new Promise(resolve => setTimeout(resolve, 2000));

      // محاكاة تحليل البيانات من CSV
      const mockCSVData = [
        { name: 'أحمد محمد المستورد', nationalId: '900111111', phone: '0597111111', alternativePhone: '0598111111' },
        { name: 'فاطمة سالم المستوردة', nationalId: '900222222', phone: '0597222222', alternativePhone: '' },
        { name: 'محمد علي المستورد', nationalId: '900333333', phone: '0597333333', alternativePhone: '0598333333' },
        { name: 'سارة أحمد المستوردة', nationalId: '900444444', phone: '0597444444', alternativePhone: '' },
        { name: 'خالد يوسف المستورد', nationalId: '900555555', phone: '0597555555', alternativePhone: '0598555555' },
        { name: 'مريم محمد المستوردة', nationalId: '900666666', phone: '0597666666', alternativePhone: '' },
        { name: 'يوسف أحمد المستورد', nationalId: '900777777', phone: '0597777777', alternativePhone: '0598777777' },
        { name: 'نور سالم المستوردة', nationalId: '900888888', phone: '0597888888', alternativePhone: '' }
      ];

      const results = {
        total: mockCSVData.length,
        imported: 0,
        updated: 0,
        errors: [] as Array<{ row: number; errors: string[] }>,
        importedBeneficiaries: [] as Beneficiary[]
      };

      // معالجة كل صف
      mockCSVData.forEach((rowData, index) => {
        const validation = validateImportedBeneficiary(rowData);
        
        if (!validation.isValid) {
          results.errors.push({
            row: index + 2, // +2 لأن الصف الأول هو العناوين والفهرسة تبدأ من 1
            errors: validation.errors
          });
          return;
        }

        try {
          const result = addOrUpdateBeneficiaryFromImport({
            name: rowData.name.trim(),
            nationalId: rowData.nationalId.trim(),
            phone: rowData.phone?.trim(),
            alternativePhone: rowData.alternativePhone?.trim()
          });

          if (result.isNew) {
            results.imported++;
          } else if (result.updated.length > 0) {
            results.updated++;
          }

          results.importedBeneficiaries.push(result.beneficiary);
        } catch (error) {
          results.errors.push({
            row: index + 2,
            errors: ['خطأ في معالجة البيانات']
          });
        }
      });

      setImportResults(results);

      // إضافة المستفيدين المستوردين للقائمة المحددة
      const newSelectedIds = results.importedBeneficiaries.map(b => b.id);
      setSelectedBeneficiaries(prev => [...prev, ...newSelectedIds]);

      // إشعار النجاح
      setNotification({
        message: `تم استيراد ${results.imported} مستفيد جديد وتحديث ${results.updated} مستفيد موجود`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 5000);

      logInfo(`تم استيراد ${results.imported + results.updated} مستفيد من ملف: ${importFile.name}`, 'BulkTasksPage');
    } catch (error) {
      setNotification({ message: 'حدث خطأ في استيراد الملف', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      logError(error as Error, 'BulkTasksPage');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = generateBeneficiariesCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'قالب_المستفيدين.csv';
    link.click();
    URL.revokeObjectURL(link);
    
    setNotification({ message: 'تم تحميل قالب CSV بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const clearImportResults = () => {
    setImportResults(null);
    setImportFile(null);
    setShowImportModal(false);
  };

  const getNotificationClasses = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'success': return 'bg-green-100 border-green-200 text-green-800';
      case 'error': return 'bg-red-100 border-red-200 text-red-800';
      case 'warning': return 'bg-orange-100 border-orange-200 text-orange-800';
    }
  };

  const getNotificationIcon = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <Clock className="w-5 h-5 text-orange-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالي';
      case 'normal': return 'عادي';
      default: return 'غير محدد';
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 space-x-reverse ${getNotificationClasses(notification.type)}`}>
          {getNotificationIcon(notification.type)}
          <span className="font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">إنشاء مهام جماعية</h2>
        <p className="text-gray-600 mt-1">إنشاء مهام توزيع لمجموعة من المستفيدين</p>
      </div>

      {/* Progress Indicator */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">خطوات إنشاء المهام</h3>
          <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>الخطوة {selectedBeneficiaries.length > 0 ? (selectedOrganization ? (selectedTemplate || packageCode ? '3' : '2') : '2') : '1'} من 3</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className={`flex items-center space-x-2 space-x-reverse ${selectedBeneficiaries.length > 0 ? 'text-green-600' : 'text-blue-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedBeneficiaries.length > 0 ? 'bg-green-100' : 'bg-blue-100'}`}>
              {selectedBeneficiaries.length > 0 ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">1</span>}
            </div>
            <span className="text-sm font-medium">تحديد المستفيدين</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center space-x-2 space-x-reverse ${selectedOrganization ? 'text-green-600' : selectedBeneficiaries.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedOrganization ? 'bg-green-100' : selectedBeneficiaries.length > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {selectedOrganization ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">2</span>}
            </div>
            <span className="text-sm font-medium">اختيار المؤسسة</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center space-x-2 space-x-reverse ${(selectedTemplate || packageCode) && selectedOrganization ? 'text-green-600' : selectedOrganization ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(selectedTemplate || packageCode) && selectedOrganization ? 'bg-green-100' : selectedOrganization ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {(selectedTemplate || packageCode) && selectedOrganization ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">3</span>}
            </div>
            <span className="text-sm font-medium">تحديد الطرد</span>
          </div>
        </div>
      </Card>

      {/* Selected Beneficiaries */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">المستفيدين المحددين ({selectedBeneficiaries.length})</h3>
          <div className="flex space-x-2 space-x-reverse">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedBeneficiaries([])}
              disabled={selectedBeneficiaries.length === 0}
            >
              مسح الكل
            </Button>
          </div>
        </div>

        {selectedBeneficiaries.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
            {selectedBeneficiariesData.map((beneficiary) => (
              <div key={beneficiary.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{beneficiary.name}</p>
                    <p className="text-sm text-gray-600">{beneficiary.detailedAddress.district}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveBeneficiary(beneficiary.id)}
                  className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">لم يتم تحديد أي مستفيدين</p>
            <p className="text-sm mt-2">يرجى تحديد المستفيدين من القائمة أدناه</p>
          </div>
        )}
      </Card>

      {/* Add More Beneficiaries */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">إضافة مستفيدين إضافيين</h3>
        </div>
        
        <div className="mb-4">
          <Input
            type="text"
            icon={Search}
            iconPosition="right"
            placeholder="البحث عن مستفيدين (الاسم، رقم الهوية، الهاتف)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {searchTerm && (
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredBeneficiaries.filter(b => !selectedBeneficiaries.includes(b.id)).slice(0, 10).map((beneficiary) => (
              <div
                key={beneficiary.id}
                onClick={() => handleSelectBeneficiary(beneficiary.id)}
                className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <Users className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{beneficiary.name}</p>
                    <p className="text-sm text-gray-600">{beneficiary.nationalId} - {beneficiary.phone}</p>
                    <p className="text-sm text-gray-500">{beneficiary.detailedAddress.district}</p>
                  </div>
                </div>
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Organization Selection */}
      {selectedBeneficiaries.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">اختيار مصدر الطرود</h3>
            {selectedOrganization && (
              <div className="flex items-center space-x-2 space-x-reverse text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">تم الاختيار</span>
              </div>
            )}
          </div>

          {/* طرود داخلية - ثابتة في البداية */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="bg-green-100 p-3 rounded-xl border-2 border-green-200">
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <h4 className="text-xl font-bold text-gray-900">طرود داخلية - من المنصة</h4>
                      <Badge variant="success" className="bg-green-600 text-white">
                        داخلي
                      </Badge>
                    </div>
                    <p className="text-green-700 font-medium">طرود من مخزون المنصة الخاص</p>
                    <p className="text-sm text-green-600 mt-1">
                      1000 طرد متاح • 10 قوالب جاهزة • متاح فوراً
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrganization(organizations.find(org => org.name === 'طرود داخلية - من المنصة')?.id || '')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    selectedOrganization === organizations.find(org => org.name === 'طرود داخلية - من المنصة')?.id
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white text-green-600 border-2 border-green-300 hover:bg-green-50'
                  }`}
                >
                  {selectedOrganization === organizations.find(org => org.name === 'طرود داخلية - من المنصة')?.id ? 'محدد' : 'اختيار'}
                </button>
              </div>
            </div>
          </div>

          {/* المؤسسات الخارجية */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h4 className="text-lg font-bold text-gray-900">المؤسسات الخيرية والدولية</h4>
            </div>
            
            {/* شريط البحث للمؤسسات */}
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
              {filteredInstitutions.filter(org => org.name !== 'طرود داخلية - من المنصة').map((organization) => (
                <div
                  key={organization.id}
                  onClick={() => setSelectedOrganization(organization.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedOrganization === organization.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 space-x-reverse mb-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{organization.name}</h4>
                      <p className="text-sm text-gray-600">{organization.type}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {organization.packagesAvailable || 0} طرد متاح • {organization.templatesCount || 0} قوالب
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* العائلات المدعومة */}
          <div>
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <Heart className="w-5 h-5 text-purple-600" />
              <h4 className="text-lg font-bold text-gray-900">العائلات المدعومة من مؤسسات خارجية</h4>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {families.map((family) => {
                const familyTemplates = packageTemplates.filter(t => t.family_id === family.id);
                return (
                  <div
                    key={family.id}
                    onClick={() => setSelectedFamily(family.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedFamily === family.id
                        ? 'border-purple-500 bg-purple-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 space-x-reverse mb-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Heart className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{family.name}</h4>
                        <p className="text-sm text-gray-600">{family.membersCount} فرد</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {familyTemplates.length} قالب متاح • مدعوم خارجياً
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Package Selection */}
      {(selectedOrganization || selectedFamily) && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">تحديد الطرد</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Template Selection */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                اختيار من القوالب المتاحة 
                {selectedOrganizationData && ` - ${selectedOrganizationData.name}`}
                {selectedFamilyData && ` - ${selectedFamilyData.name}`}
              </h4>
              {availableTemplates.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {availableTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setPackageCode('');
                      }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? selectedFamily ? 'border-purple-500 bg-purple-50' : 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-900">{template.name}</h5>
                        <span className={`text-sm font-bold ${selectedFamily ? 'text-purple-600' : 'text-green-600'}`}>
                          {template.estimatedCost} ₪
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{template.contents.length} أصناف</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.contents.slice(0, 2).map(item => item.name).join(', ')}
                        {template.contents.length > 2 && '...'}
                      </div>
                      {selectedFamily && (
                        <div className="mt-2 text-xs text-purple-600 font-medium">
                          مدعوم من مؤسسة خارجية
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد قوالب متاحة لهذا المصدر</p>
                </div>
              )}
            </div>

            {/* Package Code Input */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">أو إدخال كود الطرد</h4>
              <div className="space-y-4">
                <Input
                  label="كود/رقم الطرد"
                  type="text"
                  value={packageCode}
                  onChange={(e) => {
                    setPackageCode(e.target.value);
                    if (e.target.value) setSelectedTemplate('');
                  }}
                  placeholder="مثال: PKG-2024-001"
                />
                
                {packageCode && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">طرد مخصص</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      سيتم إنشاء مهام لطرد برقم: <strong>{packageCode}</strong>
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      تأكد من وجود هذا الطرد في المخزون
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Task Options */}
      {(selectedTemplate || packageCode) && selectedOrganization && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">خيارات المهمة</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">أولوية التوزيع</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="normal">عادية - خلال 2-3 أيام</option>
                <option value="high">عالية - خلال 24 ساعة</option>
                <option value="urgent">عاجلة - خلال 6 ساعات</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ التوزيع المطلوب</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات للمندوبين</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="تعليمات خاصة للمندوبين أو ملاحظات حول التوزيع..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Summary and Create Tasks */}
      {selectedBeneficiaries.length > 0 && (selectedOrganization || selectedFamily) && (selectedTemplate || packageCode) && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">ملخص المهام</h3>
          
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200 mb-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-xl mb-2">
                  <Users className="w-6 h-6 text-blue-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">عدد المستفيدين</p>
                <p className="text-2xl font-bold text-blue-900">{selectedBeneficiaries.length}</p>
              </div>

              <div className="text-center">
                <div className={`p-3 rounded-xl mb-2 ${selectedFamily ? 'bg-purple-100' : 'bg-green-100'}`}>
                  {selectedFamily ? (
                    <Heart className="w-6 h-6 text-purple-600 mx-auto" />
                  ) : (
                    <Building2 className="w-6 h-6 text-green-600 mx-auto" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{selectedFamily ? 'العائلة' : 'المصدر'}</p>
                <p className={`text-lg font-bold ${selectedFamily ? 'text-purple-900' : 'text-green-900'}`}>
                  {selectedOrganizationData?.name || selectedFamilyData?.name}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-xl mb-2">
                  <Package className="w-6 h-6 text-purple-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">الطرد</p>
                <p className="text-lg font-bold text-purple-900">
                  {selectedTemplateData ? selectedTemplateData.name : packageCode}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-orange-100 p-3 rounded-xl mb-2">
                  <Clock className="w-6 h-6 text-orange-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">الأولوية</p>
                <Badge variant={
                  priority === 'urgent' ? 'error' :
                  priority === 'high' ? 'warning' : 'info'
                } className="text-lg font-bold">
                  {getPriorityText(priority)}
                </Badge>
              </div>
            </div>
          </div>

          {selectedTemplateData && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-900 mb-3">تفاصيل الطرد</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">المصدر:</span>
                  <span className="font-bold text-gray-900 mr-2">
                    {selectedOrganizationData?.name || selectedFamilyData?.name}
                  </span>
                  {selectedFamily && (
                    <span className="text-xs text-purple-600 block mt-1">
                      مدعوم من مؤسسة خارجية
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-gray-600">التكلفة الإجمالية:</span>
                  <span className="font-bold text-green-600 mr-2">
                    {(selectedBeneficiaries.length * selectedTemplateData.estimatedCost).toLocaleString()} ₪
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-600">الوزن الإجمالي:</span>
                  <span className="font-bold text-gray-900 mr-2">
                    {(selectedBeneficiaries.length * selectedTemplateData.totalWeight).toFixed(1)} كيلو
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            icon={Send}
            iconPosition="right"
            onClick={handleCreateTasks}
            className="w-full text-lg py-4"
          >
            إنشاء {selectedBeneficiaries.length} مهمة توزيع
          </Button>
        </Card>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="تأكيد إنشاء المهام"
          size="md"
        >
          <div className="p-6 text-center">
            <div className="bg-blue-100 p-6 rounded-xl mb-6">
              <Send className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">هل أنت متأكد من إنشاء هذه المهام؟</h3>
              <p className="text-gray-600">
                سيتم إنشاء {selectedBeneficiaries.length} مهمة توزيع وإشعار المندوبين
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-right mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">عدد المستفيدين:</span>
                  <span className="font-medium text-gray-900">{selectedBeneficiaries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">المصدر:</span>
                  <span className="font-medium text-gray-900">{selectedOrganizationData?.name || selectedFamilyData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الطرد:</span>
                  <span className="font-medium text-gray-900">
                    {selectedTemplateData ? selectedTemplateData.name : packageCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الأولوية:</span>
                  <span className="font-medium text-gray-900">{getPriorityText(priority)}</span>
                </div>
                {selectedTemplateData && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">التكلفة المتوقعة:</span>
                    <span className="font-medium text-green-600">
                      {(selectedBeneficiaries.length * selectedTemplateData.estimatedCost).toLocaleString()} ₪
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse justify-center">
              <Button
                variant="secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={executeCreateTasks}
              >
                تأكيد إنشاء المهام
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <Modal
          isOpen={showImportModal}
          onClose={() => {
            if (!isImporting) {
              clearImportResults();
            }
          }}
          title="استيراد مستفيدين من ملف Excel/CSV"
          size="lg"
        >
          <div className="p-6">
            {!importResults ? (
              <div className="space-y-6">
                {/* File Upload Section */}
                <div className="text-center">
                  <div className="bg-blue-50 p-8 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-400 transition-colors">
                    <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">اختر ملف Excel أو CSV</h4>
                    <p className="text-gray-600 mb-4">
                      يجب أن يحتوي الملف على: الاسم، رقم الهوية، رقم الهاتف (اختياري)، رقم الهاتف البديل (اختياري)
                    </p>
                    
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="beneficiaries-file-upload"
                      disabled={isImporting}
                    />
                    <label
                      htmlFor="beneficiaries-file-upload"
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center"
                    >
                      <Upload className="w-4 h-4 ml-2" />
                      اختيار ملف
                    </label>
                  </div>
                  
                  {importFile && (
                    <div className="mt-4 bg-green-50 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <FileText className="w-5 h-5 text-green-600" />
                        <div className="text-right">
                          <p className="font-medium text-green-800">تم اختيار الملف: {importFile.name}</p>
                          <p className="text-sm text-green-600">الحجم: {(importFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Template Download */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">تحميل قالب CSV جاهز</h4>
                      <p className="text-sm text-gray-600">قالب يحتوي على أمثلة وتنسيق صحيح للبيانات</p>
                    </div>
                    <Button
                      variant="secondary"
                      icon={Download}
                      iconPosition="right"
                      onClick={downloadCSVTemplate}
                    >
                      تحميل القالب
                    </Button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3">تعليمات الاستيراد</h4>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li className="flex items-start space-x-2 space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>الملف يجب أن يحتوي على عمود "الاسم" وعمود "رقم الهوية" كحد أدنى</span>
                    </li>
                    <li className="flex items-start space-x-2 space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>رقم الهوية يجب أن يكون 9 أرقام بالضبط</span>
                    </li>
                    <li className="flex items-start space-x-2 space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام</span>
                    </li>
                    <li className="flex items-start space-x-2 space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>إذا كان المستفيد موجود (نفس رقم الهوية)، سيتم تحديث بياناته</span>
                    </li>
                    <li className="flex items-start space-x-2 space-x-reverse">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>الحد الأقصى لحجم الملف: 10 ميجابايت</span>
                    </li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 space-x-reverse justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setShowImportModal(false)}
                    disabled={isImporting}
                  >
                    إلغاء
                  </Button>
                  <Button
                    variant="primary"
                    icon={isImporting ? undefined : Upload}
                    iconPosition="right"
                    onClick={handleImportBeneficiaries}
                    disabled={!importFile || isImporting}
                    loading={isImporting}
                  >
                    {isImporting ? 'جاري الاستيراد...' : 'بدء الاستيراد'}
                  </Button>
                </div>
              </div>
            ) : (
              /* Import Results */
              <div className="space-y-6">
                {/* Results Summary */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3 space-x-reverse mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">نتائج الاستيراد</h3>
                      <p className="text-gray-600">تم معالجة الملف: {importFile?.name}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">إجمالي الصفوف</p>
                        <p className="text-2xl font-bold text-gray-900">{importResults.total}</p>
                      </div>
                    </div>
                    <div className="bg-green-100 p-4 rounded-lg border border-green-200">
                      <div className="text-center">
                        <p className="text-sm text-green-600">مستفيدين جدد</p>
                        <p className="text-2xl font-bold text-green-900">{importResults.imported}</p>
                      </div>
                    </div>
                    <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                      <div className="text-center">
                        <p className="text-sm text-blue-600">تم التحديث</p>
                        <p className="text-2xl font-bold text-blue-900">{importResults.updated}</p>
                      </div>
                    </div>
                    <div className="bg-red-100 p-4 rounded-lg border border-red-200">
                      <div className="text-center">
                        <p className="text-sm text-red-600">أخطاء</p>
                        <p className="text-2xl font-bold text-red-900">{importResults.errors.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Imported Beneficiaries */}
                {importResults.importedBeneficiaries.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 mb-3">المستفيدين المستوردين ({importResults.importedBeneficiaries.length})</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {importResults.importedBeneficiaries.map((beneficiary, index) => (
                        <div key={beneficiary.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <UserPlus className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{beneficiary.name}</p>
                              <p className="text-sm text-gray-600">{beneficiary.nationalId} - {beneficiary.phone}</p>
                            </div>
                          </div>
                          <Badge variant="success" size="sm">
                            {mockBeneficiaries.find(b => b.nationalId === beneficiary.nationalId && b.id !== beneficiary.id) ? 'محدث' : 'جديد'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {importResults.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h4 className="font-medium text-red-800 mb-3">أخطاء الاستيراد ({importResults.errors.length})</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {importResults.errors.map((error, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-red-200">
                          <div className="flex items-start space-x-2 space-x-reverse">
                            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-red-800">الصف {error.row}:</p>
                              <ul className="text-sm text-red-700 mt-1">
                                {error.errors.map((err, errIndex) => (
                                  <li key={errIndex}>• {err}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 space-x-reverse justify-end pt-4 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    icon={RefreshCw}
                    iconPosition="right"
                    onClick={clearImportResults}
                  >
                    استيراد ملف آخر
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setShowImportModal(false)}
                  >
                    إغلاق ({importResults.imported + importResults.updated} مستفيد مضاف)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <Package className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">تعليمات إنشاء المهام الجماعية</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن تحديد المستفيدين من القائمة الحالية أو البحث عن مستفيدين إضافيين</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن استيراد مستفيدين جدد من ملف Excel أو CSV</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن اختيار قالب طرد جاهز أو إدخال كود طرد مخصص</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>سيتم تعيين أفضل المندوبين المتاحين حسب المناطق</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>سيتم إرسال إشعارات للمستفيدين والمندوبين</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}