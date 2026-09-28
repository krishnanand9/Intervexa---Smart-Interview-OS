import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { EventEmitter } from "events";
class InMemoryQueue extends EventEmitter {
    async add(name, data) {
        setImmediate(async () => {
            try {
                this.emit("completed", { name, data });
            }
            catch (err) {
                this.emit("failed", { name, data, error: err });
            }
        });
        return { id: `mem-${Date.now()}` };
    }
}
let bullQueue = null;
let bullWorker = null;
let inMemoryQueue = null;
let useRedis = false;
export async function initConversationQueue(processor) {
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
        redisClient.on("error", (err) => {
            if (!useRedis)
                return;
            console.warn("Redis unavailable, switching queue to in-memory mode:", err?.message);
            useRedis = false;
        });
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error("Redis connection timeout"));
            }, 1500);
            redisClient.ping((err) => {
                clearTimeout(timer);
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        useRedis = true;
        const connection = { host: redisHost, port: redisPort };
        bullQueue = new Queue("interview-conversation", { connection });
        bullWorker = new Worker("interview-conversation", async (job) => {
            return await processor(job.data);
        }, { connection });
        console.log("BullMQ initialized and connected to Redis successfully.");
    }
    catch (error) {
        useRedis = false;
        inMemoryQueue = new InMemoryQueue();
        console.log("BullMQ: Redis not running locally, using high-speed In-Memory Async Conversation Queue.");
    }
}
export async function enqueueConversationTurn(jobData, immediateProcessor) {
    if (useRedis && bullQueue) {
        try {
            const job = await bullQueue.add("process-turn", jobData, {
                attempts: 2,
                removeOnComplete: true,
            });
            return { success: true, jobId: job.id, mode: "bullmq" };
        }
        catch (e) {
            console.warn("BullMQ add failed, executing via fallback:", e);
        }
    }
    if (immediateProcessor) {
        setImmediate(async () => {
            try {
                await immediateProcessor(jobData);
            }
            catch (err) {
                console.error("Async turn processing error:", err);
            }
        });
    }
    return { success: true, jobId: `in-memory-${Date.now()}`, mode: "in-memory" };
}
