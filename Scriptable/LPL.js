/**
 * 日期偏移
 * -2: 可能包含昨天，在有昨天数据的情况下
 * -1: 不包含昨天
 *  0: 不包含今天
 */
const _offset_ = -2

// const LPL = ['TES', 'JDG', 'SN', 'LGD']

/**
 * Logger Level
 */
const _logger_level_ = [
  'warn',
  'error',
  'info',
  'debug',
  // 'verbo',
]
/**
 * 简易 Logger
 */
const logger = {
  log(level = 'info', ...args) {
    if (_logger_level_.includes(level)) {
      const fn = console[level] || console.log
      fn(`[${level.padStart(5, '     ')}] ` + args.map(this.stringify).join(' '))
    }
  },
  stringify(target) {
    if (target === null) {
      return '__null__'
    } else if (target === undefined) {
      return '__undefined__'
    } else if (typeof target === 'function') {
      return 'function:' + target.name
    } else if (typeof target === 'object') {
      return JSON.stringify(target)
    } else {
      return target.toString()
    }
  },
  warn(...args) {
    this.log('warn', ...args)
  },
  error(...args) {
    this.log('error', ...args)
  },
  info(...args) {
    this.log('info', ...args)
  },
  debug(...args) {
    this.log('debug', ...args)
  },
  verbose(...args) {
    this.log('verbo', ...args)
  },
}

/**
 * 构造日期字符串
 * @param {number} offset 日期偏移量，单位（天）
 * @return {string} dateString
 */
function getDateString(offset = 0) {
  const date = new Date(new Date().getTime() + offset * 60 * 60 * 24 * 1000)
  const dateFormatter = new DateFormatter()
  dateFormatter.dateFormat = 'yyyy-MM-dd'
  const string = dateFormatter.string(date)
  logger.verbose('date', string)
  return string
}

/**
 * 构造请求链接
 * @param {number} offset 日期偏移量，单位（天）
 * @return {string} url
 */
function getDataSourceUrl(offset = 0) {
  const url = `https://tiyu.baidu.com/api/match/lpl/live/date/${getDateString(offset)}/direction/after`
  logger.debug('url', url)
  return url
}

/**
 * 请求缓存
 * Map<string, any>
 */
const request_cache = new Map()

/**
 * 获得 Logo 图片，用于减少重复图片请求
 * @param {string} url 图片地址
 * @return {Image} image
 */
async function getLogoFromUrl(url) {
  if (request_cache.has(url)) {
    logger.verbose('<cache>', '[ read]', url)
    return request_cache.get(url)
  } else {
    const request = new Request(url)
    const image = await request.loadImage()
    request_cache.set(url, image)
    logger.verbose('<cache>', '[write]', url)
    return image
  }
}

/**
 * 主组件
 * @param {number} offset 日期偏移量，单位（天）
 */
