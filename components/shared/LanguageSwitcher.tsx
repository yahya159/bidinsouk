'use client';

import { Menu, UnstyledButton, Group, Text } from '@mantine/core';
import { ChevronDown } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'العربية', flag: '🇲🇦' },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract current locale from pathname
  const getCurrentLocale = () => {
    // Check if pathname starts with any of our language codes
    for (const lang of languages) {
      if (pathname.startsWith(`/${lang.code}/`) || pathname === `/${lang.code}`) {
        return lang.code;
      }
    }
    return 'fr'; // default fallback
  };
  
  const locale = getCurrentLocale();
  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  const handleLanguageChange = (newLocale: string) => {
    // Get the current path without the locale
    let pathWithoutLocale = pathname;
    
    // Remove current locale from path if it exists
    for (const lang of languages) {
      if (pathname.startsWith(`/${lang.code}/`)) {
        pathWithoutLocale = pathname.substring(`/${lang.code}`.length);
        break;
      } else if (pathname === `/${lang.code}`) {
        pathWithoutLocale = '';
        break;
      }
    }
    
    // Construct new path with new locale
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    
    router.push(newPath);
  };

  return (
    <Menu shadow="md" width={160} zIndex={1000}>
      <Menu.Target>
        <UnstyledButton>
          <Group gap={4}>
            <Text size="sm">{currentLanguage.flag}</Text>
            <ChevronDown size={14} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {languages
          .filter(language => language.code !== locale)
          .map((language) => (
            <Menu.Item
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
            >
              <Group gap="sm">
                <Text size="sm">{language.flag}</Text>
                <Text size="sm">{language.name}</Text>
              </Group>
            </Menu.Item>
          ))}
        {/* Debug: Show current locale */}
        {process.env.NODE_ENV === 'development' && (
          <Menu.Item disabled>
            <Text size="xs" c="dimmed">Current: {locale}</Text>
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}