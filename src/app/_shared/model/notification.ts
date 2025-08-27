import { User } from "./user"

export interface Notification {
  _id: string
  type: string
  timestamp: Date
  message: string
  isRead: boolean
  targetUser: string
  createdBy: User
}