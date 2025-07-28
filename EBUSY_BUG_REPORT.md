# 🐛 Bug Report: claude-flow EBUSY Error

## Summary
**Issue**: `EBUSY: resource busy or locked` error when using claude-flow via npx, causing automated hooks to fail with non-zero exit codes.

**Priority**: High  
**Component**: Database connection management (better-sqlite3)  
**Environment**: Windows (primarily), cross-platform issue  
**Version**: claude-flow@2.0.0-alpha.73

## Problem Description

When claude-flow is executed via npx (especially in automated workflows like Git hooks or CI/CD), the process terminates with an EBUSY error during npm's cleanup phase. This prevents the process from exiting with code 0, breaking automation workflows.

## Error Output
```bash
npm warn cleanup Failed to remove some directories [
  [Error: EBUSY: resource busy or locked, rmdir 'C:\...\better-sqlite3'] {
    errno: -4082,
    code: 'EBUSY',
    syscall: 'rmdir',
    path: 'C:\\...\\node_modules\\claude-flow\\node_modules\\ruv-swarm\\node_modules\\better-sqlite3'
  }
]
```

## Root Cause Analysis

1. **Database Connection**: claude-flow uses better-sqlite3 for state persistence
2. **Singleton Pattern**: Database connection in `src/state/db.ts` is never explicitly closed
3. **NPX Lifecycle**: NPX installs → executes → attempts to clean up temporary directory
4. **Race Condition**: OS maintains file handle on SQLite database while NPX tries to remove directory

## Technical Impact

- ❌ Automated hooks fail (exit code 1 instead of 0)
- ❌ CI/CD pipelines break
- ❌ File system pollution (orphaned temp directories)
- ❌ Poor resource management practices

## Proposed Solution

Implement graceful shutdown pattern with explicit database connection cleanup:

### 1. Modify `src/state/db.ts`
```typescript
import Database from 'better-sqlite3';

let db: Database.Database | undefined;

export function getDb() {
  if (!db) {
    db = new Database(':memory:'); // or path to file
  }
  return db;
}

// ✅ NEW: Explicit cleanup function
export function closeDb() {
  if (db && db.open) {
    db.close();
    db = undefined;
  }
}
```

### 2. Modify `src/cli.ts`
```typescript
#!/usr/bin/env node
import { closeDb } from './state/db';

// ✅ NEW: Graceful shutdown handler
function setupGracefulShutdown() {
  const cleanup = () => {
    closeDb();
  };
  
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    cleanup();
    process.exit(1);
  });
}

async function main() {
  try {
    await initConfig();
    await state.init();
    
    // ✅ CRITICAL: Setup graceful shutdown
    setupGracefulShutdown();
    
    // ... rest of the application
  } catch (error) {
    closeDb(); // ✅ Cleanup on error
    throw error;
  }
}
```

## Validation Strategy

### Before Fix
```bash
$ npx claude-flow@alpha hooks session-end
✅ Command executes successfully
❌ Exit code: 1
⚠️  npm warn cleanup Failed to remove directories
```

### After Fix
```bash
$ npx claude-flow@alpha hooks session-end  
✅ Command executes successfully
✅ Exit code: 0
✅ No cleanup warnings
```

## Benefits

1. **Eliminates EBUSY errors completely**
2. **Enables reliable automation workflows**
3. **Proper resource management**
4. **Cleaner file system (no orphaned directories)**
5. **Better user experience**

## Testing Checklist

- [ ] Test on Windows (primary issue environment)
- [ ] Test on Linux/macOS (cross-platform validation)
- [ ] Test in CI/CD pipelines
- [ ] Test with Git hooks
- [ ] Test memory usage (ensure no leaks)
- [ ] Test concurrent executions

## Additional Recommendations

1. **Add logging** for database operations (open/close)
2. **Monitor** exit codes in production
3. **Document** graceful shutdown pattern for contributors
4. **Consider** connection pooling for future versions

## Reporter Information

- **Environment**: Windows 11, Node.js v24.4.0
- **Use Case**: Autonomous Scientist project with claude-flow integration
- **Workaround**: Currently using timeouts and retry logic
- **Impact**: Critical for automated research workflows

---

**Note**: This issue affects all users running claude-flow via npx in automated environments. The proposed solution follows Node.js best practices for graceful shutdown and resource cleanup.