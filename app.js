/**
 * EVN EAM-CBM Application Controller & SPA Router
 * Coordinates view transitions, UI actions, GIS maps, autocompletes, 
 * notification alerts, CSV exports, XML serializers, and form bindings.
 */

// --- GLOBAL APPLICATION STATE ---
let currentActiveView = 'dashboard';
let currentCbmMetric = 'NhietDo'; // 'NhietDo' or 'DoRung'
let currentCbmAssetId = '';
let xmlSpecsArray = [
  { key: 'Hãng sản xuất', val: '' },
  { key: 'Điện áp định mức', val: '' }
];
let activeNotifications = [];

// --- INITIAL LOAD HANDLER ---
document.addEventListener("DOMContentLoaded", () => {
  // Check active login session
  if (Auth.isLoggedIn()) {
    showAppShell();
  } else {
    showAuthShell();
  }
  
  // Initialize Global Event Listeners
  setupGlobalEvents();
});

function showAuthShell() {
  const authSec = document.getElementById("auth-section");
  const appSec = document.getElementById("app-section");
  
  if (appSec.style.display !== "none") {
    // We are logging out! Animate logout.
    appSec.classList.add("section-fade-out");
    setTimeout(() => {
      appSec.style.display = "none";
      appSec.classList.remove("section-fade-out");
      
      authSec.style.display = "flex";
      authSec.classList.add("section-fade-out");
      authSec.offsetHeight; // force reflow
      authSec.classList.remove("section-fade-out");
      
      switchAuthTab('login');
    }, 350);
  } else {
    // Initial load
    authSec.style.display = "flex";
    authSec.classList.remove("section-fade-out");
    switchAuthTab('login');
  }
}

function showAppShell() {
  const authSec = document.getElementById("auth-section");
  const appSec = document.getElementById("app-section");

  if (authSec.style.display !== "none") {
    // We are logging in! Animate login.
    authSec.classList.add("section-fade-out");
    setTimeout(() => {
      authSec.style.display = "none";
      authSec.classList.remove("section-fade-out");
      
      appSec.style.display = "flex";
      appSec.classList.add("section-fade-out");
      appSec.offsetHeight; // force reflow
      appSec.classList.remove("section-fade-out");
      
      initAppShell();
    }, 350);
  } else {
    // Initial load
    appSec.style.display = "flex";
    appSec.classList.remove("section-fade-out");
    initAppShell();
  }
}

function initAppShell() {
  // Render user details
  const user = Auth.getCurrentUser();
  if (user) {
    document.getElementById("user-display-name").textContent = user.full_name;
    
    // Display localized Vietnamese roles
    const roleMap = {
      'admin': 'Quản trị viên Hệ thống',
      'manager': 'Quản đốc Phân xưởng',
      'warehouse': 'Thủ kho Thiết bị',
      'technician': 'Kỹ thuật viên Hiện trường'
    };
    document.getElementById("user-display-role").textContent = roleMap[user.role_id] || 'Nhân viên';
    
    // Init initials avatar
    const initials = user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById("user-avatar").textContent = initials;

    // Render popover header details
    document.getElementById("popover-user-name").textContent = user.full_name;
    document.getElementById("popover-user-role").textContent = roleMap[user.role_id] || 'Nhân viên';
    document.getElementById("popover-user-badge").textContent = `[Cấp quyền: ${user.role_id.toUpperCase()}]`;

    // Apply Role-Based Access Control adjustments
    applyRBAC(user.role_id);
  }

  // Load and cache active notifications (telemetry threshold breaches)
  checkCbmSensorViolations();

  // Route to initial view
  switchView('dashboard');
}

/**
 * Enforces Role-Based Access Control (RBAC) constraints in the UI
 */
function applyRBAC(roleId) {
  const btnAddAsset = document.getElementById("btn-add-asset-modal");
  
  // Admin can do everything. Technician can add assets too.
  // Manager and Warehouse cannot create raw Assets in this screen.
  if (roleId === 'manager' || roleId === 'warehouse') {
    if (btnAddAsset) btnAddAsset.style.display = "none";
  } else {
    if (btnAddAsset) btnAddAsset.style.display = "inline-flex";
  }
}

// --- SETUP EVENT LISTENERS ---
function setupGlobalEvents() {
  // Description char counter on Work Order Form
  const woDesc = document.getElementById("wo-form-desc");
  if (woDesc) {
    woDesc.addEventListener("input", (e) => {
      const len = e.target.value.length;
      document.getElementById("wo-form-char-count").textContent = `${len} / 2000 ký tự`;
    });
  }

  // Close dropdown on click outside
  document.addEventListener("click", (e) => {
    const searchDropdown = document.getElementById("search-results-dropdown");
    if (searchDropdown && !e.target.closest(".topbar-search-container")) {
      searchDropdown.classList.remove("visible");
    }

    const notifDropdown = document.getElementById("notifications-dropdown");
    if (notifDropdown && !e.target.closest(".notification-bell-container")) {
      notifDropdown.classList.remove("visible");
    }

    const profilePopover = document.getElementById("profile-popover");
    if (profilePopover && !e.target.closest(".user-profile") && !e.target.closest(".profile-popover")) {
      profilePopover.classList.remove("visible");
    }
  });
}

function toggleProfilePopover(event) {
  event.stopPropagation();
  const popover = document.getElementById("profile-popover");
  if (popover) {
    popover.classList.toggle("visible");
  }
}

function showProfileSettings() {
  showToast("Cài đặt Hồ sơ", "Chức năng Hồ sơ cá nhân đang được phát triển theo phân hệ HMI.", "info");
}

function showSystemSettings() {
  showToast("Cài đặt Hệ thống", "Hệ thống đang cấu hình các cảm biến SCADA thời gian thực.", "info");
}

function showRolePermissionsManagement() {
  showToast("Quản lý Phân quyền", "Yêu cầu quyền ADMIN để chạy GRANT/REVOKE trên NHOM_QUYEN.", "info");
}

function scrollAuditLogsIntoView() {
  const auditLogsEl = document.getElementById("audit-logs-table-body");
  if (auditLogsEl) {
    auditLogsEl.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("Nhật ký Hoạt động", "Trực quan hóa sự kiện từ trg_Audit_NhatKy.", "primary");
  }
}

// --- MODULE 1: AUTHENTICATION PRESENTATION ---
function switchAuthTab(mode) {
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const formLogin = document.getElementById("form-login");
  const formRegister = document.getElementById("form-register");

  const isLogin = mode === 'login';
  const activeTab = isLogin ? tabLogin : tabRegister;
  const inactiveTab = isLogin ? tabRegister : tabLogin;
  const activeForm = isLogin ? formLogin : formRegister;
  const inactiveForm = isLogin ? formRegister : formLogin;

  if (activeTab.classList.contains("active") && activeForm.style.display === "block") {
    // Already in correct state, but make sure classes are correct
    activeForm.classList.add("form-visible");
    activeForm.classList.remove("form-hidden");
    return;
  }

  // Update tabs active state
  activeTab.classList.add("active");
  inactiveTab.classList.remove("active");

  // Smooth form transition
  inactiveForm.classList.remove("form-visible");
  inactiveForm.classList.add("form-hidden");
  
  setTimeout(() => {
    inactiveForm.style.display = "none";
    inactiveForm.classList.remove("form-hidden");
    
    activeForm.style.display = "block";
    activeForm.classList.add("form-hidden");
    // Force reflow
    activeForm.offsetHeight;
    activeForm.classList.remove("form-hidden");
    activeForm.classList.add("form-visible");
  }, 200); // matches CSS transition duration (0.25s) with a safe buffer
}

// Real-time visual representation of password hashing
async function showLiveHash(passVal) {
  const hashBox = document.getElementById("login-hash-feedback");
  const hashValSpan = document.getElementById("login-hash-value");
  if (!passVal) {
    hashBox.classList.remove("visible");
    return;
  }
  hashBox.classList.add("visible");
  const hash = await window.computeSHA256(passVal);
  hashValSpan.textContent = hash.substring(0, 32) + "...";
}

