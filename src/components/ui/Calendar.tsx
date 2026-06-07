import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
}

interface CustomSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: { value: number; label: string }[];
  placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find(o => o.value === value)?.label;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-2 py-1 flex items-center gap-1 font-heebo text-sm font-medium hover:bg-gray-100 rounded-md transition-colors focus:outline-none border border-transparent hover:border-gray-200"
      >
        <span>{selectedLabel}</span>
        <ChevronDown size={14} className="text-gray-500 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute top-full z-50 mt-1 max-h-[200px] w-max min-w-[120px] overflow-y-auto rounded-md border border-gray-200 bg-white shadow-md py-1 animate-in fade-in zoom-in-95 duration-100 scrollbar-thin">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                relative flex w-full cursor-pointer select-none items-center py-1.5 pl-8 pr-3 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-right
                ${option.value === value ? 'font-medium bg-gray-50 text-black' : 'text-gray-700'}
              `}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {option.value === value && <Check size={14} className="text-black" />}
              </span>
              <span className="flex-1 text-right">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Calendar: React.FC<CalendarProps> = ({ selected, onSelect, className }) => {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const currentYear = new Date().getFullYear();
  const targetYear = 2030;
  const startYear = currentYear - 1;
  const yearsCount = Math.max(5, targetYear - startYear + 1);
  const years = Array.from({ length: yearsCount }, (_, i) => startYear + i);

  const minYear = years[0];
  const maxYear = years[years.length - 1];

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const blanks = Array(firstDay).fill(null);

  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

  const isPrevDisabled = year === minYear && month === 0;
  const isNextDisabled = year === maxYear && month === 11;

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPrevDisabled) return;
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isNextDisabled) return;
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleSelect = (e: React.MouseEvent, date: Date) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelect) onSelect(date);
  };

  const handleMonthChange = (val: number) => {
    setCurrentMonth(new Date(year, val, 1));
  };

  const handleYearChange = (val: number) => {
    setCurrentMonth(new Date(val, month, 1));
  };

  const monthNames = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  const dayNames = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

  return (
    <div className={`p-4 bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-[320px] ${className}`}>
      <div className="flex items-center justify-between mb-4 gap-2">
        <button
          onClick={handlePrevMonth}
          disabled={isPrevDisabled}
          className={`p-1 rounded-lg transition-colors ${isPrevDisabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-600'}`}
          type="button"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-1 flex-1 justify-center">
            <CustomSelect
                value={month}
                onChange={handleMonthChange}
                options={monthNames.map((m, i) => ({ value: i, label: m }))}
            />

            <CustomSelect
                value={year}
                onChange={handleYearChange}
                options={years.map(y => ({ value: y, label: y.toString() }))}
            />
        </div>

        <button
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          className={`p-1 rounded-lg transition-colors ${isNextDisabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-600'}`}
          type="button"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {dayNames.map(d => (
          <div key={d} className="text-[13px] text-gray-400 font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-x-1 gap-y-0.5 min-h-[220px]">
        {blanks.map((_, i) => <div key={`blank-${i}`} />)}

        {days.map((date, idx) => {
          const isSelected = selected && date.toDateString() === selected.toDateString();
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <button
              key={idx}
              onClick={(e) => handleSelect(e, date)}
              type="button"
              className={`
                h-8 w-8 text-sm rounded-lg flex items-center justify-center transition-all relative
                ${isSelected
                  ? 'bg-black text-white shadow-md font-medium'
                  : 'hover:bg-gray-100 text-gray-700 font-normal'}
                ${isToday && !isSelected ? 'text-gold-primary font-bold bg-gold-primary/10' : ''}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
