import React, { useState, useMemo } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  isToday 
} from "date-fns";
import { ChevronLeft, ChevronRight, Check, Calendar as CalendarIcon, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { Todo, Category } from "@/src/types";
import { Theme } from "@/src/themes";
import { translations, Language } from "@/src/i18n";

interface CalendarViewProps {
  todos: Todo[];
  theme: Theme;
  currentLang: Language;
  onToggleTodo: (id: string) => void;
}

const CATEGORIES: { value: Category; labelKey: keyof typeof translations.en; color: string }[] = [
  { value: "work", labelKey: "work", color: "bg-[#9CA3AF]" },
  { value: "study", labelKey: "study", color: "bg-[#D4C4B7]" },
  { value: "personal", labelKey: "life", color: "bg-[#B8C0C2]" },
  { value: "urgent", labelKey: "urgent", color: "bg-[#E5989B]" },
];

export function CalendarView({ todos, theme, currentLang, onToggleTodo }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const t = translations[currentLang] as any;

  // Generate calendar days
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  }, [currentMonth]);

  // Filter todos for the selected date
  const selectedDateTodos = useMemo(() => {
    return {
      scheduled: todos.filter(t => t.deadline && isSameDay(t.deadline, selectedDate) && !t.completed),
      completed: todos.filter(t => t.completed && t.completedAt && isSameDay(t.completedAt, selectedDate)),
      // Fallback for completed items without completedAt (legacy data): use createdAt if completed
      legacyCompleted: todos.filter(t => t.completed && !t.completedAt && isSameDay(t.createdAt, selectedDate)),
      created: todos.filter(t => isSameDay(t.createdAt, selectedDate) && !t.completed && !t.deadline),
    };
  }, [todos, selectedDate]);

  // Check if a date has events
  const hasEvents = (date: Date) => {
    return todos.some(t => {
      const isDeadline = t.deadline && isSameDay(t.deadline, date) && !t.completed;
      const isCompleted = t.completed && t.completedAt && isSameDay(t.completedAt, date);
      const isLegacyCompleted = t.completed && !t.completedAt && isSameDay(t.createdAt, date);
      return isDeadline || isCompleted || isLegacyCompleted;
    });
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
            style={{ color: theme.colors.textSecondary }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
            style={{ color: theme.colors.textSecondary }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="px-6 mb-6">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div 
              key={i} 
              className="text-center text-xs font-medium py-2"
              style={{ color: theme.colors.textSecondary }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-y-2">
          {days.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const hasDot = hasEvents(day);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm transition-all",
                  !isCurrentMonth && "opacity-30"
                )}
                style={{
                  backgroundColor: isSelected ? theme.colors.accent : 'transparent',
                  color: isSelected ? theme.colors.accentFg : (isTodayDate ? theme.colors.accent : theme.colors.textPrimary),
                  fontWeight: isSelected || isTodayDate ? 600 : 400,
                }}
              >
                {format(day, "d")}
                
                {/* Event Dot */}
                {hasDot && !isSelected && (
                  <div 
                    className="absolute bottom-1.5 w-1 h-1 rounded-full"
                    style={{ backgroundColor: theme.colors.indicator }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Tasks */}
      <div className="flex-1 px-6 py-4 overflow-y-auto border-t" style={{ borderColor: theme.colors.border }}>
        <h3 className="text-sm font-medium mb-4 uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
          {format(selectedDate, "MMMM d, yyyy")}
        </h3>

        <div className="space-y-6 pb-20">
          {/* Scheduled Section */}
          {selectedDateTodos.scheduled.length > 0 && (
            <div>
              <h4 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: theme.colors.textSecondary }}>
                <Clock className="w-3 h-3" />
                {t.scheduled}
              </h4>
              <div className="space-y-2">
                {selectedDateTodos.scheduled.map(todo => (
                  <TodoItem key={todo.id} todo={todo} theme={theme} t={t} onToggle={() => onToggleTodo(todo.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Section */}
          {(selectedDateTodos.completed.length > 0 || selectedDateTodos.legacyCompleted.length > 0) && (
            <div>
              <h4 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: theme.colors.textSecondary }}>
                <Check className="w-3 h-3" />
                {t.completed}
              </h4>
              <div className="space-y-2">
                {selectedDateTodos.completed.map(todo => (
                  <TodoItem key={todo.id} todo={todo} theme={theme} t={t} onToggle={() => onToggleTodo(todo.id)} />
                ))}
                {selectedDateTodos.legacyCompleted.map(todo => (
                  <TodoItem key={todo.id} todo={todo} theme={theme} t={t} onToggle={() => onToggleTodo(todo.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Created Section (Optional, for tasks without deadline created on this day) */}
          {selectedDateTodos.created.length > 0 && (
            <div>
              <h4 className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: theme.colors.textSecondary }}>
                <CalendarIcon className="w-3 h-3" />
                {t.created}
              </h4>
              <div className="space-y-2">
                {selectedDateTodos.created.map(todo => (
                  <TodoItem key={todo.id} todo={todo} theme={theme} t={t} onToggle={() => onToggleTodo(todo.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {selectedDateTodos.scheduled.length === 0 && 
           selectedDateTodos.completed.length === 0 && 
           selectedDateTodos.legacyCompleted.length === 0 && 
           selectedDateTodos.created.length === 0 && (
            <div className="text-center py-8 opacity-50" style={{ color: theme.colors.textSecondary }}>
              {t.noEvents}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TodoItemProps {
  todo: Todo;
  theme: Theme;
  t: any;
  onToggle: () => void;
}

function TodoItem({ todo, theme, t, onToggle }: TodoItemProps) {
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-xl border transition-all"
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
        opacity: todo.completed ? 0.6 : 1,
      }}
    >
      <button
        onClick={onToggle}
        className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          backgroundColor: todo.completed ? theme.colors.accent : 'transparent',
          borderColor: todo.completed ? theme.colors.accent : theme.colors.border,
        }}
      >
        {todo.completed && <Check className="w-3 h-3" style={{ color: theme.colors.accentFg }} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {todo.category && (
            <span className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider text-white",
              CATEGORIES.find(c => c.value === todo.category)?.color || "bg-neutral-400"
            )}>
              {t[CATEGORIES.find(c => c.value === todo.category)?.labelKey || "life"]}
            </span>
          )}
        </div>
        <p 
          className={cn("text-sm font-medium truncate", todo.completed && "line-through")}
          style={{ 
            color: todo.completed ? theme.colors.textSecondary : theme.colors.textPrimary,
            textDecorationColor: theme.colors.textSecondary
          }}
        >
          {todo.title}
        </p>
      </div>
    </div>
  );
}
