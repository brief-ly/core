import { useMutation, useQuery } from "@tanstack/react-query";
import client from "../utils/api-client";
import { toast } from "sonner";
import { usePrivy, useToken } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

export function useApi() {
    const { getAccessToken, ready, user, authenticated } = usePrivy();
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        if (ready && user && authenticated) {
            getAccessToken().then((token) => {
                setAccessToken(token);
            });
        }
    }, [ready, user, authenticated]);

    return {
        // Lawyer Application
        submitLawyerApplication: useMutation({
            mutationFn: async (data: {
                name: string;
                photoUrl: string;
                bio: string;
                expertise: string;
                jurisdictions: string[];
                consultationFee: number;
                verificationDocuments?: string[];
            }) => {
                const result = await client.lawyers.request.$post({
                    json: data,
                }, {
                    headers: {
                        Authorization: accessToken ? `Bearer ${accessToken}` : "",
                    },
                });

                const parsed = await result.json();

                if (!parsed.success) {
                    throw new Error(parsed.error);
                }

                return parsed.data;
            },
            onSuccess: (res) => {
                toast.success("Lawyer application submitted successfully!");
                console.log(res);
            },
            onError: (err) => {
                console.log({ err });
                toast.error("Failed to submit lawyer application");
            }
        }),

        // Get Lawyer Application Status
        getLawyerApplicationStatus: () => useQuery({
            queryKey: ["lawyer-application-status"],
            queryFn: async () => {
                const result = await client.lawyers.request.status.$get(
                    {
                    },
                    {
                        headers: {
                            Authorization: accessToken ? `Bearer ${accessToken}` : "",
                        },
                    });

                const parsed = await result.json();

                if (!parsed.success) {
                    throw new Error(parsed.error);
                }

                return parsed.data;
            },
            enabled: !!accessToken,
        }),

        // Admin: Approve Lawyer Application
        approveLawyerApplication: useMutation({
            mutationFn: async (accountId: string) => {
                const result = await client.lawyers.approve.$post({
                    json: { accountId },
                }, {
                    headers: {
                        Authorization: accessToken ? `Bearer ${accessToken}` : "",
                    },
                });

                const parsed = await result.json();

                if (!parsed.success) {
                    throw new Error(parsed.error);
                }

                return parsed.data;
            },
            onSuccess: (res) => {
                toast.success("Lawyer application approved successfully!");
            },
            onError: (err) => {
                console.error(err);
                toast.error("Failed to approve lawyer application");
            }
        }),

        // Admin: Get Pending Applications
        getPendingLawyerApplications: () => useQuery({
            queryKey: ["pending-lawyer-applications"],
            queryFn: async () => {
                const result = await client.lawyers.admin.pending.$get({
                },
                    {
                        headers: {
                            Authorization: accessToken ? `Bearer ${accessToken}` : "",
                        },
                    });

                const parsed = await result.json();

                if (!parsed.success) {
                    throw new Error(parsed.error);
                }

                return parsed.data;
            },
            enabled: !!accessToken,
        }),

        // Get Verified Lawyers
        getVerifiedLawyers: () => useQuery({
            queryKey: ["verified-lawyers"],
            queryFn: async () => {
                const result = await client.lawyers.index.$get(
                    {},
                    {
                        headers: {
                            Authorization: accessToken ? `Bearer ${accessToken}` : "",
                        },
                    });

                const parsed = await result.json();

                if (!parsed.success) {
                    throw new Error(parsed.error);
                }

                return parsed.data;
            }
        }),

        // Update Lawyer Profile
        updateLawyerProfile: useMutation({
            mutationFn: async (data: {
                photoUrl?: string;
                bio?: string;
                expertise?: string;
                jurisdictions?: string[];
                consultationFee?: number;
            }) => {
                const result = await client.lawyers.profile.$patch({
                    json: data,
                }, {
                    headers: {
                        Authorization: accessToken ? `Bearer ${accessToken}` : "",
                    },
                });

                const parsed = await result.json();

                if (!parsed.success) {
                    throw new Error(parsed.error);
                }

                return parsed.data;
            },
            onSuccess: (res) => {
                toast.success("Profile updated successfully!");
            },
            onError: (err) => {
                console.error(err);
                toast.error("Failed to update profile");
            }
        }),

        // Search Lawyers
        searchLawyers: useMutation({
            mutationFn: async (data: {
                currentSituation: string;
                futurePlans?: string;
            }) => {
                const result = await client.lawyers.search.$post({
                    json: data,
                }, {
                    headers: {
                        Authorization: accessToken ? `Bearer ${accessToken}` : "",
                    },
                });

                const parsed = await result.json();

                if (!parsed.success) {
                    throw new Error(parsed.error);
                }

                return parsed.data;
            },
            onSuccess: (res) => {
                toast.success("Lawyer search completed successfully!");
            },
            onError: (err) => {
                console.error(err);
                toast.error("Failed to search lawyers");
            }
        }),

        // Upload File
        uploadFile: useMutation({
            mutationFn: async (file: File) => {
                const result = await client.upload.index.$post({
                    form: { file },
                }, {
                    headers: {
                        Authorization: accessToken ? `Bearer ${accessToken}` : "",
                    },
                })

                const parsed = await result.json();

                if (!parsed.success) {
                    throw new Error(parsed.error);
                }

                return parsed.data;
            },
            onSuccess: (res) => {
                console.log("Successfully uploaded file!", res);
            },
            onError: (err) => {
                console.error(err);
            }
        }),
    }
}