'use client'

import { LanguagesIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { setUserLocale } from '@/app/actions/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Locale, localeNames, locales } from '@/i18n/config'

export function LocaleSwitcher() {
  const [isPending, startTransition] = useTransition()
  const currentLocale = useLocale() as Locale

  const t = useTranslations('Language')

  const handleLocaleChange = (locale: Locale) => {
    startTransition(async () => {
      await setUserLocale(locale)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className='flex items-center gap-2'>
          <LanguagesIcon />
          {t('language')}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side='left' align='end'>
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={currentLocale === locale ? 'bg-accent' : ''}
          >
            {localeNames[locale]}
            {currentLocale === locale && ' ✓'}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
