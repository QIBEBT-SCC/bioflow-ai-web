/**
 * node-registry.ts
 *
 * 节点注册统一配置文件。
 * 添加新节点时，只需在此文件中：
 *   1. import 节点组件
 *   2. 在 nodeTypes 中注册类型 key → 组件
 *   3. 在 nodeDefaultData 中填写该节点的默认 data 字段
 *   4. 在 menuData 中添加对应菜单项（并在 messages/zh/editor.json 和 messages/en/editor.json 里补充 labelKey）
 */

import {
  BotIcon,
  CaseSensitiveIcon,
  CodeIcon,
  CpuIcon,
  DatabaseIcon,
  DnaIcon,
  FileArchiveIcon,
  FileInputIcon,
  FilePenIcon,
  FolderInputIcon,
  FolderOutputIcon,
  PenToolIcon,
  StickyNoteIcon,
  TagIcon,
} from 'lucide-react'
import type React from 'react'
import {
  BashCodeNode,
  DownstreamSummaryNode,
  PythonCodeNode,
  RCodeNode,
} from '@/components/node-editor/node/code-node'
import {
  BindParamNode,
  Copy2FolderNode,
  GlobalMarkerNode,
  GzipNode,
  LlmValueOutputNode,
  RenameFileNode,
  SelectFileInFolderNode,
} from '@/components/node-editor/node/data-node'
import {
  DBInputNode,
  FileInputNode,
  GRCh38Node,
  GRCm39Node,
  NcbiGenomeNode,
  SequenceInputNode,
  StringInputNode,
} from '@/components/node-editor/node/input-node'
import { NoteNode } from '@/components/node-editor/node/note-node'
import { ToolNode } from '@/components/node-editor/node/tool-node'

// ─────────────────────────────────────────────
// 1. nodeTypes — 供 ReactFlow nodeTypes prop 使用
// ─────────────────────────────────────────────
// biome-ignore lint/suspicious/noExplicitAny: ReactFlow requires ComponentType<any>
export const nodeTypes: Record<string, React.ComponentType<any>> = {
  tool: ToolNode,
  // resource / input
  value_string: StringInputNode,
  resource_file: FileInputNode,
  resource_sequence: SequenceInputNode,
  resource_db: DBInputNode,
  resource_ncbi_genome: NcbiGenomeNode,
  resource_GRCh38: GRCh38Node,
  resource_GRCm39: GRCm39Node,
  // processor
  copy2folder: Copy2FolderNode,
  gzip: GzipNode,
  global_mark: GlobalMarkerNode,
  rename_file: RenameFileNode,
  select_file_in_folder: SelectFileInFolderNode,
  llm_value_output: LlmValueOutputNode,
  bind_param: BindParamNode,
  // code
  code_r: RCodeNode,
  code_python: PythonCodeNode,
  code_bash: BashCodeNode,
  downstream_summary: DownstreamSummaryNode,
  // note
  note: NoteNode,
}

// ─────────────────────────────────────────────
// 2. nodeDefaultData — 节点添加时的初始 data
//    key 值与 nodeTypes 保持一致
//    默认值规则：string→''  string[]→[]  number→0  boolean→false
// ─────────────────────────────────────────────
export const nodeDefaultData: Record<string, Record<string, unknown>> = {
  tool: { tool_uid: '', modifiable_params: '' },
  value_string: { value: '' },
  resource_file: { file_path: '' },
  resource_sequence: { r1: '', r2: '' },
  resource_db: { db_id: '', db_name: '' },
  resource_ncbi_genome: { required_index: [] },
  resource_GRCh38: {},
  resource_GRCm39: {},
  resource_global_file: { mark_name: '' },
  copy2folder: {},
  gzip: {},
  global_mark: { mark_name: '', description: '' },
  rename_file: { new_file_name: '' },
  select_file_in_folder: { file_name: '' },
  llm_value_output: { prompt: '', value_name: '', value_type: 'string' },
  bind_param: { parameter: '' },
  code_r: { code: '' },
  code_python: { code: '' },
  code_bash: { code: '' },
  downstream_summary: { prompt: '' },
  note: { content: '' },
}

// ─────────────────────────────────────────────
// 3. menuData — 右键菜单结构，供 PanelMenu 使用
//    labelKey 对应 messages/{zh,en}/editor.json 中 editor.menu.* 的键
// ─────────────────────────────────────────────
type SubMenuType = 'inline' | 'tool-modal' | 'db-modal'

export interface MenuItem {
  type: string
  labelKey: string
  Icon: React.ElementType
  subItems?: MenuItem[]
}

export interface MenuGroup {
  labelKey: string
  Icon: React.ElementType
  submenuType: SubMenuType
  items: MenuItem[]
}

export const menuData: Record<string, MenuGroup> = {
  analysis: {
    labelKey: 'analysis_tools',
    Icon: PenToolIcon,
    submenuType: 'tool-modal',
    items: [],
  },
  io: {
    labelKey: 'io',
    Icon: FileInputIcon,
    submenuType: 'inline',
    items: [
      { type: 'value_string', labelKey: 'text_input', Icon: CaseSensitiveIcon },
      { type: 'resource_file', labelKey: 'file_input', Icon: FileInputIcon },
      { type: 'resource_sequence', labelKey: 'sequence_input', Icon: DnaIcon },
      { type: 'resource_db', labelKey: 'database', Icon: DatabaseIcon },
      {
        type: '__genome_submenu__',
        labelKey: 'reference_genome',
        Icon: DatabaseIcon,
        subItems: [
          {
            type: 'resource_ncbi_genome',
            labelKey: 'ncbi_genome',
            Icon: DatabaseIcon,
          },
          { type: 'resource_GRCh38', labelKey: 'grch38', Icon: DatabaseIcon },
          { type: 'resource_GRCm39', labelKey: 'grcm39', Icon: DatabaseIcon },
        ],
      },
    ],
  },
  programming: {
    labelKey: 'programming',
    Icon: CodeIcon,
    submenuType: 'inline',
    items: [
      { type: 'code_bash', labelKey: 'code_bash', Icon: CodeIcon },
      { type: 'code_r', labelKey: 'code_r', Icon: CodeIcon },
      { type: 'code_python', labelKey: 'code_python', Icon: CodeIcon },
      {
        type: 'downstream_summary',
        labelKey: 'downstream_summary',
        Icon: CodeIcon,
      },
    ],
  },
  processor: {
    labelKey: 'processor',
    Icon: CpuIcon,
    submenuType: 'inline',
    items: [
      { type: 'copy2folder', labelKey: 'copy2folder', Icon: FolderInputIcon },
      {
        type: 'select_file_in_folder',
        labelKey: 'select_file_in_folder',
        Icon: FolderOutputIcon,
      },
      { type: 'gzip', labelKey: 'gzip', Icon: FileArchiveIcon },
      { type: 'rename_file', labelKey: 'rename_file', Icon: FilePenIcon },
      { type: 'global_mark', labelKey: 'global_marker', Icon: TagIcon },
      { type: 'llm_value_output', labelKey: 'llm_value_output', Icon: BotIcon },
      { type: 'bind_param', labelKey: 'bind_param', Icon: TagIcon },
    ],
  },
  other: {
    labelKey: 'other',
    Icon: StickyNoteIcon,
    submenuType: 'inline',
    items: [{ type: 'note', labelKey: 'note', Icon: StickyNoteIcon }],
  },
}
