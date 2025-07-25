#!/usr/bin/env node

/**
 * Autonomous Scientist Desktop Extension - System Validator & Diagnostic Tool
 * Comprehensive validation of installation, APIs, MCPs, and system health
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto-js');
const axios = require('axios');
const { execSync } = require('child_process');

class SystemValidator {
    constructor() {
        this.homeDir = os.homedir();
        this.configDir = path.join(this.homeDir, '.autonomous-scientist');
        this.extensionDir = path.dirname(__dirname);
        
        this.results = {
            overall_status: 'unknown',
            timestamp: new Date().toISOString(),
            checks: {
                system: {},
                installation: {},
                apis: {},
                mcps: {},
                dependencies: {}
            },
            recommendations: [],
            errors: []
        };
        
        this.apis = {
            semantic_scholar: {
                name: 'Semantic Scholar',
                url: 'https://api.semanticscholar.org/graph/v1/paper/search?query=test&limit=1',
                free: true,
                timeout: 10000
            },
            arxiv: {
                name: 'ArXiv',
                url: 'http://export.arxiv.org/api/query?search_query=test&max_results=1',
                free: true,
                timeout: 15000
            },
            crossref: {
                name: 'CrossRef',
                url: 'https://api.crossref.org/works?query=test&rows=1',
                free: true,
                timeout: 10000
            }
        };
    }

    async validate() {
        console.log('🔍 Sistema de Validación - Autonomous Scientist v6.0\n');
        console.log('Ejecutando diagnóstico completo del sistema...\n');
        
        try {
            await this.checkSystemRequirements();
            await this.checkInstallation();
            await this.checkDependencies();
            await this.checkAPIs();
            await this.checkMCPs();
            await this.checkPerformance();
            
            this.calculateOverallStatus();
            await this.generateReport();
            await this.showSummary();
            
        } catch (error) {
            console.error('❌ Error durante la validación:', error.message);
            this.results.errors.push(error.message);
            this.results.overall_status = 'error';
        }
    }

    async checkSystemRequirements() {
        console.log('💻 Verificando requisitos del sistema...\n');
        
        // Verificar Node.js
        const nodeVersion = process.version;
        const nodeVersionNum = parseInt(nodeVersion.substring(1).split('.')[0]);
        
        if (nodeVersionNum >= 18) {
            console.log(`  ✅ Node.js: ${nodeVersion} (✓ >= 18.0.0)`);
            this.results.checks.system.nodejs = { status: 'ok', version: nodeVersion };
        } else {
            console.log(`  ❌ Node.js: ${nodeVersion} (✗ Requiere >= 18.0.0)`);
            this.results.checks.system.nodejs = { status: 'error', version: nodeVersion };
            this.results.recommendations.push('Actualice Node.js a la versión 18 o superior');
        }
        
        // Verificar memoria
        const totalMemory = Math.round(os.totalmem() / (1024 * 1024 * 1024));
        if (totalMemory >= 16) {
            console.log(`  ✅ Memoria RAM: ${totalMemory}GB (✓ >= 16GB)`);
            this.results.checks.system.memory = { status: 'ok', total_gb: totalMemory };
        } else {
            console.log(`  ⚠️  Memoria RAM: ${totalMemory}GB (⚠ Recomendado >= 16GB)`);
            this.results.checks.system.memory = { status: 'warning', total_gb: totalMemory };
            this.results.recommendations.push('Se recomienda 16GB RAM para óptimo rendimiento');
        }
        
        // Verificar CPU
        const cpus = os.cpus();
        const cpuCount = cpus.length;
        const cpuModel = cpus[0].model;
        
        console.log(`  ℹ️  CPU: ${cpuModel} (${cpuCount} cores)`);
        this.results.checks.system.cpu = { 
            status: cpuCount >= 4 ? 'ok' : 'warning', 
            model: cpuModel, 
            cores: cpuCount 
        };
        
        if (cpuCount < 4) {
            this.results.recommendations.push('Se recomienda CPU de 4+ cores para procesamiento OCR');
        }
        
        // Verificar espacio en disco
        try {
            const workspaceDir = path.join(this.homeDir, 'Documents', 'Research');
            await fs.ensureDir(workspaceDir);
            
            const stats = await fs.stat(workspaceDir);
            console.log(`  ✅ Espacio en disco: Accesible`);
            this.results.checks.system.disk = { status: 'ok', workspace_accessible: true };
        } catch (error) {
            console.log(`  ❌ Espacio en disco: Error accediendo workspace`);
            this.results.checks.system.disk = { status: 'error', workspace_accessible: false };
        }
        
        // Verificar plataforma
        const platform = process.platform;
        const supportedPlatforms = ['win32', 'darwin', 'linux'];
        
        if (supportedPlatforms.includes(platform)) {
            console.log(`  ✅ Plataforma: ${platform} (soportada)`);
            this.results.checks.system.platform = { status: 'ok', name: platform };
        } else {
            console.log(`  ❌ Plataforma: ${platform} (no soportada)`);
            this.results.checks.system.platform = { status: 'error', name: platform };
        }
    }

    async checkInstallation() {
        console.log('\n📦 Verificando instalación...\n');
        
        // Verificar estructura de directorios
        const requiredDirs = [
            this.configDir,
            path.join(this.configDir, 'cache'),
            path.join(this.homeDir, 'Documents', 'Research'),
            path.join(this.extensionDir, 'server'),
            path.join(this.extensionDir, 'src')
        ];
        
        let dirsOk = 0;
        for (const dir of requiredDirs) {
            if (await fs.pathExists(dir)) {
                console.log(`  ✅ ${path.basename(dir)}: Directorio existe`);
                dirsOk++;
            } else {
                console.log(`  ❌ ${path.basename(dir)}: Directorio faltante`);
                this.results.recommendations.push(`Crear directorio: ${dir}`);
            }
        }
        
        this.results.checks.installation.directories = {
            status: dirsOk === requiredDirs.length ? 'ok' : 'error',
            found: dirsOk,
            required: requiredDirs.length
        };
        
        // Verificar archivos principales
        const requiredFiles = [
            path.join(this.extensionDir, 'manifest.json'),
            path.join(this.extensionDir, 'package.json'),
            path.join(this.extensionDir, 'server', 'index.js')
        ];
        
        let filesOk = 0;
        for (const file of requiredFiles) {
            if (await fs.pathExists(file)) {
                console.log(`  ✅ ${path.basename(file)}: Archivo existe`);
                filesOk++;
            } else {
                console.log(`  ❌ ${path.basename(file)}: Archivo faltante`);
            }
        }
        
        this.results.checks.installation.files = {
            status: filesOk === requiredFiles.length ? 'ok' : 'error',
            found: filesOk,
            required: requiredFiles.length
        };
        
        // Verificar configuración
        const configFile = path.join(this.configDir, 'config.json');
        if (await fs.pathExists(configFile)) {
            try {
                const config = await fs.readJson(configFile);
                console.log(`  ✅ Configuración: Válida (v${config.version || 'unknown'})`);
                this.results.checks.installation.config = { status: 'ok', version: config.version };
            } catch (error) {
                console.log(`  ❌ Configuración: Archivo corrupto`);
                this.results.checks.installation.config = { status: 'error', error: error.message };
            }
        } else {
            console.log(`  ⚠️  Configuración: No encontrada (usando defaults)`);
            this.results.checks.installation.config = { status: 'warning', using_defaults: true };
            this.results.recommendations.push('Ejecutar: node scripts/auto-install.js');
        }
    }

    async checkDependencies() {
        console.log('\n📚 Verificando dependencias...\n');
        
        const criticalDeps = [
            '@modelcontextprotocol/sdk',
            'tesseract.js',
            'pdf-parse',
            'axios',
            'fs-extra',
            'crypto-js',
            'node-cache'
        ];
        
        const optionalDeps = [
            'sharp',
            'jimp'
        ];
        
        let criticalOk = 0;
        let optionalOk = 0;
        
        // Verificar dependencias críticas
        for (const dep of criticalDeps) {
            try {
                require.resolve(dep);
                console.log(`  ✅ ${dep}: Disponible`);
                criticalOk++;
            } catch (error) {
                console.log(`  ❌ ${dep}: No encontrada`);
                this.results.recommendations.push(`Instalar dependencia: npm install ${dep}`);
            }
        }
        
        // Verificar dependencias opcionales
        for (const dep of optionalDeps) {
            try {
                require.resolve(dep);
                console.log(`  ✅ ${dep}: Disponible (opcional)`);
                optionalOk++;
            } catch (error) {
                console.log(`  ⚠️  ${dep}: No encontrada (opcional)`);
            }
        }
        
        this.results.checks.dependencies = {
            critical: {
                status: criticalOk === criticalDeps.length ? 'ok' : 'error',
                found: criticalOk,
                required: criticalDeps.length
            },
            optional: {
                status: 'info',
                found: optionalOk,
                total: optionalDeps.length
            }
        };
        
        if (criticalOk < criticalDeps.length) {
            this.results.recommendations.push('Ejecutar: npm install para instalar dependencias faltantes');
        }
    }

    async checkAPIs() {
        console.log('\n🌐 Verificando conectividad de APIs...\n');
        
        this.results.checks.apis = {};
        
        for (const [key, api] of Object.entries(this.apis)) {
            console.log(`Probando ${api.name}...`);
            
            try {
                const response = await axios.get(api.url, {
                    timeout: api.timeout,
                    headers: {
                        'User-Agent': 'Autonomous-Scientist-Extension/6.0'
                    }
                });
                
                if (response.status === 200) {
                    console.log(`  ✅ ${api.name}: Conectividad OK`);
                    this.results.checks.apis[key] = { 
                        status: 'ok', 
                        response_time: api.timeout,
                        free: api.free 
                    };
                } else {
                    console.log(`  ⚠️  ${api.name}: Respuesta inesperada (${response.status})`);
                    this.results.checks.apis[key] = { 
                        status: 'warning', 
                        http_status: response.status 
                    };
                }
                
            } catch (error) {
                if (error.code === 'ENOTFOUND') {
                    console.log(`  ❌ ${api.name}: Sin conexión a internet`);
                    this.results.checks.apis[key] = { status: 'error', error: 'no_internet' };
                } else if (error.code === 'ECONNABORTED') {
                    console.log(`  ⚠️  ${api.name}: Timeout (red lenta)`);
                    this.results.checks.apis[key] = { status: 'warning', error: 'timeout' };
                } else {
                    console.log(`  ❌ ${api.name}: Error - ${error.message}`);
                    this.results.checks.apis[key] = { status: 'error', error: error.message };
                }
            }
        }
        
        // Verificar APIs configuradas con claves
        const encryptedKeysFile = path.join(this.configDir, 'encrypted-keys.json');
        if (await fs.pathExists(encryptedKeysFile)) {
            try {
                const encryptedKeys = await fs.readJson(encryptedKeysFile);
                const configuredCount = Object.keys(encryptedKeys).length;
                console.log(`\n  📊 APIs con claves configuradas: ${configuredCount}`);
                this.results.checks.apis.configured_keys = { count: configuredCount };
            } catch (error) {
                console.log('\n  ⚠️  Error leyendo claves encriptadas');
            }
        } else {
            console.log('\n  ℹ️  Sin APIs con claves configuradas (solo APIs gratuitas)');
            this.results.checks.apis.configured_keys = { count: 0 };
        }
    }

    async checkMCPs() {
        console.log('\n🔧 Verificando MCPs...\n');
        
        // Verificar configuración de Claude Desktop
        const claudeConfigPath = this.getClaudeConfigPath();
        
        if (!(await fs.pathExists(claudeConfigPath))) {
            console.log('  ❌ Configuración de Claude Desktop no encontrada');
            this.results.checks.mcps = { status: 'error', claude_config: false };
            this.results.recommendations.push('Ejecutar: node scripts/mcp-installer.js');
            return;
        }
        
        try {
            const claudeConfig = await fs.readJson(claudeConfigPath);
            const mcpServers = claudeConfig.mcpServers || {};
            const mcpCount = Object.keys(mcpServers).length;
            
            console.log(`  ✅ Claude Desktop: ${mcpCount} MCPs configurados`);
            
            // Verificar MCPs específicos de Autonomous Scientist
            const autonomousScientistMCPs = Object.keys(mcpServers).filter(name => 
                name.startsWith('autonomous-scientist')
            ).length;
            
            if (autonomousScientistMCPs > 0) {
                console.log(`  ✅ Autonomous Scientist MCPs: ${autonomousScientistMCPs} configurados`);
                this.results.checks.mcps = { 
                    status: 'ok', 
                    claude_config: true,
                    total_mcps: mcpCount,
                    autonomous_mcps: autonomousScientistMCPs
                };
            } else {
                console.log('  ⚠️  Sin MCPs de Autonomous Scientist configurados');
                this.results.checks.mcps = { 
                    status: 'warning', 
                    claude_config: true,
                    total_mcps: mcpCount,
                    autonomous_mcps: 0
                };
                this.results.recommendations.push('Ejecutar: node scripts/mcp-installer.js');
            }
            
        } catch (error) {
            console.log(`  ❌ Error leyendo configuración: ${error.message}`);
            this.results.checks.mcps = { status: 'error', error: error.message };
        }
    }

    async checkPerformance() {
        console.log('\n⚡ Verificando rendimiento del sistema...\n');
        
        // Test de velocidad de escritura
        const testFile = path.join(this.configDir, '.speed-test.tmp');
        const testData = 'x'.repeat(1024 * 1024); // 1MB
        
        try {
            const startTime = Date.now();
            await fs.writeFile(testFile, testData);
            const writeTime = Date.now() - startTime;
            
            await fs.unlink(testFile);
            
            console.log(`  ⚡ Velocidad de escritura: ${Math.round(1000/writeTime)}MB/s`);
            
            this.results.checks.system.disk_speed = {
                write_time_ms: writeTime,
                mb_per_second: Math.round(1000/writeTime)
            };
        } catch (error) {
            console.log('  ⚠️  No se pudo medir velocidad de disco');
        }
        
        // Test de memoria disponible
        const freeMemory = Math.round(os.freemem() / (1024 * 1024 * 1024));
        const memoryUsagePercent = Math.round((1 - os.freemem() / os.totalmem()) * 100);
        
        console.log(`  💾 Memoria libre: ${freeMemory}GB (${100-memoryUsagePercent}% libre)`);
        
        this.results.checks.system.memory_usage = {
            free_gb: freeMemory,
            usage_percent: memoryUsagePercent,
            status: memoryUsagePercent > 80 ? 'warning' : 'ok'
        };
        
        if (memoryUsagePercent > 80) {
            this.results.recommendations.push('Alto uso de memoria detectado - considere cerrar aplicaciones');
        }
    }

    getClaudeConfigPath() {
        const platform = process.platform;
        
        switch (platform) {
            case 'win32':
                return path.join(this.homeDir, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
            case 'darwin':
                return path.join(this.homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
            case 'linux':
                return path.join(this.homeDir, '.config', 'claude', 'claude_desktop_config.json');
            default:
                return '';
        }
    }

    calculateOverallStatus() {
        const checks = this.results.checks;
        let errorCount = 0;
        let warningCount = 0;
        let okCount = 0;
        
        // Función recursiva para contar estados
        const countStatuses = (obj) => {
            for (const value of Object.values(obj)) {
                if (typeof value === 'object' && value !== null) {
                    if (value.status) {
                        switch (value.status) {
                            case 'error':
                                errorCount++;
                                break;
                            case 'warning':
                                warningCount++;
                                break;
                            case 'ok':
                                okCount++;
                                break;
                        }
                    } else {
                        countStatuses(value);
                    }
                }
            }
        };
        
        countStatuses(checks);
        
        if (errorCount > 0) {
            this.results.overall_status = 'error';
        } else if (warningCount > 0) {
            this.results.overall_status = 'warning';
        } else {
            this.results.overall_status = 'ok';
        }
        
        this.results.summary = {
            ok: okCount,
            warnings: warningCount,
            errors: errorCount,
            total_checks: okCount + warningCount + errorCount
        };
    }

    async generateReport() {
        const reportFile = path.join(this.configDir, 'system-validation-report.json');
        await fs.writeJson(reportFile, this.results, { spaces: 2 });
        
        // Generar reporte en texto plano también
        const textReport = this.generateTextReport();
        const textReportFile = path.join(this.configDir, 'system-validation-report.txt');
        await fs.writeFile(textReportFile, textReport);
    }

    generateTextReport() {
        const summary = this.results.summary;
        const status = this.results.overall_status;
        
        let report = 'REPORTE DE VALIDACIÓN DEL SISTEMA\n';
        report += 'Autonomous Scientist Desktop Extension v6.0\n';
        report += '='.repeat(50) + '\n\n';
        
        report += `Fecha: ${new Date(this.results.timestamp).toLocaleString()}\n`;
        report += `Estado General: ${status.toUpperCase()}\n`;
        report += `Verificaciones: ${summary.ok} OK, ${summary.warnings} Advertencias, ${summary.errors} Errores\n\n`;
        
        if (this.results.recommendations.length > 0) {
            report += 'RECOMENDACIONES:\n';
            this.results.recommendations.forEach((rec, i) => {
                report += `${i + 1}. ${rec}\n`;
            });
            report += '\n';
        }
        
        if (this.results.errors.length > 0) {
            report += 'ERRORES CRÍTICOS:\n';
            this.results.errors.forEach((error, i) => {
                report += `${i + 1}. ${error}\n`;
            });
            report += '\n';
        }
        
        return report;
    }

    async showSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE VALIDACIÓN');
        console.log('='.repeat(60));
        
        const summary = this.results.summary;
        const status = this.results.overall_status;
        
        let statusIcon, statusMessage;
        switch (status) {
            case 'ok':
                statusIcon = '✅';
                statusMessage = 'SISTEMA LISTO';
                break;
            case 'warning':
                statusIcon = '⚠️';
                statusMessage = 'FUNCIONANDO CON ADVERTENCIAS';
                break;
            case 'error':
                statusIcon = '❌';
                statusMessage = 'REQUIERE ATENCIÓN';
                break;
        }
        
        console.log(`\n${statusIcon} Estado General: ${statusMessage}`);
        console.log(`📈 Verificaciones: ${summary.ok} OK | ${summary.warnings} Advertencias | ${summary.errors} Errores`);
        
        if (this.results.recommendations.length > 0) {
            console.log('\n💡 Principales recomendaciones:');
            this.results.recommendations.slice(0, 3).forEach((rec, i) => {
                console.log(`   ${i + 1}. ${rec}`);
            });
        }
        
        const reportFile = path.join(this.configDir, 'system-validation-report.json');
        console.log(`\n📄 Reporte completo guardado en: ${path.basename(reportFile)}`);
        
        if (status === 'ok') {
            console.log('\n🎉 ¡La extensión está lista para usar!');
        } else if (status === 'warning') {
            console.log('\n🔧 La extensión puede funcionar, pero se recomienda revisar las advertencias.');
        } else {
            console.log('\n🚨 Se requiere solucionar errores antes de usar la extensión.');
        }
        
        console.log('\n' + '='.repeat(60));
    }
}

// Función de utilidad para validación rápida
async function quickValidation() {
    console.log('⚡ Validación Rápida - Autonomous Scientist\n');
    
    const validator = new SystemValidator();
    
    // Solo verificar elementos críticos
    await validator.checkSystemRequirements();
    await validator.checkDependencies();
    
    const criticalErrors = validator.results.errors.length;
    
    if (criticalErrors === 0) {
        console.log('\n✅ Validación rápida: Sin errores críticos detectados');
    } else {
        console.log(`\n❌ Validación rápida: ${criticalErrors} errores críticos encontrados`);
        console.log('Ejecute validación completa para más detalles: node scripts/system-validator.js');
    }
}

// Ejecutar según argumentos
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--quick') || args.includes('-q')) {
        quickValidation().catch(console.error);
    } else {
        const validator = new SystemValidator();
        validator.validate().catch(console.error);
    }
}

module.exports = { SystemValidator, quickValidation };