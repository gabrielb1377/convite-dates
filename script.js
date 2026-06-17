const params = new URLSearchParams(window.location.search);
const customConfig = window.CONVITE_PERSONALIZACAO || {};
const textos = customConfig.textos || {};

const CONFIG = {
  nomeDela: params.get("nome") || customConfig.nomeDela || "você",
  meuNome: params.get("de") || customConfig.meuNome || "Gabriel",
  emailDestino: params.get("email") || customConfig.emailDestino || "gabriel.cbrito05@gmail.com",
  numeroWhatsApp: params.get("whats") || customConfig.numeroWhatsApp || "",
  textos,
  locais: customConfig.locais || [],
  comidas: customConfig.comidas || [],
  vibes: customConfig.vibes || [],
  roletaResultados: customConfig.roletaResultados || [],
};

emailjs.init({
  publicKey: "qogX3mwIZjc4UbcZs",
});

const state = {
  step: "intro",
  date: "",
  time: "",
  place: "",
  food: "",
  vibe: "",
  noAttempts: 0,
};

const screen = document.querySelector("#screen");
const brand = document.querySelector("#brand");
const xp = document.querySelector("#xp");

let countdownTimer = null;
let lastPointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
};

const noEvolution = [
  "👀 não",
  "😳 tem certeza?",
  "😨 ei!",
  "😭 poxa...",
  "🥺 por favor...",
  "💀 perdi..."
];

function t(key, fallback = "") {
  return CONFIG.textos[key] || fallback;
}

function render(templateName) {
  state.step = templateName;
  clearInterval(countdownTimer);
  document.querySelector(".phone-frame").dataset.step = templateName;
  screen.replaceChildren(document.querySelector(`#${templateName}-template`).content.cloneNode(true));
  brand.textContent = t("marca", "DATE MISSION");
  xp.textContent = templateName === "final" ? "500 XP" : `${Math.min(400, getStepScore(templateName))} XP`;

  applyTexts();
  prepareScreen(templateName);
  activateButtonEyes();
  updateRealEyes(lastPointer.x, lastPointer.y);

  if (templateName === "question") setupNoButton();
  if (templateName === "roulette") runRoulette();
  if (templateName === "mind") runMindReader();
  if (templateName === "final") {
    renderFinal();
    dropConfetti();
  }
}

function getStepScore(step) {
  return {
    intro: 0,
    mission: 50,
    question: 100,
    yes: 180,
    date: 220,
    mode: 260,
    roulette: 300,
    place: 300,
    food: 340,
    vibe: 380,
    mind: 420,
    final: 500,
  }[step] || 0;
}

function applyTexts() {
  document.querySelectorAll("[data-text]").forEach((node) => {
    node.textContent = t(node.dataset.text, node.textContent);
  });

  document.querySelectorAll("[data-type]").forEach((node) => {
    typeText(node, personalize(t(node.dataset.type, node.textContent)));
  });

  setButtonText("mission", t("abrirConvite", "iniciar missão"));
  setButtonText("yes", t("sim", "SIM"));
  setButtonText("convince", t("meConvence", "me convence"));
  setButtonText("manual", t("manual", "eu escolho"));
  setButtonText("roulette", t("roleta", "🎰 roleta"));
  setButtonText("email", t("emailBotao", "mandar por email"));
  setButtonText("whatsapp", t("whatsappBotao", "mandar no WhatsApp"));
  setButtonText("copy", t("copiarBotao", "copiar resposta"));
}

function setButtonText(action, text) {
  const button = document.querySelector(`[data-action='${action}']`);
  if (button && !button.textContent.trim()) button.textContent = text;
}

function personalize(text) {
  return text.replaceAll("{nome}", CONFIG.nomeDela).replaceAll("{eu}", CONFIG.meuNome);
}

function typeText(node, text) {
  node.textContent = "";
  let index = 0;
  const speed = node.tagName === "H1" || node.tagName === "H2" ? 22 : 12;
  const timer = setInterval(() => {
    node.textContent += text[index] || "";
    index += 1;
    if (index >= text.length) clearInterval(timer);
  }, speed);
}

function prepareScreen(templateName) {
  if (templateName === "date") prepareDate();
  if (templateName === "place") renderOptions("placeOptions", CONFIG.locais, "place");
  if (templateName === "food") renderOptions("foodOptions", CONFIG.comidas, "food");
  if (templateName === "vibe") renderVibes();
}

function prepareDate() {
  const dateInput = document.querySelector("#dateInput");
  const timeInput = document.querySelector("#timeInput");

  dateInput.min = "2026-06-25";

  dateInput.value = state.date;
  timeInput.replaceChildren();

  ["", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"].forEach((time) => {
    const option = document.createElement("option");
    option.value = time;
    option.textContent = time || "escolhe uma hora";
    timeInput.append(option);
  });

  timeInput.value = state.time;
}

