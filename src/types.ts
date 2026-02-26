export type Category = "work" | "study" | "personal" | "urgent";

export interface NotificationSettings {
  enabled: boolean;
  startBeforeMinutes: number; // Start notifying X minutes before deadline
  intervalMinutes: number;    // Repeat every Y minutes
}

export interface Todo {
  id: string;
  title: string;
  deadline?: Date;
  completed: boolean;
  createdAt: Date;
  category?: Category;
  notification?: NotificationSettings;
  lastNotifiedAt?: Date; // Track when the last notification was sent
  completedAt?: Date;
}
