import { useState } from "react";
import { motion } from "motion/react";
import SearchInterface from "@/src/pages/home/SearchInterface";
import SearchResults from "@/src/pages/home/SearchResults";
import { cn } from "@/src/lib/utils";

export default function HomePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = async (query: string) => {
        setIsSearching(true);
        setSearchQuery(query);
        setHasSearched(true);

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Here you would call your actual API
            // const results = await searchLawyers(query);
            // setSearchResults(results);

            // For now, we'll use the mock data from SearchResults component
            setSearchResults([]);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleContactLawyer = (lawyerId: string) => {
        // Implement contact functionality
        console.log("Contacting lawyer with ID:", lawyerId);
        // This could open a modal, navigate to a chat page, etc.
    };

    const handleClear = () => {
        setSearchQuery("");
        setSearchResults([]);
        setHasSearched(false);
        setIsSearching(false);
        // Scroll to top and reset any focus states
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="h-full">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/10 to-primary/20 pointer-events-none" />

            <div className="relative h-full">
                {/* Main container */}
                <motion.div
                    className={cn(
                        "container mx-auto px-4 h-full transition-all duration-700",
                        hasSearched
                            ? "pt-8 pb-16"
                            : "flex items-center justify-center py-16"
                    )}
                >
                    {/* Search Interface */}
                    <SearchInterface
                        onSearch={handleSearch}
                        isSearching={isSearching}
                        hasSearched={hasSearched}
                        onClear={handleClear}
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