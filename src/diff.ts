const CREATE = 'CREATE'
const UPDATE = 'UPDATE'
const MOVE = 'MOVE'
const REMOVE = 'REMOVE'
const TEXT = 3
const commitQueue = []

export function diffVnode(oldVnode,newVnode){
    if (oldVnode === newVnode) {
    } else if (
      oldVnode != null &&
      oldVnode.type === TEXT &&
      newVnode.type === TEXT
    ) {
      if (oldVnode.tag !== newVnode.tag) commitQueue.push([node, newVnode.tag])
    } else if (oldVnode == null || oldVnode.tag !== newVnode.tag) {
      commitQueue.push([parent, -1, newVnode])
      if (oldVnode != null) {
        commitQueue.push([parent, node])
      }
    }
}

export function diffChildren(oldKids, newKids, effect) {
  let oldStart = cursor(oldKids, 0)
  let oldEnd = cursor(oldKids, oldKids.length - 1)
  let newStart = cursor(newKids, 0)
  let newEnd = cursor(newKids, newKids.length - 1)

  let keyToIdx, resuedKids

  while (oldStart.idx <= oldEnd.idx && newStart.idx <= newEnd.idx) {
    if (isUndefined(oldStart.item)) {
      oldStart = forward(oldKids, oldStart)
    } else if (isUndefined(oldEnd.item)) {
      oldEnd = back(oldKids, oldEnd)
    } else if (equal(oldStart, newStart)) {
      effect(UPDATE, oldStart.item, newStart.item, newStart.idx)
      oldStart = forward(oldKids, oldStart)
      newStart = forward(newKids, newStart)
    } else if (equal(oldEnd, newEnd)) {
      effect(UPDATE, oldEnd.item, newEnd.item, newEnd.idx)
      oldEnd = back(oldKids, oldEnd)
      newEnd = back(newKids, newEnd)
    } else if (equal(oldStart, newEnd)) {
      effect(MOVE, oldStart.item, newEnd.item, newEnd.idx)
      oldStart = forward(oldKids, oldStart)
      newEnd = back(newKids, newEnd)
    } else if (equal(oldEnd, newStart)) {
      effect(MOVE, oldEnd.item, newStart.item, newStart.idx)
      oldEnd = back(oldKids, oldEnd)
      newStart = forward(newKids, newStart)
    } else {
      break
    }
  }

  keyToIdx = mapKeyToIdx(oldKids, oldStart.idx, oldEnd.idx)
  for (; newStart.idx <= newEnd.idx; newStart = forward(newKids, newStart)) {
    resuedKids = keyToIdx[key(newStart.item)]
    if (isUndefined(resuedKids)) {
      effect(CREATE, null, newStart.item, newStart.idx)
    } else {
      effect(MOVE, oldKids[resuedKids], newStart.item, newStart.idx)
      delete keyToIdx[key(newStart.item)]
    }
  }

  for (let key in keyToIdx) {
    resuedKids = keyToIdx[key]
    effect(REMOVE, oldKids[resuedKids])
  }

  function mapKeyToIdx(list, start, end) {
    let i
    let map = {}
    for (i = start; i <= end; ++i) {
      map[key(list[i])] = i
    }
    return map
  }
}

function cursor(list, idx) {
  return { item: list[idx], idx }
}

function forward(list, c) {
  c.item = list[++c.idx]
  return c
}

function back(list, c) {
  c.item = list[--c.idx]
  return c
}

const key = item => item.key
const equal = (a, b) => key(a.item) === key(b.item) && a.idx === b.idx
const isUndefined = a => typeof a === 'undefined'
