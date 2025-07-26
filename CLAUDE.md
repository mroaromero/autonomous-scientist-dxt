# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Architecture

This is a **Claude Desktop Extension (DXT)** built as an **MCP (Model Context Protocol) server** that provides comprehensive research automation for social sciences and humanities. The system uses a **hybrid TypeScript/JavaScript architecture** with the following key components:

### Server Architecture
- **Primary Server**: `dist/bundle.js` (compiled from TypeScript) - main entry point specified in manifest.json
- **Fallback Server**: `server/index.js` (JavaScript) - full implementation with 40+ tools
- **Simple Server**: `server/index-simple.js` (JavaScript) - minimal working version for debugging

### Dual Codebase Structure
The project maintains both **TypeScript** (`src/`) and **JavaScript** (`server/`) implementations:
- `src/` - Modern TypeScript implementation (compiled to `dist/`)
- `server/` - Working JavaScript implementation with all features
- This allows development in TypeScript while maintaining a stable JavaScript fallback

### MCP Integration
- Implements MCP SDK v1.17.0 for Claude Desktop communication
- Provides **tools** (40+ research functions) and **prompts** (workflow templates)
- Uses stdio transport for IPC with Claude Desktop
- Entry point: `dist/bundle.js` with args `["${__dirname}/dist/bundle.js"]`

## Essential Commands

### Development Commands
```bash
# Install dependencies
npm install

# Build TypeScript to dist/
npm run build

# Build with Webpack bundling
npm run bundle

# Run tests
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only

# Development server
npm run dev                # Compile and run from dist/

# Create DXT package
npm run pack              # Creates autonomous-scientist-dxt.dxt
npm run prepare-dxt       # Build + pack in one command
```

### Installation & Setup Commands
```bash
# Complete setup workflow
npm run install:complete  # Install → setup → validate

# Individual setup steps
npm run setup             # Run auto-installer
npm run configure-apis    # Configure API keys
npm run install-mcps      # Install MCP dependencies
npm run validate          # Full system validation
npm run validate:quick    # Quick validation
npm run diagnose          # Diagnose issues
```

### DXT-Specific Commands
```bash
# Install DXT CLI globally (required for packaging)
npm run install-cli

# Package extension for Claude Desktop
npm run pack
```

## New API Integrations (v6.0+)

### OpenAlex API Tools
- `search_openalex_works`: Search 250M+ scholarly works with advanced filtering
- `get_openalex_work`: Get detailed work information including citations and concepts
- `search_openalex_authors`: Search authors with metrics, affiliations, and h-index
- `get_openalex_stats`: Database statistics and insights
- **Authentication**: None required - completely open access
- **Coverage**: Global scholarly literature across all disciplines

### Open Science Framework (OSF) API Tools
- `search_osf_projects`: Search public research projects and collaborations
- `get_osf_project`: Get detailed project information with contributors and files
- `search_osf_preprints`: Search OSF preprints across multiple providers
- `get_osf_stats`: Platform statistics and information
- **Authentication**: OAuth 2.0 for private content (public content accessible without auth)
- **Coverage**: Research projects, datasets, preprints, and collaborative workflows

### SciELO API Tools
- `search_scielo_articles`: Search Latin American and Iberian scientific literature
- `get_scielo_journals`: Get journal information by collection and subject area
- `get_scielo_article`: Get detailed article information with multilingual abstracts
- `get_scielo_stats`: Platform statistics and collection information
- `shorten_scielo_url`: URL shortener service for SciELO links
- **Authentication**: None required for basic access
- **Coverage**: Brazil (BR), Colombia (CO), Chile (CL), Spain (ES), and more

## Key Design Patterns

### Tool Implementation Pattern
All tools follow the MCP tool schema and return structured responses:
```javascript
async function toolName(args) {
  try {
    // Tool logic here
    return {
      content: [{
        type: 'text',
        text: 'Formatted response with markdown support'
      }]
    };
  } catch (error) {
    return errorHandler.handleToolError(error, 'toolName', args);
  }
}
```

### Configuration Management
- User configuration loaded from DXT environment variables (`USER_CONFIG_*`)
- API keys handled securely through DXT's encrypted storage
- Runtime config stored in `_config` object passed to all tools

