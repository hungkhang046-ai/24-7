const mineflayer = require('mineflayer');
const http = require('http');

// ==========================================
// DANH SÁCH CÁC BOT CẦN CHẠY
// ==========================================
const SERVER_HOST = 'TTCsmp.asia';
const SERVER_PORT = 25565;
const PHIEN_BAN = '1.21.4';
const TEN_TAI_KHOAN_CHINH = 'Hungg7';

const BOT_LIST = [
  {
    username: 'jane123',
    password: 'ttc123', // Thay mật khẩu thật
    autoRegister: true,
    autoTpAccept: true,
    jumpIntervalMs: 30000
  },
  {
    username: 'Gojosatru123',
    password: 'hung123', // Thay mật khẩu thật
    autoRegister: true,
    autoTpAccept: false, // Chỉ bot chính mới cần tự nhận TPA để tránh spam /tpaccept
    jumpIntervalMs: 35000
  }
];
// ==========================================

// Web server giữ cổng cho host (chỉ mở 1 lần duy nhất cho toàn bộ tiến trình)
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`Dang chay ${BOT_LIST.length} bot Minecraft!`);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Web server dang chay tren cong ${PORT}`);
});

function createSingleBot(config) {
  let reconnectTimer = null;
  let antiAfkInterval = null;

  function scheduleReconnect(reason) {
    if (antiAfkInterval) {
      clearInterval(antiAfkInterval);
      antiAfkInterval = null;
    }
    if (reconnectTimer) return;

    console.log(`[${config.username}] Mat ket noi (${reason}). Vao lai sau 10s...`);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 10000);
  }

  function connect() {
    console.log(`[${config.username}] Dang ket noi toi ${SERVER_HOST}...`);

    const bot = mineflayer.createBot({
      host: SERVER_HOST,
      port: SERVER_PORT,
      username: config.username,
      version: PHIEN_BAN,
      skipValidation: true
    });

    bot._client.on('resource_pack_send', (packet) => {
      console.log(`[${config.username}] Tu choi Resource Pack.`);
      bot._client.write('resource_pack_receive', {
        uuid: packet.uuid,
        result: 3
      });
    });

    bot.once('spawn', () => {
      console.log(`[${config.username}] Da vao game!`);

      if (config.autoRegister) {
        setTimeout(() => {
          bot.chat(`/register ${config.password} ${config.password}`);
          console.log(`[${config.username}] Da gui /register`);
        }, 2000);
      }

      setTimeout(() => {
        bot.chat(`/login ${config.password}`);
        console.log(`[${config.username}] Da gui /login`);
      }, 5000);

      if (config.jumpIntervalMs && config.jumpIntervalMs > 0) {
        antiAfkInterval = setInterval(() => {
          bot.setControlState('jump', true);
          setTimeout(() => bot.setControlState('jump', false), 500);
        }, config.jumpIntervalMs);
      }
    });

    bot.on('messagestr', (msg) => {
      console.log(`[${config.username}] [Server]: ${msg}`);
      if (config.autoTpAccept && msg.includes(TEN_TAI_KHOAN_CHINH)) {
        console.log(`[${config.username}] Phat hien ${TEN_TAI_KHOAN_CHINH}, gui /tpaccept...`);
        setTimeout(() => {
          bot.chat('/tpaccept');
        }, 1000);
      }
    });

    bot.on('kicked', (reason) => {
      console.log(`[${config.username}] Bi kick:`, reason);
      scheduleReconnect('kicked');
    });

    bot.on('end', (reason) => {
      console.log(`[${config.username}] Ngat ket noi:`, reason);
      scheduleReconnect('end');
    });

    bot.on('error', (err) => {
      console.log(`[${config.username}] Loi:`, err.message || err);
      scheduleReconnect('error');
    });
  }

  connect();
}

// Khởi chạy từng bot cách nhau 4 giây để tránh kết nối dồn dập
BOT_LIST.forEach((cfg, index) => {
  setTimeout(() => {
    createSingleBot(cfg);
  }, index * 4000);
});