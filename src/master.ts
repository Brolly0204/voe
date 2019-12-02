import { masochism } from './slave'
import { handlerMap, TEXT } from './h'
const MAIN = typeof window !== 'undefined'
const effectStack = []
const commitQueue = []
export const targetMap = new WeakMap()
export const [COMMIT, EVENT, WEB_API] = [1, 2, 3]
export function render(instance) {
  MAIN ? masochism() : sadism(instance)
}

function sadism(instance) {
  instance.update = effect(() => {
    const oldVnode = instance.subTree || null
    const newVnode = (instance.subTree = instance.tag(instance.props))
    let index = 2
    let commit = diff(1, index, oldVnode, newVnode)
    self.postMessage(
      JSON.stringify({
        type: COMMIT,
        data: commit
      }),
      null
    )
  })
  instance.update()
  self.onmessage = e => {
    const { type, data, id } = JSON.parse(e.data)
    if (type === EVENT) {
      const fn = handlerMap[id]
      fn && fn(data)
    }
  }
  ;(self as any).localStorage = {
    getItem(key) {
      callMethod(['localStorage', 'getItem'], [key])
    },
    setItem(key, val) {
      callMethod(['localStorage', 'setItem'], [key, val])
    }
  }
}

function diff(parent, node, oldVnode, newVnode) {
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
  } else {
    let oldKids = oldVnode.children
    let newKids = newVnode.children
    let oldStart = 0
    let newStart = 0
    let oldEnd = oldKids.length - 1
    let newEnd = newKids.length - 1
    let oldHead = oldKids[0]
    let newHead = newKids[0]
    let oldTail = oldKids[oldEnd]
    let newTail = newKids[newEnd]
    let oldKeyed
    let oldIdx
    let moveEl
    let before

    while (oldStart <= oldEnd && newStart <= newEnd) {
      if (oldHead == null) {
        oldHead = oldKids[++oldStart]
      } else if (oldTail == null) {
        oldTail = oldKids[--oldEnd]
      } else if (newHead == null) {
        oldHead = oldKids[++newStart]
      } else if (newTail == null) {
        oldTail = oldKids[--newEnd]
      } else if (isSame(oldHead, newHead)) {
        diff(null, null, oldHead, newHead)
        oldHead = oldKids[++oldStart]
        newHead = newKids[++newStart]
      } else if (isSame(oldTail, newTail)) {
        diff(null, null, oldTail, newTail)
        oldTail = oldKids[--oldEnd]
        newTail = newKids[--newEnd]
      } else if (isSame(oldHead, newTail)) {
        diff(null, null, oldHead, newTail)
        //insert
        oldHead = oldKids[++oldStart]
        newTail = newKids[--newEnd]
      } else if (isSame(oldTail, newHead)) {
        diff(null, null, oldHead, newTail)
        //insert
        oldTail = oldKids[--oldTail]
        newHead = newKids[++newStart]
      } else {
        if (oldKeyed == null) {
          oldKeyed = createKeyed(oldKids, oldStart, oldEnd)
        }
        oldIdx = oldKeyed[newHead.key]
        if (oldIdx != null) {
          //insert
          newHead = newKids[++newStart]
        } else {
          moveEl = oldKids[oldIdx]
          if (moveEl.tag !== newHead.tag) {
            //insert
          } else {
            // diff
            oldKids[oldIdx] = null
            // insert
          }
          newHead = newKids[++newStart]
        }
      }
    }

    if (oldStart <= oldEnd || newStart <= newEnd) {
      if (oldStart > oldEnd) {
        // insert
      } else {
        // remove
      }
    }
  }
}

function createKeyed(kids, start, end) {
  var i,
    out = {},
    key,
    kid
  for (i = start; i <= end; i++) {
    kid = kids[i]
    if (kid != null) {
      key = kid.key
      if (key !== undefined) out[key] = i
    }
  }
  return out
}

function isSame(a, b) {
  return a.key === b.key && a.tag === b.tag
}

function effect(fn) {
  const effect = function effect(...args) {
    return run(effect, fn, args)
  }
  return effect
}

function run(effect, fn, args) {
  if (effectStack.indexOf(effect) === -1) {
    try {
      effectStack.push(effect)
      return fn(...args)
    } finally {
      effectStack.pop()
    }
  }
}

export function trigger(target, key) {
  let deps = targetMap.get(target)
  const effects = new Set()

  deps.get(key).forEach(e => effects.add(e))
  effects.forEach((e: any) => e())
}

export function track(target, key) {
  const effect = effectStack[effectStack.length - 1]
  if (effect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    if (!dep.has(effect)) {
      dep.add(effect)
    }
  }
}

function callMethod(name: any, prams: any) {
  self.postMessage(
    JSON.stringify({
      type: WEB_API,
      name,
      prams
    }),
    null
  )
}