### Memory Management
- Dedicated `MemoryManager` class handles PDF processing memory limits
- Optimized for 16GB DDR4 systems with Intel i3-12100F
- Automatic garbage collection and task queuing for large files

### Multi-Source Integration
The system integrates multiple academic APIs:
- **Semantic Scholar**: 200M+ papers, recommendations, embeddings
- **ArXiv**: STEM preprints with full metadata
- **CrossRef**: Publisher metadata and DOI resolution
- **OpenAlex**: 250M+ scholarly works, authors, venues, institutions (open access)
- **Open Science Framework (OSF)**: Research projects, collaborations, preprints, datasets
- **SciELO**: Latin American and Iberian scientific literature (multilingual)

## Critical Dependencies

### Runtime Dependencies
- `@modelcontextprotocol/sdk`: ^1.17.0 (MCP communication)
- `axios`: HTTP requests to academic APIs
- `sharp`: Image processing (marked as webpack external)
- `tesseract.js`: OCR processing (marked as webpack external)
- `pdf-parse`: PDF text extraction

### Development Dependencies
- `typescript`: ^5.0.0
- `webpack`: ^5.90.0 with `ts-loader` for bundling
- `@anthropic-ai/dxt`: CLI for packaging (installed globally)

## Academic Domain Logic

### Discipline-Specific Analysis
The system provides specialized analysis for 8 academic fields:
1. **Psychology** - APA 7th formatting, experimental design
2. **Neuroscience** - Neuroimaging methodology, brain regions
3. **Education** - Pedagogical analysis, curriculum design
4. **Sociology** - Social network analysis, demographics
5. **Anthropology** - Ethnographic methods, cultural analysis
6. **Philosophy** - Argument structure, logical analysis
7. **Political Science** - Institutional analysis, electoral systems
8. **International Relations** - Conflict analysis, diplomacy

### Citation Management
- Multi-format citation support (APA, Chicago, MLA, ASA, AAA, APSA)
- LaTeX document generation with proper academic formatting
- Bibliography management with CrossRef DOI resolution

### OCR & Language Processing
- Multi-language OCR with academic terminology enhancement
- Language detection for 7+ languages including Latin
- Quality enhancement for scanned academic documents

## Build Process Understanding

### TypeScript Compilation Flow
1. `src/*.ts` → `tsc` → `dist/*.js` (ES2020 modules)
2. `src/index.ts` → `webpack` → `dist/bundle.js` (production bundle)
3. Webpack externals: `sharp`, `tesseract.js`, `pdf-parse` (not bundled)

### DXT Packaging Flow
1. `npm run bundle` - Creates optimized `dist/bundle.js`
2. `dxt pack` - Packages entire project into `.dxt` file
3. Manifest points to `dist/bundle.js` as entry point

### File Inclusion in DXT
The DXT package includes:
- `dist/bundle.js` (main server)
- `server/` directory (JavaScript fallback)
- `assets/`, `scripts/`, `tests/`
- All configuration files and documentation

## Troubleshooting Common Issues

### Permission Errors
If you see "No se puede conectar al servidor de la extensión":
1. Check Claude Desktop extension is enabled
2. Verify `dist/bundle.js` exists and is executable
3. Check manifest.json entry_point matches compiled file
4. Try disabling/re-enabling extension in Claude Desktop

### Build Issues
- Ensure Node.js ≥18.0.0 for ES2020 support
- Run `npm run clean` before building to clear stale files
- Check TypeScript compilation errors with `npm run build`

### Memory Issues
- Extension auto-manages memory for 16GB systems
- Reduce `max_concurrent_pdfs` config if needed
- Clear cache through extension settings or delete `~/.autonomous-scientist/cache`

## Testing Strategy

### Test Structure
- `tests/unit/` - Server initialization and core logic
- `tests/integration/` - Tool functionality with mock APIs
- `tests/fixtures/` - Sample data for testing

### Test Execution
Tests run in plain Node.js (no test runner framework) with basic assertions. Focus on:
- MCP server initialization
- Tool response format validation
- Error handling paths
- Memory management under load