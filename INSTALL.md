# Instalación - Autonomous Scientist Desktop Extension v6.0

## 🚀 Instalación Rápida

### Paso 1: Instalar DXT CLI
```bash
npm install -g @anthropic-ai/dxt
```

### Paso 2: Construir la Extensión
```bash
cd autonomous-scientist-extension
npm install
npm run build
npm run pack
```

### Paso 3: Instalar en Claude Desktop
1. Abrir Claude Desktop
2. Ir a **Extensiones** → **Instalar Extensión**
3. Seleccionar el archivo `.dxt` generado
4. Seguir el asistente de configuración

## ⚙️ Configuración Inicial

### Configuraciones Requeridas
- **Disciplina Principal**: Tu área de investigación principal
- **Estilo de Citación**: APA, Chicago, MLA, ASA, AAA, o APSA
- **Directorio de Trabajo**: Donde guardar proyectos de investigación

### Configuraciones Opcionales
- **Claves API**: Para acceso mejorado a bases de datos
- **Tamaño de Cache**: Límite de almacenamiento (1-20GB)
- **Idiomas OCR**: Lista de idiomas para procesamiento
- **Funciones Avanzadas**: Características experimentales

## 🔑 Configuración de APIs (Opcional pero Recomendado)

### APIs Gratuitas (Sin clave requerida)
- ✅ **Semantic Scholar**: 200M+ papers académicos
- ✅ **ArXiv**: Preprints más recientes
- ✅ **CrossRef**: Metadatos de publicadores

### APIs de Pago (Opcionales)
- **OpenAI**: Análisis mejorado
- **Anthropic**: Acceso extendido a Claude

## 🎯 Primeros Pasos

### Usar el Asistente de Configuración
1. Después de instalar, el asistente te guiará
2. Configura tu disciplina principal (ej: psicología)
3. Establece el estilo de citación (ej: APA)
4. Define tu directorio de trabajo

### Probar la Extensión
```
Usuario: "Configurar mis APIs de investigación"
Usuario: "Buscar literatura sobre terapia cognitivo-conductual"
Usuario: "Procesar este PDF con OCR" [adjuntar archivo]
Usuario: "Generar paper LaTeX en formato APA"
```

## 🔧 Solución de Problemas

### Error: "DXT CLI no encontrado"
```bash
# Instalar globalmente
npm install -g @anthropic-ai/dxt

# Verificar instalación
dxt --version
```

### Error: "No se puede construir la extensión"
```bash
# Limpiar e instalar dependencias
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error: "Claude Desktop no reconoce la extensión"
- Verificar que el archivo `.dxt` se generó correctamente
- Comprobar que Claude Desktop está actualizado (v0.8.0+)
- Reiniciar Claude Desktop después de la instalación

## 📊 Verificar Instalación

### Comandos de Prueba
1. **Configuración de APIs**: `"Configurar APIs de investigación"`
2. **Procesamiento PDF**: `"Procesar PDF académico"`
3. **Búsqueda**: `"Buscar literatura sobre [tu tema]"`
4. **Generación LaTeX**: `"Generar paper en APA"`

### Indicadores de Éxito
- ✅ Extensión aparece en lista de Claude Desktop
- ✅ Herramientas de investigación disponibles
- ✅ Configuración guardada correctamente
- ✅ APIs gratuitas funcionando

## 🆘 Soporte Técnico

### Información para Reportes
Incluir en reportes de problemas:
- Versión de Claude Desktop
- Sistema operativo
- Versión de Node.js
- Logs de error específicos

### Recursos Adicionales
- Documentación completa: `README.md`
- Configuración avanzada: Revisar `manifest.json`  
- Estructura del proyecto: Explorar directorio `server/`

---

¡Listo para revolucionar tu flujo de investigación académica! 🎓