# خطة حذف المؤسسات من النظام

**تاريخ البدء**: 2025-01-15
**الحالة**: قيد التنفيذ
**الهدف**: إزالة كل ما يتعلق بالمؤسسات من النظام والاعتماد على العائلات فقط

## 📋 قائمة المهام

### ✅ المرحلة 1: إزالة المكونات الرئيسية للمؤسسات
- [✅] حذف `src/components/OrganizationsDashboard.tsx`
- [✅] حذف `src/components/pages/OrganizationsListPage.tsx`
- [✅] حذف `src/components/OrganizationForm.tsx`
- [✅] حذف `src/hooks/useOrganizations.ts`

### ⏳ المرحلة 2: تنظيف البيانات الوهمية
- [ ] إزالة واجهة `Organization` من `mockData.ts`
- [ ] إزالة مصفوفة `mockOrganizations`
- [ ] إزالة `organizationId` من واجهة `Beneficiary`
- [ ] إزالة `organization_id` من واجهة `PackageTemplate`
- [ ] تحديث `SystemUser` لإزالة المراجع للمؤسسات
- [ ] تنظيف الدوال المساعدة المرتبطة بالمؤسسات

### ⏳ المرحلة 3: تحديث المكونات المتأثرة
- [ ] تحديث `AdminDashboard.tsx` - إزالة قسم المؤسسات
- [ ] تحديث `MockLogin.tsx` - إزالة خيارات تسجيل دخول المؤسسات
- [ ] تحديث `App.tsx` - إزالة مسار OrganizationsDashboard
- [ ] تحديث `BeneficiariesListPage.tsx` - إزالة المراجع للمؤسسات
- [ ] تحديث `PackageTemplateForm.tsx` - إزالة اختيار المؤسسة
- [ ] تحديث `BulkSendPage.tsx` - إزالة اختيار المؤسسة
- [ ] تحديث `IndividualSendPage.tsx` - إزالة اختيار المؤسسة
- [ ] تحديث `BulkTasksPage.tsx` - إزالة اختيار المؤسسة

### ⏳ المرحلة 4: تنظيف الخدمات والسياقات
- [ ] إزالة `organizationsService` من `supabaseService.ts`
- [ ] تحديث `AuthContext.tsx` - إزالة المراجع للمؤسسات
- [ ] تحديث `useBeneficiaries.ts` - إزالة `organizationId`

### ⏳ المرحلة 5: تنظيف الوثائق
- [ ] تحديث `docs/development_plan.md`
- [ ] تحديث `docs/system-analysis.md`

### ⏳ المرحلة 6: اختبار النظام
- [ ] التأكد من عمل جميع لوحات التحكم
- [ ] التأكد من عمل إدارة المستفيدين
- [ ] التأكد من عمل إدارة الطرود
- [ ] التأكد من عمل نظام المهام

---

## 📊 التقدم
- **المكتمل**: 4/25 مهمة (16%)
- **المتبقي**: 21 مهمة

---

*آخر تحديث: 2025-01-15*