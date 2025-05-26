import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Mail, MessageSquare } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

interface UserProfile {
  first_name?: string;
  user_type?: string;
}

interface HelpPageProps {
  userProfile?: UserProfile;
}

interface FaqItem {
  question: string;
  answer: string;
}

export const HelpPage: React.FC<HelpPageProps> = (props) => {
  const outletContext = useOutletContext<UserProfile>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userProfile = props.userProfile || outletContext;
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const faqs: FaqItem[] = [
    {
      question: 'How are job matches determined?',
      answer: 'Job matches are determined based on your skills, experience, location preferences, and career interests. Our matching algorithm analyzes these factors along with job requirements to find the best opportunities for you. The more complete your profile is, the better your matches will be.'
    },
    {
      question: 'How do I update my resume?',
      answer: 'You can update your resume by navigating to the Resume page in your dashboard. There you can upload a new resume in PDF, DOC, or DOCX format. After uploading, our system will analyze your resume to improve your job matches.'
    },
    {
      question: 'What should I do if I\'m not getting any job matches?',
      answer: 'If you\'re not seeing any job matches, try these steps: 1) Complete your profile with detailed skills and experience, 2) Upload an updated resume, 3) Expand your location preferences, 4) Add more skills and interests to your profile. If you still don\'t see matches, contact our support team for assistance.'
    },
    {
      question: 'How do I apply for a job?',
      answer: 'When you find a job you\'re interested in, click the "Apply" button on the job card. Depending on the employer\'s preferences, you may be directed to their application system or be able to apply directly through our platform. Make sure your profile and resume are up-to-date before applying.'
    },
    {
      question: 'What types of training programs are available?',
      answer: 'We offer a variety of training programs including online courses, in-person workshops, certification programs, and apprenticeships. These programs cover various aspects of clean energy careers, from technical skills to professional development. Training recommendations are personalized based on your profile and career goals.'
    },
    {
      question: 'How do I enroll in a training program?',
      answer: 'To enroll in a training program, navigate to the program details page by clicking on a training card. There you\'ll find enrollment instructions and requirements. Some programs allow direct enrollment through our platform, while others will direct you to the provider\'s website.'
    },
    {
      question: 'Is there a cost for using this platform?',
      answer: 'No, our platform is completely free for job seekers. We\'re funded by partner organizations committed to growing the clean energy workforce. While some training programs may have associated costs, using our job matching and career resources is always free.'
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this to your backend
    console.log('Contact form submitted:', contactForm);
    setFormSubmitted(true);
    setContactForm({ subject: '', message: '' });

    // Reset form submitted state after 5 seconds
    setTimeout(() => {
      setFormSubmitted(false);
    }, 5000);
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Help & Support</h1>
        <p className="mt-2 text-neutral-600">
          Find answers to common questions and get support when you need it
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {/* FAQs Section */}
          <div className="card p-6">
            <div className="mb-6 flex items-center">
              <HelpCircle className="mr-2 h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="rounded-lg border border-neutral-200">
                  <button
                    className="flex w-full items-center justify-between p-4 text-left font-medium text-neutral-900"
                    onClick={() => toggleFaq(index)}
                  >
                    <span>{faq.question}</span>
                    {openFaqIndex === index ? (
                      <ChevronUp className="h-5 w-5 text-neutral-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-neutral-500" />
                    )}
                  </button>

                  {openFaqIndex === index && (
                    <div className="border-t border-neutral-200 p-4 text-neutral-700">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {/* Contact Support Section */}
          <div className="card p-6">
            <div className="mb-6 flex items-center">
              <Mail className="mr-2 h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Contact Support</h2>
            </div>

            {formSubmitted ? (
              <div className="rounded-lg bg-green-50 p-4 text-green-700">
                <p className="font-medium">Message sent successfully!</p>
                <p className="mt-1 text-sm">Our support team will get back to you within 24-48 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-neutral-700">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleContactChange}
                    required
                    className="mt-1 input"
                    placeholder="How can we help you?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-neutral-700">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={contactForm.message}
                    onChange={handleContactChange}
                    required
                    rows={5}
                    className="mt-1 input"
                    placeholder="Please describe your issue or question in detail"
                  />
                </div>

                <button type="submit" className="btn-primary w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Chat Support Section */}
          <div className="mt-6 card p-6">
            <div className="mb-6 flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Chat Support</h2>
            </div>

            <div className="text-center">
              <p className="text-neutral-700">
                Need immediate assistance? Chat with our support team or AI assistant.
              </p>
              <button className="mt-4 btn-secondary w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Start Chat
              </button>
            </div>
          </div>

          {/* Support Hours */}
          <div className="mt-6 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-700">
            <p className="font-medium">Support Hours</p>
            <p className="mt-1">Monday - Friday: 9am - 5pm ET</p>
            <p>Email response time: 24-48 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
};
