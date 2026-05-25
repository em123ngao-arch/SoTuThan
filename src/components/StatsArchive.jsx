// StatsArchive.jsx - Statistics and History Lookup Archive
import React, { useState } from 'react';
import { sound } from './SoundManager';

export default function StatsArchive({ faults, role, onAppeal, onJudge, onDelete }) {
  const [timeFilter, setTimeFilter] = useState('month'); // today, week, month, year, all
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomedImage, setZoomedImage] = useState(null);
  const [zoomedCaption, setZoomedCaption] = useState('');

  // Formats date nicely
  const formatDate = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatVND = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Get date ranges
  const getFilterRange = () => {
    const now = new Date();
    let start = new Date();
    
    switch (timeFilter) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        // Get last Monday
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'all':
      default:
        start = new Date(0); // Epoch
        break;
    }
    return start;
  };

  const filterStartDate = getFilterRange();

  // Filter faults by time range and search query
  const filteredFaults = faults.filter(f => {
    const createdDate = new Date(f.created_at);
    const matchesTime = createdDate >= filterStartDate;
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (f.appeal_reason && f.appeal_reason.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTime && matchesSearch;
  });

  // Calculate statistics
  const activeFaults = filteredFaults.filter(f => f.status !== 'forgiven');
  const totalFaultsCount = filteredFaults.length;
  const totalPenalizedAmount = activeFaults.reduce((sum, f) => sum + Number(f.amount), 0);
  
  const forgivenFaults = filteredFaults.filter(f => f.status === 'forgiven');
  const forgivenessRate = totalFaultsCount > 0 ? (forgivenFaults.length / totalFaultsCount) * 100 : 0;

  // Generate Leaderboard: Group faults by similar names
  const getLeaderboard = () => {
    const counts = {};
    filteredFaults.forEach(f => {
      // Standardize title for grouping (e.g. trim spaces and emojis)
      const cleanTitle = f.title.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
      if (!counts[cleanTitle]) {
        counts[cleanTitle] = { count: 0, amount: 0, originalTitle: f.title };
      }
      counts[cleanTitle].count += 1;
      if (f.status !== 'forgiven') {
        counts[cleanTitle].amount += Number(f.amount);
      }
    });

    return Object.keys(counts)
      .map(key => ({
        title: counts[key].originalTitle,
        count: counts[key].count,
        amount: counts[key].amount
      }))
      .sort((a, b) => b.count - a.count || b.amount - a.amount)
      .slice(0, 3); // Top 3 crimes
  };

  const leaderboard = getLeaderboard();

  const handleFilterClick = (filter) => {
    sound.playKeyboard();
    setTimeFilter(filter);
  };

  return (
    <div className="glass-panel shame-section glow-border-mint">
      <h2>
        <span>📊 Lưu Trữ & Thống Kê Lỗi Lầm</span>
      </h2>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'today', label: 'Hôm nay' },
          { key: 'week', label: 'Tuần này' },
          { key: 'month', label: 'Tháng này' },
          { key: 'year', label: 'Năm nay' },
          { key: 'all', label: 'Tất cả lịch sử' }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`preset-chip ${timeFilter === tab.key ? 'active' : ''}`}
            onClick={() => handleFilterClick(tab.key)}
            style={{ fontSize: '0.85rem', padding: '8px 14px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '25px' }}>
        <div className="glass-panel" style={{ padding: '12px 15px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div className="metric-label">Tổng Án Phạt</div>
          <div className="vital-status-value" style={{ color: 'var(--cyan)' }}>{totalFaultsCount} Lần</div>
        </div>
        <div className="glass-panel" style={{ padding: '12px 15px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div className="metric-label">Tổng Tiền Phạt</div>
          <div className="vital-status-value" style={{ color: 'var(--crimson)' }}>-{formatVND(totalPenalizedAmount)}</div>
        </div>
        <div className="glass-panel" style={{ padding: '12px 15px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div className="metric-label">Độ Nhân Từ Của Ngân</div>
          <div className="vital-status-value" style={{ color: 'var(--mint)' }}>{forgivenessRate.toFixed(0)}%</div>
        </div>
      </div>

      {/* Leaderboard of Crimes */}
      {leaderboard.length > 0 && (
        <div className="glass-panel" style={{ padding: '15px', marginBottom: '25px', background: 'rgba(255, 60, 95, 0.02)', borderColor: 'rgba(255, 60, 95, 0.1)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--crimson)', textShadow: '0 0 10px var(--crimson-glow)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏆 BẢNG PHONG THẦN TỘI DANH</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaderboard.map((item, index) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={index} style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', fontSize: '0.9rem', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {medals[index]} {item.title}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyber-yellow)', marginLeft: 'auto' }}>
                    {item.count} lần | <span style={{ color: 'var(--crimson)' }}>-{formatVND(item.amount)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="form-group" style={{ marginBottom: '20px' }}>
        <input
          type="text"
          className="input-glow"
          placeholder="🔍 Tìm kiếm tội danh hoặc lời biện hộ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {/* Lookup Timeline */}
      <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '15px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
        📋 Nhật Ký Tra Cứu ({filteredFaults.length} Kết quả)
      </h3>

      {filteredFaults.length === 0 ? (
        <div className="shame-empty">
          <div className="shame-empty-icon">📂</div>
          <p>Không tìm thấy bản ghi lịch sử nào phù hợp.</p>
        </div>
      ) : (
        <div className="faults-timeline" style={{ maxHeight: '400px' }}>
          {filteredFaults.map(fault => {
            let statusText = 'Đang xử lý';
            let statusClass = 'pending';

            if (fault.status === 'appealed') {
              statusText = 'Đang kháng cáo';
              statusClass = 'appealed';
            } else if (fault.status === 'forgiven') {
              statusText = 'Đã tha thứ';
              statusClass = 'forgiven';
            } else if (fault.status === 'rejected') {
              statusText = 'Kháng cáo bị bác';
              statusClass = 'rejected';
            } else if (fault.status === 'deducted' || fault.status === 'system') {
              statusText = 'Đã thực thi';
              statusClass = 'rejected';
            }

            return (
              <div 
                key={fault.id} 
                className={`glass-panel fault-card ${statusClass}`} 
                style={{ padding: '12px', borderRadius: '10px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', gap: '10px' }}>
                  <div>
                    <span className={`status-tag ${statusClass}`} style={{ fontSize: '0.6rem' }}>{statusText}</span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{fault.title}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {formatDate(fault.created_at)}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: fault.status === 'forgiven' ? 'var(--mint)' : 'var(--crimson)', textDecoration: fault.status === 'forgiven' ? 'line-through' : 'none', marginLeft: 'auto', background: fault.status === 'forgiven' ? 'rgba(0,255,187,0.05)' : 'rgba(255,60,95,0.05)', padding: '3px 8px', borderRadius: '5px' }}>
                    -{formatVND(fault.amount)}
                  </span>
                </div>
                {fault.evidence && (
                  <div style={{ marginTop: '8px' }}>
                    <img 
                      src={fault.evidence} 
                      alt="Bằng chứng" 
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in', border: '1px solid rgba(255,255,255,0.05)' }} 
                      onClick={() => {
                        sound.playKeyboard();
                        setZoomedImage(fault.evidence);
                        setZoomedCaption(fault.title);
                      }}
                    />
                  </div>
                )}
                {fault.appeal_reason && (
                  <div style={{ background: 'rgba(0,0,0,0.1)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', marginTop: '8px', color: 'var(--text-secondary)' }}>
                    <strong>Biện hộ:</strong> "{fault.appeal_reason}"
                  </div>
                )}
                {fault.admin_note && (
                  <div style={{ background: 'rgba(0,0,0,0.1)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                    <strong>Phán quyết Ngân:</strong> "{fault.admin_note}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
