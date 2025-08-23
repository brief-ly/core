import { useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "@tanstack/react-router";
import OnboardingForm from "./OnboardingForm";
import { cn } from "@/src/lib/utils";
import Icon from "@/src/lib/components/custom/Icon";
import { useApi } from "@/src/lib/hooks/use-api";
import { Button } from "@/src/lib/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";

interface OnboardingFormData {
  name: string;
  profilePhoto: File | null;
  about: string;
  professionalExpertise: string;
  consultationFees: string;
  jurisdictions: string[];
  verificationDocuments: File[];
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { submitLawyerApplication, uploadFile } = useApi();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { user } = usePrivy();
  const walletAddress = user?.wallet?.address;

  const { data: statusData, isSuccess: isStatusSuccess } = useApi().getLawyerApplicationStatus();
  console.log({ statusData, isStatusSuccess });

  const handleFormSubmit = async (data: OnboardingFormData) => {
    try {
      // Upload profile photo if it exists
      let photoUrl = "";
      if (data.profilePhoto) {
        try {
          // Ensure file has a name
          const photoFile = data.profilePhoto.name ? data.profilePhoto : new File([data.profilePhoto], `profile-photo-${Date.now()}.${data.profilePhoto.type.split('/')[1]}`, { type: data.profilePhoto.type });
          const photoResult = await uploadFile.mutateAsync(photoFile);
          const gatewayUrl = process.env.BUN_PUBLIC_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';
          photoUrl = `https://${gatewayUrl}/ipfs/${photoResult.cid}`;
        } catch (uploadError) {
          console.error("Failed to upload profile photo:", uploadError);
          throw new Error("Failed to upload profile photo. Please try again.");
        }
      }

      // Upload verification documents if they exist
      let verificationDocumentUrls: string[] = [];
      if (data.verificationDocuments && data.verificationDocuments.length > 0) {
        try {
          const uploadPromises = data.verificationDocuments.map((file, index) => {
            // Ensure each file has a name
            const namedFile = file.name ? file : new File([file], `document-${index + 1}.pdf`, { type: file.type });
            return uploadFile.mutateAsync(namedFile);
          });
          const documentResults = await Promise.all(uploadPromises);
          const gatewayUrl = process.env.BUN_PUBLIC_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';
          verificationDocumentUrls = documentResults.map((result: any) => `https://${gatewayUrl}/ipfs/${result.cid}`);
        } catch (uploadError) {
          console.error("Failed to upload verification documents:", uploadError);
          throw new Error("Failed to upload verification documents. Please try again.");
        }
      }

      // Convert consultation fees to number
      const consultationFee = data.consultationFees ? parseFloat(data.consultationFees) : 0;

      console.log(" uploading works ");
      // Submit the lawyer application
      await submitLawyerApplication.mutateAsync({
        name: data.name,
        photoUrl,
        bio: data.about,
        expertise: data.professionalExpertise,
        jurisdictions: data.jurisdictions,
        consultationFee,
        verificationDocuments: verificationDocumentUrls,
      });

      console.log(" submitting works ");
      setSubmitSuccess(true);

      // Redirect after success message
      setTimeout(() => {
        navigate({ to: '/', search: { q: '' } });
      }, 3000);

    } catch (error) {
      console.error("Onboarding submission failed:", error);
      // Error handling is already done in the mutation's onError callback
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

  if (isStatusSuccess) {
    if (statusData.verifiedAt) {
      return (
        <div className="bg-gradient-to-b from-background via-primary/10 dark:via-primary/20 to-primary/20 dark:to-primary/30 min-h-screen flex flex-col items-center justify-center">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="CircleCheck" className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-xl font-bold mb-4">Application Verified!</h1>
            <p className="text-muted-foreground text-base mb-6">
              Your application has been verified. You can now start connecting with clients and growing your practice.
            </p>
          </div>

          <div className="flex gap-4">
            <Button asChild variant="primary">
              <Link to="/profile/$id" params={{ id: walletAddress || '' }}>View Profile</Link>
            </Button>

            <Button asChild variant="outline">
              <Link to="/" search={{ q: '' }}>Back to Home</Link>
            </Button>
          </div>
        </div>
      );
    }

    if (!statusData.verifiedAt) {
      return (
        <div className="bg-gradient-to-b from-background via-primary/10 dark:via-primary/20 to-primary/20 dark:to-primary/30 min-h-screen flex flex-col items-center justify-center">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="CircleCheck" className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-xl font-bold mb-4">Application Pending</h1>
            <p className="text-muted-foreground text-base mb-6">Your application is pending review. Please wait for our team to review your documents and credentials.</p>
          </div>

          <div className="flex gap-4">
            <Button asChild variant="primary">
              <Link to="/profile/$id" params={{ id: walletAddress || '' }}>View Profile</Link>
            </Button>

            <Button asChild variant="outline">
              <Link to="/" search={{ q: '' }}>Back to Home</Link>
            </Button>
          </div>
        </div>
      );
    }
  }

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
          </div>

          {/* Form */}
          <OnboardingForm
            onSubmit={handleFormSubmit}
            isSubmitting={submitLawyerApplication.isPending || uploadFile.isPending}
          />
        </motion.div>
      </div>
    </div>
  );
}
