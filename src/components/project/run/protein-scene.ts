import { PluginConfig } from 'molstar/lib/mol-plugin/config'
import { PluginContext } from 'molstar/lib/mol-plugin/context'
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec'
import type { PluginStateObject as SO } from 'molstar/lib/mol-plugin-state/objects'
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder'
import type { StateObjectSelector } from 'molstar/lib/mol-state'
import { lociLabel } from 'molstar/lib/mol-theme/label'
import {
  MAX_STRUCTURE_ATOMS,
  ProteinPreviewError,
} from '@/components/project/run/protein-data'

export type ProteinOptions = {
  modelIndex: number
  chain: string
  representation: 'cartoon' | 'ball-and-stick'
  ligands: boolean
  water: boolean
}

export const DEFAULT_PROTEIN_OPTIONS: ProteinOptions = {
  modelIndex: 0,
  chain: '',
  representation: 'cartoon',
  ligands: true,
  water: false,
}

export type ProteinStats = {
  modelCount: number
  atomCount: number
  residueCount: number
  chains: { id: string; label: string }[]
}

function residueLabel(loci: Loci): string {
  return Loci.isEmpty(loci)
    ? ''
    : lociLabel(loci, {
        htmlStyling: false,
        hidePrefix: true,
        granularity: 'residue',
      })
}

/** One isolated Mol* context per file tab; no shared global viewer or remote lookups. */
export class ProteinScene {
  private plugin = new PluginContext({
    ...DefaultPluginSpec(),
    actions: [],
    animations: [],
    config: [[PluginConfig.VolumeStreaming.Enabled, false]],
    canvas3d: { transparentBackground: true },
    layout: { initial: { isExpanded: false, showControls: false } },
  })
  private trajectory?: StateObjectSelector<SO.Molecule.Trajectory>
  private model?: StateObjectSelector<SO.Molecule.Model>
  private structure?: StateObjectSelector<SO.Molecule.Structure>
  private display?: StateObjectSelector<SO.Molecule.Structure>
  private modelIndex = -1
  private disposed = false
  private initialized = false
  private subscriptions: { unsubscribe: () => void }[] = []

  async init(
    canvas: HTMLCanvasElement,
    host: HTMLDivElement,
    onHover: (label: string) => void,
    onSelect: (label: string) => void,
  ) {
    await this.plugin.init()
    this.initialized = true
    if (this.disposed) {
      this.plugin.dispose()
      throw new DOMException('Disposed', 'AbortError')
    }
    void this.plugin.canvas3dInitialized.catch(() => {})
    let viewerReady = false
    try {
      viewerReady = await this.plugin.initViewerAsync(canvas, host)
    } catch {
      // Mol* also rejects its initialization promise when WebGL is unavailable.
    }
    if (!viewerReady) {
      throw new ProteinPreviewError('webglUnavailable')
    }
    this.subscriptions.push(
      this.plugin.behaviors.interaction.hover.subscribe(({ current }) =>
        onHover(residueLabel(current.loci)),
      ),
      this.plugin.behaviors.interaction.click.subscribe(({ current }) =>
        onSelect(residueLabel(current.loci)),
      ),
    )
  }

  async load(content: string, format: 'pdb' | 'mmcif', signal: AbortSignal) {
    signal.throwIfAborted()
    const data = await this.plugin.builders.data.rawData(
      { data: content },
      { state: { isGhost: true } },
    )
    signal.throwIfAborted()
    try {
      this.trajectory = await this.plugin.builders.structure.parseTrajectory(
        data,
        format,
      )
      signal.throwIfAborted()
      if (!this.trajectory.obj?.data.frameCount)
        throw new ProteinPreviewError('empty')
    } catch (error) {
      signal.throwIfAborted()
      if (error instanceof ProteinPreviewError) throw error
      throw new ProteinPreviewError('invalid')
    }
  }

