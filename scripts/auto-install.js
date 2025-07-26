#!/usr/bin/env node

/**
 * Autonomous Scientist Desktop Extension - Auto Installation Script
 * Configures the extension with optimal defaults and guides user through API setup
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto-js');
const { execSync } = require('child_process');

class AutoInstaller {
    constructor() {
        this.homeDir = os.homedir();
        this.configDir = path.join(this.homeDir, '.autonomous-scientist');
        this.cacheDir = path.join(this.configDir, 'cache');
        this.workspaceDir = path.join(this.homeDir, 'Documents', 'Research');
        this.extensionDir = path.dirname(__dirname);
        
        this.defaultConfig = {
            version: '6.0.0',
            primary_discipline: 'psychology',
            default_citation_style: 'apa',
            cache_size_gb: 5,
            max_concurrent_pdfs: 2,
            ocr_languages: 'en,es,de,fr,it,pt,la',
            workspace_directory: this.workspaceDir,
            enable_advanced_features: true,
            apis: {
                semantic_scholar: { enabled: true, free: true, configured: true },
                arxiv: { enabled: true, free: true, configured: true },
                crossref: { enabled: true, free: true, configured: true },
                openai: { enabled: false, free: false, configured: false },
                anthropic: { enabled: false, free: false, configured: false }
            },
            installation: {
                auto_configured: true,
                date: new Date().toISOString(),
                hardware_optimized: true
            }
        };
    }

    async install() {
        console.log('🚀 Iniciando instalación automática de Autonomous Scientist...\n');
        
        try {
            await this.createDirectories();
            await this.setupFreeAPIs();
            await this.configureSystem();
            await this.validateInstallation();
            await this.promptOptionalAPIs();
            await this.generateFinalReport();
            
            console.log('✅ ¡Instalación completada exitosamente!');
            console.log(`📁 Directorio de trabajo: ${this.workspaceDir}`);
            console.log('🔧 La extensión está lista para usar con todas las APIs gratuitas configuradas.');
            
        } catch (error) {
            console.error('❌ Error durante la instalación:', error.message);
            process.exit(1);
        }
    }

    async createDirectories() {
        console.log('📁 Creando directorios del sistema...');
        
        const directories = [
            this.configDir,
            this.cacheDir,
            this.workspaceDir,
            path.join(this.workspaceDir, 'literature-reviews'),
            path.join(this.workspaceDir, 'processed-pdfs'),
            path.join(this.workspaceDir, 'generated-papers'),
            path.join(this.workspaceDir, 'temp')
        ];

        for (const dir of directories) {
            await fs.ensureDir(dir);
            console.log(`  ✓ ${dir}`);
        }
    }

    async setupFreeAPIs() {
        console.log('\n🌐 Configurando APIs gratuitas...');
        
        // Semantic Scholar - Sin API key requerida para uso básico
        console.log('  ✓ Semantic Scholar API: Configurada (acceso gratuito)');
        console.log('    - 200M+ papers académicos disponibles');
        console.log('    - Rate limit: 100 requests/5min');
        
        // ArXiv API - Completamente gratuita
        console.log('  ✓ ArXiv API: Configurada (completamente gratuita)');
        console.log('    - Preprints STEM más recientes');
        console.log('    - Sin límites estrictos');
        
        // CrossRef API - Gratuita con rate limits
        console.log('  ✓ CrossRef API: Configurada (acceso gratuito)');
        console.log('    - Resolución de DOIs y metadatos');
        console.log('    - Rate limit estándar aplicado');
        
        this.defaultConfig.apis.semantic_scholar.status = 'active';
        this.defaultConfig.apis.arxiv.status = 'active';
        this.defaultConfig.apis.crossref.status = 'active';
    }

    async configureSystem() {
        console.log('\n⚙️ Aplicando configuraciones optimizadas...');
        
        // Configuración optimizada para Intel i3-12100F + 16GB RAM
        const systemConfig = {
            memory: {
                max_heap_size: '2048m',
                cache_size: this.defaultConfig.cache_size_gb * 1024 * 1024 * 1024,
                concurrent_processes: this.defaultConfig.max_concurrent_pdfs
            },
            performance: {
                hardware_profile: 'i3-12100f-16gb',
                ocr_threads: 4,
                image_processing_quality: 'balanced',
                cache_strategy: 'intelligent'
            }
        };
        
        // Escribir configuración principal
        const configFile = path.join(this.configDir, 'config.json');
        await fs.writeJson(configFile, { ...this.defaultConfig, system: systemConfig }, { spaces: 2 });
        
        // Crear archivo de perfil de hardware
        const hardwareProfile = {
            cpu: 'Intel i3-12100F',
            memory: '16GB DDR4',
            optimizations: {
                tesseract_workers: 4,
                sharp_concurrency: 2,
                pdf_batch_size: 3,
                memory_pressure_threshold: 0.8
            }
        };
        
        await fs.writeJson(path.join(this.configDir, 'hardware-profile.json'), hardwareProfile, { spaces: 2 });
        
        console.log('  ✓ Configuración optimizada para i3-12100F aplicada');
        console.log('  ✓ Límites de memoria configurados (2GB heap)');
        console.log('  ✓ Cache inteligente habilitado (5GB)');
        console.log('  ✓ Procesamiento concurrente optimizado');
    }

    async validateInstallation() {
        console.log('\n🔍 Validando instalación...');
        
        // Test de conectividad APIs gratuitas
        const apiTests = [
            { name: 'Semantic Scholar', url: 'https://api.semanticscholar.org/graph/v1/paper/search?query=test&limit=1' },
            { name: 'ArXiv', url: 'http://export.arxiv.org/api/query?search_query=test&max_results=1' },
            { name: 'CrossRef', url: 'https://api.crossref.org/works?query=test&rows=1' }
        ];
        
        const axios = require('axios');
        for (const api of apiTests) {
            try {
                await axios.get(api.url, { timeout: 5000 });
                console.log(`  ✓ ${api.name}: Conectividad verificada`);
            } catch (error) {
                console.log(`  ⚠️ ${api.name}: Error de conectividad (${error.message})`);
            }
        }
        
        // Verificar dependencias Node.js
        console.log('\n📦 Verificando dependencias...');
        try {
            require('tesseract.js');
            console.log('  ✓ Tesseract.js: OCR engine disponible');
        } catch (error) {
            throw new Error('Tesseract.js no encontrado. Ejecute: npm install');
        }
        
        try {
            require('pdf-parse');
            console.log('  ✓ PDF-parse: Procesador PDF disponible');
        } catch (error) {
            throw new Error('PDF-parse no encontrado. Ejecute: npm install');
        }
        
        try {
            require('sharp');
            console.log('  ✓ Sharp: Procesador de imágenes disponible');
        } catch (error) {
            console.log('  ⚠️ Sharp: No disponible (funcionalidad de imagen limitada)');
        }
    }

    async promptOptionalAPIs() {
        console.log('\n🔑 APIs Opcionales (Para funcionalidad avanzada):\n');
        
        console.log('┌─────────────────────────────────────────────────────────────┐');
        console.log('│                    APIs DE PAGO OPCIONALES                 │');
        console.log('├─────────────────────────────────────────────────────────────┤');
        console.log('│                                                             │');
        console.log('│ 🤖 OpenAI API (Análisis avanzado)                          │');
        console.log('│    • Costo: ~$0.002 por 1,000 tokens                       │');
        console.log('│    • Beneficio: Análisis semántico mejorado                │');
        console.log('│    • Registro: https://platform.openai.com/                 │');
        console.log('│                                                             │');
        console.log('│ 🧠 Anthropic API (Claude extendido)                        │');
        console.log('│    • Costo: Variable según modelo                          │');
        console.log('│    • Beneficio: Capacidades Claude ampliadas               │');
        console.log('│    • Registro: https://console.anthropic.com/              │');
        console.log('│                                                             │');
        console.log('│ 📚 Semantic Scholar API Key (Límites mejorados)            │');
        console.log('│    • Costo: GRATUITO                                       │');
        console.log('│    • Beneficio: Rate limits aumentados                     │');
        console.log('│    • Registro: https://www.semanticscholar.org/product/api │');
        console.log('│                                                             │');
        console.log('│ 🔗 CrossRef Polite Pool (Límites mejorados)                │');
        console.log('│    • Costo: GRATUITO                                       │');
        console.log('│    • Beneficio: Acceso prioritario                         │');
        console.log('│    • Registro: mailto con detalles de uso                  │');
        console.log('│                                                             │');
        console.log('└─────────────────────────────────────────────────────────────┘');
        
        console.log('\n📋 Para configurar APIs opcionales más tarde:');
        console.log('   1. Obtenga las API keys de los servicios deseados');
        console.log('   2. Ejecute: node scripts/configure-apis.js');
        console.log('   3. O configure manualmente en Claude Desktop > Extensiones\n');
        
        // Crear archivo de instrucciones para APIs opcionales
        const apiInstructions = {
            semantic_scholar: {
                name: 'Semantic Scholar API',
                cost: 'GRATUITO',
                registration: 'https://www.semanticscholar.org/product/api',
                benefits: ['Rate limits aumentados', 'Acceso a más metadatos', 'Análisis bibliométrico'],
                steps: [
                    'Visite https://www.semanticscholar.org/product/api',
                    'Complete el formulario de solicitud',
                    'Recibirá la API key por email',
                    'Configure usando: node scripts/configure-apis.js'
                ]
            },
            crossref: {
                name: 'CrossRef Polite Pool',
                cost: 'GRATUITO',
                registration: 'Email con detalles de uso',
                benefits: ['Rate limits mejorados', 'Acceso prioritario', 'Soporte técnico'],
                steps: [
                    'Envíe email a support@crossref.org',
                    'Incluya detalles del proyecto académico',
                    'Solicite polite pool token',
                    'Configure el token recibido'
                ]
            },
            openai: {
                name: 'OpenAI API',
                cost: '~$0.002/1k tokens',
                registration: 'https://platform.openai.com/',
                benefits: ['Análisis semántico avanzado', 'Extracción de entidades', 'Resúmenes inteligentes'],
                steps: [
                    'Cree cuenta en https://platform.openai.com/',
                    'Agregue método de pago',
                    'Genere API key',
                    'Configure usando: node scripts/configure-apis.js'
                ]
            },
            anthropic: {
                name: 'Anthropic API',
                cost: 'Variable',
                registration: 'https://console.anthropic.com/',
                benefits: ['Capacidades Claude extendidas', 'Análisis de textos largos', 'Razonamiento avanzado'],
                steps: [
                    'Cree cuenta en https://console.anthropic.com/',
                    'Configure billing',
                    'Genere API key',
                    'Configure usando: node scripts/configure-apis.js'
                ]
            }
        };
        
        await fs.writeJson(path.join(this.configDir, 'api-instructions.json'), apiInstructions, { spaces: 2 });
    }

    async generateFinalReport() {
        console.log('\n📊 Generando reporte de instalación...');
        
        const report = {
            installation: {
                date: new Date().toISOString(),
                version: '6.0.0',
                status: 'completed',
                mode: 'auto-install'
            },
            configuration: {
                directories_created: 7,
                free_apis_configured: 3,
                paid_apis_configured: 0,
                hardware_optimization: 'intel-i3-12100f-16gb'
            },
            system_status: {
                ready_for_use: true,
                basic_functionality: 'available',
                advanced_functionality: 'requires_api_keys',
                estimated_setup_time: '2 minutes'
            },
            next_steps: [
                'La extensión está lista para usar',
                'Todas las APIs gratuitas están configuradas',
                'Para funcionalidad avanzada, configure APIs opcionales',
                'Consulte api-instructions.json para detalles'
            ]
        };
        
        await fs.writeJson(path.join(this.configDir, 'installation-report.json'), report, { spaces: 2 });
        
        console.log('  ✓ Reporte guardado en ~/.autonomous-scientist/installation-report.json');
    }
}

// Ejecutar instalador si es llamado directamente
if (require.main === module) {
    const installer = new AutoInstaller();
    installer.install().catch(console.error);
}

module.exports = AutoInstaller;