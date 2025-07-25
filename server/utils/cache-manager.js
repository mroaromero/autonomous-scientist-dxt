const NodeCache = require('node-cache');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class CacheManager {
  constructor() {
    this.currentMemorySize = 0;
    this.currentDiskSize = 0;
    this.hits = 0;
    this.misses = 0;
    // Initialize memory cache with conservative settings for i3-12100F
    this.memoryCache = new NodeCache({
      stdTTL: 3600, // 1 hour default TTL
      checkperiod: 600, // Check every 10 minutes
      useClones: false, // Save memory by not cloning objects
      maxKeys: 1000 // Limit number of keys
    });

    // Set up disk cache directory
    this.diskCachePath = path.join(os.homedir(), '.autonomous-scientist', 'cache');
    this.maxMemorySize = 2 * 1024 * 1024 * 1024; // 2GB
    this.maxDiskSize = 5 * 1024 * 1024 * 1024;   // 5GB

    this.initializeDiskCache();
    this.setupCacheEvents();
    this.startMaintenanceRoutine();
  }

  initializeDiskCache() {
    fs.ensureDirSync(this.diskCachePath);
    
    // Calculate current disk cache size
    this.updateDiskCacheSize();
  }

  setupCacheEvents() {
    // Handle cache deletion events
    this.memoryCache.on('del', (key, value) => {
      if (value && typeof value === 'object' && value.size) {
        this.currentMemorySize -= value.size;
      }
    });

    // Handle cache expiration
    this.memoryCache.on('expired', (key, value) => {
      if (value && typeof value === 'object' && value.size) {
        this.currentMemorySize -= value.size;
      }
      console.error(`🗄️ Cache expired: ${key}`);
    });
  }

  startMaintenanceRoutine() {
    // Run maintenance every 15 minutes
    setInterval(() => {
      this.performMaintenance();
    }, 15 * 60 * 1000);
  }

  // Generate cache key from input data
  generateCacheKey(namespace, data) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return `${namespace}:${hash.digest('hex').substring(0, 16)}`;
  }

  // Store data in memory cache
  async setMemory(namespace, key, data, ttl = 3600) {
    const cacheKey = `${namespace}:${key}`;
    const dataSize = this.estimateSize(data);
    
    // Check if we have enough memory
    if (this.currentMemorySize + dataSize > this.maxMemorySize) {
      await this.evictLeastRecentlyUsed();
    }

    const entry = {
      data,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      size: dataSize,
      ttl
    };

    this.memoryCache.set(cacheKey, entry, ttl);
    this.currentMemorySize += dataSize;
    
    console.error(`💾 Cached in memory: ${cacheKey} (${this.formatBytes(dataSize)})`);
  }

  // Retrieve data from memory cache
  async getMemory(namespace, key) {
    const cacheKey = `${namespace}:${key}`;
    const entry = this.memoryCache.get(cacheKey);
    
    if (entry) {
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.hits++;
      console.error(`🎯 Memory cache hit: ${cacheKey}`);
      return entry.data;
    }
    
    this.misses++;
    return null;
  }

  // Store large data on disk cache
  async setDisk(namespace, key, data, ttl = 86400) {
    const cacheKey = this.generateCacheKey(namespace, { key, data: typeof data });
    const filePath = path.join(this.diskCachePath, `${cacheKey}.json`);
    
    const entry = {
      data,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      ttl,
      namespace,
      key
    };

    try {
      await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
      
      const stats = await fs.stat(filePath);
      this.currentDiskSize += stats.size;
      
      // Check disk cache size limit
      if (this.currentDiskSize > this.maxDiskSize) {
        await this.cleanDiskCache();
      }
      
      console.error(`💿 Cached to disk: ${cacheKey} (${this.formatBytes(stats.size)})`);
    } catch (error) {
      console.error(`❌ Failed to cache to disk: ${cacheKey}`, error);
    }
  }

  // Retrieve data from disk cache
  async getDisk(namespace, key) {
    const cacheKey = this.generateCacheKey(namespace, { key });
    const filePath = path.join(this.diskCachePath, `${cacheKey}.json`);
    
    try {
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        const entry = JSON.parse(content);
        
        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl * 1000) {
          await fs.unlink(filePath);
          return null;
        }
        
        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
        
        this.hits++;
        console.error(`🎯 Disk cache hit: ${cacheKey}`);
        return entry.data;
      }
    } catch (error) {
      console.error(`❌ Failed to read disk cache: ${cacheKey}`, error);
    }
    
    this.misses++;
    return null;
  }

  // Smart cache method - automatically chooses memory or disk based on size
  async set(namespace, key, data, ttl = 3600) {
    const dataSize = this.estimateSize(data);
    const sizeThreshold = 10 * 1024 * 1024; // 10MB threshold
    
    if (dataSize > sizeThreshold) {
      // Large data goes to disk
      await this.setDisk(namespace, key, data, ttl);
    } else {
      // Small data goes to memory
      await this.setMemory(namespace, key, data, ttl);
    }
  }

  // Smart get method - checks memory first, then disk
  async get(namespace, key) {
    // Try memory cache first
    let result = await this.getMemory(namespace, key);
    if (result !== null) {
      return result;
    }
    
    // Try disk cache
    result = await this.getDisk(namespace, key);
    if (result !== null) {
      // Promote frequently accessed disk items to memory
      const diskKey = this.generateCacheKey(namespace, { key });
      const filePath = path.join(this.diskCachePath, `${diskKey}.json`);
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const entry = JSON.parse(content);
        
        if (entry.accessCount > 5) { // Promote after 5 accesses
          const dataSize = this.estimateSize(result);
          if (dataSize < 50 * 1024 * 1024) { // Only if less than 50MB
            await this.setMemory(namespace, key, result, entry.ttl);
            console.error(`📈 Promoted to memory cache: ${key}`);
          }
        }
      } catch (error) {
        // Continue normally if promotion fails
      }
    }
    
    return result;
  }

  // Cache academic paper processing results
  async cachePDFProcessing(filePath, result) {
    const key = `pdf:${path.basename(filePath)}:${await this.getFileHash(filePath)}`;
    await this.set('pdf-processing', key, result, 86400); // 24 hours
  }

  async getCachedPDFProcessing(filePath) {
    const key = `pdf:${path.basename(filePath)}:${await this.getFileHash(filePath)}`;
    return await this.get('pdf-processing', key);
  }

  // Cache OCR results
  async cacheOCRResult(imagePath, language, result) {
    const key = `ocr:${path.basename(imagePath)}:${language}:${await this.getFileHash(imagePath)}`;
    await this.set('ocr-results', key, result, 604800); // 7 days
  }

  async getCachedOCRResult(imagePath, language) {
    const key = `ocr:${path.basename(imagePath)}:${language}:${await this.getFileHash(imagePath)}`;
    return await this.get('ocr-results', key);
  }

  // Cache API search results  
  async cacheSearchResults(query, source, results) {
    const key = `search:${source}:${crypto.createHash('md5').update(query).digest('hex')}`;
    await this.set('search-results', key, results, 3600); // 1 hour
  }

  async getCachedSearchResults(query, source) {
    const key = `search:${source}:${crypto.createHash('md5').update(query).digest('hex')}`;
    return await this.get('search-results', key);
  }

  // Cache LaTeX compilation results
  async cacheLaTeXCompilation(source, result) {
    const key = `latex:${crypto.createHash('md5').update(source).digest('hex')}`;
    await this.setMemory('latex-compilation', key, result, 7200); // 2 hours
  }

  async getCachedLaTeXCompilation(source) {
    const key = `latex:${crypto.createHash('md5').update(source).digest('hex')}`;
    return await this.getMemory('latex-compilation', key);
  }

  async getFileHash(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return crypto.createHash('md5')
        .update(`${filePath}:${stats.size}:${stats.mtime.getTime()}`)
        .digest('hex');
    } catch (error) {
      return crypto.createHash('md5').update(filePath).digest('hex');
    }
  }

  estimateSize(data) {
    if (Buffer.isBuffer(data)) {
      return data.length;
    }
    
    const jsonString = JSON.stringify(data);
    return Buffer.byteLength(jsonString, 'utf8');
  }

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  async evictLeastRecentlyUsed() {
    const keys = this.memoryCache.keys();
    const entries = [];
    
    for (const key of keys) {
      const entry = this.memoryCache.get(key);
      if (entry) {
        entries.push({ key, entry });
      }
    }
    
    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);
    
    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.del(entries[i].key);
      console.error(`🗑️ Evicted from memory cache: ${entries[i].key}`);
    }
  }

  async updateDiskCacheSize() {
    try {
      const files = await fs.readdir(this.diskCachePath);
      this.currentDiskSize = 0;
      
      for (const file of files) {
        const filePath = path.join(this.diskCachePath, file);
        const stats = await fs.stat(filePath);
        this.currentDiskSize += stats.size;
      }
    } catch (error) {
      console.error('❌ Failed to calculate disk cache size:', error);
    }
  }

  async cleanDiskCache() {
    try {
      const files = await fs.readdir(this.diskCachePath);
      const fileStats = [];
      
      for (const file of files) {
        const filePath = path.join(this.diskCachePath, file);
        const stats = await fs.stat(filePath);
        
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const entry = JSON.parse(content);
          fileStats.push({ file, stats, entry });
        } catch {
          // Invalid cache file, mark for deletion
          fileStats.push({ file, stats });
        }
      }
      
      // Sort by last accessed (oldest first), then by access count (least accessed first)
      fileStats.sort((a, b) => {
        if (!a.entry) return -1; // Delete invalid files first
        if (!b.entry) return 1;
        
        const accessDiff = a.entry.lastAccessed - b.entry.lastAccessed;
        if (accessDiff !== 0) return accessDiff;
        
        return a.entry.accessCount - b.entry.accessCount;
      });
      
      // Remove files until we're under the limit
      let removedSize = 0;
      const targetSize = this.maxDiskSize * 0.8; // Clean to 80% of max size
      
      for (const { file, stats } of fileStats) {
        if (this.currentDiskSize - removedSize <= targetSize) {
          break;
        }
        
        const filePath = path.join(this.diskCachePath, file);
        await fs.unlink(filePath);
        removedSize += stats.size;
        console.error(`🗑️ Removed disk cache file: ${file}`);
      }
      
      this.currentDiskSize -= removedSize;
    } catch (error) {
      console.error('❌ Failed to clean disk cache:', error);
    }
  }

  async performMaintenance() {
    console.error('🧹 Performing cache maintenance...');
    
    // Update disk cache size
    await this.updateDiskCacheSize();
    
    // Clean expired entries from disk
    try {
      const files = await fs.readdir(this.diskCachePath);
      let cleanedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.diskCachePath, file);
        
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const entry = JSON.parse(content);
          
          if (Date.now() - entry.timestamp > entry.ttl * 1000) {
            const stats = await fs.stat(filePath);
            await fs.unlink(filePath);
            this.currentDiskSize -= stats.size;
            cleanedCount++;
          }
        } catch {
          // Remove corrupted files
          const stats = await fs.stat(filePath);
          await fs.unlink(filePath);
          this.currentDiskSize -= stats.size;
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.error(`🗑️ Cleaned ${cleanedCount} expired cache files`);
      }
    } catch (error) {
      console.error('❌ Maintenance error:', error);
    }
  }

  // Get cache statistics
  getStats() {
    const memoryKeys = this.memoryCache.keys();
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
    
    let oldestEntry = Date.now();
    let mostAccessedKey = '';
    let maxAccessCount = 0;
    
    for (const key of memoryKeys) {
      const entry = this.memoryCache.get(key);
      if (entry) {
        if (entry.timestamp < oldestEntry) {
          oldestEntry = entry.timestamp;
        }
        if (entry.accessCount > maxAccessCount) {
          maxAccessCount = entry.accessCount;
          mostAccessedKey = key;
        }
      }
    }
    
    return {
      entries: memoryKeys.length,
      totalSize: this.currentMemorySize + this.currentDiskSize,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: this.formatBytes(this.currentMemorySize),
      oldestEntry: oldestEntry,
      mostAccessed: mostAccessedKey
    };
  }

  // Clear all caches
  async clearAll() {
    this.memoryCache.flushAll();
    this.currentMemorySize = 0;
    
    try {
      await fs.emptyDir(this.diskCachePath);
      this.currentDiskSize = 0;
      console.error('🗑️ All caches cleared');
    } catch (error) {
      console.error('❌ Failed to clear disk cache:', error);
    }
  }

  // Shutdown cleanup
  shutdown() {
    this.memoryCache.close();
    console.error('🔌 Cache Manager shut down');
  }
}

module.exports = {
  CacheManager
};