import { motion, AnimatePresence } from "motion/react";
import { Star, MapPin, Clock, Users, Shield, MessageCircle } from "lucide-react";
import { Button } from "@/src/lib/components/ui/button";
import { cn } from "@/src/lib/utils";

// Mock data types - replace with your actual types
interface Lawyer {
  id: string;
  name: string;
  title: string;
  location: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  specialties: string[];
  avatar: string;
  description: string;
  responseTime: string;
  isTeam: boolean;
  teamSize?: number;
  isVerified: boolean;
  completedCases: number;
}

interface SearchResultsProps {
  results: Lawyer[];
  isLoading: boolean;
  searchQuery: string;
  onContactLawyer: (lawyerId: string) => void;
  className?: string;
}

// Mock data - replace with your API call
const mockResults: Lawyer[] = [
  {
    id: "1",
    name: "Sarah Chen",
    title: "Contract & Business Law Specialist",
    location: "San Francisco, CA",
    rating: 4.9,
    reviewCount: 127,
    hourlyRate: 350,
    specialties: ["Contract Law", "Business Formation", "Negotiations"],
    avatar: "SC",
    description: "15+ years helping startups and established businesses navigate complex contracts and business law matters.",
    responseTime: "Usually responds within 2 hours",
    isTeam: false,
    isVerified: true,
    completedCases: 340
  },
  {
    id: "2",
    name: "Corporate Legal Team",
    title: "Full-Service Business Law Team",
    location: "New York, NY",
    rating: 4.8,
    reviewCount: 89,
    hourlyRate: 425,
    specialties: ["Corporate Law", "M&A", "Securities", "Compliance"],
    avatar: "CLT",
    description: "Premier corporate law team with expertise in mergers, acquisitions, and complex business transactions.",
    responseTime: "Usually responds within 1 hour",
    isTeam: true,
    teamSize: 5,
    isVerified: true,
    completedCases: 210
  },
  {
    id: "3",
    name: "Michael Rodriguez",
    title: "Employment & Labor Law Attorney",
    location: "Austin, TX",
    rating: 4.7,
    reviewCount: 156,
    hourlyRate: 275,
    specialties: ["Employment Law", "Labor Disputes", "HR Compliance"],
    avatar: "MR",
    description: "Dedicated employment attorney protecting both employers and employees in workplace legal matters.",
    responseTime: "Usually responds within 4 hours",
    isTeam: false,
    isVerified: true,
    completedCases: 445
  }
];

export default function SearchResults({ 
  results = mockResults, 
  isLoading, 
  searchQuery,
  onContactLawyer,
  className 
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("w-full max-w-4xl mx-auto mt-8", className)}
      >
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-6 animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-muted rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
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
      className={cn("w-full max-w-4xl mx-auto mt-8", className)}
    >
      {/* Results Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-semibold mb-2">
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
              className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-semibold">
                    {lawyer.avatar}
                  </div>
                  {lawyer.isVerified && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold">{lawyer.name}</h3>
                        {lawyer.isTeam && (
                          <div className="flex items-center gap-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                            <Users className="w-3 h-3" />
                            Team of {lawyer.teamSize}
                          </div>
                        )}
                      </div>
                      <p className="text-lg text-muted-foreground mb-2">{lawyer.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {lawyer.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {lawyer.rating} ({lawyer.reviewCount} reviews)
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lawyer.responseTime}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${lawyer.hourlyRate}</div>
                      <div className="text-sm text-muted-foreground">per hour</div>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {lawyer.description}
                  </p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {lawyer.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>

                  {/* Stats and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {lawyer.completedCases} completed cases
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                      >
                        View Profile
                      </Button>
                      <Button
                        onClick={() => onContactLawyer(lawyer.id)}
                        size="sm"
                        className="rounded-xl"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact
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
