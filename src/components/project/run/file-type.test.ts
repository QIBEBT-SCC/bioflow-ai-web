import { describe, expect, it } from 'vitest'
import { getRunFileType } from './file-type'

describe('run file dispatch', () => {
  it('uses bounded genomic previews for the three selected formats', () => {
    expect(getRunFileType('signal.bigWig')).toBe('bigwig')
    expect(getRunFileType('track.bb')).toBe('bigbed')
    expect(getRunFileType('regions.bed')).toBe('bed')
  })

  it('does not send unknown binary outputs through text decoding', () => {
    for (const name of [
      'reads.bam',
      'reads.bai',
      'archive.gz',
      'features.starch',
    ]) {
      expect(getRunFileType(name)).toBe('unknown')
    }
    expect(getRunFileType('run.log')).toBe('text')
  })
})
