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

        // Get Lawyer Profile by Wallet Address
        getLawyerProfileByWallet: (walletAddress: string) => useQuery({
            queryKey: ["lawyer-profile", walletAddress],
            queryFn: async () => {
                const result = await client.lawyers.findByWalletAddress[":walletAddress"].$get(
                    {
                        param: { walletAddress },
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
            enabled: !!walletAddress && !!accessToken,
        }),

        getLawyerProfileByAccountId: (accountId: string) => useQuery({
            queryKey: ["lawyer-profile", accountId],
            queryFn: async () => {
                const result = await client.lawyers.findByAccountId[":accountId"].$get(
                    {
                        param: { accountId },
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
            enabled: !!accountId && !!accessToken,
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

        // Group Management
        // Get Group Details
        getGroupDetails: (groupId: number) => useQuery({
            queryKey: ["group-details", groupId],
            queryFn: async () => {
                const result = await client.groups[":groupId"].$get(
                    {
                        param: { groupId: groupId.toString() },
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
            enabled: !!groupId && !!accessToken,
        }),

        // Create Group Request
        createGroupRequest: useMutation({
            mutationFn: async (data: {
                groupId: number;
                currentSituation: string;
                futurePlans: string;
            }) => {
                const result = await client.groups.request.$post({
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
                toast.success("Request sent to lawyer group successfully!");
            },
            onError: (err) => {
                console.error(err);
                toast.error("Failed to send request to group");
            }
        }),

        // Get Sent Requests
        getSentRequests: () => useQuery({
            queryKey: ["sent-requests"],
            queryFn: async () => {
                const result = await client.groups.requests.sent.$get(
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
            },
            enabled: !!accessToken,
        }),

        // Get Pending Requests (for lawyers)
        getPendingRequests: () => useQuery({
            queryKey: ["pending-requests"],
            queryFn: async () => {
                const result = await client.groups.requests.pending.$get(
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
            },
            enabled: !!accessToken,
        }),

        // Respond to Group Request
        respondToRequest: useMutation({
            mutationFn: async (data: {
                requestId: number;
                response: "accepted" | "rejected";
            }) => {
                const result = await client.groups.requests[":requestId"].respond.$post({
                    param: { requestId: data.requestId.toString() },
                    json: { response: data.response },
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
            onSuccess: (res, variables) => {
                toast.success(`Request ${variables.response} successfully!`);
            },
            onError: (err) => {
                console.error(err);
                toast.error("Failed to respond to request");
            }
        }),

        // Add Document to Group
        addGroupDocument: useMutation({
            mutationFn: async (data: {
                groupId: number;
                title: string;
                description?: string;
                paymentRequired: number;
                documentHash: string;
                ipfsHash: string;
                encryptionKey: string;
                iv: string;
                tag: string;
            }) => {
                const result = await client.groups[":groupId"].documents.$post({
                    param: { groupId: data.groupId.toString() },
                    json: {
                        title: data.title,
                        description: data.description,
                        paymentRequired: data.paymentRequired,
                        documentHash: data.documentHash,
                        ipfsHash: data.ipfsHash,
                        encryptionKey: data.encryptionKey,
                        iv: data.iv,
                        tag: data.tag,
                    },
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
                toast.success("Document added successfully!");
            },
            onError: (err) => {
                console.error(err);
                toast.error("Failed to add document");
            }
        }),

        // Get Group Documents
        getGroupDocuments: (groupId: number) => useQuery({
            queryKey: ["group-documents", groupId],
            queryFn: async () => {
                const result = await client.groups[":groupId"].documents.$get(
                    {
                        param: { groupId: groupId.toString() },
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
            enabled: !!groupId && !!accessToken,
        }),

        // Pay for Document
        payForDocument: useMutation({
            mutationFn: async (data: {
                groupId: number;
                documentId: number;
            }) => {
                const result = await client.groups[":groupId"].documents[":documentId"].pay.$post({
                    param: {
                        groupId: data.groupId.toString(),
                        documentId: data.documentId.toString()
                    },
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
                toast.success("Payment successful, document unlocked!");
            },
            onError: (err) => {
                console.error(err);
                toast.error("Payment failed");
            }
        }),

        // Download Document
        downloadDocument: useMutation({
            mutationFn: async (data: {
                groupId: number;
                documentId: number;
            }) => {
                const result = await client.groups[":groupId"].documents[":documentId"].download.$get({
                    param: {
                        groupId: data.groupId.toString(),
                        documentId: data.documentId.toString()
                    },
                }, {
                    headers: {
                        Authorization: accessToken ? `Bearer ${accessToken}` : "",
                    },
                });

                if (!result.ok) {
                    const parsed = await result.json();
                    throw new Error("Failed to download document");
                }

                // Return the blob for download
                return await result.blob();
            },
            onSuccess: (blob, variables) => {
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `document-${variables.documentId}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success("Document downloaded successfully!");
            },
            onError: (err) => {
                console.error(err);
                toast.error("Failed to download document");
            }
        }),

        // Send Message to Group
        sendGroupMessage: useMutation({
            mutationFn: async (data: {
                groupId: number;
                messageContent: string;
                messageType?: "text" | "document" | "system";
                documentId?: number;
            }) => {
                const result = await client.groups[":groupId"].messages.$post({
                    param: { groupId: data.groupId.toString() },
                    json: {
                        messageContent: data.messageContent,
                        messageType: data.messageType || "text",
                        documentId: data.documentId,
                    },
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
                // Don't show toast for successful message sends to avoid spam
                console.log("Message sent successfully");
            },
            onError: (err) => {
                console.error(err);
                toast.error("Failed to send message");
            }
        }),

        // Get Group Messages
        getGroupMessages: (groupId: number, page?: number, limit?: number) => useQuery({
            queryKey: ["group-messages", groupId, page, limit],
            queryFn: async () => {
                const params = new URLSearchParams();
                if (page) params.append('page', page.toString());
                if (limit) params.append('limit', limit.toString());

                const result = await client.groups[":groupId"].messages.$get(
                    {
                        param: { groupId: groupId.toString() },
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
            enabled: !!groupId && !!accessToken,
        }),
    }
}