async function handleLogin(event) {
  event.preventDefault();
  const usernameInput = document.getElementById("login-username").value;
  const passwordInput = document.getElementById("login-password").value;
  const errorMsg = document.getElementById("login-error-msg");

  try {
    errorMsg.style.display = "none";
    await Auth.login(usernameInput, passwordInput);
    showToast("Đăng nhập thành công!", `Chào mừng ${usernameInput} quay trở lại hệ thống EVN AssetManagement.`, "success");
    
    // Log audit event
    DB.logAudit(usernameInput, "Đăng nhập thành công vào hệ thống quản lý.", "trg_Audit_NhatKy");
    
    showAppShell();
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.style.display = "flex";
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const fullName = document.getElementById("reg-fullname").value;
  const empId = document.getElementById("reg-empid").value;
  const dept = document.getElementById("reg-dept").value;
  const email = document.getElementById("reg-email").value;
  const phone = document.getElementById("reg-phone").value;
  const password = document.getElementById("reg-password").value;
  const confirmPass = document.getElementById("reg-confirmpass").value;
  const errorMsg = document.getElementById("register-error-msg");

  try {
    errorMsg.style.display = "none";
    await Auth.register(fullName, empId, dept, email, phone, password, confirmPass);
    showToast("Đăng ký thành công!", "Tài khoản mẫu của bạn đã được khởi tạo. Vui lòng đăng nhập.", "success");
    
    // Log audit event
    DB.logAudit("SYSTEM", `Trigger trg_Audit_NhatKy: Đăng ký tài khoản nhân viên mới ${fullName} (${empId}).`, "trg_Audit_NhatKy");
    
    switchAuthTab('login');
    document.getElementById("login-username").value = empId;
    document.getElementById("login-password").value = password;
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.style.display = "flex";
  }
}

async function quickLogin(roleId) {
  try {
    await Auth.quickLoginAs(roleId);
    showToast("Đăng nhập nhanh thành công!", `Quyền truy cập: ${roleId.toUpperCase()}`, "success");
    
    // Log audit event
    DB.logAudit(roleId, `Đăng nhập nhanh (RBAC: ${roleId}) thành công.`, "trg_Audit_NhatKy");
    
    showAppShell();
  } catch (err) {
    alert(err.message);
  }
}

function handleLogout() {
  if (confirm("Xác nhận đăng xuất tài khoản làm việc hiện tại?")) {
    const user = Auth.getCurrentUser();
    if (user) {
      DB.logAudit(user.username, "Đăng xuất khỏi hệ thống quản lý.", "trg_Audit_NhatKy");
    }
    Auth.logout();
    showToast("Đã đăng xuất", "Hẹn gặp lại đồng chí.", "primary");
    showAuthShell();
  }
}

// --- MODULE 2: ROUTER & PAGE BINDINGS ---
function switchView(viewId) {
  currentActiveView = viewId;
  
  // Update sidebar active classes
  const menuItems = document.querySelectorAll(".sidebar-item");
  menuItems.forEach(item => item.classList.remove("active"));
  
  const targetMenu = document.getElementById(`menu-${viewId}`);
  if (targetMenu) targetMenu.classList.add("active");

  // Show/Hide View Content Panes
  const panes = document.querySelectorAll(".content-pane");
  panes.forEach(pane => pane.classList.remove("active"));
  
  const targetPane = document.getElementById(`view-${viewId}`);
  if (targetPane) targetPane.classList.add("active");

  // Page Specific Inits
  initPageView(viewId);
}

function initPageView(viewId) {
  switch (viewId) {
    case 'dashboard':
      renderDashboardMetrics();
      renderDonutFailures();
      renderBarCosts();
      renderProductivityDepreciationChart();
      renderGISMap();
      break;
    case 'assets':
      renderAssetGrid();
      populateAssetFormDropdowns();
      closeAssetForm();
      break;
    case 'cbm':
      populateCbmAssetOptions();
      renderTelemetryTable();
      updateCbmChart();
      break;
    case 'workorders':
      populateWorkOrderAssetOptions();
      renderPredictionsTable();
      renderWorkOrdersTable();
      closeWorkOrderForm();
      break;
    case 'reports':
      renderClosedWorkOrdersTable();
      break;
    case 'help':
      // FAQ Accordions are handled statically on click events
      break;
  }
}

// --- MODULE 3: INTERACTIVE DASHBOARD VIEWS ---
function renderDashboardMetrics() {
  // Mapped to total assets
  const totalAssetsCount = DB.assets.filter(a => a.status !== 'Thanh lý').length;
  document.getElementById("kpi-total-assets").textContent = totalAssetsCount;

  // Mapped to view: vw_TaiSan_NguyHiem
  const dangerousCount = DB.vw_TaiSan_NguyHiem.length;
  document.getElementById("kpi-danger-assets").textContent = dangerousCount;

  // Trigger electric alert glowing pulse if there are critical assets
  const dangerCard = document.getElementById("kpi-danger-card");
  if (dangerCard) {
    if (dangerousCount > 0) {
      dangerCard.classList.add("kpi-card-critical-pulse");
    } else {
      dangerCard.classList.remove("kpi-card-critical-pulse");
    }
  }

  // Average Substation Health
  // Mapped to view: vw_HieuSuat_TramDien
  const substationPerformance = DB.vw_HieuSuat_TramDien;
  const avgHealthAll = substationPerformance.length
    ? Math.round(substationPerformance.reduce((sum, s) => sum + s.avg_health, 0) / substationPerformance.length)
    : 100;
  document.getElementById("kpi-completed-maintenance").textContent = `${avgHealthAll}%`;

  // Mapped to function: fn_TinhThangBaoTriConLai
  const countdownEl = document.getElementById("kpi-maint-countdown");
  if (countdownEl) {
    countdownEl.textContent = `${DB.fn_TinhThangBaoTriConLai()} tháng`;
  }

  // Render system audit logs
  renderAuditLogs();
}

function renderProductivityDepreciationChart() {
  EVNCharts.drawProductivityDepreciationChart('bar-productivity-depreciation');
}

function renderAuditLogs() {
  const tbody = document.getElementById("audit-logs-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  DB.auditLogs.forEach(log => {
    const tr = document.createElement("tr");
    tr.className = "audit-row";
    tr.innerHTML = `
      <td class="audit-time">${log.log_date}</td>
      <td><span class="audit-actor">${log.actor}</span></td>
      <td class="audit-action">${log.action}</td>
      <td><span class="audit-object">${log.object_name}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderDonutFailures() {
  // Mapped to view: vw_ThietBi_LoiNhieu
  const failureData = DB.vw_ThietBi_LoiNhieu;
  EVNCharts.drawDonutChart("donut-failures", failureData);
}

function renderBarCosts() {
  // Mapped to stored procedure: sp_BaoCao_ChiPhiBaoTri
  const costReport = DB.sp_BaoCao_ChiPhiBaoTri();
  EVNCharts.drawBarChart("bar-costs", costReport);
}

let gisMapInstance = null;

// Draw interactive GIS maps of TRAM_DIEN nodes using Leaflet
function renderGISMap() {
  const mapElement = document.getElementById("gis-map");
  if (!mapElement) return;

  const substations = DB.vw_HieuSuat_TramDien;

  if (gisMapInstance) {
    // If map already exists, clear existing markers to redraw fresh ones
    gisMapInstance.eachLayer(layer => {
      if (layer instanceof L.CircleMarker) {
        gisMapInstance.removeLayer(layer);
      }
    });
  } else {
    // Initialize Leaflet Map centered in Thu Duc City
    gisMapInstance = L.map('gis-map', {
      center: [10.82, 106.77],
      zoom: 12,
      zoomControl: false // keep it clean, no default controls
    });

    // Add a beautiful clean light-mode dashboard tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap'
    }).addTo(gisMapInstance);
  }

  // Draw substations
  substations.forEach(sub => {
    let color = "#28A745"; // normal
    if (sub.avg_health < 50) color = "#FF3B30"; // dangerous
    else if (sub.avg_health < 85) color = "#FFC107"; // warning

    const marker = L.circleMarker([sub.latitude, sub.longitude], {
      radius: 9,
      fillColor: color,
      color: "#ffffff",
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.85
    }).addTo(gisMapInstance);

    const tooltipContent = `
      <div style="font-family:'Inter', sans-serif; font-size:11px; padding:2px; color:var(--text-main);">
        <div style="font-weight:700; color:var(--evn-primary-dark); font-size:12px; margin-bottom:4px;">${sub.substation_name}</div>
        <div style="color:var(--text-muted); font-size:10px;">Phân vùng: ${sub.region}</div>
        <div style="color:var(--text-muted); font-size:10px;">Thiết bị lắp đặt: <strong>${sub.asset_count} máy</strong></div>
        <div style="margin-top:5px; font-weight:600; font-size:11px; color:${color};">Sức khỏe trạm: ${sub.avg_health}%</div>
      </div>
    `;
    marker.bindTooltip(tooltipContent, {
      direction: 'top',
      opacity: 0.98,
      className: 'gis-map-leaflet-tooltip'
    });

    marker.on('click', () => {
      switchView('assets');
      const subFilter = document.getElementById("asset-filter-status");
      if (subFilter) subFilter.value = "";
      const typeFilter = document.getElementById("asset-filter-type");
      if (typeFilter) typeFilter.value = "";
      
      renderAssetGridFilteredBySubstation(sub.substation_id);
    });
  });

  // Automatically zoom and fit all markers on screen
  if (substations.length > 0) {
    const markerGroup = L.featureGroup(substations.map(sub => L.marker([sub.latitude, sub.longitude])));
    gisMapInstance.fitBounds(markerGroup.getBounds().pad(0.15));
  }
}

function paddingScale(val, min, span, minPx, maxPx) {
  const ratio = (val - min) / span;
  return minPx + ratio * (maxPx - minPx);
}

// --- GLOBAL SEARCH ENGINE AUTOCOMPLETE ---
function handleSearchInput(query) {
  const dropdown = document.getElementById("search-results-dropdown");
  if (!query || query.trim() === "") {
    dropdown.classList.remove("visible");
    return;
  }

  const cleanQuery = query.toLowerCase().trim();
  // Query mapped to full join vw_HoSo_TaiSan_DayDu
  const matches = DB.vw_HoSo_TaiSan_DayDu.filter(
    a => (a.asset_id.toLowerCase().includes(cleanQuery) || a.asset_name.toLowerCase().includes(cleanQuery)) && a.status !== 'Thanh lý'
  ).slice(0, 5); // limit 5 items

  if (matches.length === 0) {
    dropdown.innerHTML = `<div class="search-result-item" style="color:var(--text-muted);font-size:12px;">Không tìm thấy mã tài sản nào</div>`;
  } else {
    dropdown.innerHTML = matches.map(m => `
      <div class="search-result-item" onclick="selectSearchResult('${m.asset_id}')">
        <div class="search-result-title">${m.asset_id}</div>
        <div class="search-result-desc">${m.asset_name} - ${m.substation_name}</div>
      </div>
    `).join('');
  }

  dropdown.classList.add("visible");
}

function handleSearchKey(event) {
  if (event.key === 'Enter') {
    const query = event.target.value.trim();
    if (query !== "") {
      const cleanQuery = query.toLowerCase();
      // Grab first matched asset
      const match = DB.assets.find(
        a => (a.asset_id.toLowerCase() === cleanQuery || a.asset_name.toLowerCase().includes(cleanQuery)) && a.status !== 'Thanh lý'
      );
      if (match) {
        selectSearchResult(match.asset_id);
        event.target.value = "";
      } else {
        showToast("Lỗi tìm kiếm", "Không tìm thấy mã tài sản khớp chính xác.", "danger");
      }
    }
  }
}

function selectSearchResult(assetId) {
  document.getElementById("search-results-dropdown").classList.remove("visible");
  openAssetDrawer(assetId);
}

// --- MODULE 2: SIDEBAR & TOP BAR NOTIFICATION SYSTEM ---
function checkCbmSensorViolations() {
  activeNotifications = [];
  
  // Find critical entries in telemetry log
  // Limit thresholds checks resolved dynamically from DB.standards
  DB.telemetry.forEach(log => {
    const asset = DB.assets.find(a => a.asset_id === log.asset_id);
    if (!asset || asset.status === 'Thanh lý') return;

    const std = DB.standards.find(s => s.type_id === asset.type_id && s.metric_name === log.metric_name);
    const criticalThreshold = std ? std.critical_limit : (log.metric_name === 'NhietDo' ? 90 : 240);
    const isCritical = log.metric_value > criticalThreshold;
    
    if (isCritical) {
      const unitMap = { 'NhietDo': '°C', 'DienAp': 'V', 'DoRung': 'mm/s' };
      const labelMap = { 'NhietDo': 'Nhiệt độ', 'DienAp': 'Điện áp', 'DoRung': 'Độ rung' };
      activeNotifications.unshift({
        asset_id: log.asset_id,
        metric_name: labelMap[log.metric_name] || log.metric_name,
        metric_value: log.metric_value,
        unit: unitMap[log.metric_name] || '',
        recorded_at: log.recorded_at
      });
    }
  });

  updateNotificationBellUI();
}

function updateNotificationBellUI() {
  const badge = document.getElementById("bell-badge");
  const list = document.getElementById("notifications-list");
  
  if (activeNotifications.length > 0) {
    badge.classList.add("flashing");
    
    list.innerHTML = activeNotifications.map((notif, index) => `
      <div class="notification-dropdown-item" onclick="handleNotificationClick('${notif.asset_id}')">
        <svg class="notification-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <div class="notification-item-content">
          <div style="font-weight:600; color:#0F172A;">Báo động thiết bị: ${notif.asset_id}</div>
          <div style="color:var(--evn-accent); font-weight:500;">
            ${notif.metric_name} quá cao: ${notif.metric_value} ${notif.unit}
          </div>
          <div class="notification-item-time">${new Date(notif.recorded_at).toLocaleTimeString('vi-VN')}</div>
        </div>
      </div>
    `).join('');
  } else {
    badge.classList.remove("flashing");
    list.innerHTML = `
      <div class="notifications-empty">Không phát hiện cảnh báo cảm biến bất thường.</div>
    `;
  }
}

function handleNotificationClick(assetId) {
  document.getElementById("notifications-dropdown").classList.remove("visible");
  openAssetDrawer(assetId);
}

function clearAllNotifications(event) {
  event.stopPropagation();
  activeNotifications = [];
  updateNotificationBellUI();
  showToast("Thông báo", "Đã xóa tạm thời các cảnh báo khỏi danh sách chờ.", "primary");
}

function toggleNotificationsDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById("notifications-dropdown");
  dropdown.classList.toggle("visible");
}

// --- DETAIL DRAWER ENGINE ---
function openAssetDrawer(assetId) {
  const asset = DB.vw_HoSo_TaiSan_DayDu.find(a => a.asset_id === assetId);
  if (!asset) return;

  document.getElementById("drawer-asset-id").textContent = asset.asset_id;
  document.getElementById("drawer-asset-name").textContent = asset.asset_name;
  document.getElementById("drawer-asset-type").textContent = asset.type_name;
  document.getElementById("drawer-asset-substation").textContent = asset.substation_name;
  document.getElementById("drawer-asset-date").textContent = asset.install_date;
  
  // Health display style
  const healthEl = document.getElementById("drawer-asset-health");
  const healthPercent = Math.round(asset.health_score * 100);
  healthEl.textContent = `${healthPercent}%`;
  if (asset.health_score < 0.4) {
    healthEl.style.color = "var(--evn-accent)";
  } else if (asset.health_score < 0.7) {
    healthEl.style.color = "var(--evn-accent-orange)";
  } else {
    healthEl.style.color = "var(--evn-success)";
  }

  // Status tag
  const statusEl = document.getElementById("drawer-asset-status");
  let badgeClass = 'badge-success';
  if (asset.status === 'Sự cố') badgeClass = 'badge-danger';
  else if (asset.status === 'Bảo trì') badgeClass = 'badge-warning';
  else if (asset.status === 'Dự phòng') badgeClass = 'badge-info';
  else if (asset.status === 'Thanh lý') badgeClass = 'badge-secondary';

  statusEl.innerHTML = `<span class="badge ${badgeClass}">${asset.status}</span>`;

  // Specifications XML key-value renders
  const specList = document.getElementById("drawer-asset-specs");
  specList.innerHTML = "";
  const specs = asset.parsed_specs;
  
  const specKeys = Object.keys(specs);
  if (specKeys.length === 0) {
    specList.innerHTML = `<div style="font-size:12px; color:var(--text-muted);">Không cài đặt thông số chi tiết</div>`;
  } else {
    specKeys.forEach(k => {
      const item = document.createElement("div");
      item.className = "spec-tag-item";
      item.innerHTML = `
        <span class="drawer-meta-label">${k}</span>
        <span class="drawer-meta-val">${specs[k]}</span>
      `;
      specList.appendChild(item);
    });
  }

  // Load active tickets for this specific asset
  const ticketList = document.getElementById("drawer-asset-tickets");
  ticketList.innerHTML = "";
  
  const activeTickets = DB.workOrders.filter(w => w.asset_id === assetId && w.wo_status !== 'Đã đóng');
  if (activeTickets.length === 0) {
    ticketList.innerHTML = `<div style="font-size:12px; color:var(--text-success); font-weight:600;">● Thiết bị không có lệnh bảo trì tồn đọng.</div>`;
  } else {
    activeTickets.forEach(tk => {
      const item = document.createElement("div");
      item.style.padding = "8px";
      item.style.border = "1px solid var(--evn-border)";
      item.style.borderRadius = "4px";
      item.style.fontSize = "12px";
      item.style.backgroundColor = tk.wo_status === 'Đang xử lý' ? 'rgba(255, 149, 0, 0.05)' : 'rgba(23, 162, 184, 0.05)';
      item.innerHTML = `
        <div style="display:flex; justify-content:between; font-weight:600; margin-bottom:3px;">
          <span>Lệnh: ${tk.wo_id}</span>
          <span class="badge ${tk.wo_status === 'Đang xử lý' ? 'badge-warning' : 'badge-info'}" style="margin-left:auto; scale:0.85;">${tk.wo_status}</span>
        </div>
        <div style="color:var(--text-muted); font-size:11px;">Mô tả: ${tk.issue_desc}</div>
      `;
      ticketList.appendChild(item);
    });
  }

  // Draw overlays
  document.getElementById("asset-drawer-backdrop").classList.add("active");
  document.getElementById("asset-drawer").classList.add("active");
}

function closeAssetDrawer() {
  document.getElementById("asset-drawer-backdrop").classList.remove("active");
  document.getElementById("asset-drawer").classList.remove("active");
}

// --- MODULE 4: ASSETS GRID & FORM LOGIC ---
function escapeXml(xml) {
  if (!xml) return '';
  return xml
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function highlightXml(xml) {
  if (!xml) return '';
  let escaped = escapeXml(xml);
  escaped = escaped.replace(/(&lt;\/?[a-zA-Z0-9_]+)(\s+.*?)*(\/?&gt;)/g, (match, p1, p2, p3) => {
    let parts = `<span class="xml-tag">${p1}</span>`;
    if (p2) {
      parts += p2.replace(/([a-zA-Z0-9_]+)=(&quot;.*?&quot;)/g, `<span class="xml-attr">$1</span>=<span class="xml-val">$2</span>`);
    }
    parts += `<span class="xml-tag">${p3}</span>`;
    return parts;
  });
  return escaped;
}

function toggleXmlAccordion(assetId) {
  const el = document.getElementById(`xml-details-${assetId}`);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'table-row' : 'none';
  }
}

function renderAssetGrid(substationId = null) {
  const typeFilter = document.getElementById("asset-filter-type").value;
  const statusFilter = document.getElementById("asset-filter-status").value;
  const tbody = document.getElementById("assets-table-body");
  
  if (!tbody) return;
  tbody.innerHTML = "";

  // Query views: vw_HoSo_TaiSan_DayDu
  let filtered = DB.vw_HoSo_TaiSan_DayDu;
  
  if (substationId) {
    filtered = filtered.filter(a => a.substation_id === substationId);
  } else {
    if (typeFilter) {
      filtered = filtered.filter(a => a.type_id === typeFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
  }

  // Sort: active/troubled items on top, liquidated at bottom
  filtered.sort((x, y) => {
    if (x.status === 'Thanh lý' && y.status !== 'Thanh lý') return 1;
    if (x.status !== 'Thanh lý' && y.status === 'Thanh lý') return -1;
    return (x.health_score - y.health_score); // lower health score first
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);">Không tìm thấy thiết bị nào khớp bộ lọc</td></tr>`;
    return;
  }

  const currentUser = Auth.getCurrentUser();
  const isAdmin = currentUser && currentUser.role_id === 'admin';

  filtered.forEach(a => {
    let healthColor = 'var(--evn-success)';
    let healthClass = 'status-emerald';
    const healthPercent = Math.round(a.health_score * 100);
    
    if (a.health_score < 0.4) {
      healthColor = 'var(--evn-accent)';
      healthClass = 'health-critical-pulse';
    } else if (a.health_score < 0.8) {
      healthColor = 'var(--evn-accent-orange)';
      healthClass = 'status-amber';
    } else {
      healthColor = 'var(--evn-success)';
      healthClass = 'status-emerald';
    }

    let badgeClass = 'badge-emerald';
    if (a.status === 'Thanh lý') {
      badgeClass = 'badge-secondary';
    } else if (a.health_score < 0.4) {
      badgeClass = 'badge-critical-pulse';
    } else if (a.health_score < 0.8) {
      badgeClass = 'badge-amber';
    }

    const tr = document.createElement("tr");
    
    // Liquidated row styling
    if (a.status === 'Thanh lý') tr.style.opacity = "0.55";

    tr.innerHTML = `
      <td><strong style="color:var(--evn-primary);cursor:pointer;" onclick="openAssetDrawer('${a.asset_id}')">${a.asset_id}</strong></td>
      <td><strong>${a.asset_name}</strong></td>
      <td>${a.type_name}</td>
      <td>${a.substation_name}</td>
      <td>${a.install_date}</td>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="${healthClass}" style="font-weight:700;">${healthPercent}%</span>
          <div style="flex:1; width:50px; height:6px; background-color:#E2E8F0; border-radius:3px; overflow:hidden;">
            <div style="width:${healthPercent}%; height:100%; background-color:${healthColor};"></div>
          </div>
        </div>
      </td>
      <td><span class="badge ${badgeClass}">${a.status}</span></td>
      <td style="text-align:right;">
        <button class="btn btn-secondary btn-small" onclick="toggleXmlAccordion('${a.asset_id}')">Chi tiết XML</button>
        <button class="btn btn-secondary btn-small" onclick="openAssetDrawer('${a.asset_id}')">Hồ Sơ</button>
        ${(isAdmin && a.status !== 'Thanh lý') ? `<button class="btn btn-danger btn-small" onclick="handleSoftDeleteAsset('${a.asset_id}')">Thanh lý <span class="db-badge" style="background:rgba(255,255,255,0.15);color:#FFF;border-color:transparent;">[⚙️ sp_LuuTru_TaiSanHong]</span></button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);

    // Expandable details row for XML specs
    const detailTr = document.createElement("tr");
    detailTr.id = `xml-details-${a.asset_id}`;
    detailTr.style.display = "none";
    detailTr.style.backgroundColor = "rgba(0,0,0,0.02)";
    
    // Get parsed specs text
    const specsHtml = Object.keys(a.parsed_specs).map(k => `
      <div class="spec-tag-item">
        <span class="drawer-meta-label">${k}</span>
        <span class="drawer-meta-val">${a.parsed_specs[k]}</span>
      </div>
    `).join('') || '<div style="font-size:12px; color:var(--text-muted);">Không cài đặt thông số chi tiết</div>';

    detailTr.innerHTML = `
      <td colspan="8" style="padding: 12px 24px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start;">
          <div>
            <div style="font-weight: 700; font-size: 11px; margin-bottom: 6px; color: var(--text-muted);">
              DỮ LIỆU THÔ [XML STRUCT MAPPED] - <span class="db-badge" style="margin-left:0;">[👁️ View: vw_HoSo_TaiSan_DayDu]</span>
            </div>
            <pre class="xml-code-block">${highlightXml(a.technical_specs)}</pre>
          </div>
          <div>
            <div style="font-weight: 700; font-size: 11px; margin-bottom: 6px; color: var(--text-muted);">
              DỮ LIỆU PHÂN TÍCH [VIEW: vw_ChiTietThongSo_XML]
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${specsHtml}
            </div>
          </div>
        </div>
      </td>
    `;
    tbody.appendChild(detailTr);
  });
}

