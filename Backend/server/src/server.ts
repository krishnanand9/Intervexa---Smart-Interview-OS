import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { initConversationQueue } from './queue/conversationQueue.js';

async function bootstrap() {
  await connectDatabase();
  
  // Initialize BullMQ / real-time conversation queue
  await initConversationQueue(async (jobData) => {
    console.log(`[Queue Worker] Processed turn for interview: ${jobData.interviewId}`);
  });

  app.listen(env.PORT, () => {
    console.log(`InterVexa API running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
