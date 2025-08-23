import { useMutation, useQuery } from "@tanstack/react-query";
import client from "../utils/api-client";
import { toast } from "sonner";
import { usePrivy } from "@privy-io/react-auth";
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
        welcome: useMutation({
            mutationFn: async (name: string) => {
                const result = await client.example.index.$get({
                    query: {
                        name,
                    },
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
                toast.success(`Success: ${res.name}`);
            },
            onError: (err) => {
                console.error(err);
                toast.error("Failed to fetch data");
            }
        }),

        getVerifiedLawyers: () => useQuery({
            queryKey: ["verified-lawyers"],
            queryFn: async () => {
                const result = await client.lawyers.index.$get({
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
        })
    }
}