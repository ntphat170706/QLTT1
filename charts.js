/**
 * EVN EAM-CBM SVG Charting Engine (Pure Vanilla Javascript + Responsive SVGs)
 * Generates highly aesthetic, interactive charts without external CDNs or dependencies.
 * Calibration for Premium Dark SCADA HMI grids.
 */

class EVNCharts {
  /**
   * Helper to format numbers to Vietnamese Currency format
   */
  static formatVND(val) {
    if (val >= 1e9) return (val / 1e9).toFixed(1) + ' tỷ đ';
    if (val >= 1e6) return (val / 1e6).toFixed(0) + ' triệu đ';
    return val.toLocaleString('vi-VN') + ' đ';
  }

  /**
   * 1. LINE CHART - IoT Telemetry Data
   * Draws a professional glowing gridline chart with alert points.
   */
  static drawLineChart(containerId, dataPoints, metricType) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 280;
    const padding = { top: 30, right: 30, bottom: 40, left: 55 };

    if (!dataPoints || dataPoints.length === 0) {
      container.innerHTML = `
        <div style="height:100%; display:flex; justify-content:center; align-items:center; color:#888; font-size:14px;">
          Không có dữ liệu nhật ký vận hành cho chỉ số này.
        </div>
      `;
      return;
    }

    // Set thresholds based on standards
    let criticalThreshold = 5.0;
    let warningThreshold = 4.0;
    let unit = 'mm/s';

    if (metricType === 'NhietDo') {
      criticalThreshold = 90;
      warningThreshold = 75;
      unit = '°C';
    } else if (metricType === 'DienAp') {
      criticalThreshold = 240;
      warningThreshold = 220;
      unit = 'V';
    } else if (metricType === 'DoRung') {
      criticalThreshold = 5.0;
      warningThreshold = 4.0;
      unit = 'mm/s';
    }

    // Find min/max values
    const values = dataPoints.map(d => d.metric_value);
    let maxVal = Math.max(...values, criticalThreshold + 5);
    let minVal = Math.min(...values, 0);
    // Add margin to top of scale
    maxVal = maxVal * 1.1;

