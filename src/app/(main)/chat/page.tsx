'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { CopyIcon, GlobeIcon, RefreshCcwIcon } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useTranslations } from 'next-intl'
import { Fragment, useState } from 'react'
import { Action, Actions } from '@/components/ai-elements/actions'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Image } from '@/components/ai-elements/image'
import { Loader } from '@/components/ai-elements/loader'
import { Message, MessageContent } from '@/components/ai-elements/message'
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import { Response } from '@/components/ai-elements/response'
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources'
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'
import { HistoryMenu } from '@/components/chat/history-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { useChatStore } from '@/stores/chatStore'

const models = [
  {
    name: 'GPT-5 Mini',
    value: 'openai/gpt-5-mini',
  },
  {
    name: 'Gemini 2.5 Flash',
    value: 'google/gemini-2.5-flash',
  },
  {
    name: 'DeepSeek V3.2',
    value: 'deepseek/deepseek-v3.2-exp',
  },
]

const initMessage: UIMessage[] = [
  {
    id: nanoid(),
    role: 'user',
    parts: [{ type: 'text', text: '请帮我复现这篇论文', state: 'done' }],
  },
  {
    id: nanoid(),
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text:
          '## Overall Summary\n' +
          '本研究对人类肠道宏基因组中的古细菌病毒进行了全面分析，并利用CRISPR间隔序列和病毒特征方法，揭示了人类肠道中古细菌病毒的未探索多样性。\n' +
          '\n' +
          '## Major Finding\n' +
          '研究发现了1279种病毒物种，其中95.2%感染甲烷短杆菌属A，56.5%与古细菌前病毒具有高同源性，37.2%具有跨古细菌物种的宿主范围，55.7%在人群中高度流行。此外，还发现了与病毒溶源-裂解周期调控相关的基因，表明温和噬菌体在古细菌病毒组中占主导地位。\n' +
          '\n' +
          '## Tools used in the article\n' +
          '- **tools**\n' +
          '    - `SPAdes`\n' +
          '    - `Prodigal`\n' +
          '    - `DIAMOND`\n' +
          '    - `CD-HIT`\n' +
          '    - `BLASTn`\n' +
          '    - `RAxML`\n' +
          '    - `CRT`\n' +
          '    - `hmmsearch`\n' +
          '    - `HMMER3`\n' +
          '    - `BLAST+`\n' +
          '    - `SOAP2`\n' +
          '    - `VirSorter`\n' +
          '    - `VirFinder`\n' +
          '    - `VirSorter2`\n' +
          '    - `DeepVirFinder`\n' +
          '    - `eggNOG-mapper`\n' +
          '    - `MUSCLE`\n' +
          '    - `MEGA X`\n' +
          '    - `IQ-TREE`\n' +
          '- **r packages**\n' +
          '    - `vegan`\n' +
          '    - `ape`\n' +
          '- **unknown**\n' +
          '    - `GTDB-Tk`\n' +
          '    - `CheckM`\n' +
          '    - `iTOL`\n' +
          '    - `vConTACT2`\n' +
          '    - `Cytoscape`\n' +
          '\n' +
          '### 人类肠道古细菌病毒宏基因组分析工作流\n' +
          '\n' +
          '**Workflow Overview**\n  ' +
          '该工作流旨在通过整合宏基因组测序数据、CRISPR间隔序列分析和病毒特征识别，全面鉴定和表征人类肠道中的古细菌病毒，并对其进行分类、宿主预测和功能注释。\n' +
          '\n' +
          '**Contribution to Conclusion**\n  ' +
          '该工作流的结果揭示了人类肠道中未被探索的古细菌病毒多样性，识别了大量新型病毒物种，并阐明了它们在人类肠道微生物组中的生态作用和宿主相互作用，为理解人类肠道病毒组的复杂性提供了新的视角。\n' +
          '\n' +
          '**Detailed Steps**\n  ' +
          '1. `(tool)` 使用 **SPAdes** 对人类肠道宏基因组测序数据进行组装。\n' +
          '    -   使用 `-meta` 选项进行宏基因组组装。\n' +
          '2. `(tool)` 使用 **Prodigal** 对组装后的contigs进行基因预测。\n' +
          '    -   使用 `-p meta` 选项进行原核生物基因预测。\n' +
          '3. `(tool)` 使用 **DIAMOND** 将预测的蛋白质序列与 **GTDB R95** 数据库进行比对。\n' +
          '    -   设置 `-e-value 1e-3` 和 `-min-score 50`。\n' +
          '4. `(tool)` 使用 **CD-HIT** 对古细菌contigs进行去冗余。\n' +
          '    -   去冗余标准为 `95% 序列同一性` 和 `85% 覆盖度`。\n' +
          '5. `(tool)` 使用 **CRT** 从古细菌基因组contigs和UHGG古细菌基因组中预测CRISPR间隔序列。\n' +
          '    -   使用默认参数。\n' +
          '6. `(tool)` 使用 **CD-HIT** 对预测的CRISPR间隔序列进行去冗余。\n' +
          '    -   去冗余参数为 `-c = 1, -aS = 1, -aL = 1, -g = 1`。\n' +
          '7. `(tool)` 使用 **BLASTn** 将高质量reads比对到人类肠道相关古细菌间隔序列数据库（HGASDB）中。\n' +
          '    -   设置 `-e-value < 1e-5`。\n' +
          '8. `(tool)` 使用 **BLASTn** 将病毒contigs候选序列与分离的细菌基因组进行比对，以去除细菌基因组污染。\n' +
          '    -   过滤标准为 `最小同一性 50%`，`最小查询覆盖度 80%`，`最大e-value 10-5`。\n' +
          '9. `(tool)` 使用 **BLASTn** 将病毒contigs候选序列与分离的古细菌基因组进行比对，以去除古细菌基因组污染。\n' +
          '    -   过滤标准为 `最小同一性 50%`，`最小查询覆盖度 100%`，`最大e-value 10-5`。\n' +
          "10. `(tool)` 使用 **hmmsearch** 和 **HMMER3** 将病毒contigs中的蛋白质序列与 **Pfam v.32**、**JGI Earth's virome project VPF** 和 **VOG** 数据库进行比对，以识别病毒特征基因。\n" +
          '    -   e-value 截止值为 `1e-5`。\n' +
          '11. `(tool)` 使用 **DIAMOND** 将病毒contigs中的蛋白质序列与古细菌病毒特征基因集合进行比对。\n' +
          '    -   选择 `e-value 10-5` 以下的最佳匹配。\n' +
          '12. `(tool)` 使用 **CheckV** 评估鉴定出的病毒序列的完整性和质量，并检测前病毒边界。\n' +
          '13. `(tool)` 使用 **vConTACT2** 对古细菌病毒序列进行基因共享网络分析和分类。\n' +
          '14. `(tool)` 使用 **Cytoscape** 可视化基因共享网络。\n' +
          '15. `(tool)` 使用 **Prodigal** 预测古细菌病毒序列的基因。\n' +
          '16. `(tool)` 使用 **hmmsearch** 和 **HMMER3** 将预测的基因与 **VOG** 和 **eggNOG** 数据库进行比对，进行分类。\n' +
          '    -   最小分数设置为 `40`，最大e-value设置为 `1e-5`。\n' +
          '17. `(tool)` 使用 **BLASTn** 将HGAVD病毒序列与MGV数据库进行比对，进行比较分析。\n' +
          '    -   e-value 截止值为 `1e-3`。\n' +
          '18. `(tool)` 使用 **SOAP2** 将宏基因组reads比对到古细菌contigs和古细菌病毒contigs，以估计相对丰度。\n' +
          '19. `(r_package)` 使用 **vegan** R包计算Bray-Curtis相异矩阵，并进行主坐标分析（PCoA）。\n' +
          '20. `(r_package)` 使用 **vegan** R包的 `anosim` 函数进行相似性分析（ANOSIM），评估组间差异。\n' +
          '    -   置换次数设置为 `999`。\n' +
          '21. `(tool)` 使用 **BLASTn** 将CRISPR间隔序列与古细菌病毒contigs进行比对，进行宿主预测。\n' +
          '    -   匹配阈值为 `100% 同一性`。\n' +
          '    -   参数设置为 `-task blastn-short, gapopen 10, gapextend 2, penalty 1, word_size 7, perc_identity 100`。\n' +
          '22. `(tool)` 使用 **MUSCLE** 对基因（如大型末端酶亚基、PeiW和MazE-抗毒素）的氨基酸序列进行多序列比对。\n' +
          '23. `(tool)` 使用 **MEGA X** 构建最大似然系统发育树。\n' +
          '24. `(tool)` 使用 **IQ-TREE** 构建最大似然系统发育树。\n' +
          '    -   使用自动最优模型选择。\n' +
          '25. `(tool)` 使用 **iTOL** 可视化和美化系统发育树。\n' +
          '\n' +
          '**Workflow Diagram (Mermaid)**\n' +
          '```mermaid\n' +
          'graph LR\n' +
          '    A[Raw Metagenomic Reads] --> B(SPAdes);\n' +
          '    B --> C>Assembled Contigs];\n' +
          '    C --> D(Prodigal);\n' +
          '    D --> E>Predicted Protein Sequences];\n' +
          '    E --> F(DIAMOND);\n' +
          '    F --> G>GTDB R95 Annotation];\n' +
          '    C --> H(CD-HIT);\n' +
          '    H --> I>Dereplicated Archaeal Contigs];\n' +
          '    I --> J(CRT);\n' +
          '    J --> K>CRISPR Spacers];\n' +
          '    K --> L(CD-HIT);\n' +
          '    L --> M>Dereplicated Spacers (HGASDB)];\n' +
          '    C --> N(BLASTn);\n' +
          '    N --> O>Archaeal Virus Candidate I];\n' +
          '    O --> P(BLASTn);\n' +
          '    P --> Q>Bacterial Contamination Removal];\n' +
          '    Q --> R(BLASTn);\n' +
          '    R --> S>Archaeal Contamination Removal];\n' +
          '    S --> T(hmmsearch);\n' +
          '    T --> U>Viral Signature Genes (HMMER3)];\n' +
          '    T --> V(DIAMOND);\n' +
          '    V --> W>HGAVD Viral Species];\n' +
          '    W --> X(CheckV);\n' +
          '    X --> Y>Quality & Completeness Assessment];\n' +
          '    W --> Z(vConTACT2);\n' +
          '    Z --> AA>Gene Sharing Network];\n' +
          '    AA --> AB[[Cytoscape]];\n' +
          '    W --> AC(Prodigal);\n' +
          '    AC --> AD>Predicted Genes];\n' +
          '    AD --> AE(hmmsearch);\n' +
          '    AE --> AF>VOG & eggNOG Annotation];\n' +
          '    W --> AG(BLASTn);\n' +
          '    AG --> AH>MGV Comparison];\n' +
          '    C --> AI(SOAP2);\n' +
          '    AI --> AJ>Relative Abundance];\n' +
          '    AJ --> AK[[vegan]];\n' +
          '    AK --> AL>PCoA & ANOSIM Results];\n' +
          '    W --> AM(BLASTn);\n' +
          '    AM --> AN>Host Prediction];\n' +
          '    AO[Gene Sequences] --> AP(MUSCLE);\n' +
          '    AP --> AQ(MEGA X);\n' +
          '    AQ --> AR>Phylogenetic Tree];\n' +
          '    AP --> AS(IQ-TREE);\n' +
          '    AS --> AR;\n' +
          '    AR --> AT[[iTOL]];\n' +
          '```',
        state: 'done',
      },
    ],
  },
]

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [model, setModel] = useState<string>(models[0].value)
  const [webSearch, setWebSearch] = useState(false)
  const { messages, sendMessage, status, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/v1/chat/completions',
    }),
    messages: initMessage,
  })

  const { currentSession } = useChatStore()
  const t = useTranslations('Chat')

  function onEditClick(id: string, description: string) {}
  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text)
    const hasAttachments = Boolean(message.files?.length)

    if (!(hasText || hasAttachments)) {
      return
    }

    sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files,
      },
      {
        body: {
          model: model,
          webSearch: webSearch,
        },
      },
    )
    setInput('')
  }
  return (
    <SidebarInset className='h-screen flex flex-col'>
      <header className='flex flex-col shrink-0 border-b'>
        <div className='flex items-center justify-between px-4 h-12 bg-background'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='!mr-2 !h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbPage>{t('title')}</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className='hidden md:block' />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    <span className='text-sm text-muted-foreground hidden sm:block'>
                      {currentSession?.description || t('new_conversation')}
                    </span>
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* 历史对话下拉菜单 */}
          <HistoryMenu onEditClick={onEditClick} />
        </div>
      </header>

      <main className='max-w-5xl mx-auto p-0 pb-16 relative size-full'>
        <div className='flex flex-col h-full'>
          <Conversation className='h-full'>
            <ConversationContent>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === 'assistant' &&
                    message.parts.filter((part) => part.type === 'source-url')
                      .length > 0 && (
                      <Sources>
                        <SourcesTrigger
                          count={
                            message.parts.filter(
                              (part) => part.type === 'source-url',
                            ).length
                          }
                        />
                        {message.parts
                          .filter((part) => part.type === 'source-url')
                          .map((part, i) => (
                            <SourcesContent key={`${message.id}-${i}`}>
                              <Source
                                key={`${message.id}-${i}`}
                                href={part.url}
                                title={part.url}
                              />
                            </SourcesContent>
                          ))}
                      </Sources>
                    )}
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <Message from={message.role}>
                              <MessageContent>
                                <Response>{part.text}</Response>
                              </MessageContent>
                            </Message>
                            {message.role === 'assistant' &&
                              i === messages.length - 1 && (
                                <Actions className='mt-2'>
                                  <Action
                                    onClick={() => regenerate()}
                                    label='Retry'
                                  >
                                    <RefreshCcwIcon className='size-3' />
                                  </Action>
                                  <Action
                                    onClick={() =>
                                      navigator.clipboard.writeText(part.text)
                                    }
                                    label='Copy'
                                  >
                                    <CopyIcon className='size-3' />
                                  </Action>
                                </Actions>
                              )}
                          </Fragment>
                        )
                      case 'reasoning':
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className='w-full'
                            isStreaming={
                              status === 'streaming' &&
                              i === message.parts.length - 1 &&
                              message.id === messages.at(-1)?.id
                            }
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        )
                      case 'tool-get_weather':
                        return (
                          <Tool key={`${message.id}-${i}`}>
                            <ToolHeader type={part.type} state={part.state} />
                            <ToolContent>
                              <ToolInput input={part.input} />
                              {part.state === 'output-available' && (
                                <ToolOutput
                                  errorText={part.errorText}
                                  output={part.output}
                                />
                              )}
                            </ToolContent>
                          </Tool>
                        )
                      case 'file':
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <Image
                              alt={part.filename}
                              base64={part.url.split(',')[1] ?? ''}
                              mediaType={part.mediaType}
                              uint8Array={new Uint8Array([])}
                              className='h-[200px] border'
                            />
                          </div>
                        )
                      default:
                        console.log(part)
                        return null
                    }
                  })}
                </div>
              ))}
              {status === 'submitted' && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput
            onSubmit={handleSubmit}
            className='mt-4'
            globalDrop
            multiple
          >
            <PromptInputBody>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
              />
            </PromptInputBody>
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputButton
                  variant={webSearch ? 'default' : 'ghost'}
                  onClick={() => setWebSearch(!webSearch)}
                >
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton>
                <PromptInputModelSelect
                  onValueChange={(value) => {
                    setModel(value)
                  }}
                  value={model}
                >
                  <PromptInputModelSelectTrigger>
                    <PromptInputModelSelectValue />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {models.map((model) => (
                      <PromptInputModelSelectItem
                        key={model.value}
                        value={model.value}
                      >
                        {model.name}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </PromptInputTools>
              <PromptInputSubmit disabled={!input && !status} status={status} />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </main>
    </SidebarInset>
  )
}
