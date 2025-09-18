import React, { useState } from 'react';
import { Users, Search, Filter, Plus, Eye, Edit, Phone, MessageSquare, CheckCircle, Clock, AlertTriangle, Star, UserCheck, Download, UserPlus, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus, RefreshCw, X } from 'lucide-react';
import { type Beneficiary } from '../../data/mockData';
import { useBeneficiaries } from '../../hooks/useBeneficiaries';
import { useAuth } from '../../context/AuthContext';
import BeneficiaryProfileModal from '../BeneficiaryProfileModal';
import { Button, Card, Input, Badge, ConfirmationModal, Modal } from '../ui';
import { useErrorLogger } from '../../utils/errorLogger';
import ExportBeneficiariesModal from '../modals/ExportBeneficiariesModal';

interface BeneficiariesListPageProps {
  onNavigateToIndividualSend?: (beneficiaryId: string) => void;
  onNavigateToTasks?: (beneficiaryIds: string[]) => void;
}

export default function BeneficiariesListPage({ 
  onNavigateToIndividualSend, 
  onNavigateToTasks 
}: BeneficiariesListPageProps) {
  const { loggedInUser } = useAuth();
  const { logInfo, logError } = useErrorLogger();
  
  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [identityStatusFilter, setIdentityStatusFilter] = useState('all');
  const [governorateFilter, setGovernorateFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    cityFilter: 'all',
    districtFilter: 'all',
    familyStatusFilter: 'all',
    familySizeFilter: 'all',
    ageGroupFilter: 'all',
    economicLevelFilter: 'all',
    professionFilter: '',
    healthStatusFilter: 'all',
    medicalConditionFilter: '',
    organizationFilter: 'all',
    lastReceivedFilter: 'all'
  });
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // State for sorting
  const [sortColumn, setSortColumn] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // State for modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  
  // State for batch actions
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
  const [showBatchToolbar, setShowBatchToolbar] = useState(false);
  
  // State for confirmation modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'reupload' | 'batch-approve' | 'batch-reject' | 'batch-reupload' | 'suspend';
    beneficiaryId?: string;
    beneficiaryIds?: string[];
    beneficiaryName?: string;
  } | null>(null);

  // Use the beneficiaries hook with current filters
  const {
    beneficiaries: allBeneficiaries,
    loading,
    error,
    statistics,
    addBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
    refetch
  } = useBeneficiaries({
    searchTerm,
    statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
    identityStatusFilter: identityStatusFilter !== 'all' ? identityStatusFilter : undefined,
    advancedFilters: {
      governorate: governorateFilter !== 'all' ? governorateFilter : undefined,
      city: advancedFilters.cityFilter !== 'all' ? advancedFilters.cityFilter : undefined,
      district: advancedFilters.districtFilter !== 'all' ? advancedFilters.districtFilter : undefined,
      familyStatus: advancedFilters.familyStatusFilter !== 'all' ? advancedFilters.familyStatusFilter : undefined,
      familySize: advancedFilters.familySizeFilter !== 'all' ? advancedFilters.familySizeFilter : undefined,
      ageGroup: advancedFilters.ageGroupFilter !== 'all' ? advancedFilters.ageGroupFilter : undefined,
      economicLevel: advancedFilters.economicLevelFilter !== 'all' ? advancedFilters.economicLevelFilter : undefined,
      profession: advancedFilters.professionFilter || undefined,
      healthStatus: advancedFilters.healthStatusFilter !== 'all' ? advancedFilters.healthStatusFilter : undefined,
      medicalCondition: advancedFilters.medicalConditionFilter || undefined
    }
  });

  // Get unique values for filters
  const governorates = [...new Set(allBeneficiaries.map(b => b.detailedAddress.governorate))];
  const cities = [...new Set(allBeneficiaries
    .filter(b => governorateFilter === 'all' || b.detailedAddress.governorate === governorateFilter)
    .map(b => b.detailedAddress.city))];
  const districts = [...new Set(allBeneficiaries
    .filter(b => 
      (governorateFilter === 'all' || b.detailedAddress.governorate === governorateFilter) &&
      (advancedFilters.cityFilter === 'all' || b.detailedAddress.city === advancedFilters.cityFilter)
    )
    .map(b => b.detailedAddress.district))];
  const organizations = [...new Set(allBeneficiaries
    .filter(b => b.organizationId)
    .map(b => b.organizationId))];
  
  // Apply additional filters that aren't handled by the hook
  const getFilteredBeneficiaries = () => {
    let filtered = [...allBeneficiaries];
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(b => new Date(b.createdAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(b => new Date(b.createdAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(b => new Date(b.createdAt) >= filterDate);
          break;
      }
    }
    
    return filtered;
  };

  const filteredBeneficiaries = getFilteredBeneficiaries();
  
  // Apply sorting
  const getSortedBeneficiaries = () => {
    const sorted = [...filteredBeneficiaries];
    
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortColumn) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'nationalId':
          aValue = a.nationalId;
          bValue = b.nationalId;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'lastReceived':
          aValue = new Date(a.lastReceived);
          bValue = new Date(b.lastReceived);
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  const sortedBeneficiaries = getSortedBeneficiaries();
  
  // Apply pagination
  const totalPages = Math.ceil(sortedBeneficiaries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBeneficiaries = sortedBeneficiaries.slice(startIndex, endIndex);
  
  // Update batch toolbar visibility
  React.useEffect(() => {
    setShowBatchToolbar(selectedBeneficiaries.length > 0);
  }, [selectedBeneficiaries]);
  
  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, identityStatusFilter, governorateFilter, dateFilter]);

  // Event handlers
  const handleViewBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setShowDetailsModal(true);
  };

  const handleEditBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setShowAddModal(true);
  };

  const handleCall = (phone: string) => {
    if (confirm(`هل تريد الاتصال بالرقم ${phone}؟`)) {
      window.open(`tel:${phone}`);
    }
  };

  const handleSendMessage = (beneficiary: Beneficiary) => {
    alert(`سيتم إرسال رسالة إلى ${beneficiary.name} على الرقم ${beneficiary.phone}`);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  const handleSelectBeneficiary = (beneficiaryId: string) => {
    setSelectedBeneficiaries(prev => 
      prev.includes(beneficiaryId) 
        ? prev.filter(id => id !== beneficiaryId)
        : [...prev, beneficiaryId]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedBeneficiaries.length === paginatedBeneficiaries.length) {
      setSelectedBeneficiaries([]);
    } else {
      setSelectedBeneficiaries(paginatedBeneficiaries.map(b => b.id));
    }
  };
  
  const handleClearSelection = () => {
    setSelectedBeneficiaries([]);
  };

  // Individual actions
  const handleApproveIdentity = (beneficiaryId: string, beneficiaryName: string) => {
    setConfirmAction({
      type: 'approve',
      beneficiaryId,
      beneficiaryName
    });
    setShowConfirmModal(true);
  };

  const handleRejectIdentity = (beneficiaryId: string, beneficiaryName: string) => {
    setConfirmAction({
      type: 'reject',
      beneficiaryId,
      beneficiaryName
    });
    setShowConfirmModal(true);
  };
  
  const handleRequestReupload = (beneficiaryId: string, beneficiaryName: string) => {
    setConfirmAction({
      type: 'reupload',
      beneficiaryId,
      beneficiaryName
    });
    setShowConfirmModal(true);
  };

  const handleSuspendBeneficiary = (beneficiaryId: string, beneficiaryName: string) => {
    setConfirmAction({
      type: 'suspend',
      beneficiaryId,
      beneficiaryName
    });
    setShowConfirmModal(true);
  };
  
  // Batch actions
  const handleBatchApprove = () => {
    setConfirmAction({
      type: 'batch-approve',
      beneficiaryIds: selectedBeneficiaries
    });
    setShowConfirmModal(true);
  };

  const handleBatchReject = () => {
    setConfirmAction({
      type: 'batch-reject',
      beneficiaryIds: selectedBeneficiaries
    });
    setShowConfirmModal(true);
  };
  
  const handleBatchReupload = () => {
    setConfirmAction({
      type: 'batch-reupload',
      beneficiaryIds: selectedBeneficiaries
    });
    setShowConfirmModal(true);
  };

  // Export functionality
  const handleExportList = () => {
    setShowExportModal(true);
  };

  const getActiveFilters = () => {
    const filters = [];
    if (searchTerm) filters.push({ key: 'search', label: 'البحث', value: searchTerm });
    if (statusFilter !== 'all') filters.push({ key: 'status', label: 'الحالة', value: statusFilter });
    if (identityStatusFilter !== 'all') filters.push({ key: 'identity', label: 'حالة التوثيق', value: identityStatusFilter });
    if (governorateFilter !== 'all') filters.push({ key: 'governorate', label: 'المحافظة', value: governorateFilter });
    if (dateFilter !== 'all') filters.push({ key: 'date', label: 'التاريخ', value: dateFilter });
    if (advancedFilters.cityFilter !== 'all') filters.push({ key: 'city', label: 'المدينة', value: advancedFilters.cityFilter });
    if (advancedFilters.districtFilter !== 'all') filters.push({ key: 'district', label: 'الحي', value: advancedFilters.districtFilter });
    if (advancedFilters.familyStatusFilter !== 'all') filters.push({ key: 'familyStatus', label: 'الحالة العائلية', value: advancedFilters.familyStatusFilter });
    if (advancedFilters.familySizeFilter !== 'all') filters.push({ key: 'familySize', label: 'حجم الأسرة', value: advancedFilters.familySizeFilter });
    if (advancedFilters.ageGroupFilter !== 'all') filters.push({ key: 'ageGroup', label: 'الفئة العمرية', value: advancedFilters.ageGroupFilter });
    if (advancedFilters.economicLevelFilter !== 'all') filters.push({ key: 'economicLevel', label: 'المستوى الاقتصادي', value: advancedFilters.economicLevelFilter });
    if (advancedFilters.professionFilter) filters.push({ key: 'profession', label: 'المهنة', value: advancedFilters.professionFilter });
    if (advancedFilters.healthStatusFilter !== 'all') filters.push({ key: 'healthStatus', label: 'الحالة الصحية', value: advancedFilters.healthStatusFilter });
    if (advancedFilters.medicalConditionFilter) filters.push({ key: 'medicalCondition', label: 'الحالة المرضية', value: advancedFilters.medicalConditionFilter });
    if (advancedFilters.organizationFilter !== 'all') filters.push({ key: 'organization', label: 'المؤسسة', value: advancedFilters.organizationFilter });
    if (advancedFilters.lastReceivedFilter !== 'all') filters.push({ key: 'lastReceived', label: 'آخر استلام', value: advancedFilters.lastReceivedFilter });
    return filters;
  };
  
  // Execute confirmed action
  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    
    try {
      switch (confirmAction.type) {
        case 'approve':
          if (confirmAction.beneficiaryId) {
            await updateBeneficiary(confirmAction.beneficiaryId, { 
              identityStatus: 'verified',
              eligibilityStatus: 'eligible'
            });
            logInfo(`تم توثيق هوية المستفيد: ${confirmAction.beneficiaryName}`, 'BeneficiariesListPage');
          }
          break;

        case 'reject':
          if (confirmAction.beneficiaryId) {
            await updateBeneficiary(confirmAction.beneficiaryId, { 
              identityStatus: 'rejected',
              eligibilityStatus: 'rejected'
            });
            logInfo(`تم رفض توثيق هوية المستفيد: ${confirmAction.beneficiaryName}`, 'BeneficiariesListPage');
          }
          break;
          
        case 'reupload':
          if (confirmAction.beneficiaryId) {
            await updateBeneficiary(confirmAction.beneficiaryId, { 
              identityStatus: 'pending'
            });
            logInfo(`تم طلب إعادة رفع الوثائق من المستفيد: ${confirmAction.beneficiaryName}`, 'BeneficiariesListPage');
          }
          break;
          
        case 'batch-approve':
          if (confirmAction.beneficiaryIds) {
            for (const id of confirmAction.beneficiaryIds) {
              await updateBeneficiary(id, { 
                identityStatus: 'verified',
                eligibilityStatus: 'eligible'
              });
            }
            logInfo(`تم توثيق ${confirmAction.beneficiaryIds.length} مستفيد بشكل جماعي`, 'BeneficiariesListPage');
            setSelectedBeneficiaries([]);
          }
          break;

        case 'batch-reject':
          if (confirmAction.beneficiaryIds) {
            for (const id of confirmAction.beneficiaryIds) {
              await updateBeneficiary(id, { 
                identityStatus: 'rejected',
                eligibilityStatus: 'rejected'
              });
            }
            logInfo(`تم رفض توثيق ${confirmAction.beneficiaryIds.length} مستفيد بشكل جماعي`, 'BeneficiariesListPage');
            setSelectedBeneficiaries([]);
          }
          break;
          
        case 'batch-reupload':
          if (confirmAction.beneficiaryIds) {
            for (const id of confirmAction.beneficiaryIds) {
              await updateBeneficiary(id, { 
                identityStatus: 'pending'
              });
            }
            logInfo(`تم طلب إعادة رفع الوثائق من ${confirmAction.beneficiaryIds.length} مستفيد بشكل جماعي`, 'BeneficiariesListPage');
            setSelectedBeneficiaries([]);
          }
          break;
          
        case 'suspend':
          if (confirmAction.beneficiaryId) {
            await updateBeneficiary(confirmAction.beneficiaryId, { 
              status: 'suspended'
            });
            logInfo(`تم تعليق حساب المستفيد: ${confirmAction.beneficiaryName}`, 'BeneficiariesListPage');
          }
          break;
      }
      
      refetch();
    } catch (error) {
      logError(error as Error, 'BeneficiariesListPage');
    }
  };
  
  const getConfirmationMessage = () => {
    if (!confirmAction) return { title: '', message: '', confirmText: '', variant: 'primary' as const };
    
    switch (confirmAction.type) {
      case 'approve':
        return {
          title: 'تأكيد توثيق الهوية',
          message: `هل أنت متأكد من توثيق هوية المستفيد "${confirmAction.beneficiaryName}"؟ سيتم تغيير حالته إلى "موثق" ويصبح مؤهلاً لاستلام المساعدات.`,
          confirmText: 'توثيق الهوية',
          variant: 'success' as const
        };
      case 'reject':
        return {
          title: 'تأكيد رفض التوثيق',
          message: `هل أنت متأكد من رفض توثيق هوية المستفيد "${confirmAction.beneficiaryName}"؟ سيتم تغيير حالته إلى "مرفوض التوثيق" ولن يتمكن من استلام المساعدات.`,
          confirmText: 'رفض التوثيق',
          variant: 'danger' as const
        };
      case 'reupload':
        return {
          title: 'طلب إعادة رفع الوثائق',
          message: `هل تريد طلب إعادة رفع الوثائق من المستفيد "${confirmAction.beneficiaryName}"؟ سيتم إرسال إشعار له لرفع وثائق جديدة.`,
          confirmText: 'إرسال طلب إعادة الرفع',
          variant: 'warning' as const
        };
      case 'batch-approve':
        return {
          title: 'تأكيد التوثيق الجماعي',
          message: `هل أنت متأكد من توثيق هوية ${confirmAction.beneficiaryIds?.length} مستفيد؟ سيتم تغيير حالتهم جميعاً إلى "موثق".`,
          confirmText: `توثيق ${confirmAction.beneficiaryIds?.length} مستفيد`,
          variant: 'success' as const
        };
      case 'batch-reject':
        return {
          title: 'تأكيد الرفض الجماعي',
          message: `هل أنت متأكد من رفض توثيق هوية ${confirmAction.beneficiaryIds?.length} مستفيد؟ سيتم تغيير حالتهم جميعاً إلى "مرفوض التوثيق".`,
          confirmText: `رفض ${confirmAction.beneficiaryIds?.length} مستفيد`,
          variant: 'danger' as const
        };
      case 'batch-reupload':
        return {
          title: 'طلب إعادة رفع الوثائق (جماعي)',
          message: `هل تريد طلب إعادة رفع الوثائق من ${confirmAction.beneficiaryIds?.length} مستفيد؟ سيتم إرسال إشعارات لهم لرفع وثائق جديدة.`,
          confirmText: `إرسال طلب إعادة الرفع لـ ${confirmAction.beneficiaryIds?.length} مستفيد`,
          variant: 'warning' as const
        };
      case 'suspend':
        return {
          title: 'تأكيد تعليق حساب المستفيد',
          message: `هل أنت متأكد من تعليق حساب المستفيد "${confirmAction.beneficiaryName}"؟ سيتم إيقاف جميع الخدمات له ويمكن إعادة تفعيل الحساب لاحقاً.`,
          confirmText: 'تعليق الحساب',
          variant: 'warning' as const
        };
      default:
        return { title: '', message: '', confirmText: '', variant: 'primary' as const };
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

  const confirmationData = getConfirmationMessage();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 ml-3" />
        <span className="text-gray-600">جاري تحميل المستفيدين...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200" padding="sm">
        <div className="flex items-center space-x-3 space-x-reverse">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <span className="text-red-800 font-medium">خطأ في تحميل المستفيدين</span>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3 space-x-reverse">
          <Button 
            variant="success" 
            icon={Download} 
            iconPosition="right"
            onClick={handleExportList}
          >
            تصدير القائمة
          </Button>
          <Button 
            variant="primary" 
            icon={Plus} 
            iconPosition="right"
            onClick={() => {
              setSelectedBeneficiary(null);
              setShowAddModal(true);
            }}
          >
            إضافة مستفيد جديد
          </Button>
        </div>
        
        {onNavigateToTasks && selectedBeneficiaries.length > 0 && (
          <Button
            variant="primary"
            icon={UserPlus}
            iconPosition="right"
            onClick={() => onNavigateToTasks(selectedBeneficiaries)}
          >
            إنشاء مهام للمحددين ({selectedBeneficiaries.length})
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="space-y-4">
          {/* Basic Filters Row */}
          <div className="grid md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Input
                type="text"
                icon={Search}
                iconPosition="right"
                placeholder="البحث (الاسم، رقم الهوية، الهاتف)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="pending">معلق</option>
                <option value="suspended">متوقف</option>
              </select>
            </div>
            
            <div>
              <select
                value={identityStatusFilter}
                onChange={(e) => setIdentityStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع حالات التوثيق</option>
                <option value="verified">موثق</option>
                <option value="pending">بانتظار التوثيق</option>
                <option value="rejected">مرفوض التوثيق</option>
              </select>
            </div>
            
            <div>
              <select
                value={governorateFilter}
                onChange={(e) => setGovernorateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع المحافظات</option>
                {governorates.map(governorate => (
                  <option key={governorate} value={governorate}>{governorate}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              icon={Filter}
              iconPosition="right"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              size="sm"
            >
              {showAdvancedFilters ? 'إخفاء الفلاتر المتقدمة' : 'إظهار الفلاتر المتقدمة'}
            </Button>
            
            {getActiveFilters().length > 0 && (
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-sm text-gray-600">الفلاتر النشطة:</span>
                <div className="flex flex-wrap gap-1">
                  {getActiveFilters().slice(0, 3).map((filter) => (
                    <Badge key={filter.key} variant="info" size="sm">
                      {filter.label}: {filter.value}
                    </Badge>
                  ))}
                  {getActiveFilters().length > 3 && (
                    <Badge variant="neutral" size="sm">
                      +{getActiveFilters().length - 3} أخرى
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setIdentityStatusFilter('all');
                    setGovernorateFilter('all');
                    setDateFilter('all');
                    setAdvancedFilters({
                      cityFilter: 'all',
                      districtFilter: 'all',
                      familyStatusFilter: 'all',
                      familySizeFilter: 'all',
                      ageGroupFilter: 'all',
                      economicLevelFilter: 'all',
                      professionFilter: '',
                      healthStatusFilter: 'all',
                      medicalConditionFilter: '',
                      organizationFilter: 'all',
                      lastReceivedFilter: 'all'
                    });
                  }}
                >
                  مسح الفلاتر
                </Button>
              </div>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">الفلاتر المتقدمة</h4>
              
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Geographic Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المدينة / المخيم</label>
                  <select
                    value={advancedFilters.cityFilter}
                    onChange={(e) => {
                      setAdvancedFilters(prev => ({ ...prev, cityFilter: e.target.value, districtFilter: 'all' }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">جميع المدن</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحي / المنطقة</label>
                  <select
                    value={advancedFilters.districtFilter}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, districtFilter: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">جميع الأحياء</option>
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>

                {/* Family Status Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة العائلية</label>
                  <select
                    value={advancedFilters.familyStatusFilter}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, familyStatusFilter: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">جميع الحالات العائلية</option>
                    <option value="head_of_family">رب الأسرة</option>
                    <option value="spouse">الزوج/الزوجة</option>
                    <option value="child">الأطفال</option>
                    <option value="orphan_guardian">ولي أيتام</option>
                    <option value="family_with_orphans">عائلة بها أيتام</option>
                    <option value="elderly">كبار السن (60+)</option>
                    <option value="disabled">ذوي الاحتياجات الخاصة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">حجم الأسرة</label>
                  <select
                    value={advancedFilters.familySizeFilter}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, familySizeFilter: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">جميع الأحجام</option>
                    <option value="small">صغيرة (1-3 أفراد)</option>
                    <option value="medium">متوسطة (4-7 أفراد)</option>
                    <option value="large">كبيرة (8+ أفراد)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الفئة العمرية</label>
                  <select
                    value={advancedFilters.ageGroupFilter}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, ageGroupFilter: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">جميع الأعمار</option>
                    <option value="child">أطفال (أقل من 18)</option>
                    <option value="adult">بالغين (18-59)</option>
                    <option value="elderly">كبار السن (60+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المستوى الاقتصادي</label>
                  <select
                    value={advancedFilters.economicLevelFilter}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, economicLevelFilter: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">جميع المستويات</option>
                    <option value="very_poor">فقير جداً</option>
                    <option value="poor">فقير</option>
                    <option value="moderate">متوسط</option>
                    <option value="good">ميسور</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المهنة</label>
                  <input
                    type="text"
                    value={advancedFilters.professionFilter}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, professionFilter: e.target.value }))}
                    placeholder="البحث في المهن..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة الصحية</label>
                  <select
                    value={advancedFilters.healthStatusFilter}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, healthStatusFilter: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">جميع الحالات الصحية</option>
                    <option value="has_medical">لديه حالات مرضية</option>
                    <option value="healthy">سليم صحياً</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">حالة مرضية محددة</label>
                  <input
                    type="text"
                    value={advancedFilters.medicalConditionFilter}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, medicalConditionFilter: e.target.value }))}
                    placeholder="مثال: السكري، ضغط الدم..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">آخر استلام</label>
                  <select
                    value={advancedFilters.lastReceivedFilter}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, lastReceivedFilter: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">جميع التواريخ</option>
                    <option value="never">لم يستلم أبداً</option>
                    <option value="week">خلال أسبوع</option>
                    <option value="month">خلال شهر</option>
                    <option value="quarter">خلال 3 أشهر</option>
                    <option value="year">خلال سنة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الإضافة</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">جميع التواريخ</option>
                    <option value="today">اليوم</option>
                    <option value="week">هذا الأسبوع</option>
                    <option value="month">هذا الشهر</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Batch Actions Toolbar */}
      {showBatchToolbar && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">
                تم تحديد {selectedBeneficiaries.length} مستفيد
              </span>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button
                variant="success"
                size="sm"
                onClick={handleBatchApprove}
              >
                توثيق المحدد ({selectedBeneficiaries.length})
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleBatchReject}
              >
                رفض المحدد ({selectedBeneficiaries.length})
              </Button>
              <Button
                variant="warning"
                size="sm"
                onClick={handleBatchReupload}
              >
                طلب إعادة رفع ({selectedBeneficiaries.length})
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Minus}
                onClick={handleClearSelection}
              >
                إلغاء التحديد
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">إجمالي المستفيدين</p>
              <p className="text-3xl font-bold text-gray-900">{statistics.total}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-2xl">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">موثقين</p>
              <p className="text-3xl font-bold text-gray-900">{statistics.verified}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-2xl">
              <Star className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">بانتظار التوثيق</p>
              <p className="text-3xl font-bold text-gray-900">{statistics.pending}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-2xl">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">مرفوض التوثيق</p>
              <p className="text-3xl font-bold text-gray-900">{statistics.rejected}</p>
            </div>
            <div className="bg-red-100 p-4 rounded-2xl">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Beneficiaries Table */}
      <Card padding="none" className="overflow-hidden">
        {/* Enhanced Table Header */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
          <div className="text-center py-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">قائمة المستفيدين</h3>
            
            {/* Data Source Badge */}
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 border border-blue-300 rounded-full px-4 py-2 flex items-center space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">البيانات الوهمية</span>
              </div>
            </div>
            
            {/* Enhanced Count Display */}
            <div className="bg-white rounded-xl p-4 mx-6 shadow-sm border border-gray-200">
              <div className="grid grid-cols-3 divide-x divide-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">المعروض حالياً</p>
                  <p className="text-xl font-bold text-blue-600">
                    {startIndex + 1}-{Math.min(endIndex, sortedBeneficiaries.length)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">إجمالي المفلترين</p>
                  <p className="text-xl font-bold text-green-600">{sortedBeneficiaries.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">إجمالي النظام</p>
                  <p className="text-xl font-bold text-purple-600">{statistics.total}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right">
                  <input
                    type="checkbox"
                    checked={selectedBeneficiaries.length === paginatedBeneficiaries.length && paginatedBeneficiaries.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <span>المستفيد</span>
                    {sortColumn === 'name' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('nationalId')}
                >
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <span>رقم الهوية</span>
                    {sortColumn === 'nationalId' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الهاتف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المنطقة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('lastReceived')}
                >
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <span>آخر استلام</span>
                    {sortColumn === 'lastReceived' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedBeneficiaries.length > 0 ? (
                paginatedBeneficiaries.map((beneficiary) => (
                  <tr key={beneficiary.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedBeneficiaries.includes(beneficiary.id)}
                        onChange={() => handleSelectBeneficiary(beneficiary.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-xl ml-4">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span className="text-sm font-medium text-gray-900">{beneficiary.name}</span>
                            {beneficiary.identityStatus === 'verified' && (
                              <Star className="w-4 h-4 text-green-600" title="موثق" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{beneficiary.detailedAddress.city}</div>
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
                      {beneficiary.detailedAddress.district}
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
                      {new Date(beneficiary.lastReceived).toLocaleDateString('en-CA')}
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
                        {onNavigateToIndividualSend && (
                          <button 
                            onClick={() => onNavigateToIndividualSend(beneficiary.id)}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors" 
                            title="إرسال طرد فردي"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">
                        {searchTerm || statusFilter !== 'all' || identityStatusFilter !== 'all' || governorateFilter !== 'all' 
                          ? 'لا توجد نتائج مطابقة للفلاتر' 
                          : 'لا توجد مستفيدين'}
                      </p>
                      <p className="text-sm mt-2">
                        {searchTerm || statusFilter !== 'all' || identityStatusFilter !== 'all' || governorateFilter !== 'all'
                          ? 'جرب تعديل الفلاتر أو مصطلح البحث'
                          : 'لم يتم إضافة أي مستفيدين بعد'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                الصفحة {currentPage} من {totalPages} ({sortedBeneficiaries.length} مستفيد إجمالي)
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronRight}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                
                {/* Page numbers */}
                <div className="flex space-x-1 space-x-reverse">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronLeft}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Export Modal */}
      {showExportModal && (
        <Modal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          title="تصدير قائمة المستفيدين"
          size="xl"
        >
          <ExportBeneficiariesModal
            beneficiaries={selectedBeneficiaries.length > 0 
              ? allBeneficiaries.filter(b => selectedBeneficiaries.includes(b.id))
              : sortedBeneficiaries
            }
            activeFilters={getActiveFilters()}
            onClose={() => setShowExportModal(false)}
          />
        </Modal>
      )}

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
          onApproveIdentity={handleApproveIdentity}
          onRejectIdentity={handleRejectIdentity}
          onRequestReupload={handleRequestReupload}
          onSuspendBeneficiary={handleSuspendBeneficiary}
        />
      )}

      {/* Add/Edit Beneficiary Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedBeneficiary(null);
          }}
          title={selectedBeneficiary ? 'تعديل بيانات المستفيد' : 'إضافة مستفيد جديد'}
          size="lg"
        >
          <div className="p-6 text-center">
            <div className="bg-gray-100 rounded-xl p-8 mb-4">
              {selectedBeneficiary ? <Edit className="w-16 h-16 text-gray-400 mx-auto mb-4" /> : <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />}
              <p className="text-gray-600">
                {selectedBeneficiary ? 'نموذج تعديل بيانات المستفيد' : 'نموذج إضافة مستفيد جديد'}
              </p>
              <p className="text-sm text-gray-500 mt-2">سيتم تطوير النماذج التفاعلية هنا</p>
            </div>
            
            <div className="flex space-x-3 space-x-reverse justify-center">
              <Button 
                variant="secondary"
                onClick={() => setShowAddModal(false)}
              >
                إلغاء
              </Button>
              <Button variant="primary">
                {selectedBeneficiary ? 'حفظ التغييرات' : 'إضافة المستفيد'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        onConfirm={executeConfirmedAction}
        title={confirmationData.title}
        message={confirmationData.message}
        confirmButtonText={confirmationData.confirmText}
        confirmButtonVariant={confirmationData.variant}
        type={confirmationData.variant === 'danger' ? 'danger' : 'warning'}
      />
    </div>
  );
}