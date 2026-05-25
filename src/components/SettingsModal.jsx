// SettingsModal.jsx - System configuration, PIN limits, and Supabase integration
import React, { useState } from 'react';
import { sound } from './SoundManager';
import { SUPABASE_SQL_SCHEMA } from '../supabaseClient';

export default function SettingsModal({ settings, onSave, onClose, onResetAll }) {
  const [monthlyBudget, setMonthlyBudget] = useState(settings.monthlyBudget);
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseKey, setSupabaseKey] = useState(settings.supabaseKey || '');
  const [nganPin, setNganPin] = useState(settings.nganPin || '1111');
  const [baoPin, setBaoPin] = useState(settings.baoPin || '0000');
  
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    sound.playSuccess();
    onSave({
      monthlyBudget: Number(monthlyBudget),
      supabaseUrl: supabaseUrl.trim(),
      supabaseKey: supabaseKey.trim(),
      nganPin: nganPin.trim(),
      baoPin: baoPin.trim()
    });
    onClose();
  };

  const handleCopySql = () => {
    sound.playKeyboard();
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content glow-border-mint" style={{ maxWidth: '550px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px var(--mint-glow))' }}>
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Cấu Hình Hệ Thống
          </h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Budget Limit */}
          <div className="form-group">
            <label htmlFor="settings-budget">Hạn mức "Ví Sinh Tồn" hàng tháng (VND)</label>
            <input
              id="settings-budget"
              type="number"
              className="input-glow"
              min="100000"
              max="50000000"
              step="100000"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(Number(e.target.value))}
              required
            />
          </div>

          {/* PIN codes section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label htmlFor="settings-ngan-pin">Mã PIN của Ngân (Admin)</label>
              <input
                id="settings-ngan-pin"
                type="text"
                maxLength="4"
                pattern="\d{4}"
                className="input-glow"
                style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }}
                value={nganPin}
                onChange={(e) => setNganPin(e.target.value.replace(/\D/g, ''))}
                required
                title="Yêu cầu nhập đúng 4 chữ số"
              />
            </div>
            <div className="form-group">
              <label htmlFor="settings-bao-pin">Mã PIN của Bảo (Tội đồ)</label>
              <input
                id="settings-bao-pin"
                type="text"
                maxLength="4"
                pattern="\d{4}"
                className="input-glow"
                style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }}
                value={baoPin}
                onChange={(e) => setBaoPin(e.target.value.replace(/\D/g, ''))}
                required
                title="Yêu cầu nhập đúng 4 chữ số"
              />
            </div>
          </div>

          {/* Supabase credentials */}
          <div className="form-group" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0 }}>Đồng bộ đám mây (Supabase)</label>
              <span className="status-tag" style={{ fontSize: '0.65rem', background: (supabaseUrl && supabaseKey) ? 'var(--mint-rgba)' : 'rgba(255,255,255,0.03)', color: (supabaseUrl && supabaseKey) ? 'var(--mint)' : 'var(--text-muted)' }}>
                {(supabaseUrl && supabaseKey) ? 'Đã bật' : 'Chạy Offline Local'}
              </span>
            </div>
            
            <p className="settings-help">
              Điền URL và Anon Key của Supabase để đồng bộ dữ liệu tức thời giữa 2 điện thoại của bạn và Ngân. Để trống nếu muốn lưu offline trên trình duyệt hiện tại.
            </p>

            <div className="form-group">
              <label htmlFor="settings-supabase-url" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supabase Project URL</label>
              <input
                id="settings-supabase-url"
                type="url"
                className="input-glow"
                placeholder="https://your-project-id.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="settings-supabase-key" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supabase Anon API Key</label>
              <input
                id="settings-supabase-key"
                type="password"
                className="input-glow"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
              />
            </div>

            {(supabaseUrl && supabaseKey) && (
              <div className="form-group">
                <button
                  type="button"
                  className="card-btn"
                  style={{ width: '100%', justifyContent: 'center', background: 'rgba(0,240,255,0.05)', borderColor: 'rgba(0,240,255,0.2)' }}
                  onClick={() => {
                    sound.playKeyboard();
                    setShowSql(!showSql);
                  }}
                >
                  {showSql ? 'Ẩn Hướng Dẫn Thiết Lập SQL' : 'Xem SQL Khởi Tạo Bảng Supabase'}
                </button>
                
                {showSql && (
                  <div style={{ marginTop: '10px' }}>
                    <p className="settings-help" style={{ fontSize: '0.75rem' }}>
                      Vào mục **SQL Editor** trong Supabase Dashboard, tạo Query mới, dán câu lệnh bên dưới và bấm **Run** để khởi tạo bảng:
                    </p>
                    <div className="sql-box">{SUPABASE_SQL_SCHEMA}</div>
                    <button
                      type="button"
                      className="card-btn approve"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={handleCopySql}
                    >
                      {copied ? 'Đã Sao Chép! ✓' : 'Sao Chép Mã SQL'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="form-group" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', marginTop: '15px' }}>
            <label style={{ color: 'var(--crimson)' }}>Vùng Nguy Hiểm</label>
            <button
              type="button"
              className="card-btn reject"
              style={{ width: '100%', justifyContent: 'center', marginTop: '5px' }}
              onClick={() => {
                if (confirm('CẢNH BÁO: Hành động này sẽ XÓA TOÀN BỘ lỗi phạt và reset ví sinh tồn về ban đầu. Bạn có chắc chắn muốn thực hiện?')) {
                  sound.playAlarm();
                  onResetAll();
                  onClose();
                }
              }}
            >
              Reset Toàn Bộ Dữ Liệu ⚠️
            </button>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn-action secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-action mint">
              Lưu Thiết Lập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
