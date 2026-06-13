// ===== SPLASH SCREEN =====
function enterApp() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.classList.add('hide');
        setTimeout(() => splash.remove(), 900);
    }
}

// ===== NAVIGATION =====
function showSection(sectionId) {
    const homeCards = document.querySelector('.overview-cards-wrapper');
    if (homeCards) homeCards.style.display = 'none';

    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
    }
}

function showHome() {
    const homeCards = document.querySelector('.overview-cards-wrapper');
    if (homeCards) homeCards.style.display = '';

    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

    window.scrollTo(0, 0);
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message) {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ===== GLOBAL EDIT STATE =====
let editingKey = null;
let editingIdx = null;
let pendingDelete = { key: null, idx: null };

function getSignatureNames() {
    return {
        clerk: localStorage.getItem('sig_clerk_name') || '',
        officer: localStorage.getItem('sig_officer_name') || '',
        director: localStorage.getItem('sig_director_name') || ''
    };
}

function formatSignatureValue(value) {
    return value && value.trim() ? value.trim() : '';
}

function renderPrintSignatureNames() {
    const names = getSignatureNames();
    const clerkEl = document.getElementById('print-name-clerk');
    const officerEl = document.getElementById('print-name-officer');
    const directorEl = document.getElementById('print-name-director');
    if (clerkEl) clerkEl.textContent = formatSignatureValue(names.clerk);
    if (officerEl) officerEl.textContent = formatSignatureValue(names.officer);
    if (directorEl) directorEl.textContent = formatSignatureValue(names.director);
}

function saveSignatureNames() {
    const directorInput = document.getElementById('sig-director-name');
    const clerkInput = document.getElementById('sig-clerk-name');
    const officerInput = document.getElementById('sig-officer-name');
    if (!directorInput || !clerkInput || !officerInput) return;

    localStorage.setItem('sig_director_name', directorInput.value.trim());
    localStorage.setItem('sig_clerk_name', clerkInput.value.trim());
    localStorage.setItem('sig_officer_name', officerInput.value.trim());
    renderPrintSignatureNames();
    closeAllModals();
    showToast(translations[currentLang].success_save);
}

function loadSignatureNames() {
    const names = getSignatureNames();
    const directorInput = document.getElementById('sig-director-name');
    const clerkInput = document.getElementById('sig-clerk-name');
    const officerInput = document.getElementById('sig-officer-name');
    if (directorInput) directorInput.value = names.director;
    if (clerkInput) clerkInput.value = names.clerk;
    if (officerInput) officerInput.value = names.officer;
}

function openSignatureModal() {
    loadSignatureNames();
    openModal('signature-modal');
}

// ===== // ===== LOCALIZATION (Badini Kurdish) =====
let currentLang = localStorage.getItem('appLang') || 'ku';

const translations = {
    ar: {
        lang_btn: 'کوردی (باديني)',
        sys_admin: 'مدير النظام',
        err_image: 'حدث خطأ أثناء معالجة الصورة',
        err_storage: 'مساحة التخزين ممتلئة! يرجى حذف بعض السجلات أو الصور القديمة.',
        lbl_records: 'سجلات',
        lbl_total_sum: 'المجموع',
        gov_name: 'حكومة إقليم كوردستان - العراق',
        ministry: 'وزارة الداخلية',
        dept_name: 'مديرية مرور زاخو',
        audit_system: 'نظام قسم التدقيق',
        enter_btn: 'دخول النظام',
        app_title: 'قسم التدقيق - مديرية مرور زاخو',
        receipts: 'الوصولات',
        delegations: 'الإيفادات',
        children: 'إضافة الأطفال',
        marriage: 'الزواج',
        fines: 'الغرامات',
        stats: 'الإحصائيات',
        back: 'الرجوع',
        print: 'طباعة القسم',
        add_receipt: 'إضافة وصل جديد',
        add_delegation: 'إضافة إيفاد جديد',
        add_child: 'إضافة طفل جديد',
        add_marriage: 'تسجيل زواج جديد',
        add_fine: 'إضافة دفتر جديد',
        ov_receipts_count: 'عدد الوصولات:',
        ov_receipts_total: 'إجمالي المبالغ:',
        ov_delegations_count: 'عدد السجلات:',
        ov_delegations_total: 'المبلغ الكلي:',
        ov_children_count: 'عدد الأطفال:',
        ov_marriage_count: 'عقود الزواج:',
        ov_fines_count: 'عدد الدفاتر:',
        ov_total_records: 'إجمالي السجلات:',
        ov_subtitle: 'مديرية مرور زاخو - قسم التدقيق',
        th_type: 'النوع',
        th_directorate: 'المديرية',
        th_department: 'القسم',
        th_location: 'المكان',
        th_date: 'التاريخ',
        th_marriage_date: 'تاريخ الزواج',
        th_code: 'الكود',
        th_amount: 'المبلغ',
        th_image: 'صورة الوصل',
        th_actions: 'العمليات',
        th_name: 'الاسم الثلاثي',
        th_month: 'الشهر',
        th_count: 'عدد الإيفادات',
        th_export: 'مكان الصادر',
        th_import: 'مكان الوارد',
        th_total: 'المبلغ الكلي',
        th_father: 'اسم الأب',
        th_mother: 'اسم الأم',
        th_child: 'اسم الطفل',
        th_gender: 'الجنس',
        th_dob: 'تاريخ الميلاد',
        th_arrival: 'تاريخ الوصول',
        th_husband: 'اسم الزوج',
        th_wife: 'اسم الزوجة',
        th_holder: 'صاحب الدفتر',
        th_book_num: 'رقم الدفتر',
        lbl_receipt_type: 'نوع الوصل:',
        lbl_central: 'مركزي',
        lbl_decentral: 'لا مركزي',
        lbl_directorate: 'المديرية:',
        lbl_department: 'القسم:',
        lbl_location: 'المكان:',
        lbl_date: 'التاريخ:',
        lbl_code: 'رقم الوصل / الكود:',
        lbl_amount: 'المبلغ:',
        lbl_image: 'تحميل صورة الوصل:',
        lbl_name: 'الاسم الكامل:',
        lbl_month: 'الشهر:',
        lbl_count: 'عدد الإيفادات:',
        lbl_export: 'مكان الصادر:',
        lbl_import: 'مكان الوارد:',
        lbl_total: 'المبلغ الكلي:',
        lbl_father: 'اسم الأب الكامل:',
        lbl_mother: 'اسم الأم الكامل:',
        lbl_child: 'اسم الطفل:',
        lbl_gender: 'الجنس:',
        lbl_male: 'ذكر',
        lbl_female: 'أنثى',
        lbl_dob: 'تاريخ الميلاد:',
        lbl_arrival: 'تاريخ الوصول:',
        lbl_husband: 'اسم الزوج الكامل:',
        lbl_wife: 'اسم الزوجة الكامل:',
        lbl_book_type: 'نوع الدفتر:',
        lbl_holder: 'اسم صاحب الدفتر:',
        lbl_book_num: 'رقم الدفتر:',
        save_btn: 'حفظ البيانات',
        edit_save_btn: 'حفظ التعديل',
        confirm_del: 'هل أنت متأكد من حذف هذا السجل؟',
        success_save: 'تم حفظ البيانات بنجاح!',
        st_total_receipts: 'إجمالي الوصولات',
        st_total_amounts: 'إجمالي المبالغ',
        st_central: 'مركزي',
        st_decentral: 'لا مركزي',
        st_delegation_records: 'سجلات الإيفاد',
        st_total_delegations: 'مجموع الإيفادات',
        st_total_children: 'إجمالي الأطفال',
        st_males: 'ذكور',
        st_females: 'إناث',
        st_marriage_contracts: 'عقود الزواج',
        st_total_books: 'إجمالي الدفاتر',
        empty_data: 'لا توجد بيانات',
        sig_clerk: 'توقيع الموظف المدقق',
        sig_officer: 'توقيع مدير قسم التدقيق',
        sig_director: 'توقيع مدير عام',
        lbl_name_only: 'الاسم',
        lbl_rank_name: 'الرتبة والاسم',
        sig_details_btn: 'أسماء الطباعة',
        sig_details_title: 'بيانات التوقيع للطباعة',
        monthly_archive: 'الأرشيف الشهري للإحصائيات',
        view_details: 'عرض التفاصيل',
        th_month: 'الشهر',
        sig_director_label: 'اسم المدير العام',
        sig_clerk_label: 'اسم الموظف المدقق',
        sig_officer_label: 'اسم مدير قسم التدقيق',
        sig_save_btn: 'حفظ الأسماء',
        close_btn: 'إغلاق',
        delete_btn: 'حذف',
        confirm_del_title: 'تأكيد الحذف',
        search_placeholder: 'ابحث في السجلات...',
        audit_dept: 'قسم التدقيق',
        lbl_date_print: 'التاريخ:',
        lbl_page_num: 'رقم الصفحة:',
        lbl_print_time: 'وقت الطباعة:',
        ov_stats_sub: 'تحليل كامل للنظام',
        lbl_upload_text: 'اسحب الصورة هنا أو اضغط للاختيار',
        lbl_choose_month: 'اختر الشهر',
        lbl_choose_gender: 'اختر الجنس',
        m1: 'كانون الثاني',
        m2: 'شباط',
        m3: 'آذار',
        m4: 'نيسان',
        m5: 'أيار',
        m6: 'حزيران',
        m7: 'تموز',
        m8: 'آب',
        m9: 'أيلول',
        m10: 'تشرين الأول',
        m11: 'تشرين الثاني',
        m12: 'كانون الأول',
        lbl_export_placeholder: 'مكان الصادر',
        lbl_import_placeholder: 'مكان الوارد',
        bulk_print: 'طباعة جماعية',
        bulk_print_desc: 'اختر الأقسام التي تريد طباعتها دفعة واحدة:',
        single_print: 'طباعة فردية',
        start_print: 'بدء الطباعة',
        print_now: 'طباعة الآن',
        print_record: 'طباعة السجل',
        print_section_receipt: 'سجل الوصولات',
        print_section_delegation: 'سجل الإيفادات',
        print_section_children: 'سجل إضافة الأطفال',
        print_section_marriage: 'سجل الزواج',
        print_section_fines: 'سجل دفاتر الغرامات',
        records_count: 'عدد السجلات',
        backup_btn: 'النسخ الاحتياطي',
        backup_modal_title: 'إدارة النسخ الاحتياطي',
        backup_desc: 'يمكنك تصدير كافة بيانات النظام في ملف JSON للاحتفاظ بنسخة احتياطية، أو استيرادها لاحقاً.',
        export_btn: 'تصدير البيانات (JSON)',
        import_btn: 'استيراد البيانات (JSON)',
        confirm_import_title: 'تأكيد استرداد البيانات',
        confirm_import_warning: 'تحذير: هذا الإجراء سيقوم باستبدال كافة البيانات الحالية ببيانات الملف المختار. لا يمكن التراجع عن هذا الإجراء!',
        confirm_btn: 'تأكيد الاسترداد',
        import_success: 'تم استرداد النسخة الاحتياطية بنجاح!',
        invalid_file_error: 'ملف النسخة الاحتياطية غير صالح!',
        currency: 'د.ع',
        lbl_employee_gender: 'جنس الموظف',
        pl_search: 'ابحث في القسم...',
        title_search: 'بحث',
        title_clear: 'مسح',
        splash_year: '© 2025 - مديرية مرور زاخو',
        pl_sig_director: 'أدخل اسم المدير العام',
        pl_sig_clerk: 'أدخل اسم الموظف المدقق',
        pl_sig_officer: 'أدخل اسم مدير قسم التدقيق',
        err_select_section: 'الرجاء اختيار قسم واحد على الأقل',
        err_no_data_sections: 'لا توجد بيانات في الأقسام المحددة',
        err_no_data_print: 'لا توجد بيانات للطباعة',
        lbl_section_details: 'التفاصيل حسب الأقسام:',
        lbl_record_single: 'سجل',
        stats_breakdown_title: 'الإحصائيات الشاملة للأقسام',
        lbl_grand_total: 'المجموع الكلي',
        btn_refresh_stats: 'تحديث الإحصائيات',
        pl_directorate: 'أدخل اسم المديرية',
        pl_department: 'أدخل اسم القسم',
        pl_location: 'أدخل المكان',
        pl_code: 'أدخل الكود',
        pl_name: 'أدخل الاسم الثلاثي للموفد',
        pl_father: 'أدخل اسم الأب الثلاثي',
        pl_mother: 'أدخل اسم الأم الثلاثي',
        pl_child: 'أدخل اسم الطفل الثلاثي',
        pl_husband: 'أدخل اسم الزوج',
        pl_wife: 'أدخل اسم الزوجة',
        pl_holder: 'اسم صاحب الدفتر',
        pl_book_num: 'رقم الدفتر'
    },
    ku: {
        err_image: 'هه‌ڵه‌كا له‌ كاتا پرۆسه‌كرنا وێنەیێ',
        err_storage: 'شوێنا هه‌ڵگرتنێ پڕه‌! تكايه‌ چه‌ند تۆمارێن كۆن ژێبكه‌.',
        lbl_records: 'تۆمار',
        lbl_total_sum: 'كۆژم',
        lang_btn: 'عربي',
        sys_admin: 'ڕێڤه‌به‌رێ سيسته‌مى',
        gov_name: 'حكومه‌تا هه‌رێما كوردستانێ - عێراق',
        ministry: 'وه‌زاره‌تا ناڤخۆ',
        dept_name: 'ڕێڤه‌به‌ريا هاتنوچوونا زاخۆ',
        audit_system: 'سيسته‌مێ پشكا وردبينيێ',
        enter_btn: 'چوونه‌ ژوور',
        app_title: 'پشكا وردبينيێ - ڕێڤه‌به‌ريا هاتنوچوونا زاخۆ',
        receipts: 'پسووله‌',
        delegations: 'ئیفاد',
        children: 'زارۆك',
        marriage: 'هه‌ڤژينى',
        fines: 'سزا',
        stats: 'ئامار',
        back: 'ڤه‌گه‌ڕيان',
        print: 'چاپكرنا پشكێ',
        add_receipt: 'زێده‌كرنا پسووله‌كا نوی',
        add_delegation: 'زێده‌كرنا ئیفاده‌كا نوی',
        add_child: 'زێده‌كرنا زارۆكه‌كێ نوی',
        add_marriage: 'تۆماركرنا هه‌ڤژينيێ',
        add_fine: 'زێده‌كرنا ده‌فته‌ره‌كا سزایان',
        ov_receipts_count: 'هژمارا پسوولەیان:',
        ov_receipts_total: 'كۆژمێ گشتی:',
        ov_delegations_count: 'هژمارا تۆماران:',
        ov_delegations_total: 'كۆژمێ گشتی:',
        ov_children_count: 'هژمارا زارۆكان:',
        ov_marriage_count: 'گرێبه‌ستێن هه‌ڤژينيێ:',
        ov_fines_count: 'هژمارا ده‌فته‌ران:',
        ov_total_records: 'كۆما تۆماران:',
        ov_subtitle: 'ڕێڤه‌به‌ريا هاتنوچوونا زاخۆ - پشكا وردبينيێ',
        th_type: 'جۆر',
        th_directorate: 'ڕێڤه‌به‌ریا',
        th_department: 'پشك',
        th_location: 'جهـ',
        th_date: 'مێژوو',
        th_marriage_date: 'مێژوویا هه‌ڤژينيێ',
        th_code: 'كۆد',
        th_amount: 'كۆژم',
        th_image: 'وێنێ پسوولەیێ',
        th_actions: 'كردار',
        th_name: 'ناڤێ سيانى',
        th_month: 'هه‌یڤ',
        th_count: 'هژمارا ئیفادان',
        th_export: 'جهێ ده‌ركه‌فتى',
        th_import: 'جهێ هاتى',
        th_total: 'كۆژمێ گشتی',
        th_father: 'ناڤێ بابێ',
        th_mother: 'ناڤێ دايكێ',
        th_child: 'ناڤێ زارۆكى',
        th_gender: 'ڕه‌گه‌ز',
        th_dob: 'رۆژا ژ دايكبوونێ',
        th_arrival: 'مێژوویا پسوولێ',
        th_husband: 'ناڤێ هه‌ڤژينى (زه‌لام)',
        th_wife: 'ناڤێ هه‌ڤژینێ (ژن)',
        th_holder: 'خودانێ ده‌فته‌رێ',
        th_book_num: 'هژمارا ده‌فته‌رێ',
        lbl_receipt_type: 'جۆرێ پسوولەیێ:',
        lbl_central: 'ناڤه‌ندی',
        lbl_decentral: 'نه‌ ناڤه‌ندی',
        lbl_directorate: 'ڕێڤه‌به‌ریا:',
        lbl_department: 'پشك:',
        lbl_location: 'جهـ:',
        lbl_date: 'مێژوو:',
        lbl_code: 'هژمارا پسوولەیێ / كۆد:',
        lbl_amount: 'كۆژم:',
        lbl_image: 'باركرنا وێنێ پسوولەیێ:',
        lbl_name: 'ناڤێ ته‌مام:',
        lbl_month: 'هه‌یڤ:',
        lbl_count: 'هژمارا ئیفادان:',
        lbl_export: 'جهێ ده‌ركه‌فتی:',
        lbl_import: 'جهێ هاتى:',
        lbl_total: 'كۆژمێ گشتی:',
        lbl_father: 'ناڤێ بابێ يێ ته‌مام:',
        lbl_mother: 'ناڤێ دايكێ يا ته‌مام:',
        lbl_child: 'ناڤێ زارۆكى:',
        lbl_gender: 'ڕه‌گه‌ز:',
        lbl_male: 'نێر',
        lbl_female: 'مێ',
        lbl_dob: 'رۆژا ژ دايكبوونێ:',
        lbl_arrival: 'مێژوویا پسوولێ:',
        lbl_husband: 'ناڤێ هه‌ڤژينى يێ ته‌مام:',
        lbl_wife: 'ناڤێ هه‌ڤژینێ يا ته‌مام:',
        lbl_book_type: 'جۆرێ ده‌فته‌رێ:',
        lbl_holder: 'ناڤێ خودانێ ده‌فته‌رێ:',
        lbl_book_num: 'هژمارا ده‌فته‌رێ:',
        save_btn: 'پاراستنا پێزانینان',
        edit_save_btn: 'پاراستنا دەستكاریێ',
        confirm_del: 'ئه‌رێ تو يێ پشت ڕاستى ژ ژێبرنا ڤێ تۆمارێ؟',
        success_save: 'پێزانين ب سه‌ركه‌فتيانه‌ هاتنه‌ پاراستن!',
        st_total_receipts: 'كۆما پسوولەیان',
        st_total_amounts: 'كۆژمێ گشتی يێ پاره‌ى',
        st_central: 'ناڤه‌ندی',
        st_decentral: 'نه‌ ناڤه‌ندی',
        st_delegation_records: 'تۆمارێن ئیفادان',
        st_total_delegations: 'كۆما گشتيا ئیفادان',
        st_total_children: 'كۆما گشتيا زارۆكان',
        st_males: 'نێر',
        st_females: 'مێ',
        st_marriage_contracts: 'گرێبه‌ستێن هه‌ڤژينيێ',
        st_total_books: 'كۆما گشتيا ده‌فته‌ران',
        empty_data: 'پێزانين نینن',
        sig_clerk: 'ئیمزايا فه‌رمانبه‌رێ وردبين',
        sig_officer: 'ئیمزايا ڕێڤه‌به‌رێ پشكا وردبينيێ',
        sig_director: 'ئیمزايا ڕێڤه‌به‌رێ گشتى',
        lbl_name_only: 'ناڤ',
        lbl_rank_name: 'پله‌ و ناڤ',
        sig_details_btn: 'ناڤا چاپکرنێ',
        sig_details_title: 'زانیاریێن دستخەتێ چاپکرن',
        monthly_archive: 'ئەرشیفا هەیڤانە یا ئاماران',
        view_details: 'نیشاندانا هوورکاریا',
        th_month: 'هه‌یڤ',
        sig_director_label: 'ناڤێ ڕێڤه‌به‌رێ گشتى',
        sig_clerk_label: 'ناڤا فه‌رمانبه‌رێ وردبين',
        sig_officer_label: 'ناڤێ ڕێڤه‌به‌رێ پشكا وردبينيێ',
        sig_save_btn: 'هەڵگرتن',
        close_btn: 'داخستن',
        delete_btn: 'ژێبرن',
        confirm_del_title: 'دووپاتكرنا ژێبرنێ',
        search_placeholder: 'ل تۆماران بگه‌ڕێ...',
        audit_dept: 'پشكا وردبينيێ',
        lbl_date_print: 'مێژوو:',
        lbl_page_num: 'هژمارا لاپه‌رێ:',
        lbl_print_time: 'ده‌مێ چاپكرنێ:',
        ov_stats_sub: 'شروڤه‌كرنا ته‌مام يا سيسته‌مى',
        lbl_upload_text: 'وێنه‌ى لڤێرە ڕابكێشه‌ یان ژى كلیك بكه‌ بۆ هه‌لبژارتنێ',
        lbl_choose_month: 'هه‌يڤێ هه‌لبژێره‌',
        lbl_choose_gender: 'ڕه‌گه‌زى هه‌لبژێره‌',
        m1: 'كانوونا دووێ',
        m2: 'شوبات',
        m3: 'ئادار',
        m4: 'نیسان',
        m5: 'گۆلان',
        m6: 'حوزەیران',
        m7: 'تیرمەهـ',
        m8: 'تەباخ',
        m9: 'ئەیلول',
        m10: 'چرییا ئێكێ',
        m11: 'چرییا دووێ',
        m12: 'كانوونا ئێكێ',
        lbl_export_placeholder: 'جهێ ده‌ركه‌فتى',
        lbl_import_placeholder: 'جهێ هاتى',
        bulk_print: 'چاپكرنا کۆمەلکی',
        bulk_print_desc: 'پشكێن بخازی چاپ بكی هه‌ڤ ده‌مدا هه‌لبژێره‌:',
        single_print: 'چاپكرنا تاکەكي',
        start_print: 'دەستپێكرنا چاپكرنێ',
        print_now: 'ئێسا چاپ بكه‌',
        print_record: 'چاپكرنا تۆمارێ',
        print_section_receipt: 'تۆمارا پسوولەیان',
        print_section_delegation: 'تۆمارا ئیفادان',
        print_section_children: 'تۆمارا زارۆكان',
        print_section_marriage: 'تۆمارا هه‌ڤژينيێ',
        print_section_fines: 'تۆمارا ده‌فته‌رێن سزایان',
        records_count: 'هژمارا تۆماران',
        backup_btn: 'پاراستنا پشتەڤان',
        backup_modal_title: 'ڕێڤه‌برنا پاراستنا پشتەڤان',
        backup_desc: 'تۆ دشێی هەمی پێزانینێن سیستمى د فایله‌كێ JSON دا بنێری بۆ پاراستنێ، یان ژى پاشان بهینيه‌ ڤە.',
        export_btn: 'هەناردەكرنا پێزانينان (JSON)',
        import_btn: 'هینانەڤەیا پێزانينان (JSON)',
        confirm_import_title: 'دووپاتكرنا هینانەڤەیا پێزانينان',
        confirm_import_warning: 'هشیاري: هینانەڤەیا فایلی دێ هەمی پێزانینێن نوكە یێن سیستمى ژێبه‌ت و گوهۆڕیت. پاشگەزبوون نینە!',
        confirm_btn: 'دووپاتكرنا هینانەڤەیێ',
        import_success: 'پێزانین ب سەركەفتیانە هاتنە هینانەڤە!',
        invalid_file_error: 'فایلێ پشتەڤانیێ یێ دروست نینە!',
        currency: 'د.ع',
        lbl_employee_gender: 'ڕه‌گه‌زێ فه‌رمانبه‌رى',
        pl_search: 'ل ڤى پشكێ بگه‌ڕێ...',
        title_search: 'گه‌ڕيان',
        title_clear: 'پاككرن',
        splash_year: '© 2025 - ڕێڤه‌به‌ريا هاتنوچوونا زاخۆ',
        pl_sig_director: 'ناڤێ ڕێڤه‌به‌رێ گشتى بنڤیسە',
        pl_sig_clerk: 'ناڤێ فه‌رمانبه‌رێ وردبين بنڤیسە',
        pl_sig_officer: 'ناڤێ ڕێڤه‌به‌رێ پشكا وردبينيێ بنڤیسە',
        err_select_section: 'تكایە لانی کێم یه‌ک پشك هه‌لبژێره‌',
        err_no_data_sections: 'پێزانين نینن ل پشکێن هه‌لبژارتى',
        err_no_data_print: 'داتا بۆ چاپ كرنێ نينن',
        lbl_section_details: 'کورتیا پشکان:',
        lbl_record_single: 'تۆمار',
        stats_breakdown_title: 'ئامارێن گشتى یێن پشکان',
        lbl_grand_total: 'كۆما گشتی',
        btn_refresh_stats: 'نووكرنا ئاماران',
        pl_directorate: 'ناڤێ ڕێڤه‌به‌ریێ بنڤیسە',
        pl_department: 'ناڤێ پشكێ بنڤیسە',
        pl_location: 'جهى بنڤیسە',
        pl_code: 'كۆدێ بنڤیسە',
        pl_name: 'ناڤێ سيانى يێ موفه‌دى بنڤیسە',
        pl_father: 'ناڤێ سيانى يێ بابى بنڤیسە',
        pl_mother: 'ناڤێ سيانى يێ دايكێ بنڤیسە',
        pl_child: 'ناڤێ سيانى يێ زارۆكى بنڤیسە',
        pl_husband: 'ناڤێ مێرى بنڤیسە',
        pl_wife: 'ناڤێ ژنێ بنڤیسە',
        pl_holder: 'ناڤێ خودانێ ده‌فته‌رێ',
        pl_book_num: 'هژمارا ده‌فته‌رێ'
    }
};

function toggleLanguage() {
    currentLang = (currentLang === 'ar') ? 'ku' : 'ar';
    localStorage.setItem('appLang', currentLang);
    applyLanguage();
    initData();
    updateOverviewCards();
}

function applyLanguage() {
    const langData = translations[currentLang];
    
    // Translate text content
    document.querySelectorAll('[data-tr]').forEach(el => {
        const key = el.getAttribute('data-tr');
        if (langData[key]) {
            if (el.tagName === 'INPUT' && el.type !== 'radio' && el.type !== 'checkbox') {
                el.placeholder = langData[key];
            } else {
                el.textContent = langData[key];
            }
        }
    });

    // Translate placeholders specifically
    document.querySelectorAll('[data-tr-placeholder]').forEach(el => {
        const key = el.getAttribute('data-tr-placeholder');
        if (langData[key]) {
            el.placeholder = langData[key];
        }
    });

    // Translate titles (tooltips)
    document.querySelectorAll('[data-tr-title]').forEach(el => {
        const key = el.getAttribute('data-tr-title');
        if (langData[key]) {
            el.title = langData[key];
        }
    });

    // Translate all language buttons
    document.querySelectorAll('.lang-text-el').forEach(el => {
        el.textContent = langData.lang_btn;
    });
    
    document.title = langData.app_title;
    document.documentElement.lang = currentLang;
}

document.addEventListener('DOMContentLoaded', () => {
    applyLanguage();
    initData();
    updateOverviewCards();

    const forms = [
        { id: 'receipts-form', key: 'receipts', renderFunc: renderReceipts },
        { id: 'delegations-form', key: 'delegations', renderFunc: renderDelegations },
        { id: 'children-form', key: 'children', renderFunc: renderChildren },
        { id: 'marriage-form', key: 'marriage', renderFunc: renderMarriage },
        { id: 'fines-form', key: 'fines', renderFunc: renderFines }
    ];

    forms.forEach(formDef => {
        const formEl = document.getElementById(formDef.id);
        if(formEl) {
            formEl.addEventListener('submit', async function(e) {
                e.preventDefault();
                const formData = new FormData(formEl);
                const dataObj = {};
                for (let [key, value] of formData.entries()) {
                    if (value instanceof File && value.name) {
                        try {
                            dataObj[key] = await getBase64(value);
                        } catch(err) {
                            console.error(err);
                            showToast(translations[currentLang].err_image);
                            return;
                        }
                    } else if (!(value instanceof File)) {
                        dataObj[key] = value;
                    }
                }
                let currentData = JSON.parse(localStorage.getItem(formDef.key) || '[]');
                if (editingKey === formDef.key && editingIdx !== null) {
                    if (!dataObj.receipt_image && currentData[editingIdx].receipt_image) {
                        dataObj.receipt_image = currentData[editingIdx].receipt_image;
                    }
                    currentData[editingIdx] = dataObj;
                } else {
                    currentData.push(dataObj);
                }
                
                try {
                    localStorage.setItem(formDef.key, JSON.stringify(currentData));
                } catch(e) {
                    if (e.name === 'QuotaExceededError') {
                        showToast(translations[currentLang].err_storage);
                        return;
                    }
                }
                
                formDef.renderFunc();
                updateOverviewCards();
                formEl.reset();
                setDefaultDates();
                closeAllModals();
                showToast(translations[currentLang].success_save);
            });
        }
    });

    setDefaultDates();

    // Real-time calculations for Delegations
    const delCount = document.querySelector('#delegations-form [name="count"]');
    const delAmount = document.querySelector('#delegations-form [name="amount"]');
    const delTotal = document.querySelector('#delegations-form [name="total"]');
    
    if(delCount && delAmount && delTotal) {
        const calcTotal = () => {
            const count = parseFloat(delCount.value) || 0;
            const amount = parseFloat(delAmount.value) || 0;
            delTotal.value = (count * amount).toFixed(0); // Assuming Iraqi Dinar has no fractions typically, or keep decimal if needed
        };
        delCount.addEventListener('input', calcTotal);
        delAmount.addEventListener('input', calcTotal);
    }
});

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const img = new Image();
            img.src = reader.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Compress image to save localStorage space
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = () => reject(new Error("Failed to load image"));
        };
        reader.onerror = error => reject(error);
    });
}

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.value = today;
    });
}

