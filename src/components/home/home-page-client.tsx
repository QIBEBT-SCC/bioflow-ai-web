'use client'

import { BookOpenIcon, Languages, Loader2Icon, LogInIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Fragment, useEffect, useRef, useState } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth-query'
import { usePublicLibraryStats } from '@/hooks/use-node-library'
import { type Locale, localeNames, locales } from '@/i18n/config'

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const currentRef = useRef(0)

  useEffect(() => {
    const startValue = currentRef.current
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (reducedMotion || startValue === value) {
      const frame = window.requestAnimationFrame(() => {
        currentRef.current = value
        setDisplayValue(value)
      })
      return () => window.cancelAnimationFrame(frame)
    }

    const duration = 700
    const startTime = performance.now()
    let rafId = 0

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      const next = Math.round(startValue + (value - startValue) * eased)
      currentRef.current = next
      setDisplayValue(next)
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick)
      }
    }

    rafId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(rafId)
  }, [value])

  return <>{displayValue.toLocaleString()}</>
}

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
          width={88}
          height={40}
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
          <Link href='/project'>
            <Avatar className='size-8 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/60 transition-all'>
              <AvatarFallback className='text-xs font-semibold bg-primary/10 text-primary'>
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Button size='sm' asChild>
            <Link href='/login'>
              <LogInIcon className='size-4' />
              {t('login')}
            </Link>
          </Button>
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
  const {
    stats,
    isLoading: statsLoading,
    hasData: hasLibraryStats,
  } = usePublicLibraryStats()

  const badges = [
    t('badge_workflow'),
    t('badge_ai'),
    t('badge_omics'),
    t('badge_viz'),
    t('badge_ext'),
  ]

  const floatingMetrics = [
    {
      key: 'nodes',
      label: t('stats_nodes'),
      value: stats.executableNodesTotal,
    },
    {
      key: 'images',
      label: t('stats_images'),
      value: stats.imagesTotal,
    },
    {
      key: 'groups',
      label: t('stats_groups'),
      value: stats.groupsTotal,
    },
    {
      key: 'resources',
      label: t('stats_resources'),
      value: stats.resourcesTotal,
    },
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
            <h1 className='text-5xl font-semibold tracking-tight text-foreground'>
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

          {/* Airy floating node-library metrics over the particle canvas */}
          {(statsLoading || hasLibraryStats) && (
            <div className='flex flex-wrap items-center justify-center gap-x-8 gap-y-5 py-2 sm:gap-x-10'>
              {floatingMetrics.map((metric, index) => {
                const content = (
                  <>
                    <div className='h-9 flex items-center justify-center'>
                      {statsLoading ? (
                        <Skeleton className='h-8 w-16 rounded-full' />
                      ) : (
                        <span className='bg-gradient-to-b from-foreground via-foreground to-primary bg-clip-text text-3xl font-semibold tracking-tight text-transparent tabular-nums sm:text-4xl'>
                          <AnimatedNumber value={metric.value} />
                        </span>
                      )}
                    </div>
                    <span className='mt-1.5 inline-flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground transition-colors group-hover:text-foreground'>
                      <span className='size-1.5 rounded-full bg-primary/70 shadow-[0_0_8px_var(--primary)]' />
                      {metric.label}
                    </span>
                  </>
                )

                return (
                  <Fragment key={metric.key}>
                    {index > 0 && (
                      <div
                        aria-hidden='true'
                        className='hidden h-9 w-px bg-gradient-to-b from-transparent via-border to-transparent sm:block'
                      />
                    )}
                    {user ? (
                      <Link
                        href='/library'
                        className='group flex flex-col items-center px-1 transition-transform duration-300 hover:-translate-y-0.5'
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className='group flex flex-col items-center px-1'>
                        {content}
                      </div>
                    )}
                  </Fragment>
                )
              })}
            </div>
          )}

          {/* CTA */}
          <div className='flex flex-wrap items-center justify-center gap-3 pt-2'>
            {loading ? (
              <Button size='lg' disabled>
                <Loader2Icon className='size-4 animate-spin' />
                {t('loading')}
              </Button>
            ) : user ? (
              <>
                <Button size='lg' asChild>
                  <Link href='/project'>{t('cta_start')}</Link>
                </Button>
                <Button size='lg' variant='outline' asChild>
                  <Link href='/library'>{t('cta_library')}</Link>
                </Button>
              </>
            ) : (
              <Button size='lg' asChild>
                <Link href='/login'>{t('cta_login')}</Link>
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='py-6 text-center text-sm text-muted-foreground border-t border-border/40'>
        <p suppressHydrationWarning>
          {t('footer', { year: new Date().getFullYear() })}
        </p>
      </footer>
    </div>
  )
}
