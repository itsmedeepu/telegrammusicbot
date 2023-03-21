const TelegramBot = require('node-telegram-bot-api');
const ytdl = require('ytdl-core');
const fs = require('fs');

// Set up your Telegram bot token
const token = '6055609671:AAHjr6pd6Co5Lv73b6U0tTftCJHOoixeOgc';
const bot = new TelegramBot(token, { polling: true });

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // Check if the message contains a valid YouTube link
  if (isValidYouTubeLink(messageText)) {
    bot.sendMessage(chatId, 'Fetching audio from YouTube...', {
      reply_markup: {
        remove_keyboard: true,
      },
    });

    // Fetch video info to get the title and author
    ytdl.getBasicInfo(messageText).then((info) => {
      const title = info.videoDetails.title;
      const performer = info.videoDetails.author.name;

      const video = ytdl(messageText, { filter: 'audioonly' });

      video.pipe(fs.createWriteStream('Audio.mp3'))
        .on('finish', () => {
          bot.sendChatAction(chatId, 'upload_audio');
          bot.sendAudio(chatId, './Audio.mp3', {
            title,
            performer,
            contentType: 'audio/mpeg',
          }).then(() => {
            fs.unlinkSync('Audio.mp3');
            // bot.sendMessage(chatId, 'Audio successfully sent!');
          });
        })
        .on('error', (err) => {
          console.error(err);
          bot.sendMessage(chatId, 'Failed to fetch audio from YouTube.');
        });
    }).catch((err) => {
      console.error(err);
      bot.sendMessage(chatId, 'Failed to fetch video info from YouTube.');
    });
  } else {
    bot.sendMessage(chatId, 'Please enter a valid YouTube link.');
  }
});

// Helper function to check if a string is a valid YouTube link
function isValidYouTubeLink(str) {
  const pattern = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+$/gm;
  return pattern.test(str);
}