function initData() {
    renderReceipts();
    renderDelegations();
    renderChildren();
    renderMarriage();
    renderFines();
}

function updateOverviewCards() {
    const receipts    = JSON.parse(localStorage.getItem('receipts')    || '[]');
    const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
    const children    = JSON.parse(localStorage.getItem('children')    || '[]');
    const marriage    = JSON.parse(localStorage.getItem('marriage')    || '[]');
    const fines       = JSON.parse(localStorage.getItem('fines')       || '[]');

    const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    const currency    = translations[currentLang].currency;

    const rTotal = receipts.reduce((s,i) => s + (parseFloat(i.amount)||0), 0);
    set('ov-receipts-count', receipts.length);
    set('ov-receipts-total', rTotal.toLocaleString() + ' ' + currency);

    const dTotal = delegations.reduce((s,i) => s + (parseFloat(i.total)||0), 0);
    set('ov-delegations-count', delegations.length);
    set('ov-delegations-total', dTotal.toLocaleString() + ' ' + currency);

    const cTotal = children.reduce((s,i) => s + (parseFloat(i.amount)||0), 0);
    set('ov-children-count', children.length);
    set('ov-children-total', cTotal.toLocaleString() + ' ' + currency);

    const mTotal = marriage.reduce((s,i) => s + (parseFloat(i.amount)||0), 0);
    set('ov-marriage-count', marriage.length);
    set('ov-marriage-total', mTotal.toLocaleString() + ' ' + currency);

    const fTotal = fines.reduce((s,i) => s + (parseFloat(i.total)||0), 0);
    set('ov-fines-count', fines.length);
    set('ov-fines-total', fTotal.toLocaleString() + ' ' + currency);

    const totalRecords = receipts.length + delegations.length + children.length + marriage.length + fines.length;
    set('ov-total-records', totalRecords);
}

