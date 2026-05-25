// App.jsx - Main Application Orchestrator
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import FaultForm from './components/FaultForm';
import WallOfShame from './components/WallOfShame';
import StatsArchive from './components/StatsArchive';
import SettingsModal from './components/SettingsModal';
import { db } from './supabaseClient';
import { sound } from './components/SoundManager';

export default function App() {
  // Application states
  const [role, setRole] = useState(null); // 'ngan', 'bao', or null
  const [pinInput, setPinInput] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [selectedRoleForPin, setSelectedRoleForPin] = useState(null);

  const [faults, setFaults] = useState([]);
  const [settings, setSettings] = useState(db.getSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' or 'archive'
  
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial settings and faults
  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Gọi getFaults trước vì nó sẽ tự động đồng bộ cấu hình từ Supabase về LocalStorage
        const loadedFaults = await db.getFaults();
        setFaults(loadedFaults);
        
        // 2. Sau đó nạp settings ra để giao diện nhận hạn mức ví và PIN mới nhất từ đám mây
        const loadedSettings = db.getSettings();
        setSettings(loadedSettings);
      } catch (err) {
        console.error('Failed to load application data:', err);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  // Poll for database changes every 10s if Supabase is active
  useEffect(() => {
    if (!settings.supabaseUrl || !settings.supabaseKey) return;

    const interval = setInterval(async () => {
      // Fetch và cập nhật lỗi
      const updatedFaults = await db.getFaults();
      setFaults(updatedFaults);
      
      // Đồng thời nạp lại cấu hình (hạn mức ví, PIN) từ đám mây vừa ghi đè vào LocalStorage
      const updatedSettings = db.getSettings();
      setSettings(updatedSettings);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [settings.supabaseUrl, settings.supabaseKey]);

  // Handle sound toggle
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Switch role and trigger PIN screen
  const handleRoleSwitchRequest = (newRole) => {
    sound.playKeyboard();
    setSelectedRoleForPin(newRole);
    setPinInput('');
    setShowPinScreen(true);
  };

  // Digital PIN Keyboard clicks
  const handleKeypadPress = (num) => {
    sound.playKeyboard();
    if (pinInput.length < 4) {
      const nextInput = pinInput + num;
      setPinInput(nextInput);

      // Auto-validate once 4 digits are entered
      if (nextInput.length === 4) {
        validatePin(nextInput);
      }
    }
  };

  const handleKeypadClear = () => {
    sound.playKeyboard();
    setPinInput('');
  };

  const handleKeypadCancel = () => {
    sound.playKeyboard();
    setShowPinScreen(false);
    setPinInput('');
  };

  // PIN validation logic
  const validatePin = (input) => {
    const expectedPin = selectedRoleForPin === 'ngan' ? settings.nganPin : settings.baoPin;
    
    if (input === expectedPin) {
      // Success! Unlock profile
      setTimeout(() => {
        sound.playSuccess();
        setRole(selectedRoleForPin);
        setPinVerified(true);
        setShowPinScreen(false);
        setPinInput('');
      }, 200);
    } else {
      // Failure! Alert and shake
      setTimeout(() => {
        sound.playSad();
        alert('Mã PIN không chính xác! Vui lòng thử lại. (Mẹo thử: Ngân: 1111, Bảo: 0000)');
        setPinInput('');
      }, 200);
    }
  };

  // Add fault (Ngân only)
  const handleAddFault = async (newFaultData) => {
    if (role !== 'ngan') return;
    
    sound.playCoin();
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const fault = { id, ...newFaultData };
    
    // Save to DB
    const saved = await db.saveFault(fault);
    
    // Refresh UI list
    const updatedFaults = await db.getFaults();
    setFaults(updatedFaults);
  };

  // Appeal / Kêu Oan (Bảo only)
  const handleAppealSubmit = async (id, appealReason) => {
    const faultToUpdate = faults.find(f => f.id === id);
    if (!faultToUpdate) return;

    const updatedFault = {
      ...faultToUpdate,
      status: 'appealed',
      appeal_reason: appealReason,
      appeal_at: new Date().toISOString()
    };

    await db.saveFault(updatedFault);
    
    const updatedFaults = await db.getFaults();
    setFaults(updatedFaults);
  };

  // Judge Appeal / Quyết định (Ngân only)
  const handleJudgeSubmit = async (id, judgmentType, adminNote) => {
    if (role !== 'ngan') return;

    const faultToUpdate = faults.find(f => f.id === id);
    if (!faultToUpdate) return;

    const updatedFault = {
      ...faultToUpdate,
      status: judgmentType, // 'forgiven' or 'rejected'
      admin_note: adminNote
    };

    await db.saveFault(updatedFault);
    
    const updatedFaults = await db.getFaults();
    setFaults(updatedFaults);
  };

  // Delete Fault (Ngân only)
  const handleDeleteFault = async (id) => {
    if (role !== 'ngan') return;
    
    sound.playKeyboard();
    await db.deleteFault(id);
    
    const updatedFaults = await db.getFaults();
    setFaults(updatedFaults);
  };

  // Save Settings
  const handleSaveSettings = async (newSettings) => {
    const saved = await db.saveSettings(newSettings);
    setSettings(saved);
    const loadedFaults = await db.getFaults();
    setFaults(loadedFaults);
  };

  // Reset database
  const handleResetAll = async () => {
    await db.resetFaults();
    setFaults([]);
  };

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const todayFaults = faults.filter(f => isToday(f.created_at));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '15px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0,255,187,0.1)', borderTopColor: 'var(--mint)', borderRadius: '50%', animation: 'spinner 1s linear infinite' }}></div>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>ĐANG KHỞI ĐỘNG SỔ NAM TÀO...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Header */}
      <header>
        <div className="logo-section">
          <h1>Sổ Nam Tào <span>Digital</span></h1>
          <div className="logo-subtitle">Hệ thống phán tội & Sinh tồn của Bảo</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Sound Toggle Button */}
          <button 
            className="settings-trigger" 
            onClick={handleToggleMute}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            )}
          </button>

          {/* Profile Switcher */}
          <div className="profile-switcher">
            <button 
              className={`profile-btn ${role === 'bao' ? 'active bao' : ''}`}
              onClick={() => handleRoleSwitchRequest('bao')}
            >
              👤 Bảo (Tội Đồ)
            </button>
            <button 
              className={`profile-btn ${role === 'ngan' ? 'active ngan' : ''}`}
              onClick={() => handleRoleSwitchRequest('ngan')}
            >
              👑 Ngân (Nam Tào)
            </button>
          </div>
        </div>
      </header>

      {/* Profile Intro / Alert for unauthenticated */}
      {!role && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', marginBottom: '30px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>📖💀</div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Chào mừng đến với Sổ Nam Tào Số Hóa</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 30px' }}>
            Nơi Ngân ghi nhận mọi lỗi lầm của Bảo để tính toán độ thâm hụt của ví sinh tồn. Vui lòng chọn tài khoản ở góc trên bên phải để bắt đầu trải nghiệm!
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button className="btn-action mint" style={{ maxWidth: '200px' }} onClick={() => handleRoleSwitchRequest('bao')}>
              Vào quyền Bảo (Xem tội)
            </button>
            <button className="btn-action crimson" style={{ maxWidth: '200px' }} onClick={() => handleRoleSwitchRequest('ngan')}>
              Vào quyền Ngân (Phán tội)
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '20px' }}>
            *Mã PIN mặc định: Ngân (<strong>1111</strong>), Bảo (<strong>0000</strong>)
          </p>
        </div>
      )}

      {/* Main App Content (Visible when profile is unlocked) */}
      {role && (
        <>
          <Dashboard 
            faults={faults} 
            settings={settings} 
            onOpenSettings={() => { sound.playKeyboard(); setShowSettings(true); }} 
          />

          <main className="main-content-layout" style={{ marginTop: '25px' }}>
            {/* Left Column - Form (Only visible to Ngân) */}
            {role === 'ngan' ? (
              <FaultForm onAddFault={handleAddFault} />
            ) : (
              <div className="glass-panel glow-border-mint" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛡️⚖️</div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>Tuyên Ngôn của Tội Đồ</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  "Anh cam kết sẽ nỗ lực sống lương thiện, rep tin nhắn trong 5s, yêu thương vô điều kiện và không bao giờ cãi lời vợ phán để duy trì số dư của ví sinh mạng!"
                </p>
                <div className="status-tag appealed" style={{ margin: '15px auto 0', fontSize: '0.8rem' }}>
                  Đang tích cực cải tạo 🤝
                </div>
              </div>
            )}

            {/* Right Column - Timeline or Statistics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Tab Toggles */}
              <div className="profile-switcher" style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <button 
                  type="button" 
                  className={`profile-btn ${activeTab === 'timeline' ? 'active bao' : ''}`}
                  onClick={() => { sound.playKeyboard(); setActiveTab('timeline'); }}
                  style={{ justifyContent: 'center' }}
                >
                  🔥 Án Hôm Nay ({todayFaults.length})
                </button>
                <button 
                  type="button" 
                  className={`profile-btn ${activeTab === 'archive' ? 'active ngan' : ''}`}
                  onClick={() => { sound.playKeyboard(); setActiveTab('archive'); }}
                  style={{ justifyContent: 'center' }}
                >
                  📊 Thống Kê & Lưu Trữ
                </button>
              </div>

              {activeTab === 'timeline' ? (
                <WallOfShame 
                  faults={todayFaults}
                  role={role}
                  onAppealSubmit={handleAppealSubmit}
                  onJudgeSubmit={handleJudgeSubmit}
                  onDeleteFault={handleDeleteFault}
                />
              ) : (
                <StatsArchive 
                  faults={faults}
                  role={role}
                  onAppeal={handleAppealSubmit}
                  onJudge={handleJudgeSubmit}
                  onDelete={handleDeleteFault}
                />
              )}
            </div>
          </main>
        </>
      )}

      {/* Digital PIN Pad Screen overlay */}
      {showPinScreen && (
        <div className="pin-overlay">
          <div className="glass-panel pin-modal glow-border-mint">
            <h3>Xác Minh Danh Tính</h3>
            <p>Nhập mã PIN của {selectedRoleForPin === 'ngan' ? 'Ngân (Admin)' : 'Bảo (Tội đồ)'}</p>
            
            {/* Dots indicators */}
            <div className="pin-inputs">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className={`pin-dot ${i < pinInput.length ? 'filled' : ''} ${selectedRoleForPin === 'bao' ? 'bao' : ''}`}
                ></div>
              ))}
            </div>

            {/* Keypad */}
            <div className="pin-keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                  key={num} 
                  type="button" 
                  className="keypad-btn"
                  onClick={() => handleKeypadPress(String(num))}
                >
                  {num}
                </button>
              ))}
              <button 
                type="button" 
                className="keypad-btn action"
                onClick={handleKeypadCancel}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="keypad-btn"
                onClick={() => handleKeypadPress('0')}
              >
                0
              </button>
              <button 
                type="button" 
                className="keypad-btn action"
                style={{ color: 'var(--crimson)' }}
                onClick={handleKeypadClear}
              >
                Xóa
              </button>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '20px' }}>
              Mẹo mặc định: Ngân là <strong>1111</strong>, Bảo là <strong>0000</strong>
            </p>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => { sound.playKeyboard(); setShowSettings(false); }}
          onResetAll={handleResetAll}
        />
      )}

      {/* Footer */}
      <footer>
        📖💀 Sổ Nam Tào Digital v1.0.0 • Chúc hai bạn luôn ngập tràn tiếng cười!
      </footer>
    </div>
  );
}
