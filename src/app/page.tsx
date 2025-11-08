import { redirect } from 'next/navigation'

export default function RootPage() {
  // middleware 已经处理了认证逻辑，这里只需要重定向到默认页面
  redirect('/chat')
}
