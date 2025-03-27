import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const enum ART_STYLE {
  POKEMON_CHARACTER = "Pokemon Character",
  PRODUCT_PHOTO = "Product Photo",
  DESIGN_MOCKUP = "Design Mockup",
  YOUTUBE_THUMBNAIL = "YouTube Thumbnail",
  ALBUM_COVER = "Album Cover",
  CLOTHING_MODEL = "Clothing Model",
}

export const ART_STYLE_OPTIONS = [
  { value: ART_STYLE.CLOTHING_MODEL, label: "Clothing Model" },
  { value: ART_STYLE.YOUTUBE_THUMBNAIL, label: "YouTube Thumbnail" },
  { value: ART_STYLE.PRODUCT_PHOTO, label: "Product Photo" },
  // { value: ART_STYLE.DESIGN_MOCKUP, label: "Design Mockup" },
  { value: ART_STYLE.ALBUM_COVER, label: "Album Cover" },
  { value: ART_STYLE.POKEMON_CHARACTER, label: "Pokemon Character" },
]

export function generateArtStyle(artStyle: string) {
  switch (artStyle) {
    case ART_STYLE.POKEMON_CHARACTER:
      return `
        Generate a character in the style of the original Pokémon anime. 
        The figure should resemble a unique, original Pokémon with distinct color patterns, elemental features (e.g., fire, water, electric), and a memorable silhouette. 
        The pose should be expressive and dynamic. 
        Include an immersive environment as the background, such as a forest, mountain, or battlefield, matching the character’s type.
        The final image should look like a still frame from the TV show, with sharp outlines, rich saturation, and cel-shaded lighting.
      `.trim()

    case ART_STYLE.PRODUCT_PHOTO:
      return `
        Generate a high-quality, photorealistic product photo. 
        The product should be centered, well-lit with clean studio lighting, and appear premium and elegant. 
        Use a white or soft gradient background, blurred if necessary to make the product pop. 
        Emphasize texture, shadows, and reflections to give depth.
        Capture the look of a modern e-commerce product display image or a luxury brand ad shot.
      `.trim()

    case ART_STYLE.DESIGN_MOCKUP:
      return `
        Create a modern, polished design mockup based on the provided structure. 
        Use clean lines, professional layout conventions, and contemporary fonts. 
        Simulate a UI/UX presentation you’d expect from a top-tier design agency. 
        If color themes or branding are detected, integrate them consistently across headers, buttons, and backgrounds.
        The layout should follow UX best practices with clear hierarchy, alignment, and white space.
        Show the design inside a device frame if appropriate (e.g., browser or phone screen).
        If short squiggles in the image, assume its text and make it readable.
      `.trim()
    case ART_STYLE.YOUTUBE_THUMBNAIL:
      return `
        Design a compelling YouTube thumbnail using the provided layout or image as a base.
        Use bold colors, dramatic lighting, and strong contrast to grab attention.
        Include a central subject or character with expressive emotion or action.
        Add large, legible text if space allows—preferably 3–5 impactful words.
        The final result should look like a professional, click-optimized thumbnail for a popular tech or entertainment channel.
        In the style of a Mr. Beast thumbnail.
      `.trim()
    case ART_STYLE.ALBUM_COVER:
      return `
    Generate a bold, stylized album cover for a fictional music album. 
    The design should feel like professional cover art you’d find on Spotify or Apple Music. 
    Use dramatic lighting, strong contrast, and a clear focal point in the composition. 
    Include abstract or surreal visual elements that reflect emotion, mood, or concept. 
    Optionally include a band or artist name and album title, styled tastefully in modern typography. 
        The artwork should be square format, eye-catching, and expressive of the genre (e.g., synthwave, lo-fi, experimental, etc.) if hinted at.
      `.trim()
    case ART_STYLE.CLOTHING_MODEL:
      return `
        Generate a high-quality, photorealistic clothing model photo wearing the provided clothing in the image or sketch.
        The model should be positioned in a natural, flattering pose that showcases the garment details.
        Use professional studio lighting with soft shadows to highlight fabric textures and design elements.
        Include a clean, minimalist background that doesn't distract from the clothing.
        The final image should resemble a premium fashion e-commerce product shot with realistic skin tones,
        proper fit, and natural draping of the fabric. Add subtle environmental context if appropriate
        (e.g., urban setting for streetwear, elegant interior for formal attire).
      `.trim()
    default:
      return artStyle
  }
}
