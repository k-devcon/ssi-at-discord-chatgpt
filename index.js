import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

client.on('ready', client => {
  sendHeartbeat();
})

client.on("messageCreate", async function (message) {
  // 봇의 메시지는 무시
  if (message.author.bot) return;

  // 질문 답변 채널 외에는 사용 불가
  if (message.channel.id === '1044079622528184371'
    || (message.channel.parentId && message.channel.parentId === '1044079622528184371')) {

    // 멘션이 포함되었을 경우에만 응답
    if (message.content.indexOf("@씨앗") === -1 && message.content.indexOf("<@1063710061651832934>") === -1) return;

    try {
      const inputContent = message.content.replace(/@씨앗/gi, '').replace(/<@1063710061651832934>/gi, '').trim();

      const isThread = message.channel.id !== '1044079622528184371';
      const messages = [{ role: "system", content: "You are a helpful assistant who responds succinctly" }];

      if (isThread) {
        client.guilds.fetch('1043347505993224233')
          .then((guild) => {
            guild.channels.fetch('1044079622528184371')
              .then(async (channel) => {
                const messageCollection = await channel.messages.fetch({ limit: 100 })
                const threadMessages = messageCollection.map(message => {
                  return {
                    role: message.author.bot ? 'assistant' : 'user',
                    content: message.content
                  };
                })
                messages.push(...threadMessages.reverse(), { role: "user", content: inputContent });

                const response = await openai.createChatCompletion({
                  model: "gpt-3.5-turbo",
                  messages: messages,
                });
                const content = response.data.choices[0].message;

                message.reply(content);
              })
          })
      } else {
        messages.push({ role: "user", content: inputContent });

        const response = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: messages,
        });
        const content = response.data.choices[0].message;

        const thread = await message.startThread({ name: (inputContent.length > 20) ? inputContent.substring(0, 20) + '...' : inputContent });
        thread.send(content);
      }
    } catch (err) {
      console.error(err);
      return message.reply(
        "에러 발생 ;)"
      );
    }
  }
});

client.login(process.env.BOT_TOKEN);

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function sendHeartbeat() {
  setTimeout(() => {
    client.guilds.fetch('1043347505993224233')
      .then((guild) => {
        guild.channels.fetch('1089782559958892634')
          .then(async (channel) => {
            channel.send('💕');
            sendHeartbeat();
          })
      })
  }, randomIntFromInterval(5, 25) * 60 * 1000);
}