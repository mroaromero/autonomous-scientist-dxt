/**
 * Test Fixtures and Sample Data
 * Provides consistent test data for all test suites
 */

const SAMPLE_RESEARCH_PAPERS = [
    {
        title: "Cognitive Load Theory and Educational Technology",
        authors: ["Dr. Sarah Johnson", "Prof. Michael Chen"],
        abstract: "This study examines the application of cognitive load theory in educational technology design, focusing on multimedia learning environments and their impact on student comprehension.",
        discipline: "education",
        keywords: ["cognitive load", "educational technology", "multimedia learning", "instructional design"],
        doi: "10.1000/sample.edu.2023.001",
        year: 2023,
        journal: "Educational Psychology Review",
        citations: 45,
        methodology: "experimental",
        sample_size: 120
    },
    {
        title: "Neural Mechanisms of Memory Consolidation During Sleep",
        authors: ["Dr. Elena Rodriguez", "Prof. David Kim", "Dr. Alex Thompson"],
        abstract: "We investigated the neural mechanisms underlying memory consolidation during different sleep stages using high-density EEG recordings and targeted memory reactivation paradigms.",
        discipline: "neuroscience",
        keywords: ["memory consolidation", "sleep", "EEG", "neural oscillations", "hippocampus"],
        doi: "10.1000/sample.neuro.2023.002",
        year: 2023,
        journal: "Nature Neuroscience",
        citations: 78,
        methodology: "experimental",
        brain_regions: ["hippocampus", "prefrontal cortex", "thalamus"],
        technique: "EEG"
    },
    {
        title: "Social Identity and Political Polarization in Digital Media",
        authors: ["Prof. Maria Lopez", "Dr. James Wilson"],
        abstract: "An analysis of how social identity formation contributes to political polarization in digital media environments, examining echo chambers and confirmation bias effects.",
        discipline: "political-science",
        keywords: ["social identity", "political polarization", "digital media", "echo chambers"],
        doi: "10.1000/sample.polsci.2023.003",
        year: 2023,
        journal: "Political Behavior",
        citations: 32,
        methodology: "mixed-methods",
        sample_size: 2500
    },
    {
        title: "Anthropological Perspectives on Climate Change Adaptation",
        authors: ["Dr. Kwame Asante", "Prof. Lisa Anderson"],
        abstract: "This ethnographic study explores local knowledge systems and adaptation strategies in coastal communities facing climate change impacts.",
        discipline: "anthropology",
        keywords: ["climate change", "adaptation", "local knowledge", "ethnography", "coastal communities"],
        doi: "10.1000/sample.anthro.2023.004",
        year: 2023,  
        journal: "Current Anthropology",
        citations: 28,
        methodology: "ethnographic",
        fieldwork_duration: "18 months"
    }
];

const SAMPLE_LITERATURE_SEARCH_QUERIES = [
    {
        query: "machine learning in education",
        discipline: "education",
        expected_results: 150,
        relevant_terms: ["educational technology", "personalized learning", "adaptive systems"]
    },
    {
        query: "fMRI default mode network",
        discipline: "neuroscience", 
        expected_results: 89,
        relevant_terms: ["resting state", "connectivity", "DMN", "neuroimaging"]
    },
    {
        query: "social inequality qualitative research",
        discipline: "sociology",
        expected_results: 67,
        relevant_terms: ["stratification", "ethnography", "social class", "methodology"]
    },
    {
        query: "phenomenology consciousness",
        discipline: "philosophy",
        expected_results: 45,
        relevant_terms: ["Husserl", "intentionality", "embodiment", "perception"]
    }
];

const SAMPLE_PDF_METADATA = {
    basic: {
        title: "Introduction to Research Methods",
        author: "Dr. Jane Smith",
        subject: "Research Methodology",
        creator: "LaTeX with hyperref",
        producer: "pdfTeX-1.40.21",
        creationDate: "2023-01-15T10:30:00Z",
        modificationDate: "2023-01-15T10:35:00Z",
        pages: 25
    },
    academic: {
        title: "Cognitive Behavioral Therapy Effectiveness: A Meta-Analysis",
        authors: ["Dr. Robert Johnson", "Prof. Sarah Williams", "Dr. Michael Brown"],
        journal: "Clinical Psychology Review",
        volume: 45,
        issue: 3,
        pages: "123-145",
        doi: "10.1000/cpr.2023.001",
        issn: "0272-7358",
        language: "en",
        abstract: "This meta-analysis examines the effectiveness of cognitive behavioral therapy across different populations and disorders...",
        keywords: ["CBT", "meta-analysis", "therapy effectiveness", "clinical outcomes"]
    }
};

const SAMPLE_OCR_CONTENT = {
    english: {
        text: "The rapid advancement of artificial intelligence has transformed multiple sectors, including healthcare, education, and transportation. Machine learning algorithms now demonstrate capabilities that were previously thought to be exclusively human.",
        language: "en",
        confidence: 0.95,
        page_number: 1
    },
    spanish: {
        text: "La inteligencia artificial ha revolucionado la forma en que procesamos información y tomamos decisiones. Los algoritmos de aprendizaje automático pueden identificar patrones complejos en grandes conjuntos de datos.",
        language: "es", 
        confidence: 0.92,
        page_number: 1
    },
    multilingual: {
        text: "The concept of Bildung in German educational philosophy emphasizes holistic development. La formation personnelle est essentielle pour le développement intellectuel.",
        languages: ["en", "de", "fr"],
        confidence: 0.88,
        page_number: 1
    }
};

