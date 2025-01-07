const axios = require("axios");
const https = require("https");
const readline = require("readline");
require("dotenv").config();

const prodToken = process.env.PROD_TOKEN;

if (!prodToken) {
  console.error('PROD_TOKEN is not set in the environment variables!');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

function calculateUnixTime(minutes) {
  const currentDate = new Date();
  const OOODate = new Date(currentDate.getTime() + minutes * 60000);
  return Math.floor(OOODate.getTime() / 1000);
}

function formatTime(hours, minutes) {
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  return `${formattedHours}:${formattedMinutes}`;
}

async function createOOO(minutes, description) {
  const unixTime = calculateUnixTime(minutes);
  const currentDate = new Date();
  const OOODate = new Date(currentDate.getTime() + minutes * 60000);

  const formattedTime = formatTime(OOODate.getHours(), OOODate.getMinutes());

  const payload = {
    title: "OOO - Netto",
    listId: 3,
    due: unixTime,
    body: [
      {
        text: description || "🥖 Vou à panificadora.",
      },
    ],
    watchers: [process.env.WATCHER_ID, process.env.OWNER_ID],
    owners: [process.env.OWNER_ID],
  };

  console.log("Confirme a criação do OOO:");
  console.log("Título:", payload.title);
  console.log("Horário de retorno:", formattedTime);
  console.log("Descrição:", payload.body[0].text);

  const answer = await askQuestion('Você confirma a criação do OOO? (Digite "s" para confirmar): ');

  if (answer.toLowerCase() === "sim" || answer.toLowerCase() === "s") {
    try {
      await axios.post(
        `https://api.rock.so/webhook/bot?auth=${prodToken}&method=createTask`,
        payload,
        { httpsAgent }
      );
      
      console.log("=-=-=-=-=-=-=-=-=-=-=-=");
      console.log("OOO criado com sucesso!");
      console.log("=-=-=-=-=-=-=-=-=-=-=-=");
      console.log("☕ Vou tomar café");
    } catch (error) {
      console.error("Erro ao criar OOO:", error.message);
    }
  } else {
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    console.log("A criação do OOO foi cancelada.");
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  }

  rl.close();
}

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

const minutes = process.argv[2];
const description = process.argv[3];

if (!minutes || isNaN(minutes)) {
  console.error("Por favor, forneça um valor válido de minutos.");
  rl.close();
} else {
  createOOO(parseInt(minutes, 10), description);
}
