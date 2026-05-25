// WallOfShame.jsx - Timeline of crimes, 24h appeal counts, and admin judgments
import React, { useState, useEffect } from 'react';
import { sound } from './SoundManager';

// Single Fault Card with Countdown Timer
function FaultCard({ fault, role, onAppeal, onJudge, onDelete, onZoomImage, onShareZalo }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [canAppeal, setCanAppeal] = useState(false);

  // Calculate 24h countdown
  useEffect(() => {
    if (fault.status !== 'pending') {
      return;
    }

    const calculateTimeLeft = () => {
      const createdTime = new Date(fault.created_at).getTime();
      const endTime = createdTime + 24 * 60 * 60 * 1000; // 24 hours
      const now = new Date().getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setCanAppeal(false);
        // Silently mark as deducted if not already done (normally done on next reload, or can trigger callback)
      } else {
        const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
        const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
        setTimeLeft(`${hours}:${minutes}:${seconds}`);
        setCanAppeal(true);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [fault.created_at, fault.status]);

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

  // Determine status color and tag
  let statusText = 'Đang chờ xử lý';
  let statusClass = 'pending';

  if (fault.status === 'appealed') {
    statusText = 'Đang kháng cáo ⏳';
    statusClass = 'appealed';
  } else if (fault.status === 'forgiven') {
    statusText = 'Đã tha thứ ✨';
    statusClass = 'forgiven';
  } else if (fault.status === 'rejected') {
    statusText = 'Kháng cáo bị bác bỏ ⛔';
    statusClass = 'rejected';
  } else if (fault.status === 'deducted' || (fault.status === 'pending' && !canAppeal)) {
    statusText = 'Đã thực thi 💸';
    statusClass = 'rejected'; // Show as deducted/red-ish border
  }

  return (
    <div className={`glass-panel fault-card ${statusClass}`}>
      <div className="fault-card-header">
        <div className="fault-title-area">
          <div className={`status-tag ${statusClass}`}>{statusText}</div>
          <h3>{fault.title}</h3>
          <div className="fault-meta">Thời gian phạm lỗi: {formatDate(fault.created_at)}</div>
        </div>
        <div className="fault-penalty-badge">
          -{formatVND(fault.amount)}
        </div>
      </div>

      <div className="fault-body">
        {fault.evidence && (
          <img 
            src={fault.evidence} 
            alt="Bằng chứng hiện trường" 
            className="fault-img-thumb" 
            onClick={() => onZoomImage(fault.evidence, fault.title)}
          />
        )}
        <div className="fault-details">
          {/* Show appeal details if appealed */}
          {fault.status === 'appealed' && (
            <div className="appeal-info-box glow-border-yellow">
              <div className="appeal-title">Bảo kêu oan:</div>
              <div className="appeal-text">" {fault.appeal_reason} "</div>
            </div>
          )}

          {/* Show admin judgement notes */}
          {fault.admin_note && (
            <div className="appeal-info-box glow-border-mint">
              <div className="appeal-title" style={{ color: fault.status === 'forgiven' ? 'var(--mint)' : 'var(--crimson)' }}>
                Quyết định của Ngân:
              </div>
              <div className="appeal-text">" {fault.admin_note} "</div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="fault-card-actions">
        {/* Countdown for appeal */}
        {fault.status === 'pending' && canAppeal && (
          <div className="countdown-tag" title="Hạn chót để Bảo kháng cáo kêu oan">
            <span className="countdown-icon">⏳</span> Còn {timeLeft} để kêu oan
          </div>
        )}

        {/* Bảo's Actions: Kêu Oan */}
        {role === 'bao' && fault.status === 'pending' && canAppeal && (
          <button 
            className="card-btn appeal"
            onClick={() => onAppeal(fault.id)}
          >
            {/* Feather/Quill Icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
              <line x1="16" y1="8" x2="2" y2="22"/>
              <line x1="17.5" y1="15" x2="9" y2="15"/>
            </svg>
            Kêu Oan!
          </button>
        )}

        {/* Ngân's Actions: Judge Appeal */}
        {role === 'ngan' && fault.status === 'appealed' && (
          <>
            <button 
              className="card-btn approve"
              onClick={() => onJudge(fault.id, 'forgiven')}
            >
              {/* Check Icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Tha Thứ ❤️
            </button>
            <button 
              className="card-btn reject"
              onClick={() => onJudge(fault.id, 'rejected')}
            >
              {/* X icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Bác Đơn (Trảm) 💀
            </button>
          </>
        )}

        {/* Ngân's Actions: Share to Zalo */}
        {role === 'ngan' && (
          <button 
            className="card-btn"
            style={{ borderColor: 'rgba(0, 191, 255, 0.4)', color: 'rgba(0, 191, 255, 1)', background: 'rgba(0, 191, 255, 0.03)' }}
            onClick={() => onShareZalo(fault)}
            title="Gửi thông báo qua Zalo"
          >
            {/* Zalo / Message Icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Gửi Zalo
          </button>
        )}

        {/* Ngân's Actions: Delete Card */}
        {role === 'ngan' && (
          <button 
            className="card-btn delete"
            onClick={() => {
              if (confirm('Ngân có chắc chắn muốn xóa bản án này không? Dữ liệu sẽ mất vĩnh viễn.')) {
                onDelete(fault.id);
              }
            }}
            title="Xóa án phạt"
          >
            {/* Trash icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function WallOfShame({ faults, role, onAppealSubmit, onJudgeSubmit, onDeleteFault }) {
  const [appealingId, setAppealingId] = useState(null);
  const [appealReason, setAppealReason] = useState('');
  
  const [judgingId, setJudgingId] = useState(null);
  const [judgingType, setJudgingType] = useState(''); // forgiven or rejected
  const [adminNote, setAdminNote] = useState('');

  const [zoomedImage, setZoomedImage] = useState(null);
  const [zoomedCaption, setZoomedCaption] = useState('');

  const handleShareZalo = (fault) => {
    sound.playKeyboard();
    const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fault.amount);
    const shareText = `🚨 CẢNH BÁO BẢN ÁN MỚI! 🦖👿\n\nBảo vừa bị Ngân phán phạt -${formattedAmount} vì tội:\n👉 "${fault.title}"\n\nAnh có 24 giờ để vào tự bào chữa kêu oan, nếu không số tiền phạt sẽ bị cấn trừ vào ví sinh tồn vĩnh viễn!\n👉 Vào tự bào chữa ngay tại đây: ${window.location.origin}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Sổ Ghi Lỗi Của Anh Người Yêu Xấu Xa 🦖',
        text: shareText,
        url: window.location.origin
      }).catch(err => console.log('Share failed', err));
    } else {
      // Fallback: Copy to clipboard and open Zalo Web
      navigator.clipboard.writeText(shareText);
      alert('Đã sao chép nội dung thông báo vào bộ nhớ tạm! Hệ thống sẽ mở Zalo Web để bạn gửi tin nhắn cho Bảo.');
      window.open('https://chat.zalo.me/', '_blank');
    }
  };

  // Handle Appeal click - open prompt
  const handleOpenAppeal = (id) => {
    sound.playKeyboard();
    setAppealingId(id);
    setAppealReason('');
  };

  // Submit Appeal
  const handleAppealSend = (e) => {
    e.preventDefault();
    if (!appealReason.trim()) return;

    sound.playSad();
    onAppealSubmit(appealingId, appealReason.trim());
    setAppealingId(null);
    setAppealReason('');
  };

  // Handle judge click - open prompt
  const handleOpenJudge = (id, type) => {
    sound.playKeyboard();
    setJudgingId(id);
    setJudgingType(type);
    setAdminNote(type === 'forgiven' ? 'Ngoan ngoãn biết hối lỗi, tha!' : 'Lý do lươn lẹo, bác đơn phạt!');
  };

  // Submit Judge
  const handleJudgeSend = (e) => {
    e.preventDefault();
    
    if (judgingType === 'forgiven') {
      sound.playSuccess();
    } else {
      sound.playAlarm();
    }
    
    onJudgeSubmit(judgingId, judgingType, adminNote.trim());
    setJudgingId(null);
    setAdminNote('');
  };

  // Filter out any invalid items
  const validFaults = faults.filter(f => f && f.id);

  return (
    <div className="glass-panel shame-section">
      <h2>
        <span>Bức Tường Ô Nhục (Wall of Shame)</span>
        <span className="shame-counter">{validFaults.length} Bản Án</span>
      </h2>

      {validFaults.length === 0 ? (
        <div className="shame-empty">
          <div className="shame-empty-icon">🕊️</div>
          <p>Không có ghi nhận tội danh nào. Bảo đang sống một cuộc đời mẫu mực!</p>
        </div>
      ) : (
        <div className="faults-timeline">
          {validFaults.map(fault => (
            <FaultCard 
              key={fault.id}
              fault={fault}
              role={role}
              onAppeal={handleOpenAppeal}
              onJudge={handleOpenJudge}
              onDelete={onDeleteFault}
              onShareZalo={handleShareZalo}
              onZoomImage={(img, caption) => {
                sound.playKeyboard();
                setZoomedImage(img);
                setZoomedCaption(caption);
              }}
            />
          ))}
        </div>
      )}

      {/* Appeal Dialog Modal */}
      {appealingId && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content glow-border-yellow">
            <div className="modal-header">
              <h3>Đơn Kêu Oan Đẫm Lệ</h3>
              <button className="modal-close" onClick={() => setAppealingId(null)}>✕</button>
            </div>
            <form onSubmit={handleAppealSend}>
              <div className="form-group">
                <label>Nhập lời thanh minh biện hộ (Càng bi thương càng tốt)</label>
                <textarea
                  className="input-glow"
                  rows="4"
                  placeholder="Ví dụ: Anh bận dắt cụ già qua đường, điện thoại lại hết pin đúng lúc..."
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-action secondary" onClick={() => setAppealingId(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn-action mint" style={{ background: 'var(--cyber-yellow)' }}>
                  Gửi Kháng Cáo!
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Judgement Dialog Modal */}
      {judgingId && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ border: judgingType === 'forgiven' ? '1px solid var(--mint)' : '1px solid var(--crimson)', boxShadow: judgingType === 'forgiven' ? 'var(--shadow-neon-mint)' : 'var(--shadow-neon-crimson)' }}>
            <div className="modal-header">
              <h3>
                {judgingType === 'forgiven' ? 'Phê Duyệt Lời Tha Thứ' : 'Tuyên Án Bác Bỏ Kháng Cáo'}
              </h3>
              <button className="modal-close" onClick={() => setJudgingId(null)}>✕</button>
            </div>
            <form onSubmit={handleJudgeSend}>
              <div className="form-group">
                <label>Lời phê phán của Ngân (Gửi đến Tội đồ)</label>
                <textarea
                  className="input-glow"
                  rows="3"
                  placeholder={judgingType === 'forgiven' ? 'Tha thứ vì thái độ tốt...' : 'Phạt nặng thêm vì thói quanh co...'}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-action secondary" onClick={() => setJudgingId(null)}>
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className={`btn-action ${judgingType === 'forgiven' ? 'mint' : 'crimson'}`}
                >
                  Xác Nhận Phán Quyết!
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="modal-overlay" onClick={() => setZoomedImage(null)}>
          <div className="img-zoom-modal" onClick={e => e.stopPropagation()}>
            <img src={zoomedImage} alt="Hình phóng to" className="img-zoom-view" />
            <div className="img-zoom-caption">{zoomedCaption}</div>
            <button 
              className="btn-action secondary" 
              style={{ marginTop: '15px', maxWidth: '100px', padding: '6px 12px' }}
              onClick={() => setZoomedImage(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