function renderReceipts(filter) {
    let data = JSON.parse(localStorage.getItem('receipts') || '[]');
    if (filter) data = data.filter(item => matchesFilter(item, filter));
    const tbody = document.querySelector('#receipts-table tbody');
    if(!tbody) return;
    const statsDiv = document.getElementById('receipts-stats');
    const lang = translations[currentLang];
    if(statsDiv) {
        let totalAmount = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        let centralCount = data.filter(item => item.receipt_type === 'مركزي').length;
        let decentralCount = data.filter(item => item.receipt_type === 'لا مركزي').length;
        statsDiv.innerHTML = `
            <div class="stat-item"><h4>${lang.st_total_receipts}</h4><div class="stat-value">${data.length}</div></div>
            <div class="stat-item"><h4>${lang.st_total_amounts}</h4><div class="stat-value">${totalAmount.toLocaleString()} ${lang.currency}</div></div>
            <div class="stat-item"><h4>${lang.st_central}</h4><div class="stat-value">${centralCount}</div></div>
            <div class="stat-item"><h4>${lang.st_decentral}</h4><div class="stat-value">${decentralCount}</div></div>
        `;
    }
    tbody.innerHTML = data.length ? '' : `<tr><td colspan="9" style="text-align:center;">${lang.empty_data}</td></tr>`;
    data.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge ${item.receipt_type === 'مركزي' ? 'bg-primary' : 'bg-secondary'}">${item.receipt_type === 'مركزي' ? lang.lbl_central : lang.lbl_decentral}</span></td>
            <td>${item.directorate}</td>
            <td>${item.department}</td>
            <td>${item.location}</td>
            <td>${item.date}</td>
            <td>${item.code}</td>
            <td style="font-weight:bold; color:var(--success);">${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>
            <td class="no-print">${item.receipt_image ? `<button class="btn-icon-sm" onclick="viewImage('${item.receipt_image}')"><i class="fa-solid fa-image"></i></button>` : '—'}</td>
            <td class="no-print action-btns">
                <button class="btn-icon-sm print" onclick="printSingleRecord('receipts',${idx})" title="${lang.print_record}"><i class="fa-solid fa-print"></i></button>
                <button class="btn-icon-sm edit" onclick="editRecord('receipts',${idx})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon-sm del" onclick="deleteRecord('receipts',${idx})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewImage(base64Str) {
    const imgEl = document.getElementById('preview-img-el');
    if(imgEl) {
        imgEl.src = base64Str;
        openModal('image-preview-modal');
    }
}

function renderDelegations(filter) {
    let data = JSON.parse(localStorage.getItem('delegations') || '[]');
    if (filter) data = data.filter(item => matchesFilter(item, filter));
    const tbody = document.querySelector('#delegations-table tbody');
    if(!tbody) return;
    const statsDiv = document.getElementById('delegations-stats');
    const lang = translations[currentLang];
    if(statsDiv) {
        let totalAmount = data.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
        let totalMissions = data.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0);
        statsDiv.innerHTML = `
            <div class="stat-item"><h4>${lang.st_delegation_records}</h4><div class="stat-value">${data.length}</div></div>
            <div class="stat-item"><h4>${lang.st_total_delegations}</h4><div class="stat-value">${totalMissions}</div></div>
            <div class="stat-item"><h4>${lang.lbl_total}</h4><div class="stat-value">${totalAmount.toLocaleString()} ${lang.currency}</div></div>
        `;
    }
    
    const monthMap = {
        'كانون الثاني': 'm1', 'شباط': 'm2', 'آذار': 'm3', 'نيسان': 'm4',
        'أيار': 'm5', 'حزيران': 'm6', 'تموز': 'm7', 'آب': 'm8',
        'أيلول': 'm9', 'تشرين الأول': 'm10', 'تشرين الثاني': 'm11', 'كانون الأول': 'm12'
    };

    tbody.innerHTML = data.length ? '' : `<tr><td colspan="8" style="text-align:center;">${lang.empty_data}</td></tr>`;
    data.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${monthMap[item.month] && lang[monthMap[item.month]] ? lang[monthMap[item.month]] : item.month}</td>
            <td><span class="badge bg-secondary">${item.count}</span></td>
            <td>${item.export_num}</td>
            <td>${item.import_num}</td>
            <td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>
            <td style="font-weight:bold; color:var(--success);">${parseFloat(item.total).toLocaleString()} ${lang.currency}</td>
            <td class="no-print action-btns">
                <button class="btn-icon-sm print" onclick="printSingleRecord('delegations',${idx})" title="${lang.print_record}"><i class="fa-solid fa-print"></i></button>
                <button class="btn-icon-sm edit" onclick="editRecord('delegations',${idx})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon-sm del" onclick="deleteRecord('delegations',${idx})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderChildren(filter) {
    let data = JSON.parse(localStorage.getItem('children') || '[]');
    if (filter) data = data.filter(item => matchesFilter(item, filter));
    const tbody = document.querySelector('#children-table tbody');
    if(!tbody) return;
    const statsDiv = document.getElementById('children-stats');
    const lang = translations[currentLang];
    if(statsDiv) {
        let totalAmount = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        let males = data.filter(item => item.gender === 'ذكر').length;
        let females = data.filter(item => item.gender === 'أنثى').length;
        statsDiv.innerHTML = `
            <div class="stat-item"><h4>${lang.st_total_children}</h4><div class="stat-value">${data.length}</div></div>
            <div class="stat-item"><h4>${lang.lbl_total}</h4><div class="stat-value">${totalAmount.toLocaleString()} ${lang.currency}</div></div>
            <div class="stat-item"><h4>${lang.st_males}</h4><div class="stat-value">${males}</div></div>
            <div class="stat-item"><h4>${lang.st_females}</h4><div class="stat-value">${females}</div></div>
        `;
    }
    tbody.innerHTML = data.length ? '' : `<tr><td colspan="8" style="text-align:center;">${lang.empty_data}</td></tr>`;
    data.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.father}</td>
            <td>${item.mother}</td>
            <td>${item.child}</td>
            <td>${item.gender === 'ذكر' ? lang.lbl_male : lang.lbl_female}</td>
            <td>${item.dob}</td>
            <td>${item.arrival}</td>
            <td style="font-weight:bold; color:var(--success);">${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>
            <td class="no-print action-btns">
                <button class="btn-icon-sm print" onclick="printSingleRecord('children',${idx})" title="${lang.print_record}"><i class="fa-solid fa-print"></i></button>
                <button class="btn-icon-sm edit" onclick="editRecord('children',${idx})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon-sm del" onclick="deleteRecord('children',${idx})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderMarriage(filter) {
    let data = JSON.parse(localStorage.getItem('marriage') || '[]');
    if (filter) data = data.filter(item => matchesFilter(item, filter));
    const tbody = document.querySelector('#marriage-table tbody');
    if(!tbody) return;
    const statsDiv = document.getElementById('marriage-stats');
    const lang = translations[currentLang];
    if(statsDiv) {
        let totalAmount = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        statsDiv.innerHTML = `
            <div class="stat-item"><h4>${lang.st_marriage_contracts}</h4><div class="stat-value">${data.length}</div></div>
            <div class="stat-item"><h4>${lang.lbl_total}</h4><div class="stat-value">${totalAmount.toLocaleString()} ${lang.currency}</div></div>
        `;
    }
    tbody.innerHTML = data.length ? '' : `<tr><td colspan="7" style="text-align:center;">${lang.empty_data}</td></tr>`;
    data.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.husband}</td>
            <td>${item.wife}</td>
            <td>${item.gender === 'ذكر' ? lang.lbl_male : lang.lbl_female}</td>
            <td>${item.date}</td>
            <td>${item.arrival}</td>
            <td style="font-weight:bold; color:var(--success);">${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>
            <td class="no-print action-btns">
                <button class="btn-icon-sm print" onclick="printSingleRecord('marriage',${idx})" title="${lang.print_record}"><i class="fa-solid fa-print"></i></button>
                <button class="btn-icon-sm edit" onclick="editRecord('marriage',${idx})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon-sm del" onclick="deleteRecord('marriage',${idx})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderFines(filter) {
    let data = JSON.parse(localStorage.getItem('fines') || '[]');
    if (filter) data = data.filter(item => matchesFilter(item, filter));
    const tbody = document.querySelector('#fines-table tbody');
    if(!tbody) return;
    const statsDiv = document.getElementById('fines-stats');
    const lang = translations[currentLang];
    if(statsDiv) {
        let totalAmount = data.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
        let type38Count = data.filter(item => item.book_type === '38 أ').length;
        let type68Count = data.filter(item => item.book_type === '68 أ').length;
        statsDiv.innerHTML = `
            <div class="stat-item"><h4>${lang.st_total_books}</h4><div class="stat-value">${data.length}</div></div>
            <div class="stat-item"><h4>${lang.lbl_total}</h4><div class="stat-value">${totalAmount.toLocaleString()} ${lang.currency}</div></div>
            <div class="stat-item"><h4>38أ</h4><div class="stat-value">${type38Count}</div></div>
            <div class="stat-item"><h4>68أ</h4><div class="stat-value">${type68Count}</div></div>
        `;
    }
    tbody.innerHTML = data.length ? '' : `<tr><td colspan="7" style="text-align:center;">${lang.empty_data}</td></tr>`;
    data.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge ${item.book_type === '38 أ' ? 'bg-primary' : 'bg-warning'}">${item.book_type}</span></td>
            <td>${item.holder}</td>
            <td>${item.book_number}</td>
            <td style="font-weight:bold; color:var(--danger);">${parseFloat(item.total).toLocaleString()} ${lang.currency}</td>
            <td>${item.date}</td>
            <td>${item.location}</td>
            <td class="no-print action-btns">
                <button class="btn-icon-sm print" onclick="printSingleRecord('fines',${idx})" title="${lang.print_record}"><i class="fa-solid fa-print"></i></button>
                <button class="btn-icon-sm edit" onclick="editRecord('fines',${idx})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon-sm del" onclick="deleteRecord('fines',${idx})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Generic filter matcher — checks all string fields for the query (case-insensitive)
function matchesFilter(item, query) {
    if (!query) return true;
    const q = String(query).trim().toLowerCase();
    // If query is empty after trim
    if (!q) return true;
    // Check all values
    for (const k in item) {
        if (!Object.prototype.hasOwnProperty.call(item, k)) continue;
        const v = item[k];
        if (v === null || v === undefined) continue;
        if (typeof v === 'string' || typeof v === 'number') {
            try {
                if (String(v).toLowerCase().includes(q)) return true;
            } catch (e) { /* ignore */ }
        }
    }
    return false;
}

// Perform search on the currently active section
function performSearch() {
    const input = document.getElementById('section-search');
    if (!input) return;
    const q = input.value.trim();
    const active = document.querySelector('.content-section.active');
    // If no active section, try to search receipts by default
    const key = active ? active.id.replace('-section','') : null;
    if (!q) {
        // clear filters
        initData();
        return;
    }
    switch (key) {
        case 'receipts': renderReceipts(q); break;
        case 'delegations': renderDelegations(q); break;
        case 'children': renderChildren(q); break;
        case 'marriage': renderMarriage(q); break;
        case 'fines': renderFines(q); break;
        case 'stats': renderStats(); break;
        default:
            // search across all and show first matching section
            const allKeys = ['receipts','delegations','children','marriage','fines'];
            let found = false;
            for (const k of allKeys) {
                const arr = JSON.parse(localStorage.getItem(k) || '[]');
                const match = arr.find(it => matchesFilter(it, q));
                if (match) {
                    showSection(k + '-section');
                    // render with filter
                    if (k === 'receipts') renderReceipts(q);
                    if (k === 'delegations') renderDelegations(q);
                    if (k === 'children') renderChildren(q);
                    if (k === 'marriage') renderMarriage(q);
                    if (k === 'fines') renderFines(q);
                    found = true; break;
                }
            }
            if (!found) showToast(translations[currentLang].empty_data);
    }
}

function clearSearch() {
    const input = document.getElementById('section-search');
    if (!input) return;
    input.value = '';
    initData();
    showToast('');
}

const formKeyMap = {
    receipts: 'receipts-form',
    delegations: 'delegations-form',
    children: 'children-form',
    marriage: 'marriage-form',
    fines: 'fines-form'
};
const modalKeyMap = {
    receipts: 'receipts-modal',
    delegations: 'delegations-modal',
    children: 'children-modal',
    marriage: 'marriage-modal',
    fines: 'fines-modal'
};

function editRecord(key, idx) {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    const item = data[idx];
    if (!item) return;
    editingKey = key;
    editingIdx = idx;
    const formId = formKeyMap[key];
    const formEl = document.getElementById(formId);
    if (!formEl) return;
    formEl.querySelectorAll('[name]').forEach(input => {
        const val = item[input.name];
        if (val === undefined) return;
        if (input.type === 'radio') {
            input.checked = (input.value === val);
        } else if (input.type !== 'file') {
            input.value = val;
        }
    });
    const submitBtn = formEl.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.textContent = translations[currentLang].edit_save_btn;
    openModal(modalKeyMap[key]);
}

function deleteRecord(key, idx) {
    pendingDelete = { key, idx };
    openModal('confirm-modal');
}

function executeDelete() {
    const { key, idx } = pendingDelete;
    if (key === null || idx === null) return;

    const data = JSON.parse(localStorage.getItem(key) || '[]');
    data.splice(idx, 1);
    localStorage.setItem(key, JSON.stringify(data));

    const renderMap = {
        receipts: renderReceipts,
        delegations: renderDelegations,
        children: renderChildren,
        marriage: renderMarriage,
        fines: renderFines
    };

    if (renderMap[key]) renderMap[key]();
    updateOverviewCards();
    closeAllModals();
    showToast(translations[currentLang].success_save); // Re-use success toast or add specific one
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    if(modal && overlay) {
        document.body.classList.add('modal-open');
        modal.style.display = 'flex';
        overlay.style.display = 'block';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%) scale(1)';
            overlay.style.opacity = '1';
        }, 10);
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    const overlay = document.getElementById('modal-overlay');
    modals.forEach(modal => {
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
    });
    if(overlay) overlay.style.opacity = '0';
    setTimeout(() => {
        modals.forEach(modal => modal.style.display = 'none');
        if(overlay) overlay.style.display = 'none';
        document.body.classList.remove('modal-open');
    }, 300);
    editingKey = null;
    editingIdx = null;
    document.querySelectorAll('.custom-form [type="submit"]').forEach(btn => {
        // Preserve icon if present
        const icon = btn.querySelector('i');
        btn.textContent = translations[currentLang].save_btn;
        if (icon) btn.prepend(icon);
    });
}