async function renderMainWidget(offset = _offset_) {
  const url = getDataSourceUrl(offset)
  const request = new Request(url)
  const json = await request.loadJSON()
  logger.verbose('json', json)

  const data = json.data
  if (!data || !data.length) {
    throwError({
      message: '请求网络错误',
      errorcode: 'FETCHED_INVALID_DATA',
    })
  }

  let reOrderedData = [...data]
  const todayDateString = getDateString()
  const todayData = reOrderedData.find((item) => item.time === todayDateString)
  if (todayData) {
    const dateFormatter = new DateFormatter()
    dateFormatter.dateFormat = 'yyyy-MM-dd HH:mm:ss'
    const startTime = dateFormatter.date(todayData.list[0].startTime)
    logger.verbose('start time', startTime)
    if (offset === -2 && new Date().getTime() > startTime.getTime()) {
      logger.info('re-fetch, today\'s first match started')
      return renderMainWidget(-1)
    }

    reOrderedData = [
      todayData,
      ...reOrderedData.filter((item) => item.time !== todayDateString),
    ]
    logger.verbose('re-order', reOrderedData)
  }
  
async function getImage(url){
let req = new Request(url);
return await req.loadImage();
}
  let lpl = "http://search-operate.cdn.bcebos.com/d58b21cd46c5d0595298131fe8162d87.png"
  const widget = new ListWidget()
  widget.backgroundColor = new Color('#111111') 

//   header.centerAlignContent()
  const _icon = widget.addImage(await getImage(lpl))
  _icon.imageSize = new Size(16, 16)
  _icon.cornerRadius = 4
//     let header = widget.addText('2021LPL 春季赛')
  widget.addSpacer(5)
//   header.addSpacer(5)
//   header.rightAlignText()
//   header.textColor = Color.gray()
//   header.font = Font.mediumSystemFont(12)

  for (const item of reOrderedData) {
    logger.debug('render', item.time)

    const title = widget.addText(item.time)
    title.textColor = item.time === todayDateString ? Color.yellow() : new Color('#eeeeee')
    title.font = new Font('Optima-Bold',13)
    widget.addSpacer(5)

    for (const i of item.list) {
      const { time, leftLogo: l, rightLogo: r, status, statusText } = i
      logger.debug('render', time, statusText, l.name, l.score, r.name, r.score)
      let winner
      if (status === '2' || status === '3') {
        let l_score = Number.parseInt(l.score)
        let r_score = Number.parseInt(r.score)
        if (l_score > r_score) winner = 'l'
        if (r_score > l_score) winner = 'r'
        logger.verbose('winner', winner)
      }
      
      const stack = widget.addStack()
      
      function addText(string, color) {
        const text = stack.addText(string)
        text.textColor = color || Color.white()
        text.font = new Font('menlo', 12)
        return text
      }

      function addImage(img) {
        const image = stack.addImage(img)
        image.imageSize = new Size(14, 14)
        return image
      }
      
      const l_logo = await getLogoFromUrl(l.logo)
      const r_logo = await getLogoFromUrl(r.logo)

      addText('  ')
      addImage(l_logo)
      addText('  ')
      addText(l.name.padStart(3, '   '))// LPL.includes(l.name) && Color.red())
      addText('    ')
      addText(l.score, winner === 'l' && Color.orange())
      addText(' - ')
      addText(r.score, winner === 'r' && Color.orange())
      addText('    ')
      addImage(r_logo)
      addText('  ')
      addText(r.name.padEnd(3, '   ') )// LPL.includes(r.name) && Color.red())
      
      if (status === '1') {
        addText(`  [${statusText}]`, Color.yellow())
      } else if (status === '4') {
        addText(`  [${time}]`)
      }
      
      widget.addSpacer(3)
    }

    widget.addSpacer(4)
  }

//   const footer = widget.addText(new Date().toLocaleString())
//   footer.rightAlignText()
//   footer.textColor = Color.gray()
//   footer.font = Font.mediumSystemFont(9)

  render(widget)
}

/**
 * 错误信息组件
 * @param {object} payload
 * @param {string} payload.message 错误信息
 * @param {string} payload.errorcode 错误代码
 */
function renderErrorWidget(payload = {}) {
  const widget = new ListWidget()

  const backgroundGradient = new LinearGradient()
  backgroundGradient.colors = [
    new Color('#f5222d'),
    new Color('#cf1322'),
    new Color('#a8071a'),
    new Color('#820014'),
    new Color('#5c0011'),
  ]
  backgroundGradient.locations = [
    0.0, 0.25, 0.5, 0.75, 1.0,
  ]
  widget.backgroundGradient = backgroundGradient

  const message = payload.message || '出现错误'
  const error = widget.addText(message)
  error.centerAlignText()
  error.textColor = Color.white()
  error.font = Font.heavySystemFont(18)

  if (payload.errorcode) {
    const errorcode = widget.addText(payload.errorcode)
    errorcode.centerAlignText()
    errorcode.textColor = Color.yellow()
    errorcode.font = Font.lightSystemFont(12)
  }

  render(widget)
}

/**
 * 渲染
 * @param {Widget} widget
 */
function render(widget) {
  if (!widget) {
    throwError({ message: 'widget is required' })
  } else {
    Script.setWidget(widget)
    widget.presentLarge()
    // widget.presentMedium()
    // widget.presentSmall()
  }
}

/**
 * 统一 Error
 * @param {object} payload
 * @param {string} payload.message 错误信息
 * @param {string} payload.errorcode 错误代码
 */
function throwError(payload = {}) {
  const error = new Error(payload.message || '出现错误')
  Object.assign(error, payload)
  logger.error(payload.message, payload.errorcode)
  throw error
}

async function statistics() {
  const url = 'https://api.ihint.me/statistics.php?site=scriptable_s10'
  const request = new Request(url)
  const res = await request.loadString()
  logger.debug('statistics', res)
}

/**
 * Main
 */
async function main() {
  logger.info('bootstrap')
  const widgetArgs = args.widgetParameter
  logger.info('widget args', widgetArgs)
  let offset = _offset_
  if (widgetArgs) {
    try {
      offset = Number.parseInt(widgetArgs)
      if (Number.isNaN(offset)) {
        throwError({
          message: '解析参数错误',
          errorcode: 'INVALID_ARGS',
        })
      }
    } catch (e) {
      logger.info('parse args error')
      renderErrorWidget(e)
      throw e
    }
  }
  try {
    await renderMainWidget(offset)
    logger.info('render done')
    await statistics()
    Script.complete()
  } catch (e) {
    logger.info('render error')
    renderErrorWidget(e)
    throw e
  }
  logger.info('done')
}

main()
