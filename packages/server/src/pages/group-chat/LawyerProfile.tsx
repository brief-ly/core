import { motion } from "motion/react";
import { Star, MapPin, Shield, Eye, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/src/lib/components/ui/button";
import { useApi } from "@/src/lib/hooks/use-api";
import { useNavigate } from "@tanstack/react-router";
import { cn, truncateText } from "@/src/lib/utils/utils";

interface LawyerProfileProps {
  lawyer: {
    accountId: string;
    relevanceScore: number;
    roleInGroup: string;
  };
}

export default function LawyerProfile({ lawyer }: LawyerProfileProps) {
  const navigate = useNavigate();
  const { data: lawyerData, isLoading, error } = useApi().getLawyerProfileByAccountId(lawyer.accountId);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background border border-border rounded-xl p-3 animate-pulse"
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-muted rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-3 bg-muted rounded w-32" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (error || !lawyerData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background border border-destructive/20 rounded-xl p-3 text-center"
      >
        <p className="text-sm text-muted-foreground">
          Failed to load lawyer profile
        </p>
      </motion.div>
    );
  }

  // Generate initials from name for avatar
  const initials = lawyerData.name.length >= 2 
    ? lawyerData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : lawyerData.name.substring(0, 2).toUpperCase();

  // Mock online status (in real app, this would come from real-time data)
  const isOnline = Math.random() > 0.3; // 70% chance of being online
  const lastSeen = isOnline ? null : new Date(Date.now() - Math.random() * 7200000); // Random time in last 2 hours

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-background border border-border rounded-xl p-4 hover:shadow-md transition-all duration-200"
    >
      <div className="space-y-3">
        {/* Header with avatar and basic info */}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-sm font-semibold">
              {lawyerData.photoUrl ? (
                <img 
                  src={lawyerData.photoUrl} 
                  alt={lawyerData.name}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                initials
              )}
            </div>
            
            {/* Online status indicator */}
            <div className={cn(
              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
              isOnline ? "bg-green-500" : "bg-gray-400"
            )} />
            
            {/* Verified badge */}
            {lawyerData.verifiedAt && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm truncate">{lawyerData.name}</h4>
              <div className="flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                <Star className="w-2.5 h-2.5 fill-current" />
                {Math.round(lawyer.relevanceScore * 100)}%
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground truncate mb-1">
              {lawyerData.expertise || "Legal Professional"}
            </p>
            
            {/* Online status text */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {isOnline ? (
                <span className="text-green-600 dark:text-green-400">Online now</span>
              ) : (
                <span>Last seen {lastSeen?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>
          </div>
        </div>

        {/* Role and location */}
        <div className="space-y-2">
          <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium text-center">
            {lawyer.roleInGroup}
          </div>
          
          {lawyerData.jurisdictions && lawyerData.jurisdictions.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {lawyerData.jurisdictions[0]}
                {lawyerData.jurisdictions.length > 1 && ` +${lawyerData.jurisdictions.length - 1}`}
              </span>
            </div>
          )}
        </div>

        {/* Consultation fee */}
        <div className="text-center py-2 bg-muted/50 rounded-lg">
          <div className="text-lg font-bold text-emerald-600">${lawyerData.consultationFee}</div>
          <div className="text-xs text-muted-foreground">fee</div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs"
            onClick={() => navigate({ to: '/profile/$id', params: { id: lawyer.accountId } })}
          >
            <Eye className="w-3 h-3 mr-1" />
            Profile
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => {
              // In real app, this could start a private chat or mention the lawyer
              console.log("Start private chat with", lawyerData.name);
            }}
          >
            <MessageCircle className="w-3 h-3 mr-1" />
            Book
          </Button>
        </div>

        {/* Bio preview */}
        {lawyerData.bio && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {truncateText(lawyerData.bio, 80)}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
