import http from "http";
import handler from "serve-handler";
import nanobuffer from "nanobuffer";
import objToResponse from "./obj-to-response.js";
import generateAcceptValue from "./generate-accept-value.js";
import parseMessage from "./parse-message.js";

// 已建立的连接：uid => socket
let connections = new Map();
// 模拟一个消息队列
const msg = new nanobuffer(50);
const getMsgs = () => Array.from(msg).reverse();

// 静态资源
const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: "./frontend",
  });
});

server.on("upgrade", function (req, socket) {
  // 如果升级的协议不是websocket则不处理
  if (req.headers["upgrade"] !== "websocket") {
    socket.end("HTTP/1.1 400 Bad Request");
    return;
  }

  const acceptKey = req.headers["sec-websocket-key"];
  const acceptValue = generateAcceptValue(acceptKey);
  const headers = [
    "HTTP/1.1 101 Web Socket Protocol Handshake",
    "Upgrade: WebSocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptValue}`,
    "Sec-WebSocket-Protocol: json",
  ];

  socket.write(headers.join("\r\n")+'\r\n\r\n');
  // 连接完成后返回当前存在的所有消息
  socket.write(objToResponse({ msg: getMsgs() }));
  
  const uid = new URLSearchParams(req.url.slice(1)).get('uid')
  connections.set(uid,socket);
  console.log(`用户${uid}已连接`);

  socket.on("data", (buffer) => {
    const message = parseMessage(buffer);
    if (message) {
      console.log(`用户${uid}发送：${JSON.stringify(message)}`);
      msg.push({
        uid,
        user: message.user,
        text: message.text,
        time: Date.now(),
      });

      connections.forEach((s) => s.write(objToResponse({ msg: getMsgs() })));
    } else if (message === null) {
      socket.end();
    }
  });

  socket.on("end", () => {
    console.log(`用户${uid}已断开连接`)
    connections.delete(uid)
  });
});



const port = process.env.PORT || 8080;
server.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`)
);
