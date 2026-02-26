import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { format, isBefore, isToday, isTomorrow, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Check, AlertCircle, Calendar as CalendarIcon, Clock, Settings, Home } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { ProgressBar } from "@/src/components/ui/ProgressBar";
import { CalendarView } from "@/src/components/CalendarView";
import { cn } from "@/src/lib/utils";

import { Todo, Category } from "@/src/types";
import { themes, ThemeId } from "@/src/themes";
import { translations, Language } from "@/src/i18n";

const CATEGORIES: { value: Category; labelKey: keyof typeof translations.en; color: string }[] = [
  { value: "work", labelKey: "work", color: "bg-[#9CA3AF]" }, // Cool Gray
  { value: "study", labelKey: "study", color: "bg-[#D4C4B7]" }, // Warm Beige
  { value: "personal", labelKey: "life", color: "bg-[#B8C0C2]" }, // Muted Blue-Grey
  { value: "urgent", labelKey: "urgent", color: "bg-[#E5989B]" }, // Muted Red/Pink
];

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDeadline, setNewTodoDeadline] = useState("");
  const [newTodoCategory, setNewTodoCategory] = useState<Category>("personal");
  
  // Default notification settings: 30 mins before, every 10 mins
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notifyStartBefore, setNotifyStartBefore] = useState(30);
  const [notifyInterval, setNotifyInterval] = useState(10);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>("mono");
  const [currentLang, setCurrentLang] = useState<Language>("zh");
  const [currentView, setCurrentView] = useState<"home" | "calendar">("home");
  const [alertTodo, setAlertTodo] = useState<Todo | null>(null);
  const [alertedIds, setAlertedIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(new Date());

  const t = translations[currentLang];

  // Load theme and language from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("monodo-theme") as ThemeId;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    const savedLang = localStorage.getItem("monodo-lang") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "zh")) {
      setCurrentLang(savedLang);
    }
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem("monodo-theme", currentTheme);
  }, [currentTheme]);

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem("monodo-lang", currentLang);
  }, [currentLang]);

  // Request Notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Update time every second for progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load todos from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem("monodo-todos");
    if (savedTodos) {
      try {
        const parsed = JSON.parse(savedTodos);
        setTodos(
          parsed.map((t: any) => ({
            ...t,
            deadline: t.deadline ? new Date(t.deadline) : undefined,
            createdAt: new Date(t.createdAt),
            lastNotifiedAt: t.lastNotifiedAt ? new Date(t.lastNotifiedAt) : undefined,
            completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
          }))
        );
      } catch (e) {
        console.error("Failed to parse todos", e);
      }
    }
  }, []);

  // Save todos to localStorage
  useEffect(() => {
    localStorage.setItem("monodo-todos", JSON.stringify(todos));
  }, [todos]);

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'COMPLETE_TODO') {
          toggleTodo(event.data.todoId);
        }
      });
    }
  }, []);

  // Check for deadlines every minute
  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();
      
      // We need to update todos state if we send a notification (to update lastNotifiedAt)
      let todosUpdated = false;
      const updatedTodos = todos.map(todo => {
        if (todo.completed || !todo.deadline) return todo;

        const diff = todo.deadline.getTime() - now.getTime();
        const diffMinutes = Math.ceil(diff / 60000);

        // Logic 1: Custom Notification Settings
        if (todo.notification?.enabled) {
          const startMinutes = todo.notification.startBeforeMinutes;
          const intervalMinutes = todo.notification.intervalMinutes;

          // If within the start window (e.g. 30 mins before) AND not past deadline
          if (diffMinutes <= startMinutes && diffMinutes > 0) {
            const lastNotified = todo.lastNotifiedAt ? todo.lastNotifiedAt.getTime() : 0;
            const timeSinceLastNotify = now.getTime() - lastNotified;
            const intervalMs = intervalMinutes * 60 * 1000;

            // If never notified OR enough time has passed since last notification
            // We add a small buffer (1000ms) to avoid double firing due to slight timing differences
            if (lastNotified === 0 || timeSinceLastNotify >= intervalMs - 1000) {
              setAlertTodo(todo);
              
              // Send system notification
              if ("Notification" in window && Notification.permission === "granted") {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(t.gentleReminder, {
                      body: t.notifyBody1.replace("{title}", todo.title),
                      icon: "/vite.svg",
                      vibrate: [200, 100, 200],
                      tag: todo.id, // Prevent duplicate notifications
                      renotify: true, // Vibrate even if replacing an old notification
                      requireInteraction: true, // Keep notification until user interacts
                      data: { todoId: todo.id },
                      actions: [
                        { action: 'complete', title: t.markDone },
                        { action: 'snooze', title: t.snooze }
                      ]
                    } as any);
                  });
                } else {
                  // Fallback for no SW support
                  try {
                    new Notification(t.gentleReminder, {
                      body: t.notifyBody1.replace("{title}", todo.title),
                      icon: "/vite.svg",
                      vibrate: [200, 100, 200],
                    } as any);
                  } catch (e) {
                    console.error("Notification failed", e);
                  }
                }
              }

              todosUpdated = true;
              return { ...todo, lastNotifiedAt: now };
            }
          }
        }

        // Logic 2: Fallback/Legacy 15-min warning (only if no custom notification set or disabled)
        // This preserves the original behavior for tasks without specific settings
        if (!todo.notification?.enabled && diff > 0 && diff < 15 * 60 * 1000 && !alertedIds.has(todo.id)) {
            setAlertTodo(todo);
            setAlertedIds((prev) => new Set(prev).add(todo.id));
            
            if ("Notification" in window && Notification.permission === "granted") {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification(t.gentleReminder, {
                    body: t.notifyBody2.replace("{title}", todo.title),
                    icon: "/vite.svg",
                    vibrate: [200, 100, 200],
                    tag: todo.id,
                    renotify: true,
                    requireInteraction: true,
                    data: { todoId: todo.id },
                    actions: [
                      { action: 'complete', title: t.markDone },
                      { action: 'snooze', title: t.snooze }
                    ]
                  } as any);
                });
              } else {
                try {
                  new Notification(t.gentleReminder, {
                    body: t.notifyBody2.replace("{title}", todo.title),
                    icon: "/vite.svg",
                    vibrate: [200, 100, 200],
                  } as any);
                } catch (e) { console.error(e); }
              }
            }
        }

        return todo;
      });

      if (todosUpdated) {
        setTodos(updatedTodos);
      }
    };

    const interval = setInterval(checkDeadlines, 60000); // Check every minute
    // Initial check on mount/update to catch immediate deadlines
    checkDeadlines();
    
    return () => clearInterval(interval);
  }, [todos, alertedIds]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    const newTodo: Todo = {
      id: uuidv4(),
      title: newTodoTitle,
      deadline: newTodoDeadline ? new Date(newTodoDeadline) : undefined,
      completed: false,
      createdAt: new Date(),
      category: newTodoCategory,
      notification: {
        enabled: notificationEnabled,
        startBeforeMinutes: notifyStartBefore,
        intervalMinutes: notifyInterval,
      }
    };

    setTodos((prev) => [newTodo, ...prev]);
    setNewTodoTitle("");
    setNewTodoDeadline("");
    setNewTodoCategory("personal");
    // Reset notification settings to defaults
    setNotificationEnabled(true);
    setNotifyStartBefore(30);
    setNotifyInterval(10);
    
    setIsAddModalOpen(false);
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const isCompleted = !t.completed;
          return {
            ...t,
            completed: isCompleted,
            completedAt: isCompleted ? new Date() : undefined
          };
        }
        return t;
      })
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const sortedTodos = [...todos].sort((a, b) => {
    if (a.completed === b.completed) {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.getTime() - b.deadline.getTime();
    }
    return a.completed ? 1 : -1;
  });

  const topTodo = sortedTodos.find((t) => !t.completed);

  // Calculate time-based progress
  let progressValue = 0;
  let progressLabel = t.dayProgress;

  if (topTodo && topTodo.deadline) {
    const start = topTodo.createdAt.getTime();
    const end = topTodo.deadline.getTime();
    const current = now.getTime();
    
    if (end > start) {
      const total = end - start;
      const elapsed = current - start;
      progressValue = Math.min(100, Math.max(0, (elapsed / total) * 100));
    } else {
      progressValue = 100;
    }
    progressLabel = t.timeElapsed;
  } else {
    // Fallback to day progress if no task or no deadline
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const total = endOfDay.getTime() - startOfDay.getTime();
    const elapsed = now.getTime() - startOfDay.getTime();
    progressValue = (elapsed / total) * 100;
  }

  const theme = themes[currentTheme];

  return (
    <div 
      className="min-h-screen font-sans flex justify-center transition-colors duration-500"
      style={{
        backgroundColor: theme.colors.bg,
        color: theme.colors.textPrimary,
        // @ts-ignore
        "--theme-bg": theme.colors.bg,
        "--theme-card": theme.colors.card,
        "--theme-text-primary": theme.colors.textPrimary,
        "--theme-text-secondary": theme.colors.textSecondary,
        "--theme-accent": theme.colors.accent,
        "--theme-accent-fg": theme.colors.accentFg,
        "--theme-indicator": theme.colors.indicator,
        "--theme-border": theme.colors.border,
        "--theme-muted": theme.colors.muted,
      } as React.CSSProperties}
    >
      <div className="w-full max-w-md min-h-screen shadow-2xl relative flex flex-col transition-colors duration-500" style={{ backgroundColor: theme.colors.bg }}>
        
        {/* Header Section (Top 1/3) */}
        <div className="p-6 pb-2">
          <div className="p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border flex flex-col justify-between h-[35vh] relative overflow-hidden transition-colors duration-500"
               style={{ 
                 backgroundColor: theme.colors.card,
                 borderColor: theme.colors.muted,
                 color: theme.colors.textPrimary
               }}>
            
            {/* Top Controls */}
            <div className="absolute top-6 right-6 flex gap-3 z-20">
               {/* View Toggle */}
               <button 
                onClick={() => setCurrentView(currentView === "home" ? "calendar" : "home")}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
                style={{ color: theme.colors.textSecondary }}
                title={currentView === "home" ? t.calendar : t.home}
              >
                {currentView === "home" ? <CalendarIcon className="w-5 h-5" /> : <Home className="w-5 h-5" />}
              </button>

              {/* Settings Button */}
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
                style={{ color: theme.colors.textSecondary }}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Decorative Circle */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-80 blur-2xl pointer-events-none transition-colors duration-500"
                 style={{ backgroundColor: theme.colors.muted }} />
            
            <div className="relative z-10">
              <h1 className="text-3xl font-bold tracking-tight mb-1">MonoDo.</h1>
              <p className="text-sm font-light tracking-wide" style={{ color: theme.colors.textSecondary }}>{t.subtitle}</p>
            </div>

            <div className="relative z-10 mt-auto">
              {topTodo ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest" style={{ color: theme.colors.textSecondary }}>
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.colors.indicator }} />
                      {t.currentFocus}
                    </div>
                    {topTodo.category && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white",
                        CATEGORIES.find(c => c.value === topTodo.category)?.color
                      )}>
                        {t[CATEGORIES.find(c => c.value === topTodo.category)?.labelKey || "life"]}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-semibold leading-tight line-clamp-2">
                    {topTodo.title}
                  </h2>
                  {topTodo.deadline && (
                    <div className="flex items-center gap-2 text-sm font-mono w-fit px-3 py-1.5 rounded-lg transition-colors duration-500"
                         style={{ backgroundColor: theme.colors.muted, color: theme.colors.textSecondary }}>
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(topTodo.deadline, { addSuffix: true, locale: undefined })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="italic font-light" style={{ color: theme.colors.textSecondary }}>
                  {t.allCaughtUp}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          {currentView === "home" ? (
            <>
              {/* Progress Bar Section */}
              <div className="px-8 mt-2 relative z-20">
                <div className="p-1 rounded-full transition-colors duration-500" style={{ backgroundColor: theme.colors.muted }}>
                   <div className="h-1.5 w-full overflow-hidden rounded-full bg-transparent">
                     <div
                       className="h-full transition-all duration-500 ease-out"
                       style={{ 
                         width: `${Math.min(100, Math.max(0, progressValue))}%`,
                         backgroundColor: theme.colors.accent
                       }}
                     />
                   </div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                  <span>{progressLabel}</span>
                  <span>{progressValue.toFixed(1)}%</span>
                </div>
              </div>

              {/* Todo List */}
              <div className="flex-1 px-6 py-6 overflow-y-auto pb-24 space-y-4">
                <AnimatePresence mode="popLayout">
                  {sortedTodos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                      )}
                      style={{
                        backgroundColor: todo.completed ? theme.colors.muted : theme.colors.card,
                        borderColor: todo.completed ? 'transparent' : theme.colors.border,
                        opacity: todo.completed ? 0.6 : 1,
                        boxShadow: todo.completed ? 'none' : '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                      }}
                    >
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300",
                        )}
                        style={{
                          backgroundColor: todo.completed ? theme.colors.accent : 'transparent',
                          borderColor: todo.completed ? theme.colors.accent : theme.colors.border,
                        }}
                      >
                        {todo.completed && <Check className="w-3.5 h-3.5" style={{ color: theme.colors.accentFg }} />}
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
                          className={cn(
                            "text-sm font-medium truncate transition-all duration-300",
                            todo.completed ? "line-through" : ""
                          )}
                          style={{ 
                            color: todo.completed ? theme.colors.textSecondary : theme.colors.textPrimary,
                            textDecorationColor: theme.colors.textSecondary
                          }}
                        >
                          {todo.title}
                        </p>
                        {todo.deadline && (
                          <p className={cn(
                            "text-xs mt-0.5 flex items-center gap-1",
                          )}
                          style={{
                            color: isBefore(todo.deadline, new Date()) && !todo.completed ? '#ef4444' : theme.colors.textSecondary
                          }}>
                            <CalendarIcon className="w-3 h-3" />
                            {format(todo.deadline, "MMM d, h:mm a")}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 transition-all focus:opacity-100"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        <Trash2 className="w-4 h-4 hover:text-red-500" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {todos.length === 0 && (
                  <div className="text-center py-12" style={{ color: theme.colors.textSecondary }}>
                    <p className="text-sm">{t.noTasks}</p>
                    <p className="text-xs mt-1 opacity-60">{t.tapToAdd}</p>
                  </div>
                )}
              </div>

              {/* Floating Action Button */}
              <div className="absolute bottom-8 right-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-colors ring-4 ring-white/50"
                  style={{ 
                    backgroundColor: theme.colors.accent, 
                    color: theme.colors.accentFg 
                  }}
                >
                  <Plus className="w-6 h-6" />
                </motion.button>
              </div>
            </>
          ) : (
            <CalendarView 
              todos={todos} 
              theme={theme} 
              currentLang={currentLang}
              onToggleTodo={toggleTodo}
            />
          )}
        </div>

        {/* Add Task Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl"
              style={{ backgroundColor: theme.colors.card }}
            >
              <h2 className="text-xl font-bold mb-6" style={{ color: theme.colors.textPrimary }}>{t.newTask}</h2>
              <form onSubmit={handleAddTodo} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.colors.textSecondary }}>
                    {t.whatToDo}
                  </label>
                  <Input
                    autoFocus
                    placeholder={t.placeholder}
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    className="border-transparent focus:border-neutral-200"
                    style={{ backgroundColor: theme.colors.muted, color: theme.colors.textPrimary }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.colors.textSecondary }}>
                    {t.category}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setNewTodoCategory(cat.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                        )}
                        style={{
                          backgroundColor: newTodoCategory === cat.value ? theme.colors.accent : theme.colors.card,
                          color: newTodoCategory === cat.value ? theme.colors.accentFg : theme.colors.textSecondary,
                          borderColor: newTodoCategory === cat.value ? theme.colors.accent : theme.colors.border
                        }}
                      >
                        {t[cat.labelKey]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.colors.textSecondary }}>
                    {t.deadline}
                  </label>
                  <Input
                    type="datetime-local"
                    value={newTodoDeadline}
                    onChange={(e) => setNewTodoDeadline(e.target.value)}
                    className="border-transparent focus:border-neutral-200"
                    style={{ backgroundColor: theme.colors.muted, color: theme.colors.textPrimary }}
                  />
                </div>

                {/* Notification Settings */}
                {newTodoDeadline && (
                  <div className="p-4 rounded-xl space-y-3 transition-all" style={{ backgroundColor: theme.colors.muted }}>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium uppercase tracking-wider flex items-center gap-2" style={{ color: theme.colors.textSecondary }}>
                        <AlertCircle className="w-3.5 h-3.5" />
                        {t.reminders}
                      </label>
                      <button
                        type="button"
                        onClick={() => setNotificationEnabled(!notificationEnabled)}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-colors duration-300",
                          notificationEnabled ? "bg-emerald-500" : "bg-neutral-300"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm",
                          notificationEnabled ? "left-6" : "left-1"
                        )} />
                      </button>
                    </div>

                    {notificationEnabled && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[10px] font-medium uppercase tracking-wider mb-1 opacity-70" style={{ color: theme.colors.textSecondary }}>
                            {t.startBefore}
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={notifyStartBefore}
                            onChange={(e) => setNotifyStartBefore(parseInt(e.target.value) || 30)}
                            className="h-8 text-sm border-transparent bg-white/50 focus:bg-white"
                            style={{ color: theme.colors.textPrimary }}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium uppercase tracking-wider mb-1 opacity-70" style={{ color: theme.colors.textSecondary }}>
                            {t.repeatEvery}
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={notifyInterval}
                            onChange={(e) => setNotifyInterval(parseInt(e.target.value) || 10)}
                            className="h-8 text-sm border-transparent bg-white/50 focus:bg-white"
                            style={{ color: theme.colors.textPrimary }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 mt-8 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="flex-1" style={{ color: theme.colors.textSecondary }}>
                    {t.cancel}
                  </Button>
                  <Button type="submit" className="flex-1" style={{ backgroundColor: theme.colors.accent, color: theme.colors.accentFg }}>
                    {t.addTask}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Settings Modal */}
        <Modal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          title={t.settings}
        >
          <div className="space-y-6">
            {/* Language Settings */}
            <div>
              <h3 className="text-sm font-medium mb-3 uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>{t.language}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentLang("en")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all border",
                    currentLang === "en" ? "border-transparent" : "border-neutral-200"
                  )}
                  style={{
                    backgroundColor: currentLang === "en" ? theme.colors.accent : "transparent",
                    color: currentLang === "en" ? theme.colors.accentFg : theme.colors.textPrimary,
                  }}
                >
                  English
                </button>
                <button
                  onClick={() => setCurrentLang("zh")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all border",
                    currentLang === "zh" ? "border-transparent" : "border-neutral-200"
                  )}
                  style={{
                    backgroundColor: currentLang === "zh" ? theme.colors.accent : "transparent",
                    color: currentLang === "zh" ? theme.colors.accentFg : theme.colors.textPrimary,
                  }}
                >
                  中文
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3 uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>{t.appearance}</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(themes).map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setCurrentTheme(th.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                      currentTheme === th.id ? "ring-2 ring-offset-2" : "hover:bg-black/5"
                    )}
                    style={{ 
                      backgroundColor: th.colors.bg,
                      borderColor: th.colors.border,
                      ringColor: theme.colors.accent
                    }}
                  >
                    <div className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center" style={{ backgroundColor: th.colors.accent }}>
                       {currentTheme === th.id && <Check className="w-4 h-4" style={{ color: th.colors.accentFg }} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: th.colors.textPrimary }}>
                        {t[th.id as keyof typeof t]}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t" style={{ borderColor: theme.colors.border }}>
               <p className="text-xs text-center" style={{ color: theme.colors.textSecondary }}>
                 {t.version}
               </p>
            </div>
          </div>
        </Modal>

        {/* Alert Modal */}
        <Modal
          isOpen={!!alertTodo}
          onClose={() => setAlertTodo(null)}
          title={t.gentleReminder}
        >
          <div className="text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors" style={{ backgroundColor: theme.colors.muted, color: theme.colors.textSecondary }}>
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm mb-2" style={{ color: theme.colors.textSecondary }}>
              {t.timeIsUp}
            </p>
            <h3 className="text-lg font-medium mb-6 px-4 leading-snug" style={{ color: theme.colors.textPrimary }}>
              "{alertTodo?.title}"
            </h3>
            
            <p className="text-xs mb-8 opacity-70 whitespace-pre-line" style={{ color: theme.colors.textSecondary }}>
              {t.alertBody}
            </p>

            <div className="space-y-3">
              <Button
                className="w-full hover:opacity-90 rounded-xl py-6"
                style={{ backgroundColor: theme.colors.accent, color: theme.colors.accentFg }}
                onClick={() => {
                  if (alertTodo) {
                    toggleTodo(alertTodo.id);
                    setAlertTodo(null);
                  }
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                {t.markDone}
              </Button>
              <Button
                variant="ghost"
                className="w-full rounded-xl py-6 hover:bg-black/5"
                onClick={() => setAlertTodo(null)}
                style={{ color: theme.colors.textSecondary }}
              >
                {t.snooze}
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
}
