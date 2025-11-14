const API_BASE_URL = 'http://localhost:8000';


// Global state
let state = {
    employees: [],
    departments: [],
    designations: [],
    shifts: [],
    divisions: [],
    banks: [],
    busRoutes: [],
    busRouteStops: [],
    gatePasses: [],
    overtimes: [],
    leaves: [],
    missedPunches: [],
    interviewJoiningData: [],   
    editingInterviewJoiningId: null,
    businessPartners: [],
    bpTypes: [],
    bpGroups: [],
    items: [],
    itemGroups: [],
    itemUOMs: [],
    itemCategories: [],
    itemTypes: [],
    warehouses: [],
    postingPeriods: [],
    purchaseRequests: [],
//    purchaseOrders: [],
//    approvedPRs: [],
//    vendors: [],
//    taxCodes: [],
//    warehouses: [],
//    uoms: [],
//    selectedPRs: [],
//    goodReceipts: [],
//    goodsReturnRequests: [],
//    goodsReturns: [],

    currentEditingId: null
};

let poState = {
    purchaseOrders: [],
    approvedPRs: [],
    vendors: [],
    taxCodes: [],
    warehouses: [],
    uoms: [],
    selectedPRs: []  // For multi-PR selection
};


// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
initializeSubmenus();
loadDashboardData();
loadEmployees();
loadDepartments();
loadDesignations();
loadShifts();
loadDivisions();
loadBanks();
loadBusRoutes();
loadBusRouteStops();
loadGatePasses();
loadOvertimes();
loadLeaves();
loadMissedPunches();
loadInterviewJoining();
loadResignations();
loadBPTypes(); 
loadBPGroups();
loadBusinessPartners();
loadItemMaster();
loadItemGroups();
loadItemUOMs();
loadItemCategories();
loadItemTypes();
loadWarehouses(); 
loadPostingPeriods();
loadPurchaseRequests();
loadPOData();
//loadPurchaseOrders();
//loadGoodReceipts();
//loadGoodsReturnRequests();
//loadGoodsReturns();

});

// Load all PO-related data
async function loadPOData() {
    try {
        await Promise.all([
            loadPurchaseOrders(),
            loadApprovedPRs(),
            loadVendors(),
            loadTaxCodes(),
            loadWarehouses(),
            loadUOMs()
        ]);
    } catch (error) {
        console.error('Failed to load PO data:', error);
    }
}

// Navigation functions
function showSection(sectionName) {
document.querySelectorAll('.content-section').forEach(section => {
section.style.display = 'none';
});
document.querySelectorAll('.nav-link').forEach(link => {
link.classList.remove('active');
});
document.getElementById(`${sectionName}-section`).style.display = 'block';
const nav = Array.from(document.querySelectorAll('.nav-link')).find(n => (n.getAttribute('onclick')||'').includes(`showSection('${sectionName}')`));
if (nav) nav.classList.add('active');
}

// Add this function to handle submenu state
function initializeSubmenus() {
    // Initialize HR submenu state from localStorage
    const hrExpanded = localStorage.getItem('hrSubmenuExpanded') === 'true';
    const hrSubmenu = document.getElementById('hrSubmenu');
    if (hrSubmenu) {
        if (hrExpanded) {
            hrSubmenu.classList.add('show');
        }
        
        // Add event listener to save state
        hrSubmenu.addEventListener('show.bs.collapse', function() {
            localStorage.setItem('hrSubmenuExpanded', 'true');
        });
        
        hrSubmenu.addEventListener('hide.bs.collapse', function() {
            localStorage.setItem('hrSubmenuExpanded', 'false');
        });
    }
}

// API helper
async function apiRequest(endpoint, options = {}) {
try {
const response = await fetch(`${API_BASE_URL}${endpoint}`, {
headers: {
'Content-Type': 'application/json',
...options.headers
},
...options
});
if (!response.ok) {
const text = await response.text();
throw new Error(`API error: ${response.status} - ${text}`);
}
if (response.status === 204) return null;
return await response.json();
} catch (error) {
console.error('API request failed:', error);
alert('Operation failed. Check console for details.');
throw error;
}
}

// Load functions

async function loadBPTypes() {
    try {
        state.bpTypes = await apiRequest('/api/bp-types');
    } catch (error) {
        console.error('Failed to load BP types:', error);
    }
}

async function loadBPGroups() {
    try {
        state.bpGroups = await apiRequest('/api/bp-groups');
    } catch (error) {
        console.error('Failed to load BP groups:', error);
    }
}