function renderOptions(containerId, items, group) {
  const container = document.querySelector(`#${containerId}`);
  container.replaceChildren();

  items.forEach((item) => {
    const button = document.createElement("button");
    button.className = "option";
    button.dataset.group = group;
    button.dataset.value = item.nome;
    button.innerHTML = `<span class="option-icon">${item.emoji}</span><span>${item.nome}</span>`;
    container.append(button);
  });
}

function renderVibes() {
  const container = document.querySelector("#vibeOptions");
  container.replaceChildren();

  CONFIG.vibes.forEach((item) => {
    const button = document.createElement("button");
    button.className = "choice";
    button.dataset.group = "vibe";
    button.dataset.value = item.nome;
    button.innerHTML = `<span>${item.nome}</span><small>${item.detalhe}</small>`;
    container.append(button);
  });
}

function updateRealEyes(x, y) {
  document.querySelectorAll(".eye").forEach((eye) => {
    const rect = eye.getBoundingClientRect();
    const eyeX = rect.left + rect.width / 2;
    const eyeY = rect.top + rect.height / 2;
    const angle = Math.atan2(y - eyeY, x - eyeX);
    const distance = Math.min(18, Math.hypot(x - eyeX, y - eyeY) / 2);
    const pupil = eye.querySelector(".pupil");
    const pupilX = Math.cos(angle) * distance;
    const pupilY = Math.sin(angle) * distance;
    pupil.style.transform = `translate(calc(-50% + ${pupilX}px), calc(-50% + ${pupilY}px))`;
  });
}

function activateButtonEyes() {
  document.querySelectorAll("button").forEach((button) => {
    button.classList.add("watch-button");
    button.addEventListener("pointermove", moveButtonEyes);
    button.addEventListener("pointerdown", moveButtonEyes);
    button.addEventListener("pointerleave", () => {
      button.style.setProperty("--eye-x", "0px");
      button.style.setProperty("--eye-y", "0px");
    });
  });
}

function moveButtonEyes(event) {
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;
  button.style.setProperty("--eye-x", `${Math.max(-3, Math.min(3, x / 18))}px`);
  button.style.setProperty("--eye-y", `${Math.max(-2, Math.min(2, y / 18))}px`);
}

function setupNoButton() {
  const button = document.querySelector(".no-button");
  button.addEventListener("pointerenter", () => dodgeNoButton(button));
  button.addEventListener("pointermove", () => {
    if (window.matchMedia("(hover: hover)").matches) dodgeNoButton(button);
  });
}

function dodgeNoButton(button) {
  const x = (Math.random() * 2 - 1) * 92;
  const y = (Math.random() * 2 - 1) * 54;
  button.style.setProperty("--run-x", `${x.toFixed(0)}px`);
  button.style.setProperty("--run-y", `${y.toFixed(0)}px`);
  button.classList.add("is-running");
}

function shrinkNoButton(button) {
  state.noAttempts += 1;
  const text = noEvolution[Math.min(state.noAttempts, noEvolution.length - 1)];
  const scale = Math.max(0.46, 1 - state.noAttempts * 0.11);
  button.textContent = text;
  button.style.setProperty("--no-scale", scale.toFixed(2));
  dodgeNoButton(button);

  if (state.noAttempts >= noEvolution.length - 1) {
    button.dataset.action = "no";
  }
}

function runRoulette() {
  const result = CONFIG.roletaResultados[Math.floor(Math.random() * CONFIG.roletaResultados.length)];
  const wheel = document.querySelector("#rouletteWheel");
  const title = document.querySelector("#rouletteTitle");
  const text = document.querySelector("#rouletteResult");
  const next = document.querySelector("#rouletteNext");

  setTimeout(() => {
    state.place = result.local;
    state.food = result.comida;
    wheel.textContent = result.emoji;
    wheel.classList.add("is-done");
    title.textContent = "Resultado:";
    text.textContent = `${result.comida} + ${result.local}`;
    next.hidden = false;
  }, 1800);
}

function runMindReader() {
  const result = document.querySelector("#mindResult");
  const next = document.querySelector("#mindNext");
  const messages = [
    "Lendo escolhas...",
    "Analisando personalidade...",
    t("leitorResultado", "Você gosta de comida boa, risadas e companhia incrível. Coincidentemente eu também 😎")
  ];

  let index = 0;
  result.textContent = messages[index];
  const timer = setInterval(() => {
    index += 1;
    result.textContent = messages[index];
    if (index === messages.length - 1) {
      clearInterval(timer);
      next.hidden = false;
    }
  }, 1200);
}

function renderFinal() {
  document.querySelector("#summary").innerHTML = `
    <span>📅 ${formatDate(state.date)}</span>
    <span>⏰ ${state.time}</span>
    <span>🍽️ ${state.food}</span>
    <span>✨ ${state.place}</span>
    <span>🎮 vibe: ${state.vibe}</span>
  `;

  startCountdown();
  runFakeScare();

  enviarRespostaPorEmail()
    .then(() => console.log("Resposta enviada"))
    .catch((err) => console.error(err));
}

