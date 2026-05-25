// Dashboard.jsx - "Ví Sinh Tồn" & Survival Heart Rate Monitor
import React from 'react';
import CalendarCard from './CalendarCard';

export default function Dashboard({ faults, settings, onOpenSettings }) {
  // 1. Tính toán số tháng luỹ kế kể từ khi bắt đầu phạm lỗi để ra hạn mức tích luỹ
  const getElapsedMonths = () => {
    if (faults.length === 0) return 1;
    
    // Tìm ngày của lỗi đầu tiên (mốc khởi chạy ứng dụng)
    const dates = faults.map(f => new Date(f.created_at).getTime());
    const oldestTime = Math.min(...dates);
    const start = new Date(oldestTime);
    const now = new Date();
    
    const yearsDiff = now.getFullYear() - start.getFullYear();
    const monthsDiff = now.getMonth() - start.getMonth();
    
    // Trả về số tháng (tối thiểu là 1)
    return Math.max(1, yearsDiff * 12 + monthsDiff + 1);
  };

  const elapsedMonths = getElapsedMonths();
  const accumulatedBudget = elapsedMonths * settings.monthlyBudget; // Quỹ tổng luỹ kế của Bảo

  // Get active (not forgiven) faults to subtract from budget
  const activeFaults = faults.filter(f => f.status !== 'forgiven');
  const totalPenalized = activeFaults.reduce((sum, f) => sum + Number(f.amount), 0);
  
  // Số dư thực tế còn lại (cho phép số âm/dương tự động bù đắp sang tháng sau)
  const remainingBalance = accumulatedBudget - totalPenalized;
  const remainingPercent = accumulatedBudget > 0 ? Math.max(0, (remainingBalance / accumulatedBudget) * 100) : 0;

  // Format currency in VND
  const formatVND = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Determine vital signs status
  let vitalStatus = 'normal'; // normal, warning, danger
  let vitalLabel = 'Sống khỏe re 😎';
  
  if (remainingPercent < 20) {
    vitalStatus = 'danger';
    vitalLabel = 'Nguy kịch! 🚨☠️';
  } else if (remainingPercent < 50) {
    vitalStatus = 'warning';
    vitalLabel = 'Thở oxy 😰';
  } else if (remainingPercent < 80) {
    vitalStatus = 'warning';
    vitalLabel = 'Bắt đầu ngoan ngoãn 😐';
  }

  // Draw pure SVG Line Chart for the balance over time
  const getChartPath = () => {
    if (faults.length === 0) {
      return { path: 'M 0 50 L 500 50', dots: [], area: 'M 0 50 L 500 50 L 500 100 L 0 100 Z' };
    }

    // Sort chronologically (oldest first) to track depletion
    const chronologicalFaults = [...faults]
      .filter(f => f.status !== 'forgiven')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Vẽ biểu đồ bắt đầu từ Quỹ tích luỹ
    const dataPoints = [accumulatedBudget];
    let currentBalance = accumulatedBudget;
    
    chronologicalFaults.forEach(f => {
      currentBalance -= Number(f.amount);
      dataPoints.push(Math.max(0, currentBalance));
    });

    const width = 500;
    const height = 80;
    const padding = 10;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;

    const pointsCount = dataPoints.length;
    const maxVal = accumulatedBudget;
    
    // Map points to SVG coordinates
    const coords = dataPoints.map((val, index) => {
      const x = padding + (index / (pointsCount - 1 || 1)) * chartWidth;
      // y is inverted because 0 is at top
      const y = padding + (1 - (val / (maxVal || 1))) * chartHeight;
      return { x, y, val };
    });

    // Generate Path
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      // Smooth curve interpolation
      const cpX1 = coords[i - 1].x + (coords[i].x - coords[i - 1].x) / 2;
      const cpY1 = coords[i - 1].y;
      const cpX2 = coords[i - 1].x + (coords[i].x - coords[i - 1].x) / 2;
      const cpY2 = coords[i].y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${coords[i].x} ${coords[i].y}`;
    }

    // Generate Area path
    const area = `${path} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

    return { path, area, dots: coords };
  };

  const chartData = getChartPath();

  return (
    <section className="dashboard-grid">
      {/* Wallet Details */}
      <div className={`glass-panel wallet-card ${vitalStatus === 'danger' ? 'danger' : ''}`}>
        <div className="wallet-glow-effect"></div>
        <div className="wallet-top">
          <div>
            <div className="wallet-label">Ví Sinh Tồn Luỹ Kế của Bảo</div>
            <div className="wallet-balance-row">
              <span className="balance-amount" style={{ color: remainingBalance < 0 ? 'var(--crimson)' : 'inherit' }}>
                {remainingBalance < 0 ? '-' : ''}{formatVND(Math.abs(remainingBalance)).replace('₫', '')}
                <span className="balance-currency">VND</span>
              </span>
            </div>
          </div>
          <button 
            className="settings-trigger" 
            title="Cài đặt hệ thống"
            onClick={onOpenSettings}
          >
            {/* Cog Icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>

        <div className="wallet-progress-container">
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${remainingPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="wallet-bottom">
          <div className="metric-box">
            <span className="metric-label">Hạn mức tháng</span>
            <span className="metric-value">{formatVND(settings.monthlyBudget)}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Quỹ tích lũy ({elapsedMonths}T)</span>
            <span className="metric-value" style={{ color: 'var(--cyan)' }}>{formatVND(accumulatedBudget)}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Tổng tiền phạt</span>
            <span className="metric-value penalty">-{formatVND(totalPenalized)}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Hệ số an toàn</span>
            <span className="metric-value" style={{ color: remainingPercent < 20 ? 'var(--crimson)' : 'var(--mint)' }}>
              {remainingPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Mini Balance Depletion Curve */}
        <div className={`chart-container ${vitalStatus === 'danger' ? 'chart-card-danger' : ''}`}>
          <svg className="chart-svg" viewBox="0 0 500 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chart-gradient-mint" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--mint)" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="chart-gradient-crimson" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--crimson)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--crimson)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Shaded Area */}
            <path className="chart-area" d={chartData.area} />
            {/* Core glowing line */}
            <path className="chart-line" d={chartData.path} />
            {/* Interactive Data Dots */}
            <g className="chart-dots">
              {chartData.dots.map((dot, index) => (
                <circle 
                  key={index} 
                  cx={dot.x} 
                  cy={dot.y} 
                  r="4" 
                  title={`Điểm ${index}: ${formatVND(dot.val)}`}
                />
              ))}
            </g>
          </svg>
        </div>
      </div>

      {/* Vital Sign Status */}
      <div className={`glass-panel vital-card ${vitalStatus}`}>
        {/* Animated Heartbeat SVG */}
        <svg className="heart-rate-svg" viewBox="0 0 150 75">
          <path 
            className="heart-path" 
            d="M0,37.5 L45,37.5 L52,15 L60,60 L68,30 L73,43 L78,37.5 L150,37.5"
          />
        </svg>
        <span className="vital-status-text">Trạng thái sinh mạng</span>
        <span className="vital-status-value">{vitalLabel}</span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '80%' }}>
          {remainingPercent < 20 
            ? 'Mọi hành vi lươn lẹo tại thời điểm này đều có thể dẫn đến phá sản!' 
            : remainingPercent < 50 
            ? 'Cảnh báo: Ví đã thâm hụt phân nửa. Cần thái độ hợp tác khẩn cấp.'
            : 'Vùng an toàn. Hãy tiếp tục ngoan ngoãn để duy trì sự sống.'
          }
        </p>
      </div>

      {/* Calendar Crime Highlights */}
      <CalendarCard faults={faults} />
    </section>
  );
}
