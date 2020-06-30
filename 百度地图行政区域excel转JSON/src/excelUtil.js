import Xlsx from 'xlsx'

const letters = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
]

export async function readXlsx(file) {
  if (file) {
    const metaData = await readFile(file)
    const xlsx = Xlsx.read(metaData, {type: 'binary'})
    const data = createArray(xlsx)
    return getData(data, xlsx)
  }
  return {}
}

export async function downloadXlsx(filename, obj) {
  const wb = new WorkBook(obj)
  Xlsx.writeFile(wb, filename)
}

class WorkBook {
  constructor(data) {
    this.SheetNames = Object.keys(data)
    this.Sheets = {}
    for (const name of this.SheetNames) {
      const sheet = {
        [name]: setData(data[name])
      }
      Object.assign(this.Sheets, sheet)
    }
  }
}

function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsBinaryString(file)
    reader.onload = (e) => {
      resolve(e.target.result)
    }
  })
}

function createArray({SheetNames, Sheets}) {
  const result = {}
  for (const name of SheetNames) {
    const arr = []
    const ref = Sheets[name]['!ref']
    let [x, y] = getRange(ref)
    for (let i = 0; i < y; i++) {
      const tp = []
      for (let j = 0; j < x; j++) {
        tp.push(undefined)
      }
      arr.push(tp)
    }
    Object.assign(result, {[name]: arr})
  }
  return result
}

function getRange(ref) {
  const boundary = ref.split(':')[1]
  const a1 = boundary.split(/[0-9]+/)[0]
  const a2 = boundary.split(/[A-Z]+/)[1]
  return [getNumber(a1), a2 * 1]
}

function getNumber(letter) {
  const arr = letter.split('')
  let result = 0
  for (let i = 0; i < arr.length; i++) {
    result += (letters.indexOf(arr[i]) + 1) * Math.pow(26, arr.length - i - 1)
  }
  return result
}

function getLetter(num) {
  num *= 1
  const t = (num - 1).toString('26')
  const arr = t.split('')
  let result = ''
  for (let i in arr) {
    i *= 1
    const n = parseInt(arr[i], 26) * 1
    result += letters[i !== arr.length - 1 ? n - 1 : n]
  }
  return result
}

function getData(data, {SheetNames, Sheets}) {
  for (const name of SheetNames) {
    const copySheet = JSON.parse(JSON.stringify(Sheets[name]))
    delete copySheet['!margins']
    delete copySheet['!ref']
    const keys = Object.keys(copySheet)
    for (const key of keys) {
      const a1 = key.split(/[0-9]+/)[0]
      const a2 = key.split(/[A-Z]+/)[1]
      const point = {x: getNumber(a1), y: a2 * 1}
      data[name][point.y - 1][point.x - 1] = copySheet[key].v
    }
  }
  return data
}

function setData(data = []) {
  const result = {'!ref': ''}
  let width, height = data.length, start
  for (let i in data) {
    i *= 1
    if (width) {
      if (data[i].length > width) {
        width = data[i].length
      }
    } else {
      width = data[i].length
    }

    for (let j in data[i]) {
      j *= 1
      const v = data[i][j]
      const k = getLetter(j + 1) + (i + 1)
      if (v) {
        result[k] = {v, t: 's'}

        if (!start) {
          start = k
        }
      }
    }
  }
  if (width && height && start) {
    result['!ref'] = `${start}:${getLetter(width) + height}`
  }
  return result
}