// ===== DATABASE / CACHE STORE (IndexedDB with LocalStorage Fallback) =====
const dbStore = {
    _cache: {},
    _db: null,

    // Pre-populate cache synchronously from localStorage to prevent timing issues during startup
    initSync() {
        const keys = ['receipts', 'delegations', 'children', 'marriage', 'fines', 'sig_director_name', 'sig_clerk_name', 'sig_officer_name', 'appLang'];
        keys.forEach(k => {
            try {
                this._cache[k] = localStorage.getItem(k);
            } catch (e) {
                console.error("Error reading localStorage on initSync:", e);
            }
        });
    },

    async init() {
        this.initSync();
        return new Promise((resolve) => {
            if (!window.indexedDB) {
                console.warn("IndexedDB not supported, using localStorage fallback.");
                resolve();
                return;
            }

            const request = indexedDB.open('TrafficAuditDB', 1);

            request.onerror = (e) => {
                console.error("IndexedDB error:", e);
                resolve(); // Fallback to memory/localStorage cache
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('store')) {
                    db.createObjectStore('store');
                }
            };

            request.onsuccess = (e) => {
                this._db = e.target.result;
                const tx = this._db.transaction('store', 'readonly');
                const store = tx.objectStore('store');
                const keys = ['receipts', 'delegations', 'children', 'marriage', 'fines', 'sig_director_name', 'sig_clerk_name', 'sig_officer_name', 'appLang'];

                let loadedCount = 0;
                let fallbackUsed = false;

                keys.forEach(k => {
                    const req = store.get(k);
                    req.onsuccess = () => {
                        let val = req.result;
                        if (val === undefined) {
                            // If IndexedDB is empty for this key, migrate existing localStorage data
                            try {
                                val = localStorage.getItem(k);
                            } catch (err) {
                                val = null;
                            }
                            if (val !== null) {
                                fallbackUsed = true;
                                this._setIndexedDB(k, val);
                            }
                        }
                        if (val !== null && val !== undefined) {
                            this._cache[k] = val;
                        }
                        loadedCount++;
                        if (loadedCount === keys.length) {
                            if (fallbackUsed) {
                                console.log("Successfully migrated data from localStorage to IndexedDB.");
                            }
                            resolve();
                        }
                    };
                    req.onerror = () => {
                        loadedCount++;
                        if (loadedCount === keys.length) {
                            resolve();
                        }
                    };
                });
            };
        });
    },

    getItem(key) {
        return this._cache[key] !== undefined && this._cache[key] !== null ? this._cache[key] : null;
    },

    setItem(key, value) {
        const valStr = String(value);
        this._cache[key] = valStr;

        // Persist to IndexedDB
        this._setIndexedDB(key, valStr);

        // Also sync to localStorage for settings (small footprint) as additional fallback
        const settingsKeys = ['sig_director_name', 'sig_clerk_name', 'sig_officer_name', 'appLang'];
        if (settingsKeys.includes(key)) {
            try {
                localStorage.setItem(key, valStr);
            } catch (e) {
                // ignore
            }
        }
    },

    removeItem(key) {
        delete this._cache[key];
        this._deleteIndexedDB(key);
        try {
            localStorage.removeItem(key);
        } catch (e) {
            // ignore
        }
    },

    _setIndexedDB(key, value) {
        if (!this._db) {
            // If DB is not ready yet, try to write directly
            const request = indexedDB.open('TrafficAuditDB', 1);
            request.onsuccess = (e) => {
                const db = e.target.result;
                try {
                    const tx = db.transaction('store', 'readwrite');
                    tx.objectStore('store').put(value, key);
                } catch (err) {
                    console.error("Deferred IndexedDB write failed:", err);
                }
            };
            return;
        }
        try {
            const tx = this._db.transaction('store', 'readwrite');
            tx.objectStore('store').put(value, key);
        } catch (err) {
            console.error("IndexedDB write failed:", err);
        }
    },

    _deleteIndexedDB(key) {
        if (!this._db) {
            const request = indexedDB.open('TrafficAuditDB', 1);
            request.onsuccess = (e) => {
                const db = e.target.result;
                try {
                    const tx = db.transaction('store', 'readwrite');
                    tx.objectStore('store').delete(key);
                } catch (err) {
                    console.error("Deferred IndexedDB delete failed:", err);
                }
            };
            return;
        }
        try {
            const tx = this._db.transaction('store', 'readwrite');
            tx.objectStore('store').delete(key);
        } catch (err) {
            console.error("IndexedDB delete failed:", err);
        }
    }
};

// Initialize the cache synchronously from localStorage on script load
dbStore.initSync();

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
    }
}

function showHome() {
    const homeCards = document.querySelector('.overview-cards-wrapper');
    if (homeCards) homeCards.style.display = '';

    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
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
        clerk: dbStore.getItem('sig_clerk_name') || '',
        officer: dbStore.getItem('sig_officer_name') || '',
        director: dbStore.getItem('sig_director_name') || ''
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

    dbStore.setItem('sig_director_name', directorInput.value.trim());
    dbStore.setItem('sig_clerk_name', clerkInput.value.trim());
    dbStore.setItem('sig_officer_name', officerInput.value.trim());
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
let currentLang = dbStore.getItem('appLang') || 'ku';

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
        central_receipts: 'الوصولات المركزية',
        decentral_receipts: 'الوصولات اللامركزية',
        special_receipts: 'الوصولات الخاصة',
        delegations: 'الإيفادات',
        children: 'إضافة الأطفال',
        marriage: 'الزواج',
        fines: 'الغرامات',
        stats: 'الإحصائيات',
        back: 'الرجوع',
        print: 'طباعة القسم',
        add_receipt: 'إضافة وصل جديد',
        add_central_receipt: 'إضافة وصل مركزي جديد',
        add_decentral_receipt: 'إضافة وصل لا مركزي جديد',
        add_special_receipt: 'إضافة وصل خاص جديد',
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
        lbl_special: 'خاصه',
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
        st_total_central_receipts: 'إجمالي الوصولات المركزية',
        st_total_decentral_receipts: 'إجمالي الوصولات اللامركزية',
        st_total_special_receipts: 'إجمالي الوصولات الخاصة',
        st_total_amounts: 'إجمالي المبالغ',
        st_central: 'مركزي',
        st_decentral: 'لا مركزي',
        st_special: 'خاصه',
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
        print_section_central_receipt: 'سجل الوصولات المركزية',
        print_section_decentral_receipt: 'سجل الوصولات اللامركزية',
        print_section_special_receipt: 'سجل الوصولات الخاصة',
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
        pl_book_num: 'رقم الدفتر',
        all_months: 'جميع الأشهر',
        export_archive_btn: 'تصدير كأرشيف ويب (HTML)',
        duplicate_warning_title: 'تنبيه: تكرار محتمل',
        duplicate_warning_msg: 'هناك سجل آخر يحتوي على نفس التفاصيل بالفعل. هل تريد حفظ هذا السجل على أي حال؟',
        duplicate_confirm_btn: 'حفظ على أي حال',
        theme_light: 'الوضع الفاتح',
        theme_dark: 'الوضع الداكن'
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
        dept_name: 'ڕێڤه‌به‌ريا هاتن و چوونا زاخۆ',
        audit_system: 'سيسته‌مێ پشكا و ردبينيێ',
        enter_btn: 'چوونه‌ ژوور',
        app_title: 'پشكا وردبينيێ - ڕێڤه‌به‌ريا هاتن و چوونا زاخۆ',
        receipts: 'پسووله‌',
        central_receipts: 'پسوولەیێن ناڤه‌ندی',
        decentral_receipts: 'پسوولەیێن نه‌ ناڤه‌ندی',
        special_receipts: 'پسوولەیێن تایبەت',
        delegations: 'ئیفاد',
        children: 'زارۆك',
        marriage: 'هه‌ڤژينى',
        fines: 'سزا',
        stats: 'ئامار',
        back: 'ڤه‌گه‌ڕيان',
        print: 'چاپكرنا پشكێ',
        add_receipt: 'زێده‌كرنا پسووله‌كا نوی',
        add_central_receipt: 'زێده‌كرنا پسووله‌كا ناڤه‌ندی يا نوی',
        add_decentral_receipt: 'زێده‌كرنا پسووله‌كا نه‌ ناڤه‌ندی يا نوی',
        add_special_receipt: 'زێده‌كرنا پسووله‌كا تایبەت يا نوی',
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
        ov_subtitle: 'ڕێڤه‌به‌ريا هاتن و چوونا زاخۆ - پشكا وردبينيێ',
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
        lbl_special: 'تایبەت',
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
        st_total_central_receipts: 'كۆما پسوولەیێن ناڤه‌ندی',
        st_total_decentral_receipts: 'كۆما پسوولەیێن نه‌ ناڤه‌ندی',
        st_total_special_receipts: 'كۆما پسوولەیێن تایبەت',
        st_total_amounts: 'كۆژمێ گشتی يێ پاره‌ى',
        st_central: 'ناڤه‌ندی',
        st_decentral: 'نه‌ ناڤه‌ندی',
        st_special: 'تایبەت',
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
        bulk_print: 'چاپكرنا گشتی',
        bulk_print_desc: 'پشكێن بخازی چاپ بكی هه‌ڤ ده‌مدا هه‌لبژێره‌:',
        single_print: 'چاپكرنا تاکەكي',
        start_print: 'دەستپێكرنا چاپكرنێ',
        print_now: 'ئێسا چاپ بكه‌',
        print_record: 'چاپكرنا تۆمارێ',
        print_section_receipt: 'تۆمارا پسوولەیان',
        print_section_central_receipt: 'تۆمارا پسوولەیێن ناڤه‌ندی',
        print_section_decentral_receipt: 'تۆمارا پسوولەیێن نه‌ ناڤه‌ندی',
        print_section_special_receipt: 'تۆمارا پسوولەیێن تایبەت',
        print_section_delegation: 'تۆمارا ئیفادان',
        print_section_children: 'تۆمارا زارۆكان',
        print_section_marriage: 'تۆمارا هه‌ڤژينيێ',
        print_section_fines: 'تۆمارا ده‌فته‌رێن سزایان',
        records_count: 'هژمارا تۆماران',
        backup_btn: 'پاراستنا داتایان',
        backup_modal_title: 'ڕێڤه‌برنا پاراستنا داتایان',
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
        pl_book_num: 'هژمارا ده‌فته‌رێ',
        all_months: 'هه‌می هه‌يڤ',
        export_archive_btn: 'هەناردەكرن وەك ئەرشیفەکا وێب (HTML)',
        duplicate_warning_title: 'تنبيه: دووباره‌بوونا پێشبينيكرى',
        duplicate_warning_msg: 'تۆماره‌كا دى ب هه‌مان پێزانينان يا هه‌ى. ئه‌رێ تو دڤێت ڤێ تۆمارێ بپارێزى ب هه‌ر حال؟',
        duplicate_confirm_btn: 'پاراستن ب هه‌ر حال',
        theme_light: 'ڕوون',
        theme_dark: 'تاری'
    }
};

let currentTheme = dbStore.getItem('appTheme') || 'light';

