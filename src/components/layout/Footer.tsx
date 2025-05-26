import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-midnight-forest-200 bg-white">
      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo and About */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <Sun className="h-6 w-6 text-spring-green-500" />
              <span className="ml-2 text-lg font-bold text-midnight-forest-900">Climate Ecosystem</span>
            </Link>
            <p className="text-sm text-midnight-forest-600">
              Connecting communities with clean energy opportunities and building a more sustainable future together.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-midnight-forest-600 hover:text-spring-green-600">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-midnight-forest-600 hover:text-spring-green-600">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-midnight-forest-900">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className="text-sm text-midnight-forest-600 hover:text-spring-green-600">Home</Link>
              </li>
              <li>
                <Link to="/#about" className="text-sm text-midnight-forest-600 hover:text-spring-green-600">About</Link>
              </li>
              <li>
                <Link to="/#how-it-works" className="text-sm text-midnight-forest-600 hover:text-spring-green-600">How It Works</Link>
              </li>
              <li>
                <Link to="/#resources" className="text-sm text-midnight-forest-600 hover:text-spring-green-600">Resources</Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-midnight-forest-900">Resources</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#" className="text-sm text-midnight-forest-600 hover:text-spring-green-600">Career Guides</a>
              </li>
              <li>
                <a href="#" className="text-sm text-midnight-forest-600 hover:text-spring-green-600">Training Programs</a>
              </li>
              <li>
                <a href="#" className="text-sm text-midnight-forest-600 hover:text-spring-green-600">Job Board</a>
              </li>
              <li>
                <a href="#" className="text-sm text-midnight-forest-600 hover:text-spring-green-600">Partner Directory</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-midnight-forest-900">Contact</h3>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center text-sm text-midnight-forest-600">
                <Mail className="mr-2 h-4 w-4 text-midnight-forest-400" />
                <a href="mailto:info@climateecosystem.org" className="hover:text-spring-green-600">info@climateecosystem.org</a>
              </li>
              <li className="flex items-center text-sm text-midnight-forest-600">
                <Phone className="mr-2 h-4 w-4 text-midnight-forest-400" />
                <a href="tel:+16175551234" className="hover:text-spring-green-600">(617) 555-1234</a>
              </li>
              <li className="flex items-start text-sm text-midnight-forest-600">
                <MapPin className="mr-2 h-4 w-4 text-midnight-forest-400 mt-1" />
                <span>123 Clean Energy Way<br />Boston, MA 02108</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-midnight-forest-200 pt-8">
          <p className="text-center text-xs text-midnight-forest-500">
            &copy; {new Date().getFullYear()} Climate Ecosystem Assistant. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};