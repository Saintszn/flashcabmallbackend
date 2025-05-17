// backend/utils/pusher.js
const Pusher = require("pusher");

const pusher = new Pusher({
  appId:   process.env.PUSHER_APP_ID,   // 1994000
  key:     process.env.PUSHER_KEY,      // c7d006ac3ebfcc145d21
  secret:  process.env.PUSHER_SECRET,   // 85487b2970b314eb163d8
  cluster: process.env.PUSHER_CLUSTER,  // mt1
  useTLS:  true
});

module.exports = pusher;
