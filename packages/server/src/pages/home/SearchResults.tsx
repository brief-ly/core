import { motion, AnimatePresence } from "motion/react";
import { Star, MapPin, Clock, Users, Shield, MessageCircle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/src/lib/components/ui/button";
import { cn } from "@/src/lib/utils";
import type { SearchResultsProps } from "@/src/data";
import { mockLawyers } from "@/src/data";
import Icon from "@/src/lib/components/custom/Icon";

export default function SearchResults({ 
  results = mockLawyers, 
  isLoading, 
  searchQuery,
  onContactLawyer,
  className 
}: SearchResultsProps) {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("w-full max-w-4xl mx-auto -mt-56", className)}
      >
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-10 animate-pulse"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-full flex-shrink-0" />
                <div className="flex-1 w-full space-y-3">
                  <div className="flex flex-col lg:flex-row lg:justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-5 sm:h-6 bg-muted rounded w-1/2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="h-3 bg-muted rounded w-20" />
                        <div className="h-3 bg-muted rounded w-24" />
                        <div className="h-3 bg-muted rounded w-16" />
                      </div>
                    </div>
                    <div className="flex items-center justify-evenly gap-4 bg-secondary/50 rounded-xl p-3 text-center lg:bg-transparent lg:p-0">
                      <div>
                        <div className="h-6 sm:h-8 bg-muted rounded w-16 mx-auto" />
                        <div className="h-3 bg-muted rounded w-12 mx-auto mt-1" />
                      </div>
                      <div>
                        <div className="h-5 sm:h-6 bg-muted rounded w-14 mx-auto" />
                        <div className="h-3 bg-muted rounded w-16 mx-auto mt-1" />
                      </div>
                    </div>
                  </div>
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-6 bg-muted rounded-full w-16" />
                    <div className="h-6 bg-muted rounded-full w-20" />
                    <div className="h-6 bg-muted rounded-full w-18" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="h-8 bg-muted rounded w-full sm:w-24" />
                      <div className="h-8 bg-muted rounded w-full sm:w-20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn("w-full max-w-4xl mx-auto -mt-56", className)}
    >
      {/* Results Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-xl font-semibold mb-2">
          Found {results.length} legal experts for "{searchQuery}"
        </h2>
        <p className="text-muted-foreground">
          All lawyers are verified and ready to help with your legal needs
        </p>
      </motion.div>

      {/* Results List */}
      <AnimatePresence mode="wait">
        <motion.div className="space-y-4">
          {results.map((lawyer, index) => (
            <motion.div
              key={lawyer.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -2 }}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-base sm:text-lg font-semibold">
                    {lawyer.avatar}
                  </div>
                  {lawyer.isVerified && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3 gap-3">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <h3 className="text-lg sm:text-xl font-semibold">{lawyer.name}</h3>
                        {lawyer.isTeam && (
                          <div className="flex items-center gap-1 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full w-fit">
                            <Users className="w-3 h-3" />
                            Team of {lawyer.teamSize}
                          </div>
                        )}
                      </div>
                      <p className="text-base sm:text-lg text-muted-foreground mb-2">{lawyer.title}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{lawyer.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                          <span>{lawyer.rating} ({lawyer.reviewCount} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>{lawyer.responseTime}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Pricing Section */}
                    <div className="flex items-center justify-center gap-4 bg-secondary/50 rounded-xl p-3 text-center lg:bg-transparent lg:p-0">
                      <div className="text-emerald-500">
                        <div className="text-xl sm:text-2xl font-bold">${lawyer.consultationFee}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">consultation</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-muted-foreground mb-4 leading-relaxed">
                    {lawyer.description}
                  </p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {lawyer.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-2 sm:px-3 py-1 bg-secondary text-secondary-foreground text-xs sm:text-sm rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>

                  {/* Stats and Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {lawyer.completedCases} completed cases
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        className="rounded-xl flex-1 sm:flex-initial"
                        onClick={() => navigate({ to: '/profile/$id', params: { id: lawyer.id } })}
                      >
                        View Profile
                      </Button>
                      <Button
                        onClick={() => onContactLawyer(lawyer.id)}
                        className="rounded-xl flex-1 sm:flex-initial"
                      >
                        <Icon name="MessageCircle" className="w-4 h-4 mr-1 sm:mr-0" />
                        <span className="sm:hidden">Contact</span>
                        <span className="hidden sm:inline">Contact</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Load More Button */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <Button variant="outline" size="lg" className="rounded-xl">
            Load More Results
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