function renderAssetGridFilteredBySubstation(substationId) {
  document.getElementById("asset-filter-type").value = "";
  document.getElementById("asset-filter-status").value = "";
  renderAssetGrid(substationId);
}

function handleSoftDeleteAsset(assetId) {
  if (confirm(`Bạn có chắc chắn muốn làm thủ tục thanh lý thiết bị ${assetId}?\nThao tác này KHÔNG THỂ HỦY BỎ.`)) {
    try {
      // Calls sp_LuuTru_TaiSanHong inside DB, which triggers prevent rules
      const result = DB.sp_LuuTru_TaiSanHong(assetId);
      
      // Log audit event
      const username = Auth.getCurrentUser()?.username || "unknown";
      DB.logAudit(username, `sp_LuuTru_TaiSanHong: Tiến hành thanh lý thiết bị ${assetId}.`, "sp_LuuTru_TaiSanHong");
      
      showToast("Thanh lý thành công", result.message, "success");
      renderAssetGrid();
      checkCbmSensorViolations(); // refresh alerts list
    } catch (err) {
      showToast("Lỗi thanh lý", err.message, "danger");
    }
  }
}

function populateAssetFormDropdowns() {
  const subSelect = document.getElementById("asset-form-substation");
  if (!subSelect) return;
  subSelect.innerHTML = `<option value="" disabled selected>Chọn trạm biến áp...</option>` +
    DB.substations.map(s => `<option value="${s.substation_id}">${s.substation_name}</option>`).join('');
}

