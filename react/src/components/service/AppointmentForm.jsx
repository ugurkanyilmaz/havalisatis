import { useState, useMemo } from 'react';

// Çalışma saatleri: Hafta içi 08:00-18:00, Cumartesi 08:00-12:00, Pazar kapalı.

const HOURS = {
  weekday: { start: 8, end: 18 },
  saturday: { start: 8, end: 12 }
};

function isWeekend(date){
  const d = date.getDay(); // 0 pazar, 6 cumartesi
  return d === 0;
}

function isSaturday(date){
  return date.getDay() === 6;
}

export default function AppointmentForm(){
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('');
  const [note, setNote] = useState('');

  const hours = useMemo(()=>{
    if(!date) return [];
    const d = new Date(date + 'T00:00:00');
    if(isWeekend(d)) return [];
    const range = isSaturday(d) ? HOURS.saturday : HOURS.weekday;
    const list = [];
    for(let h = range.start; h < range.end; h++){
      list.push(`${String(h).padStart(2,'0')}:00`);
      list.push(`${String(h).padStart(2,'0')}:30`);
    }
    return list;
  }, [date]);

  function handleSubmit(e){
    e.preventDefault();
    alert('Randevu isteği (mock) : '+ JSON.stringify({date,hour,note}));
  }

  return (
    <div className="card-like">
      <h2>Randevu Al</h2>
      <p className="muted">Hafta içi 08:00-18:00 • Cumartesi 08:00-12:00 • Pazar kapalı</p>
      <form onSubmit={handleSubmit} className="appt-form">
        <label>Tarih
          <input type="date" value={date} onChange={e=>{setDate(e.target.value); setHour('');}} required />
        </label>
        <label>Saat
          <select value={hour} onChange={e=>setHour(e.target.value)} required disabled={!date || hours.length===0}>
            <option value="">Seçiniz</option>
            {hours.length===0 && date && <option value="" disabled>Uygun saat yok (Pazar?)</option>}
            {hours.map(h=> <option key={h} value={h}>{h}</option>)}
          </select>
        </label>
        <label>Not (opsiyonel)
          <textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Arıza / talep açıklaması" />
        </label>
        <button type="submit" disabled={!date || !hour}>Randevu Talep Et</button>
      </form>
    </div>
  );
}
