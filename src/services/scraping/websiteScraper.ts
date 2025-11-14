/**
 * Website Scraper Service
 * Fetches and analyzes website content for brand analysis
 */

export interface WebsiteData {
  url: string
  html: string
  metadata: {
    title: string
    description: string
    keywords: string[]
  }
  content: {
    headings: string[]
    paragraphs: string[]
    links: string[]
    images: string[]
  }
  design: {
    colors: string[]
    fonts: string[]
    logo?: string
  }
  structure: {
    sections: string[]
    navigation: string[]
  }
}

/**
 * Scrape a website and extract structured data
 */
export async function scrapeWebsite(domain: string): Promise<WebsiteData> {
  console.log('[websiteScraper] Starting scrape for:', domain)

  try {
    // Ensure domain has protocol
    const url = domain.startsWith('http') ? domain : `https://${domain}`

    console.log('[websiteScraper] Fetching:', url)

    // Try multiple CORS proxies for client-side fetching
    // In production, this should be a backend service
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://cors-anywhere.herokuapp.com/${url}`
    ]

    let response: Response | null = null
    let lastError: Error | null = null

    // Try each proxy until one works
    for (const proxyUrl of proxies) {
      try {
        console.log('[websiteScraper] Trying proxy:', proxyUrl.split('?')[0])
        response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html',
          },
        })
        if (response.ok) {
          console.log('[websiteScraper] Proxy successful:', proxyUrl.split('?')[0])
          break
        }
      } catch (err) {
        lastError = err as Error
        console.log('[websiteScraper] Proxy failed, trying next...')
        continue
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error('All proxies failed')
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    console.log('[websiteScraper] HTML fetched, length:', html.length)

    // Parse HTML using DOMParser (built-in browser API)
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Extract metadata
    const metadata = extractMetadata(doc)
    console.log('[websiteScraper] Metadata extracted:', metadata)

    // Extract content
    const content = extractContent(doc)
    console.log('[websiteScraper] Content extracted:', {
      headings: content.headings.length,
      paragraphs: content.paragraphs.length,
      links: content.links.length,
      images: content.images.length,
    })

    // Extract design elements
    const design = extractDesign(doc, url)
    console.log('[websiteScraper] Design extracted:', design)

    // Extract structure
    const structure = extractStructure(doc)
    console.log('[websiteScraper] Structure extracted:', structure)

    return {
      url,
      html,
      metadata,
      content,
      design,
      structure,
    }
  } catch (error) {
    console.error('[websiteScraper] Error:', error)
    throw new Error(`Website scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract metadata from HTML document
 */
function extractMetadata(doc: Document): WebsiteData['metadata'] {
  const title = doc.querySelector('title')?.textContent || ''

  const descriptionMeta = doc.querySelector('meta[name="description"]') ||
                         doc.querySelector('meta[property="og:description"]')
  const description = descriptionMeta?.getAttribute('content') || ''

  const keywordsMeta = doc.querySelector('meta[name="keywords"]')
  const keywordsContent = keywordsMeta?.getAttribute('content') || ''
  const keywords = keywordsContent.split(',').map(k => k.trim()).filter(Boolean)

  return {
    title,
    description,
    keywords,
  }
}

/**
 * Extract content from HTML document
 */
function extractContent(doc: Document): WebsiteData['content'] {
  // Get all headings
  const headings: string[] = []
  doc.querySelectorAll('h1, h2, h3').forEach(h => {
    const text = h.textContent?.trim()
    if (text) headings.push(text)
  })

  // Get paragraphs
  const paragraphs: string[] = []
  doc.querySelectorAll('p').forEach(p => {
    const text = p.textContent?.trim()
    if (text && text.length > 20) { // Only meaningful paragraphs
      paragraphs.push(text)
    }
  })

  // Get links
  const links: string[] = []
  doc.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href')
    const text = a.textContent?.trim()
    if (text && href) {
      links.push(text)
    }
  })

  // Get images
  const images: string[] = []
  doc.querySelectorAll('img[src]').forEach(img => {
    const src = img.getAttribute('src')
    const alt = img.getAttribute('alt')
    if (src) {
      images.push(alt || src)
    }
  })

  return {
    headings: headings.slice(0, 20), // Top 20 headings
    paragraphs: paragraphs.slice(0, 30), // Top 30 paragraphs
    links: links.slice(0, 50), // Top 50 links
    images: images.slice(0, 20), // Top 20 images
  }
}

/**
 * Extract design elements (colors, fonts, logo)
 */
function extractDesign(doc: Document, url: string): WebsiteData['design'] {
  const colors: string[] = []
  const fonts: string[] = []
  let logo: string | undefined

  // Try to find logo
  const logoImg = doc.querySelector('img[alt*="logo" i], img[class*="logo" i], .logo img, header img') as HTMLImageElement
  if (logoImg?.src) {
    logo = new URL(logoImg.src, url).href
  }

  // Extract colors from inline styles (basic extraction)
  const colorRegex = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi
  const bodyHTML = doc.body?.innerHTML || ''
  const colorMatches = bodyHTML.match(colorRegex)
  if (colorMatches) {
    const uniqueColors = [...new Set(colorMatches)]
    colors.push(...uniqueColors.slice(0, 10))
  }

  // Extract font families from computed styles (limited in cross-origin context)
  // We'll make educated guesses from common patterns
  const fontRegex = /font-family:\s*([^;}"']+)/gi
  const fontMatches = [...bodyHTML.matchAll(fontRegex)]
  const uniqueFonts = new Set<string>()

  fontMatches.forEach(match => {
    const fontFamily = match[1].trim().split(',')[0].replace(/['"]/g, '')
    if (fontFamily && !fontFamily.includes('inherit') && !fontFamily.includes('initial')) {
      uniqueFonts.add(fontFamily)
    }
  })

  fonts.push(...Array.from(uniqueFonts).slice(0, 5))

  // If no colors found, use defaults
  if (colors.length === 0) {
    colors.push('#2563eb', '#7c3aed', '#059669', '#f59e0b')
  }

  // If no fonts found, use defaults
  if (fonts.length === 0) {
    fonts.push('Inter', 'Roboto', 'Open Sans')
  }

  return {
    colors,
    fonts,
    logo,
  }
}

/**
 * Extract structure (sections, navigation)
 */
function extractStructure(doc: Document): WebsiteData['structure'] {
  const sections: string[] = []
  const navigation: string[] = []

  // Get section headings
  doc.querySelectorAll('section, article, main').forEach(section => {
    const heading = section.querySelector('h1, h2, h3')
    if (heading?.textContent) {
      sections.push(heading.textContent.trim())
    }
  })

  // Get navigation links
  doc.querySelectorAll('nav a, header a').forEach(a => {
    const text = a.textContent?.trim()
    if (text && text.length < 50) { // Reasonable nav link length
      navigation.push(text)
    }
  })

  return {
    sections: sections.slice(0, 10),
    navigation: [...new Set(navigation)].slice(0, 15),
  }
}
