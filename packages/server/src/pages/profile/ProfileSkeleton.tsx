import { motion } from "motion/react";
import { Skeleton } from "@/src/lib/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="bg-gradient-to-b from-background via-primary/10 dark:via-primary/20 to-primary/20 dark:to-primary/30 min-h-screen">
              <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto"
        >
          {/* Back Button Skeleton */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Skeleton className="h-9 sm:h-10 w-28 sm:w-32" />
          </motion.div>

          {/* Main Profile Header Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full" />
              </div>

              {/* Main Info */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <Skeleton className="h-7 sm:h-8 w-48" />
                      <div className="flex flex-wrap items-center gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-5 sm:h-6 w-64 mb-3" />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  
                  {/* Pricing Section */}
                  <div className="bg-secondary/50 rounded-xl p-4 text-center lg:text-right lg:bg-transparent lg:p-0">
                    <Skeleton className="h-7 sm:h-8 w-20 mb-1 mx-auto lg:mx-0" />
                    <Skeleton className="h-3 sm:h-4 w-16 mb-2 mx-auto lg:mx-0" />
                    <Skeleton className="h-5 sm:h-6 w-16 mb-1 mx-auto lg:mx-0" />
                    <Skeleton className="h-3 sm:h-4 w-20 mx-auto lg:mx-0" />
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Skeleton className="h-10 w-full sm:w-32" />
                  <Skeleton className="h-10 w-full sm:w-40" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="md:col-span-2 space-y-6">
              {/* About Section Skeleton */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm"
              >
                <Skeleton className="h-6 w-16 mb-4" />
                <div className="space-y-3 mb-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                
                {/* Specialties */}
                <Skeleton className="h-5 w-20 mb-2" />
                <div className="flex flex-wrap gap-2 mb-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-20 rounded-full" />
                  ))}
                </div>

                {/* Case Results */}
                <Skeleton className="h-5 w-28 mb-2" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Skeleton className="w-4 h-4 rounded-full mt-0.5 shrink-0" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Testimonials Skeleton */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm"
              >
                <Skeleton className="h-6 w-36 mb-4" />
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, j) => (
                            <Skeleton key={j} className="w-3 h-3 rounded-full" />
                          ))}
                        </div>
                      </div>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Contact Information Skeleton */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm"
              >
                <Skeleton className="h-5 w-36 mb-4" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-4 h-4" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Experience & Stats Skeleton */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm"
              >
                <Skeleton className="h-5 w-20 mb-4" />
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-8 w-12 mb-1" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Education Skeleton */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </motion.div>

              {/* Certifications Skeleton */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </motion.div>

              {/* Languages Skeleton */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="h-5 w-18" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-16 rounded-full" />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
