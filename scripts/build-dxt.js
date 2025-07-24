#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

class DXTBuilder {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distPath = path.join(this.projectRoot, 'dist');
    this.dxtPath = path.join(this.projectRoot, 'autonomous-scientist.dxt');
    this.tempBuildPath = path.join(this.projectRoot, 'temp-dxt-build');
  }

  async build() {
    console.log('🚀 Starting .dxt build process...');
    
    try {
      // Step 1: Clean previous builds
      await this.cleanup();
      
      // Step 2: Build TypeScript and webpack bundle
      await this.buildSource();
      
      // Step 3: Prepare DXT structure
      await this.prepareDXTStructure();
      
      // Step 4: Copy necessary files
      await this.copyFiles();
      
      // Step 5: Create the .dxt archive
      await this.createDXTArchive();
      
      // Step 6: Cleanup temporary files
      await this.cleanup();
      
      console.log('✅ .dxt build complete!');
      console.log(`📦 Output: ${this.dxtPath}`);
      
      // Show build statistics
      await this.showBuildStats();
      
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up build artifacts...');
    
    if (await fs.pathExists(this.tempBuildPath)) {
      await fs.remove(this.tempBuildPath);
    }
    
    if (await fs.pathExists(this.dxtPath)) {
      await fs.remove(this.dxtPath);
    }
  }

  async buildSource() {
    console.log('📦 Building TypeScript and webpack bundle...');
    
    try {
      // Build TypeScript
      console.log('  Compiling TypeScript...');
      execSync('npm run build', { 
        cwd: this.projectRoot, 
        stdio: 'inherit' 
      });
      
      // Create webpack bundle for packaging
      console.log('  Creating webpack bundle...');
      execSync('npm run bundle', { 
        cwd: this.projectRoot, 
        stdio: 'inherit' 
      });
      
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async prepareDXTStructure() {
    console.log('📁 Preparing DXT structure...');
    
    // Create temporary build directory
    await fs.ensureDir(this.tempBuildPath);
    
    // Create DXT directory structure
    const dirs = [
      'src',
      'templates',
      'dictionaries',
      'assets',
      'dist'
    ];
    
    for (const dir of dirs) {
      await fs.ensureDir(path.join(this.tempBuildPath, dir));
    }
  }

  async copyFiles() {
    console.log('📄 Copying files to DXT structure...');
    
    // Copy main files
    const filesToCopy = [
      { src: 'manifest.json', dest: 'manifest.json' },
      { src: 'package.json', dest: 'package.json' },
      { src: 'README.md', dest: 'README.md', optional: true },
      { src: 'CHANGELOG.md', dest: 'CHANGELOG.md', optional: true },
      { src: 'LICENSE', dest: 'LICENSE', optional: true }
    ];
    
    for (const file of filesToCopy) {
      const srcPath = path.join(this.projectRoot, file.src);
      const destPath = path.join(this.tempBuildPath, file.dest);
      
      if (await fs.pathExists(srcPath)) {
        await fs.copy(srcPath, destPath);
        console.log(`  ✓ ${file.src}`);
      } else if (!file.optional) {
        throw new Error(`Required file not found: ${file.src}`);
      }
    }
    
    // Copy built bundle
    const bundlePath = path.join(this.distPath, 'bundle.js');
    if (await fs.pathExists(bundlePath)) {
      await fs.copy(bundlePath, path.join(this.tempBuildPath, 'dist', 'bundle.js'));
      console.log('  ✓ dist/bundle.js');
    } else {
      throw new Error('Bundle not found. Run build first.');
    }
    
    // Copy templates directory if it exists
    const templatesPath = path.join(this.projectRoot, 'templates');
    if (await fs.pathExists(templatesPath)) {
      await fs.copy(templatesPath, path.join(this.tempBuildPath, 'templates'));
      console.log('  ✓ templates/');
    }
    
    // Copy dictionaries directory if it exists
    const dictionariesPath = path.join(this.projectRoot, 'dictionaries');
    if (await fs.pathExists(dictionariesPath)) {
      await fs.copy(dictionariesPath, path.join(this.tempBuildPath, 'dictionaries'));
      console.log('  ✓ dictionaries/');
    }
    
    // Copy assets directory if it exists
    const assetsPath = path.join(this.projectRoot, 'assets');
    if (await fs.pathExists(assetsPath)) {
      await fs.copy(assetsPath, path.join(this.tempBuildPath, 'assets'));
      console.log('  ✓ assets/');
    }
    
    // Create startup script
    await this.createStartupScript();
  }

  async createStartupScript() {
    console.log('📝 Creating startup script...');
    
    const startupScript = `#!/usr/bin/env node

// Autonomous Scientist Desktop Extension v6.0
// Startup script for Claude Desktop

const path = require('path');
const fs = require('fs');

// Set up extension directory
const extensionDir = __dirname;
const bundlePath = path.join(extensionDir, 'dist', 'bundle.js');

// Check if bundle exists
if (!fs.existsSync(bundlePath)) {
  console.error('❌ Extension bundle not found:', bundlePath);
  process.exit(1);
}

// Load and start the extension
try {
  console.error('🔬 Autonomous Scientist v6.0 starting...');
  require(bundlePath);
} catch (error) {
  console.error('❌ Failed to start extension:', error.message);
  process.exit(1);
}
`;

    const startupPath = path.join(this.tempBuildPath, 'index.js');
    await fs.writeFile(startupPath, startupScript, { mode: 0o755 });
    console.log('  ✓ index.js (startup script)');
  }

  async createDXTArchive() {
    console.log('📦 Creating .dxt archive...');
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(this.dxtPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });
      
      output.on('close', () => {
        console.log(`  ✓ Archive created: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
        resolve();
      });
      
      archive.on('error', (err) => {
        reject(err);
      });
      
      archive.pipe(output);
      
      // Add all files from temp build directory
      archive.directory(this.tempBuildPath, false);
      
      // Finalize the archive
      archive.finalize();
    });
  }

  async showBuildStats() {
    console.log('\n📊 Build Statistics:');
    
    try {
      const stats = await fs.stat(this.dxtPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      
      console.log(`   Size: ${sizeMB} MB`);
      console.log(`   Created: ${stats.birthtime.toLocaleString()}`);
      
      // Check if size is reasonable
      if (stats.size > 100 * 1024 * 1024) { // 100MB
        console.log('⚠️  Warning: Package size is quite large (>100MB)');
      } else if (stats.size < 1 * 1024 * 1024) { // 1MB
        console.log('⚠️  Warning: Package size seems too small (<1MB)');
      } else {
        console.log('✅ Package size looks good');
      }
      
      // Verify manifest
      const tempManifest = path.join(this.tempBuildPath, 'manifest.json');
      if (await fs.pathExists(tempManifest)) {
        const manifest = await fs.readJson(tempManifest);
        console.log(`   Version: ${manifest.version}`);
        console.log(`   Tools: ${manifest.tools || 'Unknown'}`);
        console.log(`   Target: ${manifest['hardware-requirements']?.target || 'Not specified'}`);
      }
      
    } catch (error) {
      console.log('   Could not read build statistics');
    }
    
    console.log('\n🎉 Installation Instructions:');
    console.log('1. Open Claude Desktop');
    console.log('2. Go to Extensions → Install Extension');
    console.log(`3. Select: ${path.basename(this.dxtPath)}`);
    console.log('4. Follow the setup wizard');
    console.log('5. Start researching!');
  }
}

// Add archiver dependency check
async function checkDependencies() {
  try {
    require('archiver');
  } catch (error) {
    console.error('❌ Missing dependency: archiver');
    console.error('Please install with: npm install archiver --save-dev');
    process.exit(1);
  }
}

// Main execution
async function main() {
  await checkDependencies();
  
  const builder = new DXTBuilder();
  await builder.build();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DXTBuilder;