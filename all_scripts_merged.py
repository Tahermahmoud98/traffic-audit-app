# === analyze_db.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "localStorage" in line or "dbStore" in line:
        print(f"{i}: {line.strip()}")


# === append_css.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\style.css"
with open(path, 'a', encoding='utf-8') as f:
    f.write("""
/* ===== SINGLE RECORD PRINT LAYOUT ===== */
.single-print-card {
    direction: rtl;
    color: #000;
    font-family: var(--font-main);
    padding: 20px;
    background: #fff;
}

.spc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #333;
    padding-bottom: 15px;
    margin-bottom: 20px;
}

.spc-header-right, .spc-header-left {
    flex: 1;
    font-size: 14px;
    line-height: 1.6;
}

.spc-header-center {
    flex: 2;
    text-align: center;
}

.spc-logo {
    width: 80px;
    height: auto;
    margin-bottom: 10px;
}

.spc-title {
    font-size: 20px;
    font-weight: bold;
    margin: 5px 0;
}

.spc-badge {
    display: inline-block;
    padding: 4px 12px;
    background: #f0f0f0;
    border-radius: 20px;
    font-size: 12px;
}

.spc-body-row {
    display: flex;
    flex-direction: row;
    gap: 20px;
    align-items: flex-start;
    justify-content: space-between;
}

.spc-info-side {
    flex: 1;
}

.spc-image-side {
    width: 45%;
    display: flex;
    flex-direction: column;
}

.spc-image-container {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 10px;
    text-align: center;
    background: #fafafa;
}

.spc-image-title {
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 10px;
}

.spc-table {
    width: 100%;
    border-collapse: collapse;
}

.spc-table th, .spc-table td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: right;
    font-size: 15px;
}

.spc-table th {
    width: 35%;
    font-weight: bold;
    background-color: #f9f9f9;
}

.amount-row th, .amount-row td {
    font-weight: bold;
    font-size: 16px;
    background-color: #f0f8ff;
}

.spc-signatures {
    display: flex;
    justify-content: space-between;
    margin-top: 50px;
    padding-top: 20px;
}

.spc-sig {
    text-align: center;
    flex: 1;
}

.sig-title {
    font-weight: bold;
    margin-bottom: 5px;
}

.sig-name {
    font-size: 14px;
}

@media print {
    .single-print-card {
        padding: 0;
    }
    .spc-table th, .spc-table td {
        border-color: #000;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    .spc-image-container {
        border-color: #000;
        background: transparent;
    }
    .amount-row th, .amount-row td {
        background-color: #e6f2ff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
}
""")


