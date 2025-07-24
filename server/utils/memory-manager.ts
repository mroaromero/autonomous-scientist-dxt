interface MemoryConfig {
  maxUsage: number;        // Maximum memory usage in bytes (8GB for i3-12100F)
  chunkSize: number;       // Processing chunk size in bytes (2GB)
  cacheSize: number;       // Cache size in bytes (2GB)
  gcThreshold: number;     // GC threshold as percentage (80%)
}

interface ProcessingTask {
  id: string;
  type: 'pdf' | 'ocr' | 'analysis' | 'latex';
  size: number;
  priority: 'low' | 'medium' | 'high';
  startTime: number;
  timeout: number;
}

export class MemoryManager {
  private config: MemoryConfig;
  private currentUsage: number = 0;
  private activeTasks: Map<string, ProcessingTask> = new Map();
  private processingQueue: ProcessingTask[] = [];
  private gcInterval: NodeJS.Timeout;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxUsage: config.maxUsage || 8 * 1024 * 1024 * 1024, // 8GB
      chunkSize: config.chunkSize || 2 * 1024 * 1024 * 1024, // 2GB
      cacheSize: config.cacheSize || 2 * 1024 * 1024 * 1024, // 2GB
      gcThreshold: config.gcThreshold || 80
    };

    // Start aggressive garbage collection monitoring
    this.gcInterval = setInterval(() => {
      this.performMemoryCleanup();
    }, 30000); // Every 30 seconds

    // Monitor memory usage
    this.startMemoryMonitoring();
  }

  async allocateMemory(task: Omit<ProcessingTask, 'startTime'>): Promise<string> {
    const taskWithTime: ProcessingTask = {
      ...task,
      startTime: Date.now()
    };

    // Check if we can allocate memory immediately
    if (this.canAllocate(task.size)) {
      this.currentUsage += task.size;
      this.activeTasks.set(task.id, taskWithTime);
      console.error(`✅ Memory allocated for task ${task.id}: ${this.formatBytes(task.size)}`);
      return task.id;
    }

    // Queue the task if memory is not available
    this.processingQueue.push(taskWithTime);
    console.error(`⏳ Task ${task.id} queued (current usage: ${this.getUsagePercentage()}%)`);
    
    // Wait for memory to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.canAllocate(task.size)) {
          clearInterval(checkInterval);
          
          // Remove from queue
          const index = this.processingQueue.findIndex(t => t.id === task.id);
          if (index !== -1) {
            this.processingQueue.splice(index, 1);
          }
          
          this.currentUsage += task.size;
          this.activeTasks.set(task.id, taskWithTime);
          console.error(`✅ Memory allocated for queued task ${task.id}`);
          resolve(task.id);
        }
      }, 1000);
    });
  }

  releaseMemory(taskId: string): void {
    const task = this.activeTasks.get(taskId);
    if (task) {
      this.currentUsage -= task.size;
      this.activeTasks.delete(taskId);
      console.error(`🔄 Memory released for task ${taskId}: ${this.formatBytes(task.size)}`);
      
      // Trigger garbage collection if usage was high
      if (this.getUsagePercentage() > this.config.gcThreshold) {
        this.forceGarbageCollection();
      }
    }
  }

  private canAllocate(size: number): boolean {
    const wouldUse = this.currentUsage + size;
    const maxAllowed = this.config.maxUsage * 0.9; // Leave 10% buffer
    return wouldUse <= maxAllowed;
  }

  private getUsagePercentage(): number {
    return (this.currentUsage / this.config.maxUsage) * 100;
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private performMemoryCleanup(): void {
    const usagePercent = this.getUsagePercentage();
    
    if (usagePercent > this.config.gcThreshold) {
      console.error(`🧹 High memory usage detected (${usagePercent.toFixed(1)}%), performing cleanup`);
      
      // Clean up expired tasks
      const now = Date.now();
      for (const [id, task] of this.activeTasks.entries()) {
        if (now - task.startTime > task.timeout) {
          console.error(`⏰ Task ${id} timed out, releasing memory`);
          this.releaseMemory(id);
        }
      }
      
      // Force garbage collection
      this.forceGarbageCollection();
    }
  }

  private forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      console.error(`🗑️ Garbage collection triggered`);
    } else {
      console.error(`⚠️ Garbage collection not available (run with --expose-gc)`);
    }
  }

  private startMemoryMonitoring(): void {
    setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
      const externalMB = Math.round(usage.external / 1024 / 1024);
      
      console.error(`📊 Memory Status - Heap: ${heapUsedMB}/${heapTotalMB}MB, External: ${externalMB}MB, Tasks: ${this.activeTasks.size}, Queue: ${this.processingQueue.length}`);
      
      // Alert on high memory usage
      if (heapUsedMB > 6000) { // Alert at 6GB heap usage
        console.error(`⚠️ HIGH MEMORY USAGE ALERT: ${heapUsedMB}MB heap used`);
        this.performMemoryCleanup();
      }
    }, 60000); // Every minute
  }

  // Chunk processing for large files
  async processInChunks<T>(
    data: Buffer, 
    processor: (chunk: Buffer, index: number) => Promise<T>,
    taskId: string
  ): Promise<T[]> {
    const chunks: Buffer[] = [];
    const chunkSize = Math.min(this.config.chunkSize, data.length);
    
    // Split data into chunks
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    
    console.error(`📦 Processing ${chunks.length} chunks for task ${taskId}`);
    
    const results: T[] = [];
    
    // Process chunks sequentially to manage memory
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const result = await processor(chunk, i);
        results.push(result);
        
        // Force cleanup between chunks if memory usage is high
        if (this.getUsagePercentage() > 70) {
          this.forceGarbageCollection();
          // Small delay to allow GC to complete
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`❌ Error processing chunk ${i} for task ${taskId}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  // Get optimal concurrency based on current memory usage
  getOptimalConcurrency(): number {
    const usagePercent = this.getUsagePercentage();
    
    if (usagePercent < 50) {
      return 3; // Maximum concurrency for i3-12100F (4 cores)
    } else if (usagePercent < 75) {
      return 2; // Moderate concurrency
    } else {
      return 1; // Single task only
    }
  }

  // Check if system can handle a specific operation
  canHandleOperation(estimatedMemoryMB: number): boolean {
    const estimatedBytes = estimatedMemoryMB * 1024 * 1024;
    return this.canAllocate(estimatedBytes);
  }

  // Get memory statistics
  getMemoryStats(): {
    currentUsage: string;
    usagePercentage: number;
    activeTasks: number;
    queuedTasks: number;
    chunkSize: string;
    maxUsage: string;
  } {
    return {
      currentUsage: this.formatBytes(this.currentUsage),
      usagePercentage: this.getUsagePercentage(),
      activeTasks: this.activeTasks.size,
      queuedTasks: this.processingQueue.length,
      chunkSize: this.formatBytes(this.config.chunkSize),
      maxUsage: this.formatBytes(this.config.maxUsage)
    };
  }

  // Clean shutdown
  shutdown(): void {
    clearInterval(this.gcInterval);
    
    // Release all active tasks
    for (const taskId of this.activeTasks.keys()) {
      this.releaseMemory(taskId);
    }
    
    // Clear queue
    this.processingQueue = [];
    
    console.error('🔌 Memory Manager shut down');
  }
}