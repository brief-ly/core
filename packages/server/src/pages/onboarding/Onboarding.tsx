import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import OnboardingForm from "./OnboardingForm";
import { cn } from "@/src/lib/utils";
import Icon from "@/src/lib/components/custom/Icon";

interface OnboardingFormData {
  name: string;
  profilePhoto: File | null;
  about: string;
  professionalExpertise: string;
  consultationFees: string;
  verificationDocuments: File[];
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleFormSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);

    try {
      // Simulate API call
      console.log("Submitting onboarding data:", data);
      
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("about", data.about);
      formData.append("professionalExpertise", data.professionalExpertise);
      
      if (data.consultationFees) {
        formData.append("consultationFees", data.consultationFees);
      }
      
      if (data.profilePhoto) {
        formData.append("profilePhoto", data.profilePhoto);
      }
      
      data.verificationDocuments.forEach((doc, index) => {
        formData.append(`verificationDocument_${index}`, doc);
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // TODO: Replace with actual API call
      // const response = await fetch('/api/lawyers/onboard', {
      //   method: 'POST',
      //   body: formData
      // });

      setSubmitSuccess(true);
      
      // Redirect after success message
      setTimeout(() => {
        navigate({ to: '/', search: { q: '' } });
      }, 3000);

    } catch (error) {
      console.error("Onboarding submission failed:", error);
      // TODO: Add proper error handling/notification
    } finally {
      setIsSubmitting(false);
    }
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

  if (submitSuccess) {
    return (
      <div className="bg-gradient-to-b from-background via-primary/10 dark:via-primary/20 to-primary/20 dark:to-primary/30 min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="bg-card border border-border p-8 shadow-sm">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="CircleCheck" className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h1 className="text-xl font-bold mb-4">Application Submitted!</h1>
              <p className="text-muted-foreground text-base mb-6">
                Thank you for your application. Our team will review your documents and credentials, 
                and we'll get back to you within 2-3 business days.
              </p>
              
              <div className="bg-secondary/50 p-4 mb-6">
                <h3 className="font-semibold mb-2">What's Next?</h3>
                <ul className="text-sm text-muted-foreground space-y-1 text-left">
                  <li>• Document verification and credential review</li>
                  <li>• Background and license verification</li>
                  <li>• Profile setup and activation</li>
                  <li>• Welcome email with next steps</li>
                </ul>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Redirecting to home page in a few seconds...
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-background via-primary/10 dark:via-primary/20 to-primary/20 dark:to-primary/30 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6"
            >
              <button
                onClick={handleGoBack}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="ArrowLeft" className="w-4 h-4" />
                Back
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-8"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Scale" className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Join Our Legal Network</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Complete your application to start connecting with clients and growing your practice
              </p>
            </motion.div>

            {/* Progress Indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border p-6 shadow-sm mb-8"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                    1
                  </div>
                  <span className="font-medium">Application Form</span>
                </div>
                <Icon name="ArrowRight" className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-muted-foreground/30 rounded-full flex items-center justify-center text-xs">
                    2
                  </div>
                  <span>Document Review</span>
                </div>
                <Icon name="ArrowRight" className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-muted-foreground/30 rounded-full flex items-center justify-center text-xs">
                    3
                  </div>
                  <span>Profile Activation</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Form */}
          <OnboardingForm 
            onSubmit={handleFormSubmit} 
            isSubmitting={isSubmitting}
          />
        </motion.div>
      </div>
    </div>
  );
}