# === append_firebase_js.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'a', encoding='utf-8') as f:
    f.write("""

// ==========================================
// FIREBASE CLOUD SYNC MODULE
// ==========================================
window.firebaseInitialized = false;

function openFirebaseModal() {
    document.getElementById('firebase-modal').classList.add('active');
    const existing = localStorage.getItem('firebaseConfig');
    if (existing) {
        document.getElementById('firebase-config-input').value = existing;
    }
}

function saveFirebaseConfig() {
    const input = document.getElementById('firebase-config-input').value.trim();
    const statusEl = document.getElementById('firebase-status');
    statusEl.style.display = 'block';
    
    if (!input) {
        statusEl.textContent = 'يرجى إدخال الإعدادات.';
        statusEl.style.color = 'var(--danger)';
        return;
    }
    
    try {
        let configObj;
        let cleanInput = input;
        
        // Try to extract the object if they pasted the whole snippet
        const match = input.match(/const\s+firebaseConfig\s*=\s*(\{[\s\S]*?\});?/);
        if (match) {
            cleanInput = match[1];
        } else {
            const objMatch = input.match(/\{[\s\S]*apiKey[\s\S]*projectId[\s\S]*\}/);
            if (objMatch) {
                cleanInput = objMatch[0];
            }
        }

        try {
             configObj = (new Function("return " + cleanInput))();
        } catch(e) {
             configObj = JSON.parse(cleanInput);
        }
        
        if (!configObj || !configObj.apiKey || !configObj.projectId) {
            throw new Error("Invalid config format");
        }
        
        if (!configObj.databaseURL) {
            statusEl.textContent = 'الرابط databaseURL مفقود! يرجى إنشاء Realtime Database في فايربيس أولاً ثم نسخ الكود الجديد.';
            statusEl.style.color = 'var(--danger)';
            return;
        }
        
        localStorage.setItem('firebaseConfig', JSON.stringify(configObj));
        statusEl.textContent = 'تم حفظ الإعدادات بنجاح! سيتم تحديث الصفحة لتطبيقها...';
        statusEl.style.color = 'var(--success)';
        
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (e) {
        statusEl.textContent = 'خطأ في صيغة الإعدادات: تأكد من نسخ الكود بشكل صحيح.';
        statusEl.style.color = 'var(--danger)';
        console.error("Firebase config parse error", e);
    }
}

let isSyncingFromCloud = false;

function initFirebase() {
    const configStr = localStorage.getItem('firebaseConfig');
    if (!configStr) return;
    
    try {
        const configObj = JSON.parse(configStr);
        if (!window.firebaseInitialized) {
            firebase.initializeApp(configObj);
            window.firebaseInitialized = true;
            
            // Listen to real-time changes
            firebase.database().ref('appData').on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    isSyncingFromCloud = true; // prevent re-uploading
                    for (const key in data) {
                        originalSetItem.call(dbStore, key, data[key]);
                    }
                    isSyncingFromCloud = false;
                    
                    // Re-render current section to reflect new data
                    const activeSection = document.querySelector('.content-section.active');
                    if (activeSection) {
                        const secId = activeSection.id;
                        if(secId === 'central-receipts-section' || secId === 'decentral-receipts-section' || secId === 'special-receipts-section') renderReceipts();
                        else if(secId === 'delegations-section') renderDelegations();
                        else if(secId === 'children-section') renderChildren();
                        else if(secId === 'marriage-section') renderMarriage();
                        else if(secId === 'fines-section') renderFines();
                        else if(secId === 'stats-section') renderStats();
                    }
                }
            });
            console.log("Firebase initialized successfully.");
        }
    } catch (e) {
        console.error("Failed to initialize Firebase", e);
    }
}

// Proxy dbStore.setItem for automatic push
const originalSetItem = dbStore.setItem;
dbStore.setItem = function(key, valStr) {
    const res = originalSetItem.call(this, key, valStr);
    
    const tables = ['receipts', 'delegations', 'children', 'marriage', 'fines'];
    if (window.firebaseInitialized && tables.includes(key) && !isSyncingFromCloud) {
        firebase.database().ref('appData/' + key).set(valStr).catch(e => console.error("Firebase push error", e));
    }
    
    return res;
};

async function syncToCloud() {
    if (!window.firebaseInitialized) {
        alert("يرجى إعداد Firebase أولاً.");
        return;
    }
    const statusEl = document.getElementById('firebase-status');
    statusEl.style.display = 'block';
    statusEl.textContent = 'جاري الرفع إلى السحابة...';
    statusEl.style.color = 'var(--primary)';
    
    try {
        const tables = ['receipts', 'delegations', 'children', 'marriage', 'fines'];
        const updates = {};
        for(const key of tables) {
            updates[key] = dbStore._cache[key] || '[]';
        }
        await firebase.database().ref('appData').set(updates);
        
        statusEl.textContent = 'تم الرفع إلى السحابة بنجاح!';
        statusEl.style.color = 'var(--success)';
    } catch (e) {
        statusEl.textContent = 'فشل في الرفع إلى السحابة.';
        statusEl.style.color = 'var(--danger)';
        console.error(e);
    }
}

async function syncFromCloud() {
    if (!window.firebaseInitialized) {
        alert("يرجى إعداد Firebase أولاً.");
        return;
    }
    const statusEl = document.getElementById('firebase-status');
    statusEl.style.display = 'block';
    statusEl.textContent = 'جاري الاسترداد من السحابة...';
    statusEl.style.color = 'var(--primary)';
    
    try {
        const snapshot = await firebase.database().ref('appData').once('value');
        const data = snapshot.val();
        if (data) {
            isSyncingFromCloud = true;
            for (const key in data) {
                originalSetItem.call(dbStore, key, data[key]);
            }
            isSyncingFromCloud = false;
            
            statusEl.textContent = 'تم الاسترداد بنجاح! سيتم إعادة تحميل الصفحة.';
            statusEl.style.color = 'var(--success)';
            setTimeout(() => window.location.reload(), 1000);
        } else {
             statusEl.textContent = 'لا توجد بيانات في السحابة.';
             statusEl.style.color = 'var(--warning)';
        }
    } catch (e) {
        statusEl.textContent = 'فشل في الاسترداد من السحابة.';
        statusEl.style.color = 'var(--danger)';
        console.error(e);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initFirebase();
});

""")
print("Appended JS logic.")


# === fix.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix the missing exportData and openBackupModal
bad_part = """    // Reset label text
    const uploadText = document.getElementById('backup-upload-text');
    if (uploadText) uploadText.textContent = translations[currentLang].import_btn;

    openModal('backup-modal');
}
    }, 100);
}

function handleBackupFileSelect(event) {"""

good_part = """    // Reset label text
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

function handleBackupFileSelect(event) {"""

if bad_part in content:
    content = content.replace(bad_part, good_part)
    print("Fixed exportData")
else:
    print("bad_part not found")

# 2. Fix the incomplete updateAutocompletes loop
bad_auto = """            // Collect unique non-empty values for this field from previous records
            const uniqueValues = new Set();
            data.forEach(item => {
                const val = item[fieldName];
            });
        });"""

good_auto = """            // Collect unique non-empty values for this field from previous records
            const uniqueValues = new Set();
            data.forEach(item => {
                const val = item[fieldName];
                if (val && typeof val === 'string' && val.trim() !== '') {
                    uniqueValues.add(val.trim());
                }
            });

            // Populate datalist
            datalistEl.innerHTML = '';
            uniqueValues.forEach(val => {
                const option = document.createElement('option');
                option.value = val;
                datalistEl.appendChild(option);
            });
        });"""

if bad_auto in content:
    content = content.replace(bad_auto, good_auto)
    print("Fixed updateAutocompletes")
