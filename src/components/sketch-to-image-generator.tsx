"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Upload, Eraser, Loader2, Sparkles, AlertCircle, RefreshCw, Droplet, Undo } from "lucide-react"
import { toast } from "sonner"
import { ART_STYLE } from "../lib/utils"

const artStyles = [
  { value: ART_STYLE.POKEMON_CHARACTER, label: "Pokemon Character" },
  { value: "product-ad", label: "Product Ad" },
  { value: "anime-style", label: "Anime Style" },
  { value: "pixel-art", label: "Pixel Art" },
  { value: "realistic", label: "Realistic" },
  { value: "chibi", label: "Chibi" },
  { value: "watercolor", label: "Watercolor" },
  { value: "sketch", label: "Sketch" },
]

const drawingColors = [
  { value: "#000000", label: "Black", tailwindClass: "bg-black" },
  { value: "#ffffff", label: "White", tailwindClass: "bg-white" },
  { value: "#ff0000", label: "Red", tailwindClass: "bg-red-500" },
  { value: "#0000ff", label: "Blue", tailwindClass: "bg-blue-500" },
  { value: "#008000", label: "Green", tailwindClass: "bg-green-500" },
  { value: "#800080", label: "Purple", tailwindClass: "bg-purple-500" },
  { value: "#ffa500", label: "Orange", tailwindClass: "bg-orange-500" },
  { value: "#ffff00", label: "Yellow", tailwindClass: "bg-yellow-400" },
  { value: "#964B00", label: "Brown", tailwindClass: "bg-amber-800" },
  { value: "#00FFFF", label: "Cyan", tailwindClass: "bg-cyan-400" },
]

type DrawingTool = "brush" | "eraser" | "bucket"
type DrawingState = {
  dataUrl: string,
  color: string,
  lineWidth: number,
  tool: DrawingTool
}

// Add this interface near the top of the file, with the other interfaces
interface WindowWithJustUndid extends Window {
  __justUndid?: boolean;
}

