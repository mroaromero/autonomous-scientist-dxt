interface ErrorContext {
  tool: string;
  args: any;
  timestamp: Date;
  memoryUsage?: any;
  systemInfo?: any;
}

interface FormattedError {
  message: string;
  type: string;
  code?: string;
  suggestions: string[];
  context: ErrorContext;
}

export class ErrorHandler {
  private errorLog: FormattedError[] = [];
  private maxLogSize = 100;

  formatError(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  handleToolError(error: any, toolName: string, args: any): any {
    const formattedError = this.createFormattedError(error, toolName, args);
    this.logError(formattedError);
    
    return {
      content: [{
        type: 'text',
        text: this.generateUserFriendlyErrorMessage(formattedError)
      }]
    };
  }

  private createFormattedError(error: any, toolName: string, args: any): FormattedError {
    const errorType = error.constructor.name || 'UnknownError';
    const message = this.formatError(error);
    
    return {
      message,
      type: errorType,
      code: error.code,
      suggestions: this.generateSuggestions(error, toolName),
      context: {
        tool: toolName,
        args: this.sanitizeArgs(args),
        timestamp: new Date(),
        memoryUsage: process.memoryUsage(),
        systemInfo: {
          platform: process.platform,
          nodeVersion: process.version,
          uptime: process.uptime()
        }
      }
    };
  }

  private generateSuggestions(error: any, toolName: string): string[] {
    const suggestions: string[] = [];
    const message = error.message?.toLowerCase() || '';
    
    // Memory-related errors
    if (message.includes('memory') || message.includes('heap')) {
      suggestions.push('Close other applications to free up memory');
      suggestions.push('Try processing smaller files or reduce batch size');
      suggestions.push('Restart Claude Desktop to clear memory');
    }
    
    // File-related errors
    if (message.includes('file not found') || message.includes('enoent')) {
      suggestions.push('Check that the file path is correct and the file exists');
      suggestions.push('Ensure you have read permissions for the file');
      suggestions.push('Try using absolute file paths instead of relative paths');
    }
    
    // Network-related errors
    if (message.includes('network') || message.includes('timeout') || message.includes('enotfound')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Verify API endpoints are accessible');
      suggestions.push('Try again in a few moments (service may be temporarily unavailable)');
    }
    
    // API-related errors
    if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
      suggestions.push('Verify your API key is correct and active');
      suggestions.push('Check if your API quota has been exceeded');
      suggestions.push('Try reconfiguring the API using the setup tool');
    }
    
    // PDF processing errors
    if (toolName.includes('pdf') && message.includes('parsing')) {
      suggestions.push('Try a different PDF file to test if the issue is file-specific');
      suggestions.push('Ensure the PDF is not corrupted or password-protected');
      suggestions.push('Try processing with OCR disabled first');
    }
    
    // OCR-related errors
    if (toolName.includes('ocr') || message.includes('tesseract')) {
      suggestions.push('Ensure the image quality is sufficient for OCR');
      suggestions.push('Try a different language setting if text detection fails');
      suggestions.push('Consider preprocessing the image to improve contrast');
    }
    
    // LaTeX errors
    if (toolName.includes('latex') || message.includes('latex')) {
      suggestions.push('Check LaTeX syntax for any formatting errors');
      suggestions.push('Ensure all required packages are available');
      suggestions.push('Try generating a simpler document first');
    }
    
    // Generic suggestions if no specific ones found
    if (suggestions.length === 0) {
      suggestions.push('Try the operation again');
      suggestions.push('Check the input parameters for any typos');
      suggestions.push('Restart Claude Desktop if the issue persists');
    }
    
    return suggestions;
  }

  private generateUserFriendlyErrorMessage(error: FormattedError): string {
    const { message, type, suggestions, context } = error;
    
    return `❌ **${context.tool.toUpperCase()} Error**\n\n` +
           `**Problem:** ${message}\n` +
           `**Error Type:** ${type}\n` +
           `**Time:** ${context.timestamp.toLocaleString()}\n\n` +
           `**Suggestions:**\n${suggestions.map(s => `• ${s}`).join('\n')}\n\n` +
           `**Need Help?**\n` +
           `• Try a simpler version of your request first\n` +
           `• Check the system requirements and available resources\n` +
           `• Report persistent issues with the details above`;
  }

  private sanitizeArgs(args: any): any {
    if (!args) return args;
    
    // Remove potentially sensitive information
    const sanitized = { ...args };
    
    // Remove API keys and tokens
    const sensitiveKeys = ['key', 'token', 'password', 'secret', 'auth'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '***MASKED***';
      }
    }
    
    // Truncate long file paths
    if (sanitized.file_path && sanitized.file_path.length > 100) {
      sanitized.file_path = '...' + sanitized.file_path.slice(-97);
    }
    
    return sanitized;
  }

  private logError(error: FormattedError): void {
    this.errorLog.unshift(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
    
    // Log to console for debugging
    console.error(`🚨 Error in ${error.context.tool}:`, error.message);
  }

  // Get recent errors for debugging
  getRecentErrors(count: number = 10): FormattedError[] {
    return this.errorLog.slice(0, count);
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    errorsByTool: Record<string, number>;
    errorsByType: Record<string, number>;
    recentErrorRate: number;
  } {
    const stats = {
      totalErrors: this.errorLog.length,
      errorsByTool: {} as Record<string, number>,
      errorsByType: {} as Record<string, number>,
      recentErrorRate: 0
    };
    
    // Count errors by tool and type
    for (const error of this.errorLog) {
      const tool = error.context.tool;
      const type = error.type;
      
      stats.errorsByTool[tool] = (stats.errorsByTool[tool] || 0) + 1;
      stats.errorsByType[type] = (stats.errorsByType[type] || 0) + 1;
    }
    
    // Calculate recent error rate (errors in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = this.errorLog.filter(e => e.context.timestamp > oneHourAgo);
    stats.recentErrorRate = recentErrors.length;
    
    return stats;
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = [];
    console.error('🗑️ Error log cleared');
  }

  // Check if system is experiencing high error rates
  isSystemUnstable(): boolean {
    const stats = this.getErrorStats();
    return stats.recentErrorRate > 5; // More than 5 errors in the last hour
  }

  // Get system health status
  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    recommendations: string[];
  } {
    const stats = this.getErrorStats();
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (stats.recentErrorRate > 10 || memUsageMB > 7000) {
      return {
        status: 'critical',
        message: `System experiencing high error rate (${stats.recentErrorRate} errors/hour) or memory usage (${memUsageMB}MB)`,
        recommendations: [
          'Restart Claude Desktop immediately',
          'Close other applications to free memory',
          'Process smaller files or reduce batch sizes',
          'Check for system updates'
        ]
      };
    }
    
    if (stats.recentErrorRate > 3 || memUsageMB > 5000) {
      return {
        status: 'warning',
        message: `Moderate system stress detected (${stats.recentErrorRate} errors/hour, ${memUsageMB}MB memory)`,
        recommendations: [
          'Consider restarting Claude Desktop',
          'Reduce concurrent operations',
          'Monitor memory usage',
          'Clear cache if available'
        ]
      };
    }
    
    return {
      status: 'healthy',
      message: `System running normally (${stats.recentErrorRate} errors/hour, ${memUsageMB}MB memory)`,
      recommendations: []
    };
  }
}