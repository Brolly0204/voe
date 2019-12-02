import { createElement, updateElement } from './dom'
import { COMMIT, WEB_API } from './master'
export const elementMap = []
export let worker = null
const isNum = (x: any): x is number => typeof x === 'number'

export function masochism() {
  const scripts = document.getElementsByTagName('script')
  const path = scripts[scripts.length - 1].src

  elementMap.push(document.body)
  worker = new Worker(path)

  worker.onmessage = e => {
    const { type, data, name, prams } = JSON.parse(e.data)
    if (type === COMMIT) {
      requestAnimationFrame(() => {
        for (const index in data) {
          commit(data[index])
        }
      })
    }
    if (type === WEB_API) {
      ;(window as any)[name[0]][name[1]](...prams)
    }
  }
}

function commit(op) {
  if (op.length === 3) {
    isNum(op[1])
      ? getElement(op[0]).insertBefore(
          getElement(op[2]) || createElement(op[2]),
          getElement(op[1])
        )
      : updateElement(getElement(op[0]), op[1], op[2])
  } else {
    isNum(op[1])
      ? getElement(op[0]).removeChild(getElement(op[1]))
      : (getElement(op[0]).nodeValue = op[1])
  }
}

const getElement = index => elementMap[index] || null