else:
    print("bad_auto not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)


# === fix2.py ===
import os
path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_part = """function openBackupModal() {
    // Reset to default view
    const defaultView = document.getElementById('backup-default-view');
    const confirmView = document.getElementById('backup-confirm-view');
            const hasRequiredKeys = Array.isArray(data.receipts) ||"""

good_part = """function openBackupModal() {
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
            const hasRequiredKeys = Array.isArray(data.receipts) ||"""

if bad_part in content:
    content = content.replace(bad_part, good_part)
    print("Fixed!")
else:
    print("Not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)


# === fix3.py ===
import os
path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad = """            // Set list attribute on input if not already set
            if (input.getAttribute('list') !== datalistId) {
                input.setAttribute('list', datalistId);
            }"""

good = """            // Set list attribute on input if not already set
            if (input.getAttribute('list') !== datalistId) {
                input.setAttribute('list', datalistId);
                input.setAttribute('autocomplete', 'off');
            }"""

content = content.replace(bad, good)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)


# === fix_bg_shape.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\style.css"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad = """/* Background Animated Shapes */
.bg-shape {
    position: absolute;
    filter: blur(100px);
    z-index: -1;
    border-radius: 50%;
    animation: float 20s infinite ease-in-out alternate;
}"""

good = """/* Background Animated Shapes */
.bg-shape {
    position: absolute;
    filter: blur(100px);
    z-index: -1;
    border-radius: 50%;
    animation: float 20s infinite ease-in-out alternate;
    pointer-events: none;
}"""

if bad in content:
    content = content.replace(bad, good)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed bg-shape")
else:
    print("Could not find exact bg-shape block")


# === fix_body_scrollbar.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\style.css"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad = """html,
body {
    scrollbar-width: none;
    -ms-overflow-style: none;}

html::-webkit-scrollbar,
body::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;}"""

good = """html,
body {
    /* Main scrollbar is now visible */
}"""

if bad in content:
    content = content.replace(bad, good)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed scrollbar visibility")
else:
    print("Could not find exact block to show scrollbar")


# === fix_conditional_table.py ===
import os
import re

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract from "// Build field rows based on section" to "    const bodyContent = hasImages"
start_str = "    // Build field rows based on section"
end_str = "    const bodyContent = hasImages ?"
start_idx = content.find(start_str)
end_idx = content.find(end_str)

new_logic = """    const hasImages = (key === 'receipts' && ((item.receipt_images && item.receipt_images.length > 0) || item.receipt_image));
    
    // Build field rows based on section
    let rows = '';
    if (hasImages) {
        if (key === 'receipts') {
            rows = `
                <thead>
                    <tr>
                        <th>${lang.lbl_receipt_type}</th>
                        <th>${lang.lbl_directorate}</th>
                        <th>${lang.lbl_department}</th>
                        <th>${lang.lbl_location}</th>
                        <th>${lang.lbl_date}</th>
                        <th>${lang.lbl_code}</th>
                        <th class="amount-row">${lang.lbl_amount}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${item.receipt_type === 'مركزي' ? lang.lbl_central : lang.lbl_decentral}</td>
                        <td>${item.directorate}</td>
                        <td>${item.department}</td>
                        <td>${item.location}</td>
                        <td>${item.date}</td>
                        <td>${item.code}</td>
                        <td class="amount-row">${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>
                    </tr>
                </tbody>
            `;
        }
    } else {
        if (key === 'receipts') {
            rows = `
                <tbody>
                    <tr><th>${lang.lbl_receipt_type}</th><td>${item.receipt_type === 'مركزي' ? lang.lbl_central : lang.lbl_decentral}</td></tr>
                    <tr><th>${lang.lbl_directorate}</th><td>${item.directorate}</td></tr>
                    <tr><th>${lang.lbl_department}</th><td>${item.department}</td></tr>
                    <tr><th>${lang.lbl_location}</th><td>${item.location}</td></tr>
                    <tr><th>${lang.lbl_date}</th><td>${item.date}</td></tr>
                    <tr><th>${lang.lbl_code}</th><td>${item.code}</td></tr>
                    <tr class="amount-row"><th>${lang.lbl_amount}</th><td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td></tr>
                </tbody>
            `;
        } else if (key === 'delegations') {
            rows = `
                <tbody>
                    <tr><th>${lang.th_name}</th><td>${item.name}</td></tr>
                    <tr><th>${lang.lbl_month}</th><td>${item.month}</td></tr>
                    <tr><th>${lang.lbl_count}</th><td>${item.count}</td></tr>
                    <tr><th>${lang.th_export}</th><td>${item.export_num}</td></tr>
                    <tr><th>${lang.th_import}</th><td>${item.import_num}</td></tr>
                    <tr><th>${lang.lbl_amount}</th><td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td></tr>
                    <tr class="amount-row"><th>${lang.lbl_total}</th><td>${parseFloat(item.total).toLocaleString()} ${lang.currency}</td></tr>
                </tbody>
            `;
        } else if (key === 'children') {
            rows = `
                <tbody>
                    <tr><th>${lang.lbl_father}</th><td>${item.father}</td></tr>
                    <tr><th>${lang.lbl_mother}</th><td>${item.mother}</td></tr>
                    <tr><th>${lang.lbl_child}</th><td>${item.child}</td></tr>
                    <tr><th>${lang.lbl_gender}</th><td>${item.gender === 'ذكر' ? lang.lbl_male : lang.lbl_female}</td></tr>
                    <tr><th>${lang.th_dob}</th><td>${item.dob}</td></tr>
                    <tr><th>${lang.th_arrival}</th><td>${item.arrival}</td></tr>
                    <tr class="amount-row"><th>${lang.lbl_amount}</th><td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td></tr>
                </tbody>
            `;
        } else if (key === 'marriage') {
            rows = `
                <tbody>
                    <tr><th>${lang.lbl_husband}</th><td>${item.husband}</td></tr>
                    <tr><th>${lang.lbl_wife}</th><td>${item.wife}</td></tr>
                    <tr><th>${lang.lbl_employee_gender || lang.lbl_gender}</th><td>${item.gender === 'ذكر' ? lang.lbl_male : lang.lbl_female}</td></tr>
                    <tr><th>${lang.th_marriage_date || lang.th_date}</th><td>${item.date}</td></tr>
                    <tr><th>${lang.th_arrival}</th><td>${item.arrival}</td></tr>
                    <tr class="amount-row"><th>${lang.lbl_amount}</th><td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td></tr>
                </tbody>
            `;
        } else if (key === 'fines') {
            rows = `
                <tbody>
                    <tr><th>${lang.lbl_book_type}</th><td>${item.book_type}</td></tr>
                    <tr><th>${lang.lbl_holder}</th><td>${item.holder}</td></tr>
                    <tr><th>${lang.lbl_book_num}</th><td>${item.book_number}</td></tr>
                    <tr><th>${lang.th_date}</th><td>${item.date}</td></tr>
                    <tr><th>${lang.lbl_location}</th><td>${item.location}</td></tr>
                    <tr class="amount-row"><th>${lang.lbl_total}</th><td>${parseFloat(item.total).toLocaleString()} ${lang.currency}</td></tr>
                </tbody>
            `;
        }
    }

    let imageSideHTML = '';
    if (hasImages) {
        let images = [];
        if (item.receipt_images && item.receipt_images.length > 0) {
            images = item.receipt_images;
        } else if (item.receipt_image) {
            images = [item.receipt_image];
        }
        
        let imagesTags = images.map(img => `<img src="${img}" class="spc-receipt-img" style="max-height: 450px; width: 100%; object-fit: contain; margin-bottom: 10px; border-radius: 8px; display: block; background: #fff;">`).join('');
        
        imageSideHTML = `
            <div class="spc-image-side" style="display: flex; flex-direction: column; gap: 8px;">
                <div class="spc-image-container" style="max-height: none; overflow: visible;">
                    <p class="spc-image-title">${lang.th_image}</p>
                    ${imagesTags}
                </div>
            </div>
        `;
    }

