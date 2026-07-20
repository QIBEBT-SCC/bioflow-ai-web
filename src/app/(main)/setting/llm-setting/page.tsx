import { redirect } from 'next/navigation'

export default function LegacyLLMSettingPage() {
  redirect('/setting/llm?tab=providers')
}
