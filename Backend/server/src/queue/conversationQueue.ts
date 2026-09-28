import { Queue, Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import { EventEmitter } from "events";

export interface ConversationJobData {
  interviewId: string;
  questionId: string;
  currentQuestion: string;
  candidateAnswer: string;
  role: string;
  interviewType: string;
  experienceLevel: string;
  questionIndex: number;
  totalQuestions: number;
}

class InMemoryQueue extends EventEmitter {
  async add(name: string, data: ConversationJobData) {
    setImmediate(async () => {
      try {
        this.emit("completed", { name, data });
      } catch (err: any) {
        this.emit("failed", { name, data, error: err });
      }
    });
    return { id: `mem-${Date.now()}` };
  }
}

let bullQueue: Queue | null = null;
let bullWorker: Worker | null = null;
let inMemoryQueue: InMemoryQueue | null = null;
let useRedis = false;

export async function initConversationQueue(
  processor: (jobData: ConversationJobData) => Promise<any>
) {
  const redisHost = process.env.REDIS_HOST || "127.0.0.1";
  const redisPort = Number(process.env.REDIS_PORT || 6379);

  try {
    const redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 2000,
      retryStrategy: () => null,
    });

    redisClient.on("error", (err: any) => {
      if (!useRedis) return;
      console.warn("Redis unavailable, switching queue to in-memory mode:", err?.message);
      useRedis = false;
    });

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Redis connection timeout"));
      }, 1500);

      redisClient.ping((err: any) => {
        clearTimeout(timer);
        if (err) reject(err);
        else resolve();
      });
    });

    useRedis = true;
    const connection = { host: redisHost, port: redisPort };
    bullQueue = new Queue("interview-conversation", { connection });
    bullWorker = new Worker(
      "interview-conversation",
      async (job: Job<ConversationJobData>) => {
        return await processor(job.data);
      },
      { connection }
    );

    console.log("BullMQ initialized and connected to Redis successfully.");
  } catch (error: any) {
    useRedis = false;
    inMemoryQueue = new InMemoryQueue();
    console.log("BullMQ: Redis not running locally, using high-speed In-Memory Async Conversation Queue.");
  }
}

export async function enqueueConversationTurn(
  jobData: ConversationJobData,
  immediateProcessor?: (jobData: ConversationJobData) => Promise<any>
) {
  if (useRedis && bullQueue) {
    try {
      const job = await bullQueue.add("process-turn", jobData, {
        attempts: 2,
        removeOnComplete: true,
      });
      return { success: true, jobId: job.id, mode: "bullmq" };
    } catch (e) {
      console.warn("BullMQ add failed, executing via fallback:", e);
    }
  }

  if (immediateProcessor) {
    setImmediate(async () => {
      try {
        await immediateProcessor(jobData);
      } catch (err: any) {
        console.error("Async turn processing error:", err);
      }
    });
  }

  return { success: true, jobId: `in-memory-${Date.now()}`, mode: "in-memory" };
}
