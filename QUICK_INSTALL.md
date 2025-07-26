# 🚀 Instalación Rápida - Autonomous Scientist v6.0

**Instalación optimizada en 3 pasos simples**

## 📋 Instalación Automática (Recomendada)

```bash
# 1. Instalar dependencias
npm install

# 2. Configuración automática completa
npm run install:complete

# 3. ¡Listo! Reinicie Claude Desktop
```

**⏱️ Tiempo estimado:** 2-3 minutos  
**🔧 Configuración:** Automática con APIs gratuitas  
**📱 Estado:** Listo para usar inmediatamente

---

## 🎯 Instalación Paso a Paso

### Opción A: Todo en Uno
```bash
npm run install:complete
```
Ejecuta automáticamente: instalación → configuración → MCPs → validación

### Opción B: Paso a Paso
```bash
# 1. Configuración básica
npm run setup

# 2. Instalar MCPs
npm run install-mcps  

# 3. Validar sistema
npm run validate
```

---

## 📊 Scripts Disponibles

| Comando | Descripción | Tiempo |
|---------|-------------|--------|
| `npm run setup` | Configuración automática con APIs gratuitas | 30s |
| `npm run install-mcps` | Instala MCPs requeridos para Claude Desktop | 60s |
| `npm run validate` | Diagnóstico completo del sistema | 30s |
| `npm run validate:quick` | Validación rápida de elementos críticos | 10s |
| `npm run configure-apis` | Configurar APIs opcionales (interactivo) | 2-5min |
| `npm run diagnose` | Diagnóstico avanzado de MCPs | 30s |

---

## 🟢 APIs Preconfiguradas (GRATUITAS)

✅ **Semantic Scholar** - 200M+ papers académicos  
✅ **ArXiv** - Preprints STEM más recientes  
✅ **CrossRef** - Resolución de DOIs y metadatos  
✅ **Tesseract OCR** - Procesamiento multiidioma  
✅ **LaTeX Generator** - Documentos académicos automáticos

---

## 🔐 APIs Opcionales (Mejoran Funcionalidad)

### 🆓 APIs Gratuitas con Registro
- **Semantic Scholar API Key** → Rate limits aumentados
- **CrossRef Polite Pool** → Acceso prioritario

### 💰 APIs de Pago (Opcionales)
- **OpenAI API** → Análisis semántico avanzado (~$5-20/mes)
- **Anthropic API** → Capacidades Claude extendidas (~$10-30/mes)

```bash
# Configurar APIs opcionales
npm run configure-apis
```

---

## 🔍 Verificación Post-Instalación

```bash
# Validación rápida
npm run validate:quick

# Validación completa
npm run validate
```

### ✅ Criterios de Éxito
- ✅ **Node.js**: >= 18.0.0
- ✅ **Memoria RAM**: >= 16GB (recomendado)
- ✅ **APIs gratuitas**: Conectividad verificada
- ✅ **MCPs**: Configurados en Claude Desktop
- ✅ **Directorios**: Creados y accesibles

---

## 🚨 Solución de Problemas

### Error: "Claude Desktop config not found"
```bash
# Instalar MCPs manualmente
npm run install-mcps
```

### Error: "API connectivity failed"
```bash
# Verificar conexión a internet
npm run validate:quick
```

### Error: "Dependencies missing"
```bash
# Reinstalar dependencias
npm install
npm run setup
```

### Error: "Permission denied"
```bash
# Linux/Mac: Verificar permisos
chmod +x scripts/*.js

# Windows: Ejecutar como administrador
```

---

## 📂 Estructura Post-Instalación

```
~/.autonomous-scientist/
├── config.json                    # Configuración principal
├── cache/                         # Cache de documentos (5GB)
├── encrypted-keys.json            # APIs opcionales (encriptadas)
├── installation-report.json       # Reporte de instalación
└── system-validation-report.json  # Estado del sistema

~/Documents/Research/               # Workspace de investigación
├── literature-reviews/
├── processed-pdfs/
├── generated-papers/
└── temp/
```

---

## 🔄 Reiniciar Claude Desktop

**⚠️ IMPORTANTE:** Después de la instalación, reinicie Claude Desktop para cargar los MCPs.

### Windows
- Cerrar Claude Desktop completamente
- Volver a abrir desde el menú de inicio

### macOS
- `Cmd + Q` para cerrar
- Volver a abrir desde Launchpad

### Linux
- Cerrar desde terminal: `pkill claude`
- Volver a ejecutar

---

## 🎉 ¡Listo para Usar!

Después del reinicio, tendrá disponible:

- 🧠 **40+ herramientas especializadas** de investigación
- 📚 **Búsqueda académica** en múltiples bases de datos
- 📄 **Procesamiento OCR** multiidioma de PDFs
- 📝 **Generación LaTeX** con citas automáticas
- 🔍 **Análisis por disciplinas** especializadas
- 💾 **Cache inteligente** optimizado para su hardware

### Comandos de Ejemplo

```
"Busca literatura sobre cognitive behavioral therapy"
"Procesa este PDF y extrae las referencias"  
"Genera un paper en LaTeX sobre neuroplasticidad"
"Analiza este documento de psicología usando APA"
```

---

## 📞 Soporte

**Problemas de instalación:**
```bash
npm run diagnose
```

**Estado del sistema:**
```bash
npm run validate
```

**Reconfigurar APIs:**
```bash
npm run configure-apis
```

---

*Autonomous Scientist v6.0 - Optimizado para Intel i3-12100F + 16GB DDR4*  
*🔒 Procesamiento local • 🆓 APIs gratuitas • 🎯 Especializado en investigación académica*