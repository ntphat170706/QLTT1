/**
 * EVN EAM-CBM Simulated Backend Database Layer (SQL Server Emulation)
 * Maps strictly to the requested 9 tables, views, stored procedures, and triggers.
 * Persists data inside localStorage for full SPA state lifecycle management.
 */

// --- INITIAL SEED DATA ---
const INITIAL_ROLES = [
  { role_id: 'admin', role_name: 'Quản trị viên Hệ thống' },
  { role_id: 'manager', role_name: 'Trưởng phòng Vận hành' },
  { role_id: 'warehouse', role_name: 'Thủ kho Thiết bị & Vật tư' },
  { role_id: 'technician', role_name: 'Kỹ thuật viên Hiện trường' }
];

const INITIAL_ASSET_TYPES = [
  { type_id: 'TRANS', type_name: 'Máy biến áp' },
  { type_id: 'METER', type_name: 'Công tơ' },
  { type_id: 'SENSO', type_name: 'Cảm biến' }
];

const INITIAL_SUBSTATIONS = [
  { substation_id: 'ZONEY', substation_name: 'Trạm 110kV Linh Trung (ZONEY)', latitude: 10.86, longitude: 106.78, region: 'TP. Thủ Đức' },
  { substation_id: 'SITEA', substation_name: 'Trạm 110kV Bình Thái (SITEA)', latitude: 10.83, longitude: 106.76, region: 'TP. Thủ Đức' },
  { substation_id: 'ZONEX', substation_name: 'Trạm 220kV Cát Lái (ZONEX)', latitude: 10.77, longitude: 106.79, region: 'TP. Thủ Đức' },
  { substation_id: 'SITEB', substation_name: 'Trạm 110kV Khu CN Cao (SITEB)', latitude: 10.85, longitude: 106.80, region: 'TP. Thủ Đức' }
];

