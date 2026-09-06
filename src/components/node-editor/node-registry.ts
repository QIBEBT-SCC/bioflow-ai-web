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
  CaseSensitiveIcon,
  CodeIcon,
  CpuIcon,
  DatabaseIcon,
  DnaIcon,
  FileArchiveIcon,
  FileInputIcon,
  FilePenIcon,
  FileTextIcon,
  FolderInputIcon,
  FolderOutputIcon,
  GroupIcon,
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
  CollectMountDirNode,
  CompressNode,
  Copy2FolderNode,
  DecompressNode,
  JoinPathNode,
  ProjectMarkNode,
  ReadFileContentNode,
  RenameFileNode,
  SampleMarkNode,
  SelectFileInFolderNode,
} from '@/components/node-editor/node/data-node'
import {
  DBInputNode,
  FileInputNode,
  GRCh38Node,
  GRCm39Node,
  NcbiGenomeNode,
  SampleMarkCollectionNode,
  SequenceInputNode,
  StringInputNode,
  TextFileInputNode,
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
  resource_sample_mark_collection: SampleMarkCollectionNode,
  resource_text_file: TextFileInputNode,
  resource_sequence: SequenceInputNode,
  resource_db: DBInputNode,
  resource_ncbi_genome: NcbiGenomeNode,
  resource_GRCh38: GRCh38Node,
  resource_GRCm39: GRCm39Node,
  // processor
  copy2folder: Copy2FolderNode,
  compress: CompressNode,
  decompress: DecompressNode,
  project_mark: ProjectMarkNode,
  sample_mark: SampleMarkNode,
  rename_file: RenameFileNode,
  select_file_in_folder: SelectFileInFolderNode,
  read_file_content: ReadFileContentNode,
  join_path: JoinPathNode,
  bind_param: BindParamNode,
  collect_mount_dirs: CollectMountDirNode,
  // code
  code_R: RCodeNode,
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
  resource_sample_mark_collection: {
    mark_names: [],
    require_all_samples: true,
  },
  resource_text_file: { file_name: '', content: '' },
  resource_sequence: { r1: '', r2: '' },
  resource_db: { db_id: '', db_name: '' },
  resource_ncbi_genome: { required_index: [] },
  resource_GRCh38: {},
  resource_GRCm39: {},
  copy2folder: {},
  compress: { compressed_file_name: '', compression_format: '.zip' },
  decompress: {},
  project_mark: { mark_name: '', description: '' },
  sample_mark: { mark_name: '', description: '' },
  rename_file: { new_file_name: '' },
  select_file_in_folder: { file_name: '' },
  read_file_content: { file_name: '' },
  join_path: { relative_path: '' },
  bind_param: { parameter: '' },
  collect_mount_dirs: {},
  code_R: { code: '', dependencies: [] },
  code_python: { code: '', dependencies: [] },
  code_bash: { code: '' },
  downstream_summary: { prompt: '' },
  note: { content: '', anchor_node_id: null },
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
      {
        type: 'resource_sample_mark_collection',
        labelKey: 'sample_mark_collection',
        Icon: GroupIcon,
      },
      {
        type: 'resource_text_file',
        labelKey: 'text_file_input',
        Icon: FilePenIcon,
      },
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
      {
        type: '__existing_code__',
        labelKey: 'existing_code',
        Icon: CodeIcon,
      },
      { type: 'code_bash', labelKey: 'code_bash', Icon: CodeIcon },
      { type: 'code_R', labelKey: 'code_r', Icon: CodeIcon },
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
      {
        type: 'read_file_content',
        labelKey: 'read_file_content',
        Icon: FileTextIcon,
      },
      { type: 'join_path', labelKey: 'join_path', Icon: FolderOutputIcon },
      { type: 'compress', labelKey: 'compress', Icon: FileArchiveIcon },
      { type: 'decompress', labelKey: 'decompress', Icon: FileArchiveIcon },
      { type: 'rename_file', labelKey: 'rename_file', Icon: FilePenIcon },
      { type: 'project_mark', labelKey: 'project_marker', Icon: TagIcon },
      { type: 'sample_mark', labelKey: 'sample_marker', Icon: TagIcon },
      { type: 'bind_param', labelKey: 'bind_param', Icon: TagIcon },
      {
        type: 'collect_mount_dirs',
        labelKey: 'collect_mount_dirs',
        Icon: GroupIcon,
      },
    ],
  },
  other: {
    labelKey: 'other',
    Icon: StickyNoteIcon,
    submenuType: 'inline',
    items: [{ type: 'note', labelKey: 'note', Icon: StickyNoteIcon }],
  },
}