function openAddAssetForm() {
  // Check permission
  const user = Auth.getCurrentUser();
  if (user && (user.role_id === 'manager' || user.role_id === 'warehouse')) {
    showToast("Từ chối truy cập", "Phân quyền của đồng chí không thể thực hiện thao tác nhập tài sản.", "danger");
    return;
  }

  document.getElementById("asset-form-card").style.display = "block";
  document.getElementById("form-asset-input").reset();
  
  // Set default values for XML builder
  xmlSpecsArray = [
    { key: 'Hãng sản xuất', val: '' },
    { key: 'Điện áp định mức', val: '' }
  ];
  renderXmlSpecRows();
  updateXmlSpecsPreview();
  
  // Hide warning dates error
  document.getElementById("asset-form-date-error").classList.remove("visible");

  // Scroll to form
  document.getElementById("asset-form-card").scrollIntoView({ behavior: 'smooth' });
}

function closeAssetForm() {
  document.getElementById("asset-form-card").style.display = "none";
}

// --- DYNAMIC XML BUILDER ---
function renderXmlSpecRows() {
  const container = document.getElementById("xml-specs-rows");
  container.innerHTML = xmlSpecsArray.map((spec, index) => `
    <div class="xml-specs-row">
      <input type="text" class="form-control spec-key" value="${spec.key}" placeholder="Tên thông số (VD: Điện áp)" oninput="updateXmlSpecKey(${index}, this.value)">
      <input type="text" class="form-control spec-val" value="${spec.val}" placeholder="Trị số (VD: 500kV)" oninput="updateXmlSpecValue(${index}, this.value)">
      <button type="button" class="btn btn-danger btn-small" onclick="removeXmlSpecRow(${index})">X</button>
    </div>
  `).join('');
}