  async render(
    options: ProteinOptions,
    signal: AbortSignal,
  ): Promise<ProteinStats> {
    if (!this.trajectory) throw new ProteinPreviewError('empty')
    signal.throwIfAborted()
    const modelChanged = this.modelIndex !== options.modelIndex
    if (modelChanged) {
      if (this.model)
        await this.plugin.state.data.build().delete(this.model.ref).commit()
      signal.throwIfAborted()
      this.model = await this.plugin.builders.structure.createModel(
        this.trajectory,
        { modelIndex: options.modelIndex },
      )
      signal.throwIfAborted()
      const atoms = this.model.obj?.data.atomicHierarchy.atoms._rowCount ?? 0
      if (!atoms) throw new ProteinPreviewError('empty')
      if (atoms > MAX_STRUCTURE_ATOMS)
        throw new ProteinPreviewError('tooManyAtoms')
      this.structure = await this.plugin.builders.structure.createStructure(
        this.model,
        { name: 'model', params: {} },
      )
      this.modelIndex = options.modelIndex
      this.display = undefined
    }
    signal.throwIfAborted()
    if (!this.structure?.obj || !this.model?.obj)
      throw new ProteinPreviewError('empty')
    if (this.display)
      await this.plugin.state.data.build().delete(this.display.ref).commit()
    signal.throwIfAborted()
    this.display = options.chain
      ? await this.plugin.builders.structure.tryCreateComponentFromExpression(
          this.structure,
          MS.struct.generator.atomGroups({
            'chain-test': MS.core.rel.eq([
              MS.struct.atomProperty.macromolecular.label_asym_id(),
              options.chain,
            ]),
          }),
          'chain',
        )
      : await this.plugin.builders.structure.tryCreateComponentStatic(
          this.structure,
          'all',
        )
    if (!this.display) throw new ProteinPreviewError('empty')
    const builder = this.plugin.builders.structure
    const polymer = await builder.tryCreateComponentStatic(
      this.display,
      'polymer',
    )
    if (polymer) {
      await builder.representation.addRepresentation(polymer, {
        type: options.representation,
        color: 'chain-id',
      })
    }
    for (const type of [
      'ligand',
      'ion',
      'branched',
      'lipid',
      'water',
    ] as const) {
      signal.throwIfAborted()
      if (type === 'water' ? !options.water : !options.ligands) continue
      const component = await builder.tryCreateComponentStatic(
        this.display,
        type,
      )
      if (component) {
        await builder.representation.addRepresentation(component, {
          type: 'ball-and-stick',
          color: 'element-symbol',
        })
      }
    }
    signal.throwIfAborted()
    if (modelChanged) this.resetCamera()
    const { atomicHierarchy } = this.model.obj.data
    const chainLabels = new Map<string, string>()
    for (let index = 0; index < atomicHierarchy.chains._rowCount; index += 1) {
      const id = atomicHierarchy.chains.label_asym_id.value(index)
      const authorId = atomicHierarchy.chains.auth_asym_id.value(index)
      chainLabels.set(
        id,
        authorId && authorId !== id ? `${authorId} (${id})` : id,
      )
    }
    const chains = Array.from(chainLabels, ([id, label]) => ({ id, label }))
    return {
      modelCount: this.trajectory.obj?.data.frameCount ?? 1,
      atomCount: this.structure.obj.data.elementCount,
      residueCount: this.structure.obj.data.polymerResidueCount,
      chains,
    }
  }

  resetCamera() {
    this.plugin.canvas3d?.requestCameraReset({ durationMs: 0 })
  }

  resize() {
    this.plugin.handleResize()
  }

  setActive(active: boolean) {
    if (active) {
      this.resize()
      this.plugin.animationLoop.start()
    } else {
      this.plugin.animationLoop.stop({ noDraw: true })
    }
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    for (const subscription of this.subscriptions) subscription.unsubscribe()
    this.plugin.managers.task.requestAbortAll('File preview closed')
    if (this.initialized) this.plugin.dispose()
  }
}

import { Loci } from 'molstar/lib/mol-model/loci'
