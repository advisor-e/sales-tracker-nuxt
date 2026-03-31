const OpenAI = require('openai')
const { dedupeParagraphs } = require('./text')

function getClient() {
  const key = String(process.env.OPENAI_API_KEY || '').trim()
  if (!key) return null
  return new OpenAI({ apiKey: key })
}

function buildDraftTemplate(payload) {
  const principleBlock = payload.principles
    .filter((p) => p.title.trim() || p.details.some((d) => d.trim()))
    .slice(0, 3)
    .map((p, index) => {
      const detailLines = p.details
        .filter((d) => d.trim())
        .slice(0, 3)
        .map((d) => `- ${d}`)
        .join('\n')
      return `## Principle ${index + 1}: ${p.title || 'Practical focus'}\n${detailLines}`
    })
    .join('\n\n')

  return dedupeParagraphs(
    `# ${payload.topic}: Practical guide for ${payload.audience}\n\nThis outline is focused on ${payload.objective.toLowerCase()}.\n\n${principleBlock}\n\n## Final takeaway\n${payload.cta}.`
  )
}

function buildFinalTemplate(payload) {
  return dedupeParagraphs(
    `# ${payload.topic}\n\n${payload.outlineText}\n\nIn summary, the key objective is ${payload.objective.toLowerCase()}. ${payload.cta}.`
  )
}

async function generateDraft(payload) {
  const client = getClient()
  if (!client) {
    return { text: buildDraftTemplate(payload), source: 'template', error: 'OpenAI key not configured' }
  }

  const principleLines = payload.principles
    .map((p, i) => {
      const details = p.details.filter(Boolean).map((d) => `  - ${d}`).join('\n')
      return `Section ${i + 1}: ${p.title}\n${details}`
    })
    .join('\n')

  const authorLine = payload.author ? `\nAuthor: ${payload.author}` : ''
  const wordCountLine = payload.wordCount ? `\nTarget word count: ${payload.wordCount} words` : ''
  const referencesLine = payload.references ? `\n\nReference materials to incorporate:\n${payload.references}` : ''

  const system = 'You are an expert financial content writer producing substantive markdown blog outlines. When reference materials are provided, incorporate their key insights and information into the outline.'
  const user = `Create a blog outline in markdown.\nTopic: ${payload.topic}\nAudience: ${payload.audience}\nObjective: ${payload.objective}\nTone: ${payload.tone}\nLength: ${payload.length}${wordCountLine}${authorLine}\nCTA: ${payload.cta}\n\nUse these principles:\n${principleLines}${referencesLine}`

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 1800,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })

    const text = dedupeParagraphs(response.choices[0]?.message?.content || '').trim()
    if (!text) {
      return { text: buildDraftTemplate(payload), source: 'template', error: 'Empty AI response' }
    }
    return { text, source: 'ai' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return { text: buildDraftTemplate(payload), source: 'template', error: msg }
  }
}

async function generateFinal(payload) {
  const client = getClient()
  if (!client) {
    return { text: buildFinalTemplate(payload), source: 'template', error: 'OpenAI key not configured' }
  }

  let wordCountInstruction = ''
  if (payload.wordCount) {
    const match = payload.wordCount.match(/(\d+)/)
    const minWords = match ? parseInt(match[1], 10) : 0
    if (minWords > 0) {
      wordCountInstruction = `\n\nWORD COUNT REQUIREMENT (CRITICAL): The article MUST be at least ${minWords} words. This is a hard minimum - do not submit anything shorter. Expand each section with relevant details, examples, and practical insights to meet this requirement. Target range: ${payload.wordCount} words.`
    }
  }
  const instructionsLine = payload.aiInstructions?.trim()
    ? `\n\nSpecial Instructions:\n${payload.aiInstructions}`
    : ''
  const system = 'You are an elite financial content writer. Convert outlines into polished markdown articles. CRITICAL: You must meet the specified word count minimum - this is non-negotiable. Expand content with substantive details, real-world examples, and actionable insights to reach the target length. Pay careful attention to any special instructions provided.'
  const user = `Turn this outline into a complete markdown article.\nTopic: ${payload.topic}\nAudience: ${payload.audience}\nObjective: ${payload.objective}\nTone: ${payload.tone}\nPolish level: ${payload.polishLevel}\nCTA: ${payload.cta}${wordCountInstruction}${instructionsLine}\n\nOutline:\n${payload.outlineText}`

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.65,
      max_tokens: 3500,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })

    const text = dedupeParagraphs(response.choices[0]?.message?.content || '').trim()
    if (!text) {
      return { text: buildFinalTemplate(payload), source: 'template', error: 'Empty AI response' }
    }
    return { text, source: 'ai' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return { text: buildFinalTemplate(payload), source: 'template', error: msg }
  }
}

module.exports = { generateDraft, generateFinal }
