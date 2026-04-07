import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { text, imageBase64 } = await request.json()

    if (!text && !imageBase64) {
      return NextResponse.json(
        { error: 'Either text or image is required' },
        { status: 400 }
      )
    }

    const prompt = `You are a receipt parsing assistant. Parse the following receipt text and extract expense information in JSON format.

Receipt text:
${text || 'Image provided - please describe what you see'}

Extract the following information and return ONLY valid JSON (no markdown, no code blocks):
{
  "description": "Brief description of the expense (e.g., 'Dinner at Restaurant Name')",
  "amount": 0.00,
  "category": "One of: food_dining, transportation, entertainment, utilities, shopping, travel, healthcare, other",
  "date": "YYYY-MM-DD format or null if not found",
  "merchant": "Name of the business/merchant if found",
  "items": [
    {
      "name": "Item name",
      "quantity": 1,
      "price": 0.00
    }
  ],
  "tax": 0.00,
  "tip": 0.00,
  "confidence": 0.0 to 1.0
}

If you cannot determine a field, use null. For amount, use the total if available.`

    const { text: response } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
      maxTokens: 1000,
    })

    // Parse the JSON response
    let parsedData
    try {
      // Clean the response - remove any markdown code blocks
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      parsedData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('Failed to parse AI response:', response)
      return NextResponse.json(
        { error: 'Failed to parse receipt data', raw: response },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
    })
  } catch (error: any) {
    console.error('Receipt parsing error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to parse receipt' },
      { status: 500 }
    )
  }
}



