import React, { useState } from 'react';
import { Package, Users, Send, CheckCircle, AlertTriangle, Clock, Building2, Search, Filter, Plus, Eye, Edit, X, ArrowLeft, Calendar, MapPin, Phone, FileText, Star, TrendingUp } from 'lucide-react';
import { 
  mockBeneficiaries, 
  mockOrganizations, 
  mockPackageTemplates,
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
  const [packageCode, setPackageCode] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Get beneficiaries data
  const allBeneficiaries = mockBeneficiaries;
  const organizations = mockOrganizations;
  const packageTemplates = mockPackageTemplates;

  // Filter beneficiaries for search
  const filteredBeneficiaries = allBeneficiaries.filter(ben =>
    ben.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ben.nationalId.includes(searchTerm) ||
    ben.phone.includes(searchTerm)
  );

  const selectedBeneficiariesData = allBeneficiaries.filter(b => selectedBeneficiaries.includes(b.id));
  const selectedOrganizationData = organizations.find(org => org.id === selectedOrganization);
  const selectedTemplateData = packageTemplates.find(t => t.id === selectedTemplate);
  const availableTemplates = packageTemplates.filter(t => t.organization_id === selectedOrganization);

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

    if (!selectedOrganization || (!selectedTemplate && !packageCode)) {
      alert('يرجى اختيار المؤسسة والطرد (قالب أو كود)');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeCreateTasks = () => {
    const taskId = `TASK-${Date.now()}`;
    const packageInfo = selectedTemplateData ? selectedTemplateData.name : `طرد برقم: ${packageCode}`;
    
    // محاكاة إنشاء المهام
    logInfo(`تم إنشاء ${selectedBeneficiaries.length} مهمة جديدة`, 'BulkTasksPage');
    
    alert(`تم إنشاء المهام بنجاح!\n\nرقم المهمة: ${taskId}\nعدد المستفيدين: ${selectedBeneficiaries.length}\nالطرد: ${packageInfo}\nالمؤسسة: ${selectedOrganizationData?.name}\n\nسيتم إشعار المندوبين قريباً`);
    
    // Reset form
    setSelectedBeneficiaries([]);
    setSelectedOrganization('');
    setSelectedTemplate('');
    setPackageCode('');
    setNotes('');
    setShowConfirmModal(false);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          {onNavigateBack && (
            <Button
              variant="secondary"
              icon={ArrowLeft}
              iconPosition="right"
              onClick={onNavigateBack}
            >
              العودة للقائمة
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">إنشاء مهام جماعية</h2>
            <p className="text-gray-600 mt-1">إنشاء مهام توزيع لمجموعة من المستفيدين</p>
          </div>
        </div>
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
        <h3 className="text-lg font-bold text-gray-900 mb-4">إضافة مستفيدين إضافيين</h3>
        
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
            <h3 className="text-lg font-bold text-gray-900">اختيار المؤسسة المانحة</h3>
            {selectedOrganization && (
              <div className="flex items-center space-x-2 space-x-reverse text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">تم الاختيار</span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((organization) => (
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
        </Card>
      )}

      {/* Package Selection */}
      {selectedOrganization && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">تحديد الطرد</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Template Selection */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">اختيار من القوالب المتاحة</h4>
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
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-900">{template.name}</h5>
                        <span className="text-sm font-bold text-green-600">{template.estimatedCost} ₪</span>
                      </div>
                      <p className="text-sm text-gray-600">{template.contents.length} أصناف</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.contents.slice(0, 2).map(item => item.name).join(', ')}
                        {template.contents.length > 2 && '...'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد قوالب متاحة</p>
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
      {selectedBeneficiaries.length > 0 && selectedOrganization && (selectedTemplate || packageCode) && (
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
                <div className="bg-green-100 p-3 rounded-xl mb-2">
                  <Building2 className="w-6 h-6 text-green-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">المؤسسة</p>
                <p className="text-lg font-bold text-green-900">{selectedOrganizationData?.name}</p>
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
                  <span className="text-gray-600">التكلفة الإجمالية:</span>
                  <span className="font-bold text-green-600 mr-2">
                    {(selectedBeneficiaries.length * selectedTemplateData.estimatedCost).toLocaleString()} ₪
                  </span>
                </div>
                <div>
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
                  <span className="text-gray-600">المؤسسة:</span>
                  <span className="font-medium text-gray-900">{selectedOrganizationData?.name}</span>
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