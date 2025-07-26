# Autonomous Scientist Desktop Extension v6.0

A comprehensive research automation system for social sciences and humanities, built as a Claude Desktop Extension (DXT).

## 🙏 Acknowledgments

This project was inspired by and builds upon the excellent work from:

- **[AI-Scientist v2](https://github.com/SakanaAI/AI-Scientist-v2)** - Advanced automated scientific research capabilities
- **[Lotus Wisdom MCP](https://github.com/linxule/lotus-wisdom-mcp)** - Model Context Protocol implementation patterns

Special thanks to these projects for demonstrating the potential of AI-assisted research automation.

## 🎯 Overview

The Autonomous Scientist is an advanced research assistant that combines:
- **Multi-language OCR** processing for academic PDFs
- **Discipline-specific analysis** for 8 academic fields  
- **LaTeX document generation** with proper citation formatting
- **Comprehensive literature search** across multiple academic databases
- **Hardware optimization** for Intel i3-12100F + 16GB DDR4

## 🔬 Supported Disciplines

1. **Psychology** - APA 7th Edition formatting, experimental design analysis
2. **Neuroscience** - Nature format, neuroimaging methodology analysis  
3. **Education** - APA Educational format, curriculum and pedagogy analysis
4. **Sociology** - ASA format, social network and demographic analysis
5. **Anthropology** - AAA format, ethnographic and cultural analysis
6. **Philosophy** - Chicago 17th Edition, argument structure analysis
7. **Political Science** - APSA format, institutional and electoral analysis
8. **International Relations** - APSA format, conflict and diplomacy analysis

## 📦 Installation as Desktop Extension

### Prerequisites
Install the DXT CLI:
```bash
npm install -g @anthropic-ai/dxt
```

### Build and Install
1. **Build the extension**:
   ```bash
   cd autonomous-scientist-extension
   npm install
   npm run build
   npm run pack
   ```

2. **Install in Claude Desktop**:
   - Open Claude Desktop
   - Navigate to **Extensions** → **Install Extension**
   - Select the generated `.dxt` file
   - Follow the configuration wizard

3. **Configure settings**:
   - Set your primary research discipline
   - Configure citation style preferences  
   - Set workspace directory
   - Add API keys (optional but recommended)

## 🔧 Configuration Options

The extension supports extensive user configuration through Claude Desktop's settings:

### Required Settings
- **Primary Research Discipline**: Your main field of study
- **Default Citation Style**: APA, Chicago, MLA, ASA, AAA, or APSA
- **Workspace Directory**: Where to store research projects

### Optional Settings
- **API Keys**: Semantic Scholar, CrossRef, OpenAI, Anthropic
- **Cache Size**: Disk cache limit (1-20GB)
- **OCR Languages**: Comma-separated language codes
- **Advanced Features**: Enable experimental functionality

### API Integration
- **Semantic Scholar**: 200M+ academic papers (free)
- **ArXiv**: Latest preprints (free)
- **CrossRef**: Publisher metadata (free)
- **OpenAI**: Enhanced analysis (paid, optional)
- **Anthropic**: Extended Claude access (paid, optional)

## 🛠️ Core Tools (40+ Available)

### Literature & Research
- `comprehensive_literature_search` - Multi-source academic search
- `analyze_by_discipline` - Specialized analysis for your field
- `identify_research_gaps` - Automatic gap identification

### PDF Processing
- `process_academic_pdf` - Complete PDF analysis with OCR
- `batch_process_pdfs` - Efficient batch processing
- `ocr_multilingual` - Advanced multi-language OCR

### Document Generation
- `generate_latex_paper` - Complete LaTeX documents
- `format_citations` - Multi-style citation formatting
- `compile_to_pdf` - LaTeX compilation with error handling

### Discipline-Specific Analysis
- `analyze_psychology_research` - APA methodology analysis
- `analyze_neuroscience_paper` - Neuroimaging analysis
- `analyze_education_study` - Pedagogical analysis
- `analyze_philosophy_argument` - Argument structure
- And 4 more specialized analyzers...

## 📚 Usage Examples

### Literature Review Workflow
```
User: "I need a literature review on cognitive behavioral therapy"
→ Extension searches multiple databases
→ Processes provided PDFs with OCR
→ Analyzes content by psychology discipline
→ Generates complete LaTeX literature review
```

### Document Analysis
```
User: "Analyze this neuroscience paper" [attach PDF]
→ OCR processing with quality enhancement
→ Extracts methodology, brain regions, findings
→ Provides quality assessment and recommendations
→ Formats citations in desired style
```

### Multilingual Research
```
User: Uploads German psychology paper (scanned)
→ Auto-detects German language
→ Applies academic OCR enhancement
→ Analyzes with psychology-specific patterns
→ Generates English summary with APA citations
```

## 🚀 Predefined Workflows

### Literature Review Workflow
Comprehensive workflow for conducting literature reviews:
1. Multi-source literature search
2. PDF processing and analysis
3. Gap identification
4. LaTeX document generation

### Document Analysis Workflow  
Deep analysis of academic documents:
1. OCR processing with quality enhancement
2. Discipline-specific content analysis
3. Citation extraction and formatting
4. Research recommendations

## 💻 System Requirements

### Minimum Requirements
- **CPU**: Intel i3-12100F or equivalent (4 cores)
- **RAM**: 16GB DDR4
- **Storage**: 5GB free space for cache
- **OS**: Windows 10/11, macOS 12+, or Linux
- **Claude Desktop**: v0.8.0 or later
- **Node.js**: v18.0.0 or later

### Performance Optimization
- Memory usage optimized for 16GB systems
- Intelligent caching (2GB memory + 5GB disk)
- Adaptive processing based on available resources
- Hardware-aware concurrency limits

## 🔒 Security & Privacy

- **Local Processing**: All PDF processing occurs on your machine
- **Encrypted Storage**: API keys stored with AES-256 encryption
- **No Data Sharing**: Research content never leaves your system
- **Secure APIs**: Only established academic APIs
- **Optional Cloud**: Premium APIs are optional enhancements

## 🐛 Troubleshooting

### Common Issues

**High Memory Usage**
- Extension automatically manages memory limits
- Reduce concurrent PDF processing if needed
- Clear cache through extension settings

**OCR Quality Issues**  
- Ensure PDF resolution >150 DPI
- Try different language settings
- Use quality enhancement for scanned documents

**API Connection Failures**
- Check internet connection
- Verify API keys in settings
- Test individual API connections

## 🔄 Development

### Current Status (v6.0)

**✅ Stable Components:**
- **Simplified MCP Server** (`server/index-simple.js`) - Core functionality working
- **DXT Package Integration** - Properly formatted for Claude Desktop
- **Basic Research Tools** - Literature search, PDF processing, API setup

**🚧 In Development:**
- **Full TypeScript Conversion** - Complex tools being migrated from TypeScript
- **Advanced PDF Processing** - OCR and citation extraction
- **Discipline-Specific Analyzers** - Specialized analysis tools

### Recent Fixes (January 2025)

**Issue Resolution:**
- ✅ **Server Disconnection**: Fixed TypeScript compatibility issues by creating simplified server
- ✅ **MCP JSON Parsing**: Resolved stdout pollution in mcp-science-web wrapper
- ✅ **Package Installation**: Updated manifest.json for proper DXT structure

**Architecture Decision:**
The project now uses a **hybrid approach**:
1. **Simplified Server** (`index-simple.js`) for immediate functionality
2. **Full Implementation** (`index.js`) for advanced features (in progress)

This ensures users have a working research assistant while development continues.

### Dependencies

**Runtime Requirements:**
- Node.js 18+ with ES Module support
- Python 3.8+ with MCP SDK
- Git for version control

**Optional Integrations:**
- LaTeX distribution for document generation
- Tesseract OCR for multilingual text extraction

### Project Structure
```
autonomous-scientist-extension/
├── manifest.json          # DXT manifest (updated for simplified server)
├── server/                # MCP server implementation
│   ├── index-simple.js    # Simplified working server (current)
│   ├── index.js           # Full server (TypeScript conversion in progress)
│   ├── tools/             # Tool implementations (40+ tools)
│   └── utils/             # Utility modules (security, memory, cache)
├── assets/                # Icons and screenshots
├── templates/             # LaTeX templates for disciplines
└── autonomous-scientist-dxt.dxt  # Packaged extension file
```

### Building from Source
1. Clone the repository
2. Install dependencies: `npm install`
3. Build TypeScript: `npm run build`
4. Package DXT: `npm run pack`

### Contributing
- Follow the existing code structure
- Implement proper error handling
- Add comprehensive logging
- Test with multiple document types

## 📄 License

MIT License - See LICENSE file for details

## 🙋‍♂️ Support

For issues and support:
- Check the troubleshooting section
- Review Claude Desktop Extension documentation
- Report bugs with system specifications
- Include example files (anonymized) for OCR issues

---

**Transform your research workflow** with the Autonomous Scientist Desktop Extension - the most comprehensive academic research automation tool for social sciences and humanities.

*Optimized for your hardware • Secure by design • Research-focused*