function startCountdown() {
  const days = document.querySelector("#countDays");
  const hours = document.querySelector("#countHours");
  const minutes = document.querySelector("#countMinutes");

  function tick() {
    const target = new Date(`${state.date}T${state.time || "19:00"}:00`);
    const diff = Math.max(0, target - new Date());
    const totalMinutes = Math.floor(diff / 60000);
    const d = Math.floor(totalMinutes / 1440);
    const h = Math.floor((totalMinutes % 1440) / 60);
    const m = totalMinutes % 60;
    days.textContent = `${d} dias`;
    hours.textContent = `${h} horas`;
    minutes.textContent = `${m} minutos`;
  }

  tick();
  countdownTimer = setInterval(tick, 30000);
}

function runFakeScare() {
  const box = document.querySelector("#fakeScare");
  box.textContent = t("sustoPergunta", "Tenho mais uma pergunta...");
  setTimeout(() => {
    box.textContent = t("sustoResposta", "Quer sobremesa também?") + " 😂";
  }, 1900);
}

function buildReplyText() {
  return [
    `Eu aceito o convite, ${CONFIG.meuNome}!`,
    `Data: ${formatDate(state.date)}`,
    `Hora: ${state.time}`,
    `Local: ${state.place}`,
    `Comida: ${state.food}`,
    `Vibe: ${state.vibe}`
  ].join("\n");
}

function buildEmailUrl() {
  const subject = encodeURIComponent(`Resposta do date - ${CONFIG.nomeDela}`);
  const body = encodeURIComponent(buildReplyText());
  return `mailto:${CONFIG.emailDestino}?subject=${subject}&body=${body}`;
}

function enviarRespostaPorEmail() {
  return emailjs.send(
    "service_yyn7p2j",
    "template_rto3xfq",
    {
      nome: CONFIG.nomeDela,
      data: formatDate(state.date),
      hora: state.time,
      local: state.place,
      comida: state.food,
      vibe: state.vibe,
    }
  );
}

function buildWhatsappUrl() {
  const number = CONFIG.numeroWhatsApp.replace(/\D/g, "");
  const text = encodeURIComponent(buildReplyText());
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-999px";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
  return Promise.resolve();
}

function formatDate(value) {
  if (!value) return "data escolhida";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function selectOption(button) {
  const group = button.dataset.group;
  state[group] = button.dataset.value;
  button.parentElement.querySelectorAll("button").forEach((item) => {
    item.classList.toggle("is-selected", item === button);
  });
}

function dropConfetti() {
  const colors = ["#fff", "#ffccbc", "#102a44", "#ff7040"];
  for (let i = 0; i < 34; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 350}ms`;
    document.body.append(piece);
    setTimeout(() => piece.remove(), 1600);
  }
}

document.addEventListener("pointermove", (event) => {
  lastPointer = { x: event.clientX, y: event.clientY };
  updateRealEyes(lastPointer.x, lastPointer.y);
});

document.addEventListener("pointerdown", (event) => {
  lastPointer = { x: event.clientX, y: event.clientY };
  updateRealEyes(lastPointer.x, lastPointer.y);
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;

  if (action === "mission") render("mission");
  if (action === "question") render("question");
  if (action === "yes") render("yes");
  if (action === "date") render("date");
  if (action === "manual") render("place");
  if (action === "roulette") render("roulette");
  if (action === "vibe") render("vibe");
  if (action === "final") render("final");
  if (action === "no") render("no");

  if (action === "no-game") {
    event.preventDefault();
    shrinkNoButton(button);
  }

  if (action === "convince") {
    document.querySelector(".convince-box").hidden = false;
  }

  if (button.dataset.group) {
    selectOption(button);
    if (button.dataset.group === "vibe") setTimeout(() => render("mind"), 240);
  }

  if (action === "save-place") {
    const suggestion = document.querySelector("#placeSuggestion").value.trim();
    if (suggestion) state.place = suggestion;
    if (state.place) render("food");
  }

  if (action === "save-food") {
    const suggestion = document.querySelector("#foodSuggestion").value.trim();
    if (suggestion) state.food = suggestion;
    if (state.food) render("vibe");
  }

  if (action === "email") window.location.href = buildEmailUrl();
  if (action === "whatsapp") window.location.href = buildWhatsappUrl();

  if (action === "copy") {
    await copyText(buildReplyText());
    document.querySelector("#copyStatus").textContent = "Resposta copiada.";
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-form='date']");
  if (!form) return;
  event.preventDefault();
  state.date = document.querySelector("#dateInput").value;
  state.time = document.querySelector("#timeInput").value;
  render("mode");
});

if (params.get("demo") === "final") {
  Object.assign(state, {
    date: "2026-06-20",
    time: "19:00",
    place: "Praia",
    food: "Sushi",
    vibe: "divertido",
  });
  render("final");
} else if (params.get("demo") === "question") {
  render("question");
} else if (params.get("demo") === "mission") {
  render("mission");
} else if (params.get("demo") === "yes") {
  render("yes");
} else if (params.get("demo") === "roulette") {
  render("roulette");
} else {
  render("intro");
}
