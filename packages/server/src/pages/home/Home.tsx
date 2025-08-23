import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import SearchInterface from "@/src/pages/home/SearchInterface";
import SearchResults from "@/src/pages/home/SearchResults";
import { cn } from "@/src/lib/utils";
import type { ApiSearchResponse } from "@/src/data";

// Simplified types for our needs
interface SimpleLawyer {
  accountId: string;
  relevanceScore: number;
  roleInGroup: string;
}

interface SimpleGroup {
  groupName: string;
  lawyers: SimpleLawyer[];
  reasoning: string;
  groupId: number;
}
import { useAuthProtection } from "@/src/lib/components/custom/AuthProtector";
import { useApi } from "@/src/lib/hooks/use-api";

// Helper function to transform API response to simplified format
const transformApiResponseToSimple = (apiResponse: ApiSearchResponse): SimpleGroup[] => {
  return apiResponse.groups.map(group => ({
    groupName: group.groupName,
    groupId: group.groupId,
    reasoning: group.reasoning,
    lawyers: group.lawyers.map(apiLawyer => ({
      accountId: apiLawyer.accountId,
      relevanceScore: apiLawyer.relevanceScore,
      roleInGroup: apiLawyer.roleInGroup,
    }))
  }));
};

export default function HomePage() {
    const search = useSearch({ from: '/' });
    const navigate = useNavigate({ from: '/' });
    const [searchResults, setSearchResults] = useState<SimpleGroup[]>([]);
    const [totalLawyers, setTotalLawyers] = useState<number>(0);
    const [pendingSearchQuery, setPendingSearchQuery] = useState<string | null>(null);
    const { isAuthenticated, isLoading, executeProtected } = useAuthProtection({ showWalletRequired: false });
    const searchQuery = search.q || "";
    const hasSearched = !!searchQuery;

    const { mutateAsync: searchLawyers, isPending: isSearching } = useApi().searchLawyers;

    useEffect(() => {
        if (isAuthenticated && pendingSearchQuery) {
            navigate({ to: '/', search: { q: pendingSearchQuery.trim() } });
            setPendingSearchQuery(null);
        }
    }, [isAuthenticated, pendingSearchQuery, navigate]);

    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery) {
                setSearchResults([]);
                setTotalLawyers(0);
                return;
            }
            if (isLoading) return;
            if (!isAuthenticated) {
                if (!pendingSearchQuery) {
                    setPendingSearchQuery(searchQuery);
                    executeProtected(async () => { }).catch(() => setPendingSearchQuery(null));
                }
                return;
            }
            try {
                const result = await searchLawyers({
                    currentSituation: searchQuery,
                });
                console.log({ apiSearchResult: result });
                
                // Ensure result has the expected structure
                if (result && result.groups && Array.isArray(result.groups)) {
                    // Transform API response to simplified format
                    const simpleGroups = transformApiResponseToSimple(result as ApiSearchResponse);
                    setSearchResults(simpleGroups);
                    setTotalLawyers(result.totalLawyers || 0);
                } else {
                    setSearchResults([]);
                    setTotalLawyers(0);
                }
            } catch {
                setSearchResults([]);
                setTotalLawyers(0);
            } 
        };
        performSearch();
    }, [searchQuery, isAuthenticated, isLoading]);

    const handleSearch = async (query: string) => {
        if (!isAuthenticated && !isLoading) {
            setPendingSearchQuery(query);
            await executeProtected(async () => { });
        } else if (isAuthenticated) {
            await navigate({ to: '/', search: { q: query.trim() } });
        }
    };

    const handleContactLawyer = (lawyerId: string) => {
        console.log("Contacting lawyer with ID:", lawyerId);
    };

    const handleClear = async () => {
        await navigate({ to: '/', search: {} });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className={cn(
            "min-h-[calc(100dvh-var(--navbar-height))] bg-gradient-to-b from-background via-primary/10 dark:via-primary/10 to-primary/20 dark:to-primary/5",
            hasSearched ? "pb-16" : ""
        )}>
            <div className="relative">
                <motion.div
                    className={cn(
                        "container mx-auto px-4 sm:px-6 transition-all duration-700",
                        hasSearched
                            ? "pt-8"
                            : "flex items-center justify-center h-[calc(100dvh-var(--navbar-height))] py-16"
                    )}
                >
                    <SearchInterface
                        onSearch={handleSearch}
                        isSearching={isSearching}
                        hasSearched={hasSearched}
                        onClear={handleClear}
                        currentQuery={searchQuery}
                    />
                    {hasSearched && (isAuthenticated || isSearching) && (
                        <SearchResults
                            results={searchResults}
                            isLoading={isSearching}
                            searchQuery={searchQuery}
                            onContactLawyer={handleContactLawyer}
                        />
                    )}
                </motion.div>
            </div>
        </div>
    );
}