function applyTheme() {
    if (currentTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    if (themeIcon && themeText) {
        if (currentTheme === 'light') {
            themeIcon.className = 'fa-solid fa-moon';
            themeText.setAttribute('data-tr', 'theme_dark');
            themeText.textContent = translations[currentLang].theme_dark || 'داكن';
        } else {
            themeIcon.className = 'fa-solid fa-sun';
            themeText.setAttribute('data-tr', 'theme_light');
            themeText.textContent = translations[currentLang].theme_light || 'فاتح';
        }
    }
}

function toggleTheme() {
    currentTheme = (currentTheme === 'dark') ? 'light' : 'dark';
    dbStore.setItem('appTheme', currentTheme);
    applyTheme();
}

function toggleLanguage() {
    currentLang = (currentLang === 'ar') ? 'ku' : 'ar';
    dbStore.setItem('appLang', currentLang);
    applyLanguage();
    applyTheme(); // Update theme text translation
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

document.addEventListener('DOMContentLoaded', async () => {
    await dbStore.init();
    applyLanguage();
    applyTheme();
    initData();
    updateOverviewCards();
    updateAutocompletes();

    const forms = [
        { id: 'receipts-form', key: 'receipts', renderFunc: renderReceipts },
        { id: 'delegations-form', key: 'delegations', renderFunc: renderDelegations },
        { id: 'children-form', key: 'children', renderFunc: renderChildren },
        { id: 'marriage-form', key: 'marriage', renderFunc: renderMarriage },
        { id: 'fines-form', key: 'fines', renderFunc: renderFines }
    ];

    forms.forEach(formDef => {
        const formEl = document.getElementById(formDef.id);
        if (formEl) {
            formEl.addEventListener('submit', async function (e) {
                e.preventDefault();
                const formData = new FormData(formEl);
                const dataObj = {};
                for (let [key, value] of formData.entries()) {
                    if (value instanceof File && value.name) {
                        if (key === 'receipt_images' || key === 'receipt_image') continue;
                        try {
                            dataObj[key] = await getBase64(value);
                        } catch (err) {
                            console.error(err);
                            showToast(translations[currentLang].err_image);
                            return;
                        }
                    } else if (!(value instanceof File)) {
                        dataObj[key] = value;
                    }
                }

                // Handle multiple receipt images
                if (formDef.key === 'receipts') {
                    const receiptImageInput = document.getElementById('receipt-image');
                    const files = receiptImageInput ? receiptImageInput.files : [];
                    dataObj.receipt_images = [];
                    if (files && files.length > 0) {
                        const filesCount = Math.min(files.length, 10);
                        for (let i = 0; i < filesCount; i++) {
                            try {
                                const base64 = await getBase64(files[i]);
                                dataObj.receipt_images.push(base64);
                            } catch (err) {
                                console.error(err);
                                showToast(translations[currentLang].err_image);
                                return;
                            }
                        }
                    }
                }

                // Check duplicate
                const isDup = checkDuplicate(formDef.key, dataObj);
                if (isDup) {
                    showDuplicateWarningModal(() => {
                        saveRecord(formDef.key, dataObj, formDef.renderFunc, formEl);
                    });
                    return;
                }

                saveRecord(formDef.key, dataObj, formDef.renderFunc, formEl);
            });
        }
    });

    // File change listener for selected images preview
    const receiptImageInput = document.getElementById('receipt-image');
    const selectedPreview = document.getElementById('selected-images-preview');
    if (receiptImageInput && selectedPreview) {
        receiptImageInput.addEventListener('change', async function () {
            selectedPreview.innerHTML = '';
            const filesCount = this.files.length;
            if (filesCount > 0) {
                const countToProcess = Math.min(filesCount, 10);
                if (filesCount > 10) {
                    showToast(currentLang === 'ar' ? 'الحد الأقصى هو 10 صور فقط!' : 'مازنده‌ترین هژمار 10 وێنه‌نه‌!');
                }
                for (let i = 0; i < countToProcess; i++) {
                    const file = this.files[i];
                    try {
                        const base64 = await getBase64(file);
                        const thumb = document.createElement('div');
                        thumb.style.position = 'relative';
                        thumb.style.width = '60px';
                        thumb.style.height = '60px';
                        thumb.style.borderRadius = '6px';
                        thumb.style.overflow = 'hidden';
                        thumb.style.border = '1px solid var(--surface-border)';
                        
                        const img = document.createElement('img');
                        img.src = base64;
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = 'cover';
                        
                        thumb.appendChild(img);
                        selectedPreview.appendChild(thumb);
                    } catch (e) {
                        console.error(e);
                    }
                }
                const labelText = receiptImageInput.nextElementSibling.querySelector('span');
                if (labelText) {
                    labelText.textContent = currentLang === 'ar' 
                        ? `تم اختيار ${countToProcess} صور` 
                        : `${countToProcess} وێنه‌ هاتنه‌ هه‌لبژارتن`;
                }
            } else {
                const labelText = receiptImageInput.nextElementSibling.querySelector('span');
                if (labelText) {
                    labelText.textContent = translations[currentLang].lbl_upload_text;
                }
            }
        });
    }

    setDefaultDates();

    // Real-time calculations for Delegations
    const delCount = document.querySelector('#delegations-form [name="count"]');
    const delAmount = document.querySelector('#delegations-form [name="amount"]');
    const delTotal = document.querySelector('#delegations-form [name="total"]');

    if (delCount && delAmount && delTotal) {
        const calcTotal = () => {
            const count = parseFloat(delCount.value) || 0;
            const amount = parseFloat(delAmount.value) || 0;
            delTotal.value = (count * amount).toFixed(0); // Assuming Iraqi Dinar has no fractions typically, or keep decimal if needed
        };
        delCount.addEventListener('input', calcTotal);
        delAmount.addEventListener('input', calcTotal);
    }

    // Ensure stats are available on load (but don't force display)
    if (document.getElementById('stats-content')) renderStats();
    renderPrintSignatureNames();

    // Enable Enter key on search input to trigger search
    const si = document.getElementById('section-search');
    if (si) {
        si.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); performSearch(); }
        });
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
                // Compress image to save dbStore space
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
    const receipts = JSON.parse(dbStore.getItem('receipts') || '[]');
    const delegations = JSON.parse(dbStore.getItem('delegations') || '[]');
    const children = JSON.parse(dbStore.getItem('children') || '[]');
    const marriage = JSON.parse(dbStore.getItem('marriage') || '[]');
    const fines = JSON.parse(dbStore.getItem('fines') || '[]');

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const currency = translations[currentLang].currency;

    const centralReceipts = receipts.filter(item => item.receipt_type === 'مركزي');
    const decentralReceipts = receipts.filter(item => item.receipt_type === 'لا مركزي');
    const specialReceipts = receipts.filter(item => item.receipt_type === 'خاصه');

    const centralTotal = centralReceipts.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const decentralTotal = decentralReceipts.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const specialTotal = specialReceipts.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

    set('ov-central-receipts-count', centralReceipts.length);
    set('ov-central-receipts-total', centralTotal.toLocaleString() + ' ' + currency);

    set('ov-decentral-receipts-count', decentralReceipts.length);
    set('ov-decentral-receipts-total', decentralTotal.toLocaleString() + ' ' + currency);

    set('ov-special-receipts-count', specialReceipts.length);
    set('ov-special-receipts-total', specialTotal.toLocaleString() + ' ' + currency);

    const dTotal = delegations.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
    set('ov-delegations-count', delegations.length);
    set('ov-delegations-total', dTotal.toLocaleString() + ' ' + currency);

    const cTotal = children.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    set('ov-children-count', children.length);
    set('ov-children-total', cTotal.toLocaleString() + ' ' + currency);

    const mTotal = marriage.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    set('ov-marriage-count', marriage.length);
    set('ov-marriage-total', mTotal.toLocaleString() + ' ' + currency);

    const fTotal = fines.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
    set('ov-fines-count', fines.length);
    set('ov-fines-total', fTotal.toLocaleString() + ' ' + currency);

    const totalRecords = receipts.length + delegations.length + children.length + marriage.length + fines.length;
    set('ov-total-records', totalRecords);
}

function renderReceipts(filter) {
    renderCentralReceipts(filter);
    renderDecentralReceipts(filter);
    renderSpecialReceipts(filter);
}

