(() => {
    'use strict';

    const LINE_ID = '@annbusiness';
    const PHONE = '0915990938';
    const MAX_FILE_BYTES = 25 * 1024 * 1024;
    const MAX_FILES = 10;
    const EXTENSIONS = new Set(['stl', 'step', 'stp', 'dxf', 'ai', 'pdf', 'jpg', 'jpeg', 'png']);

    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('quoteForm');
        const preview = document.getElementById('quotePreview');
        const message = document.getElementById('quoteMessage');
        const sendLine = document.getElementById('sendQuoteLine');
        const quoteStatus = document.getElementById('quoteStatus');
        const contactStatus = document.getElementById('contactStatus');
        const fileInput = document.getElementById('fileInput');
        const dropZone = document.getElementById('dropZone');
        const fileError = document.getElementById('fileError');
        const queue = document.getElementById('fileQueue');
        let files = [];
        let copyBeforeOpening = false;

        const today = new Date();
        const dateInput = document.getElementById('quoteDate');
        dateInput.min = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');

        function value(id) {
            return document.getElementById(id).value.trim();
        }

        function buildMessage() {
            const dueDate = value('quoteDate');
            const date = dueDate ? dueDate.split('-').reverse().join('/') : 'ให้ทีมแนะนำระยะเวลา';
            return [
                'ขอใบเสนอราคา A&N 3D MAX',
                `ผู้ติดต่อ: ${value('quoteName')}`,
                `ติดต่อกลับ: ${value('quoteReply')}`,
                `ประเภทงาน: ${value('quoteService')}`,
                `จำนวน: ${value('quoteQuantity')} ชิ้น`,
                `วัสดุ / สี: ${value('quoteMaterial') || 'ขอคำแนะนำจากทีม'}`,
                `วันที่ต้องการรับงาน: ${date}`,
                `รายละเอียด: ${value('quoteDetails')}`,
                '',
                files.length ? `รายการไฟล์ที่จะแนบ (${files.length} ไฟล์):` : 'ไฟล์งาน: ยังไม่มีไฟล์แนบ',
                ...files.map((file, index) => `${index + 1}. ${file.name} (${formatSize(file.size)})`),
                files.length ? 'รายการนี้เป็นเพียงชื่อไฟล์ ผู้ขอราคาต้องแนบไฟล์จริงในแชตด้วย' : '',
                'กรุณาตรวจสอบรายละเอียดและยืนยันราคากับระยะเวลาผลิต',
            ].filter(line => line !== '').join('\n');
        }

        function updatePreview() {
            if (preview.hidden) return;
            const valid = form.checkValidity();
            message.value = buildMessage();
            if (valid) {
                const composeUrl = `https://line.me/R/oaMessage/${encodeURIComponent(LINE_ID)}/?${encodeURIComponent(message.value)}`;
                // Very long links are unreliable in mobile and in-app browsers.
                copyBeforeOpening = composeUrl.length > 7500;
                sendLine.href = copyBeforeOpening ? `https://line.me/R/ti/p/${encodeURIComponent(LINE_ID)}` : composeUrl;
                document.getElementById('sendQuoteLineLabel').textContent = copyBeforeOpening ? 'คัดลอกแล้วเปิด LINE' : 'เปิด LINE พร้อมข้อความ';
                sendLine.removeAttribute('aria-disabled');
                sendLine.removeAttribute('tabindex');
            } else {
                sendLine.removeAttribute('href');
                sendLine.setAttribute('aria-disabled', 'true');
                sendLine.tabIndex = -1;
            }
            quoteStatus.textContent = valid ? 'ข้อความพร้อมแล้ว กดเปิด LINE เพื่อตรวจและส่งต่อให้ทีม' : 'กรุณากรอกช่องที่มี * ให้ครบก่อนเปิด LINE';
        }

        function formatSize(bytes) {
            return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }

        function renderQueue() {
            queue.replaceChildren();
            document.getElementById('fileCount').textContent = files.length;
            document.getElementById('fileQueueWrap').classList.toggle('hidden', files.length === 0);
            files.forEach((file, index) => {
                const item = document.createElement('li');
                item.className = 'file-item';
                const details = document.createElement('div');
                details.className = 'file-meta';
                const name = document.createElement('strong');
                name.textContent = file.name;
                const size = document.createElement('span');
                size.textContent = `${formatSize(file.size)} · รอแนบใน LINE`;
                details.append(name, size);
                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'file-remove';
                remove.textContent = '×';
                remove.setAttribute('aria-label', `ลบไฟล์ ${file.name}`);
                remove.addEventListener('click', () => {
                    files.splice(index, 1);
                    fileError.textContent = '';
                    renderQueue();
                });
                item.append(details, remove);
                queue.append(item);
            });
            updatePreview();
        }

        function addFiles(incoming) {
            const errors = [];
            Array.from(incoming).forEach(file => {
                const extension = file.name.split('.').pop().toLowerCase();
                if (!EXTENSIONS.has(extension)) errors.push(`${file.name}: ไม่รองรับไฟล์ประเภทนี้`);
                else if (file.size > MAX_FILE_BYTES) errors.push(`${file.name}: ขนาดเกิน 25 MB`);
                else if (file.size === 0) errors.push(`${file.name}: ไฟล์ว่าง กรุณาเลือกใหม่`);
                else if (files.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) return;
                else if (files.length >= MAX_FILES) errors.push('เลือกได้สูงสุด 10 ไฟล์');
                else files.push(file);
            });
            fileError.textContent = [...new Set(errors)].join(' · ');
            renderQueue();
        }

        async function copyText(text, status, success) {
            try {
                if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
                await navigator.clipboard.writeText(text);
                status.textContent = success;
                return;
            } catch { /* HTTP and some in-app browsers require the selection fallback. */ }

            const previousFocus = document.activeElement;
            const helper = document.createElement('textarea');
            helper.value = text;
            helper.style.cssText = 'position:fixed;left:0;top:0;opacity:0;';
            document.body.append(helper);
            helper.focus();
            helper.select();
            let copied = false;
            try { copied = document.execCommand('copy'); } catch { /* Show manual instructions below. */ }
            helper.remove();
            previousFocus?.focus({ preventScroll: true });
            status.textContent = copied ? success : 'คัดลอกอัตโนมัติไม่ได้ กรุณาเลือกข้อความแล้วคัดลอกด้วยตัวเอง';
            if (!copied && status === quoteStatus) {
                message.focus();
                message.select();
            }
        }

        // Required text inputs must contain more than whitespace.
        ['quoteName', 'quoteReply', 'quoteDetails'].forEach(id => {
            const input = document.getElementById(id);
            const validate = () => input.setCustomValidity(input.value.trim() ? '' : 'กรุณากรอกข้อมูลในช่องนี้');
            input.addEventListener('input', validate);
            validate();
        });
        form.addEventListener('submit', event => {
            event.preventDefault();
            if (!form.reportValidity()) return;
            preview.hidden = false;
            updatePreview();
            preview.scrollIntoView({ behavior: 'auto', block: 'nearest' });
            message.focus({ preventScroll: true });
        });
        form.addEventListener('input', updatePreview);
        form.addEventListener('change', updatePreview);
        sendLine.addEventListener('click', event => {
            if (!form.reportValidity()) { event.preventDefault(); return; }
            updatePreview();
            quoteStatus.textContent = 'กำลังเปิด LINE · กรุณากดส่งในแชตและแนบไฟล์จริง เว็บไซต์ยังไม่ได้ส่งงานให้ทีม';
            if (copyBeforeOpening) {
                copyText(message.value, quoteStatus, 'คัดลอกแล้ว วางข้อความในแชต @annbusiness และแนบไฟล์จริงก่อนส่ง');
            }
        });
        document.getElementById('copyQuote').addEventListener('click', () => {
            if (!form.reportValidity()) return;
            updatePreview();
            copyText(message.value, quoteStatus, 'คัดลอกแล้ว วางในแชต @annbusiness แล้วแนบไฟล์และกดส่งได้เลย');
        });
        document.getElementById('copyLineId').addEventListener('click', () => copyText(LINE_ID, contactStatus, 'คัดลอก LINE ID @annbusiness แล้ว'));
        document.getElementById('copyPhone').addEventListener('click', () => copyText(PHONE, contactStatus, 'คัดลอกเบอร์ 091-599-0938 แล้ว'));
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); }
        });
        fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });
        ['dragenter', 'dragover'].forEach(type => dropZone.addEventListener(type, event => {
            event.preventDefault();
            dropZone.classList.add('drop-active');
        }));
        ['dragleave', 'drop'].forEach(type => dropZone.addEventListener(type, event => {
            event.preventDefault();
            dropZone.classList.remove('drop-active');
        }));
        dropZone.addEventListener('drop', event => addFiles(event.dataTransfer.files));
        document.getElementById('clearFiles').addEventListener('click', () => {
            files = [];
            fileInput.value = '';
            fileError.textContent = '';
            renderQueue();
        });
    });
})();