"""

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_logic + content[end_idx:]
    print("Replaced logic")

bad_body = """    const bodyContent = hasImages ? `
        <div class="spc-body-row">
            <div class="spc-info-side">
                <table class="spc-table">
                    ${rows}
                </table>
            </div>
            ${imageSideHTML}
        </div>
    ` : `
        <table class="spc-table">
            ${rows}
        </table>
    `;"""

good_body = """    const bodyContent = hasImages ? `
        <div class="spc-body-row">
            <div class="spc-info-side">
                <table class="spc-table spc-table-horizontal">
                    ${rows}
                </table>
            </div>
            ${imageSideHTML}
        </div>
    ` : `
        <table class="spc-table spc-table-vertical">
            ${rows}
        </table>
    `;"""
if bad_body in content:
    content = content.replace(bad_body, good_body)
    print("Replaced body content")

bad_css_1 = ".spc-table th { background:#f0f7fc; color:#1a1a2e; text-align:center; padding:9px 14px; font-size:12px; border:1px solid #dde; }"
bad_css_2 = ".spc-table td { padding:9px 14px; font-size:13px; border:1px solid #dde; text-align:center; }"

good_css_1 = ".spc-table th { background:#f0f7fc; color:#1a1a2e; padding:9px 14px; font-size:12px; border:1px solid #dde; }\n                .spc-table-vertical th { width:35%; text-align:right; }\n                .spc-table-vertical td { text-align:right; }\n                .spc-table-horizontal th, .spc-table-horizontal td { text-align:center; }"
good_css_2 = ".spc-table td { padding:9px 14px; font-size:13px; border:1px solid #dde; }"

content = content.replace(bad_css_1, good_css_1)
content = content.replace(bad_css_2, good_css_2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

path2 = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\style.css"
with open(path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

bad_th = """.spc-table th {
    font-weight: bold;
    background-color: #f9f9f9;
    text-align: center;
}"""
good_th = """.spc-table th {
    font-weight: bold;
    background-color: #f9f9f9;
}
.spc-table-vertical th {
    width: 35%;
    text-align: right;
}
.spc-table-vertical td {
    text-align: right;
}
.spc-table-horizontal th, .spc-table-horizontal td {
    text-align: center;
}"""
content2 = content2.replace(bad_th, good_th)

bad_td = """.spc-table th, .spc-table td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: center;
    font-size: 15px;
}"""
good_td = """.spc-table th, .spc-table td {
    border: 1px solid #ddd;
    padding: 12px;
    font-size: 15px;
}"""
content2 = content2.replace(bad_td, good_td)

with open(path2, 'w', encoding='utf-8') as f:
    f.write(content2)


# === fix_hasImages.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_hasImages = "    const hasImages = (key === 'receipts' && ((item.receipt_images && item.receipt_images.length > 0) || item.receipt_image));"
good_hasImages = """    const validImages = [];
    if (key === 'receipts') {
        if (item.receipt_images && item.receipt_images.length > 0) {
            item.receipt_images.forEach(img => {
                if (img && img.trim() !== '') validImages.push(img);
            });
        } else if (item.receipt_image && item.receipt_image.trim() !== '') {
            validImages.push(item.receipt_image);
        }
    }
    const hasImages = validImages.length > 0;"""

content = content.replace(bad_hasImages, good_hasImages)

bad_imagesTags = """    let imageSideHTML = '';
    if (hasImages) {
        let images = [];
        if (item.receipt_images && item.receipt_images.length > 0) {
            images = item.receipt_images;
        } else if (item.receipt_image) {
            images = [item.receipt_image];
        }
        
        let imagesTags = images.map(img => `<img src="${img}" class="spc-receipt-img" style="max-height: 450px; width: 100%; object-fit: contain; margin-bottom: 10px; border-radius: 8px; display: block; background: #fff;">`).join('');"""
        
good_imagesTags = """    let imageSideHTML = '';
    if (hasImages) {
        let imagesTags = validImages.map(img => `<img src="${img}" class="spc-receipt-img" style="max-height: 450px; width: 100%; object-fit: contain; margin-bottom: 10px; border-radius: 8px; display: block; background: #fff;">`).join('');"""

content = content.replace(bad_imagesTags, good_imagesTags)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)


# === fix_horizontal.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_rows = """    // Build field rows based on section
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
    }"""

good_rows = """    // Build field rows based on section
    let rows = '';
    if (key === 'receipts') {
        rows = `
            <thead>
                <tr>
                    <th>${lang.lbl_receipt_type}</th>
                    <th>${lang.lbl_directorate}</th>
                    <th>${lang.lbl_department}</th>
                    <th>${lang.lbl_location}</th>
                    <th>${lang.lbl_date}</th>
                    <th>${lang.lbl_code}</th>
                    <th class="amount-row">${lang.lbl_amount}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${item.receipt_type === 'مركزي' ? lang.lbl_central : lang.lbl_decentral}</td>
                    <td>${item.directorate}</td>
                    <td>${item.department}</td>
                    <td>${item.location}</td>
                    <td>${item.date}</td>
                    <td>${item.code}</td>
                    <td class="amount-row">${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>
                </tr>
            </tbody>
        `;
    } else if (key === 'delegations') {
        rows = `
            <thead>
                <tr>
                    <th>${lang.th_name}</th>
                    <th>${lang.lbl_month}</th>
                    <th>${lang.lbl_count}</th>
                    <th>${lang.th_export}</th>
                    <th>${lang.th_import}</th>
                    <th>${lang.lbl_amount}</th>
                    <th class="amount-row">${lang.lbl_total}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${item.name}</td>
                    <td>${item.month}</td>
                    <td>${item.count}</td>
                    <td>${item.export_num}</td>
                    <td>${item.import_num}</td>
                    <td>${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>
                    <td class="amount-row">${parseFloat(item.total).toLocaleString()} ${lang.currency}</td>
                </tr>
            </tbody>
        `;
    } else if (key === 'children') {
        rows = `
            <thead>
                <tr>
                    <th>${lang.lbl_father}</th>
                    <th>${lang.lbl_mother}</th>
                    <th>${lang.lbl_child}</th>
                    <th>${lang.lbl_gender}</th>
                    <th>${lang.th_dob}</th>
                    <th>${lang.th_arrival}</th>
                    <th class="amount-row">${lang.lbl_amount}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${item.father}</td>
                    <td>${item.mother}</td>
                    <td>${item.child}</td>
                    <td>${item.gender === 'ذكر' ? lang.lbl_male : lang.lbl_female}</td>
                    <td>${item.dob}</td>
                    <td>${item.arrival}</td>
                    <td class="amount-row">${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>
                </tr>
            </tbody>
        `;
    } else if (key === 'marriage') {
        rows = `
            <thead>
                <tr>
                    <th>${lang.lbl_husband}</th>
                    <th>${lang.lbl_wife}</th>
                    <th>${lang.lbl_employee_gender || lang.lbl_gender}</th>
                    <th>${lang.th_marriage_date || lang.th_date}</th>
                    <th>${lang.th_arrival}</th>
                    <th class="amount-row">${lang.lbl_amount}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${item.husband}</td>
                    <td>${item.wife}</td>
                    <td>${item.gender === 'ذكر' ? lang.lbl_male : lang.lbl_female}</td>
                    <td>${item.date}</td>
                    <td>${item.arrival}</td>
                    <td class="amount-row">${parseFloat(item.amount).toLocaleString()} ${lang.currency}</td>
                </tr>
            </tbody>
        `;
    } else if (key === 'fines') {
        rows = `
            <thead>
                <tr>
                    <th>${lang.lbl_book_type}</th>
                    <th>${lang.lbl_holder}</th>
                    <th>${lang.lbl_book_num}</th>
                    <th>${lang.th_date}</th>
                    <th>${lang.lbl_location}</th>
                    <th class="amount-row">${lang.lbl_total}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${item.book_type}</td>
                    <td>${item.holder}</td>
                    <td>${item.book_number}</td>
                    <td>${item.date}</td>
                    <td>${item.location}</td>
                    <td class="amount-row">${parseFloat(item.total).toLocaleString()} ${lang.currency}</td>
                </tr>
            </tbody>
        `;
    }"""

bad_body = """    const bodyContent = hasImages ? `
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
    `;"""

good_body = """    const bodyContent = hasImages ? `
        <div class="spc-body-row">
            <div class="spc-info-side">
                <table class="spc-table">
                    ${rows}
                </table>
            </div>
            ${imageSideHTML}
        </div>
    ` : `
        <table class="spc-table">
            ${rows}
        </table>
    `;"""

if bad_rows in content:
    content = content.replace(bad_rows, good_rows)
    print("Replaced rows")
else:
    print("Could not find rows")

if bad_body in content:
    content = content.replace(bad_body, good_body)
    print("Replaced body")
else:
    print("Could not find body")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)


# === fix_img.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the inline styling of the image tag
old_img = """let imagesTags = images.map(img => `<img src="${img}" class="spc-receipt-img" style="max-height: 250px; object-fit: contain; margin-bottom: 10px; border-radius: 6px; display: block; width: 100%;">`).join('');"""
new_img = """let imagesTags = images.map(img => `<img src="${img}" class="spc-receipt-img" style="max-height: 450px; width: 100%; object-fit: contain; margin-bottom: 10px; border-radius: 8px; display: block; background: #fff;">`).join('');"""

# Just in case there are subtle spacing differences, let's use replace
content = content.replace(old_img, new_img)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)


# === fix_img_width.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\style.css"
with open(path, 'a', encoding='utf-8') as f:
    f.write("""
/* Make image take more space */
.spc-image-side {
    width: 55% !important;
}
.spc-info-side {
    width: 40% !important;
}
""")


# === fix_preview_layout.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\style.css"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad1 = """
.spc-body-row {
    display: flex;
    flex-direction: row;
    gap: 20px;
    align-items: flex-start;
    justify-content: space-between;
}
"""

good1 = """
.spc-body-row {
    display: flex;
    flex-direction: column;
    gap: 25px;
    align-items: center;
    justify-content: center;
}
"""

bad2 = """
.spc-image-side {
    width: 45%;
    display: flex;
    flex-direction: column;
}
"""

good2 = """
.spc-image-side {
    width: 100%;
    display: flex;
    flex-direction: column;
}
"""

if bad1 in content:
    content = content.replace(bad1, good1)
    print("Fixed preview body-row")
if bad2 in content:
    content = content.replace(bad2, good2)
    print("Fixed preview image-side")

# Remove the previously appended overrides
bad3 = """/* Make image take more space */
.spc-image-side {
    width: 55% !important;
}
.spc-info-side {
    width: 40% !important;
}"""
if bad3 in content:
    content = content.replace(bad3, "")
    print("Removed !important overrides")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)


# === fix_print_layout.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_css = """                .spc-body-row { display:flex; gap:20px; align-items:flex-start; margin-top:10px; width:100%; }
                .spc-info-side { flex:1 1 55%; }
                .spc-image-side { flex:1 1 45%; text-align:center; }
                .spc-image-container { border:1px solid #ddd; border-radius:8px; padding:10px; background:#f9f9f9; }
                .spc-receipt-img { max-width:100%; max-height:280px; object-fit:contain; border-radius:6px; display:block; margin:0 auto; }"""

good_css = """                .spc-body-row { display:flex; flex-direction:column; gap:25px; align-items:center; margin-top:15px; width:100%; }
                .spc-info-side { width:100%; }
                .spc-image-side { width:100%; text-align:center; }
                .spc-image-container { border:1px solid #ddd; border-radius:8px; padding:15px; background:#f9f9f9; width: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                .spc-receipt-img { max-width:100%; max-height:500px; object-fit:contain; border-radius:6px; display:block; margin:0 auto; border: 1px solid #ccc; }"""

if bad_css in content:
    content = content.replace(bad_css, good_css)
    print("Replaced CSS layout!")
else:
    print("bad_css not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)


# === fix_scrollbar.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\style.css"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad = """::-webkit-scrollbar-thumb {
    background: linear-gradient(var(--primary), #8B5CF6);
    border-radius: 10px;
    border: 3px solid #0d121f; /* Creates a modern floating thumb look */
}"""

good = """::-webkit-scrollbar-thumb {
    background: linear-gradient(var(--primary), #8B5CF6);
    border-radius: 10px;
    border: 3px solid var(--background); /* Creates a modern floating thumb look */
}"""

if bad in content:
    content = content.replace(bad, good)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed scrollbar thumb border")
else:
    print("Could not find exact scrollbar thumb block")


# === fix_sig_bottom.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad = """                @media print {
                    @page { margin:1.5cm; }
                    body { display:block; }
                    .single-print-card { display:block; }
                    .spc-signatures { margin-top:100px !important; padding-top:20px; }
                }"""

good = """                @media print {
                    @page { margin:1.5cm; }
                    body { display:block; }
                    .single-print-card { display:block; padding-bottom: 120px; }
                    .spc-signatures { position: fixed; bottom: 0; left: 0; right: 0; margin-top: 0 !important; padding-top: 20px; padding-bottom: 20px; background: #fff; }
                }"""

if bad in content:
    content = content.replace(bad, good)
    print("Fixed signatures position in app.js print window")
else:
    print("Could not find the print media query in app.js")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)


path2 = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\style.css"
with open(path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

bad2 = """@media print {
    .single-print-card {
        padding: 0;
    }
    .spc-table th, .spc-table td {"""

good2 = """@media print {
    .single-print-card {
        padding: 0;
        padding-bottom: 120px;
    }
    .spc-signatures {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        margin-top: 0 !important;
        padding-top: 20px;
        padding-bottom: 20px;
        background: #fff;
    }
    .spc-table th, .spc-table td {"""

if bad2 in content2:
    content2 = content2.replace(bad2, good2)
    print("Fixed signatures position in style.css print media")
else:
    print("Could not find the print media query in style.css")

with open(path2, 'w', encoding='utf-8') as f:
    f.write(content2)


# === fix_th_width.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_css = ".spc-table th { background:#f0f7fc; color:#1a1a2e; text-align:right; padding:9px 14px; font-size:12px; width:35%; border:1px solid #dde; }"
good_css = ".spc-table th { background:#f0f7fc; color:#1a1a2e; text-align:center; padding:9px 14px; font-size:12px; border:1px solid #dde; }"

content = content.replace(bad_css, good_css)

bad_td_css = ".spc-table td { padding:9px 14px; font-size:13px; border:1px solid #dde; }"
good_td_css = ".spc-table td { padding:9px 14px; font-size:13px; border:1px solid #dde; text-align:center; }"

content = content.replace(bad_td_css, good_td_css)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

path2 = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\style.css"
with open(path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

bad_th = """
.spc-table th {
    width: 35%;
    font-weight: bold;
    background-color: #f9f9f9;
}
"""
good_th = """
.spc-table th {
    font-weight: bold;
    background-color: #f9f9f9;
    text-align: center;
}
"""
content2 = content2.replace(bad_th, good_th)

bad_td = """
.spc-table th, .spc-table td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: right;
    font-size: 15px;
}
"""
good_td = """
.spc-table th, .spc-table td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: center;
    font-size: 15px;
}
"""
content2 = content2.replace(bad_td, good_td)

with open(path2, 'w', encoding='utf-8') as f:
    f.write(content2)


# === hide_firebase_btn.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\index.html"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the firebase button and hide it
bad_btn = """<button class="btn-firebase" onclick="openFirebaseModal()" data-tr-title="firebase_btn" title="الربط السحابي" style="background: linear-gradient(135deg, #ffca28, #f57c00); color: #fff; border: none; padding: 10px 15px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(245, 124, 0, 0.3); transition: all 0.3s ease;">"""
good_btn = """<button class="btn-firebase" onclick="openFirebaseModal()" data-tr-title="firebase_btn" title="الربط السحابي" style="display: none !important;">"""

content = content.replace(bad_btn, good_btn)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Firebase button hidden.")


# === inject_alert.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_logic = """                        firebase.database().ref('appData').set(updates).then(() => {
                            console.log("Auto-sync complete.");
                        });"""

good_logic = """                        firebase.database().ref('appData').set(updates).then(() => {
                            console.log("Auto-sync complete.");
                            alert("✅ تم رفع جميع بياناتك القديمة إلى السحابة بنجاح!");
                        }).catch((err) => {
                            alert("❌ حدث خطأ أثناء الرفع للسحابة، قد تكون المشكلة في (Rules): " + err.message);
                        });"""

content = content.replace(bad_logic, good_logic)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated initFirebase with alert logic.")


# === inject_auto_upload.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_logic = """                        else if(secId === 'fines-section') renderFines();
                        else if(secId === 'stats-section') renderStats();
                    }
                }
            });"""

good_logic = """                        else if(secId === 'fines-section') renderFines();
                        else if(secId === 'stats-section') renderStats();
                    }
                } else {
                    // Cloud is empty, automatically upload local data!
                    console.log("Cloud is empty. Auto-syncing local data to cloud...");
                    const tables = ['receipts', 'delegations', 'children', 'marriage', 'fines'];
                    const updates = {};
                    let hasLocalData = false;
                    for(const key of tables) {
                        const localData = dbStore._cache[key] || localStorage.getItem(key);
                        if (localData && localData !== '[]') {
                            updates[key] = localData;
                            hasLocalData = true;
                        }
                    }
                    if (hasLocalData) {
                        firebase.database().ref('appData').set(updates).then(() => {
                            console.log("Auto-sync complete.");
                        });
                    }
                }
            });"""

content = content.replace(bad_logic, good_logic)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated initFirebase with auto-upload logic.")


# === inject_firebase_html.py ===
import os
import re

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\index.html"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Firebase scripts to head
firebase_scripts = """    <!-- Firebase App (the core Firebase SDK) is always required and must be listed first -->
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
    <!-- Add Firebase products that you want to use -->
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js"></script>
</head>"""

content = content.replace("</head>", firebase_scripts)

# 2. Add header button
header_button = """                    <button class="btn-firebase" onclick="openFirebaseModal()" data-tr-title="firebase_btn" title="الربط السحابي" style="background: linear-gradient(135deg, #ffca28, #f57c00); color: #fff; border: none; padding: 10px 15px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(245, 124, 0, 0.3); transition: all 0.3s ease;">
                        <i class="fa-solid fa-cloud"></i>
                        <span data-tr="firebase_btn">الربط السحابي</span>
                    </button>
                </div>"""

content = content.replace("</div>\n            </header>", header_button + "\n            </header>")

# 3. Add Firebase Modal HTML
firebase_modal = """
    <!-- ===== FIREBASE MODAL ===== -->
    <div class="modal glass-panel no-print" id="firebase-modal" style="max-width: 520px;">
        <div class="modal-header">
            <h3>
                <i class="fa-solid fa-cloud" style="margin-left:10px; color:#f57c00"></i>
                <span data-tr="firebase_modal_title">إعدادات الربط السحابي (Firebase)</span>
            </h3>
            <button class="close-btn" type="button" onclick="closeAllModals()"><i class="fa-solid fa-times"></i></button>
        </div>
        <div class="modal-body">
            <p style="margin-bottom: 15px; font-size: 14px; color: var(--text-muted); line-height: 1.6;" data-tr="firebase_desc">
                قم بلصق كود الإعدادات الخاص بمشروعك (firebaseConfig) لتفعيل التخزين السحابي والمزامنة التلقائية.
            </p>
            <div class="form-group">
                <textarea id="firebase-config-input" class="form-control" style="height: 150px; direction: ltr; font-family: monospace;" placeholder='{\n  apiKey: "...",\n  authDomain: "...",\n  databaseURL: "...",\n  projectId: "...",\n  storageBucket: "...",\n  messagingSenderId: "...",\n  appId: "..."\n}'></textarea>
            </div>
            
            <div id="firebase-status" style="margin-top: 15px; padding: 10px; border-radius: 8px; display: none; text-align: center; font-weight: bold;"></div>

            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--surface-border); border-radius: 12px; padding: 20px; margin-top: 20px; display: flex; flex-direction: column; gap: 12px; align-items: center; text-align: center;">
                <button type="button" onclick="saveFirebaseConfig()" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px; background: linear-gradient(135deg, var(--success), #059669); color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                    <i class="fa-solid fa-check"></i>
                    <span data-tr="save_firebase_config">حفظ الإعدادات والاتصال</span>
                </button>
                <div style="display: flex; gap: 10px; width: 100%;">
                    <button type="button" onclick="syncToCloud()" style="flex: 1; display: flex; justify-content: center; align-items: center; gap: 8px; background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                        <i class="fa-solid fa-cloud-arrow-up"></i>
                        <span data-tr="sync_to_cloud">رفع للسحابة</span>
                    </button>
                    <button type="button" onclick="syncFromCloud()" style="flex: 1; display: flex; justify-content: center; align-items: center; gap: 8px; background: linear-gradient(135deg, #8e44ad, #9b59b6); color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                        <i class="fa-solid fa-cloud-arrow-down"></i>
                        <span data-tr="sync_from_cloud">استرداد من السحابة</span>
                    </button>
                </div>
            </div>
            
            <div class="modal-footer" style="padding: 20px 0 0 0; margin-top: 15px;">
                <button type="button" class="btn-secondary" onclick="closeAllModals()" data-tr="close_btn" style="width: 100%;">إغلاق</button>
            </div>
        </div>
    </div>
"""

content = content.replace("    <!-- ===== BACKUP & RESTORE MODAL ===== -->", firebase_modal + "\n    <!-- ===== BACKUP & RESTORE MODAL ===== -->")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Injected HTML successfully.")


# === inject_hardcoded_firebase.py ===
import os

path = r"c:\Users\Laptop Duhok\Desktop\traffic-audit-app-main\app.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_init = """function initFirebase() {
    const configStr = localStorage.getItem('firebaseConfig');
    if (!configStr) return;
    
    try {
        const configObj = JSON.parse(configStr);"""

good_init = """function initFirebase() {
    const configStr = localStorage.getItem('firebaseConfig');
    let configObj = null;
    
    try {
        if (configStr) {
            configObj = JSON.parse(configStr);
        } else {
            // Hardcoded config provided by user
            configObj = {
              apiKey: "AIzaSyC1or4aNIDNdA5oDxJQNZ-YPlN7YTxvVDE",
              authDomain: "traffic-audit.firebaseapp.com",
              databaseURL: "https://traffic-audit-default-rtdb.firebaseio.com",
              projectId: "traffic-audit",
              storageBucket: "traffic-audit.firebasestorage.app",
              messagingSenderId: "991603683928",
              appId: "1:991603683928:web:4100285097d634b5dbd02d",
              measurementId: "G-JQWE1NTZTF"
            };
        }
"""

# Wait, databaseURL is missing from the user's config because new Firebase projects don't always show it if RTDB wasn't created before grabbing the config.
# The default RTDB URL format is: "https://<PROJECT_ID>-default-rtdb.firebaseio.com"
# So I added it manually above to ensure RTDB works!

content = content.replace(bad_init, good_init)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Config injected!")