function renderCentralReceipts(filter) {
    let data = JSON.parse(dbStore.getItem('receipts') || '[]');
    data = data.map((item, idx) => ({ ...item, originalIdx: idx }));
    let centralData = data.filter(item => item.receipt_type === 'مركزي');

    const monthFilterEl = document.getElementById('filter-central-receipts');
    if (monthFilterEl && monthFilterEl.value) {
        centralData = centralData.filter(item => item.date && item.date.split('-')[1] === monthFilterEl.value);
    }

    if (filter) centralData = centralData.filter(item => matchesFilter(item, filter));
    const tbody = document.querySelector('#central-receipts-table tbody');
    if (!tbody) return;
    const statsDiv = document.getElementById('central-receipts-stats');
    const lang = translations[currentLang];
    if (statsDiv) {
        let totalAmount = centralData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        statsDiv.innerHTML = `
            <div class="stat-item"><h4>${lang.st_total_central_receipts}</h4><div class="stat-value">${centralData.length}</div></div>
            <div class="stat-item"><h4>${lang.st_total_amounts}</h4><div class="stat-value">${totalAmount.toLocaleString()} ${lang.currency}</div></div>
        `;
    }
    tbody.innerHTML = centralData.length ? '' : `<tr><td colspan="8" style="text-align:center;">${lang.empty_data}</td></tr>`;
    centralData.forEach((item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.directorate}</td>
            <td>${item.department}</td>
            <td>${item.location}</td>
            <td>${item.date}</td>
            <td>${item.code}</td>
            <td style="font-weight:bold; color:var(--success);">${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>
            <td class="no-print">${(item.receipt_images && item.receipt_images.length > 0) || item.receipt_image ? `<button class="btn-icon-sm" onclick="viewRecordImages(${item.originalIdx})" style="display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-images"></i>${(item.receipt_images && item.receipt_images.length > 1) ? ` <span class="badge" style="background: var(--primary); color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; line-height: 1;">${item.receipt_images.length}</span>` : ''}</button>` : '—'}</td>
            <td class="no-print action-btns">
                <button class="btn-icon-sm print" onclick="printSingleRecord('receipts',${item.originalIdx})" title="${lang.print_record}"><i class="fa-solid fa-print"></i></button>
                <button class="btn-icon-sm edit" onclick="editRecord('receipts',${item.originalIdx})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon-sm del" onclick="deleteRecord('receipts',${item.originalIdx})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderDecentralReceipts(filter) {
    let data = JSON.parse(dbStore.getItem('receipts') || '[]');
    data = data.map((item, idx) => ({ ...item, originalIdx: idx }));
    let decentralData = data.filter(item => item.receipt_type === 'لا مركزي');

    const monthFilterEl = document.getElementById('filter-decentral-receipts');
    if (monthFilterEl && monthFilterEl.value) {
        decentralData = decentralData.filter(item => item.date && item.date.split('-')[1] === monthFilterEl.value);
    }

    if (filter) decentralData = decentralData.filter(item => matchesFilter(item, filter));
    const tbody = document.querySelector('#decentral-receipts-table tbody');
    if (!tbody) return;
    const statsDiv = document.getElementById('decentral-receipts-stats');
    const lang = translations[currentLang];
    if (statsDiv) {
        let totalAmount = decentralData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        statsDiv.innerHTML = `
            <div class="stat-item"><h4>${lang.st_total_decentral_receipts}</h4><div class="stat-value">${decentralData.length}</div></div>
            <div class="stat-item"><h4>${lang.st_total_amounts}</h4><div class="stat-value">${totalAmount.toLocaleString()} ${lang.currency}</div></div>
        `;
    }
    tbody.innerHTML = decentralData.length ? '' : `<tr><td colspan="8" style="text-align:center;">${lang.empty_data}</td></tr>`;
    decentralData.forEach((item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.directorate}</td>
            <td>${item.department}</td>
            <td>${item.location}</td>
            <td>${item.date}</td>
            <td>${item.code}</td>
            <td style="font-weight:bold; color:var(--success);">${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>
            <td class="no-print">${(item.receipt_images && item.receipt_images.length > 0) || item.receipt_image ? `<button class="btn-icon-sm" onclick="viewRecordImages(${item.originalIdx})" style="display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-images"></i>${(item.receipt_images && item.receipt_images.length > 1) ? ` <span class="badge" style="background: var(--primary); color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; line-height: 1;">${item.receipt_images.length}</span>` : ''}</button>` : '—'}</td>
            <td class="no-print action-btns">
                <button class="btn-icon-sm print" onclick="printSingleRecord('receipts',${item.originalIdx})" title="${lang.print_record}"><i class="fa-solid fa-print"></i></button>
                <button class="btn-icon-sm edit" onclick="editRecord('receipts',${item.originalIdx})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon-sm del" onclick="deleteRecord('receipts',${item.originalIdx})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderSpecialReceipts(filter) {
    let data = JSON.parse(dbStore.getItem('receipts') || '[]');
    data = data.map((item, idx) => ({ ...item, originalIdx: idx }));
    let specialData = data.filter(item => item.receipt_type === 'خاصه');

    const monthFilterEl = document.getElementById('filter-special-receipts');
    if (monthFilterEl && monthFilterEl.value) {
        specialData = specialData.filter(item => item.date && item.date.split('-')[1] === monthFilterEl.value);
    }

    if (filter) specialData = specialData.filter(item => matchesFilter(item, filter));
    const tbody = document.querySelector('#special-receipts-table tbody');
    if (!tbody) return;
    const statsDiv = document.getElementById('special-receipts-stats');
    const lang = translations[currentLang];
    if (statsDiv) {
        let totalAmount = specialData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        statsDiv.innerHTML = `
            <div class="stat-item"><h4>${lang.st_total_special_receipts}</h4><div class="stat-value">${specialData.length}</div></div>
            <div class="stat-item"><h4>${lang.st_total_amounts}</h4><div class="stat-value">${totalAmount.toLocaleString()} ${lang.currency}</div></div>
        `;
    }
    tbody.innerHTML = specialData.length ? '' : `<tr><td colspan="8" style="text-align:center;">${lang.empty_data}</td></tr>`;
    specialData.forEach((item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.directorate}</td>
            <td>${item.department}</td>
            <td>${item.location}</td>
            <td>${item.date}</td>
            <td>${item.code}</td>
            <td style="font-weight:bold; color:var(--success);">${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>
            <td class="no-print">${(item.receipt_images && item.receipt_images.length > 0) || item.receipt_image ? `<button class="btn-icon-sm" onclick="viewRecordImages(${item.originalIdx})" style="display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-images"></i>${(item.receipt_images && item.receipt_images.length > 1) ? ` <span class="badge" style="background: var(--primary); color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; line-height: 1;">${item.receipt_images.length}</span>` : ''}</button>` : '—'}</td>
            <td class="no-print action-btns">
                <button class="btn-icon-sm print" onclick="printSingleRecord('receipts',${item.originalIdx})" title="${lang.print_record}"><i class="fa-solid fa-print"></i></button>
                <button class="btn-icon-sm edit" onclick="editRecord('receipts',${item.originalIdx})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon-sm del" onclick="deleteRecord('receipts',${item.originalIdx})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewImage(base64Str) {
    // Legacy support for single image viewing
    currentPreviewImages = [base64Str];
    currentPreviewIdx = 0;
    updateImagePreviewModal();
    openModal('image-preview-modal');
}

let currentPreviewImages = [];
let currentPreviewIdx = 0;

function viewRecordImages(idx) {
    const receipts = JSON.parse(dbStore.getItem('receipts') || '[]');
    const item = receipts[idx];
    if (!item) return;
    
    currentPreviewImages = [];
    if (item.receipt_images && item.receipt_images.length > 0) {
        currentPreviewImages = item.receipt_images;
    } else if (item.receipt_image) {
        currentPreviewImages = [item.receipt_image];
    }
    
    if (currentPreviewImages.length === 0) return;
    
    currentPreviewIdx = 0;
    updateImagePreviewModal();
    openModal('image-preview-modal');
}

function updateImagePreviewModal() {
    const imgEl = document.getElementById('preview-img-el');
    const indicatorEl = document.getElementById('preview-indicator');
    const prevBtn = document.getElementById('prev-img-btn');
    const nextBtn = document.getElementById('next-img-btn');
    const thumbsContainer = document.getElementById('preview-thumbs-container');
    
    if (!imgEl) return;
    
    imgEl.src = currentPreviewImages[currentPreviewIdx];
    const count = currentPreviewImages.length;
    
    if (count > 1) {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
        if (indicatorEl) {
            indicatorEl.textContent = currentLang === 'ar' 
                ? `صورة ${currentPreviewIdx + 1} من ${count}`
                : `وێنه‌ ${currentPreviewIdx + 1} ژ ${count}`;
        }
        
        if (thumbsContainer) {
            thumbsContainer.innerHTML = '';
            currentPreviewImages.forEach((imgSrc, idx) => {
                const thumb = document.createElement('img');
                thumb.src = imgSrc;
                thumb.style.width = '50px';
                thumb.style.height = '50px';
                thumb.style.objectFit = 'cover';
                thumb.style.borderRadius = '4px';
                thumb.style.cursor = 'pointer';
                thumb.style.border = (idx === currentPreviewIdx) 
                    ? '2px solid var(--primary)' 
                    : '2px solid transparent';
                thumb.style.margin = '0 2px';
                thumb.style.transition = 'border-color 0.2s';
                thumb.onclick = () => {
                    currentPreviewIdx = idx;
                    updateImagePreviewModal();
                };
                thumbsContainer.appendChild(thumb);
            });
        }
    } else {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (indicatorEl) indicatorEl.textContent = '';
        if (thumbsContainer) thumbsContainer.innerHTML = '';
    }
}

function nextPreviewImage() {
    if (currentPreviewImages.length <= 1) return;
    currentPreviewIdx = (currentPreviewIdx + 1) % currentPreviewImages.length;
    updateImagePreviewModal();
}

function prevPreviewImage() {
    if (currentPreviewImages.length <= 1) return;
    currentPreviewIdx = (currentPreviewIdx - 1 + currentPreviewImages.length) % currentPreviewImages.length;
    updateImagePreviewModal();
}

function renderDelegations(filter) {
    let data = JSON.parse(dbStore.getItem('delegations') || '[]');

    const monthFilterEl = document.getElementById('filter-delegations');
    if (monthFilterEl && monthFilterEl.value) {
        const monthMapToNum = {
            'كانون الثاني': '01', 'شباط': '02', 'آذار': '03', 'نيسان': '04',
            'أيار': '05', 'حزيران': '06', 'تموز': '07', 'آب': '08',
            'أيلول': '09', 'تشرين الأول': '10', 'تشرين الثاني': '11', 'كانون الأول': '12'
        };
        data = data.filter(item => item.month && monthMapToNum[item.month] === monthFilterEl.value);
    }

    if (filter) data = data.filter(item => matchesFilter(item, filter));
    const tbody = document.querySelector('#delegations-table tbody');
    if (!tbody) return;
    const statsDiv = document.getElementById('delegations-stats');
    const lang = translations[currentLang];
    if (statsDiv) {
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
    let data = JSON.parse(dbStore.getItem('children') || '[]');

    const monthFilterEl = document.getElementById('filter-children');
    if (monthFilterEl && monthFilterEl.value) {
        data = data.filter(item => item.arrival && item.arrival.split('-')[1] === monthFilterEl.value);
    }

    if (filter) data = data.filter(item => matchesFilter(item, filter));
    const tbody = document.querySelector('#children-table tbody');
    if (!tbody) return;
    const statsDiv = document.getElementById('children-stats');
    const lang = translations[currentLang];
    if (statsDiv) {
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
    let data = JSON.parse(dbStore.getItem('marriage') || '[]');

    const monthFilterEl = document.getElementById('filter-marriage');
    if (monthFilterEl && monthFilterEl.value) {
        data = data.filter(item => {
            const d = item.date || item.arrival;
            return d && d.split('-')[1] === monthFilterEl.value;
        });
    }

    if (filter) data = data.filter(item => matchesFilter(item, filter));
    const tbody = document.querySelector('#marriage-table tbody');
    if (!tbody) return;
    const statsDiv = document.getElementById('marriage-stats');
    const lang = translations[currentLang];
    if (statsDiv) {
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
    let data = JSON.parse(dbStore.getItem('fines') || '[]');

    const monthFilterEl = document.getElementById('filter-fines');
    if (monthFilterEl && monthFilterEl.value) {
        data = data.filter(item => item.date && item.date.split('-')[1] === monthFilterEl.value);
    }

    if (filter) data = data.filter(item => matchesFilter(item, filter));
    const tbody = document.querySelector('#fines-table tbody');
    if (!tbody) return;
    const statsDiv = document.getElementById('fines-stats');
    const lang = translations[currentLang];
    if (statsDiv) {
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
    const key = active ? active.id.replace('-section', '') : null;
    if (!q) {
        // clear filters
        initData();
        return;
    }
    switch (key) {
        case 'central-receipts': renderCentralReceipts(q); break;
        case 'decentral-receipts': renderDecentralReceipts(q); break;
        case 'special-receipts': renderSpecialReceipts(q); break;
        case 'delegations': renderDelegations(q); break;
        case 'children': renderChildren(q); break;
        case 'marriage': renderMarriage(q); break;
        case 'fines': renderFines(q); break;
        case 'stats': renderStats(); break;
        default:
            // search across all and show first matching section
            const allKeys = ['receipts', 'delegations', 'children', 'marriage', 'fines'];
            let found = false;
            for (const k of allKeys) {
                const arr = JSON.parse(dbStore.getItem(k) || '[]');
                const match = arr.find(it => matchesFilter(it, q));
                if (match) {
                    if (k === 'receipts') {
                        if (match.receipt_type === 'مركزي') {
                            showSection('central-receipts-section');
                            renderCentralReceipts(q);
                        } else if (match.receipt_type === 'لا مركزي') {
                            showSection('decentral-receipts-section');
                            renderDecentralReceipts(q);
                        } else {
                            showSection('special-receipts-section');
                            renderSpecialReceipts(q);
                        }
                    } else {
                        showSection(k + '-section');
                        if (k === 'delegations') renderDelegations(q);
                        if (k === 'children') renderChildren(q);
                        if (k === 'marriage') renderMarriage(q);
                        if (k === 'fines') renderFines(q);
                    }
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
    const data = JSON.parse(dbStore.getItem(key) || '[]');
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
    if (key === 'receipts') {
        const radioContainer = formEl.querySelector('.radio-group-container');
        if (radioContainer) radioContainer.style.display = 'none';
        
        // Populate existing images preview
        const selectedPreview = document.getElementById('selected-images-preview');
        if (selectedPreview) {
            selectedPreview.innerHTML = '';
            let images = [];
            if (item.receipt_images && item.receipt_images.length > 0) {
                images = item.receipt_images;
            } else if (item.receipt_image) {
                images = [item.receipt_image];
            }
            images.forEach(base64 => {
                const thumb = document.createElement('div');
                thumb.style.position = 'relative';
                thumb.style.width = '60px';
                thumb.style.height = '60px';
                thumb.style.borderRadius = '6px';
                thumb.style.overflow = 'hidden';
                thumb.style.border = '1px solid var(--surface-border)';
                
                const img = document.createElement('img');
                img.src = base64;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                
                thumb.appendChild(img);
                selectedPreview.appendChild(thumb);
            });
            const labelText = document.getElementById('receipt-image').nextElementSibling.querySelector('span');
            if (labelText && images.length > 0) {
                labelText.textContent = currentLang === 'ar' 
                    ? `تم تحميل ${images.length} صور مسبقاً` 
                    : `${images.length} وێنه‌ پێشتر باركرينه‌`;
            }
        }
    }
    const submitBtn = formEl.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.textContent = translations[currentLang].edit_save_btn;
    openModal(modalKeyMap[key]);
}

function openAddReceiptModal(type) {
    const formEl = document.getElementById('receipts-form');
    if (formEl) {
        formEl.reset();
        setDefaultDates();
        const radio = formEl.querySelector(`input[name="receipt_type"][value="${type}"]`);
        if (radio) radio.checked = true;
        const radioContainer = formEl.querySelector('.radio-group-container');
        if (radioContainer) radioContainer.style.display = 'none';
        
        // Reset selected images preview
        const selectedPreview = document.getElementById('selected-images-preview');
        if (selectedPreview) selectedPreview.innerHTML = '';
        const labelText = document.getElementById('receipt-image').nextElementSibling.querySelector('span');
        if (labelText) {
            labelText.textContent = translations[currentLang].lbl_upload_text;
        }
    }
    editingKey = null;
    editingIdx = null;
    const submitBtn = formEl ? formEl.querySelector('[type="submit"]') : null;
    if (submitBtn) submitBtn.textContent = translations[currentLang].save_btn;
    openModal('receipts-modal');
}

function deleteRecord(key, idx) {
    pendingDelete = { key, idx };
    openModal('confirm-modal');
}

function executeDelete() {
    const { key, idx } = pendingDelete;
    if (key === null || idx === null) return;

    const data = JSON.parse(dbStore.getItem(key) || '[]');
    data.splice(idx, 1);
    dbStore.setItem(key, JSON.stringify(data));

    const renderMap = {
        receipts: renderReceipts,
        delegations: renderDelegations,
        children: renderChildren,
        marriage: renderMarriage,
        fines: renderFines
    };

    if (renderMap[key]) renderMap[key]();
    updateOverviewCards();
    updateAutocompletes();
    closeAllModals();
    showToast(translations[currentLang].success_save); // Re-use success toast or add specific one
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    if (modal && overlay) {
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
    if (overlay) overlay.style.opacity = '0';
    setTimeout(() => {
        modals.forEach(modal => modal.style.display = 'none');
        if (overlay) overlay.style.display = 'none';
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

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
        setTimeout(() => {
            modal.style.display = 'none';
            // Check if any other modal is still visible
            const visibleModals = Array.from(document.querySelectorAll('.modal')).filter(m => m.style.display === 'flex' && m.id !== modalId);
            if (visibleModals.length === 0) {
                const overlay = document.getElementById('modal-overlay');
                if (overlay) overlay.style.opacity = '0';
                setTimeout(() => {
                    if (overlay && overlay.style.opacity === '0') overlay.style.display = 'none';
                    document.body.classList.remove('modal-open');
                }, 300);
            }
        }, 300);
    }
}

let onDuplicateConfirmCallback = null;

function showDuplicateWarningModal(onConfirm) {
    onDuplicateConfirmCallback = onConfirm;
    
    const lang = translations[currentLang];
    const titleEl = document.querySelector('#duplicate-confirm-modal .modal-header h3 span');
    const msgEl = document.getElementById('duplicate-msg');
    const btnConfirmEl = document.getElementById('duplicate-confirm-btn');
    const btnCancelEl = document.querySelector('#duplicate-confirm-modal .btn-secondary');
    
    if (titleEl) titleEl.textContent = lang.duplicate_warning_title;
    if (msgEl) msgEl.textContent = lang.duplicate_warning_msg;
    if (btnConfirmEl) btnConfirmEl.textContent = lang.duplicate_confirm_btn;
    if (btnCancelEl) btnCancelEl.textContent = lang.close_btn;
    
    openModal('duplicate-confirm-modal');
}

function executeDuplicateConfirm() {
    closeModal('duplicate-confirm-modal');
    if (typeof onDuplicateConfirmCallback === 'function') {
        onDuplicateConfirmCallback();
        onDuplicateConfirmCallback = null;
    }
}

function checkDuplicate(key, dataObj) {
    const currentData = JSON.parse(dbStore.getItem(key) || '[]');
    const itemsToCheck = (editingKey === key && editingIdx !== null)
        ? currentData.filter((_, idx) => idx !== editingIdx)
        : currentData;

    if (key === 'receipts') {
        return itemsToCheck.some(item => 
            String(item.code).trim() === String(dataObj.code).trim() && 
            item.date === dataObj.date && 
            parseFloat(item.amount) === parseFloat(dataObj.amount)
        );
    } else if (key === 'delegations') {
        return itemsToCheck.some(item => 
            String(item.name).trim() === String(dataObj.name).trim() && 
            item.month === dataObj.month
        );
    } else if (key === 'children') {
        return itemsToCheck.some(item => 
            String(item.child).trim() === String(dataObj.child).trim() && 
            String(item.father).trim() === String(dataObj.father).trim() && 
            String(item.mother).trim() === String(dataObj.mother).trim()
        );
    } else if (key === 'marriage') {
        return itemsToCheck.some(item => 
            String(item.husband).trim() === String(dataObj.husband).trim() && 
            String(item.wife).trim() === String(dataObj.wife).trim()
        );
    } else if (key === 'fines') {
        return itemsToCheck.some(item => 
            String(item.book_number || item.book_num).trim() === String(dataObj.book_number || dataObj.book_num).trim() && 
            String(item.holder).trim() === String(dataObj.holder).trim()
        );
    }
    return false;
}

function saveRecord(key, dataObj, renderFunc, formEl) {
    let currentData = JSON.parse(dbStore.getItem(key) || '[]');
    if (editingKey === key && editingIdx !== null) {
        if (key === 'receipts') {
            if (!dataObj.receipt_images || dataObj.receipt_images.length === 0) {
                if (currentData[editingIdx].receipt_images) {
                    dataObj.receipt_images = currentData[editingIdx].receipt_images;
                } else if (currentData[editingIdx].receipt_image) {
                    dataObj.receipt_images = [currentData[editingIdx].receipt_image];
                }
            }
        }
        currentData[editingIdx] = dataObj;
    } else {
        currentData.push(dataObj);
    }

    try {
        dbStore.setItem(key, JSON.stringify(currentData));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            showToast(translations[currentLang].err_storage);
            return;
        }
    }

    renderFunc();
    updateOverviewCards();
    updateAutocompletes();
    formEl.reset();
    setDefaultDates();
    closeAllModals();
    showToast(translations[currentLang].success_save);
}

window.addEventListener('beforeprint', () => {
    const now = new Date();
    document.getElementById('print-current-date').textContent = now.toLocaleDateString(currentLang === 'ar' ? 'ar-IQ' : 'ku-IQ');
    document.getElementById('print-timestamp').textContent = now.toLocaleTimeString(currentLang === 'ar' ? 'ar-IQ' : 'ku-IQ');
    const activeSection = document.querySelector('.content-section.active');
    const titleElement = document.getElementById('print-section-title');
    if (activeSection) {
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
    const data = JSON.parse(dbStore.getItem(key) || '[]');
    const item = data[idx];
    if (!item) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString(currentLang === 'ar' ? 'ar-IQ' : 'ku-IQ');
    const timeStr = now.toLocaleTimeString(currentLang === 'ar' ? 'ar-IQ' : 'ku-IQ');

    const sectionTitles = {
        receipts: item.receipt_type === 'مركزي' ? lang.print_section_central_receipt : lang.print_section_decentral_receipt,
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

    const hasImages = (key === 'receipts' && ((item.receipt_images && item.receipt_images.length > 0) || item.receipt_image));
    let imageSideHTML = '';
    if (hasImages) {
        let images = [];
        if (item.receipt_images && item.receipt_images.length > 0) {
            images = item.receipt_images;
        } else if (item.receipt_image) {
            images = [item.receipt_image];
        }
        
        let imagesTags = images.map(img => `<img src="${img}" class="spc-receipt-img" style="max-height: 250px; object-fit: contain; margin-bottom: 10px; border-radius: 6px; display: block; width: 100%;">`).join('');
        
        imageSideHTML = `
            <div class="spc-image-side" style="display: flex; flex-direction: column; gap: 8px;">
                <div class="spc-image-container" style="max-height: none; overflow: visible;">
                    <p class="spc-image-title">${lang.th_image}</p>
                    ${imagesTags}
                </div>
            </div>
        `;
    }

    const bodyContent = hasImages ? `
        <div class="spc-body-row">
            <div class="spc-info-side">
                <table class="spc-table">
                    <tbody>${rows}</tbody>
                </table>
            </div>
            ${imageSideHTML}
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
            ${bodyContent}
            <div class="spc-signatures">
                <div class="spc-sig">
                    <div style="height: 50px;"></div>
                    <p class="sig-title">${lang.sig_clerk}</p>
                    <p class="sig-name">${formatSignatureValue(sigNames.clerk)}</p>
                </div>
                <div class="spc-sig">
                    <div style="height: 50px;"></div>
                    <p class="sig-title">${lang.sig_officer}</p>
                    <p class="sig-name">${formatSignatureValue(sigNames.officer)}</p>
                </div>
                <div class="spc-sig">
                    <div style="height: 50px;"></div>
                    <p class="sig-title">${lang.sig_director}</p>
                    <p class="sig-name">${formatSignatureValue(sigNames.director)}</p>
                </div>
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
                .spc-divider { display: none; }
                .spc-table { width:100%; border-collapse:collapse; margin-top:8px; }
                .spc-table th { background:#f0f7fc; color:#1a1a2e; text-align:right; padding:9px 14px; font-size:12px; width:35%; border:1px solid #dde; }
                .spc-table td { padding:9px 14px; font-size:13px; border:1px solid #dde; }
                .spc-table tr.amount-row th, .spc-table tr.amount-row td { background:#fff8e1; font-weight:700; color:#b45309; font-size:14px; }
                .spc-signatures { display:flex; justify-content:space-between; gap:20px; margin-top:20px; }
                .spc-sig { text-align:center; flex:1; font-size:11px; }
                .spc-sig p { margin: 0; }
                .spc-sig p.sig-title { font-weight:700; margin-bottom:2px; }
                .spc-sig p.sig-name { margin: 0; }
                .spc-sig-line { display: none; }
                .spc-body-row { display:flex; gap:20px; align-items:flex-start; margin-top:10px; width:100%; }
                .spc-info-side { flex:1 1 55%; }
                .spc-image-side { flex:1 1 45%; text-align:center; }
                .spc-image-container { border:1px solid #ddd; border-radius:8px; padding:10px; background:#f9f9f9; }
                .spc-receipt-img { max-width:100%; max-height:280px; object-fit:contain; border-radius:6px; display:block; margin:0 auto; }
                .spc-image-title { font-weight:600; margin-bottom:8px; color:#555; font-size:11px; text-align:center; }
                @media print {
                    @page { margin:1.5cm; }
                    body { display:block; }
                    .single-print-card { display:block; }
                    .spc-signatures { margin-top:100px !important; padding-top:20px; }
                }
            </style>
        </head>
        <body>${_singlePrintHTML}</body>
        <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
        </html>
    `);
    win.document.close();
}
function openBulkPrintModal() {
    // Update record counts
    const keys = ['delegations', 'children', 'marriage', 'fines'];
    keys.forEach(key => {
        const data = JSON.parse(dbStore.getItem(key) || '[]');
        const el = document.getElementById(`bp-count-${key}`);
        if (el) el.textContent = `(${data.length})`;
    });

    const receipts = JSON.parse(dbStore.getItem('receipts') || '[]');
    const centralCount = receipts.filter(item => item.receipt_type === 'مركزي').length;
    const decentralCount = receipts.filter(item => item.receipt_type === 'لا مركزي').length;
    const specialCount = receipts.filter(item => item.receipt_type === 'خاصه').length;

    const elCentral = document.getElementById('bp-count-central-receipts');
    if (elCentral) elCentral.textContent = `(${centralCount})`;
    const elDecentral = document.getElementById('bp-count-decentral-receipts');
    if (elDecentral) elDecentral.textContent = `(${decentralCount})`;
    const elSpecial = document.getElementById('bp-count-special-receipts');
    if (elSpecial) elSpecial.textContent = `(${specialCount})`;

    openModal('bulk-print-modal');
}

function buildSectionHTML(key, lang) {
    let data = [];
    if (key === 'central-receipts') {
        data = JSON.parse(dbStore.getItem('receipts') || '[]').filter(item => item.receipt_type === 'مركزي');
    } else if (key === 'decentral-receipts') {
        data = JSON.parse(dbStore.getItem('receipts') || '[]').filter(item => item.receipt_type === 'لا مركزي');
    } else if (key === 'special-receipts') {
        data = JSON.parse(dbStore.getItem('receipts') || '[]').filter(item => item.receipt_type === 'خاصه');
    } else {
        data = JSON.parse(dbStore.getItem(key) || '[]');
    }

    const monthFilterEl = document.getElementById(`filter-${key}`);
    if (monthFilterEl && monthFilterEl.value) {
        if (key === 'central-receipts' || key === 'decentral-receipts' || key === 'special-receipts' || key === 'fines') {
            data = data.filter(item => item.date && item.date.split('-')[1] === monthFilterEl.value);
        } else if (key === 'children') {
            data = data.filter(item => item.arrival && item.arrival.split('-')[1] === monthFilterEl.value);
        } else if (key === 'marriage') {
            data = data.filter(item => {
                const d = item.date || item.arrival;
                return d && d.split('-')[1] === monthFilterEl.value;
            });
        } else if (key === 'delegations') {
            const monthMapToNum = {
                'كانون الثاني': '01', 'شباط': '02', 'آذار': '03', 'نيسان': '04',
                'أيار': '05', 'حزيران': '06', 'تموز': '07', 'آب': '08',
                'أيلول': '09', 'تشرين الأول': '10', 'تشرين الثاني': '11', 'كانون الأول': '12'
            };
            data = data.filter(item => item.month && monthMapToNum[item.month] === monthFilterEl.value);
        }
    }
    if (!data.length) return '';

    const sectionTitles = {
        'central-receipts': lang.print_section_central_receipt,
        'decentral-receipts': lang.print_section_decentral_receipt,
        'special-receipts': lang.print_section_special_receipt,
        delegations: lang.print_section_delegation,
        children: lang.print_section_children,
        marriage: lang.print_section_marriage,
        fines: lang.print_section_fines
    };

    const headers = {
        'central-receipts': `<th>${lang.th_directorate}</th><th>${lang.th_department}</th><th>${lang.th_location}</th><th>${lang.th_date}</th><th>${lang.th_code}</th><th>${lang.th_amount}</th>`,
        'decentral-receipts': `<th>${lang.th_directorate}</th><th>${lang.th_department}</th><th>${lang.th_location}</th><th>${lang.th_date}</th><th>${lang.th_code}</th><th>${lang.th_amount}</th>`,
        'special-receipts': `<th>${lang.th_directorate}</th><th>${lang.th_department}</th><th>${lang.th_location}</th><th>${lang.th_date}</th><th>${lang.th_code}</th><th>${lang.th_amount}</th>`,
        delegations: `<th>${lang.th_name}</th><th>${lang.th_month}</th><th>${lang.th_count}</th><th>${lang.th_export}</th><th>${lang.th_import}</th><th>${lang.th_amount}</th><th>${lang.th_total}</th>`,
        children: `<th>${lang.th_father}</th><th>${lang.th_mother}</th><th>${lang.th_child}</th><th>${lang.th_gender}</th><th>${lang.th_dob}</th><th>${lang.th_arrival}</th><th>${lang.th_amount}</th>`,
        marriage: `<th>${lang.th_husband}</th><th>${lang.th_wife}</th><th>${lang.lbl_employee_gender || lang.th_gender}</th><th>${lang.th_marriage_date || lang.th_date}</th><th>${lang.th_arrival}</th><th>${lang.th_amount}</th>`,
        fines: `<th>${lang.th_type}</th><th>${lang.th_holder}</th><th>${lang.th_book_num}</th><th>${lang.th_total}</th><th>${lang.th_date}</th><th>${lang.th_location}</th>`
    };

    const monthMap = {
        'كانون الثاني': 'm1', 'شباط': 'm2', 'آذار': 'm3', 'نيسان': 'm4', 'أيار': 'm5', 'حزيران': 'm6',
        'تموز': 'm7', 'آب': 'm8', 'أيلول': 'm9', 'تشرين الأول': 'm10', 'تشرين الثاني': 'm11', 'كانون الأول': 'm12'
    };

    let bodyRows = data.map(item => {
        let cells = '';
        if (key === 'central-receipts' || key === 'decentral-receipts' || key === 'special-receipts') {
            cells = `<td>${item.directorate}</td><td>${item.department}</td><td>${item.location}</td><td>${item.date}</td><td>${item.code}</td><td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>`;
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

    let totalAmt = 0;
    if (key === 'central-receipts' || key === 'decentral-receipts' || key === 'special-receipts') totalAmt = data.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    else if (key === 'delegations') totalAmt = data.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
    else if (key === 'children') totalAmt = data.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    else if (key === 'marriage') totalAmt = data.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    else if (key === 'fines') totalAmt = data.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);

    const sigNames = getSignatureNames();
    const colCount = (key === 'central-receipts' || key === 'decentral-receipts' || key === 'special-receipts') ? 6 : ((key === 'delegations' || key === 'children') ? 7 : 6);
    const totalRow = `<tr class="total-row"><td colspan="${colCount - 1}" style="text-align:left;">${lang.st_total_amounts || lang.lbl_total}</td><td><strong>${totalAmt.toLocaleString()} ${lang.currency}</strong></td></tr>`;

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
                    <p><strong>${lang.lbl_date_print}</strong> ${new Date().toLocaleDateString(currentLang === 'ar' ? 'ar-IQ' : 'ku-IQ')}</p>
                    <p><strong>${lang.records_count}:</strong> ${data.length}</p>
                </div>
            </div>
            <table class="bs-table">
                <thead><tr>${headers[key]}</tr></thead>
                <tbody>${bodyRows}${totalRow}</tbody>
            </table>
            <div class="bs-signatures">
                <div class="bs-sig">
                    <div style="height: 50px;"></div>
                    <p class="sig-title">${lang.sig_clerk}</p>
                    <p class="sig-name">${formatSignatureValue(sigNames.clerk)}</p>
                </div>
                <div class="bs-sig">
                    <div style="height: 50px;"></div>
                    <p class="sig-title">${lang.sig_officer}</p>
                    <p class="sig-name">${formatSignatureValue(sigNames.officer)}</p>
                </div>
                <div class="bs-sig">
                    <div style="height: 50px;"></div>
                    <p class="sig-title">${lang.sig_director}</p>
                    <p class="sig-name">${formatSignatureValue(sigNames.director)}</p>
                </div>
            </div>
        </div>
    `;
}

function executeBulkPrint() {
    const lang = translations[currentLang];
    const selected = [
        document.getElementById('bp-central-receipts')?.checked ? 'central-receipts' : null,
        document.getElementById('bp-decentral-receipts')?.checked ? 'decentral-receipts' : null,
        document.getElementById('bp-special-receipts')?.checked ? 'special-receipts' : null,
        document.getElementById('bp-delegations')?.checked ? 'delegations' : null,
        document.getElementById('bp-children')?.checked ? 'children' : null,
        document.getElementById('bp-marriage')?.checked ? 'marriage' : null,
        document.getElementById('bp-fines')?.checked ? 'fines' : null
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
                .bs-divider { display: none; }
                .bs-table { width:100%; border-collapse:collapse; margin-top:6px; font-size:11px; }
                .bs-table th { background:#f0f7fc; text-align:center; padding:8px 10px; border:1px solid #ccd; font-weight:700; }
                .bs-table td { padding:6px 10px; border:1px solid #ccd; text-align:center; }
                .bs-table tr.total-row td { background:#fff8e1; font-weight:700; color:#b45309; }
                .bs-signatures { display:flex; justify-content:space-between; gap:15px; margin-top:30px; }
                .bs-sig { text-align:center; flex:1; font-size:11px; }
                .bs-sig p { margin: 0; }
                .bs-sig p.sig-title { font-weight:700; margin-bottom:2px; }
                .bs-sig p.sig-name { margin: 0; }
                .bs-line { display: none; }
                @media print {
                    @page { margin:1.2cm; size:A4 portrait; }
                    .bulk-section { display:block; page-break-after:always; }
                    .bs-signatures { margin-top:100px !important; padding-top:10px; }
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

function printSection(key) {
    const lang = translations[currentLang];
    if (key === 'stats') {
        let receipts = JSON.parse(dbStore.getItem('receipts') || '[]');
        let delegations = JSON.parse(dbStore.getItem('delegations') || '[]');
        let children = JSON.parse(dbStore.getItem('children') || '[]');
        let marriage = JSON.parse(dbStore.getItem('marriage') || '[]');
        let fines = JSON.parse(dbStore.getItem('fines') || '[]');

        const monthFilterEl = document.getElementById('filter-stats');
        if (monthFilterEl && monthFilterEl.value) {
            const mv = monthFilterEl.value;
            receipts = receipts.filter(item => item.date && item.date.split('-')[1] === mv);
            children = children.filter(item => item.arrival && item.arrival.split('-')[1] === mv);
            marriage = marriage.filter(item => { const d = item.date || item.arrival; return d && d.split('-')[1] === mv; });
            fines = fines.filter(item => item.date && item.date.split('-')[1] === mv);
            const monthMapToNum = {
                'كانون الثاني': '01', 'شباط': '02', 'آذار': '03', 'نيسان': '04',
                'أيار': '05', 'حزيران': '06', 'تموز': '07', 'آب': '08',
                'أيلول': '09', 'تشرين الأول': '10', 'تشرين الثاني': '11', 'كانون الأول': '12'
            };
            delegations = delegations.filter(item => item.month && monthMapToNum[item.month] === mv);
        }

        const totalRecords = receipts.length + delegations.length + children.length + marriage.length + fines.length;
        const totalAmounts = (receipts.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)) +
            (delegations.reduce((s, i) => s + (parseFloat(i.total) || 0), 0)) +
            (children.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)) +
            (marriage.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)) +
            (fines.reduce((s, i) => s + (parseFloat(i.total) || 0), 0));

        const centralReceipts = receipts.filter(item => item.receipt_type === 'مركزي');
        const decentralReceipts = receipts.filter(item => item.receipt_type === 'لا مركزي');
        const specialReceipts = receipts.filter(item => item.receipt_type === 'خاصه');
        const centralReceiptsTotal = centralReceipts.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
        const decentralReceiptsTotal = decentralReceipts.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
        const specialReceiptsTotal = specialReceipts.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

        const delegationsTotal = delegations.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
        const childrenTotal = children.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
        const marriageTotal = marriage.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
        const finesTotal = fines.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);

        const sigNames = getSignatureNames();
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
                        <p><strong>${lang.lbl_date_print}</strong> ${new Date().toLocaleDateString(currentLang === 'ar' ? 'ar-IQ' : 'ku-IQ')}</p>
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
                            <td><strong>${lang.central_receipts}</strong></td>
                            <td>${centralReceipts.length}</td>
                            <td><strong>${centralReceiptsTotal.toLocaleString()} ${lang.currency}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>${lang.decentral_receipts}</strong></td>
                            <td>${decentralReceipts.length}</td>
                            <td><strong>${decentralReceiptsTotal.toLocaleString()} ${lang.currency}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>${lang.special_receipts}</strong></td>
                            <td>${specialReceipts.length}</td>
                            <td><strong>${specialReceiptsTotal.toLocaleString()} ${lang.currency}</strong></td>
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
                
                <div class="bs-signatures" style="margin-top:auto; padding-top:10px;">
                    <div class="bs-sig">
                        <div style="height: 50px;"></div>
                        <p class="sig-title">${lang.sig_clerk}</p>
                        <p class="sig-name">${formatSignatureValue(sigNames.clerk)}</p>
                    </div>
                    <div class="bs-sig">
                        <div style="height: 50px;"></div>
                        <p class="sig-title">${lang.sig_officer}</p>
                        <p class="sig-name">${formatSignatureValue(sigNames.officer)}</p>
                    </div>
                    <div class="bs-sig">
                        <div style="height: 50px;"></div>
                        <p class="sig-title">${lang.sig_director}</p>
                        <p class="sig-name">${formatSignatureValue(sigNames.director)}</p>
                    </div>
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
                .bs-divider { display: none; }
                .bs-table { width:100%; border-collapse:collapse; margin-top:6px; font-size:11px; }
                .bs-table th { background:#f0f7fc; text-align:center; padding:8px 10px; border:1px solid #ccd; font-weight:700; }
                .bs-table td { padding:6px 10px; border:1px solid #ccd; text-align:center; }
                .bs-table tr.total-row td { background:#fff8e1; font-weight:700; color:#b45309; }
                .bs-signatures { display:flex; justify-content:space-between; gap:15px; margin-top:20px; }
                .bs-sig { text-align:center; flex:1; font-size:10px; }
                .bs-sig p { margin: 0; }
                .bs-sig p.sig-title { font-weight:700; margin-bottom:2px; }
                .bs-sig p.sig-name { margin: 0; }
                .bs-line { display: none; }
                @media print {
                    @page { margin:1.2cm; size:A4 portrait; }
                    .bulk-section { min-height:calc(100vh - 2.4cm); }
                    .bs-signatures { margin-top:auto; padding-top:10px; border-top: none; }
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
                .bs-signatures { display:flex; justify-content:space-between; gap:15px; margin-top:30px; }
                .bs-sig { text-align:center; flex:1; font-size:11px; }
                .bs-sig p:first-child { font-weight:700; margin-bottom:50px; }
                .bs-line { border-top:1px solid #333; padding-top:3px; margin-bottom:3px; }
                .no-print { display:none !important; }
                @media print {
                    @page { margin:1.2cm; size:A4 portrait; }
                    .bulk-section { display:block; }
                    .bs-signatures { margin-top:100px !important; padding-top:10px; }
                }
            </style>
        </head>
        <body>${content}</body>
        <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
        </html>`;
}

// ===== MONTHLY ARCHIVE SYSTEM =====
function getMonthlyBreakdown() {
    const receipts = JSON.parse(dbStore.getItem('receipts') || '[]');
    const delegations = JSON.parse(dbStore.getItem('delegations') || '[]');
    const children = JSON.parse(dbStore.getItem('children') || '[]');
    const marriage = JSON.parse(dbStore.getItem('marriage') || '[]');
    const fines = JSON.parse(dbStore.getItem('fines') || '[]');

    const monthlyData = {};
    for (let m = 1; m <= 12; m++) {
        monthlyData[m] = {
            recordsCount: 0,
            amount: 0,
            centralReceipts: 0,
            decentralReceipts: 0,
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
            if (item.receipt_type === 'مركزي') {
                monthlyData[m].centralReceipts++;
            } else {
                monthlyData[m].decentralReceipts++;
            }
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
                            <span>${lang.central_receipts}</span>
                            <span>${data.centralReceipts} (${currentLang === 'ar' ? 'سجل' : 'تۆمار'})</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span>${lang.decentral_receipts}</span>
                            <span>${data.decentralReceipts} (${currentLang === 'ar' ? 'سجل' : 'تۆمار'})</span>
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
    let receipts = JSON.parse(dbStore.getItem('receipts') || '[]');
    let delegations = JSON.parse(dbStore.getItem('delegations') || '[]');
    let children = JSON.parse(dbStore.getItem('children') || '[]');
    let marriage = JSON.parse(dbStore.getItem('marriage') || '[]');
    let fines = JSON.parse(dbStore.getItem('fines') || '[]');

    const monthFilterEl = document.getElementById('filter-stats');
    if (monthFilterEl && monthFilterEl.value) {
        const mv = monthFilterEl.value;
        receipts = receipts.filter(item => item.date && item.date.split('-')[1] === mv);
        children = children.filter(item => item.arrival && item.arrival.split('-')[1] === mv);
        marriage = marriage.filter(item => { const d = item.date || item.arrival; return d && d.split('-')[1] === mv; });
        fines = fines.filter(item => item.date && item.date.split('-')[1] === mv);
        const monthMapToNum = {
            'كانون الثاني': '01', 'شباط': '02', 'آذار': '03', 'نيسان': '04',
            'أيار': '05', 'حزيران': '06', 'تموز': '07', 'آب': '08',
            'أيلول': '09', 'تشرين الأول': '10', 'تشرين الثاني': '11', 'كانون الأول': '12'
        };
        delegations = delegations.filter(item => item.month && monthMapToNum[item.month] === mv);
    }

    const centralReceipts = receipts.filter(item => item.receipt_type === 'مركزي');
    const decentralReceipts = receipts.filter(item => item.receipt_type === 'لا مركزي');
    const specialReceipts = receipts.filter(item => item.receipt_type === 'خاصه');

    const totalRecords = receipts.length + delegations.length + children.length + marriage.length + fines.length;
    const totalAmounts = (receipts.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)) +
        (delegations.reduce((s, i) => s + (parseFloat(i.total) || 0), 0)) +
        (children.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)) +
        (marriage.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)) +
        (fines.reduce((s, i) => s + (parseFloat(i.total) || 0), 0));

    const lang = translations[currentLang];
    const contentDiv = document.getElementById('stats-content');
    const panelsDiv = document.getElementById('stats-panels');
    if (!contentDiv || !panelsDiv) return;

    contentDiv.innerHTML = `
        <div style="display:flex; gap:12px; flex-wrap:wrap; padding:10px;">
            <div class="stat-item"><h4>${lang.ov_total_records}</h4><div class="stat-value">${totalRecords}</div></div>
            <div class="stat-item"><h4>${lang.st_total_amounts}</h4><div class="stat-value">${totalAmounts.toLocaleString()} ${lang.currency}</div></div>
            <div class="stat-item"><h4>${lang.central_receipts}</h4><div class="stat-value">${centralReceipts.length}</div></div>
            <div class="stat-item"><h4>${lang.decentral_receipts}</h4><div class="stat-value">${decentralReceipts.length}</div></div>
            <div class="stat-item"><h4>${lang.special_receipts}</h4><div class="stat-value">${specialReceipts.length}</div></div>
            <div class="stat-item"><h4>${lang.delegations}</h4><div class="stat-value">${delegations.length}</div></div>
            <div class="stat-item"><h4>${lang.children}</h4><div class="stat-value">${children.length}</div></div>
            <div class="stat-item"><h4>${lang.marriage}</h4><div class="stat-value">${marriage.length}</div></div>
            <div class="stat-item"><h4>${lang.fines}</h4><div class="stat-value">${fines.length}</div></div>
        </div>
    `;

    // Panels: breakdowns for each section
    const centralTotal = centralReceipts.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const decentralTotal = decentralReceipts.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const specialTotal = specialReceipts.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const delegationsTotal = delegations.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
    const childrenTotal = children.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const marriageTotal = marriage.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const finesTotal = fines.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);

    panelsDiv.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px;">
            <div class="glass-panel" style="padding:14px;"><h4>${lang.central_receipts}</h4><p>${lang.lbl_records}: ${centralReceipts.length}</p><p>${lang.lbl_total_sum}: ${centralTotal.toLocaleString()} ${lang.currency}</p></div>
            <div class="glass-panel" style="padding:14px;"><h4>${lang.decentral_receipts}</h4><p>${lang.lbl_records}: ${decentralReceipts.length}</p><p>${lang.lbl_total_sum}: ${decentralTotal.toLocaleString()} ${lang.currency}</p></div>
            <div class="glass-panel" style="padding:14px;"><h4>${lang.special_receipts}</h4><p>${lang.lbl_records}: ${specialReceipts.length}</p><p>${lang.lbl_total_sum}: ${specialTotal.toLocaleString()} ${lang.currency}</p></div>
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
        receipts: JSON.parse(dbStore.getItem('receipts') || '[]'),
        delegations: JSON.parse(dbStore.getItem('delegations') || '[]'),
        children: JSON.parse(dbStore.getItem('children') || '[]'),
        marriage: JSON.parse(dbStore.getItem('marriage') || '[]'),
        fines: JSON.parse(dbStore.getItem('fines') || '[]'),
        sig_director_name: dbStore.getItem('sig_director_name') || '',
        sig_clerk_name: dbStore.getItem('sig_clerk_name') || '',
        sig_officer_name: dbStore.getItem('sig_officer_name') || '',
        appLang: dbStore.getItem('appLang') || 'ku'
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
    reader.onload = function (e) {
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

        // Restore all keys to dbStore if they exist in the backup file
        if (Array.isArray(data.receipts)) dbStore.setItem('receipts', JSON.stringify(data.receipts));
        if (Array.isArray(data.delegations)) dbStore.setItem('delegations', JSON.stringify(data.delegations));
        if (Array.isArray(data.children)) dbStore.setItem('children', JSON.stringify(data.children));
        if (Array.isArray(data.marriage)) dbStore.setItem('marriage', JSON.stringify(data.marriage));
        if (Array.isArray(data.fines)) dbStore.setItem('fines', JSON.stringify(data.fines));

        if (data.sig_director_name !== undefined) dbStore.setItem('sig_director_name', data.sig_director_name);
        if (data.sig_clerk_name !== undefined) dbStore.setItem('sig_clerk_name', data.sig_clerk_name);
        if (data.sig_officer_name !== undefined) dbStore.setItem('sig_officer_name', data.sig_officer_name);
        if (data.appLang !== undefined) dbStore.setItem('appLang', data.appLang);

        // Reset state
        pendingBackupData = null;
        closeAllModals();

        // Refresh app state
        currentLang = dbStore.getItem('appLang') || 'ku';
        applyLanguage();
        initData();
        updateOverviewCards();
        renderPrintSignatureNames();
        updateAutocompletes();

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

// ===== AUTOCOMPLETE SUGGESTIONS FOR MODAL FORMS =====
function updateAutocompletes() {
    const formsList = [
        { id: 'receipts-form', key: 'receipts' },
        { id: 'delegations-form', key: 'delegations' },
        { id: 'children-form', key: 'children' },
        { id: 'marriage-form', key: 'marriage' },
        { id: 'fines-form', key: 'fines' }
    ];

    formsList.forEach(formDef => {
        const formEl = document.getElementById(formDef.id);
        if (!formEl) return;

        // Retrieve data from DB
        const data = JSON.parse(dbStore.getItem(formDef.key) || '[]');
        if (!Array.isArray(data)) return;

        // Find all text inputs inside this form
        const textInputs = formEl.querySelectorAll('input[type="text"]');
        textInputs.forEach(input => {
            const fieldName = input.name;
            if (!fieldName) return;

            // Generate unique datalist ID
            const datalistId = `datalist-${formDef.id}-${fieldName}`;

            // Set list attribute on input if not already set
            if (input.getAttribute('list') !== datalistId) {
                input.setAttribute('list', datalistId);
            }

            // Find or create datalist element
            let datalistEl = document.getElementById(datalistId);
            if (!datalistEl) {
                datalistEl = document.createElement('datalist');
                datalistEl.id = datalistId;
                // Append next to the input
                input.parentNode.appendChild(datalistEl);
            }

            // Collect unique non-empty values for this field from previous records
            const uniqueValues = new Set();
            data.forEach(item => {
                const val = item[fieldName];
            });
        });
    });
}

function generateArchiveHTML() {
    const data = {
        receipts: JSON.parse(dbStore.getItem('receipts') || '[]'),
        delegations: JSON.parse(dbStore.getItem('delegations') || '[]'),
        children: JSON.parse(dbStore.getItem('children') || '[]'),
        marriage: JSON.parse(dbStore.getItem('marriage') || '[]'),
        fines: JSON.parse(dbStore.getItem('fines') || '[]'),
        sig_director_name: dbStore.getItem('sig_director_name') || '',
        sig_clerk_name: dbStore.getItem('sig_clerk_name') || '',
        sig_officer_name: dbStore.getItem('sig_officer_name') || '',
        exported_at: new Date().toLocaleString()
    };
    const lang = translations[currentLang];
    const pageLang = currentLang;

    function esc(v){ return (String(v||'')).replace(/\\/g,'\\\\').replace(/`/g,"'").replace(/\$\{/g,'\\${'); }

    const sigClerk    = esc(data.sig_clerk_name);
    const sigOfficer  = esc(data.sig_officer_name);
    const sigDirector = esc(data.sig_director_name);
    const exportedAt  = esc(data.exported_at);
    const jsonData    = JSON.stringify(data)
                            .replace(/\\/g,'\\\\')
                            .replace(/`/g,'\\`')
                            .replace(/\$\{/g,'\\${');

    /* ── section title labels ── */
    const secTitles = {
        receipts   : esc(lang.print_section_central_receipt || lang.receipts),
        delegations: esc(lang.print_section_delegation      || lang.delegations),
        children   : esc(lang.print_section_children        || lang.children),
        marriage   : esc(lang.print_section_marriage        || lang.marriage),
        fines      : esc(lang.print_section_fines           || lang.fines)
    };

    return `<!DOCTYPE html>
<html lang="${esc(pageLang)}" dir="rtl" data-theme="dark">
<head>
<meta charset="UTF-8">
<title>${esc(lang.audit_dept)} - ${esc(lang.ov_subtitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@100..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
/* ═══════════════════════════════════════════
   THEME TOKENS
═══════════════════════════════════════════ */
:root[data-theme="dark"]{
  --bg:#0f172a;--text:#f8fafc;--muted:#94a3b8;
  --primary:#0d8abc;--pl:#38bdf8;
  --surf:#1e293b;--surh:#334155;--bord:#334155;
  --ok:#10b981;--warn:#f59e0b;--err:#ef4444;
  --sh:0 10px 30px rgba(0,0,0,.5)
}
:root[data-theme="light"]{
  --bg:#f1f5f9;--text:#0f172a;--muted:#64748b;
  --primary:#0d8abc;--pl:#0ea5e9;
  --surf:#ffffff;--surh:#e2e8f0;--bord:#e2e8f0;
  --ok:#059669;--warn:#d97706;--err:#dc2626;
  --sh:0 6px 24px rgba(0,0,0,.06)
}
*{margin:0;padding:0;box-sizing:border-box;font-family:'Noto Kufi Arabic',sans-serif;transition:background .2s,color .2s,border-color .2s}
body{background:var(--bg);color:var(--text);direction:rtl;padding:20px;font-size:14px;min-height:100vh}
.wrap{max-width:1440px;margin:0 auto}

/* ── Header ── */
header{background:var(--surf);border:1px solid var(--bord);border-radius:16px;padding:20px 24px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;box-shadow:var(--sh)}
.hdr-l h1{font-size:20px;font-weight:800}
.hdr-l p{color:var(--muted);margin-top:5px;font-size:12px}
.hdr-r{display:flex;gap:12px;align-items:center}
.theme-btn{background:var(--surh);color:var(--text);border:1px solid var(--bord);padding:9px 14px;border-radius:10px;cursor:pointer;font-size:16px;line-height:1}
.theme-btn:hover{background:var(--primary);color:#fff;border-color:var(--primary)}

/* ── Stats ── */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:20px}
.sc{background:var(--surf);border:1px solid var(--bord);border-radius:14px;padding:18px;text-align:center;box-shadow:var(--sh);position:relative;overflow:hidden}
.sc::before{content:'';position:absolute;top:0;left:0;right:0;height:4px}
.sc.c0::before{background:var(--primary)}.sc.c1::before{background:var(--ok)}.sc.c2::before{background:var(--warn)}
.sc.c3::before{background:#8b5cf6}.sc.c4::before{background:#ec4899}.sc.c5::before{background:#06b6d4}.sc.c6::before{background:var(--err)}
.sc h3{font-size:12px;color:var(--muted);margin-bottom:8px}
.sc .num{font-size:26px;font-weight:800}

/* ── Panel ── */
.panel{background:var(--surf);border:1px solid var(--bord);border-radius:14px;padding:18px 20px;margin-bottom:20px;box-shadow:var(--sh)}
.tabs{display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid var(--bord);padding-bottom:14px;margin-bottom:16px}
.tb{background:transparent;color:var(--muted);border:1px solid transparent;padding:9px 18px;border-radius:10px;cursor:pointer;font-weight:700;font-size:13px;display:inline-flex;align-items:center;gap:7px}
.tb:hover{background:var(--surh);color:var(--text)}
.tb.active{background:var(--primary);color:#fff;border-color:var(--primary)}
.filters{display:flex;gap:12px;flex-wrap:wrap}
.si{position:relative;flex:2;min-width:240px}
.si input{width:100%;background:var(--bg);border:1px solid var(--bord);color:var(--text);padding:11px 40px 11px 14px;border-radius:10px;outline:none;font-size:13px}
.si input:focus{border-color:var(--primary)}
.si i{position:absolute;top:50%;right:14px;transform:translateY(-50%);color:var(--muted)}
select.flt{flex:1;min-width:150px;background:var(--bg);border:1px solid var(--bord);color:var(--text);padding:11px 14px;border-radius:10px;outline:none;font-size:13px;cursor:pointer}
select.flt:focus{border-color:var(--primary)}

/* ── Table ── */
.tbl-wrap{background:var(--surf);border:1px solid var(--bord);border-radius:14px;overflow:hidden;box-shadow:var(--sh);margin-bottom:20px}
.tbl-scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;text-align:right}
th{background:rgba(13,138,188,.06);border-bottom:2px solid var(--bord);padding:14px 15px;font-weight:700;color:var(--pl);font-size:13px}
td{border-bottom:1px solid var(--bord);padding:12px 15px;font-size:13.5px}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--surh)}
.badge{display:inline-block;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:800;color:#fff}
.amt{font-weight:700;color:var(--ok)}
.btn-sm{background:var(--surh);color:var(--text);border:1px solid var(--bord);padding:6px 11px;border-radius:7px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;margin-left:5px}
.btn-sm:hover{background:var(--primary);color:#fff;border-color:var(--primary)}
.btn-sm.print:hover{background:var(--ok);border-color:var(--ok)}
.nodata{text-align:center;padding:50px;color:var(--muted)}
.nodata i{font-size:36px;margin-bottom:14px;display:block;opacity:.4}

/* ── Modal ── */
.modal{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);z-index:900;display:none;justify-content:center;align-items:center;padding:20px}
.modal-box{background:var(--surf);border:1px solid var(--bord);border-radius:16px;width:min(96%,780px);max-height:92vh;display:flex;flex-direction:column;box-shadow:var(--sh)}
.modal-hdr{padding:18px 22px;border-bottom:1px solid var(--bord);display:flex;justify-content:space-between;align-items:center}
.modal-hdr h3{font-size:17px;font-weight:800;color:var(--pl);display:flex;align-items:center;gap:9px}
.modal-close{background:transparent;border:none;color:var(--muted);font-size:20px;cursor:pointer}
.modal-close:hover{color:var(--err)}
.modal-body{padding:22px;overflow-y:auto;flex:1}
.modal-ftr{padding:14px 22px;border-top:1px solid var(--bord);display:flex;justify-content:flex-end;gap:10px}
.btn-m{padding:10px 18px;border-radius:9px;font-weight:700;cursor:pointer;border:none;font-size:13px;display:inline-flex;align-items:center;gap:7px}
.btn-m.sec{background:var(--surh);color:var(--text)}
.btn-m.ok{background:var(--ok);color:#fff}

/* ── Images inside modal ── */
.imgs-title{font-weight:700;color:var(--pl);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.imgs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;margin-top:12px}
.thumb{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:9px;cursor:pointer;border:2px solid transparent;box-shadow:0 3px 10px rgba(0,0,0,.2)}
.thumb:hover{border-color:var(--primary);transform:scale(1.04)}

/* ── Lightbox ── */
.lb{position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:2000;display:none;justify-content:center;align-items:center;flex-direction:column;padding:20px}
.lb-c{position:relative;max-width:82%;max-height:82vh}
.lb-img{max-width:100%;max-height:82vh;border-radius:8px}
.lb-x{position:absolute;top:-44px;right:0;color:#fff;font-size:26px;cursor:pointer;background:none;border:none}
.lb-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;border:none;width:44px;height:44px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px}
.lb-p{left:-58px}.lb-n{right:-58px}
.lb-ind{color:#fff;margin-top:13px;font-weight:700}
.lb-thumbs{display:flex;gap:7px;margin-top:12px}
.lb-th{width:48px;height:48px;object-fit:cover;border-radius:5px;cursor:pointer;opacity:.5;border:2px solid transparent}
.lb-th.active{opacity:1;border-color:var(--primary)}

/* ── Footer ── */
.foot{display:flex;justify-content:space-between;border-top:1px solid var(--bord);padding-top:14px;margin-top:24px;color:var(--muted);font-size:12px}

/* ═══════════════════════════════════════════
   PRINT CARD  (exact copy from main site)
   single-print-card lives inside #printWin
═══════════════════════════════════════════ */
#printWin{display:none}

/* ══════════════════════════════════════════
   PRINT MEDIA — hide UI, show card
══════════════════════════════════════════ */
@media print {
  body{background:#fff!important;color:#000!important;padding:0!important}
  .wrap,header,.stats,.panel,.tbl-wrap,.foot,.lb,.modal{display:none!important}
  #printWin{display:block!important}

  /* ── identical to executeSinglePrint styles ── */
  *{font-family:'Noto Kufi Arabic',sans-serif}
  body{background:#fff;color:#1a1a2e;direction:rtl}
  .single-print-card{padding:28px 35px;max-width:750px;margin:auto}
  .spc-header{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;margin-bottom:10px}
  .spc-header-right,.spc-header-left{flex:1;font-size:12px;line-height:1.9}
  .spc-header-left{text-align:left}
  .spc-header-center{flex:0 0 160px;text-align:center}
  .spc-gov{font-size:11px;color:#444}
  .spc-min{font-size:11px;color:#444}
  .spc-dept{font-size:13px;font-weight:700}
  .spc-audit{font-size:12px;color:#0D8ABC}
  .spc-logo{width:80px;height:80px;object-fit:contain;margin-bottom:6px}
  .spc-title{font-size:16px;font-weight:800;color:#1a1a2e}
  .spc-badge{display:inline-block;background:#0D8ABC;color:#fff;font-size:10px;padding:3px 10px;border-radius:20px;margin-top:4px}
  .spc-table{width:100%;border-collapse:collapse;margin-top:8px}
  .spc-table th{background:#f0f7fc;color:#1a1a2e;text-align:right;padding:9px 14px;font-size:12px;width:35%;border:1px solid #dde}
  .spc-table td{padding:9px 14px;font-size:13px;border:1px solid #dde}
  .spc-table tr.amount-row th,.spc-table tr.amount-row td{background:#fff8e1;font-weight:700;color:#b45309;font-size:14px}
  .spc-signatures{display:flex;justify-content:space-between;gap:20px;margin-top:100px;padding-top:20px}
  .spc-sig{text-align:center;flex:1;font-size:11px}
  .spc-sig p{margin:0}
  .spc-sig p.sig-title{font-weight:700;margin-bottom:2px}
  .spc-body-row{display:flex;gap:20px;align-items:flex-start;margin-top:10px;width:100%}
  .spc-info-side{flex:1 1 55%}
  .spc-image-side{flex:1 1 45%;text-align:center;display:flex;flex-direction:column;gap:8px}
  .spc-image-container{border:1px solid #ddd;border-radius:8px;padding:10px;background:#f9f9f9;max-height:none;overflow:visible}
  .spc-receipt-img{max-width:100%;max-height:250px;object-fit:contain;border-radius:6px;display:block;margin:0 auto 8px}
  .spc-image-title{font-weight:600;margin-bottom:8px;color:#555;font-size:11px;text-align:center}
  @page{margin:1.5cm}
}
</style>
</head>
<body>
<div class="wrap">

<!-- Header -->
<header>
  <div class="hdr-l">
    <h1>${esc(lang.gov_name)} &#8211; ${esc(lang.ministry)}</h1>
    <p>${esc(lang.dept_name)} &#8211; ${esc(lang.audit_dept)} | ${esc(lang.ov_subtitle)}</p>
  </div>
  <div class="hdr-r">
    <button class="theme-btn" id="themeBtn" onclick="toggleTheme()"><i id="themeIco" class="fa-solid fa-sun"></i></button>
    <div style="text-align:left">
      <p><strong>${esc(lang.lbl_date_print)}</strong> ${exportedAt}</p>
      <p style="font-size:11px;margin-top:3px;color:var(--muted)">&#128274; أرشيف تفاعلي غير متصل</p>
    </div>
  </div>
</header>

<!-- Stats -->
<div class="stats">
  <div class="sc c0"><h3>${esc(lang.central_receipts)}</h3><div class="num" id="s0">0</div></div>
  <div class="sc c1"><h3>${esc(lang.decentral_receipts)}</h3><div class="num" id="s1">0</div></div>
  <div class="sc c2"><h3>${esc(lang.special_receipts)}</h3><div class="num" id="s2">0</div></div>
  <div class="sc c3"><h3>${esc(lang.delegations)}</h3><div class="num" id="s3">0</div></div>
  <div class="sc c4"><h3>${esc(lang.children)}</h3><div class="num" id="s4">0</div></div>
  <div class="sc c5"><h3>${esc(lang.marriage)}</h3><div class="num" id="s5">0</div></div>
  <div class="sc c6"><h3>${esc(lang.fines)}</h3><div class="num" id="s6">0</div></div>
</div>

<!-- Control Panel -->
<div class="panel">
  <div class="tabs">
    <button class="tb active" onclick="switchTab('receipts',this)"><i class="fa-solid fa-file-invoice-dollar"></i>${esc(lang.receipts)}</button>
    <button class="tb" onclick="switchTab('delegations',this)"><i class="fa-solid fa-plane-departure"></i>${esc(lang.delegations)}</button>
    <button class="tb" onclick="switchTab('children',this)"><i class="fa-solid fa-child"></i>${esc(lang.children)}</button>
    <button class="tb" onclick="switchTab('marriage',this)"><i class="fa-solid fa-ring"></i>${esc(lang.marriage)}</button>
    <button class="tb" onclick="switchTab('fines',this)"><i class="fa-solid fa-book-open"></i>${esc(lang.fines)}</button>
  </div>
  <div class="filters">
    <div class="si">
      <i class="fa-solid fa-search"></i>
      <input type="text" id="qs" placeholder="${esc(lang.search_placeholder)}" oninput="doSearch()">
    </div>
    <select class="flt" id="typeF" onchange="doFilter()" style="display:none"></select>
    <select class="flt" id="monthF" onchange="doFilter()" style="display:none"></select>
  </div>
</div>

<!-- Table -->
<div class="tbl-wrap">
  <div class="tbl-scroll">
    <table id="tbl">
      <thead><tr id="thead"></tr></thead>
      <tbody id="tbody"></tbody>
    </table>
  </div>
  <div class="nodata" id="nodata" style="display:none">
    <i class="fa-solid fa-folder-open"></i>${esc(lang.empty_data)}
  </div>
</div>

<!-- Footer -->
<div class="foot">
  <div>
    <p><strong>${esc(lang.sig_clerk)}:</strong> ${sigClerk||'&#8212;'}</p>
    <p><strong>${esc(lang.sig_officer)}:</strong> ${sigOfficer||'&#8212;'}</p>
    <p><strong>${esc(lang.sig_director)}:</strong> ${sigDirector||'&#8212;'}</p>
  </div>
  <div style="text-align:left;align-self:flex-end">
    <p>&#169; ${new Date().getFullYear()} &#8211; ${esc(lang.dept_name)}</p>
  </div>
</div>
</div><!-- /.wrap -->

<!-- ══ Details Modal ══ -->
<div id="detailModal" class="modal" onclick="closeDet(event)">
  <div class="modal-box" onclick="event.stopPropagation()">
    <div class="modal-hdr">
      <h3 id="detTitle"><i class="fa-solid fa-circle-info"></i> تفاصيل السجل</h3>
      <button class="modal-close" onclick="closeDet(event)"><i class="fa-solid fa-times"></i></button>
    </div>
    <div class="modal-body">
      <!-- preview of the print card (dark/light) -->
      <div id="modalPreview" style="border:1px solid var(--bord);border-radius:12px;padding:20px;background:rgba(255,255,255,.01);margin-bottom:18px;overflow:auto"></div>
      <!-- images -->
      <div id="imgSec" style="display:none">
        <p class="imgs-title"><i class="fa-solid fa-images"></i> الصور المرفقة للوصل</p>
        <div class="imgs-grid" id="imgGrid"></div>
      </div>
    </div>
    <div class="modal-ftr">
      <button class="btn-m sec" onclick="closeDet(event)"><i class="fa-solid fa-times"></i> ${esc(lang.close_btn||'إغلاق')}</button>
      <button class="btn-m ok" onclick="doPrint()"><i class="fa-solid fa-print"></i> طباعة السجل</button>
    </div>
  </div>
</div>

<!-- ══ Hidden print container ══ -->
<div id="printWin"></div>

<!-- Lightbox -->
<div id="lb" class="lb" onclick="lbClose(event)">
  <div class="lb-c" onclick="event.stopPropagation()">
    <button class="lb-x" onclick="lbClose(event)"><i class="fa-solid fa-times"></i></button>
    <button class="lb-nav lb-p" onclick="lbPrev()"><i class="fa-solid fa-chevron-right"></i></button>
    <button class="lb-nav lb-n" onclick="lbNext()"><i class="fa-solid fa-chevron-left"></i></button>
    <img id="lbImg" class="lb-img" src="" alt="">
  </div>
  <div id="lbInd" class="lb-ind"></div>
  <div id="lbThumbs" class="lb-thumbs"></div>
</div>

<script>
/* ── Data ── */
const D = ${jsonData};
let tab='receipts', qs='', mf='', tf='', lbImgs=[], lbIdx=0;

const CUR = '${esc(pageLang)}';
const SIG_CLERK   = '${sigClerk}';
const SIG_OFFICER = '${sigOfficer}';
const SIG_DIR     = '${sigDirector}';

const SEC_TITLES = {
  receipts:    '${secTitles.receipts}',
  delegations: '${secTitles.delegations}',
  children:    '${secTitles.children}',
  marriage:    '${secTitles.marriage}',
  fines:       '${secTitles.fines}'
};

const L = {
  receipt_type: '${esc(lang.lbl_receipt_type||'نوع الوصل')}',
  directorate:  '${esc(lang.lbl_directorate||lang.th_directorate||'')}',
  department:   '${esc(lang.lbl_department ||lang.th_department ||'')}',
  location:     '${esc(lang.lbl_location   ||lang.th_location   ||'')}',
  date:         '${esc(lang.lbl_date       ||lang.th_date       ||'')}',
  code:         '${esc(lang.lbl_code       ||lang.th_code       ||'')}',
  amount:       '${esc(lang.lbl_amount     ||lang.th_amount     ||'')}',
  total:        '${esc(lang.lbl_total      ||lang.th_total      ||'')}',
  name:         '${esc(lang.th_name        ||'')}',
  month:        '${esc(lang.lbl_month      ||lang.th_month      ||'')}',
  count:        '${esc(lang.lbl_count      ||lang.th_count      ||'')}',
  export_num:   '${esc(lang.th_export      ||'')}',
  import_num:   '${esc(lang.th_import      ||'')}',
  father:       '${esc(lang.lbl_father     ||lang.th_father     ||'')}',
  mother:       '${esc(lang.lbl_mother     ||lang.th_mother     ||'')}',
  child:        '${esc(lang.lbl_child      ||lang.th_child      ||'')}',
  gender:       '${esc(lang.lbl_gender     ||lang.th_gender     ||'')}',
  dob:          '${esc(lang.th_dob         ||'')}',
  arrival:      '${esc(lang.th_arrival     ||'')}',
  husband:      '${esc(lang.lbl_husband    ||lang.th_husband    ||'')}',
  wife:         '${esc(lang.lbl_wife       ||lang.th_wife       ||'')}',
  holder:       '${esc(lang.lbl_holder     ||lang.th_holder     ||'')}',
  book_type:    '${esc(lang.lbl_book_type  ||'')}',
  book_number:  '${esc(lang.lbl_book_num   ||lang.th_book_num   ||'')}',
  currency:     '${esc(lang.currency       ||'د.ع')}',
  actions:      '${esc(lang.th_actions     ||'الإجراءات')}',
  vd:           '${esc(lang.view_details   ||'عرض التفاصيل')}',
  pr:           '${esc(lang.print_record   ||'طباعة')}',
  sig_clerk:    '${esc(lang.sig_clerk      ||'')}',
  sig_officer:  '${esc(lang.sig_officer    ||'')}',
  sig_director: '${esc(lang.sig_director   ||'')}',
  lbl_date_p:   '${esc(lang.lbl_date_print ||'')}',
  records_count:'${esc(lang.records_count  ||'عدد السجلات')}',
  single_print: '${esc(lang.single_print   ||'طباعة مفردة')}',
  th_image:     '${esc(lang.th_image       ||'الصورة')}',
  lbl_central:  '${esc(lang.lbl_central    ||'مركزي')}',
  lbl_decentral:'${esc(lang.lbl_decentral  ||'لا مركزي')}',
  lbl_special:  '${esc(lang.lbl_special    ||'خاصة')}',
  lbl_male:     '${esc(lang.lbl_male       ||'ذكر')}',
  lbl_female:   '${esc(lang.lbl_female     ||'أنثى')}',
  gov_name:     '${esc(lang.gov_name       ||'')}',
  ministry:     '${esc(lang.ministry       ||'')}',
  dept_name:    '${esc(lang.dept_name      ||'')}',
  audit_dept:   '${esc(lang.audit_dept     ||'')}'
};

const MONTHS_AR = ['كانون الثاني','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','تشرين الأول','تشرين الثاني','كانون الأول'];
const MONTHS_KU = ['كانوونا دووێ','شوبات','آدار','نیسان','گۆلان','حوزەیران','تیرمەهـ','تەباخ','ئەیلول','چرییا ئێكێ','چرییا دووێ','كانوونا ئێكێ'];
const MONTHS = CUR==='ar' ? MONTHS_AR : MONTHS_KU;

/* ── Stats ── */
document.getElementById('s0').textContent = D.receipts.filter(r=>r.receipt_type==='مركزي').length;
document.getElementById('s1').textContent = D.receipts.filter(r=>r.receipt_type==='لا مركزي').length;
document.getElementById('s2').textContent = D.receipts.filter(r=>r.receipt_type==='خاصه').length;
document.getElementById('s3').textContent = D.delegations.length;
document.getElementById('s4').textContent = D.children.length;
document.getElementById('s5').textContent = D.marriage.length;
document.getElementById('s6').textContent = D.fines.length;

/* ── Theme ── */
function toggleTheme(){
  const r=document.documentElement,ico=document.getElementById('themeIco');
  if(r.getAttribute('data-theme')==='dark'){r.setAttribute('data-theme','light');ico.className='fa-solid fa-moon';}
  else{r.setAttribute('data-theme','dark');ico.className='fa-solid fa-sun';}
}

/* ── Tabs ── */
function switchTab(t,btn){
  document.querySelectorAll('.tb').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  tab=t;qs='';mf='';tf='';
  document.getElementById('qs').value='';
  setupFilters();render();
}

/* ── Filters ── */
function setupFilters(){
  const tF=document.getElementById('typeF'),mF=document.getElementById('monthF');
  tF.style.display='none';mF.style.display='none';tF.innerHTML='';mF.innerHTML='';
  const all=CUR==='ar'?'الكل':'هەمی';
  if(tab==='receipts'){
    tF.innerHTML='<option value="">'+L.receipt_type+' ('+all+')</option>'
      +'<option value="مركزي">'+L.lbl_central+'</option>'
      +'<option value="لا مركزي">'+L.lbl_decentral+'</option>'
      +'<option value="خاصه">'+L.lbl_special+'</option>';
    tF.style.display='block';
  }
  if(['receipts','children','fines'].includes(tab)){
    mF.innerHTML='<option value="">'+(CUR==='ar'?'الشهر':'هه‌یڤ')+' ('+all+')</option>';
    for(let i=1;i<=12;i++){const v=(i<10?'0':'')+i;mF.innerHTML+='<option value="'+v+'">'+MONTHS[i-1]+'</option>';}
    mF.style.display='block';
  } else if(tab==='delegations'){
    mF.innerHTML='<option value="">'+(CUR==='ar'?'الشهر':'هه‌یڤ')+' ('+all+')</option>';
    MONTHS.forEach(m=>{mF.innerHTML+='<option value="'+m+'">'+m+'</option>';});
    mF.style.display='block';
  }
}
function doSearch(){qs=document.getElementById('qs').value.toLowerCase().trim();render();}
function doFilter(){
  const tF=document.getElementById('typeF'),mF=document.getElementById('monthF');
  tf=tF?tF.value:'';mf=mF?mF.value:'';render();
}

/* ── Data filter ── */
function filtered(){
  let lst=[...D[tab]||[]];
  if(qs) lst=lst.filter(r=>Object.values(r).some(v=>typeof v==='string'&&!v.startsWith('data:image')&&v.toLowerCase().includes(qs)));
  if(tf&&tab==='receipts') lst=lst.filter(r=>r.receipt_type===tf);
  if(mf){
    if(['receipts','children','fines'].includes(tab)) lst=lst.filter(r=>{const d=r.date||r.arrival||'';return d.split('-')[1]===mf;});
    if(tab==='delegations') lst=lst.filter(r=>r.month===mf);
  }
  return lst;
}

/* ── Column definitions ── */
const COLS={
  receipts:['receipt_type','directorate','department','location','date','code','amount'],
  delegations:['name','month','count','amount','total','export_num','import_num'],
  children:['child','father','mother','gender','dob','arrival','amount'],
  marriage:['husband','wife','date','amount'],
  fines:['book_type','holder','book_number','date','location','total']
};

/* ── Render Table ── */
function render(){
  const thead=document.getElementById('thead'),tbody=document.getElementById('tbody'),nodata=document.getElementById('nodata'),tbl=document.getElementById('tbl');
  thead.innerHTML='';tbody.innerHTML='';
  const rows=filtered();
  if(!rows.length){nodata.style.display='block';tbl.style.display='none';return;}
  nodata.style.display='none';tbl.style.display='table';
  const cols=COLS[tab]||[];
  cols.forEach(c=>{const th=document.createElement('th');th.textContent=L[c]||c;thead.appendChild(th);});
  const thA=document.createElement('th');thA.textContent=L.actions;thead.appendChild(thA);
  rows.forEach(item=>{
    const tr=document.createElement('tr');
    cols.forEach(c=>{
      const td=document.createElement('td');
      if(c==='amount'||c==='total'){
        td.className='amt';
        td.textContent=parseFloat(item[c]||0).toLocaleString()+' '+L.currency;
      } else if(c==='receipt_type'){
        const v=item[c]||'';
        const clr=v==='مركزي'?'#0d8abc':v==='لا مركزي'?'#10b981':'#f59e0b';
        const lbl=v==='مركزي'?L.lbl_central:v==='لا مركزي'?L.lbl_decentral:L.lbl_special;
        td.innerHTML='<span class="badge" style="background:'+clr+'">'+lbl+'</span>';
      } else if(c==='gender'){
        td.textContent=item[c]==='ذكر'?L.lbl_male:L.lbl_female;
      } else {
        td.textContent=item[c]||'—';
      }
      tr.appendChild(td);
    });
    const tdA=document.createElement('td');
    const b1=document.createElement('button');b1.className='btn-sm';b1.innerHTML='<i class="fa-solid fa-eye"></i> '+L.vd;b1.onclick=()=>openDet(item);tdA.appendChild(b1);
    const b2=document.createElement('button');b2.className='btn-sm print';b2.innerHTML='<i class="fa-solid fa-print"></i> '+L.pr;b2.onclick=()=>printRow(item);tdA.appendChild(b2);
    tr.appendChild(tdA);
    tbody.appendChild(tr);
  });
}

/* ══════════════════════════════════════════
   BUILD PRINT CARD HTML
   (identical markup to printSingleRecord in main app)
══════════════════════════════════════════ */
function buildPrintCard(item){
  const now=new Date();
  const dateStr=now.toLocaleDateString(CUR==='ar'?'ar-IQ':'ku-IQ');
  const timeStr=now.toLocaleTimeString(CUR==='ar'?'ar-IQ':'ku-IQ');

  let secTitle = SEC_TITLES[tab] || '';
  if(tab==='receipts'){
    secTitle = item.receipt_type==='مركزي' ? SEC_TITLES.receipts : SEC_TITLES.delegations;
    /* keep original: central vs decentral label comes from sec title key */
    secTitle = SEC_TITLES.receipts;
  }

  /* ── field rows ── */
  let rows='';
  if(tab==='receipts'){
    const tLbl=item.receipt_type==='مركزي'?L.lbl_central:item.receipt_type==='لا مركزي'?L.lbl_decentral:L.lbl_special;
    rows=\`<tr><th>\${L.receipt_type}</th><td>\${tLbl}</td></tr>
<tr><th>\${L.directorate}</th><td>\${item.directorate||''}</td></tr>
<tr><th>\${L.department}</th><td>\${item.department||''}</td></tr>
<tr><th>\${L.location}</th><td>\${item.location||''}</td></tr>
<tr><th>\${L.date}</th><td>\${item.date||''}</td></tr>
<tr><th>\${L.code}</th><td>\${item.code||''}</td></tr>
<tr class="amount-row"><th>\${L.amount}</th><td>\${parseFloat(item.amount||0).toLocaleString()} \${L.currency}</td></tr>\`;
  } else if(tab==='delegations'){
    rows=\`<tr><th>\${L.name}</th><td>\${item.name||''}</td></tr>
<tr><th>\${L.month}</th><td>\${item.month||''}</td></tr>
<tr><th>\${L.count}</th><td>\${item.count||''}</td></tr>
<tr><th>\${L.export_num}</th><td>\${item.export_num||item.export||''}</td></tr>
<tr><th>\${L.import_num}</th><td>\${item.import_num||item.import||''}</td></tr>
<tr><th>\${L.amount}</th><td>\${parseFloat(item.amount||0).toLocaleString()} \${L.currency}</td></tr>
<tr class="amount-row"><th>\${L.total}</th><td>\${parseFloat(item.total||0).toLocaleString()} \${L.currency}</td></tr>\`;
  } else if(tab==='children'){
    rows=\`<tr><th>\${L.father}</th><td>\${item.father||''}</td></tr>
<tr><th>\${L.mother}</th><td>\${item.mother||''}</td></tr>
<tr><th>\${L.child}</th><td>\${item.child||''}</td></tr>
<tr><th>\${L.gender}</th><td>\${item.gender==='ذكر'?L.lbl_male:L.lbl_female}</td></tr>
<tr><th>\${L.dob}</th><td>\${item.dob||''}</td></tr>
<tr><th>\${L.arrival}</th><td>\${item.arrival||''}</td></tr>
<tr class="amount-row"><th>\${L.amount}</th><td>\${parseFloat(item.amount||0).toLocaleString()} \${L.currency}</td></tr>\`;
  } else if(tab==='marriage'){
    rows=\`<tr><th>\${L.husband}</th><td>\${item.husband||''}</td></tr>
<tr><th>\${L.wife}</th><td>\${item.wife||''}</td></tr>
<tr><th>\${L.date}</th><td>\${item.date||''}</td></tr>
<tr><th>\${L.arrival}</th><td>\${item.arrival||''}</td></tr>
<tr class="amount-row"><th>\${L.amount}</th><td>\${parseFloat(item.amount||0).toLocaleString()} \${L.currency}</td></tr>\`;
  } else if(tab==='fines'){
    rows=\`<tr><th>\${L.book_type}</th><td>\${item.book_type||''}</td></tr>
<tr><th>\${L.holder}</th><td>\${item.holder||''}</td></tr>
<tr><th>\${L.book_number}</th><td>\${item.book_number||''}</td></tr>
<tr><th>\${L.date}</th><td>\${item.date||''}</td></tr>
<tr><th>\${L.location}</th><td>\${item.location||''}</td></tr>
<tr class="amount-row"><th>\${L.total}</th><td>\${parseFloat(item.total||0).toLocaleString()} \${L.currency}</td></tr>\`;
  }

  /* ── images side ── */
  let imgs=item.receipt_images&&item.receipt_images.length?item.receipt_images:item.receipt_image?[item.receipt_image]:[];
  let imgSideHTML='';
  if(tab==='receipts'&&imgs.length){
    const tags=imgs.map(s=>\`<img src="\${s}" class="spc-receipt-img">\`).join('');
    imgSideHTML=\`<div class="spc-image-side"><div class="spc-image-container"><p class="spc-image-title">\${L.th_image}</p>\${tags}</div></div>\`;
  }

  const bodyHTML=imgSideHTML
    ?\`<div class="spc-body-row"><div class="spc-info-side"><table class="spc-table"><tbody>\${rows}</tbody></table></div>\${imgSideHTML}</div>\`
    :\`<table class="spc-table"><tbody>\${rows}</tbody></table>\`;

  return \`<div class="single-print-card">
  <div class="spc-header">
    <div class="spc-header-right">
      <p class="spc-gov">\${L.gov_name}</p>
      <p class="spc-min">\${L.ministry}</p>
      <p class="spc-dept">\${L.dept_name}</p>
      <p class="spc-audit">\${L.audit_dept}</p>
    </div>
    <div class="spc-header-center">
      <img src="logo.png" class="spc-logo" onerror="this.style.display='none'">
      <h2 class="spc-title">\${secTitle}</h2>
      <span class="spc-badge">\${L.single_print}</span>
    </div>
    <div class="spc-header-left">
      <p><strong>\${L.lbl_date_p}</strong> \${dateStr}</p>
      <p><strong>\${CUR==='ar'?'الوقت':'کات'}:</strong> \${timeStr}</p>
      <p><strong>\${L.records_count}:</strong> 1</p>
    </div>
  </div>
  \${bodyHTML}
  <div class="spc-signatures">
    <div class="spc-sig"><div style="height:50px"></div><p class="sig-title">\${L.sig_clerk}</p><p class="sig-name">\${SIG_CLERK||'—'}</p></div>
    <div class="spc-sig"><div style="height:50px"></div><p class="sig-title">\${L.sig_officer}</p><p class="sig-name">\${SIG_OFFICER||'—'}</p></div>
    <div class="spc-sig"><div style="height:50px"></div><p class="sig-title">\${L.sig_director}</p><p class="sig-name">\${SIG_DIR||'—'}</p></div>
  </div>
</div>\`;
}

/* ── Modal open ── */
let _currentItem = null;
function openDet(item){
  _currentItem = item;
  const preview=document.getElementById('modalPreview');
  const imgGrid=document.getElementById('imgGrid');
  const imgSec=document.getElementById('imgSec');
  imgGrid.innerHTML='';imgSec.style.display='none';

  /* Build a screen-friendly card inside the modal */
  preview.innerHTML = buildPrintCard(item);

  /* Make the preview readable in dark/light mode by overriding print colours */
  preview.querySelectorAll('.spc-table th').forEach(el=>{el.style.background='var(--surh)';el.style.color='var(--text)';el.style.border='1px solid var(--bord)';});
  preview.querySelectorAll('.spc-table td').forEach(el=>{el.style.border='1px solid var(--bord)';el.style.color='var(--text)';});
  preview.querySelectorAll('.spc-table tr.amount-row th, .spc-table tr.amount-row td').forEach(el=>{el.style.background='rgba(251,191,36,.08)';el.style.color='var(--warn)';});
  preview.querySelectorAll('.spc-image-container').forEach(el=>{el.style.background='var(--surh)';el.style.border='1px solid var(--bord)';});
  preview.querySelectorAll('.spc-receipt-img').forEach(el=>{el.style.cursor='pointer';});

  /* Images lightbox hookup */
  let imgs=item.receipt_images&&item.receipt_images.length?item.receipt_images:item.receipt_image?[item.receipt_image]:[];
  if(tab==='receipts'&&imgs.length){
    imgSec.style.display='block';
    imgs.forEach((s,i)=>{
      const img=document.createElement('img');img.src=s;img.className='thumb';
      img.onclick=()=>lbOpen(imgs,i);imgGrid.appendChild(img);
    });
    preview.querySelectorAll('.spc-receipt-img').forEach((el,i)=>{el.onclick=()=>lbOpen(imgs,i);});
  }

  document.getElementById('detailModal').style.display='flex';
}
function closeDet(e){document.getElementById('detailModal').style.display='none';}

/* ── Print ── */
function doPrint(){
  if(!_currentItem) return;
  document.getElementById('printWin').innerHTML = buildPrintCard(_currentItem);
  window.print();
}
function printRow(item){openDet(item);setTimeout(()=>{doPrint();},400);}

/* ── Lightbox ── */
function lbOpen(imgs,idx){lbImgs=imgs;lbIdx=idx;lbUpdate();document.getElementById('lb').style.display='flex';}
function lbUpdate(){
  document.getElementById('lbImg').src=lbImgs[lbIdx];
  const n=lbImgs.length;
  const p=document.querySelector('.lb-p'),nx=document.querySelector('.lb-n'),ind=document.getElementById('lbInd'),th=document.getElementById('lbThumbs');
  if(n>1){p.style.display='flex';nx.style.display='flex';ind.textContent='صورة '+(lbIdx+1)+' من '+n;th.innerHTML='';lbImgs.forEach((s,i)=>{const img=document.createElement('img');img.src=s;img.className='lb-th'+(i===lbIdx?' active':'');img.onclick=()=>{lbIdx=i;lbUpdate();};th.appendChild(img);});}
  else{p.style.display='none';nx.style.display='none';ind.textContent='';th.innerHTML='';}
}
function lbPrev(){if(lbImgs.length<=1)return;lbIdx=(lbIdx-1+lbImgs.length)%lbImgs.length;lbUpdate();}
function lbNext(){if(lbImgs.length<=1)return;lbIdx=(lbIdx+1)%lbImgs.length;lbUpdate();}
function lbClose(e){document.getElementById('lb').style.display='none';}

/* ── Boot ── */
setupFilters();
render();
</script>
</body>
</html>`;
}

function exportHTMLArchive() {
    const htmlContent = generateArchiveHTML();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    a.href = url;
    a.download = `traffic_audit_archive_${dateStr}_${timeStr}.html`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(translations[currentLang].success_save);
    }, 100);
}
