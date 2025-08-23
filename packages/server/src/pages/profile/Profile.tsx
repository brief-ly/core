import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Star, MapPin, Clock, Users, Shield, MessageCircle, Award, BookOpen, Languages, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/src/lib/components/ui/button";
import { cn } from "@/src/lib/utils";
import { getLawyerById, type Lawyer } from "@/src/data";
import Icon from "@/src/lib/components/custom/Icon";
import { ProfileSkeleton } from "./ProfileSkeleton";

export default function Profile() {
  const { id } = useParams({ from: '/profile/$id' });
  const navigate = useNavigate();
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLawyer = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const lawyerData = await getLawyerById(id);
        setLawyer(lawyerData);
      } catch (error) {
        console.error("Failed to fetch lawyer profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLawyer();
  }, [id]);

  const handleContactLawyer = () => {
    // Implement contact functionality
    console.log("Contacting lawyer with ID:", id);
  };

  const handleScheduleConsultation = () => {
    // Implement consultation scheduling
    console.log("Scheduling consultation with lawyer ID:", id);
  };

  const handleGoBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fall back to home page
      navigate({ to: '/', search: { q: '' } });
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!lawyer) {
    return (
      <div className="bg-gradient-to-b from-background via-primary/10 dark:via-primary/20 to-primary/20 dark:to-primary/30 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Lawyer Not Found</h1>
            <p className="text-muted-foreground mb-6">The lawyer profile you're looking for doesn't exist.</p>
            <Button onClick={handleGoBack} className="rounded-xl">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const availabilityColors = {
    Available: "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30",
    Busy: "text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30",
    Away: "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30"
  };

  return (
    <div className="bg-gradient-to-b from-background via-primary/10 dark:via-primary/20 to-primary/20 dark:to-primary/30 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="rounded-xl"
            >
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
          </motion.div>

          {/* Main Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl sm:text-2xl font-semibold">
                  {lawyer.avatar}
                </div>
                {lawyer.isVerified && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Main Info */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h1 className="text-2xl sm:text-3xl font-bold">{lawyer.name}</h1>
                      <div className="flex flex-wrap items-center gap-2">
                        {lawyer.isTeam && (
                          <div className="flex items-center gap-1 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 sm:px-3 py-1 rounded-full">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                            Team of {lawyer.teamSize}
                          </div>
                        )}
                        <div className={cn("px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium", availabilityColors[lawyer.availability])}>
                          {lawyer.availability}
                        </div>
                      </div>
                    </div>
                    <p className="text-lg sm:text-xl text-muted-foreground mb-3">{lawyer.title}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{lawyer.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        <span>{lawyer.rating} ({lawyer.reviewCount} reviews)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{lawyer.responseTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="flex items-center justify-center gap-4 bg-secondary/50 rounded-xl p-4 text-center">
                    <div className="text-emerald-500">
                      <div className="text-2xl sm:text-3xl font-bold">${lawyer.consultationFee}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">consultation</div>
                    </div>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleContactLawyer} className="rounded-xl flex-1 sm:flex-initial">
                    <Icon name="MessageCircle" className="w-4 h-4 mr-2" />
                    Contact Lawyer
                  </Button>
                  <Button onClick={handleScheduleConsultation} variant="outline" className="rounded-xl flex-1 sm:flex-initial">
                    <Icon name="Calendar" className="w-4 h-4 mr-2" />
                    Schedule Consultation
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="md:col-span-2 space-y-6">
              {/* About Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm"
              >
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {lawyer.aboutMe || lawyer.description}
                </p>

                {/* Specialties */}
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {lawyer.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Case Results */}
                {lawyer.caseResults && lawyer.caseResults.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Notable Results</h3>
                    <ul className="space-y-2">
                      {lawyer.caseResults.map((result, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          {result}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>

              {/* Testimonials */}
              {lawyer.testimonials && lawyer.testimonials.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                >
                  <h2 className="text-xl font-semibold mb-4">Client Testimonials</h2>
                  <div className="space-y-4">
                    {lawyer.testimonials.map((testimonial) => (
                      <div key={testimonial.id} className="border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{testimonial.clientName}</span>
                            <span className="text-sm text-muted-foreground">• {testimonial.caseType}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-3 h-3",
                                  i < testimonial.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">"{testimonial.comment}"</p>
                        <p className="text-xs text-muted-foreground">{new Date(testimonial.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">


              {/* Experience & Stats */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold mb-4">Experience</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-primary">{lawyer.yearsExperience}+</div>
                    <div className="text-sm text-muted-foreground">Years of Experience</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{lawyer.completedCases}</div>
                    <div className="text-sm text-muted-foreground">Completed Cases</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{lawyer.reviewCount}</div>
                    <div className="text-sm text-muted-foreground">Client Reviews</div>
                  </div>
                </div>
              </motion.div>

              {/* Education */}
              {lawyer.education && lawyer.education.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Education
                  </h2>
                  <ul className="space-y-2">
                    {lawyer.education.map((edu, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{edu}</li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Certifications */}
              {lawyer.certifications && lawyer.certifications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Certifications
                  </h2>
                  <ul className="space-y-2">
                    {lawyer.certifications.map((cert, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{cert}</li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Languages */}
              {lawyer.languages && lawyer.languages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    Languages
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {lawyer.languages.map((language) => (
                      <span
                        key={language}
                        className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
