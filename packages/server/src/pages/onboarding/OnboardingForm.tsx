import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/src/lib/components/ui/button";
import { Input } from "@/src/lib/components/ui/input";
import { Textarea } from "@/src/lib/components/ui/textarea";
import Upload from "@/src/lib/components/custom/Upload";
import DocumentUpload from "./DocumentUpload";
import Icon from "@/src/lib/components/custom/Icon";
import { cn } from "@/src/lib/utils";

interface OnboardingFormData {
  name: string;
  profilePhoto: File | null;
  about: string;
  professionalExpertise: string;
  consultationFees: string;
  verificationDocuments: File[];
}

interface OnboardingFormProps {
  onSubmit: (data: OnboardingFormData) => void;
  isSubmitting: boolean;
}

export default function OnboardingForm({ onSubmit, isSubmitting }: OnboardingFormProps) {
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: "",
    profilePhoto: null,
    about: "",
    professionalExpertise: "",
    consultationFees: "",
    verificationDocuments: []
  });

  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof OnboardingFormData, string>> = {};

    // Required field validations
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.about.trim()) {
      newErrors.about = "About section is required";
    } else if (formData.about.trim().length < 10) {
      newErrors.about = "About section must be at least 10 words";
    }

    if (!formData.professionalExpertise.trim()) {
      newErrors.professionalExpertise = "Professional expertise is required";
    } else if (formData.professionalExpertise.trim().length < 30) {
      newErrors.professionalExpertise = "Professional expertise must be at least 30 words";
    }

    if (formData.consultationFees && isNaN(Number(formData.consultationFees))) {
      newErrors.consultationFees = "Please enter a valid number";
    }

    if (formData.verificationDocuments.length === 0) {
      newErrors.verificationDocuments = "At least one verification document is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof OnboardingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleProfilePhotoChange = (file: File) => {
    setFormData(prev => ({ ...prev, profilePhoto: file }));
  };

  const handleDocumentsChange = (documents: File[]) => {
    setFormData(prev => ({ ...prev, verificationDocuments: documents }));
    // Clear error when documents are uploaded
    if (errors.verificationDocuments) {
      setErrors(prev => ({ ...prev, verificationDocuments: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="User" className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Personal Information</h2>
            <p className="text-sm text-muted-foreground">Tell us about yourself</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Name and Profile Photo Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Name Field */}
            <div className="lg:col-span-1">
              <label htmlFor="name" className="text-sm font-medium text-foreground mb-2 block">
                Full Name *
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full legal name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={cn(errors.name && "border-destructive")}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            {/* Profile Photo */}
            <div className="lg:col-span-1">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Profile Photo
              </label>
              <Upload setImage={handleProfilePhotoChange} />
            </div>
          </div>

          {/* About Section */}
          <div>
            <label htmlFor="about" className="text-sm font-medium text-foreground mb-2 block">
              About You *
            </label>
            <Textarea
              id="about"
              placeholder="Tell us about yourself, your background, interests, and what makes you unique..."
              value={formData.about}
              onChange={(e) => handleInputChange("about", e.target.value)}
              className={cn("min-h-32", errors.about && "border-destructive")}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.about ? (
                <p className="text-sm text-destructive">{errors.about}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Minimum 30 characters. This personal bio will be displayed on your profile.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.about.length}/1000
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Professional Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="Briefcase" className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Professional Information</h2>
            <p className="text-sm text-muted-foreground">Share your legal expertise and qualifications</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Professional Expertise */}
          <div>
            <label htmlFor="expertise" className="text-sm font-medium text-foreground mb-2 block">
              Professional Expertise *
            </label>
            <Textarea
              id="expertise"
              placeholder="Describe your areas of legal expertise, specializations, notable cases, certifications, and professional achievements..."
              value={formData.professionalExpertise}
              onChange={(e) => handleInputChange("professionalExpertise", e.target.value)}
              className={cn("min-h-32", errors.professionalExpertise && "border-destructive")}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.professionalExpertise ? (
                <p className="text-sm text-destructive">{errors.professionalExpertise}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Minimum 10 characters. Highlight your key areas of expertise.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.professionalExpertise.length}/1000
              </p>
            </div>
          </div>

          {/* Consultation Fees */}
          <div>
            <label htmlFor="fees" className="text-sm font-medium text-foreground mb-2 block">
              Default Consultation Fee (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="fees"
                type="number"
                placeholder="150"
                value={formData.consultationFees}
                onChange={(e) => handleInputChange("consultationFees", e.target.value)}
                className={cn("pl-8", errors.consultationFees && "border-destructive")}
                min="0"
                step="25"
              />
            </div>
            {errors.consultationFees ? (
              <p className="text-sm text-destructive mt-1">{errors.consultationFees}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Your average consultation fee. You can adjust this later for individual clients.
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Verification Documents Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="Shield" className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Verification Documents</h2>
            <p className="text-sm text-muted-foreground">Upload documents to verify your identity and credentials</p>
          </div>
        </div>

        <DocumentUpload
          onDocumentsChange={handleDocumentsChange}
          maxFiles={5}
          label="Required Documents *"
          description="Please upload your bar license, professional ID, law degree, and any other relevant credentials"
        />
        {errors.verificationDocuments && (
          <p className="text-sm text-destructive mt-2">{errors.verificationDocuments}</p>
        )}
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-end"
      >
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="min-w-40"
        >
          {isSubmitting ? (
            <>
              <Icon name="Loader" className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Icon name="Send" className="w-4 h-4 mr-2" />
              Submit Application
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
}