const SAMPLE_CITATIONS = {
    apa: [
        "Johnson, R., Williams, S., & Brown, M. (2023). Cognitive behavioral therapy effectiveness: A meta-analysis. Clinical Psychology Review, 45(3), 123-145. https://doi.org/10.1000/cpr.2023.001",
        "Rodriguez, E., Kim, D., & Thompson, A. (2023). Neural mechanisms of memory consolidation during sleep. Nature Neuroscience, 26(4), 567-578. https://doi.org/10.1000/sample.neuro.2023.002"
    ],
    mla: [
        "Johnson, Robert, et al. \"Cognitive Behavioral Therapy Effectiveness: A Meta-Analysis.\" Clinical Psychology Review, vol. 45, no. 3, 2023, pp. 123-145, doi:10.1000/cpr.2023.001.",
        "Rodriguez, Elena, et al. \"Neural Mechanisms of Memory Consolidation During Sleep.\" Nature Neuroscience, vol. 26, no. 4, 2023, pp. 567-578, doi:10.1000/sample.neuro.2023.002."
    ],
    chicago: [
        "Johnson, Robert, Sarah Williams, and Michael Brown. \"Cognitive Behavioral Therapy Effectiveness: A Meta-Analysis.\" Clinical Psychology Review 45, no. 3 (2023): 123-145. https://doi.org/10.1000/cpr.2023.001.",
        "Rodriguez, Elena, David Kim, and Alex Thompson. \"Neural Mechanisms of Memory Consolidation During Sleep.\" Nature Neuroscience 26, no. 4 (2023): 567-578. https://doi.org/10.1000/sample.neuro.2023.002."
    ]
};

const SAMPLE_LATEX_TEMPLATES = {
    apa_psychology: `\\documentclass[12pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{times}
\\usepackage{setspace}
\\doublespacing
\\usepackage{apacite}

\\title{{{TITLE}}}
\\author{{{AUTHOR}}}
\\date{{{DATE}}}

\\begin{document}
\\maketitle

\\begin{abstract}
{{ABSTRACT}}
\\end{abstract}

\\section{Introduction}
{{INTRODUCTION}}

\\section{Method}
{{METHOD}}

\\section{Results}
{{RESULTS}}

\\section{Discussion}
{{DISCUSSION}}

\\bibliographystyle{apacite}
\\bibliography{references}

\\end{document}`,

    ieee_technical: `\\documentclass[conference]{IEEEtran}
\\usepackage{cite}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{algorithmic}  
\\usepackage{graphicx}
\\usepackage{textcomp}

\\title{{{TITLE}}}
\\author{
\\IEEEauthorblockN{{{AUTHOR}}}
\\IEEEauthorblockA{{{AFFILIATION}}}
}

\\begin{document}
\\maketitle

\\begin{abstract}
{{ABSTRACT}}
\\end{abstract}

\\section{Introduction}
{{INTRODUCTION}}

\\section{Methodology}
{{METHODOLOGY}}

\\section{Results and Analysis}
{{RESULTS}}

\\section{Conclusion}
{{CONCLUSION}}

\\begin{thebibliography}{1}
{{BIBLIOGRAPHY}}
\\end{thebibliography}

\\end{document}`
};

const SAMPLE_API_RESPONSES = {
    semantic_scholar: {
        papers: [
            {
                paperId: "649def34f8be52c8b66281af98ae884c09aef38b",
                title: "Attention is All You Need",
                authors: [
                    { name: "Ashish Vaswani", authorId: "2232742" },
                    { name: "Noam Shazeer", authorId: "2099536" }
                ],
                year: 2017,
                citationCount: 45678,
                abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...",
                venue: "NIPS",
                url: "https://arxiv.org/abs/1706.03762"
            }
        ]
    },
    arxiv: {
        entries: [
            {
                id: "1706.03762",
                title: "Attention Is All You Need",
                authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar"],
                summary: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration...",
                published: "2017-06-12",
                updated: "2017-06-12",
                category: "cs.CL",
                pdf_url: "http://arxiv.org/pdf/1706.03762v5"
            }
        ]
    },
    crossref: {
        works: [
            {
                DOI: "10.1000/sample.doi.2023",
                title: ["Sample Research Article"],
                author: [
                    { given: "John", family: "Smith", ORCID: "0000-0000-0000-0000" }
                ],
                "container-title": ["Sample Journal"],
                published: { "date-parts": [[2023, 6, 15]] },
                volume: "10",
                issue: "2",
                page: "123-145",
                publisher: "Sample Publisher"
            }
        ]
    }
};

const SAMPLE_ERROR_SCENARIOS = {
    network_timeout: {
        code: "NETWORK_TIMEOUT",
        message: "Request timed out after 30 seconds",
        type: "temporary"
    },
    api_rate_limit: {
        code: "RATE_LIMIT_EXCEEDED", 
        message: "API rate limit exceeded. Please try again later.",
        type: "temporary",
        retry_after: 60
    },
    invalid_pdf: {
        code: "INVALID_PDF",
        message: "File is not a valid PDF document",
        type: "permanent"
    },
    missing_api_key: {
        code: "MISSING_API_KEY",
        message: "API key required but not provided", 
        type: "configuration"
    }
};

module.exports = {
    SAMPLE_RESEARCH_PAPERS,
    SAMPLE_LITERATURE_SEARCH_QUERIES,
    SAMPLE_PDF_METADATA,
    SAMPLE_OCR_CONTENT,
    SAMPLE_CITATIONS,
    SAMPLE_LATEX_TEMPLATES,
    SAMPLE_API_RESPONSES,
    SAMPLE_ERROR_SCENARIOS
};