import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const enum ART_STYLE {
  POKEMON_CHARACTER = "Pokemon Character",
  PRODUCT_PHOTO = "Product Photo",
  ANIME_STYLE = "Anime Style",
  PIXEL_ART = "Pixel Art",
  REALISTIC = "Realistic",
  CHIBI = "Chibi",
  WATERCOLOR = "Watercolor",
  SKETCH = "Sketch",
}

export const ART_STYLE_OPTIONS = [
  { value: ART_STYLE.POKEMON_CHARACTER, label: "Pokemon Character" },
  { value: ART_STYLE.PRODUCT_PHOTO, label: "Product Photo" },
  { value: ART_STYLE.ANIME_STYLE, label: "Anime Style" },
  { value: ART_STYLE.PIXEL_ART, label: "Pixel Art" },
  { value: ART_STYLE.REALISTIC, label: "Realistic" },
  { value: ART_STYLE.CHIBI, label: "Chibi" },
  { value: ART_STYLE.WATERCOLOR, label: "Watercolor" },
  { value: ART_STYLE.SKETCH, label: "Sketch" },
]