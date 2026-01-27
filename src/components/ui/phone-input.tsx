import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const countryCodes = [
  // Priority countries
  { code: '+91', country: 'IN', name: 'India', native: 'भारत', flag: '🇮🇳' },
  { code: '+1', country: 'US', name: 'United States', native: '', flag: '🇺🇸' },
  { code: '+1', country: 'CA', name: 'Canada', native: '', flag: '🇨🇦' },
  // All countries alphabetically
  { code: '+93', country: 'AF', name: 'Afghanistan', native: 'افغانستان', flag: '🇦🇫' },
  { code: '+355', country: 'AL', name: 'Albania', native: 'Shqipëri', flag: '🇦🇱' },
  { code: '+213', country: 'DZ', name: 'Algeria', native: 'الجزائر', flag: '🇩🇿' },
  { code: '+1684', country: 'AS', name: 'American Samoa', native: '', flag: '🇦🇸' },
  { code: '+376', country: 'AD', name: 'Andorra', native: '', flag: '🇦🇩' },
  { code: '+244', country: 'AO', name: 'Angola', native: '', flag: '🇦🇴' },
  { code: '+1264', country: 'AI', name: 'Anguilla', native: '', flag: '🇦🇮' },
  { code: '+1268', country: 'AG', name: 'Antigua and Barbuda', native: '', flag: '🇦🇬' },
  { code: '+54', country: 'AR', name: 'Argentina', native: '', flag: '🇦🇷' },
  { code: '+374', country: 'AM', name: 'Armenia', native: 'Հայաdelays', flag: '🇦🇲' },
  { code: '+297', country: 'AW', name: 'Aruba', native: '', flag: '🇦🇼' },
  { code: '+61', country: 'AU', name: 'Australia', native: '', flag: '🇦🇺' },
  { code: '+43', country: 'AT', name: 'Austria', native: 'Österreich', flag: '🇦🇹' },
  { code: '+994', country: 'AZ', name: 'Azerbaijan', native: 'Azərbaycan', flag: '🇦🇿' },
  { code: '+1242', country: 'BS', name: 'Bahamas', native: '', flag: '🇧🇸' },
  { code: '+973', country: 'BH', name: 'Bahrain', native: 'البحرين', flag: '🇧🇭' },
  { code: '+880', country: 'BD', name: 'Bangladesh', native: 'বাংলাদেশ', flag: '🇧🇩' },
  { code: '+1246', country: 'BB', name: 'Barbados', native: '', flag: '🇧🇧' },
  { code: '+375', country: 'BY', name: 'Belarus', native: 'Беларусь', flag: '🇧🇾' },
  { code: '+32', country: 'BE', name: 'Belgium', native: 'België', flag: '🇧🇪' },
  { code: '+501', country: 'BZ', name: 'Belize', native: '', flag: '🇧🇿' },
  { code: '+229', country: 'BJ', name: 'Benin', native: 'Bénin', flag: '🇧🇯' },
  { code: '+1441', country: 'BM', name: 'Bermuda', native: '', flag: '🇧🇲' },
  { code: '+975', country: 'BT', name: 'Bhutan', native: 'འབྲུག', flag: '🇧🇹' },
  { code: '+591', country: 'BO', name: 'Bolivia', native: '', flag: '🇧🇴' },
  { code: '+387', country: 'BA', name: 'Bosnia and Herzegovina', native: 'Bosna i Hercegovina', flag: '🇧🇦' },
  { code: '+267', country: 'BW', name: 'Botswana', native: '', flag: '🇧🇼' },
  { code: '+55', country: 'BR', name: 'Brazil', native: 'Brasil', flag: '🇧🇷' },
  { code: '+673', country: 'BN', name: 'Brunei', native: 'Brunei', flag: '🇧🇳' },
  { code: '+359', country: 'BG', name: 'Bulgaria', native: 'България', flag: '🇧🇬' },
  { code: '+226', country: 'BF', name: 'Burkina Faso', native: '', flag: '🇧🇫' },
  { code: '+257', country: 'BI', name: 'Burundi', native: 'Uburundi', flag: '🇧🇮' },
  { code: '+855', country: 'KH', name: 'Cambodia', native: 'កម្ពុជា', flag: '🇰🇭' },
  { code: '+237', country: 'CM', name: 'Cameroon', native: 'Cameroun', flag: '🇨🇲' },
  { code: '+238', country: 'CV', name: 'Cape Verde', native: 'Kabu Verdi', flag: '🇨🇻' },
  { code: '+1345', country: 'KY', name: 'Cayman Islands', native: '', flag: '🇰🇾' },
  { code: '+236', country: 'CF', name: 'Central African Republic', native: '', flag: '🇨🇫' },
  { code: '+235', country: 'TD', name: 'Chad', native: 'Tchad', flag: '🇹🇩' },
  { code: '+56', country: 'CL', name: 'Chile', native: '', flag: '🇨🇱' },
  { code: '+86', country: 'CN', name: 'China', native: '中国', flag: '🇨🇳' },
  { code: '+57', country: 'CO', name: 'Colombia', native: '', flag: '🇨🇴' },
  { code: '+269', country: 'KM', name: 'Comoros', native: 'جزر القمر', flag: '🇰🇲' },
  { code: '+242', country: 'CG', name: 'Congo', native: 'Congo-Brazzaville', flag: '🇨🇬' },
  { code: '+243', country: 'CD', name: 'Congo (DRC)', native: 'Jamhuri ya Kidemokrasia ya Kongo', flag: '🇨🇩' },
  { code: '+682', country: 'CK', name: 'Cook Islands', native: '', flag: '🇨🇰' },
  { code: '+506', country: 'CR', name: 'Costa Rica', native: '', flag: '🇨🇷' },
  { code: '+225', country: 'CI', name: "Côte d'Ivoire", native: '', flag: '🇨🇮' },
  { code: '+385', country: 'HR', name: 'Croatia', native: 'Hrvatska', flag: '🇭🇷' },
  { code: '+53', country: 'CU', name: 'Cuba', native: '', flag: '🇨🇺' },
  { code: '+357', country: 'CY', name: 'Cyprus', native: 'Κύπρος', flag: '🇨🇾' },
  { code: '+420', country: 'CZ', name: 'Czech Republic', native: 'Česká republika', flag: '🇨🇿' },
  { code: '+45', country: 'DK', name: 'Denmark', native: 'Danmark', flag: '🇩🇰' },
  { code: '+253', country: 'DJ', name: 'Djibouti', native: '', flag: '🇩🇯' },
  { code: '+1767', country: 'DM', name: 'Dominica', native: '', flag: '🇩🇲' },
  { code: '+1809', country: 'DO', name: 'Dominican Republic', native: 'República Dominicana', flag: '🇩🇴' },
  { code: '+593', country: 'EC', name: 'Ecuador', native: '', flag: '🇪🇨' },
  { code: '+20', country: 'EG', name: 'Egypt', native: 'مصر', flag: '🇪🇬' },
  { code: '+503', country: 'SV', name: 'El Salvador', native: '', flag: '🇸🇻' },
  { code: '+240', country: 'GQ', name: 'Equatorial Guinea', native: 'Guinea Ecuatorial', flag: '🇬🇶' },
  { code: '+291', country: 'ER', name: 'Eritrea', native: '', flag: '🇪🇷' },
  { code: '+372', country: 'EE', name: 'Estonia', native: 'Eesti', flag: '🇪🇪' },
  { code: '+251', country: 'ET', name: 'Ethiopia', native: '', flag: '🇪🇹' },
  { code: '+500', country: 'FK', name: 'Falkland Islands', native: '', flag: '🇫🇰' },
  { code: '+298', country: 'FO', name: 'Faroe Islands', native: 'Føroyar', flag: '🇫🇴' },
  { code: '+679', country: 'FJ', name: 'Fiji', native: '', flag: '🇫🇯' },
  { code: '+358', country: 'FI', name: 'Finland', native: 'Suomi', flag: '🇫🇮' },
  { code: '+33', country: 'FR', name: 'France', native: '', flag: '🇫🇷' },
  { code: '+594', country: 'GF', name: 'French Guiana', native: 'Guyane française', flag: '🇬🇫' },
  { code: '+689', country: 'PF', name: 'French Polynesia', native: 'Polynésie française', flag: '🇵🇫' },
  { code: '+241', country: 'GA', name: 'Gabon', native: '', flag: '🇬🇦' },
  { code: '+220', country: 'GM', name: 'Gambia', native: '', flag: '🇬🇲' },
  { code: '+995', country: 'GE', name: 'Georgia', native: 'საქართველო', flag: '🇬🇪' },
  { code: '+49', country: 'DE', name: 'Germany', native: 'Deutschland', flag: '🇩🇪' },
  { code: '+233', country: 'GH', name: 'Ghana', native: 'Gaana', flag: '🇬🇭' },
  { code: '+350', country: 'GI', name: 'Gibraltar', native: '', flag: '🇬🇮' },
  { code: '+30', country: 'GR', name: 'Greece', native: 'Ελλάδα', flag: '🇬🇷' },
  { code: '+299', country: 'GL', name: 'Greenland', native: 'Kalaallit Nunaat', flag: '🇬🇱' },
  { code: '+1473', country: 'GD', name: 'Grenada', native: '', flag: '🇬🇩' },
  { code: '+590', country: 'GP', name: 'Guadeloupe', native: '', flag: '🇬🇵' },
  { code: '+1671', country: 'GU', name: 'Guam', native: '', flag: '🇬🇺' },
  { code: '+502', country: 'GT', name: 'Guatemala', native: '', flag: '🇬🇹' },
  { code: '+44', country: 'GG', name: 'Guernsey', native: '', flag: '🇬🇬' },
  { code: '+224', country: 'GN', name: 'Guinea', native: 'Guinée', flag: '🇬🇳' },
  { code: '+245', country: 'GW', name: 'Guinea-Bissau', native: 'Guiné-Bissau', flag: '🇬🇼' },
  { code: '+592', country: 'GY', name: 'Guyana', native: '', flag: '🇬🇾' },
  { code: '+509', country: 'HT', name: 'Haiti', native: '', flag: '🇭🇹' },
  { code: '+504', country: 'HN', name: 'Honduras', native: '', flag: '🇭🇳' },
  { code: '+852', country: 'HK', name: 'Hong Kong', native: '香港', flag: '🇭🇰' },
  { code: '+36', country: 'HU', name: 'Hungary', native: 'Magyarország', flag: '🇭🇺' },
  { code: '+354', country: 'IS', name: 'Iceland', native: 'Ísland', flag: '🇮🇸' },
  { code: '+62', country: 'ID', name: 'Indonesia', native: '', flag: '🇮🇩' },
  { code: '+98', country: 'IR', name: 'Iran', native: 'ایران', flag: '🇮🇷' },
  { code: '+964', country: 'IQ', name: 'Iraq', native: 'العراق', flag: '🇮🇶' },
  { code: '+353', country: 'IE', name: 'Ireland', native: 'Éire', flag: '🇮🇪' },
  { code: '+44', country: 'IM', name: 'Isle of Man', native: '', flag: '🇮🇲' },
  { code: '+972', country: 'IL', name: 'Israel', native: 'ישראל', flag: '🇮🇱' },
  { code: '+39', country: 'IT', name: 'Italy', native: 'Italia', flag: '🇮🇹' },
  { code: '+1876', country: 'JM', name: 'Jamaica', native: '', flag: '🇯🇲' },
  { code: '+81', country: 'JP', name: 'Japan', native: '日本', flag: '🇯🇵' },
  { code: '+44', country: 'JE', name: 'Jersey', native: '', flag: '🇯🇪' },
  { code: '+962', country: 'JO', name: 'Jordan', native: 'الأردن', flag: '🇯🇴' },
  { code: '+7', country: 'KZ', name: 'Kazakhstan', native: 'Казахстан', flag: '🇰🇿' },
  { code: '+254', country: 'KE', name: 'Kenya', native: '', flag: '🇰🇪' },
  { code: '+686', country: 'KI', name: 'Kiribati', native: '', flag: '🇰🇮' },
  { code: '+383', country: 'XK', name: 'Kosovo', native: '', flag: '🇽🇰' },
  { code: '+965', country: 'KW', name: 'Kuwait', native: 'الكويت', flag: '🇰🇼' },
  { code: '+996', country: 'KG', name: 'Kyrgyzstan', native: 'Кыргызстан', flag: '🇰🇬' },
  { code: '+856', country: 'LA', name: 'Laos', native: 'ລາວ', flag: '🇱🇦' },
  { code: '+371', country: 'LV', name: 'Latvia', native: 'Latvija', flag: '🇱🇻' },
  { code: '+961', country: 'LB', name: 'Lebanon', native: 'لبنان', flag: '🇱🇧' },
  { code: '+266', country: 'LS', name: 'Lesotho', native: '', flag: '🇱🇸' },
  { code: '+231', country: 'LR', name: 'Liberia', native: '', flag: '🇱🇷' },
  { code: '+218', country: 'LY', name: 'Libya', native: 'ليبيا', flag: '🇱🇾' },
  { code: '+423', country: 'LI', name: 'Liechtenstein', native: '', flag: '🇱🇮' },
  { code: '+370', country: 'LT', name: 'Lithuania', native: 'Lietuva', flag: '🇱🇹' },
  { code: '+352', country: 'LU', name: 'Luxembourg', native: '', flag: '🇱🇺' },
  { code: '+853', country: 'MO', name: 'Macau', native: '澳門', flag: '🇲🇴' },
  { code: '+389', country: 'MK', name: 'Macedonia', native: 'Македонија', flag: '🇲🇰' },
  { code: '+261', country: 'MG', name: 'Madagascar', native: 'Madagasikara', flag: '🇲🇬' },
  { code: '+265', country: 'MW', name: 'Malawi', native: '', flag: '🇲🇼' },
  { code: '+60', country: 'MY', name: 'Malaysia', native: '', flag: '🇲🇾' },
  { code: '+960', country: 'MV', name: 'Maldives', native: '', flag: '🇲🇻' },
  { code: '+223', country: 'ML', name: 'Mali', native: '', flag: '🇲🇱' },
  { code: '+356', country: 'MT', name: 'Malta', native: '', flag: '🇲🇹' },
  { code: '+692', country: 'MH', name: 'Marshall Islands', native: '', flag: '🇲🇭' },
  { code: '+596', country: 'MQ', name: 'Martinique', native: '', flag: '🇲🇶' },
  { code: '+222', country: 'MR', name: 'Mauritania', native: 'موريتانيا', flag: '🇲🇷' },
  { code: '+230', country: 'MU', name: 'Mauritius', native: 'Moris', flag: '🇲🇺' },
  { code: '+262', country: 'YT', name: 'Mayotte', native: '', flag: '🇾🇹' },
  { code: '+52', country: 'MX', name: 'Mexico', native: 'México', flag: '🇲🇽' },
  { code: '+691', country: 'FM', name: 'Micronesia', native: '', flag: '🇫🇲' },
  { code: '+373', country: 'MD', name: 'Moldova', native: 'Republica Moldova', flag: '🇲🇩' },
  { code: '+377', country: 'MC', name: 'Monaco', native: '', flag: '🇲🇨' },
  { code: '+976', country: 'MN', name: 'Mongolia', native: 'Монгол', flag: '🇲🇳' },
  { code: '+382', country: 'ME', name: 'Montenegro', native: 'Crna Gora', flag: '🇲🇪' },
  { code: '+1664', country: 'MS', name: 'Montserrat', native: '', flag: '🇲🇸' },
  { code: '+212', country: 'MA', name: 'Morocco', native: 'المغرب', flag: '🇲🇦' },
  { code: '+258', country: 'MZ', name: 'Mozambique', native: 'Moçambique', flag: '🇲🇿' },
  { code: '+95', country: 'MM', name: 'Myanmar', native: 'မြန်မာ', flag: '🇲🇲' },
  { code: '+264', country: 'NA', name: 'Namibia', native: 'Namibië', flag: '🇳🇦' },
  { code: '+674', country: 'NR', name: 'Nauru', native: '', flag: '🇳🇷' },
  { code: '+977', country: 'NP', name: 'Nepal', native: 'नेपाल', flag: '🇳🇵' },
  { code: '+31', country: 'NL', name: 'Netherlands', native: 'Nederland', flag: '🇳🇱' },
  { code: '+687', country: 'NC', name: 'New Caledonia', native: 'Nouvelle-Calédonie', flag: '🇳🇨' },
  { code: '+64', country: 'NZ', name: 'New Zealand', native: '', flag: '🇳🇿' },
  { code: '+505', country: 'NI', name: 'Nicaragua', native: '', flag: '🇳🇮' },
  { code: '+227', country: 'NE', name: 'Niger', native: 'Nijar', flag: '🇳🇪' },
  { code: '+234', country: 'NG', name: 'Nigeria', native: '', flag: '🇳🇬' },
  { code: '+683', country: 'NU', name: 'Niue', native: '', flag: '🇳🇺' },
  { code: '+672', country: 'NF', name: 'Norfolk Island', native: '', flag: '🇳🇫' },
  { code: '+850', country: 'KP', name: 'North Korea', native: '조선', flag: '🇰🇵' },
  { code: '+1670', country: 'MP', name: 'Northern Mariana Islands', native: '', flag: '🇲🇵' },
  { code: '+47', country: 'NO', name: 'Norway', native: 'Norge', flag: '🇳🇴' },
  { code: '+968', country: 'OM', name: 'Oman', native: 'عمان', flag: '🇴🇲' },
  { code: '+92', country: 'PK', name: 'Pakistan', native: 'پاکستان', flag: '🇵🇰' },
  { code: '+680', country: 'PW', name: 'Palau', native: '', flag: '🇵🇼' },
  { code: '+970', country: 'PS', name: 'Palestine', native: 'فلسطين', flag: '🇵🇸' },
  { code: '+507', country: 'PA', name: 'Panama', native: 'Panamá', flag: '🇵🇦' },
  { code: '+675', country: 'PG', name: 'Papua New Guinea', native: '', flag: '🇵🇬' },
  { code: '+595', country: 'PY', name: 'Paraguay', native: '', flag: '🇵🇾' },
  { code: '+51', country: 'PE', name: 'Peru', native: 'Perú', flag: '🇵🇪' },
  { code: '+63', country: 'PH', name: 'Philippines', native: 'Pilipinas', flag: '🇵🇭' },
  { code: '+48', country: 'PL', name: 'Poland', native: 'Polska', flag: '🇵🇱' },
  { code: '+351', country: 'PT', name: 'Portugal', native: '', flag: '🇵🇹' },
  { code: '+1787', country: 'PR', name: 'Puerto Rico', native: '', flag: '🇵🇷' },
  { code: '+974', country: 'QA', name: 'Qatar', native: 'قطر', flag: '🇶🇦' },
  { code: '+262', country: 'RE', name: 'Réunion', native: 'La Réunion', flag: '🇷🇪' },
  { code: '+40', country: 'RO', name: 'Romania', native: 'România', flag: '🇷🇴' },
  { code: '+7', country: 'RU', name: 'Russia', native: 'Россия', flag: '🇷🇺' },
  { code: '+250', country: 'RW', name: 'Rwanda', native: '', flag: '🇷🇼' },
  { code: '+590', country: 'BL', name: 'Saint Barthélemy', native: 'Saint-Barthélemy', flag: '🇧🇱' },
  { code: '+290', country: 'SH', name: 'Saint Helena', native: '', flag: '🇸🇭' },
  { code: '+1869', country: 'KN', name: 'Saint Kitts and Nevis', native: '', flag: '🇰🇳' },
  { code: '+1758', country: 'LC', name: 'Saint Lucia', native: '', flag: '🇱🇨' },
  { code: '+590', country: 'MF', name: 'Saint Martin', native: '', flag: '🇲🇫' },
  { code: '+508', country: 'PM', name: 'Saint Pierre and Miquelon', native: 'Saint-Pierre-et-Miquelon', flag: '🇵🇲' },
  { code: '+1784', country: 'VC', name: 'Saint Vincent and the Grenadines', native: '', flag: '🇻🇨' },
  { code: '+685', country: 'WS', name: 'Samoa', native: '', flag: '🇼🇸' },
  { code: '+378', country: 'SM', name: 'San Marino', native: '', flag: '🇸🇲' },
  { code: '+239', country: 'ST', name: 'São Tomé and Príncipe', native: 'São Tomé e Príncipe', flag: '🇸🇹' },
  { code: '+966', country: 'SA', name: 'Saudi Arabia', native: 'المملكة العربية السعودية', flag: '🇸🇦' },
  { code: '+221', country: 'SN', name: 'Senegal', native: 'Sénégal', flag: '🇸🇳' },
  { code: '+381', country: 'RS', name: 'Serbia', native: 'Србија', flag: '🇷🇸' },
  { code: '+248', country: 'SC', name: 'Seychelles', native: '', flag: '🇸🇨' },
  { code: '+232', country: 'SL', name: 'Sierra Leone', native: '', flag: '🇸🇱' },
  { code: '+65', country: 'SG', name: 'Singapore', native: '', flag: '🇸🇬' },
  { code: '+1721', country: 'SX', name: 'Sint Maarten', native: '', flag: '🇸🇽' },
  { code: '+421', country: 'SK', name: 'Slovakia', native: 'Slovensko', flag: '🇸🇰' },
  { code: '+386', country: 'SI', name: 'Slovenia', native: 'Slovenija', flag: '🇸🇮' },
  { code: '+677', country: 'SB', name: 'Solomon Islands', native: '', flag: '🇸🇧' },
  { code: '+252', country: 'SO', name: 'Somalia', native: 'Soomaaliya', flag: '🇸🇴' },
  { code: '+27', country: 'ZA', name: 'South Africa', native: '', flag: '🇿🇦' },
  { code: '+82', country: 'KR', name: 'South Korea', native: '대한민국', flag: '🇰🇷' },
  { code: '+211', country: 'SS', name: 'South Sudan', native: '', flag: '🇸🇸' },
  { code: '+34', country: 'ES', name: 'Spain', native: 'España', flag: '🇪🇸' },
  { code: '+94', country: 'LK', name: 'Sri Lanka', native: 'ශ්‍රී ලංකාව', flag: '🇱🇰' },
  { code: '+249', country: 'SD', name: 'Sudan', native: 'السودان', flag: '🇸🇩' },
  { code: '+597', country: 'SR', name: 'Suriname', native: '', flag: '🇸🇷' },
  { code: '+47', country: 'SJ', name: 'Svalbard and Jan Mayen', native: '', flag: '🇸🇯' },
  { code: '+268', country: 'SZ', name: 'Swaziland', native: '', flag: '🇸🇿' },
  { code: '+46', country: 'SE', name: 'Sweden', native: 'Sverige', flag: '🇸🇪' },
  { code: '+41', country: 'CH', name: 'Switzerland', native: 'Schweiz', flag: '🇨🇭' },
  { code: '+963', country: 'SY', name: 'Syria', native: 'سوريا', flag: '🇸🇾' },
  { code: '+886', country: 'TW', name: 'Taiwan', native: '台灣', flag: '🇹🇼' },
  { code: '+992', country: 'TJ', name: 'Tajikistan', native: '', flag: '🇹🇯' },
  { code: '+255', country: 'TZ', name: 'Tanzania', native: '', flag: '🇹🇿' },
  { code: '+66', country: 'TH', name: 'Thailand', native: 'ไทย', flag: '🇹🇭' },
  { code: '+670', country: 'TL', name: 'Timor-Leste', native: '', flag: '🇹🇱' },
  { code: '+228', country: 'TG', name: 'Togo', native: '', flag: '🇹🇬' },
  { code: '+690', country: 'TK', name: 'Tokelau', native: '', flag: '🇹🇰' },
  { code: '+676', country: 'TO', name: 'Tonga', native: '', flag: '🇹🇴' },
  { code: '+1868', country: 'TT', name: 'Trinidad and Tobago', native: '', flag: '🇹🇹' },
  { code: '+216', country: 'TN', name: 'Tunisia', native: 'تونس', flag: '🇹🇳' },
  { code: '+90', country: 'TR', name: 'Turkey', native: 'Türkiye', flag: '🇹🇷' },
  { code: '+993', country: 'TM', name: 'Turkmenistan', native: '', flag: '🇹🇲' },
  { code: '+1649', country: 'TC', name: 'Turks and Caicos Islands', native: '', flag: '🇹🇨' },
  { code: '+688', country: 'TV', name: 'Tuvalu', native: '', flag: '🇹🇻' },
  { code: '+1340', country: 'VI', name: 'U.S. Virgin Islands', native: '', flag: '🇻🇮' },
  { code: '+256', country: 'UG', name: 'Uganda', native: '', flag: '🇺🇬' },
  { code: '+380', country: 'UA', name: 'Ukraine', native: 'Україна', flag: '🇺🇦' },
  { code: '+971', country: 'AE', name: 'United Arab Emirates', native: 'الإمارات العربية المتحدة', flag: '🇦🇪' },
  { code: '+44', country: 'GB', name: 'United Kingdom', native: '', flag: '🇬🇧' },
  { code: '+598', country: 'UY', name: 'Uruguay', native: '', flag: '🇺🇾' },
  { code: '+998', country: 'UZ', name: 'Uzbekistan', native: 'Oʻzbekiston', flag: '🇺🇿' },
  { code: '+678', country: 'VU', name: 'Vanuatu', native: '', flag: '🇻🇺' },
  { code: '+39', country: 'VA', name: 'Vatican City', native: 'Città del Vaticano', flag: '🇻🇦' },
  { code: '+58', country: 'VE', name: 'Venezuela', native: '', flag: '🇻🇪' },
  { code: '+84', country: 'VN', name: 'Vietnam', native: 'Việt Nam', flag: '🇻🇳' },
  { code: '+681', country: 'WF', name: 'Wallis and Futuna', native: 'Wallis-et-Futuna', flag: '🇼🇫' },
  { code: '+212', country: 'EH', name: 'Western Sahara', native: 'الصحراء الغربية', flag: '🇪🇭' },
  { code: '+967', country: 'YE', name: 'Yemen', native: 'اليمن', flag: '🇾🇪' },
  { code: '+260', country: 'ZM', name: 'Zambia', native: '', flag: '🇿🇲' },
  { code: '+263', country: 'ZW', name: 'Zimbabwe', native: '', flag: '🇿🇼' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

export const PhoneInput = ({
  value,
  onChange,
  placeholder = '0000000000',
  className,
  disabled = false,
  error = false,
}: PhoneInputProps) => {
  const [open, setOpen] = useState(false);

  // Parse existing value to extract country code and number
  const parseValue = (val: string) => {
    if (!val) return { selectedCountry: countryCodes[0], number: '' };
    
    // Try to find matching country code (longest match first)
    const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
    for (const c of sortedCodes) {
      if (val.startsWith(c.code)) {
        return { selectedCountry: c, number: val.slice(c.code.length).replace(/\s/g, '') };
      }
    }
    
    // If starts with +, try to extract
    if (val.startsWith('+')) {
      const match = val.match(/^(\+\d{1,4})\s*(.*)$/);
      if (match) {
        const foundCountry = countryCodes.find(c => c.code === match[1]);
        return { 
          selectedCountry: foundCountry || countryCodes[0], 
          number: match[2].replace(/\s/g, '') 
        };
      }
    }
    
    // Default to India and treat whole value as number
    return { selectedCountry: countryCodes[0], number: val.replace(/[^\d]/g, '') };
  };

  const { selectedCountry: initialCountry, number: initialNumber } = parseValue(value);
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [number, setNumber] = useState(initialNumber);

  const handleCountrySelect = (country: typeof countryCodes[0]) => {
    setSelectedCountry(country);
    onChange(`${country.code}${number}`);
    setOpen(false);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    const numericValue = e.target.value.replace(/[^\d]/g, '');
    setNumber(numericValue);
    onChange(`${selectedCountry.code}${numericValue}`);
  };

  const getDisplayName = (country: typeof countryCodes[0]) => {
    if (country.native) {
      return `${country.name} (${country.native})`;
    }
    return country.name;
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-[140px] justify-between shrink-0 px-3",
              error && "border-destructive"
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span>{selectedCountry.code}</span>
            </span>
            <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search..." className="h-9" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {countryCodes.map((country, index) => (
                  <CommandItem
                    key={`${country.country}-${index}`}
                    value={`${country.name} ${country.native} ${country.code}`}
                    onSelect={() => handleCountrySelect(country)}
                    className="flex items-center gap-3 py-2"
                  >
                    <span className="text-xl">{country.flag}</span>
                    <span className="flex-1 truncate">
                      {getDisplayName(country)} {country.code}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("flex-1", error && "border-destructive")}
      />
    </div>
  );
};