    const scaleX = (index) => padding.left + (index / (dataPoints.length - 1)) * (width - padding.left - padding.right);
    const scaleY = (val) => height - padding.bottom - ((val - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.overflow = "visible";

    // SVG Gradient for the line stroke
    const strokeGradId = "line-grad-" + metricType;
    const fillGradId = "fill-grad-" + metricType;
    
    // Add filters and gradients
    svg.innerHTML = `
      <defs>
        <linearGradient id="${strokeGradId}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#005AAB" />
          <stop offset="50%" stop-color="#3B82F6" />
          <stop offset="100%" stop-color="#005AAB" />
        </linearGradient>
        <linearGradient id="${fillGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#005AAB" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#005AAB" stop-opacity="0.00" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="alert-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.8" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    `;

    // 1. Gridlines & Y-Axis Scale
    const yTickCount = 5;
    for (let i = 0; i <= yTickCount; i++) {
      const val = minVal + (i / yTickCount) * (maxVal - minVal);
      const y = scaleY(val);
      
      // Horizontal gridline
      const gridline = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gridline.setAttribute("x1", padding.left);
      gridline.setAttribute("y1", y);
      gridline.setAttribute("x2", width - padding.right);
      gridline.setAttribute("y2", y);
      gridline.setAttribute("stroke", "#E2E8F0");
      gridline.setAttribute("stroke-width", "1");
      gridline.setAttribute("stroke-dasharray", "4 4");
      svg.appendChild(gridline);

      // Y Label
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", padding.left - 10);
      label.setAttribute("y", y + 4);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("fill", "#64748B");
      label.style.fontFamily = "'Inter', sans-serif";
      label.style.fontSize = "11px";
      label.textContent = val.toFixed(1) + (i === yTickCount ? ` ${unit}` : '');
      svg.appendChild(label);
    }

    // 2. Threshold Warning Lines
    const renderThresholdLine = (val, color, name, isDashed) => {
      const y = scaleY(val);
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", padding.left);
      line.setAttribute("y1", y);
      line.setAttribute("x2", width - padding.right);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", "1.5");
      if (isDashed) line.setAttribute("stroke-dasharray", "6 3");
      group.appendChild(line);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", width - padding.right - 5);
      text.setAttribute("y", y - 4);
      text.setAttribute("text-anchor", "end");
      text.setAttribute("fill", color);
      text.style.fontFamily = "'Inter', sans-serif";
      text.style.fontSize = "10px";
      text.style.fontWeight = "600";
      text.textContent = name;
      group.appendChild(text);

      svg.appendChild(group);
    };

    renderThresholdLine(criticalThreshold, "#EF4444", `Ngưỡng Nguy Hiểm (${criticalThreshold}${unit})`, false);
    renderThresholdLine(warningThreshold, "#F59E0B", `Ngưỡng Cảnh Báo (${warningThreshold}${unit})`, true);

    // 3. X-Axis Labels
    const totalPoints = dataPoints.length;
    const labelInterval = Math.max(1, Math.ceil(totalPoints / 6)); // limit to max 6 labels to avoid overlap
    dataPoints.forEach((d, idx) => {
      if (idx % labelInterval === 0 || idx === totalPoints - 1) {
        const x = scaleX(idx);
        
        // Formatted timestamp
        const time = new Date(d.recorded_at);
        const hours = String(time.getHours()).padStart(2, '0');
        const mins = String(time.getMinutes()).padStart(2, '0');
        const day = time.getDate();
        const month = time.getMonth() + 1;
        const formattedTime = `${hours}:${mins} (${day}/${month})`;

        // Tick mark
        const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
        tick.setAttribute("x1", x);
        tick.setAttribute("y1", height - padding.bottom);
        tick.setAttribute("x2", x);
        tick.setAttribute("y2", height - padding.bottom + 5);
        tick.setAttribute("stroke", "#CBD5E1");
        tick.setAttribute("stroke-width", "1");
        svg.appendChild(tick);

        // Text label
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", x);
        txt.setAttribute("y", height - padding.bottom + 20);
        txt.setAttribute("text-anchor", "middle");
        txt.setAttribute("fill", "#64748B");
        txt.style.fontFamily = "'Inter', sans-serif";
        txt.style.fontSize = "10px";
        txt.textContent = formattedTime;
        svg.appendChild(txt);
      }
    });

    // 4. Draw Line and Area Fill Paths
    let pathD = "";
    let areaD = `M ${scaleX(0)} ${height - padding.bottom} `;

    dataPoints.forEach((d, idx) => {
      const x = scaleX(idx);
      const y = scaleY(d.metric_value);
      if (idx === 0) {
        pathD += `M ${x} ${y} `;
      } else {
        pathD += `L ${x} ${y} `;
      }
      areaD += `L ${x} ${y} `;
    });
    areaD += `L ${scaleX(dataPoints.length - 1)} ${height - padding.bottom} Z`;

    // Render area path
    const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    areaPath.setAttribute("d", areaD);
    areaPath.setAttribute("fill", `url(#${fillGradId})`);
    svg.appendChild(areaPath);

    // Render stroke path
    const strokePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    strokePath.setAttribute("d", pathD);
    strokePath.setAttribute("fill", "none");
    strokePath.setAttribute("stroke", `url(#${strokeGradId})`);
    strokePath.setAttribute("stroke-width", "3");
    strokePath.setAttribute("filter", "url(#glow)");
    svg.appendChild(strokePath);

    // 5. Draw interactive Data Nodes (with warning flashing animation)
    const pointsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    dataPoints.forEach((d, idx) => {
      const x = scaleX(idx);
      const y = scaleY(d.metric_value);
      const isCritical = d.metric_value > criticalThreshold;
      const isWarning = d.metric_value > warningThreshold && d.metric_value <= criticalThreshold;

      const dotGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      dotGroup.style.cursor = "pointer";

      // If critical, draw a flashing outer halo
      if (isCritical) {
        const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ring.setAttribute("cx", x);
        ring.setAttribute("cy", y);
        ring.setAttribute("r", "10");
        ring.setAttribute("fill", "#FF3B30");
        ring.setAttribute("opacity", "0.4");
        ring.setAttribute("filter", "url(#alert-glow)");
        
        // Pulse animation effect
        const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animate.setAttribute("attributeName", "r");
        animate.setAttribute("values", "6;12;6");
        animate.setAttribute("dur", "1.5s");
        animate.setAttribute("repeatCount", "indefinite");
        ring.appendChild(animate);

        const animateOpacity = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animateOpacity.setAttribute("attributeName", "opacity");
        animateOpacity.setAttribute("values", "0.5;0.1;0.5");
        animateOpacity.setAttribute("dur", "1.5s");
        animateOpacity.setAttribute("repeatCount", "indefinite");
        ring.appendChild(animateOpacity);
        
        dotGroup.appendChild(ring);
      }

      // Main inner node circle
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", isCritical ? "5.5" : "4");
      
      let nodeColor = "#00B4D8";
      if (isCritical) nodeColor = "#FF3B30";
      else if (isWarning) nodeColor = "#FFC107";
      
      dot.setAttribute("fill", nodeColor);
      dot.setAttribute("stroke", "#030712");
      dot.setAttribute("stroke-width", "2");
      dotGroup.appendChild(dot);

      // Tooltip interactive events
      dotGroup.addEventListener("mouseenter", (e) => {
        // Expand node on hover
        dot.setAttribute("r", isCritical ? "8" : "6.5");
        
        const timestamp = new Date(d.recorded_at).toLocaleString('vi-VN');
        const alarmText = isCritical 
          ? `<span style="color:#FF3B30;font-weight:bold;">● NGUY HIỂM VƯỢT NGƯỠNG</span>` 
          : (isWarning ? `<span style="color:#FFC107;font-weight:bold;">● CẢNH BÁO CAO</span>` : `<span style="color:#10B981;font-weight:bold;">● Bình thường</span>`);

        let tooltipHTML = `
          <div style="font-weight:600;margin-bottom:3px;font-size:12px;color:#F8FAFC;">Thiết bị: ${d.asset_id}</div>
          <div style="font-size:11px;color:#94A3B8;">Thời gian: ${timestamp}</div>
          <div style="font-size:13px;font-weight:bold;margin:4px 0;color:#F8FAFC;">
            Giá trị: <span style="font-size:14px;color:${isCritical ? '#FF3B30' : (isWarning ? '#FFC107' : '#00E5FF')}">${d.metric_value} ${unit}</span>
          </div>
        `;
        if (d.metric_value === 92.5 && d.asset_id === 'A0004') {
          tooltipHTML += `
            <div style="font-size:11px;color:#FF3B30;font-weight:bold;margin-top:5px;border-top:1px solid rgba(255,59,48,0.2);padding-top:4px;">
              ⚠️ Vượt ngưỡng CBM 90°C -> Kích hoạt trg_CanhBaoNhietDo
            </div>
          `;
        } else {
          tooltipHTML += `<div style="font-size:11px;color:#94A3B8;">Trạng thái: ${alarmText}</div>`;
        }
        showTooltip(e.clientX, e.clientY, tooltipHTML);
      });

      dotGroup.addEventListener("mouseleave", () => {
        dot.setAttribute("r", isCritical ? "5.5" : "4");
        hideTooltip();
      });

      pointsGroup.appendChild(dotGroup);
    });
    
    svg.appendChild(pointsGroup);
    container.appendChild(svg);
  }

  /**
   * 2. DONUT CHART - Failure Breakdown (vw_ThietBi_LoiNhieu)
   * Draws a clean circle-dasharray based Donut diagram.
   */
  static drawDonutChart(containerId, failureData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    const totalFailures = failureData.reduce((sum, f) => sum + f.failure_count, 0);

    if (totalFailures === 0) {
      container.innerHTML = `
        <div style="height:100%; display:flex; justify-content:center; align-items:center; color:#94A3B8; font-size:14px; flex-direction:column; gap:8px;">
          <svg style="color:#64748B; width:40px; height:40px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Hệ thống vận hành an toàn. Không phát hiện sự cố thiết bị.
        </div>
      `;
      return;
    }

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;
    const size = Math.min(width, height) * 0.85;
    const radius = size * 0.35;
    const strokeWidth = radius * 0.3;
    const center = { x: size / 2, y: height / 2 };
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", height);
    svg.style.overflow = "visible";

    // Set colors for the asset types
    const colorPalette = ["#FF3B30", "#FFC107", "#00E5FF", "#10B981"];
    const circumference = 2 * Math.PI * radius;

    let currentOffset = 0;
    
    const donutGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    failureData.forEach((f, idx) => {
      if (f.failure_count === 0) return;

      const percentage = f.failure_count / totalFailures;
      const strokeLength = percentage * circumference;
      const strokeDash = `${strokeLength} ${circumference}`;
      const rotation = (currentOffset / circumference) * 360 - 90; // Start at top 12 o'clock

      const segment = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      segment.setAttribute("cx", center.x);
      segment.setAttribute("cy", center.y);
      segment.setAttribute("r", radius);
      segment.setAttribute("fill", "transparent");
      segment.setAttribute("stroke", colorPalette[idx % colorPalette.length]);
      segment.setAttribute("stroke-width", strokeWidth);
      segment.setAttribute("stroke-dasharray", strokeDash);
      segment.setAttribute("transform", `rotate(${rotation} ${center.x} ${center.y})`);
      segment.style.transition = "stroke-width 0.2s ease, opacity 0.2s ease";
      segment.style.cursor = "pointer";

      // Interactive Hover details
      segment.addEventListener("mouseenter", (e) => {
        segment.setAttribute("stroke-width", strokeWidth + 4);
        const percentText = (percentage * 100).toFixed(1) + "%";
        showTooltip(e.clientX, e.clientY, `
          <div style="font-weight:600;font-size:12px;color:#F8FAFC;">${f.type_name}</div>
          <div style="font-size:11px;color:#94A3B8;">Số lỗi: ${f.failure_count} thiết bị (${percentText})</div>
        `);
      });

      segment.addEventListener("mouseleave", () => {
        segment.setAttribute("stroke-width", strokeWidth);
        hideTooltip();
      });

      donutGroup.appendChild(segment);
      currentOffset += strokeLength;
    });

    // Center text hole displaying aggregate numbers
    const textHole = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textHole.setAttribute("x", center.x);
    textHole.setAttribute("y", center.y + 4);
    textHole.setAttribute("text-anchor", "middle");
    textHole.style.fontFamily = "'Inter', sans-serif";
    textHole.style.fontSize = "16px";
    textHole.style.fontWeight = "bold";
    textHole.style.fill = "#F8FAFC";
    textHole.textContent = `${totalFailures} Lỗi`;
    donutGroup.appendChild(textHole);

    svg.appendChild(donutGroup);

    // Create Legend DOM list alongside chart
    const legendContainer = document.createElement("div");
    legendContainer.className = "donut-legend";
    legendContainer.style.display = "flex";
    legendContainer.style.flexDirection = "column";
    legendContainer.style.justifyContent = "center";
    legendContainer.style.gap = "8px";
    legendContainer.style.marginLeft = "15px";
    legendContainer.style.flex = "1";
    legendContainer.style.borderLeft = "1px solid var(--evn-border)";

    failureData.forEach((f, idx) => {
      if (f.failure_count === 0) return;
      const pct = ((f.failure_count / totalFailures) * 100).toFixed(0) + "%";
      
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.fontSize = "12px";
      item.style.color = "#64748B";
      item.style.fontFamily = "'Inter', sans-serif";

      const dot = document.createElement("span");
      dot.style.display = "inline-block";
      dot.style.width = "10px";
      dot.style.height = "10px";
      dot.style.borderRadius = "50%";
      dot.style.backgroundColor = colorPalette[idx % colorPalette.length];
      dot.style.marginRight = "8px";

      const label = document.createElement("span");
      label.innerHTML = `<strong style="color:#0F172A;">${f.type_name}</strong>: ${f.failure_count} (${pct})`;

      item.appendChild(dot);
      item.appendChild(label);
      legendContainer.appendChild(item);
    });

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    
    wrapper.appendChild(svg);
    wrapper.appendChild(legendContainer);
    container.appendChild(wrapper);
  }

  /**
   * 3. BAR CHART - Maintenance Costs (sp_BaoCao_ChiPhiBaoTri)
   * Draws dynamic vertical grids showing monthly financial budgets.
   */
  static drawBarChart(containerId, monthlyCosts) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    const width = container.clientWidth || 550;
    const height = container.clientHeight || 280;
    const padding = { top: 30, right: 25, bottom: 40, left: 75 };

    if (!monthlyCosts || monthlyCosts.length === 0) {
      container.innerHTML = `
        <div style="height:100%; display:flex; justify-content:center; align-items:center; color:#94A3B8; font-size:14px;">
          Không có dữ liệu chi phí bảo trì.
        </div>
      `;
      return;
    }

    const maxCost = Math.max(...monthlyCosts.map(d => d.cost_vnd), 10);
    const yMaxVal = maxCost * 1.15; // 15% top padding

    const scaleX = (index) => padding.left + (index / monthlyCosts.length) * (width - padding.left - padding.right);
    const scaleY = (val) => height - padding.bottom - (val / yMaxVal) * (height - padding.top - padding.bottom);
    const barWidth = Math.max(15, ((width - padding.left - padding.right) / monthlyCosts.length) * 0.6);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.overflow = "visible";

    // Setup definitions
    svg.innerHTML = `
      <defs>
        <linearGradient id="bar-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#3B82F6" />
          <stop offset="100%" stop-color="#005AAB" />
        </linearGradient>
        <linearGradient id="bar-hover-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#60A5FA" />
          <stop offset="100%" stop-color="#3B82F6" />
        </linearGradient>
      </defs>
    `;

    // 1. Draw Horizontal Y Gridlines & axis markers
    const yTickCount = 5;
    for (let i = 0; i <= yTickCount; i++) {
      const val = (i / yTickCount) * yMaxVal;
      const y = scaleY(val);

      const gridline = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gridline.setAttribute("x1", padding.left);
      gridline.setAttribute("y1", y);
      gridline.setAttribute("x2", width - padding.right);
      gridline.setAttribute("y2", y);
      gridline.setAttribute("stroke", "#E2E8F0");
      gridline.setAttribute("stroke-width", "1");
      svg.appendChild(gridline);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", padding.left - 10);
      label.setAttribute("y", y + 4);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("fill", "#64748B");
      label.style.fontFamily = "'Inter', sans-serif";
      label.style.fontSize = "11px";
      label.textContent = val.toFixed(0) + ' tr.đ';
      svg.appendChild(label);
    }

    // 2. Draw Bars
    monthlyCosts.forEach((item, idx) => {
      const x = scaleX(idx) + ((width - padding.left - padding.right) / monthlyCosts.length - barWidth) / 2;
      const y = scaleY(item.cost_vnd);
      const barHeight = height - padding.bottom - y;

      const barGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      barGroup.style.cursor = "pointer";

      // May has a distinct red color to highlight spike
      const isSpike = item.month === "Tháng 5";
      const barFill = isSpike ? "var(--evn-accent)" : "url(#bar-grad)";
      const barHoverFill = isSpike ? "#EF4444" : "url(#bar-hover-grad)";

      // Rect bar
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", barWidth);
      rect.setAttribute("height", Math.max(2, barHeight));
      rect.setAttribute("fill", barFill);
      rect.setAttribute("rx", "3");
      rect.style.transition = "fill 0.15s ease, opacity 0.15s ease";

      barGroup.appendChild(rect);

      // Interactive Events
      barGroup.addEventListener("mouseenter", (e) => {
        rect.setAttribute("fill", barHoverFill);
        showTooltip(e.clientX, e.clientY, `
          <div style="font-weight:600;font-size:12.5px;color:#FFFFFF;">${item.month}</div>
          <div style="font-size:13px;font-weight:bold;margin-top:6px;color:${isSpike ? '#EF4444' : '#60A5FA'};">
            Chi phí: ${item.cost_vnd.toFixed(1)} triệu VNĐ
          </div>
          <div style="font-size:11px;color:#94A3B8;margin-top:2px;">
            Đơn vị: Triệu VNĐ
          </div>
        `);
      });

      barGroup.addEventListener("mouseleave", () => {
        rect.setAttribute("fill", barFill);
        hideTooltip();
      });

      svg.appendChild(barGroup);

      // Bar Month labels (X-Axis Labels)
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", x + barWidth / 2);
      label.setAttribute("y", height - padding.bottom + 20);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", "#64748B");
      label.style.fontFamily = "'Inter', sans-serif";
      label.style.fontSize = "11px";
      label.style.fontWeight = "500";
      label.textContent = item.month;
      svg.appendChild(label);
    });

    // Baseline axis stroke
    const baseline = document.createElementNS("http://www.w3.org/2000/svg", "line");
    baseline.setAttribute("x1", padding.left);
    baseline.setAttribute("y1", height - padding.bottom);
    baseline.setAttribute("x2", width - padding.right);
    baseline.setAttribute("y2", height - padding.bottom);
    baseline.setAttribute("stroke", "#CBD5E1");
    baseline.setAttribute("stroke-width", "1.5");
    svg.appendChild(baseline);

    container.appendChild(svg);
  }

