import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const countryCodes = [
  { code: '+91', country: 'IN', name: 'India' },
  { code: '+1', country: 'US', name: 'United States' },
  { code: '+44', country: 'GB', name: 'United Kingdom' },
  { code: '+61', country: 'AU', name: 'Australia' },
  { code: '+81', country: 'JP', name: 'Japan' },
  { code: '+49', country: 'DE', name: 'Germany' },
  { code: '+33', country: 'FR', name: 'France' },
  { code: '+86', country: 'CN', name: 'China' },
  { code: '+971', country: 'AE', name: 'UAE' },
  { code: '+65', country: 'SG', name: 'Singapore' },
  { code: '+966', country: 'SA', name: 'Saudi Arabia' },
  { code: '+60', country: 'MY', name: 'Malaysia' },
  { code: '+92', country: 'PK', name: 'Pakistan' },
  { code: '+880', country: 'BD', name: 'Bangladesh' },
  { code: '+94', country: 'LK', name: 'Sri Lanka' },
  { code: '+977', country: 'NP', name: 'Nepal' },
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
  placeholder = '9876543210',
  className,
  disabled = false,
  error = false,
}: PhoneInputProps) => {
  // Parse existing value to extract country code and number
  const parseValue = (val: string) => {
    if (!val) return { countryCode: '+91', number: '' };
    
    // Try to find matching country code
    for (const c of countryCodes) {
      if (val.startsWith(c.code)) {
        return { countryCode: c.code, number: val.slice(c.code.length).replace(/\s/g, '') };
      }
    }
    
    // If starts with +, try to extract
    if (val.startsWith('+')) {
      const match = val.match(/^(\+\d{1,4})\s*(.*)$/);
      if (match) {
        return { countryCode: match[1], number: match[2].replace(/\s/g, '') };
      }
    }
    
    // Default to +91 and treat whole value as number
    return { countryCode: '+91', number: val.replace(/[^\d]/g, '') };
  };

  const { countryCode: initialCode, number: initialNumber } = parseValue(value);
  const [countryCode, setCountryCode] = useState(initialCode);
  const [number, setNumber] = useState(initialNumber);

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    onChange(`${newCode}${number}`);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    const numericValue = e.target.value.replace(/[^\d]/g, '');
    setNumber(numericValue);
    onChange(`${countryCode}${numericValue}`);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Select value={countryCode} onValueChange={handleCountryCodeChange} disabled={disabled}>
        <SelectTrigger className={cn("w-[100px] shrink-0", error && "border-destructive")}>
          <SelectValue placeholder="+91" />
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.code} {c.country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
