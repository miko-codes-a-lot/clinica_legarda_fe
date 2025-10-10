export enum NotificationType {
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_STATUS_UPDATED = 'APPOINTMENT_STATUS_UPDATED',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
}

export interface Notification {
  _id: string;
  recipient: string;
  message: string;
  read: boolean;
  type: NotificationType;
  link?: string;
  triggeredBy?: string;
  createdAt: string; // Mongoose timestamps are sent as ISO date strings
  updatedAt: string;
}