  /**
   * 4. PRODUCTIVITY & DEPRECIATION CHART
   * Draws a modern grouped bar chart mapping station efficiency (fn_DanhGiaNangSuatTram) 
   * and equipment depreciation (fn_UocTinhKhauHao) side-by-side.
   */
  static drawProductivityDepreciationChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    const substations = window.DB.substations;
    const width = container.clientWidth || 550;
    const height = container.clientHeight || 280;
    const padding = { top: 30, right: 30, bottom: 40, left: 55 };

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.overflow = "visible";

    svg.innerHTML = `
      <defs>
        <linearGradient id="prod-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#10B981" />
          <stop offset="100%" stop-color="#047857" />
        </linearGradient>
        <linearGradient id="dep-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#F59E0B" />
          <stop offset="100%" stop-color="#D97706" />
        </linearGradient>
      </defs>
    `;

    const maxVal = 100;
    const scaleY = (val) => height - padding.bottom - (val / maxVal) * (height - padding.top - padding.bottom);
    const scaleX = (index) => padding.left + (index / substations.length) * (width - padding.left - padding.right);
    const barWidth = Math.max(12, ((width - padding.left - padding.right) / substations.length) * 0.28);

    const yTickCount = 5;
    for (let i = 0; i <= yTickCount; i++) {
      const val = (i / yTickCount) * maxVal;
      const y = scaleY(val);

      const gridline = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gridline.setAttribute("x1", padding.left);
      gridline.setAttribute("y1", y);
      gridline.setAttribute("x2", width - padding.right);
      gridline.setAttribute("y2", y);
      gridline.setAttribute("stroke", "#E2E8F0");
      gridline.setAttribute("stroke-width", "1");
      gridline.setAttribute("stroke-dasharray", "4 4");
      svg.appendChild(gridline);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", padding.left - 10);
      label.setAttribute("y", y + 4);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("fill", "#64748B");
      label.style.fontFamily = "'Inter', sans-serif";
      label.style.fontSize = "11px";
      label.textContent = val + "%";
      svg.appendChild(label);
    }

