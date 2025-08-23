import { motion } from "motion/react";
import { Star, MapPin, Eye, MessageCircle, Shield } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/src/lib/components/ui/button";
import { useApi } from "@/src/lib/hooks/use-api";
import Icon from "@/src/lib/components/custom/Icon";

interface LawyerCardProps {
  accountId: string;
  relevanceScore: number;
  roleInGroup: string;
  onContactLawyer: (lawyerId: string) => void;
  delay?: number;
}

export default function LawyerCard({ 
  accountId, 
  relevanceScore, 
  roleInGroup, 
  onContactLawyer,
  delay = 0 
}: LawyerCardProps) {
  const navigate = useNavigate();
  const { data: lawyer, isLoading, error } = useApi().getLawyerProfileByAccountId(accountId);

  console.log({ lawyer });

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-background border border-border rounded-2xl p-4 animate-pulse"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-20" />
              </div>
              <div className="ml-4 text-right">
                <div className="h-5 bg-muted rounded w-12 mb-1" />
                <div className="h-2 bg-muted rounded w-16" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-6 bg-muted rounded w-20" />
              <div className="flex gap-2">
                <div className="h-8 bg-muted rounded w-12" />
                <div className="h-8 bg-muted rounded w-16" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error || !lawyer) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-background border border-destructive/20 rounded-2xl p-4 text-center"
      >
        <p className="text-sm text-muted-foreground">
          {error ? "Failed to load lawyer details" : "Lawyer not found"}
        </p>
      </motion.div>
    );
  }

  // Generate initials from name for avatar
  const initials = lawyer.name.length >= 2 
    ? lawyer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : lawyer.name.substring(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.01 }}
      className="bg-background border border-border rounded-2xl p-4 hover:shadow-md transition-all duration-200 hover:border-primary/20"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-sm font-semibold">
            {lawyer.photoUrl ? (
              <img 
                src={lawyer.photoUrl} 
                alt={lawyer.name}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              initials
            )}
          </div>
          {lawyer.verifiedAt && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <Shield className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold truncate">{lawyer.name}</h3>
                <div className="flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-current" />
                  {Math.round(relevanceScore * 100)}%
                </div>
              </div>
              <p className="text-sm text-muted-foreground truncate mb-1">
                {lawyer.expertise || "Legal Professional"}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {lawyer.jurisdictions?.length > 0 
                    ? lawyer.jurisdictions[0] + (lawyer.jurisdictions.length > 1 ? ` +${lawyer.jurisdictions.length - 1}` : '')
                    : "Remote"
                  }
                </span>
              </div>
            </div>
            
            {/* Pricing Section */}
            <div className="text-right ml-4">
              <div className="text-lg font-bold text-emerald-600">${lawyer.consultationFee}</div>
              <div className="text-xs text-muted-foreground">consultation</div>
            </div>
          </div>

          {/* Role Badge */}
          <div className="flex items-center justify-between">
            <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium">
              {roleInGroup}
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => navigate({ to: '/profile/$id', params: { id: accountId } })}
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => onContactLawyer(accountId)}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Contact
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