window.addEventListener('beforeprint', () => {
    const now = new Date();
    document.getElementById('print-current-date').textContent = now.toLocaleDateString(currentLang === 'ar' ? 'ar-IQ' : 'ku-IQ');
    document.getElementById('print-timestamp').textContent = now.toLocaleTimeString(currentLang === 'ar' ? 'ar-IQ' : 'ku-IQ');
    const activeSection = document.querySelector('.content-section.active');
    const titleElement = document.getElementById('print-section-title');
    if(activeSection) {
        const headerTitle = activeSection.querySelector('.section-header h2');
        titleElement.textContent = headerTitle ? headerTitle.textContent.trim() : 'سجل التدقيق';
    }

    renderPrintSignatureNames();
    document.body.classList.remove('print-extra-compact');
    document.documentElement.style.setProperty('--print-scale', '1');
    document.documentElement.style.setProperty('--print-table-size', '7.2pt');

    const table = activeSection ? activeSection.querySelector('.data-table') : null;
    if (table) {
        const headerCells = table.tHead ? Array.from(table.tHead.querySelectorAll('th')) : [];
        const printableColumns = headerCells.filter(cell => !cell.classList.contains('no-print')).length || 1;
        const rowCount = table.tBodies[0] ? table.tBodies[0].rows.length : 0;
        const printableHeight = (210 - 12) * 96 / 25.4;
        const estimatedHeaderFooter = rowCount > 12 ? 150 : 175;
        const estimatedRowHeight = rowCount > 18 ? 15 : 18;
        const estimatedContentHeight = estimatedHeaderFooter + ((rowCount + 1) * estimatedRowHeight);
        const heightScale = printableHeight / estimatedContentHeight;
        const widthScale = printableColumns > 6 ? 6 / printableColumns : 1;
        const scale = Math.max(0.62, Math.min(1, heightScale, widthScale));
        const tableSize = Math.max(5.2, Math.min(7.2, 7.2 - Math.max(0, rowCount - 12) * 0.08 - Math.max(0, printableColumns - 6) * 0.25));

        document.documentElement.style.setProperty('--print-scale', scale.toFixed(2));
        document.documentElement.style.setProperty('--print-table-size', `${tableSize.toFixed(1)}pt`);
        document.body.classList.toggle('print-extra-compact', rowCount > 12 || printableColumns > 6 || scale < 0.9);
    }
});

