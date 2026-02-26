export type Language = "en" | "zh";

export const translations = {
  en: {
    // Categories
    work: "Work",
    study: "Study",
    life: "Life",
    urgent: "Urgent",
    
    // Themes
    mono: "Cloud (White)",
    warm: "Latte (Coffee)",
    morandiBlue: "Haze (Blue)",
    morandiGreen: "Sage (Green)",
    morandiPink: "Dusty (Pink)",
    morandiOlive: "Taro (Purple)",
    
    // Header
    subtitle: "Focus on what matters.",
    currentFocus: "Current Focus",
    timeElapsed: "Time Elapsed",
    dayProgress: "Day Progress",
    allCaughtUp: "All caught up. Time to relax.",
    
    // Empty State
    noTasks: "No tasks yet.",
    tapToAdd: "Tap + to add one.",
    
    // Add Modal
    newTask: "New Task",
    whatToDo: "What needs to be done?",
    placeholder: "e.g. Buy groceries",
    category: "Category",
    deadline: "Deadline (Optional)",
    reminders: "Reminders",
    startBefore: "Start Before (min)",
    repeatEvery: "Repeat Every (min)",
    cancel: "Cancel",
    addTask: "Add Task",
    
    // Settings Modal
    settings: "Settings",
    appearance: "Appearance",
    language: "Language",
    version: "MonoDo v1.0",
    
    // Alert Modal
    gentleReminder: "Gentle Reminder",
    timeIsUp: "It's time for your scheduled task",
    alertBody: "If you're done, mark it complete.\nIf you need more time, that's okay too.",
    markDone: "I'm Done",
    snooze: "Snooze",
    
    // Notifications
    notifyBody1: "It's time for \"{title}\". Remember to take a break.",
    notifyBody2: "Time is up for \"{title}\". Take it at your own pace.",
  },
  zh: {
    // Categories
    work: "工作",
    study: "学习",
    life: "生活",
    urgent: "紧急",
    
    // Themes
    mono: "云朵 (白色)",
    warm: "拿铁 (咖色)",
    morandiBlue: "雾霾 (蓝灰)",
    morandiGreen: "豆沙 (灰绿)",
    morandiPink: "烟灰 (粉灰)",
    morandiOlive: "香芋 (淡紫)",
    
    // Header
    subtitle: "专注当下，即刻行动。",
    currentFocus: "当前聚焦",
    timeElapsed: "时间流逝",
    dayProgress: "今日进度",
    allCaughtUp: "暂无任务，享受当下。",
    
    // Empty State
    noTasks: "暂无任务",
    tapToAdd: "点击 + 添加一个吧",
    
    // Add Modal
    newTask: "新建任务",
    whatToDo: "要做什么？",
    placeholder: "例如：买牛奶",
    category: "分类",
    deadline: "截止时间 (可选)",
    reminders: "提醒设置",
    startBefore: "提前 (分钟)",
    repeatEvery: "重复间隔 (分钟)",
    cancel: "取消",
    addTask: "添加任务",
    
    // Settings Modal
    settings: "设置",
    appearance: "外观主题",
    language: "语言设置",
    version: "MonoDo v1.0",
    
    // Alert Modal
    gentleReminder: "温馨提醒",
    timeIsUp: "您设定的时间到了",
    alertBody: "如果已经完成，可以标记一下。\n如果还需要时间，也没关系。",
    markDone: "我已完成",
    snooze: "稍后再说",
    
    // Notifications
    notifyBody1: "\"{title}\" 的预定时间到了，记得休息一下。",
    notifyBody2: "\"{title}\" 的时间快到了，按自己的节奏来就好。",
  }
};
