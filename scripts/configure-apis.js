#!/usr/bin/env node

/**
 * Autonomous Scientist Desktop Extension - API Configuration Wizard
 * Interactive setup for optional APIs with encryption and validation
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto-js');
const readline = require('readline');
const axios = require('axios');

class APIConfigurator {
    constructor() {
        this.homeDir = os.homedir();
        this.configDir = path.join(this.homeDir, '.autonomous-scientist');
        this.keysFile = path.join(this.configDir, 'encrypted-keys.json');
        this.masterKeyFile = path.join(this.configDir, '.master-key');
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.apis = {
            semantic_scholar: {
                name: 'Semantic Scholar API',
                test_endpoint: 'https://api.semanticscholar.org/graph/v1/paper/search?query=test&limit=1',
                key_header: 'x-api-key',
                free: true,
                instructions: 'Obtenga su clave gratuita en: https://www.semanticscholar.org/product/api'
            },
            crossref: {
                name: 'CrossRef Polite Pool',
                test_endpoint: 'https://api.crossref.org/works?query=test&rows=1',
                key_header: 'User-Agent',
                free: true,
                instructions: 'Contacte support@crossref.org para obtener acceso al polite pool'
            },
            osf: {
                name: 'Open Science Framework (OSF)',
                test_endpoint: 'https://api.osf.io/v2/users/me/',
                key_header: 'Authorization',
                key_prefix: 'Bearer ',
                free: true,
                instructions: 'Genere un Personal Access Token en: https://osf.io/settings/tokens/'
            },
        };
    }

    async configure() {
        console.log('🔧 Configurador de APIs - Autonomous Scientist\n');
        
        try {
            await this.ensureConfigDir();
            await this.setupMasterKey();
            await this.showMainMenu();
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }

    async ensureConfigDir() {
        await fs.ensureDir(this.configDir);
        
        // Establecer permisos restrictivos en sistemas Unix
        if (process.platform !== 'win32') {
            await fs.chmod(this.configDir, 0o700);
        }
    }

    async setupMasterKey() {
        let masterKey;
        
        if (await fs.pathExists(this.masterKeyFile)) {
            masterKey = await fs.readFile(this.masterKeyFile, 'utf8');
        } else {
            masterKey = crypto.lib.WordArray.random(256/8).toString();
            await fs.writeFile(this.masterKeyFile, masterKey, { mode: 0o600 });
            console.log('🔐 Clave maestra generada y guardada de forma segura');
        }
        
        this.masterKey = masterKey;
    }

    async showMainMenu() {
        console.log('┌────────────────────────────────────────────────┐');
        console.log('│              CONFIGURACIÓN DE APIs            │');
        console.log('├────────────────────────────────────────────────┤');
        console.log('│                                                │');
        console.log('│ 1. Ver estado actual de APIs                  │');
        console.log('│ 2. Configurar Semantic Scholar (GRATUITO)     │');
        console.log('│ 3. Configurar CrossRef Polite Pool (GRATUITO) │');
        console.log('│ 4. Configurar OSF API (GRATUITO)              │');
        console.log('│ 5. Probar todas las APIs configuradas         │');
        console.log('│ 6. Remover API configurada                    │');
        console.log('│ 7. Salir                                      │');
        console.log('│                                                │');
        console.log('└────────────────────────────────────────────────┘');
        
        const choice = await this.prompt('\nSeleccione una opción (1-7): ');
        
        switch (choice) {
            case '1':
                await this.showAPIStatus();
                break;
            case '2':
                await this.configureAPI('semantic_scholar');
                break;
            case '3':
                await this.configureAPI('crossref');
                break;
            case '4':
                await this.configureAPI('osf');
                break;
            case '5':
                await this.testAllAPIs();
                break;
            case '6':
                await this.removeAPI();
                break;
            case '7':
                console.log('👋 ¡Hasta luego!');
                return;
            default:
                console.log('❌ Opción no válida');
                await this.showMainMenu();
        }
        
        // Mostrar menú nuevamente
        await this.prompt('\nPresione Enter para continuar...');
        await this.showMainMenu();
    }

    async showAPIStatus() {
        console.log('\n📊 Estado actual de APIs:\n');
        
        const encryptedKeys = await this.loadEncryptedKeys();
        
        for (const [key, api] of Object.entries(this.apis)) {
            const isConfigured = encryptedKeys && encryptedKeys[key];
            const status = isConfigured ? '✅ Configurada' : '❌ No configurada';
            const cost = api.free ? '🆓 GRATUITO' : `💰 ${api.cost}`;
            
            console.log(`${api.name}:`);
            console.log(`  Estado: ${status}`);
            console.log(`  Costo: ${cost}`);
            console.log(`  Instrucciones: ${api.instructions}\n`);
        }
    }

    async configureAPI(apiKey) {
        const api = this.apis[apiKey];
        console.log(`\n🔧 Configurando ${api.name}...\n`);
        
        if (!api.free) {
            console.log(`⚠️  ADVERTENCIA: Esta es una API de pago (${api.cost})`);
            console.log('   Asegúrese de tener billing configurado antes de continuar.\n');
            
            const confirm = await this.prompt('¿Desea continuar? (s/n): ');
            if (confirm.toLowerCase() !== 's') {
                return;
            }
        }
        
        console.log(`📋 ${api.instructions}\n`);
        
        const apiKeyValue = await this.prompt(`Ingrese su ${api.name} API key: `, true);
        
        if (!apiKeyValue.trim()) {
            console.log('❌ API key no puede estar vacía');
            return;
        }
        
        console.log('\n🔍 Validando API key...');
        
        const isValid = await this.validateAPIKey(apiKey, apiKeyValue);
        
        if (isValid) {
            await this.saveAPIKey(apiKey, apiKeyValue);
            console.log(`✅ ${api.name} configurada exitosamente`);
        } else {
            console.log(`❌ API key no válida para ${api.name}`);
        }
    }

    async validateAPIKey(apiKey, keyValue) {
        const api = this.apis[apiKey];
        
        try {
            const headers = {};
            
            if (api.key_prefix) {
                headers[api.key_header] = api.key_prefix + keyValue;
            } else {
                headers[api.key_header] = keyValue;
            }
            
            const response = await axios.get(api.test_endpoint, {
                headers,
                timeout: 10000
            });
            
            return response.status === 200;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                return false; // Unauthorized - API key inválida
            }
            
            // Para otros errores, asumimos que la key es válida pero hay problemas de red/servicio
            console.log(`⚠️  Advertencia: No se pudo validar completamente (${error.message})`);
            const proceed = await this.prompt('¿Guardar de todas formas? (s/n): ');
            return proceed.toLowerCase() === 's';
        }
    }

    async saveAPIKey(apiKey, keyValue) {
        const encryptedKeys = await this.loadEncryptedKeys() || {};
        
        // Encriptar la API key
        const encrypted = crypto.AES.encrypt(keyValue, this.masterKey).toString();
        encryptedKeys[apiKey] = {
            value: encrypted,
            configured_at: new Date().toISOString(),
            name: this.apis[apiKey].name
        };
        
        // Guardar con permisos restrictivos
        await fs.writeFile(this.keysFile, JSON.stringify(encryptedKeys, null, 2), { mode: 0o600 });
    }

    async loadEncryptedKeys() {
        if (!(await fs.pathExists(this.keysFile))) {
            return null;
        }
        
        const content = await fs.readFile(this.keysFile, 'utf8');
        return JSON.parse(content);
    }

    async testAllAPIs() {
        console.log('\n🧪 Probando todas las APIs configuradas...\n');
        
        const encryptedKeys = await this.loadEncryptedKeys();
        
        if (!encryptedKeys) {
            console.log('❌ No hay APIs configuradas para probar');
            return;
        }
        
        for (const [key, keyData] of Object.entries(encryptedKeys)) {
            console.log(`Probando ${keyData.name}...`);
            
            try {
                const decryptedKey = crypto.AES.decrypt(keyData.value, this.masterKey).toString(crypto.enc.Utf8);
                const isValid = await this.validateAPIKey(key, decryptedKey);
                
                if (isValid) {
                    console.log(`  ✅ ${keyData.name}: Funcionando correctamente`);
                } else {
                    console.log(`  ❌ ${keyData.name}: Error de autenticación`);
                }
            } catch (error) {
                console.log(`  ❌ ${keyData.name}: Error - ${error.message}`);
            }
        }
    }

    async removeAPI() {
        console.log('\n🗑️  Remover configuración de API:\n');
        
        const encryptedKeys = await this.loadEncryptedKeys();
        
        if (!encryptedKeys) {
            console.log('❌ No hay APIs configuradas');
            return;
        }
        
        console.log('APIs configuradas:');
        let index = 1;
        const keysList = [];
        
        for (const [key, keyData] of Object.entries(encryptedKeys)) {
            console.log(`${index}. ${keyData.name}`);
            keysList.push(key);
            index++;
        }
        
        const choice = await this.prompt(`\nSeleccione API a remover (1-${keysList.length}): `);
        const choiceIndex = parseInt(choice) - 1;
        
        if (choiceIndex >= 0 && choiceIndex < keysList.length) {
            const apiKey = keysList[choiceIndex];
            const apiName = encryptedKeys[apiKey].name;
            
            const confirm = await this.prompt(`¿Confirma remover ${apiName}? (s/n): `);
            
            if (confirm.toLowerCase() === 's') {
                delete encryptedKeys[apiKey];
                await fs.writeFile(this.keysFile, JSON.stringify(encryptedKeys, null, 2), { mode: 0o600 });
                console.log(`✅ ${apiName} removida exitosamente`);
            }
        } else {
            console.log('❌ Selección no válida');
        }
    }

    prompt(question, sensitive = false) {
        return new Promise((resolve) => {
            if (sensitive) {
                // Para campos sensibles, ocultar entrada (funciona en la mayoría de terminales)
                process.stdout.write(question);
                process.stdin.setRawMode(true);
                
                let input = '';
                const onData = (char) => {
                    char = char.toString();
                    
                    if (char === '\n' || char === '\r') {
                        process.stdin.setRawMode(false);
                        process.stdin.removeListener('data', onData);
                        console.log(''); // Nueva línea
                        resolve(input);
                    } else if (char === '\u007f') { // Backspace
                        if (input.length > 0) {
                            input = input.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    } else if (char >= ' ') {
                        input += char;
                        process.stdout.write('*');
                    }
                };
                
                process.stdin.on('data', onData);
            } else {
                this.rl.question(question, resolve);
            }
        });
    }
}

// Ejecutar configurador si es llamado directamente
if (require.main === module) {
    const configurator = new APIConfigurator();
    configurator.configure().catch(console.error);
}

module.exports = APIConfigurator;