window.addEventListener('afterprint', () => {
    document.body.classList.remove('print-extra-compact');
    document.documentElement.style.removeProperty('--print-scale');
    document.documentElement.style.removeProperty('--print-table-size');
    // Restore after bulk print
    if (window._bulkPrintActive) {
        window._bulkPrintActive = false;
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        const savedSection = window._bulkPrintSavedSection;
        if (savedSection) savedSection.classList.add('active');
        window._bulkPrintSavedSection = null;
    }
});

// ===== INDIVIDUAL (SINGLE) PRINT =====
let _singlePrintHTML = '';

function printSingleRecord(key, idx) {
    const lang = translations[currentLang];
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    const item = data[idx];
    if (!item) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString(currentLang === 'ar' ? 'ar-IQ' : 'ku-IQ');
    const timeStr = now.toLocaleTimeString(currentLang === 'ar' ? 'ar-IQ' : 'ku-IQ');

    const sectionTitles = {
        receipts: lang.print_section_receipt,
        delegations: lang.print_section_delegation,
        children: lang.print_section_children,
        marriage: lang.print_section_marriage,
        fines: lang.print_section_fines
    };

    // Build field rows based on section
    let rows = '';
    if (key === 'receipts') {
        rows = `
            <tr><th>${lang.lbl_receipt_type}</th><td>${item.receipt_type === 'مركزي' ? lang.lbl_central : lang.lbl_decentral}</td></tr>
            <tr><th>${lang.lbl_directorate}</th><td>${item.directorate}</td></tr>
            <tr><th>${lang.lbl_department}</th><td>${item.department}</td></tr>
            <tr><th>${lang.lbl_location}</th><td>${item.location}</td></tr>
            <tr><th>${lang.lbl_date}</th><td>${item.date}</td></tr>
            <tr><th>${lang.lbl_code}</th><td>${item.code}</td></tr>
            <tr class="amount-row"><th>${lang.lbl_amount}</th><td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td></tr>
        `;
    } else if (key === 'delegations') {
        rows = `
            <tr><th>${lang.th_name}</th><td>${item.name}</td></tr>
            <tr><th>${lang.lbl_month}</th><td>${item.month}</td></tr>
            <tr><th>${lang.lbl_count}</th><td>${item.count}</td></tr>
            <tr><th>${lang.th_export}</th><td>${item.export_num}</td></tr>
            <tr><th>${lang.th_import}</th><td>${item.import_num}</td></tr>
            <tr><th>${lang.lbl_amount}</th><td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td></tr>
            <tr class="amount-row"><th>${lang.lbl_total}</th><td>${parseFloat(item.total).toLocaleString()} ${lang.currency}</td></tr>
        `;
    } else if (key === 'children') {
        rows = `
            <tr><th>${lang.lbl_father}</th><td>${item.father}</td></tr>
            <tr><th>${lang.lbl_mother}</th><td>${item.mother}</td></tr>
            <tr><th>${lang.lbl_child}</th><td>${item.child}</td></tr>
            <tr><th>${lang.lbl_gender}</th><td>${item.gender === 'ذكر' ? lang.lbl_male : lang.lbl_female}</td></tr>
            <tr><th>${lang.th_dob}</th><td>${item.dob}</td></tr>
            <tr><th>${lang.th_arrival}</th><td>${item.arrival}</td></tr>
            <tr class="amount-row"><th>${lang.lbl_amount}</th><td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td></tr>
        `;
    } else if (key === 'marriage') {
        rows = `
            <tr><th>${lang.lbl_husband}</th><td>${item.husband}</td></tr>
            <tr><th>${lang.lbl_wife}</th><td>${item.wife}</td></tr>
            <tr><th>${lang.lbl_employee_gender || lang.lbl_gender}</th><td>${item.gender === 'ذكر' ? lang.lbl_male : lang.lbl_female}</td></tr>
            <tr><th>${lang.th_marriage_date || lang.th_date}</th><td>${item.date}</td></tr>
            <tr><th>${lang.th_arrival}</th><td>${item.arrival}</td></tr>
            <tr class="amount-row"><th>${lang.lbl_amount}</th><td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td></tr>
        `;
    } else if (key === 'fines') {
        rows = `
            <tr><th>${lang.lbl_book_type}</th><td>${item.book_type}</td></tr>
            <tr><th>${lang.lbl_holder}</th><td>${item.holder}</td></tr>
            <tr><th>${lang.lbl_book_num}</th><td>${item.book_number}</td></tr>
            <tr><th>${lang.th_date}</th><td>${item.date}</td></tr>
            <tr><th>${lang.lbl_location}</th><td>${item.location}</td></tr>
            <tr class="amount-row"><th>${lang.lbl_total}</th><td>${parseFloat(item.total).toLocaleString()} ${lang.currency}</td></tr>
        `;
    }

    const hasImage = (key === 'receipts' && item.receipt_image);
    const bodyContent = hasImage ? `
        <div class="spc-body-row">
            <div class="spc-info-side">
                <table class="spc-table">
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <div class="spc-image-side">
                <div class="spc-image-container">
                    <p class="spc-image-title">${lang.th_image}</p>
                    <img src="${item.receipt_image}" class="spc-receipt-img">
                </div>
            </div>
        </div>
    ` : `
        <table class="spc-table">
            <tbody>${rows}</tbody>
        </table>
    `;

    const sigNames = getSignatureNames();
    const html = `
        <div class="single-print-card">
            <div class="spc-header">
                <div class="spc-header-right">
                    <p class="spc-gov">${lang.gov_name}</p>
                    <p class="spc-min">${lang.ministry}</p>
                    <p class="spc-dept">${lang.dept_name}</p>
                    <p class="spc-audit">${lang.audit_dept}</p>
                </div>
                <div class="spc-header-center">
                    <img src="logo.png" class="spc-logo">
                    <h2 class="spc-title">${sectionTitles[key]}</h2>
                    <p class="spc-badge">${lang.single_print}</p>
                </div>
                <div class="spc-header-left">
                    <p><strong>${lang.lbl_date_print}</strong> ${dateStr}</p>
                    <p><strong>${lang.lbl_print_time}</strong> ${timeStr}</p>
                    <p><strong>${lang.records_count}:</strong> 1</p>
                </div>
            </div>
            <div class="spc-divider"></div>
            ${bodyContent}
            <div class="spc-divider" style="margin-top:30px;"></div>
            <div class="spc-signatures">
                <div class="spc-sig"><p>${lang.sig_clerk}</p><p>${lang.lbl_name_only}: ${formatSignatureValue(sigNames.clerk)}</p></div>
                <div class="spc-sig"><p>${lang.sig_officer}</p><p>${lang.lbl_name_only}: ${formatSignatureValue(sigNames.officer)}</p></div>
                <div class="spc-sig"><p>${lang.sig_director}</p><p>${lang.lbl_rank_name}: ${formatSignatureValue(sigNames.director)}</p></div>
            </div>
        </div>
    `;

    document.getElementById('single-print-preview').innerHTML = html;
    _singlePrintHTML = html;
    openModal('single-print-modal');
}

function executeSinglePrint() {
    const lang = translations[currentLang];
    const win = window.open('', '_blank', 'width=800,height=700');
    win.document.write(`
        <!DOCTYPE html>
        <html lang="${currentLang}" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>${lang.single_print}</title>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@100..900&display=swap" rel="stylesheet">
            <style>
                * { margin:0; padding:0; box-sizing:border-box; font-family:'Noto Kufi Arabic',sans-serif; }
                body { background:#fff; color:#1a1a2e; direction:rtl; }
                .single-print-card { padding:28px 35px; max-width:750px; margin:auto; }
                .spc-header { display:flex; justify-content:space-between; align-items:flex-start; gap:15px; margin-bottom:10px; }
                .spc-header-right, .spc-header-left { flex:1; font-size:12px; line-height:1.9; }
                .spc-header-left { text-align:left; }
                .spc-header-center { flex:0 0 160px; text-align:center; }
                .spc-gov { font-size:11px; color:#444; }
                .spc-min { font-size:11px; color:#444; }
                .spc-dept { font-size:13px; font-weight:700; }
                .spc-audit { font-size:12px; color:#0D8ABC; }
                .spc-logo { width:80px; height:80px; object-fit:contain; margin-bottom:6px; }
                .spc-title { font-size:16px; font-weight:800; color:#1a1a2e; }
                .spc-badge { display:inline-block; background:#0D8ABC; color:#fff; font-size:10px; padding:3px 10px; border-radius:20px; margin-top:4px; }
                .spc-divider { height:2px; background:linear-gradient(90deg,#0D8ABC,#F59E0B); border-radius:5px; margin:12px 0; }
                .spc-table { width:100%; border-collapse:collapse; margin-top:8px; }
                .spc-table th { background:#f0f7fc; color:#1a1a2e; text-align:right; padding:9px 14px; font-size:12px; width:35%; border:1px solid #dde; }
                .spc-table td { padding:9px 14px; font-size:13px; border:1px solid #dde; }
                .spc-table tr.amount-row th, .spc-table tr.amount-row td { background:#fff8e1; font-weight:700; color:#b45309; font-size:14px; }
                .spc-signatures { display:flex; justify-content:space-between; gap:20px; margin-top:20px; }
                .spc-sig { text-align:center; flex:1; font-size:11px; }
                .spc-sig p:first-child { font-weight:700; margin-bottom:28px; }
                .spc-sig-line { border-top:1px solid #333; padding-top:4px; margin-bottom:4px; }
                .spc-body-row { display:flex; gap:20px; align-items:flex-start; margin-top:10px; width:100%; }
                .spc-info-side { flex:1 1 55%; }
                .spc-image-side { flex:1 1 45%; text-align:center; }
                .spc-image-container { border:1px solid #ddd; border-radius:8px; padding:10px; background:#f9f9f9; }
                .spc-receipt-img { max-width:100%; max-height:280px; object-fit:contain; border-radius:6px; display:block; margin:0 auto; }
                .spc-image-title { font-weight:600; margin-bottom:8px; color:#555; font-size:11px; text-align:center; }
                @media print {
                    @page { margin:1.5cm; }
                    body { display:flex; flex-direction:column; min-height:calc(100vh - 3cm); }
                    .single-print-card { flex:1; display:flex; flex-direction:column; min-height:calc(100vh - 3cm); }
                    .spc-signatures { margin-top:auto; padding-top:20px; }
                }
            </style>
        </head>
        <body>${_singlePrintHTML}</body>
        <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
        </html>
    `);
    win.document.close();
}

// ===== BULK PRINT =====
function openBulkPrintModal() {
    // Update record counts
    const keys = ['receipts','delegations','children','marriage','fines'];
    keys.forEach(key => {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        const el = document.getElementById(`bp-count-${key}`);
        if (el) el.textContent = `(${data.length})`;
    });
    openModal('bulk-print-modal');
}

