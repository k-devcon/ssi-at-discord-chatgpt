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

      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant who responds succinctly" },
          { role: "user", content: inputContent }
        ],
      });

      const isThread = message.channel.id !== '1044079622528184371';

      const content = response.data.choices[0].message;

      if (isThread) {
        return message.reply(content);
      } else {
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