import Image from 'next/image'
import { GuestGuard } from '@/components/auth/auth-guard'
import { LoginForm } from '@/components/login/login-form'

export default function LoginPage() {
  return (
    <GuestGuard>
      <div className='relative flex min-h-svh flex-col items-center justify-center gap-8 overflow-hidden bg-muted p-6 md:p-10'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_-10%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_70%)]'
        />
        <div className='relative flex w-full max-w-sm flex-col items-center gap-8'>
          <Image
            src='/logo_and_text.svg'
            alt='BioFlow AI'
            width={180}
            height={40}
            className='h-10 w-auto'
            priority
          />
          <LoginForm className='w-full' />
        </div>
      </div>
    </GuestGuard>
  )
}
