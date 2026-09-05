'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { type FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { saveOpenCodeCredentials } from '@/app/actions/code-agent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function OpenCodeAgentSettings({ available }: { available: boolean }) {
  const t = useTranslations('setting.coding_agent')
  const queryClient = useQueryClient()
  const [apiKey, setApiKey] = useState('')
  const [modelProvider, setModelProvider] = useState('anthropic')
  const [saving, setSaving] = useState(false)

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await saveOpenCodeCredentials(apiKey, modelProvider)
      setApiKey('')
      await queryClient.invalidateQueries({
        queryKey: ['code-agent', 'availability'],
      })
      toast.success(t('credentialsSaved'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('loginFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>OpenCode</CardTitle>
        <p className='text-sm text-muted-foreground'>
          {available ? t('credentialsConfigured') : t('disconnected')}
        </p>
      </CardHeader>
      <CardContent>
        <form className='space-y-4' onSubmit={save}>
          <p className='text-sm text-muted-foreground'>
            {t('apiCredentialHelp')}
          </p>
          <div className='space-y-2'>
            <Label htmlFor='opencode-model-provider'>
              {t('modelProvider')}
            </Label>
            <Input
              id='opencode-model-provider'
              value={modelProvider}
              onChange={(event) => setModelProvider(event.target.value)}
              placeholder='anthropic / openai / google'
              required
              disabled={saving}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='opencode-api-key'>API Key</Label>
            <Input
              id='opencode-api-key'
              type='password'
              autoComplete='new-password'
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              required
              disabled={saving}
            />
          </div>
          <Button type='submit' disabled={saving || !apiKey.trim()}>
            {saving ? t('savingCredentials') : t('saveCredentials')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
