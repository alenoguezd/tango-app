import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { image, mediaType } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Validate and normalize media type
    const validMediaTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    let normalizedMediaType = (mediaType || "image/jpeg").toLowerCase();

    if (!validMediaTypes.includes(normalizedMediaType)) {
      console.warn(`Invalid media type: ${mediaType}, defaulting to image/jpeg`);
      normalizedMediaType = "image/jpeg";
    }

    // Clean base64 data (remove any whitespace)
    const cleanBase64 = image.replace(/\s/g, "");

    console.log(`Processing image with media type: ${normalizedMediaType}`);
    console.log(`Base64 data length: ${cleanBase64.length}`);

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system:
        "You are a vocabulary extractor. Analyze this Japanese language textbook image and extract all vocabulary as a JSON array with fields: kana, kanji, spanish, example_usage. Return ONLY valid JSON, no markdown.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: normalizedMediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: cleanBase64,
              },
            },
            {
              type: "text",
              text: "Extract all vocabulary from this image.",
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    let rawText = content.text.trim();
    console.log("Claude raw response:", rawText);

    // Extract JSON from markdown code blocks if present
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      rawText = jsonMatch[1].trim();
      console.log("Extracted JSON from markdown:", rawText);
    }

    // Try to find JSON array or object if still wrapped with extra text
    const jsonArrayMatch = rawText.match(/\[[\s\S]*\]/);
    const jsonObjectMatch = rawText.match(/\{[\s\S]*\}/);

    if (jsonArrayMatch) {
      rawText = jsonArrayMatch[0];
      console.log("Extracted JSON array:", rawText);
    } else if (jsonObjectMatch) {
      rawText = jsonObjectMatch[0];
      console.log("Extracted JSON object:", rawText);
    }

    const vocabulary = JSON.parse(rawText);

    return NextResponse.json({ vocabulary });
  } catch (error) {
    console.error("Error processing image:", error);

    if (error instanceof SyntaxError) {
      console.error("JSON parsing error:", error.message);
      return NextResponse.json(
        {
          error: "Failed to parse vocabulary from Claude response",
          details: (error as Error).message
        },
        { status: 500 }
      );
    }

    if (error instanceof Error) {
      const errorMessage = error.message;
      console.error("Error message:", errorMessage);

      // Check for Anthropic API-specific errors
      if (errorMessage.includes("Could not process image")) {
        return NextResponse.json(
          {
            error: "Failed to process image - please ensure it's a valid image file (JPEG, PNG, GIF, or WebP)",
            details: "The image format may be corrupted or unsupported"
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
