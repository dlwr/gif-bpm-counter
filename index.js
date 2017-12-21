const http    = require('http')
const url     = require('url')
const promise = require('bluebird')
const gm      = require('gm').subClass({imageMagick: true})
const fetch   = require('node-fetch')
promise.promisifyAll(gm.prototype)

async function getImage(url) {
  const res = await fetch(url).catch(() => null)
  if (res) {
    const buffer = res.buffer()
    return buffer
  } else {
    return null
  }
}

async function detectBpm(buffer) {
  const duration = await gm(buffer, 'image.gif').identifyAsync('%T,').catch(() => '0')
  return convertDurationToBpm(duration.split(',').reduce((acc, cur) => Number(acc) + Number(cur)))
}

function convertDurationToBpm(duration) {
  return roundBpm(60 * 100 / duration)
}

function roundBpm(bpm) {
  if (bpm > 180) {
    return (roundBpm(bpm / 2))
  } else if (bpm < 70) {
    return (roundBpm(bpm * 2))
  } else {
    return bpm
  }
}

const server = http.createServer(async (request, response) => {
  const urlInfo = url.parse(request.url, true)
  const targetUrl = urlInfo.query.url
  let result = 0
  if (targetUrl) {
    const imageBuffer = await getImage(targetUrl)
    if (imageBuffer) {
      result = await detectBpm(imageBuffer).catch(() => 0)
    }
  }
  response.writeHead(200, {'Content-Type': 'text/plain'})
  response.write(`${result}`)
  response.end()
}).listen(4000)
