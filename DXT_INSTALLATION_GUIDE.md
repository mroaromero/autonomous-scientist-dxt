# 🚀 Guía de Instalación DXT - Autonomous Scientist v6.0

## 📦 Instalación como Desktop Extension (.dxt)

### Método 1: Instalación Directa (Recomendado)

1. **Descargar el archivo DXT generado:**
   ```
   autonomous-scientist-6.0.0.dxt (127.2kB)
   ```

2. **Instalar en Claude Desktop:**
   - Abrir Claude Desktop
   - Ir a configuraciones/extensiones
   - Seleccionar "Install Extension"
   - Elegir el archivo `autonomous-scientist-6.0.0.dxt`
   - Claude Desktop instalará automáticamente todos los componentes

3. **Configuración automática:**
   - Las APIs gratuitas (Semantic Scholar, ArXiv, CrossRef) se configuran automáticamente
   - El workspace se crea en `~/Documents/Research`
   - El sistema de cache se optimiza para 5GB por defecto

### Método 2: Desarrollo/Personalización

```bash
# 1. Clonar/descargar el proyecto
git clone [repository-url]
cd autonomous-scientist-dxt

# 2. Instalar dependencias
npm install

# 3. Instalar CLI DXT
npm install -g @anthropic-ai/dxt

# 4. Empaquetar extensión
dxt pack

# 5. Instalar .dxt generado en Claude Desktop
```

---

## ⚙️ Configuración Post-Instalación

### Configuración Básica (Opcional)
Una vez instalada la extensión en Claude Desktop, puedes configurar:

- **Disciplina Principal:** Psicología (por defecto)
- **Estilo de Citas:** APA (por defecto)
- **Directorio de Trabajo:** `~/Documents/Research`
- **Idiomas OCR:** Inglés, Español, Alemán, Francés, Italiano, Portugués, Latín
- **Tamaño de Cache:** 5GB

### APIs Opcionales (Solo si necesitas rate limits aumentados)
- **Semantic Scholar API Key:** Opcional para mayor throughput
- **CrossRef Polite Pool Token:** Opcional para acceso prioritario

---

## 🔧 Herramientas Disponibles

### 📚 Búsqueda y Análisis
- `comprehensive_literature_search` - Búsqueda multi-fuente
- `analyze_by_discipline` - Análisis especializado por 8 disciplinas
- `identify_research_gaps` - Identificación automática de gaps

### 📄 Procesamiento de PDFs
- `process_academic_pdf` - OCR + análisis completo
- `batch_process_pdfs` - Procesamiento masivo optimizado
- `ocr_multilingual` - OCR avanzado multiidioma

### 📝 Generación LaTeX
- `generate_latex_paper` - Documentos completos con formato disciplinario
- `format_citations` - Formato automático de citas
- `compile_to_pdf` - Compilación con manejo de errores

### 🎓 Análisis Disciplinario Especializado
- `analyze_psychology_research` - APA 7th, diseño experimental
- `analyze_neuroscience_paper` - Neuroimagen, conectividad
- `analyze_education_study` - Pedagogía, evaluación
- `analyze_sociology_research` - Métodos cualitativos/cuantitativos
- `analyze_anthropology_work` - Etnografía, teoría cultural
- `analyze_philosophy_argument` - Lógica, argumentación
- `analyze_political_science` - Políticas públicas, instituciones
- `analyze_international_relations` - Geopolítica, tratados

---

## 🎯 Workflows Predefinidos

### Literatura Review Completa
```
"Realiza una revisión de literatura sobre [tema] en [disciplina]"
```
**Ejecuta automáticamente:**
1. Búsqueda multi-fuente
2. Análisis disciplinario 
3. Identificación de gaps
4. Generación de documento LaTeX

### Análisis Documental
```
"Analiza este PDF académico: [ruta]"
```
**Ejecuta automáticamente:**
1. OCR avanzado
2. Extracción de metadatos
3. Análisis disciplinario
4. Formato de citas

---

## 🏆 Optimizaciones Implementadas

### Para Claude Desktop Integration
- ✅ **Eliminadas APIs de otros LLMs** - Solo utiliza Claude Desktop nativo
- ✅ **Comunicación MCP nativa** - Protocolo stdio optimizado
- ✅ **Configuración DXT completa** - Manifest v0.1 compatible
- ✅ **Variables de entorno DXT** - Configuración segura de API keys
- ✅ **Timeouts y error handling** - Manejo robusto de operaciones

### Hardware-Specific (Intel i3-12100F + 16GB DDR4)
- ✅ **Procesamiento concurrente:** 2 PDFs simultáneos
- ✅ **Cache inteligente:** 5GB optimizado para SSD
- ✅ **Gestión de memoria:** Límites adaptativos
- ✅ **OCR optimizado:** Tesseract.js con 7 idiomas

---

## 🚨 Resolución de Problemas

### Extension no aparece en Claude Desktop
```bash
# Verificar que el .dxt es válido
dxt validate autonomous-scientist-6.0.0.dxt

# Re-empaquetar si es necesario
dxt pack
```

### Herramientas no responden
- Verificar que Claude Desktop esté actualizado (>=0.8.0)
- Reiniciar Claude Desktop después de la instalación
- Revisar logs en la consola de desarrollador

### Problemas de APIs
- Las APIs gratuitas funcionan sin configuración
- Para APIs con claves, verificar configuración en Claude Desktop settings

---

## 📊 Especificaciones de la Extensión

**Archivo generado:** `autonomous-scientist-6.0.0.dxt`
- **Tamaño:** 127.2kB (comprimido)
- **Tamaño descomprimido:** 445.1kB
- **Archivos totales:** 36
- **Dependencias:** Incluidas automáticamente
- **Plataformas:** Windows, macOS, Linux

**Checksum:** `1a1cb64a478494e9d4c56e50432ad3156eb63291`

---

## 🎉 ¡Listo para usar!

Después de instalar la extensión DXT en Claude Desktop, tendrás acceso inmediato a:

- 🧠 **40+ herramientas especializadas** de investigación académica
- 📚 **Búsqueda integrada** en Semantic Scholar, ArXiv y CrossRef  
- 📄 **OCR multiidioma** optimizado para documentos académicos
- 📝 **Generación LaTeX** con formato disciplinario automático
- 🔍 **Análisis especializado** para 8 disciplinas académicas
- 💾 **Sistema de cache** optimizado para tu hardware específico

### Comandos de Ejemplo
```
"Busca literatura sobre cognitive behavioral therapy en psicología"
"Procesa este PDF y extrae las referencias principales"
"Genera un paper en LaTeX sobre neuroplasticidad con formato APA"
"Analiza este documento de sociología usando metodología cualitativa"
```

---

*Autonomous Scientist v6.0 - Desktop Extension optimizada para investigación académica*  
*🔒 Procesamiento local • 🆓 APIs gratuitas integradas • 🎯 Especializada en ciencias sociales y humanidades*