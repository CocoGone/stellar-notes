const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

/** 本地日期 YYYY-MM-DD（按手机所在时区的“今天”） */
export function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dateLabel(date: string, withWeekday = true): string {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${m} 月 ${d} 日${withWeekday ? ` · ${weekday}` : ''}`;
}

const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 北京时间钟表读数大致对应的时辰（未做真太阳时校正，只作提示） */
export function shichenOf(hour: number, minute: number): string {
  const mins = hour * 60 + minute;
  const branch = mins >= 1380 || mins < 60 ? 0 : Math.floor((mins - 60) / 120) + 1;
  return `${SHICHEN[branch]}时`;
}
