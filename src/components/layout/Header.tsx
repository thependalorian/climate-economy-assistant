import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Sun, Globe } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  // Mock authentication state
  const isAuthenticated = false;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const navigation = [
    { name: 'Home', path: '/', current: location.pathname === '/' },
    { name: 'About', path: '/#about', current: location.pathname === '/#about' },
    { name: 'How It Works', path: '/#how-it-works', current: location.pathname === '/#how-it-works' },
    { name: 'Resources', path: '/#resources', current: location.pathname === '/#resources' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-midnight-forest-200 bg-white/80 backdrop-blur-lg">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center" onClick={closeMenu}>
              <Sun className="h-8 w-8 text-spring-green-500" />
              <span className="ml-2 text-xl font-bold text-midnight-forest-900">Climate Ecosystem</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-spring-green-600",
                      item.current ? "text-spring-green-500" : "text-midnight-forest-600"
                    )}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button 
              type="button" 
              className="hidden items-center text-sm font-medium text-midnight-forest-600 hover:text-spring-green-600 md:flex"
              aria-label="Change language"
            >
              <Globe className="mr-1 h-4 w-4" />
              <span>EN</span>
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
            
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="hidden rounded-lg bg-spring-green-500 px-4 py-2 text-sm font-medium text-midnight-forest-900 hover:bg-spring-green-600 md:block"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden text-sm font-medium text-midnight-forest-600 hover:text-spring-green-600 md:block"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="hidden rounded-lg bg-spring-green-500 px-4 py-2 text-sm font-medium text-midnight-forest-900 hover:bg-spring-green-600 md:block"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-midnight-forest-600 hover:bg-midnight-forest-50 hover:text-midnight-forest-800 md:hidden"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="container mx-auto space-y-1 px-2 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "block rounded-lg px-3 py-2 text-base font-medium",
                  item.current
                    ? "bg-spring-green-50 text-spring-green-600"
                    : "text-midnight-forest-600 hover:bg-midnight-forest-50 hover:text-midnight-forest-800"
                )}
                onClick={closeMenu}
              >
                {item.name}
              </Link>
            ))}
            <div className="mt-4 flex flex-col space-y-2 pt-4 border-t border-midnight-forest-200">
              <button 
                type="button" 
                className="flex items-center px-3 py-2 text-base font-medium text-midnight-forest-600"
                aria-label="Change language"
              >
                <Globe className="mr-2 h-5 w-5" />
                <span>English</span>
                <ChevronDown className="ml-2 h-5 w-5" />
              </button>
              
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="rounded-lg bg-spring-green-500 px-3 py-2 text-center text-base font-medium text-midnight-forest-900 hover:bg-spring-green-600"
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-lg px-3 py-2 text-center text-base font-medium text-midnight-forest-600 hover:bg-midnight-forest-50"
                    onClick={closeMenu}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-lg bg-spring-green-500 px-3 py-2 text-center text-base font-medium text-midnight-forest-900 hover:bg-spring-green-600"
                    onClick={closeMenu}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};