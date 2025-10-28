import { LocaleSwitcher } from '@/components/locale-switcher'
import { LoginForm } from '@/components/login/login-form'

export default function LoginPage() {
  return (
    <div className='relative flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10'>
      <div className='absolute top-6 right-6 md:top-10 md:right-10'>
        <LocaleSwitcher />
      </div>
      <div className='flex w-full max-w-sm flex-col gap-6'>
        <LoginForm />
      </div>
    </div>
  )
}