import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "@/src/lib/components/ui/button";
import { cn } from "@/src/lib/utils";
import Icon from "@/src/lib/components/custom/Icon";
import type { SearchInterfaceProps } from "@/src/data";

export default function SearchInterface({ 
  onSearch, 
  isSearching, 
  hasSearched, 
  onClear,
  currentQuery = "",
  className 
}: SearchInterfaceProps) {
  const [query, setQuery] = useState(currentQuery);

  // Sync local query state with currentQuery prop when it changes
  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      layout
      className={cn(
        "w-full max-w-4xl mx-auto",
        className
      )}
      initial={{ y: 0 }}
      animate={{ 
        y: hasSearched ? -200 : 0,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 50,
        duration: 0.2
      }}
    >
      {/* Main Title - only show when not searched */}
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ 
          opacity: hasSearched ? 0 : 1,
          scale: hasSearched ? 0.8 : 1,
        }}
        transition={{ duration: 0.4 }}
        className={cn(
          "text-center mb-12",
          hasSearched && "pointer-events-none"
        )}
      >
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
          Briefly.
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
          Find the perfect legal expert for your needs. Describe your legal requirements in your own words.
        </p>
      </motion.div>

      {/* Search Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="relative"
        layout
      >
        <div className="relative flex items-end bg-background border border-border rounded-2xl shadow-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring/20 transition-all">
          <div className="flex-1 min-h-[60px] max-h-[200px]">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., 'I need help with a contract dispute involving my landlord'"
              className="w-full h-full min-h-[60px] px-4 sm:px-6 py-4 bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground text-sm sm:text-base leading-6"
              disabled={isSearching}
              autoFocus={!hasSearched}
            />
          </div>
          
          <div className="flex items-end p-2">
            <Button
              type="submit"
              size="icon"
              variant="primary"
              disabled={!query.trim() || isSearching}
              className="rounded-xl h-10 w-10 sm:h-12 sm:w-12 shrink-0"
            >
              {isSearching ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Icon name="LoaderCircle" className="h-5 w-5" />
                </motion.div>
              ) : (
                <Icon name="Send" className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Search suggestions/examples - only show when not searched */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ 
            opacity: hasSearched ? 0 : 1,
            y: hasSearched ? -20 : 0,
          }}
          transition={{ duration: 0.3, delay: hasSearched ? 0 : 0.1 }}
          className={cn(
            "mt-4 flex flex-wrap gap-2 justify-center",
            hasSearched && "pointer-events-none"
          )}
        >
          {[
            "Contract review and negotiation",
            "Employment law consultation",
            "Intellectual property protection",
            "Business formation advice"
          ].map((suggestion, index) => (
            <motion.button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-secondary/50 hover:bg-secondary text-secondary-foreground rounded-full border border-border/50 hover:border-border transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {suggestion}
            </motion.button>
          ))}
        </motion.div>

        {/* Clear search subtext */}
        {hasSearched && (
          <div className="absolute top-26">
            <Button
              onClick={onClear}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              <Icon name="X" className="h-4 w-4" />
              Clear results
            </Button>
          </div>
        )}
      </motion.form>
    </motion.div>
  );
}