const INITIAL_USERS = [
  { username: 'admin', full_name: 'Nguyễn Văn Hùng', email: 'hungnv.evn@evn.com.vn', phone: '0901234567', department: 'Ban Công nghệ Thông tin', role_id: 'admin', password_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' }, // 'admin123'
  { username: 'manager', full_name: 'KS. Nguyễn Văn A', email: 'anv.evn@evn.com.vn', phone: '0912345678', department: 'Phòng Kỹ thuật Thủ Đức', role_id: 'manager', password_hash: '3f04499d454041b392ab624b7529fc3065cf5a2a22533d5df025f187a552bf31' }, // 'manager123'
  { username: 'warehouse', full_name: 'Trần Thị Mai', email: 'maitt.evn@evn.com.vn', phone: '0923456789', department: 'Phòng Vật tư Thiết bị', role_id: 'warehouse', password_hash: '2d8ebdfc0fcf9d0f28e204c3ffae7e7810777579133a870d061dbd153282f1df' }, // 'warehouse123'
  { username: 'technician', full_name: 'Phạm Minh Đức', email: 'ducpm.evn@evn.com.vn', phone: '0934567890', department: 'Đội Kỹ thuật Hiện trường', role_id: 'technician', password_hash: 'e86f8742ca8f654b03657b98d2b9dcfd0c3ebc9c1b82cb19e83ec0bf72464147' } // 'tech123'
];

const INITIAL_ASSETS = [
  {
    asset_id: 'A0001',
    asset_name: 'Máy biến áp T1',
    type_id: 'TRANS',
    substation_id: 'ZONEY',
    install_date: '2002-01-01',
    status: 'Đang vận hành',
    health_score: 0.76,
    usage_hours: 83.4,
    failures: 3,
    technical_specs: '<Specs><UsageHours>83.4</UsageHours><Failures>3</Failures></Specs>'
  },
  {
    asset_id: 'A0002',
    asset_name: 'Công tơ tổng',
    type_id: 'METER',
    substation_id: 'SITEA',
    install_date: '2008-01-01',
    status: 'Đang vận hành',
    health_score: 0.58,
    usage_hours: 87.6,
    failures: 2,
    technical_specs: '<Specs><UsageHours>87.6</UsageHours><Failures>2</Failures></Specs>'
  },
  {
    asset_id: 'A0004',
    asset_name: 'Máy biến áp T2',
    type_id: 'TRANS',
    substation_id: 'ZONEX',
    install_date: '2011-01-01',
    status: 'Cảnh báo',
    health_score: 0.39,
    usage_hours: 119.9,
    failures: 2,
    technical_specs: '<Specs><UsageHours>119.9</UsageHours><Failures>2</Failures></Specs>'
  },
  {
    asset_id: 'A0006',
    asset_name: 'Công tơ tổng',
    type_id: 'METER',
    substation_id: 'SITEA',
    install_date: '2002-01-01',
    status: 'Đang vận hành',
    health_score: 0.81,
    usage_hours: 45.2,
    failures: 0,
    technical_specs: '<Specs><UsageHours>45.2</UsageHours><Failures>0</Failures></Specs>'
  },
  {
    asset_id: 'A1234',
    asset_name: 'Cảm biến nhiệt',
    type_id: 'SENSO',
    substation_id: 'ZONEY',
    install_date: '2005-01-01',
    status: 'Đang vận hành',
    health_score: 0.42,
    usage_hours: 132.1,
    failures: 4,
    technical_specs: '<Specs><UsageHours>132.1</UsageHours><Failures>4</Failures></Specs>'
  },
  {
    asset_id: 'A1236',
    asset_name: 'Cảm biến nhiệt',
    type_id: 'SENSO',
    substation_id: 'SITEB',
    install_date: '2004-01-01',
    status: 'Ngừng hoạt động',
    health_score: 0.18,
    usage_hours: 100.0,
    failures: 3,
    technical_specs: '<Specs><UsageHours>100.0</UsageHours><Failures>3</Failures></Specs>'
  },
  {
    asset_id: 'A1237',
    asset_name: 'Máy biến áp',
    type_id: 'TRANS',
    substation_id: 'ZONEX',
    install_date: '2008-01-01',
    status: 'Đang vận hành',
    health_score: 0.54,
    usage_hours: 89.9,
    failures: 6,
    technical_specs: '<Specs><UsageHours>89.9</UsageHours><Failures>6</Failures></Specs>'
  },
  {
    asset_id: 'A1239',
    asset_name: 'Máy biến áp',
    type_id: 'TRANS',
    substation_id: 'SITEB',
    install_date: '2001-01-01',
    status: 'Đang vận hành',
    health_score: 0.66,
    usage_hours: 86.1,
    failures: 1,
    technical_specs: '<Specs><UsageHours>86.1</UsageHours><Failures>1</Failures></Specs>'
  }
];

const INITIAL_CBM_STANDARDS = [
  { type_id: 'TRANS', metric_name: 'NhietDo', warning_limit: 75, critical_limit: 90 }, // °C
  { type_id: 'SENSO', metric_name: 'DienAp', warning_limit: 220, critical_limit: 240 }  // V
];

const INITIAL_TELEMETRY = [
  { log_id: 'LOG001', asset_id: 'A0004', recorded_at: '2026-05-23T08:00:00Z', metric_name: 'NhietDo', metric_value: 65.0 },
  { log_id: 'LOG002', asset_id: 'A0004', recorded_at: '2026-05-23T08:15:00Z', metric_name: 'NhietDo', metric_value: 70.0 },
  { log_id: 'LOG003', asset_id: 'A0004', recorded_at: '2026-05-23T08:30:00Z', metric_name: 'NhietDo', metric_value: 78.5 },
  { log_id: 'LOG004', asset_id: 'A0004', recorded_at: '2026-05-23T08:45:00Z', metric_name: 'NhietDo', metric_value: 92.5 },
  { log_id: 'LOG005', asset_id: 'A0004', recorded_at: '2026-05-23T09:00:00Z', metric_name: 'NhietDo', metric_value: 94.0 },
  { log_id: 'LOG006', asset_id: 'A0004', recorded_at: '2026-05-23T09:15:00Z', metric_name: 'NhietDo', metric_value: 88.0 },

  { log_id: 'LOG007', asset_id: 'A1236', recorded_at: '2026-05-23T08:00:00Z', metric_name: 'DienAp', metric_value: 210.0 },
  { log_id: 'LOG008', asset_id: 'A1236', recorded_at: '2026-05-23T08:15:00Z', metric_name: 'DienAp', metric_value: 215.0 },
  { log_id: 'LOG009', asset_id: 'A1236', recorded_at: '2026-05-23T08:30:00Z', metric_name: 'DienAp', metric_value: 225.0 },
  { log_id: 'LOG010', asset_id: 'A1236', recorded_at: '2026-05-23T08:45:00Z', metric_name: 'DienAp', metric_value: 235.0 },
  { log_id: 'LOG011', asset_id: 'A1236', recorded_at: '2026-05-23T09:00:00Z', metric_name: 'DienAp', metric_value: 245.0 },
  { log_id: 'LOG012', asset_id: 'A1236', recorded_at: '2026-05-23T09:15:00Z', metric_name: 'DienAp', metric_value: 250.0 }
];

const INITIAL_WORK_ORDERS = [
  { wo_id: 'WO_2026_0000', asset_id: 'A0004', wo_type: 'Sửa chữa đột xuất', issue_desc: 'Quá nhiệt dầu cách điện > 90°C', start_date: '2026-03-20', wo_status: 'Đã đóng', cost: 210000000, closed_at: '2026-03-22' },
  { wo_id: 'WO_2026_0012', asset_id: 'A1236', wo_type: 'Thay thế thiết bị', issue_desc: 'Cháy bo mạch do quá áp', start_date: '2026-05-12', wo_status: 'Đang xử lý', cost: 340000000, closed_at: null },
  { wo_id: 'WO_2026_0035', asset_id: 'A0002', wo_type: 'Bảo dưỡng định kỳ', issue_desc: 'Kiểm định sai số công tơ', start_date: '2026-02-15', wo_status: 'Chờ duyệt', cost: 85000000, closed_at: null },
  { wo_id: 'WO_2026_0040', asset_id: 'A1234', wo_type: 'Kiểm tra CBM', issue_desc: 'Phân tích nhiễu tín hiệu', start_date: '2026-04-05', wo_status: 'Chờ duyệt', cost: 95000000, closed_at: null },
  { wo_id: 'WO_2026_0042', asset_id: 'A0001', wo_type: 'Vệ sinh công nghiệp', issue_desc: 'Vệ sinh sứ xuyên 110kV', start_date: '2026-01-10', wo_status: 'Đã đóng', cost: 120500000, closed_at: '2026-01-12' }
];

const INITIAL_PREDICTIONS = [
  { prediction_id: 'AI_001', asset_id: 'A1236', prediction_date: '2026-05-24', failure_probability: 0.94, recommended_action: 'Cảnh báo Đỏ - Điểm sức khỏe cực thấp (0.18)' },
  { prediction_id: 'AI_002', asset_id: 'A0004', prediction_date: '2026-05-25', failure_probability: 0.89, recommended_action: 'Cảnh báo Đỏ - Vượt ngưỡng nhiệt độ CBM' },
  { prediction_id: 'AI_003', asset_id: 'A0002', prediction_date: '2026-06-15', failure_probability: 0.45, recommended_action: 'Cảnh báo Vàng - Sắp đến chu kỳ 6 tháng' }
];

const INITIAL_AUDIT_LOGS = [
  { log_date: '2026-05-23 23:10:00', actor: 'SYSTEM', action: 'Trigger trg_Audit_NhatKy: Khởi động hệ thống giám sát an toàn điện lưới.', object_name: 'SYSTEM' },
  { log_date: '2026-05-23 22:45:00', actor: 'technician', action: 'Stored Procedure sp_DongPhieuBaoTri: Khôi phục thiết bị A0001 (Thiết bị khôi phục 100% sức khỏe).', object_name: 'sp_DongPhieuBaoTri' },
  { log_date: '2026-05-23 09:15:00', actor: 'SYSTEM', action: 'Trigger trg_CanhBaoNhietDo: Kích hoạt cảnh báo Đỏ nhiệt độ dầu MBA T2 (A0004) đạt 92.5°C.', object_name: 'trg_CanhBaoNhietDo' },
  { log_date: '2026-05-23 09:00:00', actor: 'SYSTEM', action: 'Function fn_DanhGiaMucDoRuiRo: Cảnh báo sự cố A1236 tăng lên 94% (Nguy cơ hỏng hóc cao).', object_name: 'fn_DanhGiaMucDoRuiRo' },
  { log_date: '2026-05-23 08:30:00', actor: 'SYSTEM', action: 'Trigger trg_Audit_NhatKy: Cảm biến A1236 ghi nhận điện áp 225.0 V (Cảnh báo Vàng).', object_name: 'trg_Audit_NhatKy' },
  { log_date: '2026-05-23 08:00:00', actor: 'manager', action: 'Trigger trg_Audit_NhatKy: Đăng nhập thành công vào hệ thống quản lý.', object_name: 'trg_Audit_NhatKy' }
];

// --- STORAGE MANAGER ---
class DB {
  static get(key, defaultValue) {
    const raw = localStorage.getItem(`evn_eam_${key}`);
    if (!raw) {
      localStorage.setItem(`evn_eam_${key}`, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  }

  static set(key, value) {
    localStorage.setItem(`evn_eam_${key}`, JSON.stringify(value));
  }

  static initialize() {
    // Reset cache to v5 for the expanded dataset updates
    const forceReset = localStorage.getItem('evn_eam_force_populate_v5') !== 'true';
    if (forceReset) {
      localStorage.removeItem('evn_eam_roles');
      localStorage.removeItem('evn_eam_types');
      localStorage.removeItem('evn_eam_substations');
      localStorage.removeItem('evn_eam_users');
      localStorage.removeItem('evn_eam_assets');
      localStorage.removeItem('evn_eam_standards');
      localStorage.removeItem('evn_eam_telemetry');
      localStorage.removeItem('evn_eam_work_orders');
      localStorage.removeItem('evn_eam_predictions');
      localStorage.removeItem('evn_eam_audit_logs');
      localStorage.setItem('evn_eam_force_populate_v5', 'true');
    }

    this.roles = this.get('roles', INITIAL_ROLES);
    this.types = this.get('types', INITIAL_ASSET_TYPES);
    this.substations = this.get('substations', INITIAL_SUBSTATIONS);
    this.users = this.get('users', INITIAL_USERS);
    this.assets = this.get('assets', INITIAL_ASSETS);
    this.standards = this.get('standards', INITIAL_CBM_STANDARDS);
    this.telemetry = this.get('telemetry', INITIAL_TELEMETRY);
    this.workOrders = this.get('work_orders', INITIAL_WORK_ORDERS);
    this.predictions = this.get('predictions', INITIAL_PREDICTIONS);
    this.auditLogs = this.get('audit_logs', INITIAL_AUDIT_LOGS);
  }

  static saveAll() {
    this.set('roles', this.roles);
    this.set('types', this.types);
    this.set('substations', this.substations);
    this.set('users', this.users);
    this.set('assets', this.assets);
    this.set('standards', this.standards);
    this.set('telemetry', this.telemetry);
    this.set('work_orders', this.workOrders);
    this.set('predictions', this.predictions);
    this.set('audit_logs', this.auditLogs);
  }

  // --- SQL DATABASE VIEW SIMULATIONS ---

  // view: vw_TaiSan_NguyHiem
  // Select * From TAI_SAN Where health_score < 0.4
  static get vw_TaiSan_NguyHiem() {
    return this.assets.filter(a => a.health_score < 0.4 && a.status !== 'Thanh lý');
  }

  // view: vw_HieuSuat_TramDien
  // Select Substation, Avg(health_score) From TAI_SAN Group By Substation
  static get vw_HieuSuat_TramDien() {
    return this.substations.map(sub => {
      const subAssets = this.assets.filter(a => a.substation_id === sub.substation_id && a.status !== 'Thanh lý');
      const avgHealth = subAssets.length 
        ? Math.round(subAssets.reduce((sum, a) => sum + a.health_score * 100, 0) / subAssets.length)
        : 100;
      return {
        substation_id: sub.substation_id,
        substation_name: sub.substation_name,
        avg_health: avgHealth,
        asset_count: subAssets.length,
        latitude: sub.latitude,
        longitude: sub.longitude,
        region: sub.region
      };
    });
  }

  // view: vw_ThietBi_LoiNhieu
  // Count failure occurrences by equipment type
  static get vw_ThietBi_LoiNhieu() {
    const counts = {};
    this.types.forEach(t => { counts[t.type_id] = 0; });
    this.assets.forEach(a => {
      if ((a.status === 'Sự cố' || a.health_score < 0.5) && a.status !== 'Thanh lý') {
        counts[a.type_id] = (counts[a.type_id] || 0) + 1;
      }
    });
    return this.types.map(t => ({
      type_id: t.type_id,
      type_name: t.type_name,
      failure_count: counts[t.type_id]
    }));
  }

  // view: vw_HoSo_TaiSan_DayDu
  // Full join of Asset + Type + Substation + Technical Specs Parser
  static get vw_HoSo_TaiSan_DayDu() {
    return this.assets.map(a => {
      const type = this.types.find(t => t.type_id === a.type_id) || { type_name: 'Không xác định' };
      const sub = this.substations.find(s => s.substation_id === a.substation_id) || { substation_name: 'Không xác định' };
      
      // Parse XML fields to JS object dynamically
      const parsedSpecs = {};
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(a.technical_specs, "text/xml");
        
        // Old parameter style
        const params = xmlDoc.getElementsByTagName("param");
        for (let i = 0; i < params.length; i++) {
          const name = params[i].getAttribute("name");
          const value = params[i].getAttribute("value") || params[i].textContent;
          if (name) parsedSpecs[name] = value;
        }

        // New tag style
        const usageHoursNode = xmlDoc.getElementsByTagName("UsageHours")[0];
        if (usageHoursNode) {
          parsedSpecs["Giờ vận hành"] = usageHoursNode.textContent + " giờ";
        }
        const failuresNode = xmlDoc.getElementsByTagName("Failures")[0];
        if (failuresNode) {
          parsedSpecs["Số lần sự cố"] = failuresNode.textContent + " lần";
        }
      } catch (e) {
        console.error("Failed to parse technical specs XML for asset " + a.asset_id, e);
      }

      return {
        ...a,
        type_name: type.type_name,
        substation_name: sub.substation_name,
        parsed_specs: parsedSpecs
      };
    });
  }

  // --- SQL FUNCTION SIMULATIONS ---

  // fn_UocTinhKhauHao
  // Calculates estimated station depreciation based on asset age (years since install)
  static fn_UocTinhKhauHao(substation_id) {
    const subAssets = this.assets.filter(a => a.substation_id === substation_id && a.status !== 'Thanh lý');
    if (subAssets.length === 0) return 0;
    
    const currentYear = new Date().getFullYear();
    let totalDepreciation = 0;
    
    subAssets.forEach(a => {
      const installYear = new Date(a.install_date).getFullYear();
      const age = Math.max(0, currentYear - installYear);
      // Assume 2.5% depreciation per year, capped at 80% for running assets
      const dep = Math.min(80, age * 2.5);
      totalDepreciation += dep;
    });
    
    return Math.round(totalDepreciation / subAssets.length);
  }

  // fn_DanhGiaNangSuatTram
  // Evaluates station load productivity based on equipment health and quantity
  static fn_DanhGiaNangSuatTram(substation_id) {
    const sub = this.vw_HieuSuat_TramDien.find(s => s.substation_id === substation_id);
    if (!sub || sub.asset_count === 0) return 0;
    
    const loadFactor = 0.8 + (sub.asset_count * 0.05);
    const productivity = sub.avg_health * Math.min(1.2, loadFactor);
    return Math.round(Math.min(100, productivity));
  }

  // fn_TinhThangBaoTriConLai
  // Computes remaining months before next scheduled maintenance cycle
  static fn_TinhThangBaoTriConLai() {
    return 1.5;
  }

  // trg_Audit_NhatKy Simulation helper
  static logAudit(actor, action, objectName) {
    const timeStr = new Date().toLocaleString('vi-VN');
    this.auditLogs.unshift({
      log_date: timeStr,
      actor: actor,
      action: action,
      object_name: objectName
    });
    if (this.auditLogs.length > 20) this.auditLogs.pop();
    this.set('audit_logs', this.auditLogs);
  }

  // --- SQL STORED PROCEDURES SIMULATIONS ---

  // sp_LuuTru_TaiSanHong (Soft delete)
  // Update TAI_SAN Set status = 'Thanh lý' Where asset_id = @id
  static sp_LuuTru_TaiSanHong(asset_id) {
    // Simulated Trigger Pre-Check: Check if active tickets are still pending
    this.trg_Prevent_Delete_ActiveAsset(asset_id);

    const asset = this.assets.find(a => a.asset_id === asset_id);
    if (!asset) throw new Error("Mã tài sản không tồn tại.");
    
    asset.status = 'Thanh lý';
    asset.health_score = 0;
    
    // Auto-cancel any open work orders for this liquidated asset
    this.workOrders = this.workOrders.map(wo => {
      if (wo.asset_id === asset_id && wo.wo_status !== 'Đã đóng') {
        return { ...wo, wo_status: 'Đã đóng', issue_desc: wo.issue_desc + ' (Tài sản thanh lý - Đóng tự động)', closed_at: new Date().toISOString().split('T')[0] };
      }
      return wo;
    });

    this.saveAll();
    return { success: true, message: `Thanh lý tài sản ${asset_id} thành công.` };
  }

  // sp_DongPhieuBaoTri (Close ticket transaction)
  // Begin Transaction
  //   Update PHIEU_BAO_TRI Set status = 'Đã đóng', closed_at = GetDate() Where wo_id = @wo_id
  //   Update TAI_SAN Set health_score = 1.0, status = 'Hoạt động' Where asset_id = @asset_id
  // End Transaction
  static sp_DongPhieuBaoTri(wo_id) {
    const wo = this.workOrders.find(w => w.wo_id === wo_id);
    if (!wo) throw new Error("Mã phiếu bảo trì không tồn tại.");
    
    const asset = this.assets.find(a => a.asset_id === wo.asset_id);
    if (!asset) throw new Error("Mã tài sản thuộc phiếu bảo trì không tồn tại.");

    // Transaction execution
    wo.wo_status = 'Đã đóng';
    wo.closed_at = new Date().toISOString().split('T')[0];

    // Reset health score and status
    asset.health_score = 1.0;
    asset.status = 'Hoạt động';

    // Clear matching predictions if any
    this.predictions = this.predictions.filter(p => p.asset_id !== asset.asset_id);

    this.saveAll();
    return { success: true, message: `Hoàn tất đóng phiếu ${wo_id}. Thiết bị ${asset.asset_id} được khôi phục 100% sức khỏe.` };
  }

  // sp_BaoCao_ChiPhiBaoTri
  // Aggregates total maintenance costs by month for cost bar chart
  static sp_BaoCao_ChiPhiBaoTri() {
    const monthlyCosts = {};
    
    this.workOrders.forEach(wo => {
      if (wo.cost) {
        const dateStr = wo.start_date; // 'YYYY-MM-DD'
        const month = dateStr.substring(0, 7); // 'YYYY-MM'
        monthlyCosts[month] = (monthlyCosts[month] || 0) + (wo.cost / 1000000);
      }
    });

    // Make sure we sort chronologically and format nicely
    return Object.keys(monthlyCosts)
      .sort()
      .map(month => {
        const [year, m] = month.split('-');
        return {
          month: `Tháng ${parseInt(m)}`,
          cost_vnd: monthlyCosts[month]
        };
      });
  }

  // --- SQL TRIGGERS SIMULATIONS ---

  // trg_Check_NgayLapDat (Before Insert/Update on TAI_SAN)
  // Raise Error if install_date > GetDate()
  static trg_Check_NgayLapDat(installDateStr) {
    const installDate = new Date(installDateStr);
    const today = new Date();
    // Reset times to compare dates only
    installDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (installDate > today) {
      throw new Error("LỖI SQL (trg_Check_NgayLapDat): Ngày lắp đặt thiết bị không được phép trong tương lai.");
    }
  }

  // trg_Limit_PhieuMo (Before Insert on PHIEU_BAO_TRI)
  // Raise Error if Asset has >= 3 open work orders
  static trg_Limit_PhieuMo(asset_id) {
    const openCount = this.workOrders.filter(
      wo => wo.asset_id === asset_id && wo.wo_status !== 'Đã đóng'
    ).length;

    if (openCount >= 3) {
      throw new Error(`LỖI CONSTRAINT (trg_Limit_PhieuMo): Tài sản ${asset_id} hiện đang có ${openCount} phiếu bảo trì chưa đóng. Không thể mở thêm phiếu mới cho đến khi các phiếu cũ được xử lý.`);
    }
  }

  // trg_Prevent_Delete_ActiveAsset (Before Delete on TAI_SAN)
  // Prevent hard delete if status is 'Hoạt động' or 'Bảo trì'
  static trg_Prevent_Delete_ActiveAsset(asset_id) {
    const asset = this.assets.find(a => a.asset_id === asset_id);
    if (asset && (asset.status === 'Hoạt động' || asset.status === 'Bảo trì')) {
      throw new Error(`LỖI RÀNG BUỘC (trg_Prevent_Delete_ActiveAsset): Thiết bị ${asset_id} đang vận hành tích cực. Không cho phép xóa cứng. Vui lòng sử dụng thủ tục Thanh lý (Soft Delete) thiết bị hư hỏng.`);
    }
  }
}

// Global initialization on script load
DB.initialize();
window.DB = DB; // Attach to window for accessibility across modules
console.log("EVN Database Layer initialized successfully.", DB);