function buildSectionHTML(key, lang) {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    if (!data.length) return '';

    const sectionTitles = {
        receipts: lang.print_section_receipt,
        delegations: lang.print_section_delegation,
        children: lang.print_section_children,
        marriage: lang.print_section_marriage,
        fines: lang.print_section_fines
    };

    const headers = {
        receipts: `<th>${lang.th_type}</th><th>${lang.th_directorate}</th><th>${lang.th_department}</th><th>${lang.th_location}</th><th>${lang.th_date}</th><th>${lang.th_code}</th><th>${lang.th_amount}</th>`,
        delegations: `<th>${lang.th_name}</th><th>${lang.th_month}</th><th>${lang.th_count}</th><th>${lang.th_export}</th><th>${lang.th_import}</th><th>${lang.th_amount}</th><th>${lang.th_total}</th>`,
        children: `<th>${lang.th_father}</th><th>${lang.th_mother}</th><th>${lang.th_child}</th><th>${lang.th_gender}</th><th>${lang.th_dob}</th><th>${lang.th_arrival}</th><th>${lang.th_amount}</th>`,
        marriage: `<th>${lang.th_husband}</th><th>${lang.th_wife}</th><th>${lang.lbl_employee_gender || lang.th_gender}</th><th>${lang.th_marriage_date || lang.th_date}</th><th>${lang.th_arrival}</th><th>${lang.th_amount}</th>`,
        fines: `<th>${lang.th_type}</th><th>${lang.th_holder}</th><th>${lang.th_book_num}</th><th>${lang.th_total}</th><th>${lang.th_date}</th><th>${lang.th_location}</th>`
    };

    const monthMap = {
        'كانون الثاني':'m1','شباط':'m2','آذار':'m3','نيسان':'m4','أيار':'m5','حزيران':'m6',
        'تموز':'m7','آب':'m8','أيلول':'m9','تشرين الأول':'m10','تشرين الثاني':'m11','كانون الأول':'m12'
    };

    let bodyRows = data.map(item => {
        let cells = '';
        if (key === 'receipts') {
            cells = `<td>${item.receipt_type === 'مركزي' ? lang.lbl_central : lang.lbl_decentral}</td><td>${item.directorate}</td><td>${item.department}</td><td>${item.location}</td><td>${item.date}</td><td>${item.code}</td><td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>`;
        } else if (key === 'delegations') {
            const mKey = monthMap[item.month];
            cells = `<td>${item.name}</td><td>${mKey && lang[mKey] ? lang[mKey] : item.month}</td><td>${item.count}</td><td>${item.export_num}</td><td>${item.import_num}</td><td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td><td>${parseFloat(item.total).toLocaleString()} ${lang.currency}</td>`;
        } else if (key === 'children') {
            cells = `<td>${item.father}</td><td>${item.mother}</td><td>${item.child}</td><td>${item.gender === 'ذكر' ? lang.lbl_male : lang.lbl_female}</td><td>${item.dob}</td><td>${item.arrival}</td><td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>`;
        } else if (key === 'marriage') {
            cells = `<td>${item.husband}</td><td>${item.wife}</td><td>${item.gender === 'ذكر' ? lang.lbl_male : lang.lbl_female}</td><td>${item.date}</td><td>${item.arrival}</td><td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>`;
        } else if (key === 'fines') {
            cells = `<td>${item.book_type}</td><td>${item.holder}</td><td>${item.book_number}</td><td>${parseFloat(item.total).toLocaleString()} ${lang.currency}</td><td>${item.date}</td><td>${item.location}</td>`;
        }
        return `<tr>${cells}</tr>`;
    }).join('');

    // Total row
    let totalAmt = 0;
    if (key === 'receipts') totalAmt = data.reduce((s,i) => s+(parseFloat(i.amount)||0),0);
    else if (key === 'delegations') totalAmt = data.reduce((s,i) => s+(parseFloat(i.total)||0),0);
    else if (key === 'children') totalAmt = data.reduce((s,i) => s+(parseFloat(i.amount)||0),0);
    else if (key === 'marriage') totalAmt = data.reduce((s,i) => s+(parseFloat(i.amount)||0),0);
    else if (key === 'fines') totalAmt = data.reduce((s,i) => s+(parseFloat(i.total)||0),0);

    const sigNames = getSignatureNames();
    const colCount = (key==='receipts'||key==='delegations'||key==='children') ? 7 : (key==='marriage' ? 6 : 6);
    const totalRow = `<tr class="total-row"><td colspan="${colCount-1}" style="text-align:left;">${lang.st_total_amounts || lang.lbl_total}</td><td><strong>${totalAmt.toLocaleString()} ${lang.currency}</strong></td></tr>`;

    return `
        <div class="bulk-section" style="page-break-after:always;">
            <div class="bs-header">
                <div class="bs-right">
                    <p>${lang.gov_name}</p>
                    <p>${lang.ministry}</p>
                    <p style="font-weight:700;">${lang.dept_name}</p>
                    <p style="color:#0D8ABC;">${lang.audit_dept}</p>
                </div>
                <div class="bs-center">
                    <img src="logo.png" style="width:70px;height:70px;object-fit:contain;">
                    <h2>${sectionTitles[key]}</h2>
                </div>
                <div class="bs-left">
                    <p><strong>${lang.lbl_date_print}</strong> ${new Date().toLocaleDateString(currentLang==='ar'?'ar-IQ':'ku-IQ')}</p>
                    <p><strong>${lang.records_count}:</strong> ${data.length}</p>
                </div>
            </div>
            <div class="bs-divider"></div>
            <table class="bs-table">
                <thead><tr>${headers[key]}</tr></thead>
                <tbody>${bodyRows}${totalRow}</tbody>
            </table>
            <div class="bs-divider" style="margin-top:25px;"></div>
            <div class="bs-signatures">
                <div class="bs-sig"><p style="font-weight:700">${lang.sig_clerk}</p><p>${lang.lbl_name_only}: ${formatSignatureValue(sigNames.clerk)}</p></div>
                <div class="bs-sig"><p style="font-weight:700">${lang.sig_officer}</p><p>${lang.lbl_name_only}: ${formatSignatureValue(sigNames.officer)}</p></div>
                <div class="bs-sig"><p style="font-weight:700">${lang.sig_director}</p><p>${lang.lbl_rank_name}: ${formatSignatureValue(sigNames.director)}</p></div>
            </div>
        </div>
    `;
}

function executeBulkPrint() {
    const lang = translations[currentLang];
    const selected = [
        document.getElementById('bp-receipts')?.checked    ? 'receipts'    : null,
        document.getElementById('bp-delegations')?.checked ? 'delegations' : null,
        document.getElementById('bp-children')?.checked    ? 'children'    : null,
        document.getElementById('bp-marriage')?.checked    ? 'marriage'    : null,
        document.getElementById('bp-fines')?.checked       ? 'fines'       : null
    ].filter(Boolean);

    if (!selected.length) {
        showToast(lang.err_select_section);
        return;
    }

    let content = selected.map(k => buildSectionHTML(k, lang)).filter(Boolean).join('');

    if (!content) {
        showToast(lang.err_no_data_sections);
        return;
    }

    const win = window.open('', '_blank', 'width=1000,height=800');
    win.document.write(`
        <!DOCTYPE html>
        <html lang="${currentLang}" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>${lang.bulk_print}</title>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@100..900&display=swap" rel="stylesheet">
            <style>
                * { margin:0; padding:0; box-sizing:border-box; font-family:'Noto Kufi Arabic',sans-serif; }
                body { background:#fff; color:#1a1a2e; direction:rtl; }
                .bulk-section { padding:22px 30px; display:flex; flex-direction:column; }
                .bs-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:8px; }
                .bs-right, .bs-left { flex:1; font-size:11px; line-height:1.9; }
                .bs-left { text-align:left; }
                .bs-center { flex:0 0 150px; text-align:center; }
                .bs-center h2 { font-size:14px; font-weight:800; margin-top:5px; }
                .bs-divider { height:2px; background:linear-gradient(90deg,#0D8ABC,#F59E0B); border-radius:5px; margin:8px 0; }
                .bs-table { width:100%; border-collapse:collapse; margin-top:6px; font-size:10px; }
                .bs-table th { background:#f0f7fc; text-align:right; padding:6px 8px; border:1px solid #ccd; font-weight:700; }
                .bs-table td { padding:5px 8px; border:1px solid #ccd; }
                .bs-table tr:nth-child(even) td { background:#f9f9f9; }
                .bs-table tr.total-row td { background:#fff8e1; font-weight:700; color:#b45309; }
                .bs-signatures { display:flex; justify-content:space-between; gap:15px; margin-top:20px; }
                .bs-sig { text-align:center; flex:1; font-size:10px; }
                .bs-sig p:first-child { margin-bottom:22px; }
                .bs-line { border-top:1px solid #333; padding-top:3px; margin-bottom:3px; }
                @media print {
                    @page { margin:1.2cm; size:A4 landscape; }
                    .bulk-section { min-height:calc(100vh - 2.4cm); page-break-after:always; }
                    .bs-signatures { margin-top:auto; padding-top:10px; border-top:1px solid #333; }
                }
            </style>
        </head>
        <body>${content}</body>
        <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
        </html>
    `);
    win.document.close();
    closeAllModals();
}

