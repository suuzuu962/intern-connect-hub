import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Instagram, Facebook, Youtube, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SocialLinks {
  socialTwitterUrl: string;
  socialInstagramUrl: string;
  socialLinkedinUrl: string;
  socialFacebookUrl: string;
  socialTelegramUrl: string;
  socialDiscordUrl: string;
  socialYoutubeUrl: string;
  socialWhatsappUrl: string;
  supportEmail: string;
  supportPhone: string;
  supportAddress: string;
}

const defaults: SocialLinks = {
  socialTwitterUrl: '',
  socialInstagramUrl: '',
  socialLinkedinUrl: '',
  socialFacebookUrl: '',
  socialTelegramUrl: '',
  socialDiscordUrl: '',
  socialYoutubeUrl: '',
  socialWhatsappUrl: '',
  supportEmail: 'econfinexplorationpvtltd@gmail.com',
  supportPhone: '+91 8147 747 147',
  supportAddress: 'Shastri Nagar 1st Cross 3rd House, Bellary, Karnataka, India - 583101',
};

export const Footer = () => {
  const [links, setLinks] = useState<SocialLinks>(defaults);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const { data } = await supabase
          .from('platform_settings')
          .select('value')
          .eq('key', 'all_settings')
          .single();
        if (data?.value) {
          const v = data.value as Record<string, any>;
          setLinks({
            socialTwitterUrl: v.socialTwitterUrl || '',
            socialInstagramUrl: v.socialInstagramUrl || '',
            socialLinkedinUrl: v.socialLinkedinUrl || '',
            socialFacebookUrl: v.socialFacebookUrl || '',
            socialTelegramUrl: v.socialTelegramUrl || '',
            socialDiscordUrl: v.socialDiscordUrl || '',
            socialYoutubeUrl: v.socialYoutubeUrl || '',
            socialWhatsappUrl: v.socialWhatsappUrl || '',
            supportEmail: v.supportEmail || defaults.supportEmail,
            supportPhone: v.supportPhone || defaults.supportPhone,
            supportAddress: v.supportAddress || defaults.supportAddress,
          });
        }
      } catch (e) {
        // use defaults
      }
    };
    fetchLinks();
  }, []);

  const socialItems = [
    { url: links.socialTwitterUrl, label: 'X (Twitter)', icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    )},
    { url: links.socialInstagramUrl, label: 'Instagram', icon: <Instagram className="h-5 w-5" /> },
    { url: links.socialLinkedinUrl, label: 'LinkedIn', icon: <Linkedin className="h-5 w-5" /> },
    { url: links.socialFacebookUrl, label: 'Facebook', icon: <Facebook className="h-5 w-5" /> },
    { url: links.socialTelegramUrl, label: 'Telegram', icon: <Send className="h-5 w-5" /> },
    { url: links.socialDiscordUrl, label: 'Discord', icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/></svg>
    )},
    { url: links.socialYoutubeUrl, label: 'YouTube', icon: <Youtube className="h-5 w-5" /> },
    { url: links.socialWhatsappUrl, label: 'WhatsApp', icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    )},
  ];

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
            <div className="flex flex-wrap gap-4 mt-5">
              {socialItems.map((item) => (
                <a
                  key={item.label}
                  href={item.url || '#'}
                  target={item.url ? '_blank' : undefined}
                  rel={item.url ? 'noopener noreferrer' : undefined}
                  className="text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-200"
                  aria-label={item.label}
                >
                  {item.icon}
                </a>
              ))}
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
                  {links.supportAddress}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary-foreground/60 shrink-0" />
                <span className="text-primary-foreground/70 text-sm">{links.supportPhone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary-foreground/60 shrink-0" />
                <span className="text-primary-foreground/70 text-sm break-all">{links.supportEmail}</span>
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
