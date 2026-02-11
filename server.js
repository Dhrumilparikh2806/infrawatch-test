const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// ---- DUMMY DATA ----
let rivers = [
  { id:1, name:"Mithi River", level:4.1, risk:65 },
  { id:2, name:"Ulhas River", level:2.3, risk:20 },
  { id:3, name:"Amba River", level:5.6, risk:92 }
];

let zones = [
  { id:"DZ-01", severity:78 },
  { id:"DZ-02", severity:55 },
  { id:"DZ-03", severity:90 }
];

let cameras = [
  { id:"CAM-01", risk:30 },
  { id:"CAM-02", risk:70 },
  { id:"CAM-03", risk:90 }
];

// ---- UPDATE LOGIC ----
function updateData() {
  rivers = rivers.map(r => ({
    ...r,
    level: +(r.level + (Math.random() - 0.5)).toFixed(2),
    risk: Math.min(100, Math.max(0, r.risk + Math.floor(Math.random()*10 - 5)))
  }));

  zones = zones.map(z => ({
    ...z,
    severity: Math.min(100, Math.max(0, z.severity + Math.floor(Math.random()*8 - 4)))
  }));

  cameras = cameras.map(c => ({
    ...c,
    risk: Math.min(100, Math.max(0, c.risk + Math.floor(Math.random()*6 - 3)))
  }));

  io.emit("liveData", { rivers, zones, cameras });
}

// every 5 seconds
setInterval(updateData, 5000);

// ---- SOCKET ----
io.on("connection", socket => {
  socket.emit("liveData", { rivers, zones, cameras });
});

// ---- START ----
server.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});