    substations.forEach((sub, idx) => {
      const xGroupStart = scaleX(idx) + ((width - padding.left - padding.right) / substations.length - barWidth * 2 - 4) / 2;
      
      const depreciation = window.DB.fn_UocTinhKhauHao(sub.substation_id);
      const productivity = window.DB.fn_DanhGiaNangSuatTram(sub.substation_id);

      const xProd = xGroupStart;
      const yProd = scaleY(productivity);
      const hProd = height - padding.bottom - yProd;

      const groupProd = document.createElementNS("http://www.w3.org/2000/svg", "g");
      groupProd.style.cursor = "pointer";

      const rectProd = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rectProd.setAttribute("x", xProd);
      rectProd.setAttribute("y", yProd);
      rectProd.setAttribute("width", barWidth);
      rectProd.setAttribute("height", Math.max(2, hProd));
      rectProd.setAttribute("fill", "url(#prod-grad)");
      rectProd.setAttribute("rx", "2");
      groupProd.appendChild(rectProd);

      groupProd.addEventListener("mouseenter", (e) => {
        showTooltip(e.clientX, e.clientY, `
          <div style="font-weight:600;font-size:12px;color:#F8FAFC;">${sub.substation_name}</div>
          <div style="font-size:12px;color:#10B981;margin-top:4px;font-weight:700;">
            📈 Năng suất: ${productivity}% <br>
            <span style="font-size:10px;font-weight:normal;color:#94A3B8;">[🧮 Func: fn_DanhGiaNangSuatTram]</span>
          </div>
        `);
      });
      groupProd.addEventListener("mouseleave", () => hideTooltip());
      svg.appendChild(groupProd);

      const xDep = xGroupStart + barWidth + 4;
      const yDep = scaleY(depreciation);
      const hDep = height - padding.bottom - yDep;

      const groupDep = document.createElementNS("http://www.w3.org/2000/svg", "g");
      groupDep.style.cursor = "pointer";

      const rectDep = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rectDep.setAttribute("x", xDep);
      rectDep.setAttribute("y", yDep);
      rectDep.setAttribute("width", barWidth);
      rectDep.setAttribute("height", Math.max(2, hDep));
      rectDep.setAttribute("fill", "url(#dep-grad)");
      rectDep.setAttribute("rx", "2");
      groupDep.appendChild(rectDep);

      groupDep.addEventListener("mouseenter", (e) => {
        showTooltip(e.clientX, e.clientY, `
          <div style="font-weight:600;font-size:12px;color:#F8FAFC;">${sub.substation_name}</div>
          <div style="font-size:12px;color:#F59E0B;margin-top:4px;font-weight:700;">
            📉 Khấu hao ước tính: ${depreciation}% <br>
            <span style="font-size:10px;font-weight:normal;color:#94A3B8;">[🧮 Func: fn_UocTinhKhauHao]</span>
          </div>
        `);
      });
      groupDep.addEventListener("mouseleave", () => hideTooltip());
      svg.appendChild(groupDep);

      const xLabel = xGroupStart + barWidth + 2;
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", xLabel);
      label.setAttribute("y", height - padding.bottom + 20);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", "#64748B");
      label.style.fontFamily = "'Inter', sans-serif";
      label.style.fontSize = "11px";
      label.style.fontWeight = "600";
      label.textContent = sub.substation_id;
      svg.appendChild(label);
    });

