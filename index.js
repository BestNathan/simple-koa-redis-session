const ioredis = require('ioredis')
const uuid = require('uuid')
const crypto = require('crypto')

const md5 = str => {
  crypto
    .createHash('md5')
    .update(str)
    .digest()
}

module.exports = ({ ioredisOptions, maxAge, sessionId }) => {
  const redis = new ioredis(ioredisOptions)

  redis.on('connect', () => {
    console.log('redis connected...')
  })

  redis.on('error', error => {
    throw error
  })

  return async function redisSeesionMiddleware(ctx, next) {
    ctx.$storeUserInfo = userInfo => {
      let cookieVal = md5(Date.now() + uuid() + 'bestnathan')
      return redis
        .set(cookieVal, JSON.stringify(userInfo))
        .then(() => {
          return redis.expire(cookieVal, maxAge)
        })
        .then(() => {
          ctx.cookies.set(sessionId, cookieVal, { maxAge: maxAge * 1000 })
        })
    }
    let cookieVal = ctx.cookies.get(sessionId)
    if (cookieVal) {
      ctx.$userInfo = await redis.get(cookieVal).then(res => JSON.parse(res))
    }
    next()
  }
}
