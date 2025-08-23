import * as React from "react"
import { Bell, Check, X, DollarSign, MessageCircle, FileText, Gavel } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "../../utils"

interface Notification {
  id: string
  type: "request_accepted" | "request_rejected" | "payment_confirmed" | "new_message" | "document_added" | "lawyer_approved" | "lawyer_rejected"
  title: string
  message: string
  timestamp: Date
  read: boolean
  metadata?: {
    groupId?: number
    documentId?: number
    lawyerName?: string
    amount?: number
  }
}

// Mock notification data based on the lawyer system
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "request_accepted",
    title: "Request Accepted",
    message: "Your request to Corporate Law Group has been accepted by Sarah Johnson",
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    read: false,
    metadata: {
      groupId: 1,
      lawyerName: "Sarah Johnson"
    }
  },
  {
    id: "2",
    type: "payment_confirmed",
    title: "Payment Confirmed",
    message: "Your payment of $50 for Contract Template document has been processed",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    read: false,
    metadata: {
      documentId: 123,
      amount: 50
    }
  },
  {
    id: "3",
    type: "new_message",
    title: "New Message",
    message: "Michael Chen sent a message in Business Formation Group",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    read: true,
    metadata: {
      groupId: 2,
      lawyerName: "Michael Chen"
    }
  },
  {
    id: "4",
    type: "document_added",
    title: "New Document Added",
    message: "Privacy Policy Template has been added to your group",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: true,
    metadata: {
      groupId: 1,
      documentId: 124
    }
  },
  {
    id: "5",
    type: "lawyer_approved",
    title: "Application Approved",
    message: "Congratulations! Your lawyer application has been approved",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    read: true
  },
  {
    id: "6",
    type: "request_rejected",
    title: "Request Declined",
    message: "Your request to Family Law Experts was declined",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: true,
    metadata: {
      groupId: 3
    }
  }
]

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "request_accepted":
      return <Check className="h-4 w-4 text-green-500" />
    case "request_rejected":
      return <X className="h-4 w-4 text-red-500" />
    case "payment_confirmed":
      return <DollarSign className="h-4 w-4 text-green-500" />
    case "new_message":
      return <MessageCircle className="h-4 w-4 text-blue-500" />
    case "document_added":
      return <FileText className="h-4 w-4 text-purple-500" />
    case "lawyer_approved":
      return <Gavel className="h-4 w-4 text-green-500" />
    case "lawyer_rejected":
      return <Gavel className="h-4 w-4 text-red-500" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

function formatTimestamp(timestamp: Date) {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return timestamp.toLocaleDateString()
}

export function NotificationBell() {
  const [notifications, setNotifications] = React.useState<Notification[]>(mockNotifications)
  const [isOpen, setIsOpen] = React.useState(false)
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }
  
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }
  
  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer group",
                  !notification.read && "bg-blue-50"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={cn(
                        "text-sm",
                        !notification.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                      )}>
                        {notification.title}
                      </h4>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          clearNotification(notification.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="h-3 w-3 text-gray-400" />
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="border-t p-2">
            <button className="w-full text-center text-sm text-gray-600 hover:text-gray-800 py-2 transition-colors">
              View all notifications
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
