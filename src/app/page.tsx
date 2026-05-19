'use client'

import { BookOpenIcon, Languages, Loader2Icon, LogInIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { setUserLocale } from '@/app/actions/locale'
import { ParticleNetwork } from '@/components/home/particle-network'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth-query'
import { type Locale, localeNames, locales } from '@/i18n/config'

function LangToggle() {
  const t = useTranslations('Home')
  const currentLocale = useLocale() as Locale

  const handleLocaleChange = async (locale: Locale) => {
    if (locale === currentLocale) return
    await setUserLocale(locale)
    window.location.reload()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label={t('lang_toggle')}
          title={t('lang_toggle')}
        >
          <Languages className='size-5' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={locale === currentLocale ? 'font-semibold' : ''}
          >
            {localeNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NavBar({
  user,
}: {
  user: { username: string; email: string } | null
}) {
  const t = useTranslations('Home')

  return (
    <nav className='fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-sm bg-background/80 border-b border-border/40'>
      <div className='flex items-center gap-2'>
        <Image
          src='/logo_and_text.svg'
          alt='BioFlow AI'
          width={140}
          height={32}
          className='h-10 w-auto'
          priority
        />
      </div>
      <div className='flex items-center gap-3'>
        <Button
          variant='ghost'
          size='icon'
          aria-label='GitHub'
          title='GitHub'
          asChild
        >
          <Link
            href='https://github.com/QIBEBT-SCC/bioflow-ai'
            target='_blank'
            rel='noopener noreferrer'
          >
            <Image
              src='/github.svg'
              alt='GitHub'
              width={20}
              height={20}
              className='dark:invert h-5 w-auto'
            />
          </Link>
        </Button>
        <Button
          variant='ghost'
          size='icon'
          aria-label='Documentation'
          title='Documentation'
        >
          <BookOpenIcon className='size-5' />
        </Button>
        <LangToggle />
        <div className='w-px h-5 bg-border' />
        {user ? (
          <Link href='/chat'>
            <Avatar className='size-8 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/60 transition-all'>
              <AvatarFallback className='text-xs font-semibold bg-primary/10 text-primary'>
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link href='/login'>
                <LogInIcon className='size-4 mr-1' />
                {t('login')}
              </Link>
            </Button>
            <Button size='sm' asChild>
              <Link href='/register'>{t('register')}</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}

const highlight = (chunks: React.ReactNode) => (
  <span className='text-foreground font-medium'>{chunks}</span>
)

export default function HomePage() {
  const { user, loading } = useAuth()
  const t = useTranslations('Home')

  const badges = [
    t('badge_workflow'),
    t('badge_ai'),
    t('badge_omics'),
    t('badge_viz'),
    t('badge_ext'),
  ]

  return (
    <div className='relative min-h-screen flex flex-col bg-background overflow-hidden'>
      <ParticleNetwork />
      <NavBar user={loading ? null : user} />

      <main className='flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-16'>
        <div className='flex flex-col items-center gap-8 max-w-3xl text-center'>
          {/* Logo */}
          <div className='relative'>
            <div className='absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150' />
            <Image
              src='/logo_only.svg'
              alt='BioFlow AI Logo'
              width={96}
              height={96}
              className='relative drop-shadow-lg h-30 w-auto'
              priority
            />
          </div>

          {/* Title */}
          <div className='flex flex-col gap-3'>
            <h1 className='text-5xl font-semibold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent'>
              BioFlow AI
            </h1>
            <p className='text-xl text-muted-foreground font-medium'>
              {t('subtitle')}
            </p>
          </div>

          {/* Description */}
          <div className='flex flex-col gap-4 text-muted-foreground leading-relaxed max-w-2xl'>
            <p className='text-base'>{t.rich('desc1', { highlight })}</p>
            <p className='text-base'>{t.rich('desc2', { highlight })}</p>
          </div>

          {/* Feature badges */}
          <div className='flex flex-wrap justify-center gap-2'>
            {badges.map((tag) => (
              <span
                key={tag}
                className='px-3 py-1 text-sm rounded-full bg-primary/10 text-primary border border-primary/20'
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className='flex items-center gap-4 pt-2'>
            {loading ? (
              <Button size='lg' disabled>
                <Loader2Icon className='size-4 mr-2 animate-spin' />
                {t('loading')}
              </Button>
            ) : user ? (
              <Button size='lg' asChild>
                <Link href='/chat'>{t('cta_start')}</Link>
              </Button>
            ) : (
              <>
                <Button size='lg' asChild>
                  <Link href='/register'>{t('cta_register')}</Link>
                </Button>
                <Button size='lg' variant='outline' asChild>
                  <Link href='/login'>{t('login')}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='py-6 text-center text-sm text-muted-foreground border-t border-border/40'>
        <p>{t('footer', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  )
}
