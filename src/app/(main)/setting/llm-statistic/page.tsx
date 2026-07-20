import { redirect } from 'next/navigation'

export default function LegacyLLMStatisticPage() {
  redirect('/setting/llm?tab=statistics')
}
