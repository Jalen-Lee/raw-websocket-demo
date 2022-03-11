import { nanoid } from 'nanoid'
import "./style.css"

const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");
const presence = document.getElementById("presence-indicator");

const baseURL = 'ws://localhost:8080'
const _uid = nanoid()
let allChat = [];

const ws = new WebSocket(`${baseURL}/?uid=${_uid}`, ["json"]);
ws.addEventListener("open", (event) => {
  console.log("connected");
  presence.innerText = "🟢 online";
});

ws.addEventListener("close", () => {
  presence.innerText = "🔴 offline";
});

ws.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  console.group("ws：收到新消息")
  console.log("data",data);
  console.groupEnd()
  allChat = data.msg;
  render();
});

chat.addEventListener("submit", function (e) {
  e.preventDefault();
  if(chat.elements.text.value === '') return
  postNewMsg(chat.elements.user.value, chat.elements.text.value);
  chat.elements.text.value = "";
});


function postNewMsg(user, text) {
  ws.send(JSON.stringify({
    user,
    text,
  }));
}

function render() {
  const html = allChat.map((msg) => template(msg));
  msgs.innerHTML = html.join("\n");
}

const template = ({ uid, user, text }) => uid === _uid ? 
  `<li class="collection-item align-right">${user}(自己)：${text}</li>` :
  `<li class="collection-item">${user}：${text}</li>`;
