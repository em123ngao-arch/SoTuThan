// FaultForm.jsx - Input Form for Ngân (Admin) to log faults
import React, { useState } from 'react';
import { sound } from './SoundManager';

const PRESETS = [
  { title: '⏱️ Trả lời tin nhắn chậm', amount: 20000 },
  { title: '💔 Quên chúc ngủ ngon', amount: 30000 },
  { title: '🙄 Cãi lời vợ phán (Lươn lẹo)', amount: 100000 },
  { title: '🍺 Đi nhậu về quá giờ', amount: 150000 },
  { title: '🧹 Quên làm việc nhà được giao', amount: 50000 },
  { title: '😠 Thái độ lồi lõm khó ưa', amount: 80000 },
];

export default function FaultForm({ onAddFault }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(50000); // 50k default
  const [evidence, setEvidence] = useState('');
  const [activePreset, setActivePreset] = useState(null);

  // Handle Preset Click
  const handlePresetSelect = (preset, idx) => {
    sound.playKeyboard();
    setTitle(preset.title);
    setAmount(preset.amount);
    setActivePreset(idx);
  };

  // Convert uploaded image to Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    sound.playKeyboard();
    const reader = new FileReader();
    reader.onloadend = () => {
      setEvidence(reader.result); // Base64 encoding
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      sound.playKeyboard();
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidence(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Trigger Callback to add fault
    onAddFault({
      title: title.trim(),
      amount: Number(amount),
      evidence,
      created_at: new Date().toISOString(),
      status: 'pending', // default pending (waiting for 24h appeal)
      appeal_reason: '',
      appeal_at: null,
      admin_note: ''
    });

    // Reset Form
    setTitle('');
    setAmount(50000);
    setEvidence('');
    setActivePreset(null);
  };

  return (
    <div className="glass-panel form-section glow-border-crimson">
      <h2>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--crimson)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px var(--crimson-glow))' }}>
          <path d="M12 2L2 22h20L12 2z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Khởi Tố Lỗi Lầm Mới
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Presets Row */}
        <div className="form-group">
          <label>Chọn lỗi nhanh</label>
          <div className="presets-grid">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className={`preset-chip ${activePreset === idx ? 'active' : ''}`}
                onClick={() => handlePresetSelect(preset, idx)}
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Title Input */}
        <div className="form-group">
          <label htmlFor="fault-title">Tên tội danh</label>
          <input
            id="fault-title"
            type="text"
            className="input-glow"
            placeholder="Ví dụ: Lơ là lời dặn dò, trả lời cụt lủn..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setActivePreset(null);
            }}
            required
          />
        </div>

        {/* Penalty Slider */}
        <div className="form-group">
          <label htmlFor="penalty-amount">Mức phạt (VND)</label>
          <div className="slider-container">
            <input
              id="penalty-amount"
              type="range"
              min="10000"
              max="500000"
              step="10000"
              className="range-slider"
              value={amount}
              onChange={(e) => {
                setAmount(Number(e.target.value));
                setActivePreset(null);
              }}
            />
            <span className="slider-val-display">
              -{new Intl.NumberFormat('vi-VN').format(amount)}đ
            </span>
          </div>
        </div>

        {/* Evidence Image Upload */}
        <div className="form-group">
          <label>Bằng chứng buộc tội (Hình ảnh)</label>
          {!evidence ? (
            <div 
              className="upload-area"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('evidence-file').click()}
            >
              <div className="upload-icon">📸</div>
              <div className="upload-text">Kéo thả ảnh vào đây hoặc click để chọn file</div>
              <input
                id="evidence-file"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>
          ) : (
            <div className="evidence-preview-container">
              <img src={evidence} alt="Bằng chứng hiện trường" className="evidence-preview" />
              <button 
                type="button" 
                className="remove-img-btn"
                onClick={() => {
                  sound.playKeyboard();
                  setEvidence('');
                }}
                title="Xóa hình ảnh"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" className="btn-action crimson">
          {/* Hammer/Gavel SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6v7h8.5z"/>
            <path d="M13 9v13"/>
            <path d="M6 5H2v1h4z"/>
            <path d="M22 17h-8"/>
          </svg>
          Duyệt Bản Án!
        </button>
      </form>
    </div>
  );
}
