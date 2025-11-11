const { parseHMToMinutes } = require('./timeUtils')

// compute previous/current/next for a schedule and a Date object
function computeModules(schedule, now = new Date()){
  if (!schedule || !schedule.blocks) return { previous: null, current: null, next: null }
  const day = now.getDay()
  const minutesNow = now.getHours()*60 + now.getMinutes()

  const blocksToday = schedule.blocks.filter(b => b.day === day)
    .map(b => ({
      id: b._id,
      title: b.title,
      start: b.start,
      end: b.end,
      tag: b.tag,
      startMin: parseHMToMinutes(b.start),
      endMin: parseHMToMinutes(b.end)
    }))
    .filter(b => b.startMin !== null && b.endMin !== null)
    .sort((a,b) => a.startMin - b.startMin)

  let current = null
  let previous = null
  let next = null

  for(let i=0;i<blocksToday.length;i++){
    const b = blocksToday[i]
    if (b.startMin <= minutesNow && minutesNow < b.endMin){
      current = b
      previous = i>0 ? blocksToday[i-1] : null
      next = i<blocksToday.length-1 ? blocksToday[i+1] : null
      break
    }
    if (minutesNow < b.startMin){
      next = b
      previous = i>0 ? blocksToday[i-1] : null
      break
    }
  }

  if (!current && !next){
    if (blocksToday.length) previous = blocksToday[blocksToday.length-1]
    // buscar next en días siguientes
    for(let d=1; d<=7; d++){
      const dayToCheck = (day + d) % 7
      const blocks = schedule.blocks.filter(b => b.day === dayToCheck)
        .map(b => ({ id: b._id, title: b.title, start: b.start, end: b.end, tag: b.tag, startMin: parseHMToMinutes(b.start), endMin: parseHMToMinutes(b.end) }))
        .filter(b => b.startMin !== null)
        .sort((a,b) => a.startMin - b.startMin)
      if (blocks.length){ next = blocks[0]; break }
    }
  }

  return { previous, current, next }
}

module.exports = { computeModules }
