import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Twitter, Instagram } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* About Economic Labs */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl gradient-secondary flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-white">EL</span>
              </div>
              <span className="text-lg font-heading font-bold">Economic Labs</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-xs">
              Bridging the gap between talented students and innovative companies. 
              Your gateway to meaningful internship experiences and future career opportunities.
            </p>
            <div className="flex gap-4 mt-5">
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-200" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-200" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-200" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-semibold text-base mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">Home</Link></li>
              <li><Link to="/internships" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">Internships</Link></li>
              <li><Link to="/companies" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">Companies</Link></li>
              <li><Link to="/about" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">About Us</Link></li>
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="font-heading font-semibold text-base mb-4">Useful Links</h3>
            <ul className="space-y-2.5">
              <li><a href="/for-universities" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm font-medium">For Universities</a></li>
              <li><Link to="/faq" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">FAQs</Link></li>
              <li><Link to="/notifications" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">Notifications</Link></li>
              <li><Link to="/privacy" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-semibold text-base mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary-foreground/60 shrink-0 mt-0.5" />
                <span className="text-primary-foreground/70 text-sm leading-relaxed">
                  Shastri Nagar 1st Cross 3rd House, Bellary, Karnataka, India - 583101
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary-foreground/60 shrink-0" />
                <span className="text-primary-foreground/70 text-sm">+91 8147 747 147</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary-foreground/60 shrink-0" />
                <span className="text-primary-foreground/70 text-sm break-all">econfinexplorationpvtltd@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-primary-foreground/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-primary-foreground/50 text-xs sm:text-sm">
              © {new Date().getFullYear()} Economic Labs. All rights reserved.
            </p>
            <div className="flex gap-4 sm:gap-6">
              <Link to="/privacy" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors text-xs sm:text-sm">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-primary-foreground/50 hover:text-primary-foreground transition-colors text-xs sm:text-sm">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};