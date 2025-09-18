import React, { useState } from 'react';
import { Users, Search, Filter, Plus, Eye, Edit, Phone, MessageSquare, CheckCircle, Clock, AlertTriangle, Shield, UserCheck, Download, Star, UserPlus, X, MapPin, DollarSign, Heart, RefreshCw } from 'lucide-react';
import { type Beneficiary, type SystemUser } from '../../data/mockData';
import { useBeneficiaries } from '../../hooks/useBeneficiaries';
import { useAuth } from '../../context/AuthContext';
import BeneficiaryProfileModal from '../BeneficiaryProfileModal';
import BeneficiaryForm from '../BeneficiaryForm';
import { Button, Card, Input, Badge, StatCard, Modal } from '../ui';
import { mockBeneficiaries } from '../../data/mockData';

interface BeneficiariesListPageProps {
  onNavigateToIndividualSend?: (beneficiaryId: string) => void;
}

export default function BeneficiariesListPage({ onNavigateToIndividualSend }: BeneficiariesListPageProps) {
  const { loggedInUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'message'>('add');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    governorate: '',
    city: '',
    district: '',
    familyStatus: '',
    familySize: '',
    ageGroup: '',
    economicLevel: '',
    displacementStatus: '',
    profession: '',
    healthStatus: '',
    medicalCondition: ''
  });
  
  // استخدام Hook المخصص
  const { 
    beneficiaries, 
    loading, 
    error, 
    statistics, 
    refetch 
  } = useBeneficiaries({
    organizationId: loggedInUser?.associatedType === 'organization' ? loggedInUser.associatedId : undefined,
    familyId: loggedInUser?.associatedType === 'family' ? loggedInUser.associatedId : undefined,
    searchTerm,
    advancedFilters
  });

  // Get unique values for dynamic dropdowns
  const governorates = [...new Set(mockBeneficiaries.map(b => b.detailedAddress.governorate))];
  const cities = [...new Set(mockBeneficiaries
    .filter(b => !advancedFilters.governorate || b.detailedAddress.governorate === advancedFilters.governorate)
    .map(b => b.detailedAddress.city))];
  const districts = [...new Set(mockBeneficiaries
    .filter(b => 
      (!advancedFilters.governorate || b.detailedAddress.governorate === advancedFilters.governorate) &&
      (!advancedFilters.city || b.detailedAddress.city === advancedFilters.city)
    )
    .map(b => b.detailedAddress.district))];

  const handleAdvancedFilterChange = (field: string, value: string) => {
    setAdvancedFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      
      // Reset dependent filters when parent changes
      if (field === 'governorate') {
        newFilters.city = '';
        newFilters.district = '';
      } else if (field === 'city') {
        newFilters.district = '';
      }
      
      return newFilters;
    });
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({
      governorate: '',
      city: '',
      district: '',
      familyStatus: '',
      familySize: '',
      ageGroup: '',
      economicLevel: '',
      displacementStatus: '',
      profession: '',
      healthStatus: '',
      medicalCondition: ''
    });
  };

  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(advancedFilters).filter(value => value !== '').length;
  };

  const getActiveFilters = () => {
    const activeFilters = [];
    const filterLabels: { [key: string]: string } = {
      governorate: 'المحافظة',
      city: 'المدينة',
      district: 'الحي',
      familyStatus: 'الحالة العائلية',
      familySize: 'حجم الأسرة',
      ageGroup: 'الفئة العمرية',
      economicLevel: 'المستوى الاقتصادي',
      displacementStatus: 'حالة النزوح',
      profession: 'المهنة',
      healthStatus: 'الحالة الصحية',
      medicalCondition: 'الحالة الطبية'
    };

    Object.entries(advancedFilters).forEach(([key, value]) => {
      if (value) {
        activeFilters.push({
          key,
          label: filterLabels[key],
          value: getFilterDisplayValue(key, value)
        });
      }
    });

    return activeFilters;
  };

  const getFilterDisplayValue = (key: string, value: string): string => {
    const displayValues: { [key: string]: { [value: string]: string } } = {
      familyStatus: {
        'head_of_family': 'رب أسرة',
        'spouse': 'زوج/زوجة',
        'child': 'ابن/ابنة',
        'orphan_guardian': 'معيل أيتام',
        'family_with_orphans': 'أسرة لديها أيتام',
        'elderly': 'كبير سن',
        'disabled': 'من ذوي الاحتياجات الخاصة'
      },
      familySize: {
        'small': 'صغيرة (1-3 أفراد)',
        'medium': 'متوسطة (4-7 أفراد)',
        'large': 'كبيرة (8+ أفراد)'
      },
      ageGroup: {
        'child': 'طفل (أقل من 18)',
        'adult': 'بالغ (18-60)',
        'elderly': 'كبير سن (60+)'
      },
      economicLevel: {
        'very_poor': 'فقير جداً',
        'poor': 'فقير',
        'moderate': 'متوسط',
        'good': 'ميسور'
      },
      displacementStatus: {
        'displaced': 'نازح',
        'not_displaced': 'غير نازح',
        'returnee': 'عائد لمنزله'
      },
      healthStatus: {
        'has_medical': 'لديه حالة مرضية',
        'diabetes': 'مرض السكري',
        'hypertension': 'ضغط الدم',
        'disability': 'إعاقة',
        'chronic': 'مرض مزمن',
        'healthy': 'سليم'
      }
    };
    
    return displayValues[key]?.[value] || value;
  };

  const removeAdvancedFilter = (filterKey: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [filterKey]: ''
    }));
  };
  const handleViewBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setShowDetailsModal(true);
  };

  const handleEditBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setModalType('edit');
    setShowModal(true);
  };

  const handleSendMessage = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setModalType('message');
    setShowModal(true);
  };

  const handleCall = (phone: string) => {
    if (confirm(`هل تريد الاتصال بالرقم ${phone}؟`)) {
      window.open(`tel:${phone}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIdentityColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      <Card className="bg-blue-50 border-blue-200" padding="sm">
        <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">البيانات الوهمية محملة ({beneficiaries.length} مستفيد)</span>
        </div>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3 space-x-reverse">
          <Button variant="success" icon={Download} iconPosition="right">
            تصدير القائمة
          </Button>
          <Button 
            variant="primary"
            icon={Plus}
            iconPosition="right"
            onClick={() => {
              setModalType('add');
              setSelectedBeneficiary(null);
              setShowModal(true);
            }}
          >
            إضافة مستفيد جديد
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="grid md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-8">
            <Input
              placeholder="البحث في المستفيدين (الاسم، رقم الهوية، الهاتف)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="md:col-span-4">
            <Button
              variant="secondary" 
              icon={Filter} 
              iconPosition="right"
              onClick={toggleAdvancedFilters}
              className="w-full"
            >
              فلترة متقدمة {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
            </Button>
          </div>
        </div>
        
        {/* Advanced Filters Section */}
        {showAdvancedFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Filter className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">الفلاتر المتقدمة</h3>
                </div>
                <Button
                  variant="ghost"
                  icon={X}
                  onClick={toggleAdvancedFilters}
                  className="p-2"
                />
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Geographic Filters */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <MapPin className="w-4 h-4 ml-2 text-green-600" />
                    الفلاتر الجغرافية
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
                      <select
                        value={advancedFilters.governorate}
                        onChange={(e) => handleAdvancedFilterChange('governorate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">جميع المحافظات</option>
                        {governorates.map(gov => (
                          <option key={gov} value={gov}>{gov}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المدينة</label>
                      <select
                        value={advancedFilters.city}
                        onChange={(e) => handleAdvancedFilterChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={!advancedFilters.governorate}
                      >
                        <option value="">
                          {advancedFilters.governorate ? 'جميع المدن' : 'اختر المحافظة أولاً'}
                        </option>
                        {cities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الحي</label>
                      <select
                        value={advancedFilters.district}
                        onChange={(e) => handleAdvancedFilterChange('district', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={!advancedFilters.city}
                      >
                        <option value="">
                          {advancedFilters.city ? 'جميع الأحياء' : 'اختر المدينة أولاً'}
                        </option>
                        {districts.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Family and Social Status Filters */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="w-4 h-4 ml-2 text-purple-600" />
                    الحالة العائلية والاجتماعية
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الحالة العائلية</label>
                      <select
                        value={advancedFilters.familyStatus}
                        onChange={(e) => handleAdvancedFilterChange('familyStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">جميع الحالات</option>
                        <option value="head_of_family">رب أسرة</option>
                        <option value="spouse">زوج/زوجة</option>
                        <option value="child">ابن/ابنة</option>
                        <option value="orphan_guardian">معيل أيتام</option>
                        <option value="family_with_orphans">أسرة لديها أيتام</option>
                        <option value="elderly">كبير سن</option>
                        <option value="disabled">من ذوي الاحتياجات الخاصة</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">حجم الأسرة</label>
                      <select
                        value={advancedFilters.familySize}
                        onChange={(e) => handleAdvancedFilterChange('familySize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">جميع الأحجام</option>
                        <option value="small">صغيرة (1-3 أفراد)</option>
                        <option value="medium">متوسطة (4-7 أفراد)</option>
                        <option value="large">كبيرة (8+ أفراد)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الفئة العمرية</label>
                      <select
                        value={advancedFilters.ageGroup}
                        onChange={(e) => handleAdvancedFilterChange('ageGroup', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">جميع الأعمار</option>
                        <option value="child">طفل (أقل من 18)</option>
                        <option value="adult">بالغ (18-60)</option>
                        <option value="elderly">كبير سن (60+)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Economic and Social Status Filters */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 ml-2 text-orange-600" />
                    الحالة الاقتصادية والاجتماعية
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المستوى الاقتصادي</label>
                      <select
                        value={advancedFilters.economicLevel}
                        onChange={(e) => handleAdvancedFilterChange('economicLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">جميع المستويات</option>
                        <option value="very_poor">فقير جداً</option>
                        <option value="poor">فقير</option>
                        <option value="moderate">متوسط</option>
                        <option value="good">ميسور</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">حالة النزوح</label>
                      <select
                        value={advancedFilters.displacementStatus}
                        onChange={(e) => handleAdvancedFilterChange('displacementStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">جميع الحالات</option>
                        <option value="displaced">نازح</option>
                        <option value="not_displaced">غير نازح</option>
                        <option value="returnee">عائد لمنزله</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المهنة</label>
                      <input
                        type="text"
                        placeholder="مثال: عامل، طبيب، مدرس..."
                        value={advancedFilters.profession}
                        onChange={(e) => handleAdvancedFilterChange('profession', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Health Status Filters */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Heart className="w-4 h-4 ml-2 text-red-600" />
                    الحالة الصحية
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الحالة الصحية</label>
                      <select
                        value={advancedFilters.healthStatus}
                        onChange={(e) => handleAdvancedFilterChange('healthStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">جميع الحالات</option>
                        <option value="has_medical">لديه حالة مرضية</option>
                        <option value="diabetes">مرض السكري</option>
                        <option value="hypertension">ضغط الدم</option>
                        <option value="disability">إعاقة</option>
                        <option value="chronic">مرض مزمن</option>
                        <option value="healthy">سليم</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">حالة طبية محددة</label>
                      <input
                        type="text"
                        placeholder="مثال: سكري، ضغط، ربو..."
                        value={advancedFilters.medicalCondition}
                        onChange={(e) => handleAdvancedFilterChange('medicalCondition', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
        
              {/* Filter Actions */}
              <div className="flex space-x-3 space-x-reverse justify-center mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  icon={RefreshCw}
                  iconPosition="right"
                  onClick={handleClearAdvancedFilters}
                >
                  مسح الفلاتر
                </Button>
                <Button
                  variant="primary"
                  icon={CheckCircle}
                  iconPosition="right"
                  onClick={toggleAdvancedFilters}
                >
                  إخفاء الفلاتر
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">الفلاتر النشطة:</h4>
            <div className="flex flex-wrap gap-2">
              {getActiveFilters().map((filter) => (
                <Badge
                  key={filter.key}
                  variant="info"
                  size="sm"
                  className="flex items-center space-x-1 space-x-reverse"
                >
                  <span>{filter.label}: {filter.value}</span>
                  <button
                    onClick={() => removeAdvancedFilter(filter.key)}
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                iconPosition="right"
                onClick={handleClearAdvancedFilters}
                className="text-xs"
              >
                مسح الكل
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي المستفيدين"
          value={statistics.total}
          icon={Users}
          color="blue"
        />

        <StatCard
          title="موثقين"
          value={statistics.verified}
          icon={Shield}
          color="green"
        />

        <StatCard
          title="بانتظار التوثيق"
          value={statistics.pending}
          icon={Clock}
          color="orange"
        />

        <StatCard
          title="مرفوض التوثيق"
          value={statistics.rejected}
          icon={Shield}
          color="red"
        />
      </div>

      {/* Beneficiaries Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">قائمة المستفيدين ({beneficiaries.length})</h3>
            <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">البيانات الوهمية</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستفيد
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الهوية
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الهاتف
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المنطقة
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    آخر استلام
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {beneficiaries.length > 0 ? (
                  beneficiaries.map((beneficiary) => (
                    <tr key={beneficiary.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg ml-4">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className="text-sm font-medium text-gray-900">{beneficiary.name}</span>
                              {beneficiary.identityStatus === 'verified' && (
                                <Star className="w-4 h-4 text-green-500 fill-green-500" title="موثق" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {beneficiary.detailedAddress?.city || 'غير محدد'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.nationalId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.detailedAddress?.district || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <Badge 
                            variant={
                              beneficiary.identityStatus === 'verified' ? 'success' :
                              beneficiary.identityStatus === 'pending' ? 'warning' : 'error'
                            }
                            size="sm"
                          >
                            {beneficiary.identityStatus === 'verified' ? 'موثق' :
                             beneficiary.identityStatus === 'pending' ? 'بانتظار التوثيق' : 'مرفوض التوثيق'}
                          </Badge>
                          <Badge 
                            variant={
                              beneficiary.status === 'active' ? 'success' :
                              beneficiary.status === 'pending' ? 'warning' : 'error'
                            }
                            size="sm"
                          >
                            {beneficiary.status === 'active' ? 'نشط' :
                             beneficiary.status === 'pending' ? 'معلق' : 'متوقف'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.lastReceived ? new Date(beneficiary.lastReceived).toLocaleDateString('en-CA') : 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <button 
                            onClick={() => handleViewBeneficiary(beneficiary)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors" 
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditBeneficiary(beneficiary)}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors" 
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleSendMessage(beneficiary)}
                            className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors" 
                            title="إرسال رسالة"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleCall(beneficiary.phone)}
                            className="text-orange-600 hover:text-orange-900 p-2 rounded-lg hover:bg-orange-50 transition-colors" 
                            title="اتصال"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">لا توجد بيانات مستفيدين</p>
                        <p className="text-sm mt-2">
                          {searchTerm ? 'لا توجد نتائج للبحث' : 'لم يتم إضافة أي مستفيدين بعد'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      </Card>

      {/* Beneficiary Details Modal */}
      {showDetailsModal && selectedBeneficiary && (
        <BeneficiaryProfileModal
          beneficiary={selectedBeneficiary}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBeneficiary(null);
          }}
          onNavigateToIndividualSend={onNavigateToIndividualSend}
          onEditBeneficiary={handleEditBeneficiary}
          onSuspendBeneficiary={(beneficiaryId, beneficiaryName) => {
            setShowDetailsModal(false);
            // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
            alert(`تم تعليق حساب المستفيد: ${beneficiaryName}`);
          }}
        />
      )}

      {/* Add/Edit/Message Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'add' ? 'إضافة مستفيد جديد' :
            modalType === 'edit' ? 'تعديل بيانات المستفيد' :
            'إرسال رسالة'
          }
          size="lg"
        >
            <div className="text-center py-12">
              {(modalType === 'add' || modalType === 'edit') ? (
                <BeneficiaryForm
                  beneficiary={modalType === 'edit' ? selectedBeneficiary : null}
                  onSave={() => {
                    refetch();
                    setShowModal(false);
                    setSelectedBeneficiary(null);
                  }}
                  onCancel={() => {
                    setShowModal(false);
                    setSelectedBeneficiary(null);
                  }}
                />
              ) : (
                <>
                  <div className="bg-gray-100 rounded-xl p-8 mb-4">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">نموذج إرسال رسالة</p>
                    <p className="text-sm text-gray-500 mt-2">سيتم تطوير نموذج الرسائل هنا</p>
                  </div>
                  
                  <div className="flex space-x-3 space-x-reverse justify-center">
                    <Button
                      variant="secondary"
                      onClick={() => setShowModal(false)}
                    >
                      إلغاء
                    </Button>
                    <Button variant="primary">
                      إرسال الرسالة
                    </Button>
                  </div>
                </>
              )}
            </div>
        </Modal>
      )}

    </div>
  );
}