// ===== PRINT A SINGLE SECTION USING BULK-LIKE LAYOUT =====
function printSection(key) {
    const lang = translations[currentLang];
    if (key === 'stats') {
        const receipts    = JSON.parse(localStorage.getItem('receipts')    || '[]');
        const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
        const children    = JSON.parse(localStorage.getItem('children')    || '[]');
        const marriage    = JSON.parse(localStorage.getItem('marriage')    || '[]');
        const fines       = JSON.parse(localStorage.getItem('fines')       || '[]');

        const totalRecords = receipts.length + delegations.length + children.length + marriage.length + fines.length;
        const totalAmounts = (receipts.reduce((s,i)=>s+(parseFloat(i.amount)||0),0)) +
                             (delegations.reduce((s,i)=>s+(parseFloat(i.total)||0),0)) +
                             (children.reduce((s,i)=>s+(parseFloat(i.amount)||0),0)) +
                             (marriage.reduce((s,i)=>s+(parseFloat(i.amount)||0),0)) +
                             (fines.reduce((s,i)=>s+(parseFloat(i.total)||0),0));

        const receiptsTotal = receipts.reduce((s,i)=>s+(parseFloat(i.amount)||0),0);
        const delegationsTotal = delegations.reduce((s,i)=>s+(parseFloat(i.total)||0),0);
        const childrenTotal = children.reduce((s,i)=>s+(parseFloat(i.amount)||0),0);
        const marriageTotal = marriage.reduce((s,i)=>s+(parseFloat(i.amount)||0),0);
        const finesTotal = fines.reduce((s,i)=>s+(parseFloat(i.total)||0),0);

        const sigNames = getSignatureNames();
        // Build monthly breakdown rows
        const breakdown = getMonthlyBreakdown();
        let archiveRows = '';
        let hasArchiveData = false;
        for (let m = 1; m <= 12; m++) {
            if (breakdown[m].recordsCount > 0) {
                hasArchiveData = true;
                archiveRows += `
                    <tr>
                        <td style="font-weight:bold; color:#0D8ABC;">${lang['m' + m]}</td>
                        <td>${breakdown[m].recordsCount}</td>
                        <td style="font-weight:bold;">${breakdown[m].amount.toLocaleString()} ${lang.currency}</td>
                    </tr>
                `;
            }
        }

        const archiveTableHTML = hasArchiveData ? `
            <h3 style="font-size:13px; margin-top:25px; color:#0D8ABC; font-weight:700; margin-bottom:8px; border-bottom:1px solid #ddd; padding-bottom:4px;">
                ${lang.monthly_archive}
            </h3>
            <table class="bs-table" style="margin-top:8px;">
                <thead>
                    <tr>
                        <th>${lang.th_month}</th>
                        <th>${lang.ov_total_records || 'عدد السجلات'}</th>
                        <th>${lang.st_total_amounts || 'إجمالي المبالغ'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${archiveRows}
                </tbody>
            </table>
        ` : '';

        const content = `
            <div class="bulk-section">
                <div class="bs-header">
                    <div class="bs-right">
                        <p>${lang.gov_name}</p>
                        <p>${lang.ministry}</p>
                        <p style="font-weight:700;">${lang.dept_name}</p>
                        <p style="color:#0D8ABC;">${lang.audit_dept}</p>
                    </div>
                    <div class="bs-center">
                        <img src="logo.png" style="width:75px;height:75px;object-fit:contain;">
                        <h2 style="font-size:16px; font-weight:800; margin-top:5px;">${lang.stats}</h2>
                    </div>
                    <div class="bs-left">
                        <p><strong>${lang.lbl_date_print}</strong> ${new Date().toLocaleDateString(currentLang==='ar'?'ar-IQ':'ku-IQ')}</p>
                    </div>
                </div>
                <div class="bs-divider"></div>
                
                <h3 style="font-size:13px; margin-top:15px; color:#0D8ABC; font-weight:700; margin-bottom:8px; border-bottom:1px solid #ddd; padding-bottom:4px;">
                    ${currentLang === 'ar' ? 'الإحصائيات الشاملة للأقسام' : 'ئامارێن گشتى یێن پشکان'}
                </h3>
                <table class="bs-table" style="margin-top:8px; margin-bottom:20px;">
                    <thead>
                        <tr>
                            <th>${currentLang === 'ar' ? 'القسم' : 'پشك'}</th>
                            <th>${lang.ov_total_records || 'عدد السجلات'}</th>
                            <th>${lang.st_total_amounts || 'إجمالي المبالغ'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>${lang.receipts}</strong></td>
                            <td>${receipts.length}</td>
                            <td><strong>${receiptsTotal.toLocaleString()} ${lang.currency}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>${lang.delegations}</strong></td>
                            <td>${delegations.length}</td>
                            <td><strong>${delegationsTotal.toLocaleString()} ${lang.currency}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>${lang.children}</strong></td>
                            <td>${children.length}</td>
                            <td><strong>${childrenTotal.toLocaleString()} ${lang.currency}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>${lang.marriage}</strong></td>
                            <td>${marriage.length}</td>
                            <td><strong>${marriageTotal.toLocaleString()} ${lang.currency}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>${lang.fines}</strong></td>
                            <td>${fines.length}</td>
                            <td><strong>${finesTotal.toLocaleString()} ${lang.currency}</strong></td>
                        </tr>
                        <tr class="total-row" style="background:#fff8e1; font-weight:700; color:#b45309;">
                            <td><strong>${currentLang === 'ar' ? 'المجموع الكلي' : 'كۆما گشتی'}</strong></td>
                            <td><strong>${totalRecords}</strong></td>
                            <td><strong>${totalAmounts.toLocaleString()} ${lang.currency}</strong></td>
                        </tr>
                    </tbody>
                </table>
                
                ${archiveTableHTML}
                
                <div class="bs-signatures" style="margin-top:auto; padding-top:10px; border-top:1px solid #333;">
                    <div class="bs-sig"><p style="font-weight:700">${lang.sig_clerk}</p><p>${lang.lbl_name_only}: ${formatSignatureValue(sigNames.clerk)}</p></div>
                    <div class="bs-sig"><p style="font-weight:700">${lang.sig_officer}</p><p>${lang.lbl_name_only}: ${formatSignatureValue(sigNames.officer)}</p></div>
                    <div class="bs-sig"><p style="font-weight:700">${lang.sig_director}</p><p>${lang.lbl_rank_name}: ${formatSignatureValue(sigNames.director)}</p></div>
                </div>
            </div>
        `;
        const win = window.open('', '_blank', 'width=1000,height=800');
        win.document.write(buildPrintPage(content, lang, lang.stats));
        win.document.close();
        return;
    }

    const content = buildSectionHTML(key, translations[currentLang]);
    if (!content) { showToast(currentLang === 'ar' ? 'لا توجد بيانات للطباعة' : 'داتا بۆ چاپ کرن نییە'); return; }
    const sectionTitlesForPrint = {
        receipts: translations[currentLang].print_section_receipt,
        delegations: translations[currentLang].print_section_delegation,
        children: translations[currentLang].print_section_children,
        marriage: translations[currentLang].print_section_marriage,
        fines: translations[currentLang].print_section_fines
    };
    const win = window.open('', '_blank', 'width=1000,height=800');
    win.document.write(`
        <!DOCTYPE html>
        <html lang="${currentLang}" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>${sectionTitlesForPrint[key] || translations[currentLang].print}</title>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@100..900&display=swap" rel="stylesheet">
            <style>
                * { margin:0; padding:0; box-sizing:border-box; font-family:'Noto Kufi Arabic',sans-serif; }
                body { background:#fff; color:#1a1a2e; direction:rtl; }
                .bulk-section { padding:22px 30px; display:flex; flex-direction:column; }
                .bs-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:8px; }
                .bs-right, .bs-left { flex:1; font-size:11px; line-height:1.9; }
                .bs-left { text-align:left; }
                .bs-center { flex:0 0 150px; text-align:center; }
                .bs-center h2 { font-size:14px; font-weight:800; margin-top:5px; }
                .bs-divider { height:2px; background:linear-gradient(90deg,#0D8ABC,#F59E0B); border-radius:5px; margin:8px 0; }
                .bs-table { width:100%; border-collapse:collapse; margin-top:6px; font-size:11px; }
                .bs-table th { background:#f0f7fc; text-align:right; padding:8px 10px; border:1px solid #ccd; font-weight:700; }
                .bs-table td { padding:6px 10px; border:1px solid #ccd; }
                .bs-table tr.total-row td { background:#fff8e1; font-weight:700; color:#b45309; }
                .bs-signatures { display:flex; justify-content:space-between; gap:15px; margin-top:20px; }
                .bs-sig { text-align:center; flex:1; font-size:10px; }
                .bs-line { border-top:1px solid #333; padding-top:3px; margin-bottom:3px; }
                @media print {
                    @page { margin:1.2cm; size:A4 portrait; }
                    .bulk-section { min-height:calc(100vh - 2.4cm); }
                    .bs-signatures { margin-top:auto; padding-top:10px; border-top:1px solid #333; }
                }
            </style>
        </head>
        <body>${content}</body>
        <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
        </html>
    `);
    win.document.close();
}

function buildPrintPage(content, lang, title) {
    return `<!DOCTYPE html>
        <html lang="${currentLang}" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@100..900&display=swap" rel="stylesheet">
            <style>
                * { margin:0; padding:0; box-sizing:border-box; font-family:'Noto Kufi Arabic',sans-serif; }
                body { background:#fff; color:#1a1a2e; direction:rtl; }
                .bulk-section { padding:22px 30px; display:flex; flex-direction:column; }
                .bs-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:8px; }
                .bs-right, .bs-left { flex:1; font-size:11px; line-height:1.9; }
                .bs-left { text-align:left; }
                .bs-center { flex:0 0 150px; text-align:center; }
                .bs-center h2 { font-size:14px; font-weight:800; margin-top:5px; }
                .bs-divider { height:2px; background:linear-gradient(90deg,#0D8ABC,#F59E0B); border-radius:5px; margin:8px 0; }
                .stat-item { background:#f5f9fc; border:1px solid #cde; padding:8px 12px; border-radius:6px; text-align:center; flex:1 1 120px; min-width:100px; display:inline-block; margin:5px; }
                .stat-item h4 { font-size:9px; color:#555; margin-bottom:4px; }
                .stat-value { font-size:13px; font-weight:700; color:#0d8abc; }
                .glass-panel { background:#fff; border:1px solid #ccd; border-radius:8px; padding:10px 14px; margin-bottom:10px; }
                .glass-panel h4 { font-size:11px; color:#1a1a2e; border-bottom:1px solid #eee; padding-bottom:4px; margin-bottom:6px; }
                .glass-panel p { font-size:10px; line-height:1.6; color:#333; }
                .data-table { width:100%; border-collapse:collapse; margin-top:10px; font-size:10px; }
                .data-table th { background:#f0f7fc; text-align:right; padding:6px 8px; border:1px solid #ccd; font-weight:700; }
                .data-table td { padding:5px 8px; border:1px solid #ccd; text-align:right; }
                .bs-table { width:100%; border-collapse:collapse; margin-top:10px; font-size:11px; }
                .bs-table th { background:#f0f7fc; text-align:center; padding:8px 10px; border:1px solid #ccd; font-weight:700; }
                .bs-table td { padding:8px 10px; border:1px solid #ccd; text-align:center; }
                .bs-table tr.total-row td { background:#fff8e1; font-weight:700; color:#b45309; }
                .bs-signatures { display:flex; justify-content:space-between; gap:15px; margin-top:20px; }
                .bs-sig { text-align:center; flex:1; font-size:10px; }
                .bs-line { border-top:1px solid #333; padding-top:3px; margin-bottom:3px; }
                .no-print { display:none !important; }
                @media print {
                    @page { margin:1.2cm; size:A4 portrait; }
                    .bulk-section { min-height:calc(100vh - 2.4cm); }
                    .bs-signatures { margin-top:auto; padding-top:10px; border-top:1px solid #333; }
                }
            </style>
        </head>
        <body>${content}</body>
        <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
        </html>`;
}

// ===== MONTHLY ARCHIVE SYSTEM =====
function getMonthlyBreakdown() {
    const receipts    = JSON.parse(localStorage.getItem('receipts')    || '[]');
    const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
    const children    = JSON.parse(localStorage.getItem('children')    || '[]');
    const marriage    = JSON.parse(localStorage.getItem('marriage')    || '[]');
    const fines       = JSON.parse(localStorage.getItem('fines')       || '[]');

    const monthlyData = {};
    for (let m = 1; m <= 12; m++) {
        monthlyData[m] = {
            recordsCount: 0,
            amount: 0,
            receipts: 0,
            delegations: 0,
            children: 0,
            marriage: 0,
            fines: 0
        };
    }

    const monthMap = {
        'كانون الثاني': 1, 'شباط': 2, 'آذار': 3, 'نيسان': 4,
        'أيار': 5, 'حزيران': 6, 'تموز': 7, 'آب': 8,
        'أيلول': 9, 'تشرين الأول': 10, 'تشرين الثاني': 11, 'كانون الأول': 12
    };

    const getMonthFromDate = (dateStr) => {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length >= 2) return parseInt(parts[1], 10);
        return null;
    };

    receipts.forEach(item => {
        const m = getMonthFromDate(item.date);
        if (m >= 1 && m <= 12) {
            monthlyData[m].recordsCount++;
            monthlyData[m].amount += (parseFloat(item.amount) || 0);
            monthlyData[m].receipts++;
        }
    });

    delegations.forEach(item => {
        const m = monthMap[item.month];
        if (m >= 1 && m <= 12) {
            monthlyData[m].recordsCount++;
            monthlyData[m].amount += (parseFloat(item.total) || 0);
            monthlyData[m].delegations++;
        }
    });

    children.forEach(item => {
        const m = getMonthFromDate(item.arrival);
        if (m >= 1 && m <= 12) {
            monthlyData[m].recordsCount++;
            monthlyData[m].amount += (parseFloat(item.amount) || 0);
            monthlyData[m].children++;
        }
    });

    marriage.forEach(item => {
        const m = getMonthFromDate(item.arrival);
        if (m >= 1 && m <= 12) {
            monthlyData[m].recordsCount++;
            monthlyData[m].amount += (parseFloat(item.amount) || 0);
            monthlyData[m].marriage++;
        }
    });

    fines.forEach(item => {
        const m = getMonthFromDate(item.date);
        if (m >= 1 && m <= 12) {
            monthlyData[m].recordsCount++;
            monthlyData[m].amount += (parseFloat(item.total) || 0);
            monthlyData[m].fines++;
        }
    });

    return monthlyData;
}

