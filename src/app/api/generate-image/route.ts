import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { ART_STYLE } from "../../../lib/utils"

interface GenerateImageRequest {
    imageData: string
    instructions: string
    artStyle: string
}

export async function POST(request: NextRequest) {
    try {
        // Parse the request body
        const body: GenerateImageRequest = await request.json()
        const { imageData, instructions, artStyle } = body

        if (!imageData) {
            return NextResponse.json(
                { error: "Image data is required" },
                { status: 400 }
            )
        }

        // Get the base64 part of the data URL
        const base64Data = imageData.split(',')[1] || imageData

        // Prepare the Gemini API request
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set")
            return NextResponse.json(
                { error: "API configuration error" },
                { status: 500 }
            )
        }

        // Initialize the Google Generative AI client
        const genAI = new GoogleGenerativeAI(apiKey)

        // Format the prompt based on the art style and instructions
        const textPrompt = `Create an image in the following style: ${generateArtStyle(artStyle)}
        ${instructions ? `. Additional instructions: ${instructions}` : ''}`

        // Get the Gemini model with image generation capabilities
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp-image-generation",
            // Use as-is with type assertion since the SDK might not have updated types
            generationConfig: {
                // temperature: 0.4,
                // topP: 1,
                // topK: 32,
                // maxOutputTokens: 4096,
                // @ts-expect-error - This is supported by the API but may not be in the types yet
                // numberOfImages: 1,
                responseModalities: ["Text", "Image"]
            },
        })

        // Prepare the content with text prompt and the input image
        const content = [
            { text: textPrompt },
            {
                inlineData: {
                    mimeType: "image/png",
                    data: base64Data
                }
            }
        ]

        // Generate content
        const response = await model.generateContent(content)
        const result = response.response

        // Collect images and text from the response
        const images: string[] = []
        const textResponses: string[] = []

        // Process each part of the response with null check
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts) {
            for (const part of result.candidates[0].content.parts) {
                if (part.text) {
                    textResponses.push(part.text)
                } else if (part.inlineData) {
                    const imageData = part.inlineData.data
                    images.push(`data:${part.inlineData.mimeType};base64,${imageData}`)
                }
            }
        }

        // If no images were generated but the API call was successful
        if (images.length === 0) {
            // This might happen if the model chose to respond with text only
            return NextResponse.json({
                images: [],
                textResponses,
                message: "No images were generated. You may need to be more explicit in your instructions or try a different prompt."
            })
        }

        return NextResponse.json({
            images,
            textResponses: textResponses.length > 0 ? textResponses : undefined
        })
    } catch (error) {
        console.error("Error processing request:", error)
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        )
    }
}

function generateArtStyle(artStyle: string) {
    switch (artStyle) {
        case ART_STYLE.POKEMON_CHARACTER:
            return `a pokemon character in the style of the original artwork of the Pokemon anime. 
                It should have an appropriate environment background, as it were a still frame from the show.`
        default:
            return artStyle
    }
}
