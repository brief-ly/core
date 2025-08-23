import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Users, FileText, Send, ChevronLeft, Shield, Clock, CheckCircle, DollarSign, ArrowLeft } from "lucide-react";
import { cn, truncateText } from "@/src/lib/utils/utils";
import { Button } from "@/src/lib/components/ui/button";
import { Input } from "@/src/lib/components/ui/input";
import { useApi } from "@/src/lib/hooks/use-api";
import { toast } from "sonner";
import Layout from "../layout";
import LawyerProfile from "./LawyerProfile";
import DocumentList from "./DocumentList";
import MessageInput from "./MessageInput";

// Mock data for the conversation
const mockMessages = [
  {
    id: 1,
    senderId: "system",
    senderName: "System",
    messageContent: "Welcome to your legal consultation group! You've been matched with expert lawyers who can help with your case.",
    messageType: "system" as const,
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    senderType: "system"
  },
  {
    id: 2,
    senderId: "1",
    senderName: "Sarah Chen",
    messageContent: "Hello Kartik! I've reviewed your initial request about your employment contract dispute. I specialize in employment law and I'm here to help guide you through this process.",
    messageType: "text" as const,
    createdAt: new Date(Date.now() - 7000000).toISOString(),
    senderType: "lawyer"
  },
  {
    id: 3,
    senderId: "2", 
    senderName: "Michael Rodriguez",
    messageContent: "Hi there! As the lead attorney for this group, I want to assure you that we'll work together to achieve the best possible outcome for your case. Can you share more details about the specific clauses in your contract that are concerning you?",
    messageType: "text" as const,
    createdAt: new Date(Date.now() - 6800000).toISOString(),
    senderType: "lawyer"
  },
  {
    id: 4,
    senderId: "kartik",
    senderName: "Kartik",
    messageContent: "Thank you both! The main issue is with the non-compete clause - it seems overly restrictive and prevents me from working in my field for 2 years after leaving. Also, there's a clause about intellectual property that I'm not comfortable with.",
    messageType: "text" as const,
    createdAt: new Date(Date.now() - 6600000).toISOString(),
    senderType: "client"
  },
  {
    id: 5,
    senderId: "3",
    senderName: "Jennifer Park",
    messageContent: "Great question! Non-compete clauses have specific enforceability requirements that vary by state. I'll prepare a document outlining your rights and potential strategies for negotiation.",
    messageType: "text" as const,
    createdAt: new Date(Date.now() - 6400000).toISOString(),
    senderType: "lawyer"
  },
  {
    id: 6,
    senderId: "3",
    senderName: "Jennifer Park", 
    messageContent: "I've uploaded a comprehensive guide on non-compete clause enforceability in your state. This includes recent case law and negotiation strategies.",
    messageType: "document" as const,
    createdAt: new Date(Date.now() - 6200000).toISOString(),
    documentId: 1,
    senderType: "lawyer"
  },
  {
    id: 7,
    senderId: "kartik",
    senderName: "Kartik",
    messageContent: "This is incredibly helpful! I can see why this group was recommended for my case. How should I proceed with my employer?",
    messageType: "text" as const,
    createdAt: new Date(Date.now() - 6000000).toISOString(),
    senderType: "client"
  },
  {
    id: 8,
    senderId: "2",
    senderName: "Michael Rodriguez",
    messageContent: "I recommend we schedule a strategy session this week. I'll draft a formal response to your employer's contract terms, outlining areas for negotiation.",
    messageType: "text" as const,
    createdAt: new Date(Date.now() - 5800000).toISOString(),
    senderType: "lawyer"
  }
];

// Mock group data
const mockGroup = {
  groupId: 123,
  groupName: "Employment Law Specialists",
  reasoning: "This group specializes in employment contracts, non-compete agreements, and workplace rights. Perfect for your contract dispute case.",
  lawyers: [
    { accountId: "1", relevanceScore: 0.95, roleInGroup: "Employment Law Specialist" },
    { accountId: "2", relevanceScore: 0.92, roleInGroup: "Lead Attorney" },
    { accountId: "3", relevanceScore: 0.88, roleInGroup: "Contract Law Expert" }
  ]
};

// Mock documents
const mockDocuments = [
  {
    id: 1,
    title: "Non-Compete Clause Enforceability Guide",
    description: "Comprehensive analysis of non-compete clause enforceability in your jurisdiction with recent case precedents.",
    paymentRequired: 50,
    isPaid: false,
    uploadedBy: "Jennifer Park",
    uploadedAt: new Date(Date.now() - 6200000).toISOString()
  },
  {
    id: 2,
    title: "Contract Negotiation Template",
    description: "Template for responding to employer contract terms with suggested language modifications.",
    paymentRequired: 25,
    isPaid: false,
    uploadedBy: "Michael Rodriguez",
    uploadedAt: new Date(Date.now() - 5400000).toISOString()
  }
];

interface GroupChatParams {
  groupId: string;
}