async function loadDashboardData() {
    try {
        const [employees, departments, designations] = await Promise.all([
            apiRequest('/api/employees'),
            apiRequest('/api/departments'),
            apiRequest('/api/designations')
        ]);
        
        document.getElementById('total-employees').textContent = employees.length;
        document.getElementById('active-employees').textContent = employees.filter(e => e.status === 'Active').length;
        document.getElementById('total-departments').textContent = departments.length;
        document.getElementById('total-designations').textContent = designations.length;
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

async function loadEmployees() {
    try {
        state.employees = await apiRequest('/api/employees');
        renderEmployees();
    } catch (error) {
        console.error('Failed to load employees:', error);
    }
}

async function loadDepartments() {
    try {
        state.departments = await apiRequest('/api/departments');
        renderDepartments();
    } catch (error) {
        console.error('Failed to load departments:', error);
    }
}

async function loadDesignations() {
    try {
        state.designations = await apiRequest('/api/designations');
        renderDesignations();
    } catch (error) {
        console.error('Failed to load designations:', error);
    }
}

async function loadShifts() {
    try {
        state.shifts = await apiRequest('/api/shifts');
        renderShifts();
    } catch (error) {
        console.error('Failed to load shifts:', error);
    }
}

async function loadDivisions() {
    try {
        state.divisions = await apiRequest('/api/divisions');
        renderDivisions();
    } catch (error) {
        console.error('Failed to load divisions:', error);
    }
}

async function loadBanks() {
    try {
        state.banks = await apiRequest('/api/banks');
        renderBanks();
    } catch (error) {
        console.error('Failed to load banks:', error);
    }
}

async function loadBusRoutes() {
    try {
        state.busRoutes = await apiRequest('/api/bus-routes');
        renderBusRoutes();
    } catch (error) {
        console.error('Failed to load bus routes:', error);
    }
}

async function loadBusRouteStops() {
    try {
        state.busRouteStops = await apiRequest('/api/bus-route-stops');
        renderBusRouteStops();
    } catch (error) {
        console.error('Failed to load bus route stops:', error);
    }
}

async function loadGatePasses() {
    try {
        state.gatePasses = await apiRequest('/api/gate-passes');
        renderGatePasses();
    } catch (error) {
        console.error('Failed to load gate passes:', error);
    }
}

async function loadOvertimes() {
    try {
        state.overtimes = await apiRequest('/api/overtimes');
        renderOvertimes();
    } catch (error) {
        console.error('Failed to load overtimes:', error);
    }
}

async function loadLeaves() {
    try {
        state.leaves = await apiRequest('/api/leaves');
        renderLeaves();
    } catch (error) {
        console.error('Failed to load leaves:', error);
    }
}

async function loadMissedPunches() {
    try {
        state.missedPunches = await apiRequest('/api/missed-punches');
        renderMissedPunches();
    } catch (error) {
        console.error('Failed to load missed punches:', error);
    }
}

async function loadInterviewJoining() {
    try {
        interviewJoiningData = await apiRequest('/api/interview-joining'); 
        renderInterviewJoining();
        //console.log(interviewJoiningData);
    } catch (error) {
        console.error('Failed to load Interview to Joining data:', error);
    }
}


// Render functions
function renderEmployees() {
    const tbody = document.getElementById('employees-table-body');
    tbody.innerHTML = '';
    
    state.employees.forEach(emp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.emp_code || ''}</td>
            <td>${emp.emp_name || ''}</td>
            <td>${emp.dept_name || 'N/A'}</td>
            <td>${emp.des_name || 'N/A'}</td>
            <td><span class="badge ${getStatusBadgeClass(emp.status)}">${emp.status || ''}</span></td>
            <td>${emp.emp_doj || ''}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editEmployee(${emp.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${emp.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderDepartments() {
    const tbody = document.getElementById('departments-table-body');
    tbody.innerHTML = '';
    
    state.departments.forEach(dept => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dept.dept_id}</td>
            <td>${dept.dept_name}</td>
            <td>
               <button class="btn btn-sm btn-outline-primary me-1" onclick="showDepartmentModal(${dept.dept_id})">
    			<i class="fas fa-edit"></i>
		</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDepartment(${dept.dept_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderDesignations() {
    const tbody = document.getElementById('designations-table-body');
    tbody.innerHTML = '';
    
    state.designations.forEach(des => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${des.des_id}</td>
            <td>${des.des_name}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editDesignation(${des.des_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDesignation(${des.des_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderShifts() {
    const tbody = document.getElementById('shifts-table-body');
    tbody.innerHTML = '';
    
    state.shifts.forEach(shift => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${shift.shift_id}</td>
            <td>${shift.shift_name}</td>
            <td>${shift.shift_start}</td>
            <td>${shift.shift_end}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editShift(${shift.shift_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteShift(${shift.shift_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderDivisions() {
    const tbody = document.getElementById('divisions-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    state.divisions.forEach(div => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${div.divn_id}</td>
            <td>${div.divn_name}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editDivision(${div.divn_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDivision(${div.divn_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderBanks() {
    const tbody = document.getElementById('banks-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    state.banks.forEach(bank => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${bank.bank_id}</td>
            <td>${bank.country_code}</td>
            <td>${bank.bank_code}</td>
            <td>${bank.bank_name}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="showBankModal(state.banks.find(b => b.bank_id === ${bank.bank_id}))">
    			<i class="fas fa-edit"></i>
		</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteBank(${bank.bank_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderBusRoutes() {
    const tbody = document.getElementById('bus-routes-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    state.busRoutes.forEach(route => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${route.route_id}</td>
            <td>${route.route_name}</td>
            <td>${route.route_number}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="showBusRouteModal(state.busRoutes.find(r => r.route_id === ${route.route_id}))">
    			<i class="fas fa-edit"></i>
		</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteBusRoute(${route.route_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderBusRouteStops() {
    const tbody = document.getElementById('bus-route-stops-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    state.busRouteStops.forEach(stop => {
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stop.stop_id}</td>
            <td>${stop.route_name || 'N/A'}</td> 
            <td>${stop.stop_name}</td>
            <td>${stop.display_order}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="showBusRouteStopModal(${stop.stop_id})">
    			<i class="fas fa-edit"></i>
		</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteBusRouteStop(${stop.stop_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderGatePasses() {
    const tbody = document.getElementById('gate-passes-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    state.gatePasses.forEach(gp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${gp.gate_pass_id}</td>
            <td>${gp.emp_name}</td>
            <td>${gp.gate_pass_type}</td>
            <td>${new Date(gp.gate_pass_time).toLocaleString()}</td>
            <td>${gp.reason || 'N/A'}</td>
            <td><span class="badge ${getStatusBadgeClass(gp.status)}">${gp.status}</span></td>
            <td>${gp.approved_by_name || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editGatePass(${gp.gate_pass_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteGatePass(${gp.gate_pass_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderOvertimes() {
    const tbody = document.getElementById('overtimes-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    state.overtimes.forEach(ot => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ot.overtime_id}</td>
            <td>${ot.emp_name}</td>
            <td>${ot.overtime_date}</td>
            <td>${ot.start_time}</td>
            <td>${ot.end_time}</td>
            <td>${ot.total_hours}</td>
            <td>${ot.reason || 'N/A'}</td>
            <td><span class="badge ${getStatusBadgeClass(ot.status)}">${ot.status}</span></td>
            <td>${ot.approved_by_name}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editOvertime(${ot.overtime_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteOvertime(${ot.overtime_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderLeaves() {
    const tbody = document.getElementById('leaves-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    state.leaves.forEach(lv => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${lv.leave_id}</td>
            <td>${lv.emp_name}</td>
            <td>${lv.leave_type}</td>
            <td>${lv.start_date}</td>
            <td>${lv.end_date}</td>
            <td>${lv.total_days}</td>
            <td>${lv.reason || 'N/A'}</td>
            <td><span class="badge ${getStatusBadgeClass(lv.status)}">${lv.status}</span></td>
            <td>${lv.approved_by_name}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editLeave(${lv.leave_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteLeave(${lv.leave_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderMissedPunches() {
    const tbody = document.getElementById('missed-punches-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    state.missedPunches.forEach(mp => {
        const row = document.createElement('tr');
        row.innerHTML = `
    <td>${mp.missed_punch_id}</td>
    <td>${mp.emp_name}</td>
    <td>${mp.punch_date}</td>
    <td>${mp.punch_type}</td>
    <td>${mp.actual_time}</td>
    <td>${mp.reason || 'N/A'}</td>
    <td><span class="badge ${getStatusBadgeClass(mp.status)}">${mp.status}</span></td>
    <td>${mp.approved_by_name || 'N/A'}</td>
    <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editMissedPunch(${mp.missed_punch_id})">
            <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteMissedPunch(${mp.missed_punch_id})">
            <i class="fas fa-trash"></i>
        </button>
    </td>
`;
        tbody.appendChild(row);
    });
}

function renderInterviewJoining() {
    const tbody = document.getElementById("intervew-to-joining-table-body");
    tbody.innerHTML = "";

    if (!interviewJoiningData.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">No records found</td></tr>`;
        return;
    }

    interviewJoiningData.forEach(record => {
        const desName = state.designations.find(d => d.id === record.des_given)?.name || '';
        // Decide button label dynamically
        let taskLabel = "Click Here"; // default
        if (record.status === "Selected") {
            taskLabel = "CTC Finalized";
        } else if (record.status === "CTC Finalized") {
            taskLabel = "Do FollowUp";
        } else if (record.status === "FollowUP Done") {
            taskLabel = "Join Candidate";
        } else if (record.status === "Candidate Joined") {
            taskLabel = "Give Appointment Letter";
        } else if (record.status === "Appointment Given") {
            taskLabel = "Do BioMetric";
        } else if (record.status === "BioMetric Done") {
            taskLabel = "Give Induction/Trainig";
        } else if (record.status === "Induction/Training Done") {
            taskLabel = "Open PF Account";
        } else if (record.status === "PF Account Done") {
            taskLabel = "First Month Eva.";
        } else if (record.status === "First Eva. Done") {
            taskLabel = "Three Month Eva.";
        } else if (record.status === "Second Eva. Done") {
            taskLabel = "Six Month Eva.";
        } else if (record.status === "Third Eva. Done") {
            taskLabel = "Give Confirmation";
        } else {
            taskLabel = "No Action";
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${record.candidate_name || ''}</td>
            <td>${record.contact_number || ''}</td>
            <td>${record.post_apply || ''}</td>
            <td>${record.sent_to_dept || ''}</td>
            <td>${record.inter_name || ''}</td>
            <td><span class="badge ${getStatusBadgeClass(record.status)}">${record.status || ''}</span></td>
            <td>${record.join_date || ''}</td>
            <td>${record.des_given || ''}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showInterviewJoiningModal(${JSON.stringify(record).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteInterviewJoining(${record.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
            <td>
                <button class="btn btn-sm btn-success" onclick="handleTaskClick(${record.id})">
                    ${taskLabel}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

//Interview to Joining FMS Other Tasks
function handleTaskClick(candidateId) {
    // Example: redirect to interview feedback form
    const url = `http://localhost:8000/api/interview-tasks/${candidateId}`;
    window.open(url, '_blank'); // open in a new tab
}




// Modal functions (Employee tabbed modal)
function showEmployeeModal(employee = null) {
    state.currentEditingId = employee ? employee.id : null;

    // Helper to prefill values safely
    const v = (key) => employee && employee[key] !== undefined && employee[key] !== null ? employee[key] : '';

    // Build dropdown options
    const optionList = (items, valueField, labelField, selectedVal) => {
        return `<option value="">Select</option>` + items.map(it => `<option value="${it[valueField]}" ${String(it[valueField]) === String(selectedVal) ? 'selected' : ''}>${it[labelField]}</option>`).join('');
    };

    const modalHTML = `
        <div class="modal fade" id="employeeModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${employee ? 'Edit' : 'Add'} Employee</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="employeeForm">
                            <ul class="nav nav-tabs" id="employeeTab" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="personal-tab" data-bs-toggle="tab" data-bs-target="#personal" type="button" role="tab">Personal</button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="identity-tab" data-bs-toggle="tab" data-bs-target="#identity" type="button" role="tab">Identity</button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="job-tab" data-bs-toggle="tab" data-bs-target="#job" type="button" role="tab">Job</button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="salary-tab" data-bs-toggle="tab" data-bs-target="#salary" type="button" role="tab">Salary/Bank</button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="transport-tab" data-bs-toggle="tab" data-bs-target="#transport" type="button" role="tab">Transport/Leave</button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="exit-tab" data-bs-toggle="tab" data-bs-target="#exit" type="button" role="tab">Exit</button>
                                </li>
                            </ul>

                            <div class="tab-content p-3 border border-top-0" id="employeeTabContent">
                                <!-- Personal -->
                                <div class="tab-pane fade show active" id="personal" role="tabpanel">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Employee Code</label>
                                            <input id="emp_code" class="form-control" value="${v('emp_code')}" required />
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Full Name</label>
                                            <input id="emp_name" class="form-control" value="${v('emp_name')}" required />
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Address</label>
                                            <input id="emp_address" class="form-control" value="${v('emp_address')}" />
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Personal Contact</label>
                                            <input id="emp_personal_contact" class="form-control" value="${v('emp_personal_contact')}" />
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Personal Email</label>
                                            <input id="emp_personal_email" type="email" class="form-control" value="${v('emp_personal_email')}" />
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Emergency Contact</label>
                                            <input id="emp_emergency_contact" class="form-control" value="${v('emp_emergency_contact')}" />
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Date of Birth</label>
                                            <input id="emp_dob" type="date" class="form-control" value="${v('emp_dob')}" />
                                        </div>
                                        <div class="col-md-8 mb-3">
                                            <label class="form-label">Last Education</label>
                                            <input id="emp_last_education" class="form-control" value="${v('emp_last_education')}" />
                                        </div>
                                    </div>
                                </div>

                                <!-- Identity -->
                                <div class="tab-pane fade" id="identity" role="tabpanel">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Aadhar Name</label>
                                            <input id="emp_aadhar_name" class="form-control" value="${v('emp_aadhar_name')}" />
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Aadhar No</label>
                                            <input id="emp_aadhar_no" class="form-control" value="${v('emp_aadhar_no')}" />
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">PAN Name</label>
                                            <input id="emp_pan_name" class="form-control" value="${v('emp_pan_name')}" />
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">PAN No</label>
                                            <input id="emp_pan_no" class="form-control" value="${v('emp_pan_no')}" />
                                        </div>
                                    </div>
                                </div>

                                <!-- Job -->
                                <div class="tab-pane fade" id="job" role="tabpanel">
                                    <div class="row">
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Date of Joining</label>
                                            <input id="emp_doj" type="date" class="form-control" value="${v('emp_doj')}" />
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Division</label>
                                            <select id="divn_id" class="form-control">
                                                ${optionList(state.divisions, 'divn_id', 'divn_name', v('divn_id'))}
                                            </select>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Department</label>
                                            <select id="dept_id" class="form-control">
                                                ${optionList(state.departments, 'dept_id', 'dept_name', v('dept_id'))}
                                            </select>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Designation</label>
                                            <select id="des_id" class="form-control">
                                                ${optionList(state.designations, 'des_id', 'des_name', v('des_id'))}
                                            </select>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Shift</label>
                                            <select id="shift_id" class="form-control">
                                                ${optionList(state.shifts, 'shift_id', 'shift_name', v('shift_id'))}
                                            </select>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Official Email</label>
                                            <input id="emp_official_email" type="email" class="form-control" value="${v('emp_official_email')}" />
                                        </div>

                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Immediate Superior Name</label>
                                            <input id="imm_superior_name" class="form-control" value="${v('imm_superior_name')}" />
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Immediate Superior Email</label>
                                            <input id="imm_superior_email" type="email" class="form-control" value="${v('imm_superior_email')}" />
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">HOD Name</label>
                                            <input id="hod_name" class="form-control" value="${v('hod_name')}" />
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">HOD Email</label>
                                            <input id="hod_email" type="email" class="form-control" value="${v('hod_email')}" />
                                        </div>

                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Status</label>
                                            <select id="status" class="form-control">
                                                <option value="Active" ${v('status') === 'Active' ? 'selected' : ''}>Active</option>
                                                <option value="Resigned" ${v('status') === 'Resigned' ? 'selected' : ''}>Resigned</option>
                                                <option value="Suspended" ${v('status') === 'Suspended' ? 'selected' : ''}>Suspended</option>
                                                <option value="On Notice Period" ${v('status') === 'On Notice Period' ? 'selected' : ''}>On Notice Period</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <!-- Salary / Bank -->
                                <div class="tab-pane fade" id="salary" role="tabpanel">
                                    <div class="row">
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">CTC</label>
                                            <input id="ctc" type="number" step="0.01" class="form-control" value="${v('ctc')}" />
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Gross Salary</label>
                                            <input id="gross_salary" type="number" step="0.01" class="form-control" value="${v('gross_salary')}" />
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Take Home Salary</label>
                                            <input id="take_home_salary" type="number" step="0.01" class="form-control" value="${v('take_home_salary')}" />
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Bank Account No</label>
                                            <input id="emp_bank_acc_no" class="form-control" value="${v('emp_bank_acc_no')}" />
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Bank</label>
                                            <select id="bank_id" class="form-control">
                                                ${optionList(state.banks, 'bank_id', 'bank_name', v('bank_id'))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <!-- Transport / Leave -->
                                <div class="tab-pane fade" id="transport" role="tabpanel">
                                    <div class="row">
                                        <div class="col-md-3 mb-3">
                                            <label class="form-label">Bus Available</label>
                                            <select id="bus_avail" class="form-control">
                                                <option value="">Select</option>
                                                <option value="true" ${v('bus_avail') === true || v('bus_avail') === 'true' ? 'selected' : ''}>Yes</option>
                                                <option value="false" ${v('bus_avail') === false || v('bus_avail') === 'false' ? 'selected' : ''}>No</option>
                                            </select>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Route</label>
                                            <select id="route_id" class="form-control">
                                                ${optionList(state.busRoutes, 'route_id', 'route_name', v('route_id'))}
                                            </select>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Stop</label>
                                            <select id="stop_id" class="form-control">
                                                ${optionList(state.busRouteStops, 'stop_id', 'stop_name', v('stop_id'))}
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">PL Balance</label>
                                            <input id="pl_bal" type="number" step="0.01" class="form-control" value="${v('pl_bal')}" />
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">CL Balance</label>
                                            <input id="cl_bal" type="number" step="0.01" class="form-control" value="${v('cl_bal')}" />
                                        </div>
                                    </div>
                                </div>

                                <!-- Exit -->
                                <div class="tab-pane fade" id="exit" role="tabpanel">
                                    <div class="row">
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Resignation Date</label>
                                            <input id="resignation_date" type="date" class="form-control" value="${v('resignation_date')}" />
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Last Working Date</label>
                                            <input id="last_working_date" type="date" class="form-control" value="${v('last_working_date')}" />
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label class="form-label">Releaving Date</label>
                                            <input id="releaving_date" type="date" class="form-control" value="${v('releaving_date')}" />
                                        </div>
                                        <div class="col-12 mb-3">
                                            <label class="form-label">Remarks</label>
                                            <textarea id="remarks" class="form-control" rows="3">${v('remarks')}</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveEmployee()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modals-container').innerHTML = modalHTML;
    // Show bootstrap modal
    const modalElem = document.getElementById('employeeModal');
    const modal = new bootstrap.Modal(modalElem);
    modal.show();
}

// Gate Pass Modal
function showGatePassModal(gatePass = null) {
    state.currentEditingId = gatePass ? gatePass.gate_pass_id : null;

    const v = (key) => gatePass && gatePass[key] !== undefined && gatePass[key] !== null ? gatePass[key] : '';

    const optionList = (items, valueField, labelField, selectedVal) => {
        return `<option value="">Select</option>` + items.map(it => 
            `<option value="${it[valueField]}" ${String(it[valueField]) === String(selectedVal) ? 'selected' : ''}>${it[labelField]}</option>`
        ).join('');
    };

    const modalHTML = `
    <div class="modal fade" id="gatePassModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${gatePass ? 'Edit' : 'Add'} Gate Pass</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="gatePassForm">
              <div class="mb-3">
                <label class="form-label">Employee</label>
                <select id="emp_id" class="form-control" required>
                  ${optionList(state.employees, 'id', 'emp_name', v('emp_id'))}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Gate Pass Type</label>
                <select id="gate_pass_type" class="form-control" required>
                  <option value="IN" ${v('gate_pass_type')==='IN'?'selected':''}>IN</option>
                  <option value="OUT" ${v('gate_pass_type')==='OUT'?'selected':''}>OUT</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Time</label>
                <input type="datetime-local" id="gate_pass_time" class="form-control" value="${v('gate_pass_time') ? new Date(v('gate_pass_time')).toISOString().slice(0,16) : ''}" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Reason</label>
                <textarea id="reason" class="form-control">${v('reason')}</textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="saveGatePass()">Save</button>
          </div>
        </div>
      </div>
    </div>
    `;

    document.getElementById('modals-container').innerHTML = modalHTML;
    const modalElem = document.getElementById('gatePassModal');
    const modal = new bootstrap.Modal(modalElem);
    modal.show();
}

// Overtime Modal
function showOvertimeModal(overtime = null) {
    state.currentEditingId = overtime ? overtime.overtime_id : null;
    
    const modalHTML = `
        <div class="modal fade" id="overtimeModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${overtime ? 'Edit' : 'Add'} Overtime</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="overtimeForm">
                            <div class="mb-3">
                                <label class="form-label">Employee</label>
                                <select class="form-control" id="overtimeEmpId" required>
                                    <option value="">Select Employee</option>
                                    ${state.employees.map(emp => 
                                        `<option value="${emp.id}" ${overtime && overtime.emp_id === emp.id ? 'selected' : ''}>${emp.emp_name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Date</label>
                                <input type="date" class="form-control" id="overtimeDate" value="${overtime ? overtime.overtime_date : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Start Time</label>
                                <input type="time" class="form-control" id="overtimeStart" value="${overtime ? overtime.start_time : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">End Time</label>
                                <input type="time" class="form-control" id="overtimeEnd" value="${overtime ? overtime.end_time : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Total Hours</label>
                                <input type="number" step="0.5" class="form-control" id="overtimeHours" value="${overtime ? overtime.total_hours : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Reason</label>
                                <textarea class="form-control" id="overtimeReason">${overtime ? overtime.reason : ''}</textarea>
                            </div>


                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveOvertime()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modals-container').innerHTML = modalHTML;
    const modal = new bootstrap.Modal(document.getElementById('overtimeModal'));
    modal.show();
}

// Leave Modal
function showLeaveModal(leave = null) {
    state.currentEditingId = leave ? leave.leave_id : null;
    
    const modalHTML = `
        <div class="modal fade" id="leaveModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${leave ? 'Edit' : 'Add'} Leave</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="leaveForm">
                            <div class="mb-3">
                                <label class="form-label">Employee</label>
                                <select class="form-control" id="leaveEmpId" required>
                                    <option value="">Select Employee</option>
                                    ${state.employees.map(emp => 
                                        `<option value="${emp.id}" ${leave && leave.emp_id === emp.id ? 'selected' : ''}>${emp.emp_name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Leave Type</label>
                                <select class="form-control" id="leaveType" required>
                                    <option value="PL" ${leave && leave.leave_type === 'PL' ? 'selected' : ''}>Paid Leave (PL)</option>
                                    <option value="CL" ${leave && leave.leave_type === 'CL' ? 'selected' : ''}>Casual Leave (CL)</option>
                                    <option value="SL" ${leave && leave.leave_type === 'SL' ? 'selected' : ''}>Sick Leave (SL)</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Start Date</label>
                                <input type="date" class="form-control" id="leaveStart" value="${leave ? leave.start_date : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">End Date</label>
                                <input type="date" class="form-control" id="leaveEnd" value="${leave ? leave.end_date : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Total Days</label>
                                <input type="number" step="0.5" class="form-control" id="leaveDays" value="${leave ? leave.total_days : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Reason</label>
                                <textarea class="form-control" id="leaveReason">${leave ? leave.reason : ''}</textarea>
                            </div>


                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveLeave()">Save</button>
                    </div>
                </div>
            </div>
        </div>
     `;
    
    document.getElementById('modals-container').innerHTML = modalHTML;
    const modal = new bootstrap.Modal(document.getElementById('leaveModal'));
    modal.show();
}

// Missed Punch Modal
function showMissedPunchModal(missedPunch = null) {
    state.currentEditingId = missedPunch ? missedPunch.missed_punch_id : null;
    
    const modalHTML = `
        <div class="modal fade" id="missedPunchModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${missedPunch ? 'Edit' : 'Add'} Missed Punch</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="missedPunchForm">
                            <div class="mb-3">
                                <label class="form-label">Employee</label>
                                <select class="form-control" id="missedPunchEmpId" required>
                                    <option value="">Select Employee</option>
                                    ${state.employees.map(emp => 
                                        `<option value="${emp.id}" ${missedPunch && missedPunch.emp_id === emp.id ? 'selected' : ''}>${emp.emp_name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Date</label>
                                <input type="date" class="form-control" id="missedPunchDate" value="${missedPunch ? missedPunch.punch_date : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Punch Type</label>
                                <select class="form-control" id="missedPunchType" required>
                                    <option value="IN" ${missedPunch && missedPunch.punch_type === 'IN' ? 'selected' : ''}>IN</option>
                                    <option value="OUT" ${missedPunch && missedPunch.punch_type === 'OUT' ? 'selected' : ''}>OUT</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Actual Time</label>
                                <input type="time" class="form-control" id="missedPunchTime" value="${missedPunch ? missedPunch.actual_time : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Reason</label>
                                <textarea class="form-control" id="missedPunchReason">${missedPunch ? missedPunch.reason : ''}</textarea>
                            </div>


                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveMissedPunch()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modals-container').innerHTML = modalHTML;
    const modal = new bootstrap.Modal(document.getElementById('missedPunchModal'));
    modal.show();
}

// Interview to Joining Modal

function showInterviewJoiningModal(candidate = null) {
    state.editingInterviewJoiningId = candidate ? candidate.id : null;

    // Helper to safely get values from candidate
    const v = (key) => candidate && candidate[key] !== undefined && candidate[key] !== null ? candidate[key] : '';

    // Build dropdown options
    const optionList = (items, valueField, labelField, selectedVal) => {
        return `<option value="">Select</option>` + items.map(it => `<option value="${it[valueField]}" ${String(it[valueField]) === String(selectedVal) ? 'selected' : ''}>${it[labelField]}</option>`).join('');
    };

    // Build the modal HTML
    const modalHTML = `
    <div class="modal fade" id="interviewJoiningModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${candidate ? 'Edit' : 'Add'} Candidate Evaluation</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="interviewJoiningForm" onsubmit="saveInterviewJoining(event)">
                        <!-- Tabs -->
                        <ul class="nav nav-tabs" id="candidateTab" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#personal" type="button" role="tab">Personal</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#family" type="button" role="tab">Family</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#education" type="button" role="tab">Education</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#work" type="button" role="tab">Work Experience</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#internal" type="button" role="tab">Internal Use</button>
                            </li>
                        </ul>

                        <div class="tab-content p-3 border border-top-0" id="candidateTabContent">
                            <!-- Personal -->
                            <div class="tab-pane fade show active" id="personal" role="tabpanel">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Candidate Name</label>
                                        <input type="text" name="candidate_name" class="form-control" value="${v('candidate_name')}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Address</label>
                                        <textarea name="address" class="form-control">${v('address')}</textarea>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Email</label>
                                        <input type="email" name="email" class="form-control" value="${v('email')}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Contact Number</label>
                                        <input type="tel" name="contact_number" class="form-control" value="${v('contact_number')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Birthdate</label>
                                        <input type="date" name="birthdate" class="form-control" value="${v('birthdate')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Hobbies</label>
                                        <input type="text" name="hobbies" class="form-control" value="${v('hobbies')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Languages Known</label><br>
                                        <label><input type="checkbox" name="languages_known" value="Gujarati" ${v('languages_known')?.includes('Gujarati') ? 'checked' : ''}> Gujarati</label><br>
                                        <label><input type="checkbox" name="languages_known" value="Hindi" ${v('languages_known')?.includes('Hindi') ? 'checked' : ''}> Hindi</label><br>
                                        <label><input type="checkbox" name="languages_known" value="English" ${v('languages_known')?.includes('English') ? 'checked' : ''}> English</label><br>
                                        <input type="text" name="languages_known_other" class="form-control mt-2" value="${v('languages_known_other') || ''}" placeholder="Other languages">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Strength</label>
                                        <input type="text" name="strength" class="form-control" value="${v('strength')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Weakness</label>
                                        <input type="text" name="weakness" class="form-control" value="${v('weakness')}">
                                    </div>
                                </div>
                            </div>

                            <!-- Family -->
                            <div class="tab-pane fade" id="family" role="tabpanel">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Father's Name</label>
                                        <input type="text" name="father_name" class="form-control" value="${v('father_name')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Mother's Name</label>
                                        <input type="text" name="mother_name" class="form-control" value="${v('mother_name')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Siblings</label>
                                        <input type="number" name="siblings" class="form-control" value="${v('siblings')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Marital Status</label>
                                        <select name="marital_status" class="form-control">
                                            <option value="">Select</option>
                                            <option value="single" ${v('marital_status')==='single'?'selected':''}>Single</option>
                                            <option value="married" ${v('marital_status')==='married'?'selected':''}>Married</option>
                                            <option value="divorced" ${v('marital_status')==='divorced'?'selected':''}>Divorced</option>
                                            <option value="separate" ${v('marital_status')==='separate'?'selected':''}>Separate</option>
                                            <option value="widow" ${v('marital_status')==='widow'?'selected':''}>Widow</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Spouse Name</label>
                                        <input type="text" name="spouse_name" class="form-control" value="${v('spouse_name')}">
                                    </div>
                                </div>
                            </div>

                            <!-- Education -->
                            <div class="tab-pane fade" id="education" role="tabpanel">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Last Degree</label>
                                        <input type="text" name="last_degree" class="form-control" value="${v('last_degree')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Passing Year</label>
                                        <input type="number" name="passing_year" min="1900" max="2100" class="form-control" value="${v('passing_year')}">
                                    </div>
                                </div>
                            </div>

                            <!-- Work Experience -->
                            <div class="tab-pane fade" id="work" role="tabpanel">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Work Status</label>
                                        <select name="work_status" class="form-control">
                                            <option value="fresher" ${v('work_status')==='fresher'?'selected':''}>Fresher</option>
                                            <option value="experienced" ${v('work_status')==='experienced'?'selected':''}>Experienced</option>
                                        </select>
                                    </div>

                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Current Employer</label>
                                        <input type="text" name="current_employer" class="form-control" value="${v('current_employer')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Current CTC</label>
                                        <input type="number" name="current_ctc" class="form-control" value="${v('current_ctc')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Current Designation</label>
                                        <input type="text" name="current_designation" class="form-control" value="${v('current_designation')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Current Joining Date</label>
                                        <input type="date" name="current_joining_date" class="form-control" value="${v('current_joining_date')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Current Bond</label>
                                        <input type="text" name="current_bond" class="form-control" value="${v('current_bond')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Notice Period (Days)</label>
                                        <input type="number" name="notice_period_days" class="form-control" value="${v('notice_period_days')}">
                                    </div>

                                    <!-- Second Employer -->
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Second Employer</label>
                                        <input type="text" name="second_employer" class="form-control" value="${v('second_employer')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Second Designation</label>
                                        <input type="text" name="second_designation" class="form-control" value="${v('second_designation')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Second Joining Date</label>
                                        <input type="date" name="second_joining_date" class="form-control" value="${v('second_joining_date')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Second Releaving Date</label>
                                        <input type="date" name="second_releaving_date" class="form-control" value="${v('second_releaving_date')}">
                                    </div>

                                    <!-- Third Employer -->
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Third Employer</label>
                                        <input type="text" name="third_employer" class="form-control" value="${v('third_employer')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Third Designation</label>
                                        <input type="text" name="third_designation" class="form-control" value="${v('third_designation')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Third Joining Date</label>
                                        <input type="date" name="third_joining_date" class="form-control" value="${v('third_joining_date')}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Third Releaving Date</label>
                                        <input type="date" name="third_releaving_date" class="form-control" value="${v('third_releaving_date')}">
                                    </div>

                                    <div class="col-md-12 mb-3">
                                        <label class="form-label">Remarks</label>
                                        <textarea name="remarks" class="form-control">${v('remarks')}</textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Internal Use -->
                            <div class="tab-pane fade" id="internal" role="tabpanel">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Position Applied For</label>
                                        <select id="post_apply" name="post_apply"  class="form-control" required>
                                        <option value="">Select Designation</option>
                                        ${optionList(state.designations, 'des_name', 'des_name', v('post_apply'))}
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Sent to Department</label>
                                        <select id="sent_to_dept" name="sent_to_dept" class="form-control" required>
                                        <option value="">Select Department</option>
                                        ${optionList(state.departments, 'dept_name', 'dept_name', v('sent_to_dept'))}
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Interviewer Name</label>
                                        <select id="inter_name" name="inter_name" class="form-control" required>
                                        <option value="">Select Interviewer</option>
                                        ${optionList(state.employees, 'emp_name', 'emp_name', v('inter_name'))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <button type="submit" class="btn btn-primary">Submit</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;

    // Insert modal into a container in your HTML
    document.getElementById('modals-container').innerHTML = modalHTML;

    // Show bootstrap modal
    const modalElem = document.getElementById('interviewJoiningModal');
    const modal = new bootstrap.Modal(modalElem);
    modal.show();
}

async function saveInterviewJoining(event) {
    event.preventDefault();
    
    const form = document.getElementById('interviewJoiningForm');
    const formData = new FormData(form);
    
    // Get values from dropdown selects
    const post_apply = document.getElementById('post_apply').value;
    const sent_to_dept = document.getElementById('sent_to_dept').value;
    const inter_name = document.getElementById('inter_name').value;

    // Handle checkbox values for languages
    const languagesKnown = [];
    formData.getAll('languages_known').forEach(lang => {
        if (lang) languagesKnown.push(lang);
    });
    
    // Convert empty strings to null for database
    const convertEmptyToNull = (value) => (value === '' ? null : value);
    const convertToInt = (value) => (value ? parseInt(value) : null);
    const convertToFloat = (value) => (value ? parseFloat(value) : null);
    
    // Build the payload object for interview joining
    const payload = {
        candidate_name: convertEmptyToNull(formData.get('candidate_name')),
        address: convertEmptyToNull(formData.get('address')),
        email: convertEmptyToNull(formData.get('email')),
        contact_number: convertEmptyToNull(formData.get('contact_number')),
        birthdate: convertEmptyToNull(formData.get('birthdate')),
        hobbies: convertEmptyToNull(formData.get('hobbies')),
        languages_known: languagesKnown.length > 0 ? languagesKnown.join(', ') : null,
        languages_known_other: convertEmptyToNull(formData.get('languages_known_other')),
        strength: convertEmptyToNull(formData.get('strength')),
        weakness: convertEmptyToNull(formData.get('weakness')),
        father_name: convertEmptyToNull(formData.get('father_name')),
        mother_name: convertEmptyToNull(formData.get('mother_name')),
        siblings: convertToInt(formData.get('siblings')),
        marital_status: convertEmptyToNull(formData.get('marital_status')),
        spouse_name: convertEmptyToNull(formData.get('spouse_name')),
        last_degree: convertEmptyToNull(formData.get('last_degree')),
        passing_year: convertToInt(formData.get('passing_year')),
        work_status: convertEmptyToNull(formData.get('work_status')),
        current_employer: convertEmptyToNull(formData.get('current_employer')),
        current_ctc: convertToFloat(formData.get('current_ctc')),
        current_designation: convertEmptyToNull(formData.get('current_designation')),
        current_joining_date: convertEmptyToNull(formData.get('current_joining_date')),
        current_bond: convertEmptyToNull(formData.get('current_bond')),
        notice_period_days: convertToInt(formData.get('notice_period_days')),
        second_employer: convertEmptyToNull(formData.get('second_employer')),
        second_designation: convertEmptyToNull(formData.get('second_designation')),
        second_joining_date: convertEmptyToNull(formData.get('second_joining_date')),
        second_releaving_date: convertEmptyToNull(formData.get('second_releaving_date')),
        third_employer: convertEmptyToNull(formData.get('third_employer')),
        third_designation: convertEmptyToNull(formData.get('third_designation')),
        third_joining_date: convertEmptyToNull(formData.get('third_joining_date')),
        third_releaving_date: convertEmptyToNull(formData.get('third_releaving_date')),
        remarks: convertEmptyToNull(formData.get('remarks')),
        post_apply: formData.get('post_apply'),       
        sent_to_dept: formData.get('sent_to_dept'),    
        inter_name: formData.get('inter_name'),        
        status: "Pending"
    };

    console.log("Sending payload:", payload); // Debug log

    try {
        if (state.editingInterviewJoiningId) {
            await apiRequest(`/api/interview-joining/${state.editingInterviewJoiningId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            await apiRequest('/api/interview-joining', { 
                method: 'POST',
                headers: {
			'Content-Type': 'application/json'
		},
                body: JSON.stringify(payload)
            });
        }
        
        // Close modal and reload data
        bootstrap.Modal.getInstance(document.getElementById('interviewJoiningModal')).hide();
        await loadInterviewJoining();
        alert("Candidate evaluation submitted successfully!");
    } catch (error) {
        console.error("Failed to save Interview to Joining:", error);
        alert("Failed to save data. Please check console for details.");
    }
}

// Helper function to format datetime for input[type=datetime-local]
function formatDateTimeForInput(dateTimeStr) {
    const date = new Date(dateTimeStr);
    return date.toISOString().slice(0, 16);
}

// Edit functions
function editEmployee(id) {
    const employee = state.employees.find(emp => emp.id === id);
    if (employee) {
        // Make sure we have latest reference data loaded (to fill selects)
        Promise.all([
            state.departments.length ? Promise.resolve() : loadDepartments(),
            state.designations.length ? Promise.resolve() : loadDesignations(),
            state.shifts.length ? Promise.resolve() : loadShifts(),
            state.divisions.length ? Promise.resolve() : loadDivisions(),
            state.banks.length ? Promise.resolve() : loadBanks(),
            state.busRoutes.length ? Promise.resolve() : loadBusRoutes(),
            state.busRouteStops.length ? Promise.resolve() : loadBusRouteStops()
        ]).then(() => {
            showEmployeeModal(employee);
        });
    }
}

function editDesignation(id) {
    const des = state.designations.find(d => d.des_id === id);
    if (!des) return;

    state.currentEditingId = id;

    const modalHTML = `
      <div class="modal fade" id="designationModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Designation</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="designationForm">
                <div class="mb-3">
                  <label class="form-label">Designation Name</label>
                  <input type="text" id="desName" class="form-control" value="${des.des_name}" required />
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" onclick="saveDesignation()">Save</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modals-container').innerHTML = modalHTML;
    const modalElem = document.getElementById('designationModal');
    const modal = new bootstrap.Modal(modalElem);
    modal.show();
}

function editShift(shift_id) {
    const shift = state.shifts.find(s => s.shift_id === shift_id);
    if (!shift) {
        console.error("Shift not found:", shift_id);
        return;
    }

    // store which shift we’re editing
    state.currentEditingId = shift_id;

    const modalHTML = `
    <div class="modal fade" id="shiftModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Shift</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="shiftForm">
              <div class="mb-3">
                <label class="form-label">Shift Name</label>
                <input type="text" id="shift_name" class="form-control" value="${shift.shift_name}" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Start Time</label>
                <input type="time" id="shift_start" class="form-control" value="${shift.shift_start}" required>
              </div>
              <div class="mb-3">
                <label class="form-label">End Time</label>
                <input type="time" id="shift_end" class="form-control" value="${shift.shift_end}" required>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="saveShift()">Save</button>
          </div>
        </div>
      </div>
    </div>
    `;

    document.getElementById('modals-container').innerHTML = modalHTML;
    const modalElem = document.getElementById('shiftModal');
    const modal = new bootstrap.Modal(modalElem);
    modal.show();
}

function editDivision(divn_id) {
    const division = state.divisions.find(d => d.divn_id === divn_id);
    if (!division) {
        console.error("Division not found:", divn_id);
        return;
    }

    state.currentEditingId = divn_id;

    const modalHTML = `
    <div class="modal fade" id="divisionModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Division</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="divisionForm">
              <div class="mb-3">
                <label class="form-label">Division Name</label>
                <input type="text" id="divn_name" class="form-control" value="${division.divn_name}" required />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="saveDivision()">Save</button>
          </div>
        </div>
      </div>
    </div>
    `;

    document.getElementById('modals-container').innerHTML = modalHTML;
    const modalElem = document.getElementById('divisionModal');
    const modal = new bootstrap.Modal(modalElem);
    modal.show();
}

function editInterviewJoining(id) {
    const record = interviewJoiningData.find(r => r.id === id);
    if (!record) return;

    editingInterviewJoiningId = id;

    // Fill form fields
    document.getElementById("position").value = record.position;
    document.getElementById("candidate").value = record.candidate;
    document.getElementById("phone").value = record.phone;
    document.getElementById("sent_to_dept").value = record.sent_to_dept;
    document.getElementById("interviewer").value = record.interviewer;
    document.getElementById("status").value = record.status;
    document.getElementById("joiningDate").value = record.joiningDate;
    document.getElementById("designation").value = record.designation;

    const modal = new bootstrap.Modal(document.getElementById("interviewJoiningModal"));
    modal.show();
}


// Save employee (create/update)
async function saveEmployee() {
    // Collect all fields
    const makeVal = id => {
        const el = document.getElementById(id);
        if (!el) return null;
        // return null for empty string to avoid passing empty string for date/number fields
        return el.value === '' ? null : el.value;
    };

    const payload = {
        emp_code: makeVal('emp_code'),
        emp_name: makeVal('emp_name'),
        emp_address: makeVal('emp_address'),
        emp_personal_contact: makeVal('emp_personal_contact'),
        emp_personal_email: makeVal('emp_personal_email'),
        emp_emergency_contact: makeVal('emp_emergency_contact'),
        emp_dob: makeVal('emp_dob'),
        emp_last_education: makeVal('emp_last_education'),
        emp_aadhar_name: makeVal('emp_aadhar_name'),
        emp_aadhar_no: makeVal('emp_aadhar_no'),
        emp_pan_no: makeVal('emp_pan_no'),
        emp_pan_name: makeVal('emp_pan_name'),
        emp_doj: makeVal('emp_doj'),
        divn_id: makeVal('divn_id') ? parseInt(makeVal('divn_id')) : null,
        dept_id: makeVal('dept_id') ? parseInt(makeVal('dept_id')) : null,
        des_id: makeVal('des_id') ? parseInt(makeVal('des_id')) : null,
        shift_id: makeVal('shift_id') ? parseInt(makeVal('shift_id')) : null,
        emp_official_email: makeVal('emp_official_email'),
        imm_superior_name: makeVal('imm_superior_name'),
        imm_superior_email: makeVal('imm_superior_email'),
        hod_name: makeVal('hod_name'),
        hod_email: makeVal('hod_email'),
        ctc: makeVal('ctc') ? parseFloat(makeVal('ctc')) : null,
        gross_salary: makeVal('gross_salary') ? parseFloat(makeVal('gross_salary')) : null,
        take_home_salary: makeVal('take_home_salary') ? parseFloat(makeVal('take_home_salary')) : null,
        emp_bank_acc_no: makeVal('emp_bank_acc_no'),
        bank_id: makeVal('bank_id') ? parseInt(makeVal('bank_id')) : null,
        bus_avail: (makeVal('bus_avail') === 'true' || makeVal('bus_avail') === true),
        route_id: makeVal('route_id') ? parseInt(makeVal('route_id')) : null,
        stop_id: makeVal('stop_id') ? parseInt(makeVal('stop_id')) : null,
        pl_bal: makeVal('pl_bal') ? parseFloat(makeVal('pl_bal')) : null,
        cl_bal: makeVal('cl_bal') ? parseFloat(makeVal('cl_bal')) : null,
        status: makeVal('status'),
        resignation_date: makeVal('resignation_date'),
        last_working_date: makeVal('last_working_date'),
        releaving_date: makeVal('releaving_date'),
        remarks: makeVal('remarks')
    };

    try {
        if (state.currentEditingId) {
            await apiRequest(`/api/employees/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            await apiRequest('/api/employees', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        // hide modal
        const modalEl = document.getElementById('employeeModal');
        if (modalEl) {
            bootstrap.Modal.getInstance(modalEl).hide();
        }

        await loadEmployees();
        await loadDashboardData();
    } catch (error) {
        console.error('Failed to save employee:', error);
    }
}

// The rest: modals and save/delete for other entities (same as before)
function showDepartmentModal(deptOrId = null) {
    let dept = deptOrId;
    if (typeof deptOrId === 'number') {
        dept = state.departments.find(d => d.dept_id === deptOrId);
    }

    state.currentEditingId = dept ? dept.dept_id : null;
    const v = (key) => dept ? dept[key] : '';

    const modalHTML = `
    <div class="modal fade" id="departmentModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${dept ? 'Edit' : 'Add'} Department</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="departmentForm">
              <div class="mb-3">
                <label class="form-label">Department Name</label>
                <input type="text" id="dept_name" class="form-control" value="${v('dept_name')}" required />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="saveDepartment()">Save</button>
          </div>
        </div>
      </div>
    </div>
    `;

    document.getElementById('modals-container').innerHTML = modalHTML;
    const modalElem = document.getElementById('departmentModal');
    const modal = new bootstrap.Modal(modalElem);
    modal.show();
}

async function saveDepartment() {
    try {
        const deptName = document.getElementById('dept_name').value;

        const payload = { dept_name: deptName };

        if (state.currentEditingId) {
            await apiRequest(`/api/departments/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            await apiRequest('/api/departments', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        await loadDepartments();
        bootstrap.Modal.getInstance(document.getElementById('departmentModal')).hide();
    } catch (err) {
        console.error('Failed to save department:', err);
    }
}

function showDesignationModal(designation = null) {
    state.currentEditingId = designation ? designation.des_id : null;

    const modalHTML = `
        <div class="modal fade" id="designationModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${designation ? 'Edit' : 'Add'} Designation</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="designationForm">
                            <div class="mb-3">
                                <label class="form-label">Designation Name</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    id="desName" 
                                    value="${designation ? designation.des_name : ''}" 
                                    required
                                >
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveDesignation()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Inject modal into container
    const container = document.getElementById('modals-container');
    if (!container) {
        console.error("❌ Modal container not found in DOM (id='modals-container')");
        return;
    }
    container.innerHTML = modalHTML;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('designationModal'));
    modal.show();
}

async function saveDesignation() {
    const desInput = document.getElementById('desName');
    if (!desInput) {
        console.error("❌ Designation input (#desName) not found in DOM");
        return;
    }

    const designationData = {
        des_name: desInput.value.trim()
    };

    try {
        if (state.currentEditingId) {
            await apiRequest(`/api/designations/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(designationData)
            });
        } else {
            await apiRequest('/api/designations', {
                method: 'POST',
                body: JSON.stringify(designationData)
            });
        }

        // ✅ close after reading
        const modalEl = document.getElementById('designationModal');
        if (modalEl) {
            bootstrap.Modal.getInstance(modalEl).hide();
        }

        await loadDesignations();
        await loadDashboardData();
    } catch (error) {
        console.error('❌ Failed to save designation:', error);
    }
}

function showShiftModal(shift = null) {
    state.currentEditingId = shift ? shift.shift_id : null;
    
    const modalHTML = `
        <div class="modal fade" id="shiftModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${shift ? 'Edit' : 'Add'} Shift</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="shiftForm">
                            <div class="mb-3">
                                <label class="form-label">Shift Name</label>
                                <input type="text" class="form-control" id="shiftName" value="${shift ? shift.shift_name : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Start Time</label>
                                <input type="time" class="form-control" id="shiftStart" value="${shift ? shift.shift_start : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">End Time</label>
                                <input type="time" class="form-control" id="shiftEnd" value="${shift ? shift.shift_end : ''}" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveShift()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modals-container').innerHTML = modalHTML;
    const modal = new bootstrap.Modal(document.getElementById('shiftModal'));
    modal.show();
}

async function saveShift() {
    const shiftData = {
        shift_name: document.getElementById('shiftName').value,
        shift_start: document.getElementById('shiftStart').value,
        shift_end: document.getElementById('shiftEnd').value
    };
    
    try {
        if (state.currentEditingId) {
            await apiRequest(`/api/shifts/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(shiftData)
            });
        } else {
            await apiRequest('/api/shifts', {
                method: 'POST',
                body: JSON.stringify(shiftData)
            });
        }
        
        bootstrap.Modal.getInstance(document.getElementById('shiftModal')).hide();
        await loadShifts();
    } catch (error) {
        console.error('Failed to save shift:', error);
    }
}

function showDivisionModal(division = null) {
    state.currentEditingId = division ? division.divn_id : null;
    
    const modalHTML = `
        <div class="modal fade" id="divisionModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${division ? 'Edit' : 'Add'} Division</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="divisionForm">
                            <div class="mb-3">
                                <label class="form-label">Division Name</label>
                                <input type="text" class="form-control" id="divName" value="${division ? division.divn_name : ''}" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveDivision()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modals-container').innerHTML = modalHTML;
    const modal = new bootstrap.Modal(document.getElementById('divisionModal'));
    modal.show();
}

async function saveDivision() {
    try {
        const divn_name = document.getElementById('divn_name').value;
        const payload = { divn_name };

        if (state.currentEditingId) {
            // Update
            await apiRequest(`/api/divisions/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            // Create
            await apiRequest('/api/divisions', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        await loadDivisions();
        bootstrap.Modal.getInstance(document.getElementById('divisionModal')).hide();
    } catch (error) {
        console.error("Failed to save division:", error);
    }
}

function showBankModal(bank = null) {
    state.currentEditingId = bank ? bank.bank_id : null;
    
    const modalHTML = `
        <div class="modal fade" id="bankModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${bank ? 'Edit' : 'Add'} Bank</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="bankForm">
                            <div class="mb-3">
                                <label class="form-label">Country Code</label>
                                <input type="text" class="form-control" id="bankCountry" value="${bank ? bank.country_code : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Bank Code</label>
                                <input type="text" class="form-control" id="bankCode" value="${bank ? bank.bank_code : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Bank Name</label>
                                <input type="text" class="form-control" id="bankName" value="${bank ? bank.bank_name : ''}" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveBank()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modals-container').innerHTML = modalHTML;
    const modal = new bootstrap.Modal(document.getElementById('bankModal'));
    modal.show();
}

async function saveBank() {
    const bankData = {
        country_code: document.getElementById('bankCountry').value,
        bank_code: document.getElementById('bankCode').value,
        bank_name: document.getElementById('bankName').value
    };
    
    try {
        if (state.currentEditingId) {
            await apiRequest(`/api/banks/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(bankData)
            });
        } else {
            await apiRequest('/api/banks', {
                method: 'POST',
                body: JSON.stringify(bankData)
            });
        }
        
        bootstrap.Modal.getInstance(document.getElementById('bankModal')).hide();
        await loadBanks();
    } catch (error) {
        console.error('Failed to save bank:', error);
    }
}

function showBusRouteModal(route = null) {
    state.currentEditingId = route ? route.route_id : null;
    
    const modalHTML = `
        <div class="modal fade" id="busRouteModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${route ? 'Edit' : 'Add'} Bus Route</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="busRouteForm">
                            <div class="mb-3">
                                <label class="form-label">Route Name</label>
                                <input type="text" class="form-control" id="routeName" value="${route ? route.route_name : ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Route Number</label>
                                <input type="text" class="form-control" id="routeNumber" value="${route ? route.route_number : ''}" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveBusRoute()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modals-container').innerHTML = modalHTML;
    const modal = new bootstrap.Modal(document.getElementById('busRouteModal'));
    modal.show();
}

async function saveBusRoute() {
    const routeData = {
        route_name: document.getElementById('routeName').value,
        route_number: document.getElementById('routeNumber').value
    };
    
    try {
        if (state.currentEditingId) {
            await apiRequest(`/api/bus-routes/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(routeData)
            });
        } else {
            await apiRequest('/api/bus-routes', {
                method: 'POST',
                body: JSON.stringify(routeData)
            });
        }
        
        bootstrap.Modal.getInstance(document.getElementById('busRouteModal')).hide();
        await loadBusRoutes();
        await loadBusRouteStops();
    } catch (error) {
        console.error('Failed to save bus route:', error);
    }
}

function showBusRouteStopModal(stopOrId = null) {
    let stop = stopOrId;
    if (typeof stopOrId === 'number') {
        stop = state.busRouteStops.find(s => s.stop_id === stopOrId);
    }

    state.currentEditingId = stop ? stop.stop_id : null;

    const modalHTML = `
        <div class="modal fade" id="busRouteStopModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${stop ? 'Edit' : 'Add'} Bus Route Stop</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="busRouteStopForm">
                            <div class="mb-3">
                                <label class="form-label">Route</label>
                                <select class="form-control" id="stopRouteId" required>
                                    <option value="">Select Route</option>
                                    ${state.busRoutes.map(route => 
                                        `<option value="${route.route_id}" ${stop && stop.route_id === route.route_id ? 'selected' : ''}>${route.route_name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Stop Name</label>
                                <input type="text" class="form-control" id="stopName" value="${stop ? stop.stop_name : ''}" required>
                            </div>
			    <div class="mb-3">
                                <label class="form-label">Display Order</label>
                                <input type="number" class="form-control" id="stopOrder" value="${stop ? stop.display_order : ''}" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveBusRouteStop()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modals-container').innerHTML = modalHTML;
    const modal = new bootstrap.Modal(document.getElementById('busRouteStopModal'));
    modal.show();
}

async function saveBusRouteStop() {
   const stopData = {
    route_id: parseInt(document.getElementById('stopRouteId').value),
    stop_name: document.getElementById('stopName').value,
    display_order: parseInt(document.getElementById('stopOrder').value)
};

    try {
        if (state.currentEditingId) {
            await apiRequest(`/api/bus-route-stops/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(stopData)
            });
        } else {
            await apiRequest('/api/bus-route-stops', {
                method: 'POST',
                body: JSON.stringify(stopData)
            });
        }

        bootstrap.Modal.getInstance(document.getElementById('busRouteStopModal')).hide();
        await loadBusRoutes();
        await loadBusRouteStops();
    } catch (error) {
        console.error('Failed to save bus route stop:', error);
    }
}

// Delete functions
async function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        try {
            await apiRequest(`/api/employees/${id}`, {
                method: 'DELETE'
            });
            await loadEmployees();
            await loadDashboardData();
        } catch (error) {
            console.error('Failed to delete employee:', error);
        }
    }
}

async function deleteDepartment(id) {
    if (confirm('Are you sure you want to delete this department?')) {
        try {
            await apiRequest(`/api/departments/${id}`, {
                method: 'DELETE'
            });
            await loadDepartments();
            await loadDashboardData();
        } catch (error) {
            console.error('Failed to delete department:', error);
        }
    }
}

async function deleteDesignation(id) {
    if (confirm('Are you sure you want to delete this designation?')) {
        try {
            await apiRequest(`/api/designations/${id}`, {
                method: 'DELETE'
            });
            await loadDesignations();
            await loadDashboardData();
        } catch (error) {
            console.error('Failed to delete designation:', error);
        }
    }
}

async function deleteShift(id) {
    if (confirm('Are you sure you want to delete this shift?')) {
        try {
            await apiRequest(`/api/shifts/${id}`, {
                method: 'DELETE'
            });
            await loadShifts();
        } catch (error) {
            console.error('Failed to delete shift:', error);
        }
    }
}

async function deleteDivision(id) {
    if (confirm('Are you sure you want to delete this division?')) {
        try {
            await apiRequest(`/api/divisions/${id}`, {
                method: 'DELETE'
            });
            await loadDivisions();
        } catch (error) {
            console.error('Failed to delete division:', error);
        }
    }
}

async function deleteBank(id) {
    if (confirm('Are you sure you want to delete this bank?')) {
        try {
            await apiRequest(`/api/banks/${id}`, {
                method: 'DELETE'
            });
            await loadBanks();
        } catch (error) {
            console.error('Failed to delete bank:', error);
        }
    }
}

async function deleteBusRoute(id) {
    if (confirm('Are you sure you want to delete this bus route? All associated stops will also be deleted.')) {
        try {
            await apiRequest(`/api/bus-routes/${id}`, {
                method: 'DELETE'
            });
            await loadBusRoutes();
            await loadBusRouteStops();
        } catch (error) {
            console.error('Failed to delete bus route:', error);
        }
    }
}

async function deleteBusRouteStop(id) {
    if (confirm('Are you sure you want to delete this bus route stop?')) {
        try {
            await apiRequest(`/api/bus-route-stops/${id}`, {
                method: 'DELETE'
            });
            await loadBusRouteStops();
        } catch (error) {
            console.error('Failed to delete bus route stop:', error);
        }
    }
}

async function deleteInterviewJoining(id) {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
        await apiRequest(`/api/interview-joining/${id}`, { method: 'DELETE' });
        loadInterviewJoining();
    } catch (error) {
        console.error("Failed to delete Interview to Joining:", error);
    }
}

// Gate Pass CRUD
async function saveGatePass() {
    try {
        const emp_id = document.getElementById('emp_id').value;
        const gate_pass_type = document.getElementById('gate_pass_type').value;
        const gate_pass_time = document.getElementById('gate_pass_time').value;
        const reason = document.getElementById('reason').value;

        const payload = {
    emp_id: parseInt(emp_id),
    gate_pass_type,
    gate_pass_time: gate_pass_time,  // Already "2025-09-04T05:45"
    reason
};

        if (state.currentEditingId) {
            // Update
            await apiRequest(`/api/gate-passes/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            // Create
            await apiRequest('/api/gate-passes', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        // Reload data and close modal
        await loadGatePasses();
        bootstrap.Modal.getInstance(document.getElementById('gatePassModal')).hide();
    } catch (error) {
        console.error('Failed to save gate pass:', error);
    }
}

function editGatePass(id) {
    const gatePass = state.gatePasses.find(gp => gp.gate_pass_id === id);
    if (gatePass) {
        showGatePassModal(gatePass);
    }
}

async function deleteGatePass(id) {
    if (confirm('Are you sure you want to delete this gate pass?')) {
        try {
            await apiRequest(`/api/gate-passes/${id}`, {
                method: 'DELETE'
            });
            loadGatePasses();
        } catch (error) {
            console.error('Failed to delete gate pass:', error);
        }
    }
}

// Overtime CRUD
async function saveOvertime() {
    const overtimeData = {
        emp_id: parseInt(document.getElementById('overtimeEmpId').value),
        overtime_date: document.getElementById('overtimeDate').value,
        start_time: document.getElementById('overtimeStart').value,
        end_time: document.getElementById('overtimeEnd').value,
        total_hours: parseFloat(document.getElementById('overtimeHours').value),
        reason: document.getElementById('overtimeReason').value,
        
        
    };
    
    try {
        if (state.currentEditingId) {
            await apiRequest(`/api/overtimes/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(overtimeData)
            });
        } else {
            await apiRequest('/api/overtimes', {
                method: 'POST',
                body: JSON.stringify(overtimeData)
            });
        }
        
        bootstrap.Modal.getInstance(document.getElementById('overtimeModal')).hide();
        loadOvertimes();
    } catch (error) {
        console.error('Failed to save overtime:', error);
    }
}

function editOvertime(id) {
    const overtime = state.overtimes.find(ot => ot.overtime_id === id);
    if (overtime) {
        showOvertimeModal(overtime);
    }
}

async function deleteOvertime(id) {
    if (confirm('Are you sure you want to delete this overtime record?')) {
        try {
            await apiRequest(`/api/overtimes/${id}`, {
                method: 'DELETE'
            });
            loadOvertimes();
        } catch (error) {
            console.error('Failed to delete overtime:', error);
        }
    }
}

// Leave CRUD
async function saveLeave() {
    const leaveData = {
        emp_id: parseInt(document.getElementById('leaveEmpId').value),
        leave_type: document.getElementById('leaveType').value,
        start_date: document.getElementById('leaveStart').value,
        end_date: document.getElementById('leaveEnd').value,
        total_days: parseFloat(document.getElementById('leaveDays').value),
        reason: document.getElementById('leaveReason').value,
        
        
    };
    
    try {
        if (state.currentEditingId) {
            await apiRequest(`/api/leaves/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(leaveData)
            });
        } else {
            await apiRequest('/api/leaves', {
                method: 'POST',
                body: JSON.stringify(leaveData)
            });
        }
        
        bootstrap.Modal.getInstance(document.getElementById('leaveModal')).hide();
        loadLeaves();
    } catch (error) {
        console.error('Failed to save leave:', error);
    }
}

function editLeave(id) {
    const leave = state.leaves.find(lv => lv.leave_id === id);
    if (leave) {
        showLeaveModal(leave);
    }
}

async function deleteLeave(id) {
    if (confirm('Are you sure you want to delete this leave record?')) {
        try {
            await apiRequest(`/api/leaves/${id}`, {
                method: 'DELETE'
            });
            loadLeaves();
        } catch (error) {
            console.error('Failed to delete leave:', error);
        }
    }
}

// Missed Punch CRUD
async function saveMissedPunch() {
    const missedPunchData = {
        emp_id: parseInt(document.getElementById('missedPunchEmpId').value),
        punch_date: document.getElementById('missedPunchDate').value,
        punch_type: document.getElementById('missedPunchType').value,
        actual_time: document.getElementById('missedPunchTime').value,
        reason: document.getElementById('missedPunchReason').value,
        
        
    };
    
    try {
        if (state.currentEditingId) {
            await apiRequest(`/api/missed-punches/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(missedPunchData)
            });
        } else {
            await apiRequest('/api/missed-punches', {
                method: 'POST',
                body: JSON.stringify(missedPunchData)
            });
        }
        
        bootstrap.Modal.getInstance(document.getElementById('missedPunchModal')).hide();
        loadMissedPunches();
    } catch (error) {
        console.error('Failed to save missed punch:', error);
    }
}

function editMissedPunch(id) {
    const missedPunch = state.missedPunches.find(mp => mp.missed_punch_id === id);
    if (missedPunch) {
        showMissedPunchModal(missedPunch);
    }
}

async function deleteMissedPunch(id) {
    if (confirm('Are you sure you want to delete this missed punch record?')) {
        try {
            await apiRequest(`/api/missed-punches/${id}`, {
                method: 'DELETE'
            });
            loadMissedPunches();
        } catch (error) {
            console.error('Failed to delete missed punch:', error);
        }
    }
}

//Resination to Releaving

function showResignationModal() {
    const optionList = (items, valueField, labelField) => {
        return '<option value="">Select Employee</option>' + 
            items.map(it => `<option value="${it[valueField]}">${it[labelField]}</option>`).join('');
    };

    const modalHTML = `
    <div class="modal fade" id="resignationModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Fill Resignation</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="resignationForm">
              <div class="mb-3">
                <label class="form-label">Employee Code</label>
                <select id="emp_code" class="form-control">
                  ${optionList(state.employees, 'emp_code', 'emp_name')}
                </select>
              </div>
              <div id="employeeDetails" style="display:none;">
                <div class="mb-3">
                  <label class="form-label">Employee Name</label>
                  <input type="text" id="emp_name" class="form-control" readonly />
                </div>
                <div class="mb-3">
                  <label class="form-label">Date of Joining</label>
                  <input type="date" id="emp_doj" class="form-control" readonly />
                </div>
                <div class="mb-3">
                  <label class="form-label">Division</label>
                  <input type="text" id="divn_name" class="form-control" readonly />
                </div>
                <div class="mb-3">
                  <label class="form-label">Department</label>
                  <input type="text" id="dept_name" class="form-control" readonly />
                </div>
                <div class="mb-3">
                  <label class="form-label">Designation</label>
                  <input type="text" id="des_name" class="form-control" readonly />
                </div>
                <div class="mb-3">
                  <label class="form-label">HOD Name</label>
                  <input type="text" id="hod_name" class="form-control" readonly />
                </div>
                <div class="mb-3">
                  <label class="form-label">HOD Email</label>
                  <input type="email" id="hod_email" class="form-control" readonly />
                </div>
              </div>
                <div class="mb-3">
                  <label class="form-label">Reason</label>
                  <input type="text" id="reason" class="form-control" required />
                </div>
              <div class="mb-3">
                <label class="form-label">Resignation Date</label>
                <input type="date" id="resignation_date" class="form-control" required />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="saveResignation()">Submit</button>
          </div>
        </div>
      </div>
    </div>
    `;

    document.getElementById('modals-container').innerHTML = modalHTML;

    // Show the modal
    const modalElem = document.getElementById('resignationModal');
    const modal = new bootstrap.Modal(modalElem);
    modal.show();

    // Add change listener to employee dropdown
    document.getElementById('emp_code').addEventListener('change', async function() {
        const empCode = this.value;
        if (!empCode) {
            document.getElementById('employeeDetails').style.display = 'none';
            return;
        }
        try {
            const empData = await apiRequest(`/api/employees/${empCode}`);
            document.getElementById('emp_name').value = empData.emp_name || '';
            document.getElementById('emp_doj').value = empData.emp_doj || '';
            document.getElementById('divn_name').value = empData.divn_name || '';
            document.getElementById('dept_name').value = empData.dept_name || '';
            document.getElementById('des_name').value = empData.des_name || '';
            document.getElementById('hod_name').value = empData.hod_name || '';
            document.getElementById('hod_email').value = empData.hod_email || '';
            document.getElementById('reason').value = empData.reason || '';
            document.getElementById('employeeDetails').style.display = 'block';
        } catch (err) {
            alert('Failed to fetch employee details.');
            console.error(err);
        }
    });
}

async function loadResignations() {
    try {
        state.resignations = await apiRequest('/api/resignations'); // API to return all resignations
        renderResignations();
    } catch (err) {
        console.error('Failed to load resignations:', err);
    }
}

function renderResignations() {
    const tbody = document.getElementById('resignation-to-releaving-table-body');
    tbody.innerHTML = '';

    if (!state.resignations || !state.resignations.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">No records found</td></tr>`;
        return;
    }

    state.resignations.forEach(res => {
        // Decide task button label based on status
        let taskLabel = '';
        switch (res.status) {
            case 'Pending':
                taskLabel = 'Click Here';
                break;
            case 'Approved':
                taskLabel = 'Fill Exit Interview';
                break;
            case 'Exit Interview Done':
                taskLabel = 'Complete No Due';
                break;
            case 'No Due Done':
                taskLabel = 'Mark Releaving Done';
                break;
            case 'Releaving Done':
                taskLabel = 'Fill F&F Done';
                break;
            case 'F&F Done':
                taskLabel = 'Final Approval';
                break;
            case 'Final Approval':
                taskLabel = 'No Action';
                break;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${res.emp_code || ''}</td>
            <td>${res.emp_name || ''}</td>
            <td>${res.des_name || ''}</td>
            <td>${res.dept_name || ''}</td>
            <td>${res.hod_name || ''}</td>
            <td>${res.releaving_date || ''}</td>
            <td><span class="badge ${getStatusBadgeClass(res.status)}">${res.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editResignation(${res.resignation_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteResignation(${res.resignation_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
            <td>
                <button class="btn btn-sm btn-success" onclick="handleResignationTaskClick(${res.resignation_id})">
                    ${taskLabel}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Handle task button click
function handleResignationTaskClick(resignationId) {
    const url = `http://localhost:8000/api/resignation-tasks/${resignationId}`;
    window.open(url, '_blank');
}

// Unified Helper function for status badge classes
function getStatusBadgeClass(status) {
    if (!status) return 'bg-secondary';

    switch (status.toLowerCase()) {
        // Common
        case 'approved': return 'bg-success';
        case 'rejected': return 'bg-danger';
        case 'pending': return 'bg-warning';

        // Resignation-specific
        case 'approved/reject': return 'bg-primary';
        case 'exit interview done': return 'bg-info';
        case 'no due done': return 'bg-secondary';
        case 'releaving done': return 'bg-success';
        case 'f&f done': return 'bg-dark';
        case 'final approval': return 'bg-danger';

        // Employee/Interview-to-Joining related
        case 'active': return 'bg-success';
        case 'resigned': return 'bg-danger';
        case 'suspended': return 'bg-danger';
        case 'on notice period': return 'bg-warning';
        case 'selected': return 'bg-success';
        case 'ctc finalized': return 'bg-warning';
        case 'followup done': return 'bg-warning';
        case 'candidate joined': return 'bg-success';
        case 'appointment given': return 'bg-success';
        case 'biometric done': return 'bg-success';
        case 'induction/training done': return 'bg-success';
        case 'pf account done': return 'bg-success';
        case 'first eva. done': return 'bg-success';
        case 'second eva. done': return 'bg-success';
        case 'third eva. done': return 'bg-success';
        case 'confirmed': return 'bg-success';

        default: return 'bg-secondary';
    }
}


async function saveResignation() {
    const emp_code = document.getElementById('emp_code').value;
    const emp_name = document.getElementById('emp_name').value;
    const emp_doj = document.getElementById('emp_doj').value;
    const divn_name = document.getElementById('divn_name').value;
    const dept_name = document.getElementById('dept_name').value;
    const des_name = document.getElementById('des_name').value;
    const hod_name = document.getElementById('hod_name').value;
    const hod_email = document.getElementById('hod_email').value;
    const reason = document.getElementById('reason').value;
    const resignation_date = document.getElementById('resignation_date').value;
    const releaving_date = document.getElementById('releaving_date') ? document.getElementById('releaving_date').value : null;

    const payload = {
        emp_code,
        emp_name,
        emp_doj,
        divn_name,
        dept_name,
        des_name,
        hod_name,
        hod_email,
        reason,
        resignation_date,
        releaving_date
    };

    try {
        if (state.currentEditingResignationId) {
            await apiRequest(`/api/resignations/${state.currentEditingResignationId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            await apiRequest('/api/resignations', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        bootstrap.Modal.getInstance(document.getElementById('resignationModal')).hide();
        state.currentEditingResignationId = null;
        loadResignations();
    } catch (err) {
        console.error('Failed to save resignation:', err);
    }
}

async function editResignation(id) {
    state.currentEditingResignationId = id;

    try {
        const resData = await apiRequest(`/api/resignations/${id}`);
        showResignationModal(); // Reuse the modal
        document.getElementById('emp_code').value = resData.emp_code;

        // Trigger change to populate rest of fields
        document.getElementById('emp_code').dispatchEvent(new Event('change'));

        // Set releaving date if applicable
        setTimeout(() => {
            if (resData.releaving_date && document.getElementById('releaving_date')) {
                document.getElementById('releaving_date').value = resData.releaving_date;
            }
        }, 100); // small delay for API population
    } catch (err) {
        console.error('Failed to fetch resignation for edit:', err);
    }
}

async function deleteResignation(id) {
    if (confirm('Are you sure you want to delete this resignation?')) {
        try {
            await apiRequest(`/api/resignations/${id}`, { method: 'DELETE' });
            loadResignations();
        } catch (err) {
            console.error('Failed to delete resignation:', err);
        }
    }
}

// ===================== Business Partners =====================

// Load Business Partners
//Filter for BP Group based on BP Type
function filterBPGroups(selectedTypeId) {
    const groupSelect = document.getElementById('bpgroup_id');
    if (!groupSelect) return;

    // Filter groups based on selectedTypeId
    const filteredGroups = state.bpGroups.filter(g => String(g.bptype_id) === String(selectedTypeId));

    // Populate the Group dropdown
    groupSelect.innerHTML = '<option value="">Select Group</option>' +
        filteredGroups.map(g => `<option value="${g.bpgroup_id}">${g.bpgroup_name}</option>`).join('');
}

async function loadBusinessPartners() {
    try {
        state.businessPartners = await apiRequest('/api/business-partners');
        renderBusinessPartners();
    } catch (error) {
        console.error('Failed to load business partners:', error);
    }
}

// Render Business Partners
function renderBusinessPartners() {
    const tbody = document.getElementById('business-partners-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    state.businessPartners.forEach(bp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${bp.bpcode}</td>
            <td>${bp.bpname}</td>
            <td>${bp.bptype_name}</td>
            <td>${bp.bpgroup_name || ''}</td>
            <td>${bp.cp_name || ''}</td>
            <td>${bp.cp_mobile || ''}</td>
            <td>${bp.pgstrno || ''}</td>
            <td>${bp.pcity || ''}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editBusinessPartner('${bp.bpcode}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteBusinessPartner('${bp.bpcode}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Show Modal 
function showBusinessPartnersModal(bp = null) {
    state.currentEditingId = bp ? bp.bpcode : null;

    const v = (key) => bp && bp[key] !== undefined && bp[key] !== null ? bp[key] : '';

    const modalHTML = `
    <div class="modal fade" id="businessPartnerModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${bp ? 'Edit' : 'Add'} Business Partner</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="businessPartnerForm">
              <div class="row g-3">
                <!-- General Info -->
                <div class="col-md-6">
                  <label class="form-label">Name</label>
                  <input type="text" id="bpname" class="form-control" value="${v('bpname')}" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Type</label>
                  <select id="bptype_id" class="form-control" required onchange="filterBPGroups(this.value)">
                    <option value="">Select</option>
                    ${state.bpTypes.map(t => `<option value="${t.bptype_id}" ${bp && bp.bptype_id === t.bptype_id ? 'selected' : ''}>${t.bptype_name}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Group</label>
                  <select id="bpgroup_id" class="form-control">
                    <option value="">Select</option>
                    ${state.bpGroups.map(g => `<option value="${g.bpgroup_id}" ${bp && bp.bpgroup_id === g.bpgroup_id ? 'selected' : ''}>${g.bpgroup_name}</option>`).join('')}
                  </select>
                </div>

                <!-- Contact Person -->
                <div class="col-md-6">
                  <label class="form-label">Contact Person Name</label>
                  <input type="text" id="cp_name" class="form-control" value="${v('cp_name')}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Contact Mobile</label>
                  <input type="text" id="cp_mobile" class="form-control" value="${v('cp_mobile')}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Contact Email</label>
                  <input type="email" id="cp_email" class="form-control" value="${v('cp_email')}" />
                </div>

                <!-- GST & City -->
                <div class="col-md-6">
                  <label class="form-label">GST No</label>
                  <input type="text" id="pgstrno" class="form-control" value="${v('pgstrno')}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">City</label>
                  <input type="text" id="pcity" class="form-control" value="${v('pcity')}" />
                </div>

                <!-- Contact Details -->
                <div class="col-md-6">
                  <label class="form-label">Phone</label>
                  <input type="text" id="phone" class="form-control" value="${v('phone')}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Mobile</label>
                  <input type="text" id="mobile" class="form-control" value="${v('mobile')}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email</label>
                  <input type="email" id="email" class="form-control" value="${v('email')}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Website</label>
                  <input type="text" id="website" class="form-control" value="${v('website')}" />
                </div>

                <!-- Permanent Address -->
                <div class="col-md-12">
                  <label class="form-label">Permanent Address</label>
                  <textarea id="paddressline1" class="form-control mb-1" placeholder="Line1">${v('paddressline1')}</textarea>
                  <textarea id="paddressline2" class="form-control mb-1" placeholder="Line2">${v('paddressline2')}</textarea>
                  <textarea id="paddressline3" class="form-control mb-1" placeholder="Line3">${v('paddressline3')}</textarea>
                  <textarea id="paddressline4" class="form-control mb-1" placeholder="Line4">${v('paddressline4')}</textarea>
                  <textarea id="paddressline5" class="form-control" placeholder="Line5">${v('paddressline5')}</textarea>
                </div>

                <!-- Shipping Address -->
                <div class="col-md-12">
                  <label class="form-label">Shipping Address</label>
                  <textarea id="saddressline1" class="form-control mb-1" placeholder="Line1">${v('saddressline1')}</textarea>
                  <textarea id="saddressline2" class="form-control mb-1" placeholder="Line2">${v('saddressline2')}</textarea>
                  <textarea id="saddressline3" class="form-control mb-1" placeholder="Line3">${v('saddressline3')}</textarea>
                  <textarea id="saddressline4" class="form-control mb-1" placeholder="Line4">${v('saddressline4')}</textarea>
                  <textarea id="saddressline5" class="form-control" placeholder="Line5">${v('saddressline5')}</textarea>
                  <div class="row g-2 mt-1">
                    <div class="col-md-3"><input type="text" id="scity" class="form-control" placeholder="City" value="${v('scity')}" /></div>
                    <div class="col-md-3"><input type="text" id="szipcode" class="form-control" placeholder="Zipcode" value="${v('szipcode')}" /></div>
                    <div class="col-md-3"><input type="text" id="sstate" class="form-control" placeholder="State" value="${v('sstate')}" /></div>
                    <div class="col-md-3"><input type="text" id="scountry" class="form-control" placeholder="Country" value="${v('scountry')}" /></div>
                  </div>
                </div>

                <!-- Bank Details -->
                <div class="col-md-12 mt-2">
                  <label class="form-label">Bank Details</label>
                  <select id="bank_id" class="form-control mb-2">
                    <option value="">Select Bank</option>
                    ${state.banks.map(b => `<option value="${b.bank_id}" ${b.bank_id === v('bank_id')?'selected':''}>${b.bank_name}</option>`).join('')}
                  </select>
                  <div class="row g-2">
                    <div class="col-md-3"><input type="text" id="account_name" class="form-control" placeholder="Account Name" value="${v('account_name')}" /></div>
                    <div class="col-md-3"><input type="text" id="account_number" class="form-control" placeholder="Account Number" value="${v('account_number')}" /></div>
                    <div class="col-md-3"><input type="text" id="ifsc_code" class="form-control" placeholder="IFSC Code" value="${v('ifsc_code')}" /></div>
                    <div class="col-md-3"><input type="text" id="bank_branch" class="form-control" placeholder="Branch" value="${v('bank_branch')}" /></div>
                    <div class="col-md-3"><input type="text" id="bank_city" class="form-control" placeholder="City" value="${v('bank_city')}" /></div>
                    <div class="col-md-3"><input type="text" id="bank_state" class="form-control" placeholder="State" value="${v('bank_state')}" /></div>
                    <div class="col-md-3"><input type="text" id="bank_country" class="form-control" placeholder="Country" value="${v('bank_country')}" /></div>
                  </div>
                </div>

              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="saveBusinessPartner()">Save</button>
          </div>
        </div>
      </div>
    </div>
    `;

    document.getElementById('modals-container').innerHTML = modalHTML;

    if (bp) {
        filterBPGroups(bp.bptype_id);  // Populate group based on saved type
        document.getElementById('bpgroup_id').value = bp.bpgroup_id;
    }
    const modalElem = document.getElementById('businessPartnerModal');
    const modal = new bootstrap.Modal(modalElem);
    modal.show();
}

// Save Business Partner 
async function saveBusinessPartner() {
    try {
        const payload = {
            bpname: document.getElementById('bpname').value,
            bptype_id: parseInt(document.getElementById('bptype_id').value),
            bpgroup_id: parseInt(document.getElementById('bpgroup_id').value) || null,
            cp_name: document.getElementById('cp_name').value,
            cp_mobile: document.getElementById('cp_mobile').value,
            cp_email: document.getElementById('cp_email').value,
            pgstrno: document.getElementById('pgstrno').value,
            pcity: document.getElementById('pcity').value,
            phone: document.getElementById('phone').value,
            mobile: document.getElementById('mobile').value,
            email: document.getElementById('email').value,
            website: document.getElementById('website').value,
            paddressline1: document.getElementById('paddressline1').value,
            paddressline2: document.getElementById('paddressline2').value,
            paddressline3: document.getElementById('paddressline3').value,
            paddressline4: document.getElementById('paddressline4').value,
            paddressline5: document.getElementById('paddressline5').value,
            saddressline1: document.getElementById('saddressline1').value,
            saddressline2: document.getElementById('saddressline2').value,
            saddressline3: document.getElementById('saddressline3').value,
            saddressline4: document.getElementById('saddressline4').value,
            saddressline5: document.getElementById('saddressline5').value,
            scity: document.getElementById('scity').value,
            szipcode: document.getElementById('szipcode').value,
            sstate: document.getElementById('sstate').value,
            scountry: document.getElementById('scountry').value,
            bank_id: parseInt(document.getElementById('bank_id').value) || null,
            account_name: document.getElementById('account_name').value,
            account_number: document.getElementById('account_number').value,
            ifsc_code: document.getElementById('ifsc_code').value,
            bank_branch: document.getElementById('bank_branch').value,
            bank_city: document.getElementById('bank_city').value,
            bank_state: document.getElementById('bank_state').value,
            bank_country: document.getElementById('bank_country').value
        };

        if (state.currentEditingId) {
            await apiRequest(`/api/business-partners/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            await apiRequest('/api/business-partners', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        await loadBusinessPartners();
        bootstrap.Modal.getInstance(document.getElementById('businessPartnerModal')).hide();
    } catch (error) {
        console.error('Failed to save business partner:', error);
    }
}


// Edit Business Partner
function editBusinessPartner(bpcode) {
    const bp = state.businessPartners.find(b => b.bpcode === bpcode);
    if (bp) {
        showBusinessPartnersModal(bp);
    }
}

// Delete Business Partner
async function deleteBusinessPartner(bpcode) {
    if (confirm('Are you sure you want to delete this business partner?')) {
        try {
            await apiRequest(`/api/business-partners/${bpcode}`, {
                method: 'DELETE'
            });
            loadBusinessPartners();
        } catch (error) {
            console.error('Failed to delete business partner:', error);
        }
    }
}

// ===================== Item Master =====================

// Load reference data functions
async function loadItemGroups() {
    try {
        state.itemGroups = await apiRequest('/api/item-groups');
    } catch (error) {
        console.error('Failed to load item groups:', error);
    }
}

async function loadItemUOMs() {
    try {
        state.itemUOMs = await apiRequest('/api/item-uoms');
    } catch (error) {
        console.error('Failed to load item UOMs:', error);
    }
}

async function loadItemCategories() {
    try {
        state.itemCategories = await apiRequest('/api/item-categories');
    } catch (error) {
        console.error('Failed to load item categories:', error);
    }
}

async function loadItemTypes() {
    try {
        state.itemTypes = await apiRequest('/api/item-types');
    } catch (error) {
        console.error('Failed to load item types:', error);
    }
}

async function loadWarehouses() {
    try {
        state.warehouses = await apiRequest('/api/warehouses');
    } catch (error) {
        console.error('Failed to load warehouses:', error);
    }
}

// Load Items
async function loadItemMaster() {
    try {
        state.items = await apiRequest('/api/items');
        renderItemMaster();
    } catch (error) {
        console.error('Failed to load items:', error);
    }
}

// Render Items
function renderItemMaster() {

    const tbody = document.getElementById('item-master-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    state.items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.it_code}</td>
            <td>${item.it_name}</td>
            <td>${item.uom_name || ''}</td>
            <td>${item.category_names ? item.category_names.join(', ') : ''}</td>
            <td>${item.group_name}</td>
            <td>${item.current_stock || 0}</td>
            <td>${item.it_min || 0}</td>
            <td>
                <span class="badge ${item.it_status === 'Active' ? 'bg-success' : 'bg-secondary'}">
                    ${item.it_status}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editItemMaster(${item.it_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteItemMaster(${item.it_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Show Modal - Add/Edit Item
function showItemMasterModal(item = null) {
    state.currentEditingId = item ? item.it_id : null;

    const v = (key) => item && item[key] !== undefined && item[key] !== null ? item[key] : '';

    const modalHTML = `
    <div class="modal fade" id="itemMasterModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${item ? 'Edit' : 'Add'} Item</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="itemMasterForm">
              <div class="row g-3">
                <!-- Basic Information -->
                <div class="col-md-6">
                  <label class="form-label">Item Name *</label>
                  <input type="text" id="it_name" class="form-control" value="${v('it_name')}" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Item Details</label>
                  <textarea id="it_details" class="form-control" rows="2">${v('it_details')}</textarea>
                </div>
                
                <!-- Classification -->
                <div class="col-md-3">
                  <label class="form-label">Group</label>
                  <select id="it_group" class="form-control">
                    <option value="">Select Group</option>
                    ${state.itemGroups.map(g => `<option value="${g.grp_id}" ${item && item.it_group === g.grp_id ? 'selected' : ''}>${g.grp_name}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">UOM *</label>
                  <select id="it_uom" class="form-control" required>
                    <option value="">Select UOM</option>
                    ${state.itemUOMs.map(u => `<option value="${u.uom_id}" ${item && item.it_uom === u.uom_id ? 'selected' : ''}>${u.uom_name}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Category</label>
                  <select id="it_categories" class="form-control" multiple required size="4">
                     <option value="">Select Category</option>
                     ${state.itemCategories.map(c => `
                     <option value="${c.cat_id}" ${item && item.category_ids && item.category_ids.includes(c.cat_id) ? 'selected' : ''}>
                     ${c.cat_name}
                     </option>
                     `).join('')}
                  </select>
                  <small class="form-text text-muted">Hold Ctrl/Cmd to select multiple categories</small>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Type</label>
                  <select id="it_type" class="form-control">
                    <option value="">Select Type</option>
                    ${state.itemTypes.map(t => `<option value="${t.type_id}" ${item && item.it_type === t.type_id ? 'selected' : ''}>${t.type_name}</option>`).join('')}
                  </select>
                </div>
                
                <!-- Manufacturing & HSN -->
                <div class="col-md-6">
                  <label class="form-label">Manufacturer</label>
                  <input type="text" id="it_mfg" class="form-control" value="${v('it_mfg')}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">HSN Code</label>
                  <input type="text" id="it_hsn" class="form-control" value="${v('it_hsn')}" />
                </div>
                
                <!-- Warehouse & Inventory -->
                <div class="col-md-4">
                  <label class="form-label">Default Warehouse</label>
                  <select id="it_whs" class="form-control">
                    <option value="">Select Warehouse</option>
                    ${state.warehouses.map(w => `<option value="${w.whs_id}" ${item && item.it_whs === w.whs_id ? 'selected' : ''}>${w.whs_name}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">MOQ</label>
                  <input type="number" id="it_moq" class="form-control" step="0.01" value="${v('it_moq')}" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Lead Time (Days)</label>
                  <input type="number" id="it_lead" class="form-control" value="${v('it_lead')}" />
                </div>
                
                <!-- Stock Levels -->
                <div class="col-md-4">
                  <label class="form-label">Minimum Stock</label>
                  <input type="number" id="it_min" class="form-control" step="0.01" value="${v('it_min')}" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Maximum Stock</label>
                  <input type="number" id="it_max" class="form-control" step="0.01" value="${v('it_max')}" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Status</label>
                  <select id="it_status" class="form-control" required>
                    <option value="Active" ${item && item.it_status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Inactive" ${item && item.it_status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                  </select>
                </div>
                
                <!-- Remarks & Attachment -->
                <div class="col-md-12">
                  <label class="form-label">Remarks</label>
                  <textarea id="it_remark" class="form-control" rows="3">${v('it_remark')}</textarea>
                </div>
                <div class="col-md-12">
                  <label class="form-label">Attachment URL</label>
                  <input type="text" id="it_attach" class="form-control" value="${v('it_attach')}" />
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="saveItemMaster()">Save</button>
          </div>
        </div>
      </div>
    </div>
    `;

    document.getElementById('modals-container').innerHTML = modalHTML;
    const modalElem = document.getElementById('itemMasterModal');
    const modal = new bootstrap.Modal(modalElem);
    modal.show();
}

async function saveItemMaster() {
    try {
        // Get selected category IDs from multi-select
        const categorySelect = document.getElementById('it_categories');
        const selectedCategoryIds = Array.from(categorySelect.selectedOptions)
            .map(option => parseInt(option.value));

        const payload = {
            it_name: document.getElementById('it_name').value,
            it_details: document.getElementById('it_details').value,
            it_group: parseInt(document.getElementById('it_group').value) || null,
            it_uom: parseInt(document.getElementById('it_uom').value) || null,
            it_type: parseInt(document.getElementById('it_type').value) || null,
            it_mfg: document.getElementById('it_mfg').value,
            it_hsn: document.getElementById('it_hsn').value,
            it_whs: parseInt(document.getElementById('it_whs').value) || null,
            it_moq: parseFloat(document.getElementById('it_moq').value) || 0,
            it_min: parseFloat(document.getElementById('it_min').value) || 0,
            it_max: parseFloat(document.getElementById('it_max').value) || 0,
            it_lead: parseInt(document.getElementById('it_lead').value) || 0,
            it_status: document.getElementById('it_status').value,
            it_remark: document.getElementById('it_remark').value,
            it_attach: document.getElementById('it_attach').value,
            category_ids: selectedCategoryIds  // Add this for multiple categories
        };

        if (state.currentEditingId) {
            await apiRequest(`/api/items/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            await apiRequest('/api/items', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        await loadItemMaster();
        bootstrap.Modal.getInstance(document.getElementById('itemMasterModal')).hide();
    } catch (error) {
        console.error('Failed to save item:', error);
    }
}

// Edit Item
function editItemMaster(it_id) {
    const item = state.items.find(i => i.it_id === it_id);
    if (item) {
        showItemMasterModal(item);
    }
}

// Delete Item
async function deleteItemMaster(it_id) {
    if (confirm('Are you sure you want to delete this item?')) {
        try {
            await apiRequest(`/api/items/${it_id}`, {
                method: 'DELETE'
            });
            loadItemMaster();
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    }
}

// ===================== Posting Periods =====================

async function loadPostingPeriods() {
    try {
        state.postingPeriods = await apiRequest('/api/posting-periods');
        renderPostingPeriods();
        updatePeriodSummary();
    } catch (error) {
        console.error('Failed to load posting periods:', error);
    }
}

function renderPostingPeriods() {
    const tbody = document.getElementById('posting-periods-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    state.postingPeriods.forEach(period => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${period.period_code}</td>
            <td>${period.period_name}</td>
            <td>${formatDate(period.start_date)}</td>
            <td>${formatDate(period.end_date)}</td>
            <td>${period.fiscal_year}</td>
            <td>${period.period_month || '-'}</td>
            <td>
                <span class="badge ${getPeriodStatusBadge(period.period_status)}">
                    ${period.period_status}
                </span>
            </td>
            <td>
                <i class="fas ${period.allow_posting ? 'fa-check text-success' : 'fa-times text-danger'}"></i>
            </td>
            <td>
                <i class="fas ${period.allow_goods_receipt ? 'fa-check text-success' : 'fa-times text-danger'}"></i>
            </td>
            <td>
                <i class="fas ${period.allow_goods_issue ? 'fa-check text-success' : 'fa-times text-danger'}"></i>
            </td>
            <td>
                <i class="fas ${period.allow_invoice_verification ? 'fa-check text-success' : 'fa-times text-danger'}"></i>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editPostingPeriod(${period.period_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning me-1" onclick="togglePostingPeriodStatus(${period.period_id})">
                    <i class="fas fa-sync"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deletePostingPeriod(${period.period_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getPeriodStatusBadge(status) {
    switch(status) {
        case 'Open': return 'bg-success';
        case 'Closed': return 'bg-secondary';
        case 'Future': return 'bg-info';
        default: return 'bg-secondary';
    }
}

function updatePeriodSummary() {
    const openCount = state.postingPeriods.filter(p => p.period_status === 'Open').length;
    const closedCount = state.postingPeriods.filter(p => p.period_status === 'Closed').length;
    const futureCount = state.postingPeriods.filter(p => p.period_status === 'Future').length;
    
    const currentPeriod = state.postingPeriods.find(p => 
        new Date() >= new Date(p.start_date) && new Date() <= new Date(p.end_date)
    );

    document.getElementById('open-periods-count').textContent = openCount;
    document.getElementById('closed-periods-count').textContent = closedCount;
    document.getElementById('future-periods-count').textContent = futureCount;
    document.getElementById('current-period').textContent = currentPeriod ? currentPeriod.period_name : 'No active period';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
}

function showPostingPeriodModal(period = null) {
    state.currentEditingId = period ? period.period_id : null;

    const v = (key) => period && period[key] !== undefined && period[key] !== null ? period[key] : '';

    const modalHTML = `
    <div class="modal fade" id="postingPeriodModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${period ? 'Edit' : 'Create'} Posting Period</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="postingPeriodForm">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Period Code *</label>
                  <input type="text" id="period_code" class="form-control" value="${v('period_code')}" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Period Name *</label>
                  <input type="text" id="period_name" class="form-control" value="${v('period_name')}" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Start Date *</label>
                  <input type="date" id="start_date" class="form-control" value="${v('start_date')}" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">End Date *</label>
                  <input type="date" id="end_date" class="form-control" value="${v('end_date')}" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Fiscal Year *</label>
                  <input type="number" id="fiscal_year" class="form-control" value="${v('fiscal_year')}" min="2000" max="2100" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Month</label>
                  <select id="period_month" class="form-control">
                    <option value="">Select Month</option>
                    ${Array.from({length: 12}, (_, i) => 
                        `<option value="${i+1}" ${v('period_month') == i+1 ? 'selected' : ''}>${new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>`
                    ).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select id="period_status" class="form-control" required>
                    <option value="Open" ${v('period_status') === 'Open' ? 'selected' : ''}>Open</option>
                    <option value="Closed" ${v('period_status') === 'Closed' ? 'selected' : ''}>Closed</option>
                    <option value="Future" ${v('period_status') === 'Future' ? 'selected' : ''}>Future</option>
                  </select>
                </div>
                <div class="col-md-12">
                  <div class="row">
                    <div class="col-md-3">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="allow_posting" ${v('allow_posting') ? 'checked' : ''}>
                        <label class="form-check-label" for="allow_posting">Allow Posting</label>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="allow_goods_receipt" ${v('allow_goods_receipt') ? 'checked' : ''}>
                        <label class="form-check-label" for="allow_goods_receipt">Allow GR</label>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="allow_goods_issue" ${v('allow_goods_issue') ? 'checked' : ''}>
                        <label class="form-check-label" for="allow_goods_issue">Allow GI</label>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="allow_invoice_verification" ${v('allow_invoice_verification') ? 'checked' : ''}>
                        <label class="form-check-label" for="allow_invoice_verification">Allow IV</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="savePostingPeriod()">Save</button>
          </div>
        </div>
      </div>
    </div>
    `;

    document.getElementById('modals-container').innerHTML = modalHTML;
    const modalElem = document.getElementById('postingPeriodModal');
    const modal = new bootstrap.Modal(modalElem);
    modal.show();
}

async function savePostingPeriod() {
    try {
        const payload = {
            period_code: document.getElementById('period_code').value,
            period_name: document.getElementById('period_name').value,
            start_date: document.getElementById('start_date').value,
            end_date: document.getElementById('end_date').value,
            fiscal_year: parseInt(document.getElementById('fiscal_year').value),
            period_month: document.getElementById('period_month').value ? parseInt(document.getElementById('period_month').value) : null,
            period_status: document.getElementById('period_status').value,
            allow_posting: document.getElementById('allow_posting').checked,
            allow_goods_receipt: document.getElementById('allow_goods_receipt').checked,
            allow_goods_issue: document.getElementById('allow_goods_issue').checked,
            allow_invoice_verification: document.getElementById('allow_invoice_verification').checked
        };

        if (state.currentEditingId) {
            await apiRequest(`/api/posting-periods/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            await apiRequest('/api/posting-periods', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        await loadPostingPeriods();
        bootstrap.Modal.getInstance(document.getElementById('postingPeriodModal')).hide();
    } catch (error) {
        console.error('Failed to save posting period:', error);
    }
}

function editPostingPeriod(period_id) {
    const period = state.postingPeriods.find(p => p.period_id === period_id);
    if (period) {
        showPostingPeriodModal(period);
    }
}

async function togglePostingPeriodStatus(period_id) {
    const period = state.postingPeriods.find(p => p.period_id === period_id);
    if (!period) return;

    const newStatus = period.period_status === 'Open' ? 'Closed' : 'Open';
    
    if (confirm(`Are you sure you want to ${newStatus === 'Closed' ? 'close' : 'open'} this period?`)) {
        try {
            await apiRequest(`/api/posting-periods/${period_id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ period_status: newStatus })
            });
            loadPostingPeriods();
        } catch (error) {
            console.error('Failed to update period status:', error);
        }
    }
}

async function deletePostingPeriod(period_id) {
    if (confirm('Are you sure you want to delete this posting period?')) {
        try {
            await apiRequest(`/api/posting-periods/${period_id}`, {
                method: 'DELETE'
            });
            loadPostingPeriods();
        } catch (error) {
            console.error('Failed to delete posting period:', error);
        }
    }
}

// ===================== Purchase Request =====================

async function loadPurchaseRequests() {
    try {
        state.purchaseRequests = await apiRequest('/api/purchase-requests');
        renderPurchaseRequests();
    } catch (error) {
        console.error('Failed to load purchase requests:', error);
    }
}

function renderPurchaseRequests() {
    const tbody = document.getElementById('purchase-request-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    state.purchaseRequests.forEach(req => {
        const row = document.createElement('tr');
        
        // Calculate total quantity from all rows
        const totalQty = req.rows ? req.rows.reduce((sum, row) => sum + (row.req_qty || 0), 0) : 0;
        
        row.innerHTML = `
            <td>${req.req_no}</td>
            <td>${formatDate(req.post_dt)}</td>
            <td>${req.emp_dept || ''}</td>
            <td>${req.emp_name || ''}</td>
            <td>${totalQty.toLocaleString('en-IN')}</td>
            <td>${req.rows ? req.rows.length : 0} items</td>
            <td>
                <span class="badge ${getPRStatusBadge(req.req_status)}">
                    ${req.req_status}
                </span>
            </td>
            <td>
                <span class="badge ${getPRPriorityBadge(req.priority)}">
                    ${req.priority}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editPurchaseRequest(${req.req_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-success me-1" onclick="approvePurchaseRequest(${req.req_id})" ${req.req_status !== 'Pending' ? 'disabled' : ''}>
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning me-1" onclick="convertToPO(${req.req_id})" ${req.req_status !== 'Approved' ? 'disabled' : ''}>
                    <i class="fas fa-file-invoice"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deletePurchaseRequest(${req.req_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getPRStatusBadge(status) {
    switch(status) {
        case 'Pending': return 'bg-warning';
        case 'Approved': return 'bg-success';
        case 'Rejected': return 'bg-danger';
        case 'Converted to PO': return 'bg-info';
        default: return 'bg-secondary';
    }
}

function getPRPriorityBadge(priority) {
    switch(priority) {
        case 'Low': return 'bg-secondary';
        case 'Medium': return 'bg-primary';
        case 'High': return 'bg-warning';
        case 'Urgent': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
}

function showPurchaseRequestModal(req = null) {
    state.currentEditingId = req ? req.req_id : null;

    const v = (key) => req && req[key] !== undefined && req[key] !== null ? req[key] : '';
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate default need date (doc_dt + 30 days)
    const defaultNeedDate = new Date();
    defaultNeedDate.setDate(defaultNeedDate.getDate() + 30);
    const defaultNeedDateStr = defaultNeedDate.toISOString().split('T')[0];

    const modalHTML = `
    <div class="modal fade" id="purchaseRequestModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${req ? 'Edit' : 'Create'} Purchase Request</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="purchaseRequestForm">
              <!-- Header Section -->
              <div class="card mb-4">
                <div class="card-header bg-light">
                  <h6 class="mb-0">Header Details</h6>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-4">
                      <label class="form-label">Employee *</label>
                      <select id="emp_code" class="form-control" required onchange="onEmployeeChange(this.value)">
                        <option value="">Select Employee</option>
                        ${state.employees.map(emp => `
                          <option value="${emp.emp_code}" ${v('emp_code') === emp.emp_code ? 'selected' : ''}>
                            ${emp.emp_name} (${emp.emp_code})
                          </option>
                        `).join('')}
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Employee Name</label>
                      <input type="text" id="emp_name" class="form-control" value="${v('emp_name')}" readonly />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Department</label>
                      <input type="text" id="emp_dept" class="form-control" value="${v('emp_dept')}" readonly />
                    </div>

                    <div class="col-md-3">
                      <label class="form-label">Posting Date *</label>
                      <input type="date" id="post_dt" class="form-control" value="${v('post_dt') || today}" required />
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">Document Date *</label>
                      <input type="date" id="doc_dt" class="form-control" value="${v('doc_dt') || today}" required onchange="updateAllNeedDates(this.value)" />
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">Priority *</label>
                      <select id="priority" class="form-control" required>
                        <option value="Low" ${v('priority') === 'Low' ? 'selected' : ''}>Low</option>
                        <option value="Medium" ${v('priority') === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="High" ${v('priority') === 'High' ? 'selected' : ''}>High</option>
                        <option value="Urgent" ${v('priority') === 'Urgent' ? 'selected' : ''}>Urgent</option>
                      </select>
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">Status</label>
                      <select id="req_status" class="form-control" ${req ? '' : 'disabled'}>
                        <option value="Pending" ${v('req_status') === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Approved" ${v('req_status') === 'Approved' ? 'selected' : ''}>Approved</option>
                        <option value="Rejected" ${v('req_status') === 'Rejected' ? 'selected' : ''}>Rejected</option>
                        <option value="Converted to PO" ${v('req_status') === 'Converted to PO' ? 'selected' : ''}>Converted to PO</option>
                      </select>
                    </div>

                    <div class="col-12">
                      <label class="form-label">Remarks</label>
                      <textarea id="remarks" class="form-control" rows="2">${v('remarks')}</textarea>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Items Grid Section - SAP Style -->
              <div class="card">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                  <h6 class="mb-0">Items</h6>
                  <button type="button" class="btn btn-sm btn-primary" onclick="addNewItemRow()">
                    <i class="fas fa-plus me-1"></i> Add Item
                  </button>
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive">
                    <table class="table table-bordered table-hover mb-0" id="items-grid">
                      <thead class="table-light">
                        <tr>
                          <th width="40px">#</th>
                          <th width="100px">Item Code</th>
                          <th>Item Name</th>
                          <th width="100px">HSN</th>
                          <th width="120px">Current Stock</th>
                          <th width="120px">Required Qty</th>
                          <th width="120px">Need Date</th>
                          <th width="60px">Action</th>
                        </tr>
                      </thead>
                      <tbody id="items-grid-body">
                        <!-- Items will be dynamically added here -->
                      </tbody>
                      <tfoot>
                        <tr class="table-info">
                          <td colspan="5" class="text-end"><strong>Total Quantity:</strong></td>
                          <td id="total-qty-display">0</td>
                          <td colspan="2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="savePurchaseRequest()">Save</button>
          </div>
        </div>
      </div>
    </div>
    `;

    document.getElementById('modals-container').innerHTML = modalHTML;
    
    // Initialize items grid
    if (req && req.rows && req.rows.length > 0) {
        loadExistingItems(req.rows);
    } else {
        addNewItemRow(); // Add one empty row by default
    }
    
    updateTotalQuantity();
    
    const modalElem = document.getElementById('purchaseRequestModal');
    const modal = new bootstrap.Modal(modalElem);
    modal.show();
}

function loadExistingItems(rows) {
    const tbody = document.getElementById('items-grid-body');
    tbody.innerHTML = '';
    
    rows.forEach((row, index) => {
        addItemRow(index + 1, row);
    });
}

function addNewItemRow() {
    const tbody = document.getElementById('items-grid-body');
    const rowCount = tbody.children.length;
    
    // Get current doc_date from the form
    const docDateInput = document.getElementById('doc_dt');
    let needDateStr;
    
    if (docDateInput && docDateInput.value) {
        // Calculate need date based on current doc_date
        const needDate = new Date(docDateInput.value);
        needDate.setDate(needDate.getDate() + 30);
        needDateStr = needDate.toISOString().split('T')[0];
    } else {
        // Fallback to today + 30 days
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 30);
        needDateStr = defaultDate.toISOString().split('T')[0];
    }
    
    addItemRow(rowCount + 1, null, needDateStr);
}

function addItemRow(lineNo, rowData = null, needDateStr = null) {
    const tbody = document.getElementById('items-grid-body');
    
    // If no needDate provided, calculate from current doc_date
    if (!needDateStr) {
        const docDateInput = document.getElementById('doc_dt');
        if (docDateInput && docDateInput.value) {
            const needDate = new Date(docDateInput.value);
            needDate.setDate(needDate.getDate() + 30);
            needDateStr = needDate.toISOString().split('T')[0];
        } else {
            // Fallback to today + 30 days
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 30);
            needDateStr = defaultDate.toISOString().split('T')[0];
        }
    }
    
    // If rowData has its own need_date, use that instead
    if (rowData && rowData.need_date) {
        needDateStr = rowData.need_date;
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="text-center">${lineNo}</td>
        <td>
            <select class="form-control form-control-sm item-select" onchange="onGridItemChange(this, ${lineNo})" required>
                <option value="">Select Item</option>
                ${state.items.map(item => `
                    <option value="${item.it_id}" 
                            data-code="${item.it_code}" 
                            data-name="${item.it_name}" 
                            data-hsn="${item.it_hsn || ''}"
                            data-stock="${item.current_stock || 0}"
                            ${rowData && rowData.it_id === item.it_id ? 'selected' : ''}>
                        ${item.it_code}
                    </option>
                `).join('')}
            </select>
        </td>
        <td>
            <input type="text" class="form-control form-control-sm item-name" value="${rowData ? rowData.it_name : ''}" readonly />
        </td>
        <td>
            <input type="text" class="form-control form-control-sm item-hsn" value="${rowData ? rowData.it_hsn : ''}" readonly />
        </td>
        <td>
            <input type="text" class="form-control form-control-sm item-stock" value="${rowData ? rowData.current_stock : 0}" readonly />
        </td>
        <td>
            <input type="number" class="form-control form-control-sm item-qty" 
                   value="${rowData ? rowData.req_qty : ''}" 
                   step="0.01" min="0.01" required 
                   onchange="updateTotalQuantity()" />
        </td>
        <td>
            <input type="date" class="form-control form-control-sm item-need-date" 
                   value="${needDateStr}" />
        </td>
        <td class="text-center">
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeItemRow(this)">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;
    tbody.appendChild(row);
    
    if (rowData && rowData.it_id) {
        const itemSelect = row.querySelector('.item-select');
        onGridItemChange(itemSelect, lineNo);
    }
}

function removeItemRow(button) {
    const tbody = document.getElementById('items-grid-body');
    const rows = tbody.querySelectorAll('tr');
    
    // Allow deletion only if more than one row exists
    if (rows.length > 1) {
        const row = button.closest('tr');
        row.remove();
        renumberRows();
        updateTotalQuantity();
    }
}

function updateDeleteButtonStates() {
    const tbody = document.getElementById('items-grid-body');
    const rows = tbody.querySelectorAll('tr');
    const deleteButtons = tbody.querySelectorAll('.btn-outline-danger');
    
    // Enable/disable delete buttons based on row count
    deleteButtons.forEach(button => {
        button.disabled = rows.length <= 1;
    });
}

function renumberRows() {
    const tbody = document.getElementById('items-grid-body');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
        const lineNoCell = row.querySelector('td:first-child');
        lineNoCell.textContent = index + 1;
    });
}

function updateAllNeedDates(docDate) {
    if (!docDate) return;
    
    const defaultDate = new Date(docDate);
    defaultDate.setDate(defaultDate.getDate() + 30);
    const defaultDateStr = defaultDate.toISOString().split('T')[0];
    
    const needDateInputs = document.querySelectorAll('.item-need-date');
    needDateInputs.forEach(input => {
        input.value = defaultDateStr; // Force update all dates
    });
    
    console.log('Updated all need dates to:', defaultDateStr);
}

function onGridItemChange(select, lineNo) {
    const row = select.closest('tr');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        // Check for duplicate items
        const allSelects = document.querySelectorAll('.item-select');
        let isDuplicate = false;
        
        allSelects.forEach(otherSelect => {
            if (otherSelect !== select && otherSelect.value === select.value) {
                isDuplicate = true;
            }
        });
        
        if (isDuplicate) {
            alert('This item is already added to the request. Please select a different item.');
            select.value = '';
            return;
        }
        
        // Populate item details
        row.querySelector('.item-name').value = selectedOption.getAttribute('data-name') || '';
        row.querySelector('.item-hsn').value = selectedOption.getAttribute('data-hsn') || '';
        row.querySelector('.item-stock').value = selectedOption.getAttribute('data-stock') || '0';
    } else {
        // Clear fields if no item selected
        row.querySelector('.item-name').value = '';
        row.querySelector('.item-hsn').value = '';
        row.querySelector('.item-stock').value = '0';
    }
}


function updateTotalQuantity() {
    const qtyInputs = document.querySelectorAll('.item-qty');
    let total = 0;
    
    qtyInputs.forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    
    document.getElementById('total-qty-display').textContent = total.toLocaleString('en-IN');
}

function onEmployeeChange(empCode) {
    const employee = state.employees.find(emp => emp.emp_code === empCode);
    const empNameField = document.getElementById('emp_name');
    const empDeptField = document.getElementById('emp_dept');
    
    if (employee) {
        empNameField.value = employee.emp_name || '';
        
        // Store department ID in a data attribute, show department name to user
        empDeptField.value = employee.dept_name || ''; // Show name to user
        empDeptField.setAttribute('data-dept-id', employee.emp_dept || employee.dept_id || ''); // Store ID
    } else {
        empNameField.value = '';
        empDeptField.value = '';
        empDeptField.removeAttribute('data-dept-id');
    }
}

function onItemChange(itId) {
    const item = state.items.find(item => item.it_id === parseInt(itId));
    if (item) {
        document.getElementById('it_name').value = item.it_name || '';
        document.getElementById('it_hsn').value = item.it_hsn || '';
        document.getElementById('current_stock').value = item.current_stock || 0;
    } else {
        document.getElementById('it_name').value = '';
        document.getElementById('it_hsn').value = '';
        document.getElementById('current_stock').value = 0;
    }
}

function getDepartmentIdFromEmployee() {
    const empCode = document.getElementById('emp_code').value;
    const employee = state.employees.find(emp => emp.emp_code === empCode);
    return employee ? employee.emp_dept : ''; // This should be the department ID
}

async function savePurchaseRequest() {
    try {
        // Get department ID properly
        const empCode = document.getElementById('emp_code').value;
        const employee = state.employees.find(emp => emp.emp_code === empCode);
        
        if (!employee) {
            alert('Please select a valid employee.');
            return;
        }

        // Use the department ID from the employee object
        const empDept = employee.emp_dept || employee.dept_id;
        
        if (!empDept) {
            alert('Selected employee does not have a department assigned.');
            return;
        }

        const headerData = {
            emp_code: empCode,
            emp_name: document.getElementById('emp_name').value,
            emp_dept: empDept,  // Use the department ID here
            post_dt: document.getElementById('post_dt').value,
            doc_dt: document.getElementById('doc_dt').value,
            priority: document.getElementById('priority').value,
            req_status: document.getElementById('req_status').value || 'Pending',
            remarks: document.getElementById('remarks').value,
            created_by: 'current_user',  // You might want to set this dynamically
            updated_by: 'current_user'   // You might want to set this dynamically
        };

        // Collect rows data
        const rows = [];
        const itemRows = document.querySelectorAll('#items-grid-body tr');
        
        itemRows.forEach((row, index) => {
            const itemSelect = row.querySelector('.item-select');
            const qtyInput = row.querySelector('.item-qty');
            const needDateInput = row.querySelector('.item-need-date');
            
            if (itemSelect.value && qtyInput.value) {
                rows.push({
                    line_no: index + 1,
                    it_id: parseInt(itemSelect.value),
                    it_code: itemSelect.options[itemSelect.selectedIndex].getAttribute('data-code'),
                    it_name: row.querySelector('.item-name').value,
                    it_hsn: row.querySelector('.item-hsn').value,
                    need_date: needDateInput.value,
                    current_stock: parseFloat(row.querySelector('.item-stock').value) || 0,
                    req_qty: parseFloat(qtyInput.value),
                    created_by: 'current_user'  // Add this field
                });
            }
        });

        if (rows.length === 0) {
            alert('Please add at least one item to the purchase request.');
            return;
        }

        const payload = {
            ...headerData,
            rows: rows
        };

        console.log('Sending payload:', payload);

        if (state.currentEditingId) {
            await apiRequest(`/api/purchase-requests/${state.currentEditingId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            await apiRequest('/api/purchase-requests', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        await loadPurchaseRequests();
        bootstrap.Modal.getInstance(document.getElementById('purchaseRequestModal')).hide();
    } catch (error) {
        console.error('Failed to save purchase request:', error);
    }
}

function editPurchaseRequest(req_id) {
    const req = state.purchaseRequests.find(r => r.req_id === req_id);
    if (req) {
        showPurchaseRequestModal(req);
    }
}

async function approvePurchaseRequest(req_id) {
    if (confirm('Are you sure you want to approve this purchase request?')) {
        try {
            await apiRequest(`/api/purchase-requests/${req_id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ req_status: 'Approved' })
            });
            loadPurchaseRequests();
        } catch (error) {
            console.error('Failed to approve purchase request:', error);
        }
    }
}

async function convertToPO(req_id) {
    if (confirm('Are you sure you want to convert this purchase request to Purchase Order?')) {
        try {
            await apiRequest(`/api/purchase-requests/${req_id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ req_status: 'Converted to PO' })
            });
            loadPurchaseRequests();
        } catch (error) {
            console.error('Failed to convert to PO:', error);
        }
    }
}

async function deletePurchaseRequest(req_id) {
    if (confirm('Are you sure you want to delete this purchase request?')) {
        try {
            await apiRequest(`/api/purchase-requests/${req_id}`, {
                method: 'DELETE'
            });
            loadPurchaseRequests();
        } catch (error) {
            console.error('Failed to delete purchase request:', error);
        }
    }
}

// ===================== Purchase Order Core Functions =====================

async function loadPurchaseOrders() {
    try {
        poState.purchaseOrders = await apiRequest('/api/purchase-orders');
        renderPurchaseOrders();
        updatePODashboard();
    } catch (error) {
        console.error('Failed to load purchase orders:', error);
    }
}

function renderPurchaseOrders() {
    const tbody = document.getElementById('purchase-order-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    poState.purchaseOrders.forEach(po => {
        const row = document.createElement('tr');
        
        // Get PR references from rows
        const prReferences = [...new Set(po.rows.map(row => row.pr_no).filter(Boolean))];
        
        row.innerHTML = `
            <td>${po.po_no}</td>
            <td>${formatDate(po.post_dt)}</td>
            <td>${po.bpname}</td>
            <td>${getDepartmentName(po.dept_id)}</td>
            <td>${po.rows.length} items</td>
            <td>₹${po.total_amt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td>
                <span class="badge ${getPOStatusBadge(po.po_status)}">
                    ${po.po_status}
                </span>
            </td>
            <td>${prReferences.join(', ') || '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editPurchaseOrder(${po.po_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-success me-1" onclick="createGRPO(${po.po_id})" ${po.po_status !== 'Open' ? 'disabled' : ''}>
                    <i class="fas fa-truck-loading"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning me-1" onclick="updatePOStatus(${po.po_id}, '${po.po_status === 'Open' ? 'Closed' : 'Open'}')">
                    <i class="fas fa-${po.po_status === 'Open' ? 'lock' : 'unlock'}"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deletePurchaseOrder(${po.po_id})" ${po.po_status === 'Closed' ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getPOStatusBadge(status) {
    switch(status) {
        case 'Open': return 'bg-success';
        case 'Closed': return 'bg-secondary';
        default: return 'bg-warning';
    }
}

function getDepartmentName(deptId) {
    // You'll need to load departments or get from existing state
    return `Dept ${deptId}`; // Placeholder
}

function updatePODashboard() {
    const totalPOs = poState.purchaseOrders.length;
    const openPOs = poState.purchaseOrders.filter(po => po.po_status === 'Open').length;
    const totalValue = poState.purchaseOrders.reduce((sum, po) => sum + po.total_amt, 0);
    
    // This month POs (simplified)
    const currentMonth = new Date().getMonth();
    const monthPOs = poState.purchaseOrders.filter(po => {
        const poDate = new Date(po.post_dt);
        return poDate.getMonth() === currentMonth;
    }).length;
    
    document.getElementById('total-pos-count').textContent = totalPOs;
    document.getElementById('open-pos-count').textContent = openPOs;
    document.getElementById('total-po-value').textContent = `₹${totalValue.toLocaleString('en-IN')}`;
    document.getElementById('month-pos-count').textContent = monthPOs;
}

// ===================== Data Loading Functions =====================

async function loadApprovedPRs() {
    try {
        poState.approvedPRs = await apiRequest('/api/purchase-requests/approved');
    } catch (error) {
        console.error('Failed to load approved PRs:', error);
    }
}

async function loadVendors() {
    try {
        poState.vendors = await apiRequest('/api/vendors');
    } catch (error) {
        console.error('Failed to load vendors:', error);
    }
}

async function loadTaxCodes() {
    try {
        poState.taxCodes = await apiRequest('/api/tax-codes');
    } catch (error) {
        console.error('Failed to load tax codes:', error);
    }
}

async function loadWarehouses() {
    try {
        poState.warehouses = await apiRequest('/api/warehouses');
    } catch (error) {
        console.error('Failed to load warehouses:', error);
    }
}

async function loadUOMs() {
    try {
        poState.uoms = await apiRequest('/api/uoms');
    } catch (error) {
        console.error('Failed to load UOMs:', error);
    }
}


// ===================== Enhanced Convert to PO Function =====================

//async function convertToPO(req_id) {
//    // For single PR conversion, use the PR selection modal
//    poState.selectedPRs = [req_id];
//    showPRSelectionModal();
//}

function showPRSelectionModal() {
    const modalHTML = `
    <div class="modal fade" id="prSelectionModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Convert Purchase Requests to PO</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <!-- Vendor Selection -->
            <div class="card mb-4">
              <div class="card-header bg-light">
                <h6 class="mb-0">Vendor Selection</h6>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-8">
                    <label class="form-label">Select Vendor *</label>
                    <select id="vendor-select" class="form-control" required>
                      <option value="">Select Vendor</option>
                      ${poState.vendors.map(vendor => `
                        <option value="${vendor.bpcode}">${vendor.bpname} (${vendor.bpcode})</option>
                      `).join('')}
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Document Date</label>
                    <input type="date" id="po-doc-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Posting Date</label>
                    <input type="date" id="po-post-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                  </div>
                </div>
              </div>
            </div>

            <!-- Approved PRs List -->
            <div class="card">
              <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Select Purchase Requests</h6>
                <div>
                  <button type="button" class="btn btn-sm btn-outline-secondary me-2" onclick="selectAllPRs()">Select All</button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" onclick="deselectAllPRs()">Deselect All</button>
                </div>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead class="table-light">
                      <tr>
                        <th width="50px">
                          <input type="checkbox" id="select-all-prs" onchange="toggleAllPRs(this.checked)">
                        </th>
                        <th>PR Number</th>
                        <th>Requested By</th>
                        <th>Department</th>
                        <th>Items</th>
                        <th>Total Qty</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody id="approved-prs-list">
                      ${poState.approvedPRs.map(pr => `
                        <tr>
                          <td>
                            <input type="checkbox" class="pr-checkbox" value="${pr.req_id}" 
                                   ${poState.selectedPRs.includes(pr.req_id) ? 'checked' : ''}
                                   onchange="updateSelectedPRs(${pr.req_id}, this.checked)">
                          </td>
                          <td>${pr.req_no}</td>
                          <td>${pr.emp_name}</td>
                          <td>${pr.emp_dept}</td>
                          <td>${pr.item_count} items</td>
                          <td>${pr.total_qty}</td>
                          <td>${formatDate(pr.post_dt)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="alert alert-info mt-3">
              <i class="fas fa-info-circle me-2"></i>
              Selected PRs: <span id="selected-prs-count">${poState.selectedPRs.length}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="createPOFromSelectedPRs()" ${poState.selectedPRs.length === 0 ? 'disabled' : ''}>
              Create Purchase Order
            </button>
          </div>
        </div>
      </div>
    </div>
    `;

    document.getElementById('modals-container').innerHTML = modalHTML;
    const modal = new bootstrap.Modal(document.getElementById('prSelectionModal'));
    modal.show();
}

function toggleAllPRs(checked) {
    const checkboxes = document.querySelectorAll('.pr-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = checked;
        updateSelectedPRs(parseInt(checkbox.value), checked);
    });
}

function selectAllPRs() {
    toggleAllPRs(true);
}

function deselectAllPRs() {
    toggleAllPRs(false);
}

function updateSelectedPRs(reqId, isSelected) {
    if (isSelected) {
        if (!poState.selectedPRs.includes(reqId)) {
            poState.selectedPRs.push(reqId);
        }
    } else {
        poState.selectedPRs = poState.selectedPRs.filter(id => id !== reqId);
    }
    
    // Update selected count
    document.getElementById('selected-prs-count').textContent = poState.selectedPRs.length;
    
    // Enable/disable create button
    const createBtn = document.querySelector('#prSelectionModal .btn-primary');
    if (createBtn) {
        createBtn.disabled = poState.selectedPRs.length === 0;
    }
}

async function createPOFromSelectedPRs() {
    const vendorSelect = document.getElementById('vendor-select');
    const docDateInput = document.getElementById('po-doc-date');
    const postDateInput = document.getElementById('po-post-date'); // Add this line
    
    if (!vendorSelect.value) {
        alert('Please select a vendor');
        return;
    }
    
    if (!docDateInput.value || !postDateInput.value) { // Update validation
        alert('Please select both document date and posting date');
        return;
    }

    try {
        const vendor = poState.vendors.find(v => v.bpcode === vendorSelect.value);
        
        const payload = {
            req_ids: poState.selectedPRs,
            bpcode: vendorSelect.value,
            bpname: vendor.bpname,
            post_dt: postDateInput.value, // FIXED: Use the input value
            doc_dt: docDateInput.value,
            created_by: 'current_user' // You should set this dynamically
        };

        console.log('Creating PO with payload:', payload); // Debug log

        const result = await apiRequest('/api/purchase-orders/convert-from-pr', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        // Close modal and refresh
        bootstrap.Modal.getInstance(document.getElementById('prSelectionModal')).hide();
        await loadPurchaseOrders();
        await loadPurchaseRequests(); // Refresh PRs to update status
        
        // Show success message and open the created PO for editing
        alert('Purchase Order created successfully! PO Number: ' + result.po_no);
        editPurchaseOrder(result.po_id);
        
    } catch (error) {
        console.error('Failed to create PO from PRs:', error);
        alert('Failed to create Purchase Order: ' + error.message);
    }
}

// ===================== PO Modal Functions =====================

function showPurchaseOrderModal(po = null) {
    state.currentEditingPOId = po ? po.po_id : null;

    const v = (key) => po && po[key] !== undefined && po[key] !== null ? po[key] : '';
    const today = new Date().toISOString().split('T')[0];
    
    const modalHTML = `
    <div class="modal fade" id="purchaseOrderModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${po ? 'Edit' : 'Create'} Purchase Order</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="purchaseOrderForm">
              <!-- Header Section -->
              <div class="card mb-4">
                <div class="card-header bg-light">
                  <h6 class="mb-0">Header Details</h6>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-3">
                      <label class="form-label">PO Number</label>
                      <input type="text" class="form-control" value="${v('po_no') || 'Auto-generated'}" readonly />
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">Posting Date *</label>
                      <input type="date" id="po-post-dt" class="form-control" value="${v('post_dt') || today}" required />
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">Document Date *</label>
                      <input type="date" id="po-doc-dt" class="form-control" value="${v('doc_dt') || today}" required />
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">Status</label>
                      <select id="po-status" class="form-control" ${po ? '' : 'disabled'}>
                        <option value="Open" ${v('po_status') === 'Open' ? 'selected' : ''}>Open</option>
                        <option value="Closed" ${v('po_status') === 'Closed' ? 'selected' : ''}>Closed</option>
                      </select>
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Vendor *</label>
                      <select id="po-bp-code" class="form-control" required>
                        <option value="">Select Vendor</option>
                        ${poState.vendors.map(vendor => `
                          <option value="${vendor.bpcode}" ${v('bpcode') === vendor.bpcode ? 'selected' : ''}>
                            ${vendor.bpname} (${vendor.bpcode})
                          </option>
                        `).join('')}
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Vendor Name</label>
                      <input type="text" id="po-bp-name" class="form-control" value="${v('bpname')}" readonly />
                    </div>

                    <div class="col-md-4">
                      <label class="form-label">Employee *</label>
                      <select id="po-emp-code" class="form-control" required>
                        <option value="">Select Employee</option>
                        ${state.employees.map(emp => `
                          <option value="${emp.emp_code}" ${v('emp_code') === emp.emp_code ? 'selected' : ''}>
                            ${emp.emp_name} (${emp.emp_code})
                          </option>
                        `).join('')}
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Employee Name</label>
                      <input type="text" id="po-emp-name" class="form-control" value="${v('emp_name')}" readonly />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Department</label>
                      <input type="text" id="po-dept-id" class="form-control" value="${v('dept_id')}" readonly />
                    </div>

                    <div class="col-12">
                      <label class="form-label">Remarks</label>
                      <textarea id="po-remarks" class="form-control" rows="2">${v('remarks') || ''}</textarea>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Items Grid Section -->
              <div class="card">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                  <h6 class="mb-0">Items</h6>
                  <button type="button" class="btn btn-sm btn-primary" onclick="addNewPORow()">
                    <i class="fas fa-plus me-1"></i> Add Item
                  </button>
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive">
                    <table class="table table-bordered table-hover mb-0" id="po-items-grid">
                      <thead class="table-light">
                        <tr>
                          <th width="40px">#</th>
                          <th width="120px">Item Code</th>
                          <th>Item Name</th>
                          <th width="80px">HSN</th>
                          <th width="100px">UOM</th>
                          <th width="100px">Qty</th>
                          <th width="120px">Need Date</th>
                          <th width="100px">Unit Price</th>
                          <th width="80px">Disc %</th>
                          <th width="100px">Disc Amt</th>
                          <th width="100px">Tax Code</th>
                          <th width="80px">Tax %</th>
                          <th width="100px">Tax Amt</th>
                          <th width="120px">Line Total</th>
                          <th width="100px">Warehouse</th>
                          <th width="60px">Action</th>
                        </tr>
                      </thead>
                      <tbody id="po-items-grid-body">
                        <!-- PO items will be dynamically added here -->
                      </tbody>
                      <tfoot class="table-info">
                        <tr>
                          <td colspan="7" class="text-end"><strong>Subtotal:</strong></td>
                          <td id="po-subtotal">0.00</td>
                          <td colspan="2"></td>
                          <td class="text-end"><strong>Discount:</strong></td>
                          <td id="po-discount-amt">0.00</td>
                          <td class="text-end"><strong>Tax:</strong></td>
                          <td id="po-tax-amt">0.00</td>
                          <td class="text-end"><strong>Total:</strong></td>
                          <td id="po-total-amt">0.00</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="savePurchaseOrder()">Save Purchase Order</button>
          </div>
        </div>
      </div>
    </div>
    `;

    document.getElementById('modals-container').innerHTML = modalHTML;
    
    // Initialize items grid
    if (po && po.rows && po.rows.length > 0) {
        loadExistingPORows(po.rows);
    } else {
        addNewPORow(); // Add one empty row by default
    }
    
    // Set up event listeners
    setupPOEventListeners();
    
    const modal = new bootstrap.Modal(document.getElementById('purchaseOrderModal'));
    modal.show();
}

function setupPOEventListeners() {
    // Vendor change
    document.getElementById('po-bp-code').addEventListener('change', function() {
        const vendor = poState.vendors.find(v => v.bpcode === this.value);
        if (vendor) {
            document.getElementById('po-bp-name').value = vendor.bpname;
        }
    });
    
    // Employee change
    document.getElementById('po-emp-code').addEventListener('change', function() {
        const employee = state.employees.find(emp => emp.emp_code === this.value);
        if (employee) {
            document.getElementById('po-emp-name').value = employee.emp_name;
            document.getElementById('po-dept-id').value = employee.emp_dept || employee.dept_id;
        }
    });
}

function loadExistingPORows(rows) {
    const tbody = document.getElementById('po-items-grid-body');
    tbody.innerHTML = '';
    
    rows.forEach((row, index) => {
        addPORow(index + 1, row);
    });
    
    updatePOTotals();
}

function addNewPORow() {
    const tbody = document.getElementById('po-items-grid-body');
    const rowCount = tbody.children.length;
    addPORow(rowCount + 1);
}

function addPORow(lineNo, rowData = null) {
    const tbody = document.getElementById('po-items-grid-body');
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="text-center">${lineNo}</td>
        <td>
            <select class="form-control form-control-sm po-item-select" onchange="onPOItemChange(this, ${lineNo})" required>
                <option value="">Select Item</option>
                ${state.items.map(item => `
                    <option value="${item.it_id}" 
                            data-code="${item.it_code}" 
                            data-name="${item.it_name}" 
                            data-hsn="${item.it_hsn || ''}"
                            data-details="${item.it_details || ''}"
                            ${rowData && rowData.it_id === item.it_id ? 'selected' : ''}>
                        ${item.it_code}
                    </option>
                `).join('')}
            </select>
        </td>
        <td>
            <input type="text" class="form-control form-control-sm po-item-name" value="${rowData ? rowData.it_name : ''}" readonly />
        </td>
        <td>
            <input type="text" class="form-control form-control-sm po-item-hsn" value="${rowData ? rowData.hsn_code : ''}" readonly />
        </td>
        <td>
            <select class="form-control form-control-sm po-uom">
                <option value="">Select UOM</option>
                ${poState.uoms.map(uom => `
                    <option value="${uom.uom_id}" ${rowData && rowData.uom_id === uom.uom_id ? 'selected' : ''}>
                        ${uom.uom_code}
                    </option>
                `).join('')}
            </select>
        </td>
        <td>
            <input type="number" class="form-control form-control-sm po-qty" 
                   value="${rowData ? rowData.req_qty : ''}" 
                   step="0.001" min="0.001" required 
                   onchange="updatePORowTotal(${lineNo})" />
        </td>
        <td>
            <input type="date" class="form-control form-control-sm po-need-date" 
                   value="${rowData ? rowData.need_date : ''}" />
        </td>
        <td>
            <input type="number" class="form-control form-control-sm po-unit-price" 
                   value="${rowData ? rowData.unit_price : ''}" 
                   step="0.01" min="0" 
                   onchange="updatePORowTotal(${lineNo})" />
        </td>
        <td>
            <input type="number" class="form-control form-control-sm po-discount-percent" 
                   value="${rowData ? rowData.discount_percent : ''}" 
                   step="0.01" min="0" max="100"
                   onchange="updatePORowTotal(${lineNo})" />
        </td>
        <td>
            <input type="number" class="form-control form-control-sm po-discount-amt" 
                   value="${rowData ? rowData.discount_amt : ''}" 
                   step="0.01" min="0" readonly />
        </td>
        <td>
            <select class="form-control form-control-sm po-tax-code" onchange="onPOTaxChange(this, ${lineNo})">
                <option value="">Select Tax</option>
                ${poState.taxCodes.map(tax => `
                    <option value="${tax.tax_code}" 
                            data-rate="${tax.tax_rate}"
                            ${rowData && rowData.tax_code === tax.tax_code ? 'selected' : ''}>
                        ${tax.tax_code} (${tax.tax_rate}%)
                    </option>
                `).join('')}
            </select>
        </td>
        <td>
            <input type="number" class="form-control form-control-sm po-tax-rate" 
                   value="${rowData ? rowData.tax_rate : ''}" 
                   step="0.01" min="0" readonly />
        </td>
        <td>
            <input type="number" class="form-control form-control-sm po-tax-amt" 
                   value="${rowData ? rowData.tax_amt : ''}" 
                   step="0.01" min="0" readonly />
        </td>
        <td>
            <input type="number" class="form-control form-control-sm po-line-total" 
                   value="${rowData ? rowData.line_total : ''}" 
                   step="0.01" min="0" readonly />
        </td>
        <td>
            <select class="form-control form-control-sm po-whs">
                <option value="">Select WH</option>
                ${poState.warehouses.map(whs => `
                    <option value="${whs.whs_id}" ${rowData && rowData.whs_id === whs.whs_id ? 'selected' : ''}>
                        ${whs.whs_name}
                    </option>
                `).join('')}
            </select>
        </td>
        <td class="text-center">
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removePORow(this)">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;
    tbody.appendChild(row);
    
    // If row data exists, trigger calculations
    if (rowData && rowData.it_id) {
        const itemSelect = row.querySelector('.po-item-select');
        onPOItemChange(itemSelect, lineNo);
        updatePORowTotal(lineNo);
    }
}

function removePORow(button) {
    const tbody = document.getElementById('po-items-grid-body');
    const rows = tbody.querySelectorAll('tr');
    
    if (rows.length > 1) {
        const row = button.closest('tr');
        row.remove();
        renumberPORows();
        updatePOTotals();
    }
}

function renumberPORows() {
    const tbody = document.getElementById('po-items-grid-body');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
        const lineNoCell = row.querySelector('td:first-child');
        lineNoCell.textContent = index + 1;
        
        // Update all event handlers with new line number
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach(input => {
            const oldOnChange = input.getAttribute('onchange');
            if (oldOnChange) {
                input.setAttribute('onchange', oldOnChange.replace(/\d+/, index + 1));
            }
        });
    });
}

// ===================== PO Calculation Functions =====================

function onPOItemChange(select, lineNo) {
    const row = select.closest('tr');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        // Check for duplicate items
        const allSelects = document.querySelectorAll('.po-item-select');
        let isDuplicate = false;
        
        allSelects.forEach(otherSelect => {
            if (otherSelect !== select && otherSelect.value === select.value) {
                isDuplicate = true;
            }
        });
        
        if (isDuplicate) {
            alert('This item is already added to the purchase order. Please select a different item.');
            select.value = '';
            return;
        }
        
        // Populate item details
        row.querySelector('.po-item-name').value = selectedOption.getAttribute('data-name') || '';
        row.querySelector('.po-item-hsn').value = selectedOption.getAttribute('data-hsn') || '';
        
        // Clear pricing and trigger calculation
        row.querySelector('.po-unit-price').value = '';
        row.querySelector('.po-discount-percent').value = '';
        updatePORowTotal(lineNo);
    } else {
        // Clear fields if no item selected
        row.querySelector('.po-item-name').value = '';
        row.querySelector('.po-item-hsn').value = '';
        row.querySelector('.po-unit-price').value = '';
        row.querySelector('.po-discount-percent').value = '';
        updatePORowTotal(lineNo);
    }
}

function onPOTaxChange(select, lineNo) {
    const row = select.closest('tr');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        const taxRate = parseFloat(selectedOption.getAttribute('data-rate')) || 0;
        row.querySelector('.po-tax-rate').value = taxRate;
    } else {
        row.querySelector('.po-tax-rate').value = '';
    }
    
    updatePORowTotal(lineNo);
}

function updatePORowTotal(lineNo) {
    const row = document.querySelector(`#po-items-grid-body tr:nth-child(${lineNo})`);
    if (!row) return;
    
    const qty = parseFloat(row.querySelector('.po-qty').value) || 0;
    const unitPrice = parseFloat(row.querySelector('.po-unit-price').value) || 0;
    const discountPercent = parseFloat(row.querySelector('.po-discount-percent').value) || 0;
    const taxRate = parseFloat(row.querySelector('.po-tax-rate').value) || 0;
    
    // Calculate line total
    const grossAmount = qty * unitPrice;
    const discountAmt = grossAmount * (discountPercent / 100);
    const taxableAmount = grossAmount - discountAmt;
    const taxAmt = taxableAmount * (taxRate / 100);
    const lineTotal = taxableAmount + taxAmt;
    
    // Update row values
    row.querySelector('.po-discount-amt').value = discountAmt.toFixed(2);
    row.querySelector('.po-tax-amt').value = taxAmt.toFixed(2);
    row.querySelector('.po-line-total').value = lineTotal.toFixed(2);
    
    updatePOTotals();
}

function updatePOTotals() {
    const rows = document.querySelectorAll('#po-items-grid-body tr');
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let total = 0;
    
    rows.forEach(row => {
        const lineTotal = parseFloat(row.querySelector('.po-line-total').value) || 0;
        const discountAmt = parseFloat(row.querySelector('.po-discount-amt').value) || 0;
        const taxAmt = parseFloat(row.querySelector('.po-tax-amt').value) || 0;
        
        subtotal += lineTotal - taxAmt + discountAmt; // Back to gross amount
        totalDiscount += discountAmt;
        totalTax += taxAmt;
        total += lineTotal;
    });
    
    document.getElementById('po-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('po-discount-amt').textContent = totalDiscount.toFixed(2);
    document.getElementById('po-tax-amt').textContent = totalTax.toFixed(2);
    document.getElementById('po-total-amt').textContent = total.toFixed(2);
}

// ===================== PO CRUD Operations =====================

async function savePurchaseOrder() {
    try {
        const headerData = {
            post_per: 1, // You'll need to get this from posting period validation
            post_dt: document.getElementById('po-post-dt').value,
            doc_dt: document.getElementById('po-doc-dt').value,
            bpcode: document.getElementById('po-bp-code').value,
            bpname: document.getElementById('po-bp-name').value,
            emp_code: document.getElementById('po-emp-code').value,
            emp_name: document.getElementById('po-emp-name').value,
            dept_id: parseInt(document.getElementById('po-dept-id').value),
            subtotal: parseFloat(document.getElementById('po-subtotal').textContent) || 0,
            discount_amt: parseFloat(document.getElementById('po-discount-amt').textContent) || 0,
            tax_amt: parseFloat(document.getElementById('po-tax-amt').textContent) || 0,
            total_amt: parseFloat(document.getElementById('po-total-amt').textContent) || 0,
            po_status: document.getElementById('po-status').value || 'Open',
            created_by: 'current_user',
            updated_by: 'current_user'
        };

        // Collect rows data
        const rows = [];
        const itemRows = document.querySelectorAll('#po-items-grid-body tr');
        
        itemRows.forEach((row, index) => {
            const itemSelect = row.querySelector('.po-item-select');
            const qtyInput = row.querySelector('.po-qty');
            const unitPriceInput = row.querySelector('.po-unit-price');
            
            if (itemSelect.value && qtyInput.value && unitPriceInput.value) {
                rows.push({
                    line_no: index + 1,
                    it_id: parseInt(itemSelect.value),
                    it_code: itemSelect.options[itemSelect.selectedIndex].getAttribute('data-code'),
                    it_name: row.querySelector('.po-item-name').value,
                    it_details: row.querySelector('.po-item-name').value, // Using name as details for now
                    hsn_code: row.querySelector('.po-item-hsn').value,
                    uom_id: parseInt(row.querySelector('.po-uom').value) || null,
                    req_qty: parseFloat(qtyInput.value),
                    need_date: row.querySelector('.po-need-date').value,
                    unit_price: parseFloat(unitPriceInput.value),
                    discount_percent: parseFloat(row.querySelector('.po-discount-percent').value) || 0,
                    discount_amt: parseFloat(row.querySelector('.po-discount-amt').value) || 0,
                    tax_code: row.querySelector('.po-tax-code').value || null,
                    tax_rate: parseFloat(row.querySelector('.po-tax-rate').value) || 0,
                    tax_amt: parseFloat(row.querySelector('.po-tax-amt').value) || 0,
                    line_total: parseFloat(row.querySelector('.po-line-total').value) || 0,
                    whs_id: parseInt(row.querySelector('.po-whs').value) || null,
                    pr_req_id: null, // These would be set when converting from PR
                    pr_line_no: null,
                    pr_no: null,
                    created_by: 'current_user'
                });
            }
        });

        if (rows.length === 0) {
            alert('Please add at least one item with quantity and unit price to the purchase order.');
            return;
        }

        const payload = {
            ...headerData,
            rows: rows
        };

        console.log('Sending PO payload:', payload);

        if (state.currentEditingPOId) {
            await apiRequest(`/api/purchase-orders/${state.currentEditingPOId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            await apiRequest('/api/purchase-orders', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        await loadPurchaseOrders();
        bootstrap.Modal.getInstance(document.getElementById('purchaseOrderModal')).hide();
        
    } catch (error) {
        console.error('Failed to save purchase order:', error);
        alert('Failed to save purchase order. Check console for details.');
    }
}

function editPurchaseOrder(po_id) {
    const po = poState.purchaseOrders.find(p => p.po_id === po_id);
    if (po) {
        showPurchaseOrderModal(po);
    }
}

async function updatePOStatus(po_id, newStatus) {
    if (confirm(`Are you sure you want to ${newStatus === 'Closed' ? 'close' : 're-open'} this purchase order?`)) {
        try {
            await apiRequest(`/api/purchase-orders/${po_id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ po_status: newStatus })
            });
            await loadPurchaseOrders();
        } catch (error) {
            console.error('Failed to update PO status:', error);
        }
    }
}

async function deletePurchaseOrder(po_id) {
    if (confirm('Are you sure you want to delete this purchase order?')) {
        try {
            await apiRequest(`/api/purchase-orders/${po_id}`, {
                method: 'DELETE'
            });
            await loadPurchaseOrders();
        } catch (error) {
            console.error('Failed to delete purchase order:', error);
        }
    }
}

// Placeholder for GRPO creation
function createGRPO(po_id) {
    alert('GRPO creation functionality will be implemented next!');
    console.log('Creating GRPO for PO:', po_id);
}