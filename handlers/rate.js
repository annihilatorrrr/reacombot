const Composer = require('telegraf/composer')

const composer = new Composer()

composer.action(/^(rate):(.*)/, async ctx => {
  let resultText = ''
  const rateName = ctx.match[2]

  const { message } = ctx.callbackQuery

  const post = await ctx.db.Post.findOne({ channelMessageId: message.message_id }).populate('channel')

  if (!post) return

  post.rate.votes.map((rate) => {
    const indexRate = rate.vote.indexOf(ctx.from.id)

    if (indexRate > -1) rate.vote.splice(indexRate, 1)
    if (rateName === rate.name) {
      if (indexRate > -1) {
        resultText = ctx.i18n.t('rate.vote.back', { me: ctx.me })
      } else {
        resultText = ctx.i18n.t('rate.vote.rated', { rateName, me: ctx.me })
        rate.vote.push(ctx.from.id)
      }
    }
  })

  post.markModified('rate')

  if (post.rate.votes.length === 2) post.rate.score = post.rate.votes[0].vote.length - post.rate.votes[1].vote.length

  await post.save()

  ctx.state.answerCbQuery = [resultText]

  const votesKeyboardArray = []

  post.rate.votes.forEach(react => {
    votesKeyboardArray.push({
      text: `${react.name} ${react.vote.length > 0 ? react.vote.length : ''}`,
      callback_data: `rate:${react.name}`
    })
  })

  votesKeyboardArray.push({
    text: '💬',
    url: `https://t.me/c/${post.channel.groupId.toString().substr(4)}/${post.channel.settings.showStart === 'top' ? 1 : 1000000}?thread=${post.groupMessageId}`
  })

  await ctx.editMessageReplyMarkup({
    inline_keyboard: [votesKeyboardArray]
  }).catch(console.error)
})

module.exports = composer
