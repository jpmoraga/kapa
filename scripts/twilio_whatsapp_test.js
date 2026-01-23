require("dotenv").config({ path: ".env.local" });

const twilio = require("twilio");

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_WHATSAPP_FROM;   // whatsapp:+14155238886 (Sandbox)
const to = process.env.ADMIN_WHATSAPP_TO;        // whatsapp:+569...

console.log("ENV check:", {
  sid: sid ? sid.slice(0, 6) + "..." : null,
  token: token ? "OK" : null,
  from,
  to,
});

if (!sid || !token || !from || !to) {
  console.error("FALTA alguna variable: revisa .env.local (SID/TOKEN/FROM/TO)");
  process.exit(1);
}

const client = twilio(sid, token);

client.messages
  .create({
    from,
    to,
    body: "Kapa21 test Twilio WhatsApp",
  })
  .then((m) => {
    console.log("SENT:", m.sid);
  })
  .catch((e) => {
    console.error("TWILIO ERROR:", e.message);
    process.exit(1);
  });
