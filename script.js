/**
 * CrimeScene Record - Application Logic
 * Professional Digital Evidence Documentation System
 */

const STORAGE_KEY = 'crimeSceneEvidenceRecords';
const SESSION_KEY = 'csr_session_active';

const DEMO_USER = {
    username: 'officer',
    password: 'Forensic@123'
};

// Initial Seed Data
const SEED_DATA = [
    {
        caseId: 'CASE-2026-001',
        evidenceId: 'EVID-101',
        evidenceType: 'Biological Sample',
        description: 'Swab from primary entry point; suspected blood splatter.',
        collectionDate: '2026-10-20',
        collectionTime: '14:30',
        collectionLocation: 'Living Room - North Wall',
        collectedBy: 'Officer S. Bandopadhyay',
        storageLocation: 'Vault A, Shelf 1, Box 4',
        status: 'Under Examination',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        caseId: 'CASE-2026-001',
        evidenceId: 'EVID-102',
        evidenceType: 'Digital Evidence',
        description: 'Smartphone (iPhone 13) recovered from bedside table.',
        collectionDate: '2026-10-20',
        collectionTime: '15:15',
        collectionLocation: 'Bedroom 1',
        collectedBy: 'Officer D. Barui',
        storageLocation: 'Digital Lab - Locker 12',
        status: 'In Storage',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        caseId: 'CASE-2026-002',
        evidenceId: 'EVID-201',
        evidenceType: 'Weapon or Object',
        description: 'Stainless steel kitchen knife, 8-inch blade, stained.',
        collectionDate: '2026-10-22',
        collectionTime: '09:00',
        collectionLocation: 'Kitchen - Sink Area',
        collectedBy: 'Officer T. Gazi',
        storageLocation: 'Vault B, Shelf 2, Box 1',
        status: 'Sent to Laboratory',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        caseId: 'CASE-2026-003',
        evidenceId: 'EVID-301',
        evidenceType: 'Document',
        description: 'Handwritten note found in wastepaper basket.',
        collectionDate: '2026-10-25',
        collectionTime: '11:20',
        collectionLocation: 'Study - Desk',
        collectedBy: 'Officer L. Messi',
        storageLocation: 'Vault A, Shelf 4, Box 2',
        status: 'Archived',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const app = {
    state: {
        records: [],
        currentUser: null,
        currentScreen: 'screen-login'
    },

    init() {
        this.loadData();
        this.setupEventListeners();
        this.checkSession();
        this.updateDate();
        this.renderDashboard();
        this.renderRecords();
    },

    loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                this.state.records = JSON.parse(stored);
            } catch (e) {
                console.error("Data corruption detected", e);
                this.state.records = [];
            }
        } else {
            this.state.records = SEED_DATA;
            this.saveData();
        }
    },

    saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.records));
    },

    updateDate() {
        const dateEl = document.getElementById('current-date');
        if (dateEl) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            dateEl.textContent = new Date().toLocaleDateString('en-US', options);
        }
    },

    checkSession() {
        const session = sessionStorage.getItem(SESSION_KEY);
        const remember = localStorage.getItem('csr_remember_me');

        if (session || remember) {
            this.state.currentUser = 'Forensic Officer';
            this.navigateTo('screen-dashboard', true);
        }
    },

    navigateTo(screenId, bypassAuth = false) {
        // Auth protection
        if (!bypassAuth && screenId !== 'screen-login') {
            if (!sessionStorage.getItem(SESSION_KEY) && !localStorage.getItem('csr_remember_me')) {
                this.navigateTo('screen-login');
                return;
            }
        }

        // Update UI
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

        if (screenId === 'screen-login') {
            document.getElementById('screen-login').classList.add('active');
            document.getElementById('app-shell').classList.add('hidden');
        } else {
            document.getElementById('screen-login').classList.remove('active');
            document.getElementById('app-shell').classList.remove('hidden');
            document.getElementById(screenId).classList.add('active');

            // Update Sidebar
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.screen === screenId);
            });
        }

        this.state.currentScreen = screenId;

        // Trigger renders if needed
        if (screenId === 'screen-dashboard') this.renderDashboard();
        if (screenId === 'screen-records') this.renderRecords();
    },

    setupEventListeners() {
        // Login Form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('toggle-password').addEventListener('click', (e) => {
            const pwInput = document.getElementById('password');
            const btn = e.target;
            if (pwInput.type === 'password') {
                pwInput.type = 'text';
                btn.textContent = 'Hide';
            } else {
                pwInput.type = 'password';
                btn.textContent = 'Show';
            }
        });

        document.getElementById('copy-creds').addEventListener('click', () => {
            navigator.clipboard.writeText('officer / Forensic@123');
            this.showToast('Credentials copied to clipboard');
        });

        // Sidebar Nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(item.dataset.screen);
            });
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            sessionStorage.removeItem(SESSION_KEY);
            localStorage.removeItem('csr_remember_me');
            this.navigateTo('screen-login');
            this.showToast('Logged out successfully');
        });

        // Evidence Form
        document.getElementById('evidence-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSaveEvidence();
        });

        document.getElementById('btn-reset-form').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all entered data?')) {
                document.getElementById('evidence-form').reset();
                this.generateEvidenceId();
            }
        });

        document.getElementById('btn-cancel-form').addEventListener('click', () => {
            this.navigateTo('screen-records');
        });

        // Records Filters
        document.getElementById('search-input').addEventListener('input', () => this.renderRecords());
        document.getElementById('filter-type').addEventListener('change', () => this.renderRecords());
        document.getElementById('filter-status').addEventListener('change', () => this.renderRecords());

        document.getElementById('btn-print').addEventListener('click', () => {
            window.print();
        });

        // Modal Close
        document.querySelector('.btn-close').addEventListener('click', () => {
            document.getElementById('modal-overlay').classList.add('hidden');
        });

        // Auto-generate ID on load
        this.generateEvidenceId();
    },

    handleLogin() {
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        const remember = document.getElementById('remember-me').checked;
        const errorEl = document.getElementById('login-error');

        if (user === DEMO_USER.username && pass === DEMO_USER.password) {
            errorEl.classList.add('hidden');
            sessionStorage.setItem(SESSION_KEY, 'true');
            if (remember) {
                localStorage.setItem('csr_remember_me', 'true');
            } else {
                localStorage.removeItem('csr_remember_me');
            }
            this.navigateTo('screen-dashboard', true);
            this.showToast('Access Granted. Welcome, Officer.');
        } else {
            errorEl.classList.remove('hidden');
        }
    },

    generateEvidenceId() {
        const idInput = document.getElementById('evidenceId');
        if (!idInput) return;

        const nextNum = this.state.records.length + 1;
        const suggestedId = `EVID-${String(nextNum).padStart(3, '0')}`;
        idInput.value = suggestedId;
    },

    handleSaveEvidence() {
        const form = document.getElementById('evidence-form');
        const formData = {
            caseId: document.getElementById('caseId').value,
            evidenceId: document.getElementById('evidenceId').value,
            evidenceType: document.getElementById('evidenceType').value,
            description: document.getElementById('description').value,
            collectionDate: document.getElementById('collectionDate').value,
            collectionTime: document.getElementById('collectionTime').value,
            collectionLocation: document.getElementById('collectionLocation').value,
            collectedBy: document.getElementById('collectedBy').value,
            storageLocation: document.getElementById('storageLocation').value,
            status: document.getElementById('status').value,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Validation: Duplicate Evidence ID
        const duplicate = this.state.records.find(r => r.evidenceId === formData.evidenceId);
        if (duplicate) {
            this.showToast('Error: Evidence ID already exists. Please use a unique ID.', 'error');
            return;
        }

        this.state.records.push(formData);
        this.saveData();
        this.showToast('Evidence record archived successfully');
        form.reset();
        this.generateEvidenceId();
        this.navigateTo('screen-records');
    },

    renderDashboard() {
        // Stats
        const totalRecords = this.state.records.length;
        const uniqueCases = new Set(this.state.records.map(r => r.caseId)).size;
        const inStorage = this.state.records.filter(r => r.status === 'In Storage').length;

        document.getElementById('stat-cases').textContent = uniqueCases;
        document.getElementById('stat-records').textContent = totalRecords;
        document.getElementById('stat-storage').textContent = inStorage;
        document.getElementById('stat-recent').textContent = totalRecords > 0 ? '4' : '0'; // Simplified for demo

        // Recent Table
        const tbody = document.getElementById('dashboard-recent-body');
        const emptyState = document.getElementById('dashboard-empty');

        tbody.innerHTML = '';
        const recent = [...this.state.records].reverse().slice(0, 5);

        if (recent.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            recent.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="mono">${r.evidenceId}</td>
                    <td class="mono">${r.caseId}</td>
                    <td>${r.evidenceType}</td>
                    <td>${r.collectionDate}</td>
                    <td><span class="status-pill">${r.status}</span></td>
                    <td class="text-right">
                        <button class="btn-text" onclick="app.viewDetails('${r.evidenceId}')">View</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    },

    renderRecords() {
        const tbody = document.getElementById('records-table-body');
        const emptyState = document.getElementById('records-empty');
        const searchQuery = document.getElementById('search-input').value.toLowerCase();
        const typeFilter = document.getElementById('filter-type').value;
        const statusFilter = document.getElementById('filter-status').value;

        tbody.innerHTML = '';

        const filtered = this.state.records.filter(r => {
            const matchesSearch =
                r.evidenceId.toLowerCase().includes(searchQuery) ||
                r.caseId.toLowerCase().includes(searchQuery) ||
                r.description.toLowerCase().includes(searchQuery) ||
                r.collectionLocation.toLowerCase().includes(searchQuery);

            const matchesType = typeFilter === 'all' || r.evidenceType === typeFilter;
            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

            return matchesSearch && matchesType && matchesStatus;
        });

        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            filtered.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="mono">${r.evidenceId}</td>
                    <td class="mono">${r.caseId}</td>
                    <td>${r.evidenceType}</td>
                    <td>${r.collectionDate}</td>
                    <td>${r.collectedBy}</td>
                    <td>${r.storageLocation}</td>
                    <td><span class="status-pill">${r.status}</span></td>
                    <td class="text-right">
                        <button class="btn-text" onclick="app.viewDetails('${r.evidenceId}')">View</button>
                        <button class="btn-text" onclick="app.editRecord('${r.evidenceId}')">Edit</button>
                        <button class="btn-text" style="color: var(--color-burgundy)" onclick="app.deleteRecord('${r.evidenceId}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    },

    viewDetails(id) {
        const record = this.state.records.find(r => r.evidenceId === id);
        if (!record) return;

        const modal = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const footer = document.getElementById('modal-footer');

        title.textContent = `Evidence Record: ${record.evidenceId}`;

        body.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Case ID</span>
                    <span class="detail-value mono">${record.caseId}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Evidence Type</span>
                    <span class="detail-value">${record.evidenceType}</span>
                </div>
                <div class="detail-item full-width">
                    <span class="detail-label">Description</span>
                    <span class="detail-value">${record.description}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Collection Date/Time</span>
                    <span class="detail-value">${record.collectionDate} @ ${record.collectionTime}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Collected By</span>
                    <span class="detail-value">${record.collectedBy}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Collection Location</span>
                    <span class="detail-value">${record.collectionLocation}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Storage Location</span>
                    <span class="detail-value">${record.storageLocation}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="detail-value"><span class="status-pill">${record.status}</span></span>
                </div>
            </div>
        `;

        footer.innerHTML = `
            <button class="btn-secondary" onclick="app.closeModal()">Close</button>
        `;

        modal.classList.remove('hidden');
    },

    editRecord(id) {
        const index = this.state.records.findIndex(r => r.evidenceId === id);
        const record = this.state.records[index];
        if (!record) return;

        const modal = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const footer = document.getElementById('modal-footer');

        title.textContent = `Edit Evidence: ${id}`;

        body.innerHTML = `
            <form id="edit-form" class="detail-grid" style="display: grid; gap: 15px;">
                <div class="detail-item">
                    <span class="detail-label">Case ID</span>
                    <input type="text" name="caseId" value="${record.caseId}" required style="width:100%">
                </div>
                <div class="detail-item">
                    <span class="detail-label">Type</span>
                    <select name="evidenceType" required style="width:100%">
                        <option value="Biological Sample" ${record.evidenceType === 'Biological Sample' ? 'selected' : ''}>Biological Sample</option>
                        <option value="Fingerprint" ${record.evidenceType === 'Fingerprint' ? 'selected' : ''}>Fingerprint</option>
                        <option value="Digital Evidence" ${record.evidenceType === 'Digital Evidence' ? 'selected' : ''}>Digital Evidence</option>
                        <option value="Document" ${record.evidenceType === 'Document' ? 'selected' : ''}>Document</option>
                        <option value="Weapon or Object" ${record.evidenceType === 'Weapon or Object' ? 'selected' : ''}>Weapon or Object</option>
                        <option value="Trace Evidence" ${record.evidenceType === 'Trace Evidence' ? 'selected' : ''}>Trace Evidence</option>
                        <option value="Other" ${record.evidenceType === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="detail-item full-width">
                    <span class="detail-label">Description</span>
                    <textarea name="description" required style="width:100%" rows="3">${record.description}</textarea>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <select name="status" required style="width:100%">
                        <option value="In Storage" ${record.status === 'In Storage' ? 'selected' : ''}>In Storage</option>
                        <option value="Sent to Laboratory" ${record.status === 'Sent to Laboratory' ? 'selected' : ''}>Sent to Laboratory</option>
                        <option value="Under Examination" ${record.status === 'Under Examination' ? 'selected' : ''}>Under Examination</option>
                        <option value="Released" ${record.status === 'Released' ? 'selected' : ''}>Released</option>
                        <option value="Archived" ${record.status === 'Archived' ? 'selected' : ''}>Archived</option>
                    </select>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Storage Location</span>
                    <input type="text" name="storageLocation" value="${record.storageLocation}" required style="width:100%">
                </div>
            </form>
        `;

        footer.innerHTML = `
            <button class="btn-secondary" onclick="app.closeModal()">Cancel</button>
            <button class="btn-primary" id="btn-save-edit">Save Changes</button>
        `;

        modal.classList.remove('hidden');

        document.getElementById('btn-save-edit').addEventListener('click', () => {
            const f = document.getElementById('edit-form');
            const newRecord = {
                ...this.state.records[index],
                caseId: f.caseId.value,
                evidenceType: f.evidenceType.value,
                description: f.description.value,
                status: f.status.value,
                storageLocation: f.storageLocation.value,
                updatedAt: new Date().toISOString()
            };

            this.state.records[index] = newRecord;
            this.saveData();
            this.closeModal();
            this.renderRecords();
            this.showToast('Record updated successfully');
        });
    },

    deleteRecord(id) {
        if (confirm(`Confirm deletion of record ${id}? This action cannot be undone.`)) {
            this.state.records = this.state.records.filter(r => r.evidenceId !== id);
            this.saveData();
            this.renderRecords();
            this.showToast('Record deleted from archive');
        }
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        if (type === 'error') {
            toast.style.backgroundColor = 'var(--color-burgundy)';
        }
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Initialize App
window.addEventListener('DOMContentLoaded', () => app.init());
