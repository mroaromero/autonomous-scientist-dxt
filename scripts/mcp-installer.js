#!/usr/bin/env node

/**
 * Autonomous Scientist Desktop Extension - MCP Server Installer
 * Installs and configures required MCP servers for the extension
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

class MCPInstaller {
    constructor() {
        this.homeDir = os.homedir();
        this.configDir = path.join(this.homeDir, '.autonomous-scientist');
        this.mcpDir = path.join(this.configDir, 'mcp-servers');
        this.extensionDir = path.dirname(__dirname);
        
        // MCPs requeridos y opcionales
        this.requiredMCPs = {
            'filesystem': {
                name: 'File System MCP',
                package: '@modelcontextprotocol/server-filesystem',
                version: 'latest',
                description: 'Acceso seguro al sistema de archivos',
                config: {
                    command: 'npx',
                    args: ['-y', '@modelcontextprotocol/server-filesystem', this.configDir],
                    env: {
                        NODE_ENV: 'production'
                    }
                },
                required: true
            },
            'web-search': {
                name: 'Web Search MCP',
                package: '@modelcontextprotocol/server-brave-search',
                version: 'latest',
                description: 'Búsqueda web para investigación complementaria',
                config: {
                    command: 'npx',
                    args: ['-y', '@modelcontextprotocol/server-brave-search'],
                    env: {
                        BRAVE_API_KEY: '${BRAVE_API_KEY}'
                    }
                },
                required: false,
                api_key_required: true
            },
            'memory': {
                name: 'Memory MCP',
                package: '@modelcontextprotocol/server-memory',
                version: 'latest',
                description: 'Sistema de memoria persistente para contexto de investigación',
                config: {
                    command: 'npx',
                    args: ['-y', '@modelcontextprotocol/server-memory'],
                    env: {
                        MEMORY_FILE: path.join(this.configDir, 'research-memory.json')
                    }
                },
                required: true
            }
        };
        
        this.claudeConfigPath = this.getClaudeConfigPath();
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
                throw new Error(`Plataforma no soportada: ${platform}`);
        }
    }

    async install() {
        console.log('🔧 Instalando MCPs requeridos para Autonomous Scientist...\n');
        
        try {
            await this.createMCPDirectory();
            await this.installRequiredMCPs();
            await this.configureClaudeDesktop();
            await this.validateInstallation();
            await this.generateMCPReport();
            
            console.log('✅ MCPs instalados y configurados exitosamente');
            console.log('🔄 Reinicie Claude Desktop para aplicar los cambios');
            
        } catch (error) {
            console.error('❌ Error durante la instalación de MCPs:', error.message);
            throw error;
        }
    }

    async createMCPDirectory() {
        console.log('📁 Creando directorio MCP...');
        
        await fs.ensureDir(this.mcpDir);
        await fs.ensureDir(path.join(this.mcpDir, 'logs'));
        
        console.log(`  ✓ ${this.mcpDir}`);
    }

    async installRequiredMCPs() {
        console.log('\n📦 Instalando MCPs requeridos...\n');
        
        for (const [key, mcp] of Object.entries(this.requiredMCPs)) {
            if (mcp.required) {
                console.log(`Instalando ${mcp.name}...`);
                await this.installMCP(key, mcp);
                console.log(`  ✅ ${mcp.name} instalado`);
            } else {
                console.log(`⏩ ${mcp.name} (opcional) - configure manualmente si es necesario`);
            }
        }
    }

    async installMCP(key, mcp) {
        try {
            // Verificar si el paquete ya está disponible globalmente
            try {
                execSync(`npm list -g ${mcp.package}`, { stdio: 'pipe' });
                console.log(`  ℹ️  ${mcp.package} ya está instalado globalmente`);
            } catch (error) {
                // No está instalado, verificar que npx funcionará
                console.log(`  📥 Verificando disponibilidad de ${mcp.package}...`);
                execSync(`npm view ${mcp.package} version`, { stdio: 'pipe' });
                console.log(`  ✓ ${mcp.package} disponible en npm registry`);
            }
            
            // Crear archivo de configuración específico para este MCP
            const mcpConfigFile = path.join(this.mcpDir, `${key}-config.json`);
            await fs.writeJson(mcpConfigFile, {
                name: mcp.name,
                package: mcp.package,
                version: mcp.version,
                config: mcp.config,
                installed_at: new Date().toISOString(),
                status: 'configured'
            }, { spaces: 2 });
            
        } catch (error) {
            throw new Error(`Error instalando ${mcp.name}: ${error.message}`);
        }
    }

    async configureClaudeDesktop() {
        console.log('\n⚙️ Configurando Claude Desktop...\n');
        
        // Leer configuración actual de Claude Desktop
        let claudeConfig = {};
        if (await fs.pathExists(this.claudeConfigPath)) {
            try {
                claudeConfig = await fs.readJson(this.claudeConfigPath);
                console.log('  📄 Configuración existente de Claude Desktop encontrada');
            } catch (error) {
                console.log('  ⚠️  Archivo de configuración de Claude Desktop corrupto, creando nuevo');
                claudeConfig = {};
            }
        } else {
            console.log('  📝 Creando nueva configuración de Claude Desktop');
            await fs.ensureDir(path.dirname(this.claudeConfigPath));
        }
        
        // Asegurar que exista la sección mcpServers
        if (!claudeConfig.mcpServers) {
            claudeConfig.mcpServers = {};
        }
        
        // Agregar configuración de MCPs requeridos
        for (const [key, mcp] of Object.entries(this.requiredMCPs)) {
            if (mcp.required) {
                const serverKey = `autonomous-scientist-${key}`;
                
                claudeConfig.mcpServers[serverKey] = {
                    command: mcp.config.command,
                    args: mcp.config.args,
                    env: mcp.config.env || {}
                };
                
                console.log(`  ✓ Configurado: ${mcp.name}`);
            }
        }
        
        // Agregar configuración específica de la extensión
        claudeConfig.mcpServers['autonomous-scientist-main'] = {
            command: 'node',
            args: [path.join(this.extensionDir, 'server', 'index.js')],
            env: {
                NODE_ENV: 'production',
                EXTENSION_PATH: this.extensionDir,
                CACHE_DIR: path.join(this.configDir, 'cache'),
                CONFIG_DIR: this.configDir
            }
        };
        
        console.log('  ✓ Configurado: Autonomous Scientist Main Server');
        
        // Crear backup de la configuración existente
        if (await fs.pathExists(this.claudeConfigPath)) {
            const backupPath = `${this.claudeConfigPath}.backup-${Date.now()}`;
            await fs.copy(this.claudeConfigPath, backupPath);
            console.log(`  💾 Backup creado: ${path.basename(backupPath)}`);
        }
        
        // Escribir nueva configuración
        await fs.writeJson(this.claudeConfigPath, claudeConfig, { spaces: 2 });
        console.log('  ✅ Configuración de Claude Desktop actualizada');
    }

    async validateInstallation() {
        console.log('\n🔍 Validando instalación de MCPs...\n');
        
        // Verificar que los paquetes están disponibles
        for (const [key, mcp] of Object.entries(this.requiredMCPs)) {
            if (mcp.required) {
                try {
                    console.log(`Validando ${mcp.name}...`);
                    
                    // Verificar que el paquete existe en npm
                    execSync(`npm view ${mcp.package} version`, { stdio: 'pipe' });
                    
                    // Verificar configuración
                    const configFile = path.join(this.mcpDir, `${key}-config.json`);
                    if (await fs.pathExists(configFile)) {
                        console.log(`  ✅ ${mcp.name}: Configuración válida`);
                    } else {
                        console.log(`  ⚠️  ${mcp.name}: Archivo de configuración faltante`);
                    }
                    
                } catch (error) {
                    console.log(`  ❌ ${mcp.name}: Error - ${error.message}`);
                }
            }
        }
        
        // Verificar configuración de Claude Desktop
        if (await fs.pathExists(this.claudeConfigPath)) {
            try {
                const claudeConfig = await fs.readJson(this.claudeConfigPath);
                const mcpCount = Object.keys(claudeConfig.mcpServers || {}).length;
                console.log(`\n  ✅ Claude Desktop: ${mcpCount} MCPs configurados`);
            } catch (error) {
                console.log('\n  ❌ Claude Desktop: Error leyendo configuración');
            }
        } else {
            console.log('\n  ❌ Claude Desktop: Archivo de configuración no encontrado');
        }
    }

    async generateMCPReport() {
        console.log('\n📊 Generando reporte de MCPs...');
        
        const report = {
            installation: {
                date: new Date().toISOString(),
                version: '6.0.0',
                platform: process.platform,
                node_version: process.version
            },
            mcps: {},
            claude_config: {
                path: this.claudeConfigPath,
                configured: await fs.pathExists(this.claudeConfigPath)
            },
            next_steps: [
                'Reinicie Claude Desktop para cargar los MCPs',
                'Los MCPs estarán disponibles automáticamente',
                'Use el comando de diagnóstico para verificar el estado',
                'Configure APIs opcionales si es necesario'
            ]
        };
        
        // Agregar información de cada MCP
        for (const [key, mcp] of Object.entries(this.requiredMCPs)) {
            report.mcps[key] = {
                name: mcp.name,
                required: mcp.required,
                configured: mcp.required,
                api_key_required: mcp.api_key_required || false,
                status: mcp.required ? 'installed' : 'available'
            };
        }
        
        const reportFile = path.join(this.configDir, 'mcp-installation-report.json');
        await fs.writeJson(reportFile, report, { spaces: 2 });
        
        console.log(`  ✓ Reporte guardado: ${reportFile}`);
    }

    async checkExistingMCPs() {
        console.log('\n🔍 Verificando MCPs existentes...\n');
        
        if (!(await fs.pathExists(this.claudeConfigPath))) {
            console.log('  📝 No se encontró configuración previa de Claude Desktop');
            return {};
        }
        
        try {
            const claudeConfig = await fs.readJson(this.claudeConfigPath);
            const existingMCPs = claudeConfig.mcpServers || {};
            
            console.log(`  📦 Encontrados ${Object.keys(existingMCPs).length} MCPs configurados:`);
            
            for (const [name, config] of Object.entries(existingMCPs)) {
                console.log(`    - ${name}: ${config.command} ${config.args?.join(' ') || ''}`);
            }
            
            return existingMCPs;
        } catch (error) {
            console.log('  ⚠️  Error leyendo configuración existente');
            return {};
        }
    }
}

// Función de utilidad para diagnóstico
class MCPDiagnostic {
    constructor() {
        this.installer = new MCPInstaller();
    }

    async diagnose() {
        console.log('🩺 Diagnóstico de MCPs - Autonomous Scientist\n');
        
        await this.checkClaudeDesktopConfig();
        await this.checkMCPServers();
        await this.checkExtensionServer();
        await this.generateDiagnosticReport();
    }

    async checkClaudeDesktopConfig() {
        console.log('📋 Verificando configuración de Claude Desktop...\n');
        
        const configPath = this.installer.claudeConfigPath;
        
        if (!(await fs.pathExists(configPath))) {
            console.log('  ❌ Archivo de configuración no encontrado');
            console.log(`     Esperado en: ${configPath}`);
            return;
        }
        
        try {
            const config = await fs.readJson(configPath);
            const mcpServers = config.mcpServers || {};
            
            console.log(`  ✅ Configuración encontrada: ${Object.keys(mcpServers).length} MCPs`);
            
            for (const [name, serverConfig] of Object.entries(mcpServers)) {
                console.log(`    📌 ${name}:`);
                console.log(`       Comando: ${serverConfig.command}`);
                console.log(`       Args: ${serverConfig.args?.join(' ') || 'ninguno'}`);
                console.log(`       Env vars: ${Object.keys(serverConfig.env || {}).length}`);
            }
            
        } catch (error) {
            console.log('  ❌ Error parseando configuración:', error.message);
        }
    }

    async checkMCPServers() {
        console.log('\n🔧 Verificando disponibilidad de MCPs...\n');
        
        for (const [key, mcp] of Object.entries(this.installer.requiredMCPs)) {
            console.log(`Verificando ${mcp.name}...`);
            
            try {
                // Verificar disponibilidad del paquete
                const version = execSync(`npm view ${mcp.package} version`, { 
                    encoding: 'utf8', 
                    stdio: 'pipe' 
                }).trim();
                
                console.log(`  ✅ Paquete disponible: v${version}`);
                
                // Verificar configuración local
                const configFile = path.join(this.installer.mcpDir, `${key}-config.json`);
                if (await fs.pathExists(configFile)) {
                    console.log('  ✅ Configuración local encontrada');
                } else {
                    console.log('  ⚠️  Configuración local faltante');
                }
                
            } catch (error) {
                console.log(`  ❌ Error: ${error.message}`);
            }
        }
    }

    async checkExtensionServer() {
        console.log('\n🎯 Verificando servidor principal de la extensión...\n');
        
        const serverPath = path.join(this.installer.extensionDir, 'server', 'index.js');
        
        if (await fs.pathExists(serverPath)) {
            console.log('  ✅ Servidor principal encontrado');
            console.log(`     Ubicación: ${serverPath}`);
            
            // Verificar dependencias del servidor
            const packagePath = path.join(this.installer.extensionDir, 'package.json');
            if (await fs.pathExists(packagePath)) {
                const packageJson = await fs.readJson(packagePath);
                console.log(`  ✅ Package.json: v${packageJson.version}`);
                console.log(`  📦 Dependencias: ${Object.keys(packageJson.dependencies || {}).length}`);
            }
        } else {
            console.log('  ❌ Servidor principal no encontrado');
            console.log(`     Esperado en: ${serverPath}`);
        }
    }

    async generateDiagnosticReport() {
        const report = {
            timestamp: new Date().toISOString(),
            platform: process.platform,
            node_version: process.version,
            claude_config_exists: await fs.pathExists(this.installer.claudeConfigPath),
            extension_server_exists: await fs.pathExists(
                path.join(this.installer.extensionDir, 'server', 'index.js')
            ),
            recommendations: []
        };
        
        if (!report.claude_config_exists) {
            report.recommendations.push('Ejecutar: node scripts/mcp-installer.js');
        }
        
        if (!report.extension_server_exists) {
            report.recommendations.push('Verificar integridad de la instalación de la extensión');
        }
        
        const reportFile = path.join(this.installer.configDir, 'diagnostic-report.json');
        await fs.writeJson(reportFile, report, { spaces: 2 });
        
        console.log(`\n📊 Reporte de diagnóstico guardado en: ${reportFile}`);
    }
}

// Ejecutar según el modo llamado
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--diagnose') || args.includes('-d')) {
        const diagnostic = new MCPDiagnostic();
        diagnostic.diagnose().catch(console.error);
    } else {
        const installer = new MCPInstaller();
        installer.install().catch(console.error);
    }
}

module.exports = { MCPInstaller, MCPDiagnostic };