export default function GroupChat() {
  const { groupId } = useParams({ from: '/group-chat/$groupId' }) as GroupChatParams;
  const navigate = useNavigate();
  const [messages, setMessages] = useState(mockMessages);
  const [documents] = useState(mockDocuments);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId] = useState("kartik"); // Mock current user

  const { sendGroupMessage, getGroupMessages, getGroupDetails } = useApi();
  
  // Fetch real group data based on the groupId from URL
  const { data: groupData, isLoading: groupLoading } = getGroupDetails(parseInt(groupId));
  
  // Fetch real messages for this group
  const { data: messagesData, isLoading: messagesLoading } = getGroupMessages(parseInt(groupId));
  
  // Use real group data if available, fallback to mock for demo
  const group = groupData || mockGroup;
  
  // Use real messages if available, fallback to mock for demo
  useEffect(() => {
    if (messagesData && messagesData.length > 0) {
      setMessages(messagesData);
    }
  }, [messagesData]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (messageContent: string) => {
    // Optimistically add message
    const newMessage = {
      id: messages.length + 1,
      senderId: currentUserId,
      senderName: "Kartik",
      messageContent,
      messageType: "text" as const,
      createdAt: new Date().toISOString(),
      senderType: "client" as const
    };
    
    setMessages(prev => [...prev, newMessage]);

    try {
      // Send message to the real group
      await sendGroupMessage.mutateAsync({
        groupId: parseInt(groupId),
        messageContent,
        messageType: "text"
      });
      
      // Mock lawyer responses for demo (remove this in production)
      setTimeout(() => {
        const responses = [
          "I'll review that and get back to you shortly.",
          "That's a great point. Let me research the specifics.",
          "Based on my experience, I'd recommend...",
          "I can help you with that. Let me prepare some documentation."
        ];
        
        const lawyerResponse = {
          id: messages.length + 2,
          senderId: ["1", "2", "3"][Math.floor(Math.random() * 3)],
          senderName: ["Sarah Chen", "Michael Rodriguez", "Jennifer Park"][Math.floor(Math.random() * 3)],
          messageContent: responses[Math.floor(Math.random() * responses.length)],
          messageType: "text" as const,
          createdAt: new Date().toISOString(),
          senderType: "lawyer" as const
        };
        
        setMessages(prev => [...prev, lawyerResponse]);
      }, 2000);
      
    } catch (error) {
      toast.error("Failed to send message");
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== newMessage.id));
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  };

  const groupMessagesByDate = (messages: typeof mockMessages) => {
    const grouped: { [key: string]: typeof mockMessages } = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    
    return grouped;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <Layout>
      <div className="min-h-[calc(100vh-var(--navbar-height))] bg-background flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-[calc(100vh-var(--navbar-height))]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-b border-border p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/' })}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                {groupLoading ? (
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-48 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                  </div>
                ) : (
                  <>
                    <h1 className="text-lg font-semibold">{group.groupName}</h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <span>{group.lawyers?.length || 0} experts</span>
                      <span>•</span>
                      <span>Active</span>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex"
            >
              <FileText className="w-4 h-4 mr-2" />
              {sidebarOpen ? 'Hide' : 'Show'}
            </Button>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <AnimatePresence>
            {Object.entries(groupedMessages).map(([date, dayMessages]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                    {formatDate(dayMessages[0].createdAt)}
                  </div>
                </div>
                
                {/* Messages for this date */}
                <div className="space-y-4">
                  {dayMessages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "flex gap-3",
                        message.senderId === currentUserId ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.senderId !== currentUserId && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                            {message.senderName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                        </div>
                      )}
                      
                      <div className={cn(
                        "max-w-[70%] space-y-1",
                        message.senderId === currentUserId ? "items-end" : "items-start"
                      )}>
                        {message.senderId !== currentUserId && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{message.senderName}</span>
                            {message.senderType === "lawyer" && (
                              <Shield className="w-3 h-3 text-green-500" />
                            )}
                          </div>
                        )}
                        
                        <div className={cn(
                          "rounded-2xl px-4 py-2 break-words",
                          message.senderId === currentUserId
                            ? "bg-primary text-primary-foreground"
                            : message.messageType === "system"
                            ? "bg-muted text-muted-foreground text-center italic"
                            : "bg-muted"
                        )}>
                          {message.messageType === "document" ? (
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <div>
                                <div className="font-medium">Document shared</div>
                                <div className="text-xs opacity-70">{truncateText(message.messageContent, 50)}</div>
                              </div>
                            </div>
                          ) : (
                            message.messageContent.length > 200 
                              ? truncateText(message.messageContent, 200)
                              : message.messageContent
                          )}
                        </div>
                        
                        <div className={cn(
                          "text-xs text-muted-foreground flex items-center gap-1",
                          message.senderId === currentUserId ? "justify-end" : "justify-start"
                        )}>
                          <Clock className="w-3 h-3" />
                          {formatTime(message.createdAt)}
                          {message.senderId === currentUserId && (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                      </div>
                      
                      {message.senderId === currentUserId && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                            K
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <MessageInput onSendMessage={handleSendMessage} />
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-card border-l border-border h-[calc(100vh-var(--navbar-height))] overflow-hidden"
            >
              <div className="p-4 h-full overflow-y-auto">
              <div className="space-y-6">
                {/* Group Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">About</h3>
                  {groupLoading ? (
                    <div className="bg-muted rounded-lg p-3 animate-pulse">
                      <div className="h-4 bg-muted-foreground/20 rounded w-full mb-2" />
                      <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                    </div>
                  ) : (
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        {group.reasoning ? truncateText(group.reasoning, 120) : "Specialized experts matched to your case."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Lawyers */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Team</h3>
                  {groupLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-background border rounded-xl p-4 animate-pulse">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-muted rounded-xl" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-muted rounded w-24" />
                              <div className="h-3 bg-muted rounded w-32" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(group.lawyers || []).map((lawyer) => (
                        <LawyerProfile key={lawyer.accountId} lawyer={lawyer} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Documents */}
                <DocumentList documents={documents} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
