// CalendarCard.jsx - Neon Cyberpunk Calendar displaying days with registered crimes
import React, { useState } from 'react';
import { sound } from './SoundManager';

export default function CalendarCard({ faults }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get active (not forgiven) fault dates
  const getFaultDatesMap = () => {
    const map = {};
    faults
      .filter(f => f.status !== 'forgiven')
      .forEach(f => {
        const d = new Date(f.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        map[key] = true;
      });
    return map;
  };

  const faultDatesMap = getFaultDatesMap();

  // Month navigation
  const prevMonth = () => {
    sound.playKeyboard();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    sound.playKeyboard();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  // Calendar rendering logic
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Get days of the previous month to pad the grid
  const prevDaysInMonth = getDaysInMonth(year, month - 1);

  const daysArray = [];

  // Pad previous month days
  // firstDay = 0 is Sunday, 1 is Monday...
  // In the layout, S M T W T F S: Sunday is first column
  for (let i = firstDay - 1; i >= 0; i--) {
    daysArray.push({
      day: prevDaysInMonth - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevDaysInMonth - i)
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    });
  }

  // Pad next month days to make complete rows of 7
  const totalCells = Math.ceil(daysArray.length / 7) * 7;
  const nextMonthPadding = totalCells - daysArray.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    daysArray.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  // Check if a day has active faults
  const hasFault = (date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return faultDatesMap[key] === true;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="glass-panel vital-card glow-border-mint" style={{ padding: '20px', display: 'block', minHeight: '310px' }}>
      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ fontFamily: 'var(--font-main)', fontWeight: 'bold', fontSize: '1.2rem', margin: 0 }}>
          {monthNames[month]} {year}
        </h3>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button 
            type="button" 
            className="settings-trigger" 
            onClick={prevMonth}
            style={{ padding: '4px 10px', fontSize: '1rem' }}
          >
            ‹
          </button>
          <button 
            type="button" 
            className="settings-trigger" 
            onClick={nextMonth}
            style={{ padding: '4px 10px', fontSize: '1rem' }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Week Day Labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(label => (
          <div key={label}>{label}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
        {daysArray.map((cell, idx) => {
          const badDay = hasFault(cell.date);
          const current = isToday(cell.date);

          let cellStyle = {
            padding: '8px 0',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-mono)',
            position: 'relative',
            cursor: 'default',
            transition: 'all 0.2s ease',
            color: cell.isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)'
          };

          if (badDay) {
            cellStyle = {
              ...cellStyle,
              background: 'var(--crimson-rgba)',
              color: 'white',
              fontWeight: 'bold',
              border: '1px solid var(--crimson)',
              boxShadow: '0 0 10px var(--crimson-rgba)'
            };
          } else if (current) {
            cellStyle = {
              ...cellStyle,
              background: 'rgba(0, 255, 187, 0.1)',
              color: 'var(--mint)',
              fontWeight: 'bold',
              border: '1px solid var(--mint)'
            };
          }

          return (
            <div 
              key={idx} 
              style={cellStyle}
              title={badDay ? 'Có lỗi lầm ghi nhận vào ngày này!' : undefined}
            >
              {cell.day}
              {badDay && (
                <span style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--crimson)' }}></span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '15px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--mint)', display: 'inline-block' }}></span>
          Hôm nay
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--crimson-rgba)', border: '1px solid var(--crimson)', display: 'inline-block' }}></span>
          Có lỗi phạt 😡
        </div>
      </div>
    </div>
  );
}