function showMonthArchiveDetails(m) {
    const breakdown = getMonthlyBreakdown();
    const data = breakdown[m];
    const lang = translations[currentLang];
    const monthName = lang['m' + m];

    const titleEl = document.getElementById('month-details-title');
    if (titleEl) titleEl.textContent = `${lang.monthly_archive} - ${monthName}`;

    const contentEl = document.getElementById('month-details-content');
    if (contentEl) {
        contentEl.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div class="overview-subtitle" style="font-weight:700; font-size:16px; margin-bottom:10px; border-bottom:1px solid var(--surface-border); padding-bottom:8px;">
                    ${monthName}
                </div>
                <div class="ov-stat-row" style="display:flex; justify-content:space-between; font-size:14px; padding:8px 12px; background:rgba(255,255,255,0.03); border-radius:8px;">
                    <span>${lang.ov_total_records}</span>
                    <span style="font-weight:700; color:var(--primary-light);">${data.recordsCount}</span>
                </div>
                <div class="ov-stat-row" style="display:flex; justify-content:space-between; font-size:14px; padding:8px 12px; background:rgba(255,255,255,0.03); border-radius:8px;">
                    <span>${lang.st_total_amounts}</span>
                    <span style="font-weight:700; color:var(--success);">${data.amount.toLocaleString()} ${lang.currency}</span>
                </div>
                <div style="margin-top:10px;">
                    <h4 style="font-size:13px; color:var(--text-muted); margin-bottom:8px;">${currentLang === 'ar' ? 'التفاصيل حسب الأقسام:' : 'کورتیا پشکان:'}</h4>
                    <div style="display:grid; grid-template-columns:1fr; gap:8px;">
                        <div style="display:flex; justify-content:space-between; font-size:12px; padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span>${lang.receipts}</span>
                            <span>${data.receipts} (${currentLang === 'ar' ? 'سجل' : 'تۆمار'})</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span>${lang.delegations}</span>
                            <span>${data.delegations} (${currentLang === 'ar' ? 'سجل' : 'تۆمار'})</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span>${lang.children}</span>
                            <span>${data.children} (${currentLang === 'ar' ? 'سجل' : 'تۆمار'})</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span>${lang.marriage}</span>
                            <span>${data.marriage} (${currentLang === 'ar' ? 'سجل' : 'تۆمار'})</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span>${lang.fines}</span>
                            <span>${data.fines} (${currentLang === 'ar' ? 'سجل' : 'تۆمار'})</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    openModal('month-details-modal');
}

// ===== STATISTICS RENDERING =====
function renderStats() {
    const receipts    = JSON.parse(localStorage.getItem('receipts')    || '[]');
    const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
    const children    = JSON.parse(localStorage.getItem('children')    || '[]');
    const marriage    = JSON.parse(localStorage.getItem('marriage')    || '[]');
    const fines       = JSON.parse(localStorage.getItem('fines')       || '[]');

    const totalRecords = receipts.length + delegations.length + children.length + marriage.length + fines.length;
    const totalAmounts = (receipts.reduce((s,i)=>s+(parseFloat(i.amount)||0),0)) +
                         (delegations.reduce((s,i)=>s+(parseFloat(i.total)||0),0)) +
                         (children.reduce((s,i)=>s+(parseFloat(i.amount)||0),0)) +
                         (marriage.reduce((s,i)=>s+(parseFloat(i.amount)||0),0)) +
                         (fines.reduce((s,i)=>s+(parseFloat(i.total)||0),0));

    const lang = translations[currentLang];
    const contentDiv = document.getElementById('stats-content');
    const panelsDiv = document.getElementById('stats-panels');
    if (!contentDiv || !panelsDiv) return;

    contentDiv.innerHTML = `
        <div style="display:flex; gap:12px; flex-wrap:wrap; padding:10px;">
            <div class="stat-item"><h4>${lang.ov_total_records}</h4><div class="stat-value">${totalRecords}</div></div>
            <div class="stat-item"><h4>${lang.st_total_amounts}</h4><div class="stat-value">${totalAmounts.toLocaleString()} ${lang.currency}</div></div>
            <div class="stat-item"><h4>${lang.receipts}</h4><div class="stat-value">${receipts.length}</div></div>
            <div class="stat-item"><h4>${lang.delegations}</h4><div class="stat-value">${delegations.length}</div></div>
            <div class="stat-item"><h4>${lang.children}</h4><div class="stat-value">${children.length}</div></div>
            <div class="stat-item"><h4>${lang.marriage}</h4><div class="stat-value">${marriage.length}</div></div>
            <div class="stat-item"><h4>${lang.fines}</h4><div class="stat-value">${fines.length}</div></div>
        </div>
    `;

    // Panels: breakdowns for each section
    const receiptsTotal = receipts.reduce((s,i)=>s+(parseFloat(i.amount)||0),0);
    const delegationsTotal = delegations.reduce((s,i)=>s+(parseFloat(i.total)||0),0);
    const childrenTotal = children.reduce((s,i)=>s+(parseFloat(i.amount)||0),0);
    const marriageTotal = marriage.reduce((s,i)=>s+(parseFloat(i.amount)||0),0);
    const finesTotal = fines.reduce((s,i)=>s+(parseFloat(i.total)||0),0);

    panelsDiv.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px;">
            <div class="glass-panel" style="padding:14px;"><h4>${lang.receipts}</h4><p>${lang.lbl_records}: ${receipts.length}</p><p>${lang.lbl_total_sum}: ${receiptsTotal.toLocaleString()} ${lang.currency}</p></div>
            <div class="glass-panel" style="padding:14px;"><h4>${lang.delegations}</h4><p>${lang.lbl_records}: ${delegations.length}</p><p>${lang.lbl_total_sum}: ${delegationsTotal.toLocaleString()} ${lang.currency}</p></div>
            <div class="glass-panel" style="padding:14px;"><h4>${lang.children}</h4><p>${lang.lbl_records}: ${children.length}</p><p>${lang.lbl_total_sum}: ${childrenTotal.toLocaleString()} ${lang.currency}</p></div>
            <div class="glass-panel" style="padding:14px;"><h4>${lang.marriage}</h4><p>${lang.lbl_records}: ${marriage.length}</p><p>${lang.lbl_total_sum}: ${marriageTotal.toLocaleString()} ${lang.currency}</p></div>
            <div class="glass-panel" style="padding:14px;"><h4>${lang.fines}</h4><p>${lang.lbl_records}: ${fines.length}</p><p>${lang.lbl_total_sum}: ${finesTotal.toLocaleString()} ${lang.currency}</p></div>
        </div>
    `;

    // Render Monthly Archive Table Rows
    const archiveTbody = document.getElementById('archive-table-body');
    if (archiveTbody) {
        const breakdown = getMonthlyBreakdown();
        // Filter out months that have no data
        const activeMonths = [];
        for (let m = 1; m <= 12; m++) {
            if (breakdown[m].recordsCount > 0) {
                activeMonths.push(m);
            }
        }

        if (activeMonths.length === 0) {
            archiveTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 15px;">${lang.empty_data}</td></tr>`;
        } else {
            archiveTbody.innerHTML = '';
            activeMonths.forEach(m => {
                const data = breakdown[m];
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight:bold; color:var(--primary-light);">${lang['m' + m]}</td>
                    <td><span class="badge bg-secondary">${data.recordsCount}</span></td>
                    <td style="font-weight:bold; color:var(--success);">${data.amount.toLocaleString()} ${lang.currency}</td>
                    <td class="no-print">
                        <button class="btn-icon-sm" onclick="showMonthArchiveDetails(${m})" title="${lang.view_details}">
                            <i class="fa-solid fa-circle-info"></i>
                        </button>
                    </td>
                `;
                archiveTbody.appendChild(tr);
            });
        }
    }
}

// Ensure stats are available on load (but don't force display)
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('stats-content')) renderStats();
    renderPrintSignatureNames();
});

// Enable Enter key on search input to trigger search
document.addEventListener('DOMContentLoaded', () => {
    const si = document.getElementById('section-search');
    if (si) {
        si.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); performSearch(); }
        });
    }
});

// ===== BACKUP & RESTORE MODULE =====
let pendingBackupData = null;

function openBackupModal() {
    // Reset to default view
    const defaultView = document.getElementById('backup-default-view');
    const confirmView = document.getElementById('backup-confirm-view');
    if (defaultView) defaultView.style.display = 'block';
    if (confirmView) confirmView.style.display = 'none';
    
    // Clear file input
    const fileInput = document.getElementById('backup-file-input');
    if (fileInput) fileInput.value = '';
    
    // Reset label text
    const uploadText = document.getElementById('backup-upload-text');
    if (uploadText) uploadText.textContent = translations[currentLang].import_btn;
    
    openModal('backup-modal');
}

function exportData() {
    const backup = {
        backup_version: 1,
        timestamp: new Date().toISOString(),
        receipts: JSON.parse(localStorage.getItem('receipts') || '[]'),
        delegations: JSON.parse(localStorage.getItem('delegations') || '[]'),
        children: JSON.parse(localStorage.getItem('children') || '[]'),
        marriage: JSON.parse(localStorage.getItem('marriage') || '[]'),
        fines: JSON.parse(localStorage.getItem('fines') || '[]'),
        sig_director_name: localStorage.getItem('sig_director_name') || '',
        sig_clerk_name: localStorage.getItem('sig_clerk_name') || '',
        sig_officer_name: localStorage.getItem('sig_officer_name') || '',
        appLang: localStorage.getItem('appLang') || 'ku'
    };
    
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    
    downloadAnchor.href = url;
    downloadAnchor.download = `traffic_audit_backup_${dateStr}_${timeStr}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(downloadAnchor);
        URL.revokeObjectURL(url);
        showToast(translations[currentLang].success_save);
    }, 100);
}

function handleBackupFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validation: check for expected tables or configurations
            const hasRequiredKeys = Array.isArray(data.receipts) || 
                                    Array.isArray(data.delegations) || 
                                    Array.isArray(data.children) || 
                                    Array.isArray(data.marriage) || 
                                    Array.isArray(data.fines);
                                    
            if (!hasRequiredKeys) {
                showToast(translations[currentLang].invalid_file_error);
                return;
            }
            
            pendingBackupData = data;
            
            // Switch to confirmation view and show summary
            const defaultView = document.getElementById('backup-default-view');
            const confirmView = document.getElementById('backup-confirm-view');
            const summaryBox = document.getElementById('backup-summary-box');
            
            if (defaultView && confirmView && summaryBox) {
                defaultView.style.display = 'none';
                confirmView.style.display = 'flex';
                
                const lang = translations[currentLang];
                
                const receiptsCount = data.receipts ? data.receipts.length : 0;
                const delegationsCount = data.delegations ? data.delegations.length : 0;
                const childrenCount = data.children ? data.children.length : 0;
                const marriageCount = data.marriage ? data.marriage.length : 0;
                const finesCount = data.fines ? data.fines.length : 0;
                
                summaryBox.innerHTML = `
                    <div style="display:flex; justify-content:space-between; direction: rtl;"><span>${lang.receipts}:</span> <strong>${receiptsCount}</strong></div>
                    <div style="display:flex; justify-content:space-between; direction: rtl;"><span>${lang.delegations}:</span> <strong>${delegationsCount}</strong></div>
                    <div style="display:flex; justify-content:space-between; direction: rtl;"><span>${lang.children}:</span> <strong>${childrenCount}</strong></div>
                    <div style="display:flex; justify-content:space-between; direction: rtl;"><span>${lang.marriage}:</span> <strong>${marriageCount}</strong></div>
                    <div style="display:flex; justify-content:space-between; direction: rtl;"><span>${lang.fines}:</span> <strong>${finesCount}</strong></div>
                `;
            }
            
        } catch (err) {
            console.error(err);
            showToast(translations[currentLang].invalid_file_error);
        }
    };
    reader.readAsText(file);
}

function cancelRestore() {
    pendingBackupData = null;
    const defaultView = document.getElementById('backup-default-view');
    const confirmView = document.getElementById('backup-confirm-view');
    if (defaultView) defaultView.style.display = 'block';
    if (confirmView) confirmView.style.display = 'none';
    
    // Clear input
    const fileInput = document.getElementById('backup-file-input');
    if (fileInput) fileInput.value = '';
}

function confirmRestore() {
    if (!pendingBackupData) return;
    
    try {
        const data = pendingBackupData;
        
        // Restore all keys to localStorage if they exist in the backup file
        if (Array.isArray(data.receipts)) localStorage.setItem('receipts', JSON.stringify(data.receipts));
        if (Array.isArray(data.delegations)) localStorage.setItem('delegations', JSON.stringify(data.delegations));
        if (Array.isArray(data.children)) localStorage.setItem('children', JSON.stringify(data.children));
        if (Array.isArray(data.marriage)) localStorage.setItem('marriage', JSON.stringify(data.marriage));
        if (Array.isArray(data.fines)) localStorage.setItem('fines', JSON.stringify(data.fines));
        
        if (data.sig_director_name !== undefined) localStorage.setItem('sig_director_name', data.sig_director_name);
        if (data.sig_clerk_name !== undefined) localStorage.setItem('sig_clerk_name', data.sig_clerk_name);
        if (data.sig_officer_name !== undefined) localStorage.setItem('sig_officer_name', data.sig_officer_name);
        if (data.appLang !== undefined) localStorage.setItem('appLang', data.appLang);
        
        // Reset state
        pendingBackupData = null;
        closeAllModals();
        
        // Refresh app state
        currentLang = localStorage.getItem('appLang') || 'ku';
        applyLanguage();
        initData();
        updateOverviewCards();
        renderPrintSignatureNames();
        
        // If on stats section, update stats
        const statsSec = document.getElementById('stats-section');
        if (statsSec && statsSec.classList.contains('active')) {
            renderStats();
        }
        
        showToast(translations[currentLang].import_success);
    } catch (err) {
        console.error(err);
        showToast(translations[currentLang].invalid_file_error);
    }
}
