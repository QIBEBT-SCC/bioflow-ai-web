export const MAX_NEWICK_NODES = 5_000
export const MAX_NEWICK_TREES = 100
const MAX_NEWICK_DEPTH = 1_000

export type NewickNode = {
  id: number
  label: string
  length: number | null
  children: NewickNode[]
}

export type NewickTree = {
  root: NewickNode
  nodeCount: number
  leafCount: number
  hasBranchLengths: boolean
}

export type NewickErrorCode =
  | 'empty'
  | 'invalidBranchLength'
  | 'missingLabel'
  | 'missingSemicolon'
  | 'tooDeep'
  | 'tooManyNodes'
  | 'tooManyTrees'
  | 'unexpectedToken'
  | 'unterminatedComment'
  | 'unterminatedQuote'

export class NewickParseError extends Error {
  constructor(
    public readonly code: NewickErrorCode,
    public readonly position: number,
  ) {
    super(`${code} at character ${position + 1}`)
    this.name = 'NewickParseError'
  }
}

class NewickParser {
  private position = 0
  private nextNodeId = 0

  constructor(private readonly source: string) {}

  parseTrees(): NewickTree[] {
    const trees: NewickTree[] = []
    this.skipTrivia()
    while (this.position < this.source.length) {
      if (trees.length >= MAX_NEWICK_TREES)
        throw new NewickParseError('tooManyTrees', this.position)
      const firstNodeId = this.nextNodeId
      const root = this.parseSubtree(0)
      this.skipTrivia()
      if (this.current() !== ';')
        throw new NewickParseError('missingSemicolon', this.position)
      this.position += 1
      trees.push(this.describeTree(root, this.nextNodeId - firstNodeId))
      this.skipTrivia()
    }
    if (!trees.length) throw new NewickParseError('empty', 0)
    return trees
  }

  private parseSubtree(depth: number): NewickNode {
    if (depth > MAX_NEWICK_DEPTH)
      throw new NewickParseError('tooDeep', this.position)
    this.skipTrivia()
    const children: NewickNode[] = []
    if (this.current() === '(') {
      this.position += 1
      this.skipTrivia()
      if (this.current() === ')')
        throw new NewickParseError('unexpectedToken', this.position)
      while (true) {
        children.push(this.parseSubtree(depth + 1))
        this.skipTrivia()
        if (this.current() === ',') {
          this.position += 1
          continue
        }
        if (this.current() !== ')')
          throw new NewickParseError('unexpectedToken', this.position)
        this.position += 1
        break
      }
    }

    const node = this.createNode(children)
    this.skipTrivia()
    node.label = this.readLabel()
    this.skipTrivia()
    if (this.current() === ':') {
      this.position += 1
      this.skipTrivia()
      node.length = this.readBranchLength()
      this.skipTrivia()
    }
    if (!children.length && !node.label)
      throw new NewickParseError('missingLabel', this.position)
    return node
  }

  private createNode(children: NewickNode[]): NewickNode {
    if (this.nextNodeId >= MAX_NEWICK_NODES)
      throw new NewickParseError('tooManyNodes', this.position)
    const node = {
      id: this.nextNodeId,
      label: '',
      length: null,
      children,
    }
    this.nextNodeId += 1
    return node
  }

  private readLabel(): string {
    if (this.current() === "'") {
      this.position += 1
      let label = ''
      while (this.position < this.source.length) {
        if (this.current() !== "'") {
          label += this.current()
          this.position += 1
          continue
        }
        if (this.source[this.position + 1] === "'") {
          label += "'"
          this.position += 2
          continue
        }
        this.position += 1
        return label
      }
      throw new NewickParseError('unterminatedQuote', this.position)
    }

    const start = this.position
    while (
      this.position < this.source.length &&
      !'(),:;[]'.includes(this.current())
    )
      this.position += 1
    return this.source.slice(start, this.position).trim()
  }

  private readBranchLength(): number {
    const start = this.position
    while (
      this.position < this.source.length &&
      !'(),;[]'.includes(this.current()) &&
      !/\s/.test(this.current())
    )
      this.position += 1
    const token = this.source.slice(start, this.position)
    const value = Number(token)
    if (!token || !Number.isFinite(value))
      throw new NewickParseError('invalidBranchLength', start)
    return value
  }

  private skipTrivia(): void {
    while (this.position < this.source.length) {
      if (/\s/.test(this.current())) {
        this.position += 1
        continue
      }
      if (this.current() !== '[') return
      const start = this.position
      let depth = 0
      while (this.position < this.source.length) {
        const character = this.current()
        this.position += 1
        if (character === '[') depth += 1
        if (character === ']') {
          depth -= 1
          if (depth === 0) break
        }
      }
      if (depth !== 0) throw new NewickParseError('unterminatedComment', start)
    }
  }

  private current(): string {
    return this.source[this.position] ?? ''
  }

  private describeTree(root: NewickNode, nodeCount: number): NewickTree {
    let leafCount = 0
    let hasBranchLengths = false
    const stack = [root]
    while (stack.length) {
      const node = stack.pop()
      if (!node) continue
      if (!node.children.length) leafCount += 1
      if (node.length !== null) hasBranchLengths = true
      stack.push(...node.children)
    }
    return { root, nodeCount, leafCount, hasBranchLengths }
  }
}

export function parseNewickTrees(source: string): NewickTree[] {
  return new NewickParser(source.replace(/^\uFEFF/, '')).parseTrees()
}
