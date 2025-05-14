"use client"

import { useState, useEffect, type ChangeEvent } from 'react';
import { Search, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';


export function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedSearchTerm.length > 2) {
      // Simulate AI suggestions - In a real app, call an AI service
      // This part assumes functionality from src/ai/flows might be used
      // For now, providing static suggestions based on common ambiguous terms
      const getSuggestions = (term: string) => {
        if (term.toLowerCase().includes("labarai") || term.toLowerCase().includes("news")) {
          return ["Latest news in Kano", "Trending topics in Nigeria", "Hausa news updates"];
        }
        if (term.toLowerCase().includes("kasuwa") || term.toLowerCase().includes("market")) {
          return ["Buy traditional clothes", "Sell farm produce", "Services in Kaduna"];
        }
        return [`Search for "${term}" in posts`, `Find users named "${term}"`, `Explore pages about "${term}"`];
      };
      setAiSuggestions(getSuggestions(debouncedSearchTerm));
      setShowSuggestions(true);
    } else {
      setAiSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedSearchTerm]);

  const handleSearch = (e?: React.FormEvent<HTMLFormElement>, suggestion?: string) => {
    if (e) e.preventDefault();
    const query = suggestion || searchTerm;
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
     setSearchTerm(e.target.value);
     if(e.target.value.length <=2) setShowSuggestions(false);
  }

  return (
    <div className="relative w-full max-w-xl">
      <form onSubmit={handleSearch} className="flex w-full items-center space-x-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search Dandali Connect..."
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => debouncedSearchTerm.length > 2 && setShowSuggestions(true)}
            // onBlur={() => setTimeout(() => setShowSuggestions(false), 100)} // Delay to allow click on suggestions
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
        <Button type="submit" variant="default">
          Search
        </Button>
      </form>
      {showSuggestions && aiSuggestions.length > 0 && (
        <Card className="absolute z-10 mt-1 w-full shadow-lg">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="w-4 h-4 mr-2 text-primary" />
              AI Suggestions
            </CardTitle>
            <CardDescription className="text-xs">
              Refine your search or explore these related topics.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="py-2">
              {aiSuggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleSearch(undefined, suggestion)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