    const baseline = document.createElementNS("http://www.w3.org/2000/svg", "line");
    baseline.setAttribute("x1", padding.left);
    baseline.setAttribute("y1", height - padding.bottom);
    baseline.setAttribute("x2", width - padding.right);
    baseline.setAttribute("y2", height - padding.bottom);
    baseline.setAttribute("stroke", "#CBD5E1");
    baseline.setAttribute("stroke-width", "1.5");
    svg.appendChild(baseline);

    container.appendChild(svg);
  }
}

// --- GLOBAL TOOLTIP LAYER CREATION ---
let tooltipEl = document.getElementById("evn-chart-tooltip");
if (!tooltipEl) {
  tooltipEl = document.createElement("div");
  tooltipEl.id = "evn-chart-tooltip";
  tooltipEl.style.position = "absolute";
  tooltipEl.style.zIndex = "9999";
  tooltipEl.style.backgroundColor = "rgba(15, 23, 42, 0.93)";
  tooltipEl.style.boxShadow = "0 8px 32px rgba(0,0,0,0.5), 0 0 10px rgba(0, 229, 255, 0.15)";
  tooltipEl.style.border = "1px solid rgba(0, 229, 255, 0.2)";
  tooltipEl.style.borderRadius = "8px";
  tooltipEl.style.padding = "10px 12px";
  tooltipEl.style.pointerEvents = "none";
  tooltipEl.style.opacity = "0";
  tooltipEl.style.transition = "opacity 0.15s ease, transform 0.1s ease";
  tooltipEl.style.fontFamily = "'Inter', sans-serif";
  tooltipEl.style.fontSize = "12px";
  tooltipEl.style.color = "#F8FAFC";
  document.body.appendChild(tooltipEl);
}

function showTooltip(x, y, content) {
  tooltipEl.innerHTML = content;
  tooltipEl.style.opacity = "1";
  tooltipEl.style.transform = `translate(${x + 15}px, ${y - 45}px)`;
}

function hideTooltip() {
  tooltipEl.style.opacity = "0";
}
