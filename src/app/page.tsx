import {redirect} from 'next/navigation'
import {getCurrentUser} from '@/app/actions/auth'

export default async function RootPage() {
    const user = await getCurrentUser()

    // 已登录，重定向到 chat 页面
    if (user) {
        redirect('/chat')
    }

    // 未登录，重定向到登录页（也会被 middleware 处理）
    redirect('/login')
}
