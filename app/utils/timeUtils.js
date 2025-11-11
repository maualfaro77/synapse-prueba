
// utilidades para manejo de horas en formato HH:mm

function parseHMToMinutes(hm){
  if (!hm || typeof hm !== 'string') return null
  const parts = hm.split(':')
  if (parts.length !== 2) return null
  const [h, m] = parts.map(s => parseInt(s,10))
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h*60 + m
}

function overlaps(aStart, aEnd, bStart, bEnd){
  // asume minutos desde 0..1440, intervalos [start, end)
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd)
}

function blockToIntervals(block){
  // retorna array de intervalos con { day, startMin, endMin }
  const s = parseHMToMinutes(block.start)
  const e = parseHMToMinutes(block.end)
  if (s === null || e === null) return []
  // caso normal: mismo día
  if (s < e) return [{ day: block.day, startMin: s, endMin: e }]
  if (s > e){
    // cruza medianoche: dos intervalos, uno desde s..1440 en dia, otro 0..e en dia+1
    return [
      { day: block.day, startMin: s, endMin: 1440 },
      { day: (block.day + 1) % 7, startMin: 0, endMin: e }
    ]
  }
  // s === e -> considerado inválido (duración cero)
  return []
}

function hasOverlapWithList(blocks, newBlock){
  // retorna true si hay solapamiento o si newBlock tiene formato inválido
  const newIntervals = blockToIntervals(newBlock)
  if (!newIntervals.length) return true

  // para cada bloque existente, generar sus intervalos y comparar
  for(const b of blocks){
    const existingIntervals = blockToIntervals(b)
    for(const ei of existingIntervals){
      for(const ni of newIntervals){
        if (ei.day !== ni.day) continue
        if (overlaps(ei.startMin, ei.endMin, ni.startMin, ni.endMin)) return true
      }
    }
  }
  return false
}

function findOverlaps(blocks, newBlock){
  // devuelve array de bloques existentes que solapan con newBlock (considerando medianoche)
  const newIntervals = blockToIntervals(newBlock)
  if (!newIntervals.length) return []
  const conflicts = []
  for(const b of blocks){
    const existingIntervals = blockToIntervals(b)
    for(const ei of existingIntervals){
      for(const ni of newIntervals){
        if (ei.day !== ni.day) continue
        if (overlaps(ei.startMin, ei.endMin, ni.startMin, ni.endMin)) {
          conflicts.push(b)
          // si un bloque tiene al menos un conflicto, lo añadimos y dejamos de comprobarlo
          break
        }
      }
      if (conflicts.length && conflicts[conflicts.length-1] === b) break
    }
  }
  return conflicts
}

module.exports = { parseHMToMinutes, overlaps, blockToIntervals, hasOverlapWithList, findOverlaps }