function addXmlSpecRow() {
  xmlSpecsArray.push({ key: '', val: '' });
  renderXmlSpecRows();
  updateXmlSpecsPreview();
}

function removeXmlSpecRow(index) {
  xmlSpecsArray.splice(index, 1);
  renderXmlSpecRows();
  updateXmlSpecsPreview();
}

function updateXmlSpecKey(index, val) {
  xmlSpecsArray[index].key = val;
  updateXmlSpecsPreview();
}

function updateXmlSpecValue(index, val) {
  xmlSpecsArray[index].val = val;
  updateXmlSpecsPreview();
}

function serializeXmlSpecs() {
  let xml = "<specs>";
  xmlSpecsArray.forEach(item => {
    if (item.key.trim() !== "") {
      const escapedKey = item.key.replace(/"/g, '&quot;');
      const escapedVal = item.val.replace(/"/g, '&quot;');
      xml += `<param name="${escapedKey}" value="${escapedVal}"/>`;
    }
  });
  xml += "</specs>";
  return xml;
}

function updateXmlSpecsPreview() {
  const preview = document.getElementById("xml-specs-preview");
  if (preview) {
    preview.textContent = serializeXmlSpecs();
  }
}

function handleAssetSubmit(event) {
  event.preventDefault();
  
  const assetId = document.getElementById("asset-form-id").value.trim();
  const assetName = document.getElementById("asset-form-name").value.trim();
  const typeId = document.getElementById("asset-form-type").value;
  const subId = document.getElementById("asset-form-substation").value;
  const installDate = document.getElementById("asset-form-date").value;
  const initialStatus = document.getElementById("asset-form-status").value;
  const dateError = document.getElementById("asset-form-date-error");

  try {
    dateError.classList.remove("visible");

    // 1. Simulate SQL trigger: trg_Check_NgayLapDat
    DB.trg_Check_NgayLapDat(installDate);

    // Check duplicate ID
    const duplicate = DB.assets.find(a => a.asset_id.toLowerCase() === assetId.toLowerCase());
    if (duplicate) {
      throw new Error(`Mã tài sản (asset_id) "${assetId}" đã được đăng ký trong hệ thống.`);
    }

    // 2. Serialize XML specs
    const xmlData = serializeXmlSpecs();

    const newAsset = {
      asset_id: assetId,
      asset_name: assetName,
      type_id: typeId,
      substation_id: subId,
      install_date: installDate,
      status: initialStatus,
      health_score: 1.0, // Initial perfect state
      technical_specs: xmlData
    };

    DB.assets.push(newAsset);
    DB.saveAll();

    // Log audit event
    const username = Auth.getCurrentUser()?.username || "unknown";
    DB.logAudit(username, `sp_ThemMoi_TaiSan: Thêm thiết bị mới ${assetId} tại trạm ${subId}.`, "sp_ThemMoi_TaiSan");

    showToast("Tạo tài sản thành công", `Đã lưu hồ sơ thiết bị ${assetId} vào cơ sở dữ liệu.`, "success");
    closeAssetForm();
    renderAssetGrid();
  } catch (err) {
    if (err.message.includes("trg_Check_NgayLapDat")) {
      dateError.classList.add("visible");
      dateError.textContent = err.message;
    } else {
      showToast("Lỗi nhập liệu SQL", err.message, "danger");
    }
  }
}

// --- MODULE 5: GIÁM SÁT CBM (TELEMETRY) ---
function populateCbmAssetOptions() {
  const selects = [
    document.getElementById("cbm-chart-asset-id"),
    document.getElementById("cbm-form-asset")
  ];

  const activeAssets = DB.assets.filter(a => a.status !== 'Thanh lý');
  
  selects.forEach(select => {
    if (!select) return;
    const prevVal = select.value;
    select.innerHTML = activeAssets.map(a => `<option value="${a.asset_id}">${a.asset_id} (${a.asset_name})</option>`).join('');
    if (prevVal && activeAssets.some(a => a.asset_id === prevVal)) {
      select.value = prevVal;
    }
  });

  if (activeAssets.length > 0 && !currentCbmAssetId) {
    currentCbmAssetId = activeAssets[0].asset_id;
    if (document.getElementById("cbm-chart-asset-id")) {
      document.getElementById("cbm-chart-asset-id").value = currentCbmAssetId;
    }
  }
}

function switchCbmMetric(metric) {
  currentCbmMetric = metric;
  
  const btnTemp = document.getElementById("btn-metric-temp");
  const btnVib = document.getElementById("btn-metric-vib"); // represents Voltage / DienAp now

  if (metric === 'NhietDo') {
    btnTemp.style.backgroundColor = "var(--evn-primary)";
    btnTemp.style.color = "#FFF";
    btnVib.style.backgroundColor = "transparent";
    btnVib.style.background = "none";
    btnVib.style.color = "var(--text-main)";
    
    // Auto-select A0004 for Temperature
    currentCbmAssetId = 'A0004';
  } else {
    btnVib.style.backgroundColor = "var(--evn-primary)";
    btnVib.style.color = "#FFF";
    btnTemp.style.backgroundColor = "transparent";
    btnTemp.style.background = "none";
    btnTemp.style.color = "var(--text-main)";
    
    // Auto-select A1236 for Voltage
    currentCbmAssetId = 'A1236';
  }

  const assetSelect = document.getElementById("cbm-chart-asset-id");
  if (assetSelect) {
    assetSelect.value = currentCbmAssetId;
  }

  updateCbmChart();
}

function updateCbmChart() {
  const assetSelect = document.getElementById("cbm-chart-asset-id");
  if (assetSelect && assetSelect.value) currentCbmAssetId = assetSelect.value;
  
  if (!currentCbmAssetId) return;

  // Filter logs for this specific asset & metric
  const filteredLogs = DB.telemetry
    .filter(log => log.asset_id === currentCbmAssetId && log.metric_name === currentCbmMetric)
    .sort((a,b) => new Date(a.recorded_at) - new Date(b.recorded_at));

  EVNCharts.drawLineChart("cbm-line-chart", filteredLogs, currentCbmMetric);
}

function renderTelemetryTable() {
  const tbody = document.getElementById("telemetry-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  // Get most recent 12 sensor logs
  const logs = [...DB.telemetry].sort((a,b) => new Date(b.recorded_at) - new Date(a.recorded_at)).slice(0, 12);

  logs.forEach(log => {
    const asset = DB.assets.find(a => a.asset_id === log.asset_id) || {};
    const std = DB.standards.find(s => s.type_id === asset.type_id && s.metric_name === log.metric_name);
    
    const isTemp = log.metric_name === 'NhietDo';
    const isVolt = log.metric_name === 'DienAp';
    
    const limitCrit = std ? std.critical_limit : (isTemp ? 90 : (isVolt ? 240 : 5.0));
    const limitWarn = std ? std.warning_limit : (isTemp ? 75 : (isVolt ? 220 : 4.0));
    const unit = isTemp ? '°C' : (isVolt ? 'V' : 'mm/s');

    const isCritical = log.metric_value > limitCrit;
    const isWarning = log.metric_value > limitWarn && log.metric_value <= limitCrit;

    let rowClass = "";
    let statusText = `<span class="badge badge-success">Bình thường</span>`;
    
    if (isCritical) {
      rowClass = "row-anomalous";
      statusText = `<span class="badge badge-danger">Cảnh báo Đỏ</span>`;
    } else if (isWarning) {
      statusText = `<span class="badge badge-warning">Cảnh báo Vàng</span>`;
    }

    const tr = document.createElement("tr");
    if (rowClass) tr.className = rowClass;

    const metricLabel = isTemp ? 'Nhiệt độ cuộn dây' : (isVolt ? 'Điện áp định mức' : 'Biên độ rung chấn');

    tr.innerHTML = `
      <td>${log.log_id}</td>
      <td><strong style="color:var(--evn-primary); cursor:pointer;" onclick="openAssetDrawer('${log.asset_id}')">${log.asset_id}</strong></td>
      <td>${new Date(log.recorded_at).toLocaleString('vi-VN')}</td>
      <td>${metricLabel}</td>
      <td style="font-weight:bold; color:${isCritical ? 'var(--evn-accent)' : (isWarning ? '#B7791F' : 'inherit')}">${log.metric_value} ${unit}</td>
      <td>Cảnh báo: &gt;${limitWarn} / Nguy hiểm: &gt;${limitCrit}</td>
      <td>${statusText}</td>
    `;
    tbody.appendChild(tr);
  });
}

function handleTelemetrySubmit(event) {
  event.preventDefault();
  
  const assetId = document.getElementById("cbm-form-asset").value;
  const metricName = document.getElementById("cbm-form-metric").value;
  const metricVal = parseFloat(document.getElementById("cbm-form-value").value);
  const warningDiv = document.getElementById("cbm-form-warning");

  try {
    warningDiv.style.display = "none";

    // Fields check validation
    if (!assetId || !metricName || isNaN(metricVal)) {
      throw new Error("Lỗi: Các trường dữ liệu ghi nhật ký cảm biến không được để trống.");
    }

    const newLogId = 'LOG' + String(DB.telemetry.length + 1).padStart(3, '0');
    
    const newLog = {
      log_id: newLogId,
      asset_id: assetId,
      recorded_at: new Date().toISOString(),
      metric_name: metricName,
      metric_value: metricVal
    };

    DB.telemetry.push(newLog);

    // Recalculate target asset health score based on the new reading
    updateAssetHealthCbm(assetId, metricName, metricVal);

    DB.saveAll();
    
    // Log audit event
    const username = Auth.getCurrentUser()?.username || "unknown";
    DB.logAudit(username, `Trigger trg_Audit_NhatKy: Ghi nhận dữ liệu đo cảm biến ${metricName} = ${metricVal} cho thiết bị ${assetId}.`, "trg_Audit_NhatKy");

    showToast("Ghi nhận nhật ký", `Đã đẩy dữ liệu đo cảm biến ${newLogId} lên SQL Server.`, "success");
    document.getElementById("form-telemetry-input").reset();
    
    // Refresh CBM views
    checkCbmSensorViolations();
    renderTelemetryTable();
    updateCbmChart();
  } catch (err) {
    warningDiv.textContent = err.message;
    warningDiv.style.display = "flex";
  }
}

/**
 * Recalculates asset health score based on sensor reading
 */
function updateAssetHealthCbm(assetId, metricName, metricVal) {
  const asset = DB.assets.find(a => a.asset_id === assetId);
  if (!asset) return;

  const standard = DB.standards.find(s => s.type_id === asset.type_id && s.metric_name === metricName);
  if (!standard) return;

  let newHealth = asset.health_score;

  if (metricVal >= standard.critical_limit) {
    // Drop health score immediately
    newHealth = Math.min(newHealth, 0.35); 
    asset.status = 'Ngừng hoạt động';
    
    // Log critical warning trigger
    DB.logAudit("SYSTEM", `Trigger trg_CanhBaoNhietDo: Kích hoạt cảnh báo Đỏ ${metricName === 'NhietDo' ? 'nhiệt độ' : 'điện áp'} thiết bị ${assetId} đạt ${metricVal} ${metricName === 'NhietDo' ? '°C' : 'V'}.`, "trg_CanhBaoNhietDo");

    // Auto-create a high-priority work order recommendation from AI
    const hasPrediction = DB.predictions.some(p => p.asset_id === assetId);
    if (!hasPrediction) {
      const predId = 'AI_' + String(DB.predictions.length + 1).padStart(3, '0');
      const metricLabel = metricName === 'NhietDo' ? 'Nhiệt độ' : 'Điện áp';
      const metricUnit = metricName === 'NhietDo' ? '°C' : 'V';
      DB.predictions.push({
        prediction_id: predId,
        asset_id: assetId,
        prediction_date: new Date().toISOString().split('T')[0],
        failure_probability: 0.95,
        recommended_action: `Cảnh báo Đỏ - Đo vượt ngưỡng cảm biến ${metricLabel}: ${metricVal}${metricUnit}. Lập tức cô lập và gửi nhân viên kỹ thuật hiện trường.`
      });
    }
  } else if (metricVal >= standard.warning_limit) {
    newHealth = Math.min(newHealth, 0.65);
    if (asset.status === 'Đang vận hành') asset.status = 'Cảnh báo';
    
    // Log warning trigger
    DB.logAudit("SYSTEM", `Trigger trg_Audit_NhatKy: Thiết bị ${assetId} ghi nhận ${metricName === 'NhietDo' ? 'nhiệt độ' : 'điện áp'} ${metricVal} (Cảnh báo Vàng).`, "trg_Audit_NhatKy");
  } else {
    // Normal level restores health slightly if it was low but not in outage
    if (asset.status !== 'Ngừng hoạt động' && asset.status !== 'Cảnh báo') {
      newHealth = Math.min(1.0, newHealth + 0.05);
    }
  }

  asset.health_score = newHealth;
}

// --- MODULE 6: WORK ORDERS & CONSTRAINTS ---
function populateWorkOrderAssetOptions() {
  const select = document.getElementById("wo-form-asset");
  if (!select) return;
  
  const activeAssets = DB.assets.filter(a => a.status !== 'Thanh lý');
  select.innerHTML = `<option value="" disabled selected>Chọn thiết bị cần bảo trì...</option>` +
    activeAssets.map(a => `<option value="${a.asset_id}">${a.asset_id} (${a.asset_name})</option>`).join('');
}

function renderPredictionsTable() {
  const tbody = document.getElementById("predictions-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const preds = DB.predictions;
  if (preds.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-success);font-weight:600;">Hệ thống tối ưu, không có khuyến nghị sự cố khẩn cấp.</td></tr>`;
    return;
  }

  preds.forEach(p => {
    const asset = DB.assets.find(a => a.asset_id === p.asset_id) || {};
    const percent = Math.round(p.failure_probability * 100);

    const tr = document.createElement("tr");
    tr.style.backgroundColor = "rgba(255, 59, 48, 0.03)";

    tr.innerHTML = `
      <td><strong style="color:var(--evn-primary);cursor:pointer;" onclick="openAssetDrawer('${p.asset_id}')">${p.asset_id}</strong></td>
      <td><span style="font-weight:bold; color:var(--evn-accent);">${percent}%</span></td>
      <td style="font-size:12.5px;">${p.recommended_action}</td>
      <td>${p.prediction_date}</td>
      <td style="text-align:right;">
        <button class="btn btn-primary btn-small" onclick="handleAutoCreateWO('${p.asset_id}', '${p.recommended_action.replace(/'/g, "\\'")}')">Lập lệnh ngay</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function handleAutoCreateWO(assetId, recommendation) {
  openWorkOrderForm();
  document.getElementById("wo-form-asset").value = assetId;
  document.getElementById("wo-form-type").value = "Sửa chữa đột xuất";
  document.getElementById("wo-form-desc").value = recommendation;
  document.getElementById("wo-form-date").value = new Date().toISOString().split('T')[0];
  document.getElementById("wo-form-cost").value = 15000000; // default estimated
}

function renderWorkOrdersTable() {
  const tbody = document.getElementById("workorders-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filterSelect = document.getElementById("wo-filter-status");
  const filterStatus = filterSelect ? filterSelect.value : "";

  let filteredWOs = DB.workOrders;
  if (filterStatus) {
    filteredWOs = filteredWOs.filter(w => w.wo_status === filterStatus);
  } else {
    // Default show only open tickets
    filteredWOs = filteredWOs.filter(w => w.wo_status !== 'Đã đóng');
  }
  
  if (filteredWOs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);">Không có lệnh công tác bảo trì nào khớp bộ lọc.</td></tr>`;
    return;
  }

  const currentUser = Auth.getCurrentUser();
  const isTechnician = currentUser && currentUser.role_id === 'technician';
  const isManager = currentUser && currentUser.role_id === 'manager';

  filteredWOs.forEach(wo => {
    let statusClass = "badge-info";
    if (wo.wo_status === "Đang xử lý") statusClass = "badge-warning";
    else if (wo.wo_status === "Đã đóng") statusClass = "badge-success";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${wo.wo_id}</strong></td>
      <td><strong style="color:var(--evn-primary);cursor:pointer;" onclick="openAssetDrawer('${wo.asset_id}')">${wo.asset_id}</strong></td>
      <td>${wo.wo_type}</td>
      <td style="font-size:12px; max-width:320px; word-break:break-word;">${wo.issue_desc}</td>
      <td>${wo.start_date}</td>
      <td>${wo.cost.toLocaleString('vi-VN')} VND</td>
      <td><span class="badge ${statusClass}">${wo.wo_status}</span></td>
      <td style="text-align:right;">
        <!-- Technician can close tickets. Manager can approve. -->
        ${(wo.wo_status === 'Chờ duyệt' && isManager) ? `<button class="btn btn-primary btn-small" onclick="handleApproveWO('${wo.wo_id}')">Duyệt lệnh</button>` : ''}
        ${(wo.wo_status === 'Đang xử lý' && isTechnician) ? `<button class="btn btn-success btn-small" onclick="handleCloseWO('${wo.wo_id}')">Đóng phiếu <span class="db-badge" style="background:rgba(255,255,255,0.15);color:#FFF;border-color:transparent;margin-left:4px;">[⚙️ sp_DongPhieuBaoTri]</span></button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function handleApproveWO(woId) {
  const wo = DB.workOrders.find(w => w.wo_id === woId);
  if (wo) {
    wo.wo_status = 'Đang xử lý';
    DB.saveAll();
    
    // Log audit event
    const username = Auth.getCurrentUser()?.username || "unknown";
    DB.logAudit(username, `Trigger trg_Check_QuyenXetDuyet: Phê duyệt lệnh công tác ${woId} cho thiết bị ${wo.asset_id}.`, "trg_Check_QuyenXetDuyet");

    showToast("Phê duyệt lệnh", `Đã phê duyệt lệnh ${woId}. Trạng thái chuyển sang Đang xử lý.`, "success");
    renderWorkOrdersTable();
  }
}

function handleCloseWO(woId) {
  if (confirm(`Đồng chí xác nhận đã hoàn tất sửa chữa cơ khí thiết bị và yêu cầu chạy thử nghiệm phục hồi?\nHành động này sẽ đóng phiếu ${woId} và đặt Sức khỏe thiết bị về 100%.`)) {
    try {
      const wo = DB.workOrders.find(w => w.wo_id === woId);
      const assetId = wo ? wo.asset_id : '';

      // Execute sp_DongPhieuBaoTri which runs transaction logic
      const result = DB.sp_DongPhieuBaoTri(woId);
      
      // Log audit event
      const username = Auth.getCurrentUser()?.username || "unknown";
      DB.logAudit(username, `Stored Procedure sp_DongPhieuBaoTri: Khôi phục thiết bị ${assetId} (Thiết bị khôi phục 100% sức khỏe). [Transaction: Commit]`, "sp_DongPhieuBaoTri");

      showToast("Khôi phục thiết bị", result.message, "success");
      
      // Update charts & tables
      renderWorkOrdersTable();
      checkCbmSensorViolations();
    } catch (err) {
      showToast("Lỗi giao dịch SQL", err.message, "danger");
    }
  }
}

function openWorkOrderForm() {
  document.getElementById("wo-form-card").style.display = "block";
  document.getElementById("form-workorder-input").reset();
  document.getElementById("wo-form-error").style.display = "none";
  document.getElementById("wo-form-char-count").textContent = "0 / 2000 ký tự";
  
  // Auto set today date
  document.getElementById("wo-form-date").value = new Date().toISOString().split('T')[0];

  document.getElementById("wo-form-card").scrollIntoView({ behavior: 'smooth' });
}

function closeWorkOrderForm() {
  document.getElementById("wo-form-card").style.display = "none";
}

function handleWorkOrderSubmit(event) {
  event.preventDefault();
  
  const assetId = document.getElementById("wo-form-asset").value;
  const woType = document.getElementById("wo-form-type").value;
  const startDate = document.getElementById("wo-form-date").value;
  const costVal = parseInt(document.getElementById("wo-form-cost").value);
  const descVal = document.getElementById("wo-form-desc").value.trim();
  const errorDiv = document.getElementById("wo-form-error");

  try {
    errorDiv.style.display = "none";

    // 1. Simulate SQL Trigger: trg_Limit_PhieuMo (fails if >= 3 open tickets)
    DB.trg_Limit_PhieuMo(assetId);

    // Check description limit length
    if (descVal.length > 2000) {
      throw new Error("Lỗi: Trường mô tả chi tiết sự cố vượt giới hạn 2000 ký tự.");
    }

    const newWoId = 'WO-2026-' + String(DB.workOrders.length + 1).padStart(3, '0');
    const newWo = {
      wo_id: newWoId,
      asset_id: assetId,
      wo_type: woType,
      issue_desc: descVal,
      start_date: startDate,
      wo_status: 'Chờ duyệt', // initially pending approval
      cost: costVal,
      closed_at: null
    };

    DB.workOrders.push(newWo);
    
    // Automatically set asset status to Maintenance/Outage if not already
    const asset = DB.assets.find(a => a.asset_id === assetId);
    if (asset && asset.status === 'Hoạt động') {
      asset.status = 'Bảo trì';
    }

    DB.saveAll();

    // Log audit event
    const username = Auth.getCurrentUser()?.username || "unknown";
    DB.logAudit(username, `Trigger trg_Limit_PhieuMo: Tạo mới phiếu bảo trì ${newWoId} cho thiết bị ${assetId}.`, "trg_Limit_PhieuMo");

    showToast("Tạo phiếu thành công", `Lệnh công tác ${newWoId} đã được ghi nhận trên SQL Server. Chờ Trưởng phòng phê duyệt.`, "success");
    closeWorkOrderForm();
    renderWorkOrdersTable();
  } catch (err) {
    if (err.message.includes("trg_Limit_PhieuMo")) {
      errorDiv.textContent = err.message;
      errorDiv.style.display = "flex";
      showToast("Lỗi Ràng Buộc Trigger", "Số lượng phiếu chưa đóng vượt giới hạn an toàn cho phép.", "danger");
    } else {
      showToast("Lỗi nghiệp vụ SQL", err.message, "danger");
    }
  }
}

// --- MODULE 7: BÁO CÁO & EXPORTS (REPORTS) ---
function renderClosedWorkOrdersTable() {
  const tbody = document.getElementById("closed-wo-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  // Get completed tickets
  const closed = DB.workOrders.filter(w => w.wo_status === 'Đã đóng');
  
  if (closed.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);">Không có hồ sơ bảo trì nào đã đóng.</td></tr>`;
    return;
  }

  closed.forEach(wo => {
    const asset = DB.assets.find(a => a.asset_id === wo.asset_id) || {};
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${wo.wo_id}</strong></td>
      <td><strong style="color:var(--evn-primary);cursor:pointer;" onclick="openAssetDrawer('${wo.asset_id}')">${wo.asset_id}</strong></td>
      <td>${wo.wo_type}</td>
      <td style="font-size:12.5px; max-width:350px; word-break:break-word;">${wo.issue_desc}</td>
      <td>${wo.start_date}</td>
      <td>${wo.closed_at || '-'}</td>
      <td style="font-weight:600; color:var(--evn-primary-dark);">${wo.cost.toLocaleString('vi-VN')} VND</td>
      <td><span class="badge badge-success">${wo.wo_status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * EXPORT CSV - vw_HoSo_TaiSan_DayDu Export to BaoCao_HoSo_TaiSan.csv
 * Conforms to requested download structure.
 */
function exportDataToCSV() {
  const data = DB.vw_HoSo_TaiSan_DayDu;
  if (!data || data.length === 0) {
    showToast("Xuất dữ liệu", "Không có thông tin tài sản hợp lệ để xuất.", "danger");
    return;
  }

  // Define headers representing our full asset portfolio view structure
  const headers = ["Mã Tài Sản (asset_id)", "Tên Thiết Bị", "Phân Loại", "Trạm Vận Hành", "Ngày Lắp Đặt", "Sức Khỏe (%)", "Trạng Thái", "Thông Số Kỹ Thuật (XML)"];
  
  const csvRows = [headers.join(",")];

  data.forEach(item => {
    const row = [
      `"${item.asset_id}"`,
      `"${item.asset_name.replace(/"/g, '""')}"`,
      `"${item.type_name}"`,
      `"${item.substation_name}"`,
      `"${item.install_date}"`,
      `"${item.health_score}"`,
      `"${item.status}"`,
      `"${item.technical_specs.replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(","));
  });

  const csvContent = "\uFEFF" + csvRows.join("\n"); // Add UTF-8 BOM for Microsoft Excel Vietnamese language compatibility
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `BaoCao_HoSo_TaiSan_Thang5.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Xuất báo cáo", "Đã tải xuống tệp dữ liệu BaoCao_HoSo_TaiSan_Thang5.csv thành công.", "success");
}

// --- MODULE 8: HELP CENTER ACCORDION ---
function toggleAccordion(element) {
  const item = element.closest(".accordion-item");
  const isActive = item.classList.contains("active");
  
  // Close all other accordions
  const allItems = document.querySelectorAll(".accordion-item");
  allItems.forEach(i => i.classList.remove("active"));

  if (!isActive) {
    item.classList.add("active");
  }
}

// --- GLOBAL TOAST SYSTEM ---
function showToast(title, message, type = 'primary') {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let iconSVG = "";
  if (type === 'success') {
    iconSVG = `<svg class="toast-icon success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  } else if (type === 'danger') {
    iconSVG = `<svg class="toast-icon danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
  } else {
    iconSVG = `<svg class="toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  }

  toast.innerHTML = `
    ${iconSVG}
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  // Auto remove after 4.5 seconds
  setTimeout(() => {
    toast.style.animation = "slideUp 0.3s ease reverse";
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 280);
  }, 4500);
}

// Export specific functions to window scope for HTML bindings
window.switchAuthTab = switchAuthTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.quickLogin = quickLogin;
window.handleLogout = handleLogout;
window.switchView = switchView;
window.toggleAccordion = toggleAccordion;
window.openAssetDrawer = openAssetDrawer;
window.closeAssetDrawer = closeAssetDrawer;
window.openAssetForm = openAssetForm;
window.closeAssetForm = closeAssetForm;
window.addXmlSpecRow = addXmlSpecRow;
window.removeXmlSpecRow = removeXmlSpecRow;
window.updateXmlSpecKey = updateXmlSpecKey;
window.updateXmlSpecValue = updateXmlSpecValue;
window.handleAssetSubmit = handleAssetSubmit;
window.handleSoftDeleteAsset = handleSoftDeleteAsset;
window.switchCbmMetric = switchCbmMetric;
window.updateCbmChart = updateCbmChart;
window.handleTelemetrySubmit = handleTelemetrySubmit;
window.openWorkOrderForm = openWorkOrderForm;
window.closeWorkOrderForm = closeWorkOrderForm;
window.handleWorkOrderSubmit = handleWorkOrderSubmit;
window.handleApproveWO = handleApproveWO;
window.handleCloseWO = handleCloseWO;
window.handleSearchInput = handleSearchInput;
window.handleSearchKey = handleSearchKey;
window.selectSearchResult = selectSearchResult;
window.toggleNotificationsDropdown = toggleNotificationsDropdown;
window.clearAllNotifications = clearAllNotifications;
window.exportDataToCSV = exportDataToCSV;
window.showToast = showToast;
window.toggleXmlAccordion = toggleXmlAccordion;
window.toggleProfilePopover = toggleProfilePopover;
window.showProfileSettings = showProfileSettings;
window.showSystemSettings = showSystemSettings;
window.showRolePermissionsManagement = showRolePermissionsManagement;
window.scrollAuditLogsIntoView = scrollAuditLogsIntoView;

// --- MODULE 9: HELP CENTER & IT TICKET SYSTEM ---
function filterHelpFAQs(query) {
  const cleanQuery = query.toLowerCase().trim();
  const faqItems = document.querySelectorAll(".help-faq-item");
  
  faqItems.forEach(item => {
    const questionText = item.querySelector(".faq-question").textContent.toLowerCase();
    const contentText = item.querySelector(".accordion-content").textContent.toLowerCase();
    
    if (questionText.includes(cleanQuery) || contentText.includes(cleanQuery)) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

function handleHelpTicketSubmit(event) {
  event.preventDefault();
  
  const priority = document.getElementById("ticket-priority").value;
  const description = document.getElementById("ticket-description").value.trim();
  
  if (!description) {
    showToast("Lỗi nhập liệu", "Vui lòng nhập mô tả sự cố kỹ thuật.", "danger");
    return;
  }
  
  try {
    const currentUser = Auth.getCurrentUser();
    const username = currentUser ? currentUser.username : "guest";
    
    // Log audit event to DB
    DB.logAudit(
      username, 
      `Ticket hỗ trợ SCADA (${priority}): ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`, 
      "IT_Helpdesk"
    );
    
    showToast(
      "Gửi Ticket thành công", 
      "Ticket hỗ trợ đã được chuyển tới kỹ sư SCADA trực ban.", 
      "success"
    );
    
    // Reset form
    document.getElementById("help-ticket-form").reset();
  } catch (err) {
    showToast("Lỗi gửi Ticket", err.message, "danger");
  }
}

window.filterHelpFAQs = filterHelpFAQs;
window.handleHelpTicketSubmit = handleHelpTicketSubmit;

function toggleHelpDrawer(event) {
  if (event) event.stopPropagation();
  const drawer = document.getElementById("help-drawer");
  const backdrop = document.getElementById("help-drawer-backdrop");
  if (drawer && backdrop) {
    drawer.classList.toggle("active");
    backdrop.classList.toggle("active");
  }
}

function closeHelpDrawer() {
  const drawer = document.getElementById("help-drawer");
  const backdrop = document.getElementById("help-drawer-backdrop");
  if (drawer && backdrop) {
    drawer.classList.remove("active");
    backdrop.classList.remove("active");
  }
}

window.toggleHelpDrawer = toggleHelpDrawer;
window.closeHelpDrawer = closeHelpDrawer;

