import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccessibility } from '../contexts/AccessibilityContext';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { announceToScreenReader } = useAccessibility();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      announceToScreenReader(`Searching for ${searchQuery.trim()}`);
      setMobileMenuOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMobileMenuOpen(false);
    }
  };

  return (
    <header 
      className="bg-primary text-primary-foreground shadow-lg"
      role="banner"
      onKeyDown={handleKeyDown}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-foreground rounded"
            aria-label="AccessiCinema - Home"
          >
            AccessiCinema
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6" role="navigation" aria-label="Main navigation">
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <label htmlFor="search-input" className="sr-only">
                Search for movies
              </label>
              <Input
                id="search-input"
                type="search"
                placeholder="Search accessible movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-primary-foreground text-primary"
                aria-describedby="search-help"
              />
              <span id="search-help" className="sr-only">
                Search for movies with accessibility features and narrated descriptions
              </span>
              <Button 
                type="submit" 
                size="sm" 
                variant="secondary"
                aria-label="Search movies"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>

            <Link 
              to="/favorites" 
              className="flex items-center space-x-1 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-foreground rounded p-1"
              aria-label="View favorite movies"
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              <span>Favorites</span>
            </Link>

            <Link 
              to="/accessibility" 
              className="flex items-center space-x-1 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-foreground rounded p-1"
              aria-label="Accessibility settings and features"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span>Accessibility</span>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav 
            id="mobile-menu"
            className="md:hidden py-4 border-t border-primary-foreground/20"
            role="navigation" 
            aria-label="Mobile navigation"
          >
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <label htmlFor="mobile-search-input" className="sr-only">
                  Search for movies
                </label>
                <Input
                  id="mobile-search-input"
                  type="search"
                  placeholder="Search accessible movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-primary-foreground text-primary"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  variant="secondary"
                  aria-label="Search movies"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                </Button>
              </form>

              <div className="space-y-2">
                <Link 
                  to="/favorites" 
                  className="flex items-center space-x-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-foreground rounded p-2"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="View favorite movies"
                >
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  <span>Favorites</span>
                </Link>

                <Link 
                  to="/accessibility" 
                  className="flex items-center space-x-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-foreground rounded p-2"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Accessibility settings and features"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  <span>Accessibility</span>
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
