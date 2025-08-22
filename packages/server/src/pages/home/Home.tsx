import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import SearchInterface from "@/src/pages/home/SearchInterface";
import SearchResults from "@/src/pages/home/SearchResults";
import { cn } from "@/src/lib/utils";
import { searchLawyers } from "@/src/data";
import type { Lawyer } from "@/src/data";

export default function HomePage() {
    const search = useSearch({ from: '/' });
    const navigate = useNavigate({ from: '/' });
    
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Lawyer[]>([]);

    // Get search query from URL
    const searchQuery = search.q || "";
    const hasSearched = !!searchQuery;

    // Perform search when URL changes
    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const results = await searchLawyers(searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [searchQuery]);

    const handleSearch = async (query: string) => {
        // Update URL with search query
        await navigate({
            to: '/',
            search: { q: query.trim() },
        });
    };

    const handleContactLawyer = (lawyerId: string) => {
        // Implement contact functionality
        console.log("Contacting lawyer with ID:", lawyerId);
        // This could open a modal, navigate to a chat page, etc.
    };

    const handleClear = async () => {
        // Clear URL search params
        await navigate({
            to: '/',
            search: {},
        });
        // Scroll to top and reset any focus states
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className={cn(
            "bg-gradient-to-b from-background via-primary/10 dark:via-primary/20 to-primary/20 dark:to-primary/30",
            hasSearched ? "pb-16" : ""
        )}>
            <div className="relative">
                {/* Main container */}
                <motion.div
                    className={cn(
                        "container mx-auto px-4 sm:px-6 transition-all duration-700",
                        hasSearched
                            ? "pt-8"
                            : "flex items-center justify-center h-[calc(100dvh-var(--navbar-height))] py-16"
                    )}
                >
                    {/* Search Interface */}
                    <SearchInterface
                        onSearch={handleSearch}
                        isSearching={isSearching}
                        hasSearched={hasSearched}
                        onClear={handleClear}
                        currentQuery={searchQuery}
                    />

                    {/* Search Results */}
                    {hasSearched && (
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