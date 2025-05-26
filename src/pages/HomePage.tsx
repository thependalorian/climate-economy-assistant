import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Briefcase, GraduationCap, Lightbulb } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-sand-gray-50">
      {/* Hero Section */}
      <section className="act-hero section-lg">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center act-fade-in">
            <h1 className="font-display font-light text-5xl md:text-6xl lg:text-7xl text-midnight-forest mb-6 tracking-act-tight leading-act-tight">
              Connecting Talent with Clean Energy Opportunities
            </h1>
            <p className="font-body text-xl md:text-2xl text-midnight-forest-700 mb-8 max-w-3xl mx-auto tracking-act-tight leading-act-normal">
              The Climate Ecosystem Assistant helps you discover your path in Massachusetts' growing clean energy economy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register" className="w-full sm:w-auto">
                <button className="btn-primary text-lg px-8 py-4 w-full sm:w-auto inline-flex items-center justify-center">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </Link>
              <Link to="/register?type=partner" className="w-full sm:w-auto">
                <button className="btn-outline text-lg px-8 py-4 w-full sm:w-auto inline-flex items-center justify-center">
                  Partner With Us
                  <Users className="ml-2 h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Career Sectors */}
      <section className="section bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display font-normal text-4xl md:text-5xl text-midnight-forest mb-4 tracking-act-tight leading-act-tight">
              Explore Clean Energy Careers
            </h2>
            <p className="font-body text-lg text-midnight-forest-600 max-w-2xl mx-auto tracking-act-tight leading-act-normal">
              Discover opportunities across Massachusetts' thriving clean energy sectors
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Renewable Energy', icon: <Lightbulb className="h-8 w-8" /> },
              { name: 'Energy Efficiency', icon: <Briefcase className="h-8 w-8" /> },
              { name: 'Clean Transportation', icon: <GraduationCap className="h-8 w-8" /> },
              { name: 'Grid Modernization', icon: <Users className="h-8 w-8" /> },
              { name: 'Offshore Wind', icon: <Lightbulb className="h-8 w-8" /> },
              { name: 'High-Performance Buildings', icon: <Briefcase className="h-8 w-8" /> }
            ].map((sector, index) => (
              <div
                key={sector.name}
                className="card act-card-hover act-bracket p-6"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-spring-green-100 rounded-act text-spring-green-700 mr-4">
                    {sector.icon}
                  </div>
                  <h3 className="card-title text-xl">{sector.name}</h3>
                </div>
                <p className="font-body text-midnight-forest-600 text-sm tracking-act-tight leading-act-normal">
                  Explore career opportunities and training programs in this growing sector.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-sand-gray-100">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display font-normal text-4xl md:text-5xl text-midnight-forest mb-4 tracking-act-tight leading-act-tight">
              How It Works
            </h2>
            <p className="font-body text-lg text-midnight-forest-600 max-w-2xl mx-auto tracking-act-tight leading-act-normal">
              Connecting talent with opportunities through AI-powered guidance and personalized matching
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="act-frame bg-white p-8">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-spring-green rounded-act text-midnight-forest mr-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-display font-medium text-2xl md:text-3xl text-midnight-forest tracking-act-tight leading-act-tight">
                  For Job Seekers
                </h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex items-center justify-center w-6 h-6 bg-spring-green-100 rounded-full text-spring-green-700 mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-xs font-medium">1</span>
                  </div>
                  <span className="font-body text-midnight-forest tracking-act-tight leading-act-normal">
                    Upload your resume for personalized skill analysis
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center justify-center w-6 h-6 bg-spring-green-100 rounded-full text-spring-green-700 mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-xs font-medium">2</span>
                  </div>
                  <span className="font-body text-midnight-forest tracking-act-tight leading-act-normal">
                    Explore career paths that match your experience
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center justify-center w-6 h-6 bg-spring-green-100 rounded-full text-spring-green-700 mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-xs font-medium">3</span>
                  </div>
                  <span className="font-body text-midnight-forest tracking-act-tight leading-act-normal">
                    Find training programs to build in-demand skills
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center justify-center w-6 h-6 bg-spring-green-100 rounded-full text-spring-green-700 mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-xs font-medium">4</span>
                  </div>
                  <span className="font-body text-midnight-forest tracking-act-tight leading-act-normal">
                    Connect with employers seeking your talents
                  </span>
                </li>
              </ul>
            </div>
            <div className="act-frame bg-white p-8">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-moss-green rounded-act text-white mr-4">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="font-display font-medium text-2xl md:text-3xl text-midnight-forest tracking-act-tight leading-act-tight">
                  For Employers & Partners
                </h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex items-center justify-center w-6 h-6 bg-moss-green-100 rounded-full text-moss-green-700 mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-xs font-medium">1</span>
                  </div>
                  <span className="font-body text-midnight-forest tracking-act-tight leading-act-normal">
                    Access a diverse pool of qualified candidates
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center justify-center w-6 h-6 bg-moss-green-100 rounded-full text-moss-green-700 mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-xs font-medium">2</span>
                  </div>
                  <span className="font-body text-midnight-forest tracking-act-tight leading-act-normal">
                    Share job opportunities and training programs
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center justify-center w-6 h-6 bg-moss-green-100 rounded-full text-moss-green-700 mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-xs font-medium">3</span>
                  </div>
                  <span className="font-body text-midnight-forest tracking-act-tight leading-act-normal">
                    Contribute to Massachusetts' clean energy future
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center justify-center w-6 h-6 bg-moss-green-100 rounded-full text-moss-green-700 mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-xs font-medium">4</span>
                  </div>
                  <span className="font-body text-midnight-forest tracking-act-tight leading-act-normal">
                    Build a more inclusive workforce
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Partners */}
      <section className="section bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display font-normal text-4xl md:text-5xl text-midnight-forest mb-4 tracking-act-tight leading-act-tight">
              Featured Partners
            </h2>
            <p className="font-body text-lg text-midnight-forest-600 max-w-2xl mx-auto tracking-act-tight leading-act-normal">
              Working with leading organizations to build Massachusetts' clean energy workforce
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Massachusetts Clean Energy Center (MassCEC)',
                description: 'Accelerating the growth of the Commonwealth\'s clean energy economy'
              },
              {
                name: 'MassHire Career Centers',
                description: 'Connecting job seekers with employment and training opportunities'
              },
              {
                name: 'Alliance for Climate Transition (ACT)',
                description: 'Advocating for climate action and innovation'
              },
              {
                name: 'Franklin Cummings Tech',
                description: 'Providing specialized education in renewable energy and energy efficiency'
              }
            ].map((partner, index) => (
              <div
                key={partner.name}
                className="card act-card-hover p-6"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <h3 className="card-title text-xl mb-3">{partner.name}</h3>
                <p className="font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
                  {partner.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="section bg-sand-gray-100">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display font-normal text-4xl md:text-5xl text-midnight-forest mb-4 tracking-act-tight leading-act-tight">
              Success Stories
            </h2>
            <p className="font-body text-lg text-midnight-forest-600 max-w-2xl mx-auto tracking-act-tight leading-act-normal">
              Real people building careers in Massachusetts' clean energy economy
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="card act-bracket bg-white p-8">
              <div className="mb-6">
                <div className="w-12 h-12 bg-spring-green-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-spring-green-700" />
                </div>
                <blockquote className="font-body text-lg text-midnight-forest italic tracking-act-tight leading-act-relaxed mb-4">
                  "The Climate Ecosystem Assistant helped me understand how my manufacturing experience could transfer to solar installation. Now I'm earning more while helping build a sustainable future."
                </blockquote>
                <cite className="font-body font-medium text-midnight-forest-700 tracking-act-tight">
                  — Michael, Solar PV Installer
                </cite>
              </div>
            </div>
            <div className="card act-bracket bg-white p-8">
              <div className="mb-6">
                <div className="w-12 h-12 bg-moss-green-100 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="h-6 w-6 text-moss-green-700" />
                </div>
                <blockquote className="font-body text-lg text-midnight-forest italic tracking-act-tight leading-act-relaxed mb-4">
                  "As an international professional, I struggled to get my engineering credentials recognized. This platform connected me with the right resources and now I'm working in grid modernization."
                </blockquote>
                <cite className="font-body font-medium text-midnight-forest-700 tracking-act-tight">
                  — Aisha, Electrical Engineer
                </cite>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="act-divider"></div>

      {/* Call to Action */}
      <section className="section-lg bg-moss-green text-white">
        <div className="container text-center">
          <div className="max-w-4xl mx-auto act-bracket-lg">
            <h2 className="font-display font-light text-4xl md:text-5xl lg:text-6xl mb-6 tracking-act-tight leading-act-tight">
              Get Started Today
            </h2>
            <p className="font-body text-xl md:text-2xl mb-8 text-white/90 tracking-act-tight leading-act-normal">
              Join the thousands of Massachusetts residents building careers in the clean energy economy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register" className="w-full sm:w-auto">
                <button className="bg-spring-green text-midnight-forest font-medium text-lg px-8 py-4 rounded-act hover:bg-spring-green-600 transition-all duration-200 inline-flex items-center justify-center shadow-lg hover:shadow-xl w-full sm:w-auto">
                  Upload Your Resume
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </Link>
              <Link to="/register" className="w-full sm:w-auto">
                <button className="border-2 border-white text-white font-medium text-lg px-8 py-4 rounded-act hover:bg-white hover:text-moss-green transition-all duration-200 inline-flex items-center justify-center w-full sm:w-auto">
                  Explore Opportunities
                  <Briefcase className="ml-2 h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="section-sm bg-sand-gray-200">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-body text-sm text-midnight-forest-600 italic tracking-act-tight leading-act-relaxed">
              The Climate Ecosystem Assistant is supported by the Massachusetts Clean Energy Center and the Alliance for Climate Transition to accelerate the Commonwealth's transition to a clean energy future while creating pathways to economic opportunity for all residents.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;