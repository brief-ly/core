import { motion, AnimatePresence } from "motion/react";
import { Target, Users, Badge, Send } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/lib/components/ui/button";
import { useApi } from "@/src/lib/hooks/use-api";
import { useNavigate } from "@tanstack/react-router";
import LawyerCard from "./LawyerCard";
import Icon from "@/src/lib/components/custom/Icon";

// Simplified types for API-based data
interface ApiLawyer {
  accountId: string;
  relevanceScore: number;
  roleInGroup: string;
}

interface ApiGroup {
  groupName: string;
  lawyers: ApiLawyer[];
  reasoning: string;
  groupId: number;
}

interface SearchResultsProps {
  results: ApiGroup[];
  isLoading: boolean;
  searchQuery: string;
  onContactLawyer: (lawyerId: string) => void;
  className?: string;
}

export default function SearchResults({ 
  results = [], 
  isLoading, 
  searchQuery,
  onContactLawyer,
  className 
}: SearchResultsProps) {
  console.log({ results });
  
  const navigate = useNavigate();
  const { createGroupRequest } = useApi();

  const handleRequestConsultation = (groupId: number, groupName: string) => {
    createGroupRequest.mutate({
      groupId,
      currentSituation: searchQuery,
      futurePlans: `I would like to get legal consultation from the ${groupName} team regarding my situation: ${searchQuery}. I'm looking for professional guidance and next steps to resolve this matter effectively.`
    }, {
      onSuccess: () => {
        // Navigate to group chat after successful request
        setTimeout(() => {
          navigate({ to: '/group-chat/$groupId', params: { groupId: groupId.toString() } });
        }, 1500); // Give time for success toast to show
      }
    });
  };
  
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("w-full max-w-4xl mx-auto -mt-32 sm:-mt-56 px-4 sm:px-0", className)}
      >
        <div className="space-y-4 sm:space-y-6">
          {[...Array(3)].map((_, groupIndex) => (
            <div
              key={groupIndex}
              className="bg-card border border-border rounded-2xl sm:rounded-3xl overflow-hidden animate-pulse"
            >
              {/* Group Header Skeleton */}
              <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/50 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex items-start gap-4 flex-1 w-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-xl sm:rounded-2xl flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="h-5 sm:h-6 bg-muted rounded w-32 sm:w-48 mb-2" />
                      <div className="h-3 sm:h-4 bg-muted rounded w-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-12 h-6 bg-muted rounded-full" />
                    <div className="w-24 sm:w-36 h-8 sm:h-9 bg-muted rounded-lg sm:rounded-xl flex-1 sm:flex-initial" />
                  </div>
                </div>
              </div>
              
              {/* Lawyers Skeleton */}
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {[...Array(2)].map((_, lawyerIndex) => (
                    <div
                      key={lawyerIndex}
                      className="bg-background border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4"
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
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  const totalLawyers = results.reduce((total, group) => total + group.lawyers.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn("w-full max-w-4xl mx-auto -mt-32 sm:-mt-56 px-4 sm:px-0", className)}
    >
      {/* Results Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6 sm:mb-8"
      >
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">
            Legal Experts for "{searchQuery}"
          </h2>
          <p className="text-muted-foreground flex items-center gap-2 text-sm sm:text-base">
            <Badge className="w-4 h-4 flex-shrink-0" />
            <span className="break-words">
              {totalLawyers} verified lawyers found across {results.length} specialized groups
            </span>
          </p>
        </div>
      </motion.div>

      {/* Results List */}
      <AnimatePresence mode="wait">
        <motion.div className="space-y-4 sm:space-y-6">
          {results.map((group, groupIndex) => (
            <motion.div
              key={group.groupId}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * groupIndex }}
              className="bg-card border border-border rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Group Header */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * groupIndex + 0.2 }}
                className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/50 p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex items-start gap-4 flex-1 w-full">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-primary/20">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 leading-tight">
                        {group.groupName}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-sm break-words">
                        {group.reasoning}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-full">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{group.lawyers.length}</span>
                    </div>
                    <Button
                      onClick={() => handleRequestConsultation(group.groupId, group.groupName)}
                      disabled={createGroupRequest.isPending}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium flex-1 sm:flex-initial"
                    >
                      <Icon name="Send" className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="sm:hidden">
                        {createGroupRequest.isPending ? "Sending..." : "Request"}
                      </span>
                      <span className="hidden md:inline">
                        {createGroupRequest.isPending ? "Sending..." : "Request Consultation"}
                      </span>
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Lawyers Grid */}
              <div className="p-4 sm:p-6">
                <div className="grid gap-3 sm:gap-4">
                  {group.lawyers.map((lawyer, lawyerIndex) => (
                    <LawyerCard
                      key={lawyer.accountId}
                      accountId={lawyer.accountId}
                      relevanceScore={lawyer.relevanceScore}
                      roleInGroup={lawyer.roleInGroup}
                      onContactLawyer={onContactLawyer}
                      delay={0.1 * (groupIndex * 10 + lawyerIndex) + 0.3}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>


    </motion.div>
  );
}
