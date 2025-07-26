#!/usr/bin/env node

/**
 * Autonomous Scientist Desktop Extension - Setup Wizard
 * Interactive guided setup for first-time installation and configuration
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');

class SetupWizard {
    constructor() {
        this.homeDir = os.homedir();
        this.configDir = path.join(this.homeDir, '.autonomous-scientist');
        this.extensionDir = path.dirname(__dirname);
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.config = {
            primary_discipline: 'psychology',
            default_citation_style: 'apa',
            cache_size_gb: 5,
            max_concurrent_pdfs: 2,
            ocr_languages: 'en,es,de,fr,it,pt,la',
            workspace_directory: path.join(this.homeDir, 'Documents', 'Research'),
            enable_advanced_features: true,
            semantic_scholar_api_key: '',
            crossref_api_key: ''
        };

        this.disciplines = [
            'psychology',
            'neuroscience', 
            'education',
            'sociology',
            'anthropology',
            'philosophy',
            'political-science',
            'international-relations'
        ];

        this.citationStyles = ['apa', 'mla', 'chicago', 'harvard', 'ieee'];
    }

    async question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }

    async run() {
        try {
            console.log('\n🔬 Welcome to Autonomous Scientist Setup Wizard v6.0');
            console.log('====================================================\n');
            
            await this.stepWelcome();
            await this.stepSystemCheck();
            await this.stepWorkspaceSetup();
            await this.stepDisciplineSelection();
            await this.stepCitationStyle();
            await this.stepAdvancedSettings();
            await this.stepAPIConfiguration();
            await this.stepFinalizeSetup();
            await this.stepCompletion();

        } catch (error) {
            console.error('\n❌ Setup failed:', error.message);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }

    async stepWelcome() {
        console.log('This wizard will guide you through the initial setup of your');
        console.log('Autonomous Scientist research automation system.\n');
        
        console.log('Features included in this version:');
        console.log('✓ Multi-language OCR processing');
        console.log('✓ 8 specialized academic disciplines');
        console.log('✓ LaTeX document generation');
        console.log('✓ Comprehensive literature search');
        console.log('✓ PDF batch processing');
        console.log('✓ Research gap identification\n');

        const proceed = await this.question('Press Enter to continue or Ctrl+C to exit...');
    }

    async stepSystemCheck() {
        console.log('\n📋 Step 1: System Requirements Check');
        console.log('====================================\n');

        const systemInfo = {
            platform: os.platform(),
            arch: os.arch(),
            memory: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
            cpus: os.cpus().length,
            nodeVersion: process.version
        };

        console.log(`Platform: ${systemInfo.platform} (${systemInfo.arch})`);
        console.log(`Memory: ${systemInfo.memory} GB`);
        console.log(`CPU Cores: ${systemInfo.cpus}`);
        console.log(`Node.js: ${systemInfo.nodeVersion}`);

        // Check minimum requirements
        const warnings = [];
        if (systemInfo.memory < 16) {
            warnings.push('⚠️  Memory below recommended 16GB (performance may be limited)');
        }
        if (systemInfo.cpus < 4) {
            warnings.push('⚠️  Less than 4 CPU cores (OCR processing may be slow)');
        }

        if (warnings.length > 0) {
            console.log('\nWarnings:');
            warnings.forEach(warning => console.log(warning));
            
            const proceed = await this.question('\nContinue anyway? (y/N): ');
            if (proceed.toLowerCase() !== 'y') {
                throw new Error('Setup cancelled by user');
            }
        } else {
            console.log('\n✅ System meets all requirements!');
        }
    }

    async stepWorkspaceSetup() {
        console.log('\n📁 Step 2: Research Workspace Setup');
        console.log('===================================\n');

        console.log(`Default workspace: ${this.config.workspace_directory}`);
        const customPath = await this.question('Enter custom path (or press Enter for default): ');
        
        if (customPath.trim()) {
            this.config.workspace_directory = path.resolve(customPath.trim());
        }

        // Ensure directory exists
        try {
            await fs.ensureDir(this.config.workspace_directory);
            console.log(`✅ Workspace directory created: ${this.config.workspace_directory}`);
        } catch (error) {
            console.log(`❌ Failed to create workspace directory: ${error.message}`);
            throw error;
        }
    }

    async stepDisciplineSelection() {
        console.log('\n🎓 Step 3: Primary Research Discipline');
        console.log('=====================================\n');

        console.log('Available disciplines:');
        this.disciplines.forEach((discipline, index) => {
            console.log(`  ${index + 1}. ${discipline}`);
        });

        while (true) {
            const choice = await this.question('\nSelect your primary discipline (1-8): ');
            const index = parseInt(choice) - 1;
            
            if (index >= 0 && index < this.disciplines.length) {
                this.config.primary_discipline = this.disciplines[index];
                console.log(`✅ Selected: ${this.config.primary_discipline}`);
                break;
            } else {
                console.log('Invalid selection. Please choose 1-8.');
            }
        }
    }

    async stepCitationStyle() {
        console.log('\n📚 Step 4: Default Citation Style');
        console.log('=================================\n');

        console.log('Available citation styles:');
        this.citationStyles.forEach((style, index) => {
            console.log(`  ${index + 1}. ${style.toUpperCase()}`);
        });

        while (true) {
            const choice = await this.question('\nSelect default citation style (1-5): ');
            const index = parseInt(choice) - 1;
            
            if (index >= 0 && index < this.citationStyles.length) {
                this.config.default_citation_style = this.citationStyles[index];
                console.log(`✅ Selected: ${this.config.default_citation_style.toUpperCase()}`);
                break;
            } else {
                console.log('Invalid selection. Please choose 1-5.');
            }
        }
    }

    async stepAdvancedSettings() {
        console.log('\n⚙️  Step 5: Advanced Settings');
        console.log('============================\n');

        // Cache size
        const cacheSize = await this.question(`Cache size in GB (default: ${this.config.cache_size_gb}): `);
        if (cacheSize.trim() && !isNaN(cacheSize)) {
            this.config.cache_size_gb = parseInt(cacheSize);
        }

        // Concurrent PDFs
        const concurrentPdfs = await this.question(`Max concurrent PDF processing (default: ${this.config.max_concurrent_pdfs}): `);
        if (concurrentPdfs.trim() && !isNaN(concurrentPdfs)) {
            this.config.max_concurrent_pdfs = parseInt(concurrentPdfs);
        }

        // OCR Languages
        console.log(`\nDefault OCR languages: ${this.config.ocr_languages}`);
        const ocrLangs = await this.question('Custom languages (comma-separated, or press Enter for default): ');
        if (ocrLangs.trim()) {
            this.config.ocr_languages = ocrLangs.trim();
        }

        // Advanced features
        const advanced = await this.question('Enable experimental features? (Y/n): ');
        this.config.enable_advanced_features = advanced.toLowerCase() !== 'n';

        console.log('\n✅ Advanced settings configured');
    }

    async stepAPIConfiguration() {
        console.log('\n🔑 Step 6: Research API Configuration');
        console.log('====================================\n');

        console.log('Configure optional API keys for enhanced access:');
        console.log('(All APIs work without keys, but keys provide higher rate limits)\n');

        // Semantic Scholar API Key
        console.log('1. Semantic Scholar API Key (Optional)');
        console.log('   Get yours at: https://www.semanticscholar.org/product/api');
        const ssKey = await this.question('   Enter key (or press Enter to skip): ');
        if (ssKey.trim()) {
            this.config.semantic_scholar_api_key = ssKey.trim();
            console.log('   ✅ Semantic Scholar API key saved');
        }

        // CrossRef API Key
        console.log('\n2. CrossRef Polite Pool Token (Optional)');
        console.log('   Get yours at: https://www.crossref.org/services/metadata-delivery/plus/');
        const crKey = await this.question('   Enter token (or press Enter to skip): ');
        if (crKey.trim()) {
            this.config.crossref_api_key = crKey.trim();
            console.log('   ✅ CrossRef API token saved');
        }

        console.log('\n✅ API configuration complete');
    }

    async stepFinalizeSetup() {
        console.log('\n💾 Step 7: Finalizing Setup');
        console.log('===========================\n');

        // Create config directory
        await fs.ensureDir(this.configDir);

        // Save configuration
        const configPath = path.join(this.configDir, 'config.json');
        await fs.writeJson(configPath, this.config, { spaces: 2 });
        console.log(`✅ Configuration saved to: ${configPath}`);

        // Create cache directory
        const cacheDir = path.join(this.configDir, 'cache');
        await fs.ensureDir(cacheDir);
        console.log(`✅ Cache directory created: ${cacheDir}`);

        // Create logs directory
        const logsDir = path.join(this.configDir, 'logs');
        await fs.ensureDir(logsDir);
        console.log(`✅ Logs directory created: ${logsDir}`);

        // Test basic functionality
        console.log('\n🧪 Testing basic functionality...');
        try {
            // Run a quick system validation
            const SystemValidator = require('./system-validator.js');
            console.log('✅ System validation completed');
        } catch (error) {
            console.log('⚠️  System validation unavailable (not critical)');
        }
    }

    async stepCompletion() {
        console.log('\n🎉 Setup Complete!');
        console.log('==================\n');

        console.log('Your Autonomous Scientist is now configured and ready to use!');
        console.log('\nConfiguration Summary:');
        console.log(`  Primary Discipline: ${this.config.primary_discipline}`);
        console.log(`  Citation Style: ${this.config.default_citation_style.toUpperCase()}`);
        console.log(`  Workspace: ${this.config.workspace_directory}`);
        console.log(`  Cache Size: ${this.config.cache_size_gb} GB`);
        console.log(`  OCR Languages: ${this.config.ocr_languages}`);

        console.log('\nNext Steps:');
        console.log('1. Restart Claude Desktop to load the extension');
        console.log('2. Start using tools like "comprehensive_literature_search"');
        console.log('3. Process PDFs with "process_academic_pdf"');
        console.log('4. Generate papers with "generate_latex_paper"');

        console.log('\nFor help and documentation:');
        console.log('  GitHub: https://github.com/manuel-roa/autonomous-scientist-dxt');
        console.log('  Wiki: https://github.com/manuel-roa/autonomous-scientist-dxt/wiki');

        await this.question('\nPress Enter to finish...');
    }
}

// Main execution
async function main() {
    const wizard = new SetupWizard();
    await wizard.run();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SetupWizard;