export default function SketchToImageGenerator() {
  console.log("🔄 Component render");

  const [isDrawing, setIsDrawing] = useState(false)
  const [artStyle, setArtStyle] = useState("pokemon-character")
  const [additionalInstructions, setAdditionalInstructions] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("draw")
  const [error, setError] = useState<string | null>(null)
  const [currentColor, setCurrentColor] = useState("#000000")
  const [lineWidth, setLineWidth] = useState(3)
  const [activeTool, setActiveTool] = useState<DrawingTool>("brush")
  const [undoStack, setUndoStack] = useState<DrawingState[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastToolClickRef = useRef<number>(0)
  const componentMountedRef = useRef(true)
  const lastCanvasImageRef = useRef<string | null>(null)
  const isFirstRenderRef = useRef(true)

  // Track component unmounting
  useEffect(() => {
    console.log("🟢 Component mounted");
    const isFirstRender = isFirstRenderRef.current;

    // Create initial blank state if needed
    if (undoStack.length === 0 && !isFirstRender) {
      console.log("📝 Creating initial blank canvas state for undo stack");
      const canvas = canvasRef.current;
      if (canvas) {
        const initialState: DrawingState = {
          dataUrl: canvas.toDataURL(),
          color: currentColor,
          lineWidth: lineWidth,
          tool: activeTool
        };
        setUndoStack([initialState]);
      }
    }

    // Not the first render and we have a saved canvas state, restore it
    if (!isFirstRender && lastCanvasImageRef.current) {
      console.log("🔄 Restoring canvas from previous mount");

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            // We need to wait for the canvas to be fully initialized
            setTimeout(() => {
              if (ctx && canvas) {
                console.log("🖼️ Redrawing saved canvas state");
                // First clear the canvas
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                // Then draw the saved image
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Reset drawing context settings
                ctx.strokeStyle = activeTool === "eraser" ? "#ffffff" : currentColor;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = "round";

                // Important: DON'T restore to undoStack if we just performed an undo
                // Check if window.__justUndid is true (it's set in handleUndo)
                const customWindow = window as WindowWithJustUndid;
                const justUndid = customWindow.__justUndid === true;
                if (undoStack.length === 0 && !justUndid) {
                  console.log("📚 Restoring undo stack with current state");

                  // Create blank white canvas for initial state
                  const blankCanvas = document.createElement('canvas');
                  blankCanvas.width = canvas.width;
                  blankCanvas.height = canvas.height;
                  const blankCtx = blankCanvas.getContext('2d');
                  if (blankCtx) {
                    blankCtx.fillStyle = "#ffffff";
                    blankCtx.fillRect(0, 0, blankCanvas.width, blankCanvas.height);

                    // Create initial state and current state
                    const initialState: DrawingState = {
                      dataUrl: blankCanvas.toDataURL(),
                      color: currentColor,
                      lineWidth: lineWidth,
                      tool: activeTool
                    };

                    const currentState: DrawingState = {
                      dataUrl: lastCanvasImageRef.current!,
                      color: currentColor,
                      lineWidth: lineWidth,
                      tool: activeTool
                    };

                    // Set the undo stack with both states
                    setUndoStack([initialState, currentState]);
                  }
                } else if (justUndid) {
                  console.log("⚠️ Skipping undo stack restoration because we just performed an undo");
                  // Reset the flag
                  customWindow.__justUndid = false;
                }
              }
            }, 0);
          };
          img.src = lastCanvasImageRef.current;
        }
      }
    }

    isFirstRenderRef.current = false;

    // Debug key handler
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        console.log("🔍 DEBUG INFO DUMP");
        console.log("------------------");
        console.log(`Canvas ref exists: ${!!canvasRef.current}`);

        if (canvasRef.current) {
          const canvas = canvasRef.current;
          console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}`);

          try {
            // Get a small sample of canvas data to see if it's valid
            const ctx = canvas.getContext('2d');
            const sample = ctx?.getImageData(0, 0, 10, 10);
            console.log(`Canvas data sample valid: ${!!sample}`);

            // Log current drawing settings
            console.log(`Current tool: ${activeTool}`);
            console.log(`Current color: ${currentColor}`);
            console.log(`Line width: ${lineWidth}`);
            console.log(`Is drawing: ${isDrawing}`);

            // Log undo stack info
            console.log(`Undo stack size: ${undoStack.length}`);
            console.log("Undo stack summary:", undoStack.map((state, i) => ({
              index: i,
              color: state.color,
              tool: state.tool,
              dataUrlLength: state.dataUrl.length
            })));

            // Take a snapshot
            const dataUrl = canvas.toDataURL();
            console.log("Current canvas state captured, data URL length:", dataUrl.length);
          } catch (err) {
            console.error("Error accessing canvas data:", err);
          }
        }
        console.log("------------------");
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      console.log("🔴 Component unmounting");

      // Save current canvas state before unmounting
      if (canvasRef.current) {
        try {
          console.log("💾 Saving canvas state before unmount");
          lastCanvasImageRef.current = canvasRef.current.toDataURL();
        } catch (err) {
          console.error("Error saving canvas state on unmount:", err);
        }
      }

      componentMountedRef.current = false;
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [activeTool, currentColor, lineWidth, isDrawing, undoStack]);

  // Save current canvas state for undo - memoized with useCallback
  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.log("❌ Cannot save canvas state - no canvas reference")
      return
    }

    console.log(`📸 Saving canvas state (${canvas.width}x${canvas.height})`)

    try {
      const dataUrl = canvas.toDataURL()
      console.log(`💾 Canvas data URL length: ${dataUrl.length} chars`)

      const newState: DrawingState = {
        dataUrl,
        color: currentColor,
        lineWidth: lineWidth,
        tool: activeTool
      }

      setUndoStack(prevStack => {
        const newStack = [...prevStack, newState]
        console.log(`📚 Updated undo stack: ${newStack.length} states`)
        // Limit stack size to prevent memory issues
        if (newStack.length > 20) {
          return newStack.slice(1)
        }
        return newStack
      })
    } catch (error) {
      console.error("❌ Error saving canvas state:", error)
    }
  }, [currentColor, lineWidth, activeTool]);

  // Debug function to log undo stack
  const logUndoStack = () => {
    console.log("📊 UNDO STACK CONTENTS:");
    console.log(`Total states: ${undoStack.length}`);
    undoStack.forEach((state, index) => {
      console.log(`State ${index}: color=${state.color}, tool=${state.tool}, lineWidth=${state.lineWidth}, dataURL length=${state.dataUrl.length}`);
    });
  };

  // Undo last action
  const handleUndo = useCallback(() => {
    console.log("↩️ Undo requested");
    logUndoStack();

    if (undoStack.length === 0) {
      console.log("❌ Undo stack empty, nothing to undo")
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // If this is the first action, clear to white
    if (undoStack.length === 1) {
      console.log("⬜ First action, clearing to white")
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      setUndoStack([])

      // Set a global flag to indicate we just performed an undo
      // This will prevent the undo stack from being restored on remount
      const customWindow = window as WindowWithJustUndid;
      customWindow.__justUndid = true;

      // Update lastCanvasImageRef to blank white canvas
      const blankCanvas = document.createElement('canvas');
      blankCanvas.width = canvas.width;
      blankCanvas.height = canvas.height;
      const blankCtx = blankCanvas.getContext('2d');
      if (blankCtx) {
        blankCtx.fillStyle = "#ffffff";
        blankCtx.fillRect(0, 0, blankCanvas.width, blankCanvas.height);
        lastCanvasImageRef.current = blankCanvas.toDataURL();
      }
      return
    }

    // Get the previous state (excluding the most recent one)
    const previousState = undoStack[undoStack.length - 2]
    console.log(`🔙 Restoring to previous state (Stack position: ${undoStack.length - 2})`)
    console.log(`Previous state data URL length: ${previousState.dataUrl.length}`);

    // Load the previous canvas image
    const img = new Image()
    img.onload = () => {
      console.log("🖼️ Previous state loaded successfully")
      // Clear the canvas first
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // Draw the image at the correct dimensions
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Reset context settings to current tool settings (not the previous state's)
      ctx.strokeStyle = activeTool === "eraser" ? "#ffffff" : currentColor
      ctx.lineWidth = lineWidth
      ctx.lineCap = "round"
      console.log(`✅ Canvas restored to previous state, kept current tool settings`);

      // IMPORTANT: Update the lastCanvasImageRef with the new state to prevent flicker
      lastCanvasImageRef.current = previousState.dataUrl;

      // Set global flag to indicate we just performed an undo
      // This will prevent the undo stack from being restored incorrectly on remount
      const customWindow = window as WindowWithJustUndid;
      customWindow.__justUndid = true;
      console.log("🚩 Set __justUndid flag to prevent incorrect undo stack restoration");
    }
    img.onerror = (err) => {
      console.error("⚠️ Failed to load previous state image:", err)
    }
    img.src = previousState.dataUrl

    // Remove the most recent state
    setUndoStack(prevStack => prevStack.slice(0, -1))
  }, [undoStack, activeTool, currentColor, lineWidth]);

  // Initialize canvas - but don't clear it if we have a saved state
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    console.log("🎨 Initializing canvas")

    // Only clear if we don't have a saved image state to restore
    // The saved state will be handled by the component mounted effect
    if (!lastCanvasImageRef.current) {
      console.log("⬜ Setting white background (no previous state)");
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else {
      console.log("🔄 Skipping background clear - previous state exists");
    }

    // Set initial drawing style
    ctx.strokeStyle = activeTool === "eraser" ? "#ffffff" : currentColor
    ctx.lineWidth = lineWidth
    ctx.lineCap = "round"

    // Handle canvas resize to fix scaling issues
    function resizeCanvas() {
      if (!canvas) return

      console.log("📏 Resizing canvas - START")

      const context = canvas.getContext("2d")
      if (!context) {
        console.log("❌ Failed to get canvas context during resize")
        return
      }

      // Store the current drawing
      console.log(`📊 Current canvas dimensions: ${canvas.width}x${canvas.height}`)
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        console.log("🖼️ Storing current drawing in temp canvas")
        tempCtx.drawImage(canvas, 0, 0)
      } else {
        console.log("⚠️ Failed to get temp canvas context")
      }

      // Set the canvas display size to match its CSS size
      const rect = canvas.getBoundingClientRect()
      console.log(`📐 New canvas size: ${rect.width}x${rect.height}`)

      if (canvas.width === rect.width && canvas.height === rect.height) {
        console.log("ℹ️ Canvas already at correct size, skipping resize")
        return;
      }

      canvas.width = rect.width
      canvas.height = rect.height

      // Restore drawing
      console.log("🔄 Restoring drawing from temp canvas")
      context.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height)

      // Restore settings
      context.fillStyle = "#ffffff"
      context.strokeStyle = activeTool === "eraser" ? "#ffffff" : currentColor
      context.lineWidth = lineWidth
      context.lineCap = "round"

      console.log("📏 Resizing canvas - COMPLETE")
    }

    // Initial resize
    resizeCanvas()

    // Only save initial state if we don't have a saved state and undo stack is empty
    if (!lastCanvasImageRef.current && undoStack.length === 0) {
      console.log("⬜ Saving initial blank canvas state");

      // We need to wait a frame to ensure the canvas is fully initialized
      setTimeout(() => {
        saveCanvasState();
      }, 0);
    }

    // Handle window resize
    window.addEventListener('resize', resizeCanvas)

    console.log("✅ Canvas initialization complete")

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [currentColor, lineWidth, activeTool, saveCanvasState, undoStack.length])

  // Update drawing style when color or line width changes
  useEffect(() => {
    console.log(`🔄 Drawing style effect triggered: color=${currentColor}, lineWidth=${lineWidth}, tool=${activeTool}`);

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.strokeStyle = activeTool === "eraser" ? "#ffffff" : currentColor
    ctx.lineWidth = lineWidth
  }, [currentColor, lineWidth, activeTool])

  // Separated canvas event handlers to avoid event bubbling issues
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    console.log("🔄 Setting up canvas event handlers")

    // Define handlers within this effect
    const handleMouseDown = (e: MouseEvent) => {
      // Check if a tool button was clicked recently (within 100ms)
      const now = Date.now()
      const timeSinceLastToolClick = now - lastToolClickRef.current
      if (timeSinceLastToolClick < 100) {
        console.log(`⏱️ Ignoring mousedown - too soon after tool click (${timeSinceLastToolClick}ms)`)
        return
      }

      // Explicitly check if we're clicking on a button or inside a button
      const targetElement = e.target as HTMLElement;
      const targetPath = e.composedPath ? e.composedPath().map(el => (el as HTMLElement).tagName).join(' > ') : 'path not available';
      console.log(`🔍 MouseDown event path: ${targetPath}`);

      if (targetElement.tagName === 'BUTTON' ||
        targetElement.closest('button') ||
        e.target !== canvas) {
        console.log("🔘 Ignoring mousedown on button or non-canvas element:", targetElement.tagName)
        return;
      }

      console.log(`🖱️ Mouse down on canvas: tool=${activeTool}, drawing=${isDrawing}`)

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (activeTool === "bucket") {
        console.log(`🪣 Using paint bucket at (${x}, ${y})`)
        saveCanvasState()
        floodFill(Math.floor(x), Math.floor(y), currentColor)
        return
      }

      setIsDrawing(true)

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.beginPath()
      ctx.moveTo(x, y)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing || activeTool === "bucket" || e.target !== canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      ctx.lineTo(x, y)
      ctx.stroke()
    }

    const handleMouseUp = () => {
      if (isDrawing) {
        console.log("✍️ Drawing ended, saving state")
        saveCanvasState()
      }
      setIsDrawing(false)
    }

    const handleTouchStart = (e: TouchEvent) => {
      // Similarly check for touch events on buttons
      const targetElement = e.target as HTMLElement;
      if (targetElement.tagName === 'BUTTON' ||
        targetElement.closest('button') ||
        e.target !== canvas) {
        return;
      }

      e.preventDefault() // Prevent scrolling while drawing

      const rect = canvas.getBoundingClientRect()
      const x = e.touches[0].clientX - rect.left
      const y = e.touches[0].clientY - rect.top

      if (activeTool === "bucket") {
        saveCanvasState()
        floodFill(Math.floor(x), Math.floor(y), currentColor)
        return
      }

      setIsDrawing(true)

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.beginPath()
      ctx.moveTo(x, y)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDrawing || activeTool === "bucket" || e.target !== canvas) return
      e.preventDefault()

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      const x = e.touches[0].clientX - rect.left
      const y = e.touches[0].clientY - rect.top

      ctx.lineTo(x, y)
      ctx.stroke()
    }

    const handleTouchEnd = () => {
      if (isDrawing) {
        saveCanvasState()
      }
      setIsDrawing(false)
    }

    // Add event listeners directly to canvas element
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp) // Capture mouseup globally
    canvas.addEventListener('touchstart', handleTouchStart)
    canvas.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd) // Capture touchend globally

    console.log("✅ Canvas event handlers attached")

    // Clean up event listeners
    return () => {
      console.log("🧹 Cleaning up canvas event handlers")
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDrawing, activeTool, currentColor, lineWidth, saveCanvasState])

  // Separate useEffect to log state changes
  useEffect(() => {
    console.log(`📊 State change detected - activeTool: ${activeTool}`);
  }, [activeTool]);

  useEffect(() => {
    console.log(`📊 State change detected - currentColor: ${currentColor}`);
  }, [currentColor]);

  useEffect(() => {
    console.log(`📊 State change detected - lineWidth: ${lineWidth}`);
  }, [lineWidth]);

  useEffect(() => {
    console.log(`📊 State change detected - undoStack length: ${undoStack.length}`);
  }, [undoStack]);

  // Flood fill algorithm (paint bucket)
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    console.log(`🪣 Flood fill at (${startX}, ${startY}) with color ${fillColor}`)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Convert hex color to RGBA
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: 255
      } : { r: 0, g: 0, b: 0, a: 255 }
    }

    const fillRgb = hexToRgb(fillColor)

    // Get target color (the color we're replacing)
    const startPixelPos = (startY * canvas.width + startX) * 4
    const targetRgb = {
      r: data[startPixelPos],
      g: data[startPixelPos + 1],
      b: data[startPixelPos + 2],
      a: data[startPixelPos + 3]
    }

    // If target color is the same as fill color, do nothing
    if (
      targetRgb.r === fillRgb.r &&
      targetRgb.g === fillRgb.g &&
      targetRgb.b === fillRgb.b
    ) {
      console.log("⚠️ Target color is same as fill color, no change needed")
      return
    }

    console.log(`🎯 Replacing color RGB(${targetRgb.r},${targetRgb.g},${targetRgb.b}) with RGB(${fillRgb.r},${fillRgb.g},${fillRgb.b})`)

    // Basic queue-based flood fill
    const pixelStack = [[startX, startY]]
    const width = canvas.width
    const height = canvas.height

    const matchStartColor = (pixelPos: number) => {
      return (
        data[pixelPos] === targetRgb.r &&
        data[pixelPos + 1] === targetRgb.g &&
        data[pixelPos + 2] === targetRgb.b
      )
    }

    const colorPixel = (pixelPos: number) => {
      data[pixelPos] = fillRgb.r
      data[pixelPos + 1] = fillRgb.g
      data[pixelPos + 2] = fillRgb.b
      data[pixelPos + 3] = fillRgb.a
    }

    while (pixelStack.length > 0) {
      const newPos = pixelStack.pop()
      if (!newPos) continue

      const newX = newPos[0]
      let newY = newPos[1]

      let pixelPos = (newY * width + newX) * 4

      // Go up as long as the color matches and we're within the canvas
      let reachLeft = false
      let reachRight = false

      // Go up
      while (newY >= 0 && matchStartColor(pixelPos)) {
        pixelPos -= width * 4
        newY--
      }

      pixelPos += width * 4
      newY++

      // Go down
      while (newY < height && matchStartColor(pixelPos)) {
        colorPixel(pixelPos)

        if (newX > 0) {
          if (matchStartColor(pixelPos - 4)) {
            if (!reachLeft) {
              pixelStack.push([newX - 1, newY])
              reachLeft = true
            }
          } else if (reachLeft) {
            reachLeft = false
          }
        }

        if (newX < width - 1) {
          if (matchStartColor(pixelPos + 4)) {
            if (!reachRight) {
              pixelStack.push([newX + 1, newY])
              reachRight = true
            }
          } else if (reachRight) {
            reachRight = false
          }
        }

        pixelPos += width * 4
        newY++
      }
    }

    // Put the modified pixels back on the canvas
    ctx.putImageData(imageData, 0, 0)
    console.log("✅ Flood fill complete")
  }

  // Memoize tool change function to prevent unnecessary re-renders
  const setToolMemoized = useCallback((tool: DrawingTool) => {
    console.log(`🔧 Memoized tool change: ${tool}`);

    // Prevent unnecessary state updates
    if (tool === activeTool) return;

    console.log(`🔧 Changing tool from ${activeTool} to ${tool}`)

    // Update the tool state
    setActiveTool(tool);

    // Update drawing context based on the tool
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set appropriate stroke style based on tool
    if (tool === "eraser") {
      ctx.strokeStyle = "#ffffff"; // White for eraser
    } else {
      ctx.strokeStyle = currentColor;
    }
  }, [activeTool, currentColor]);

  // Memoize color change function
  const setColorMemoized = useCallback((color: string) => {
    console.log(`🎨 Memoized color change: ${color}`);

    // Prevent unnecessary state updates
    if (color === currentColor) return;

    setCurrentColor(color);

    // Update brush if using eraser
    if (activeTool === "eraser") {
      setToolMemoized("brush");
    }
  }, [currentColor, activeTool, setToolMemoized]);

  // Memoize line width change function
  const setLineWidthMemoized = useCallback((width: number) => {
    console.log(`📏 Memoized line width change: ${width}`);

    // Prevent unnecessary state updates
    if (width === lineWidth) return;

    setLineWidth(width);
  }, [lineWidth]);

  // Replace references to non-memoized functions
  const clearCanvas = useCallback(() => {
    console.log("🧼 Clearing canvas")
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Save state before clearing
    saveCanvasState()

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [saveCanvasState]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async () => {
    console.log("🚀 Submit request initiated");
    setIsLoading(true)
    setError(null)

    try {
      // Get image data
      let imageData
      if (activeTab === "draw") {
        imageData = canvasRef.current?.toDataURL("image/png")
        console.log("📸 Canvas data captured for submission");
      } else {
        imageData = uploadedImage
        console.log("📸 Uploaded image data used for submission");
      }

      if (!imageData) {
        console.error("❌ No image data available");
        throw new Error("No image data available")
      }

      console.log("📤 Sending API request with image data");
      // Call our API endpoint
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData,
          instructions: additionalInstructions,
          artStyle,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ API response error:", errorData);
        throw new Error(errorData.error || "Failed to generate images")
      }

      const data = await response.json()
      console.log(`✅ API response success: ${data.images?.length || 0} images received`);
      setResults(data.images || [])

      if (data.images?.length) {
        toast.success("Images generated successfully!")
      } else {
        toast.info("No images were generated. Try a different sketch or prompt.")
      }
    } catch (error) {
      console.error("❌ Error generating images:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
      toast.error("Failed to generate images. Please try again.")
    } finally {
      console.log("🏁 Submit request completed");
      setIsLoading(false)
    }
  }

  // Update when switching back to draw tab
  useEffect(() => {
    if (activeTab === "draw" && canvasRef.current && lastCanvasImageRef.current) {
      console.log("🔄 Switched to draw tab, ensuring canvas is rendered");

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // If we have a saved image, redraw it to ensure it's visible
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = lastCanvasImageRef.current;
      }
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="draw" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw">Draw Sketch</TabsTrigger>
          <TabsTrigger value="upload">Upload Image</TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="relative border border-border rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full h-[300px] md:h-[400px] touch-none bg-white"
                />
              </div>

              {/* Controls Panel */}
              <div className="flex flex-wrap gap-2 items-center mt-3" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                <div className="flex flex-wrap gap-1 items-center p-2 rounded-md border border-border">
                  <div className="flex flex-wrap gap-1">
                    {drawingColors.map(color => (
                      <button
                        key={color.value}
                        className={`w-8 h-8 rounded-md border ${currentColor === color.value && activeTool !== "eraser" ? 'ring-2 ring-zinc-300 ring-offset-1 ring-offset-zinc-800' : 'border-zinc-600'
                          } ${color.tailwindClass}`}
                        title={color.label}
                        onClick={(e) => {
                          console.log(`🎨 Color button clicked: ${color.label}`, e.target);
                          e.preventDefault();
                          e.stopPropagation();
                          lastToolClickRef.current = Date.now();
                          setColorMemoized(color.value);
                        }}
                        aria-label={`Select ${color.label} color`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-1 items-center p-2 rounded-md border border-border">
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded-md ${activeTool === "brush" ? 'bg-zinc-700' : ''} border border-zinc-600`}
                    onClick={(e) => {
                      console.log("🖌️ Brush button clicked", e.currentTarget, e.target);
                      e.preventDefault();
                      e.stopPropagation();
                      lastToolClickRef.current = Date.now();
                      setToolMemoized("brush");
                    }}
                    title="Brush"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: currentColor }}
                    />
                  </button>
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded-md ${activeTool === "eraser" ? 'bg-zinc-700' : ''} border border-zinc-600`}
                    onClick={(e) => {
                      console.log("🧹 Eraser button clicked", e.currentTarget, e.target);
                      e.preventDefault();
                      e.stopPropagation();
                      lastToolClickRef.current = Date.now();
                      setToolMemoized("eraser");
                    }}
                    title="Eraser"
                  >
                    <Eraser className="h-5 w-5 text-zinc-300" />
                  </button>
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded-md ${activeTool === "bucket" ? 'bg-zinc-700' : ''} border border-zinc-600`}
                    onClick={(e) => {
                      console.log("🪣 Paint bucket button clicked", e.currentTarget, e.target);
                      e.preventDefault();
                      e.stopPropagation();
                      lastToolClickRef.current = Date.now();
                      setToolMemoized("bucket");
                    }}
                    title="Fill"
                  >
                    <Droplet className="h-5 w-5 text-zinc-300" />
                  </button>
                </div>

                <div className="flex gap-1 items-center p-2 rounded-md border border-border">
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded-md ${lineWidth === 1 ? 'bg-zinc-700' : ''} border border-zinc-600`}
                    onClick={(e) => {
                      console.log("🔍 Thin line button clicked", e.currentTarget, e.target);
                      e.preventDefault();
                      e.stopPropagation();
                      lastToolClickRef.current = Date.now();
                      setLineWidthMemoized(1);
                    }}
                    title="Thin line"
                  >
                    <div className="w-4 h-[1px] bg-zinc-300"></div>
                  </button>
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded-md ${lineWidth === 3 ? 'bg-zinc-700' : ''} border border-zinc-600`}
                    onClick={(e) => {
                      console.log("📏 Medium line button clicked", e.currentTarget, e.target);
                      e.preventDefault();
                      e.stopPropagation();
                      lastToolClickRef.current = Date.now();
                      setLineWidthMemoized(3);
                    }}
                    title="Medium line"
                  >
                    <div className="w-4 h-[3px] bg-zinc-300"></div>
                  </button>
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded-md ${lineWidth === 5 ? 'bg-zinc-700' : ''} border border-zinc-600`}
                    onClick={(e) => {
                      console.log("📏 Thick line button clicked", e.currentTarget, e.target);
                      e.preventDefault();
                      e.stopPropagation();
                      lastToolClickRef.current = Date.now();
                      setLineWidthMemoized(5);
                    }}
                    title="Thick line"
                  >
                    <div className="w-4 h-[5px] bg-zinc-300"></div>
                  </button>
                </div>

                <div className="flex gap-1 items-center ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={(e) => {
                      console.log("🔄 Undo button clicked");
                      e.stopPropagation();
                      lastToolClickRef.current = Date.now();
                      handleUndo();
                    }}
                    disabled={undoStack.length <= 1}
                  >
                    <Undo className="h-4 w-4" />
                    Undo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={(e) => {
                      console.log("🧼 Clear All button clicked");
                      e.stopPropagation();
                      lastToolClickRef.current = Date.now();
                      clearCanvas();
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-lg h-[300px] md:h-[400px] relative">
                {uploadedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={uploadedImage || "/placeholder.svg"}
                      alt="Uploaded"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm"
                      onClick={() => setUploadedImage(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2 p-4">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      Drag and drop an image, or click to browse
                    </p>
                    <Button variant="secondary" onClick={triggerFileInput}>
                      Select Image
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="art-style" className="text-sm font-medium">
              Art Style
            </label>
            <Select value={artStyle} onValueChange={setArtStyle}>
              <SelectTrigger id="art-style">
                <SelectValue placeholder="Select art style" />
              </SelectTrigger>
              <SelectContent>
                {artStyles.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="instructions" className="text-sm font-medium">
              Additional Instructions
            </label>
            <Textarea
              id="instructions"
              placeholder="Add any specific details or instructions..."
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm border rounded-md border-destructive/50 bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={isLoading || (activeTab === "upload" && !uploadedImage)}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" /> Generate Images
            </>
          )}
        </Button>
      </div>

      {(isLoading || results.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Generated Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            {isLoading
              ? Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="aspect-square">
                    <Skeleton className="w-full h-full rounded-lg" />
                  </div>
                ))
              : results.map((src, i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden flex items-center justify-center p-2">
                  <img
                    src={src || "/placeholder.svg"}
                    alt={`Generated image ${i + 1}`}
                    className="max-w-full object-contain"
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

