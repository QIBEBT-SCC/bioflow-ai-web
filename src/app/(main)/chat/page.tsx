'use client'

import { GlobeIcon, PlusIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from '@/components/ai-elements/attachments'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from '@/components/ai-elements/prompt-input'
import { ChatHistoryMenu } from '@/components/chat/chat-history-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { useCreateChatSession } from '@/hooks/use-chat'

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments()
  if (attachments.files.length === 0) {
    return null
  }
  return (
    <Attachments variant='inline'>
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  )
}

export default function ChatPage() {
  const { push } = useRouter()

  const { mutateAsync: createChatSession } = useCreateChatSession()

  const handleNewChat = async () => {
    const session = await createChatSession()
    push(`/chat/${session.uid}`)
  }

  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center gap-2 px-4 h-12 bg-background'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='!mr-2 !h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbPage>Chat</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className='ml-auto flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              title='New Chat'
              onClick={handleNewChat}
            >
              <PlusIcon className='size-5' />
            </Button>
            <ChatHistoryMenu />
          </div>
        </div>
      </header>

      <main className='p-0 pb-14 relative size-full'>
        <div className='flex flex-col h-full'>
          <Conversation className='h-full'>
            <ConversationContent className='max-w-5xl mx-auto w-full'>
              <ConversationEmptyState
                title='Start a conversation'
                description='Type a message below to begin'
              />
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput
            onSubmit={() => {}}
            className='mt-4 max-w-5xl mx-auto w-full px-4'
            globalDrop
            multiple
          >
            <PromptInputHeader>
              <PromptInputAttachmentsDisplay />
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea value={''} readOnly={true} />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger disabled={true} />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputButton onClick={() => {}} disabled={true}>
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton>
              </PromptInputTools>
              <PromptInputSubmit />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </main>
    </SidebarInset>
  )
}
