"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Paintbrush } from "lucide-react"

interface ColorPickerProps {
    color?: string
    onChange?: (value: string) => void
    className?: string
}

interface RGB {
    r: number
    g: number
    b: number
    a: number
}

interface HSV {
    h: number
    s: number
    v: number
}

const presetColors = [
    "#e53935", // red
    "#f57c00", // orange
    "#ffeb3b", // yellow
    "#8d6e63", // brown
    "#7cb342", // light green
    "#388e3c", // green
    "#9c27b0", // purple
    "#673ab7", // deep purple
    "#2196f3", // blue
    "#00bcd4", // cyan
    "#b2ebf2", // light cyan
    "#000000", // black
    "#616161", // dark gray
    "#9e9e9e", // gray
    "#ffffff", // white
    "#f44336", // red-500
    "#e91e63", // pink-500
    "#9c27b0", // purple-500
    "#673ab7", // deep purple-500
    "#3f51b5", // indigo-500
    "#2196f3", // blue-500
    "#03a9f4", // light blue-500
    "#00bcd4", // cyan-500
    "#009688", // teal-500
    "#4caf50", // green-500
]

export function ColorPicker({ color = "#000000", onChange, className }: ColorPickerProps) {
    const [currentColor, setCurrentColor] = useState(color)
    const [rgb, setRgb] = useState<RGB>({ r: 0, g: 0, b: 0, a: 100 })
    const [hsv, setHsv] = useState<HSV>({ h: 0, s: 0, v: 0 })

    const saturationRef = useRef<HTMLDivElement>(null)
    const hueRef = useRef<HTMLDivElement>(null)
    const [dragging, setDragging] = useState<"saturation" | "hue" | null>(null)
    const [saturationPosition, setSaturationPosition] = useState({ x: 0, y: 0 })
    const [huePosition, setHuePosition] = useState(0)

    // Convert hex to RGB
    const hexToRgb = useCallback((hex: string): RGB => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result
            ? {
                r: Number.parseInt(result[1], 16),
                g: Number.parseInt(result[2], 16),
                b: Number.parseInt(result[3], 16),
                a: 100,
            }
            : { r: 0, g: 0, b: 0, a: 100 }
    }, [])

    // Convert RGB to hex
    const rgbToHex = useCallback((r: number, g: number, b: number): string => {
        return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
    }, [])

    // Convert RGB to HSV
    const rgbToHsv = useCallback((r: number, g: number, b: number): HSV => {
        r /= 255
        g /= 255
        b /= 255

        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const d = max - min
        let h = 0

        if (d === 0) h = 0
        else if (max === r) h = ((g - b) / d) % 6
        else if (max === g) h = (b - r) / d + 2
        else if (max === b) h = (r - g) / d + 4

        h = Math.round(h * 60)
        if (h < 0) h += 360

        const s = max === 0 ? 0 : d / max
        const v = max

        return { h, s: s * 100, v: v * 100 }
    }, [])

    // Convert HSV to RGB
    const hsvToRgb = useCallback((h: number, s: number, v: number): RGB => {
        s /= 100
        v /= 100

        const i = Math.floor(h / 60) % 6
        const f = h / 60 - Math.floor(h / 60)
        const p = v * (1 - s)
        const q = v * (1 - f * s)
        const t = v * (1 - (1 - f) * s)

        let r = 0,
            g = 0,
            b = 0

        switch (i) {
            case 0:
                r = v
                g = t
                b = p
                break
            case 1:
                r = q
                g = v
                b = p
                break
            case 2:
                r = p
                g = v
                b = t
                break
            case 3:
                r = p
                g = q
                b = v
                break
            case 4:
                r = t
                g = p
                b = v
                break
            case 5:
                r = v
                g = p
                b = q
                break
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255),
            a: 100,
        }
    }, [])

    // Initialize color values
    useEffect(() => {
        const rgbColor = hexToRgb(currentColor)
        setRgb(rgbColor)
        setHsv(rgbToHsv(rgbColor.r, rgbColor.g, rgbColor.b))
    }, [currentColor, hexToRgb, rgbToHsv])

    // Update positions when HSV changes
    useEffect(() => {
        if (saturationRef.current) {
            const { width, height } = saturationRef.current.getBoundingClientRect()
            setSaturationPosition({
                x: (hsv.s / 100) * width,
                y: (1 - hsv.v / 100) * height,
            })
        }

        if (hueRef.current) {
            const { width } = hueRef.current.getBoundingClientRect()
            setHuePosition((hsv.h / 360) * width)
        }
    }, [hsv])

    // Handle mouse events for saturation area
    const handleSaturationMouseDown = (e: React.MouseEvent) => {
        setDragging("saturation")
        handleSaturationChange(e)
    }

    // Handle mouse events for hue slider
    const handleHueMouseDown = (e: React.MouseEvent) => {
        setDragging("hue")
        handleHueChange(e)
    }

    // Handle mouse move and up events
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (dragging === "saturation") {
                handleSaturationChange(e)
            } else if (dragging === "hue") {
                handleHueChange(e)
            }
        }

        const handleMouseUp = () => {
            setDragging(null)
        }

        if (dragging) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [dragging])

    // Handle saturation area changes
    const handleSaturationChange = (e: MouseEvent | React.MouseEvent) => {
        if (!saturationRef.current) return

        const rect = saturationRef.current.getBoundingClientRect()
        let x = e.clientX - rect.left
        let y = e.clientY - rect.top

        x = Math.max(0, Math.min(x, rect.width))
        y = Math.max(0, Math.min(y, rect.height))

        const s = (x / rect.width) * 100
        const v = 100 - (y / rect.height) * 100

        const newHsv = { ...hsv, s, v }
        setHsv(newHsv)

        const newRgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v)
        setRgb(newRgb)

        const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
        setCurrentColor(newColor)
        onChange?.(newColor)
    }

    // Handle hue slider changes
    const handleHueChange = (e: MouseEvent | React.MouseEvent) => {
        if (!hueRef.current) return

        const rect = hueRef.current.getBoundingClientRect()
        let x = e.clientX - rect.left

        x = Math.max(0, Math.min(x, rect.width))

        const h = (x / rect.width) * 360

        const newHsv = { ...hsv, h }
        setHsv(newHsv)

        const newRgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v)
        setRgb(newRgb)

        const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
        setCurrentColor(newColor)
        onChange?.(newColor)
    }

    // Handle hex input change
    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let hex = e.target.value
        if (!hex.startsWith("#")) {
            hex = "#" + hex
        }

        // Validate hex
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            setCurrentColor(hex)
            onChange?.(hex)
        }
    }

    // Handle RGB input changes
    const handleRgbChange = (key: "r" | "g" | "b" | "a", value: string) => {
        const numValue = Number.parseInt(value, 10)
        if (isNaN(numValue)) return

        const max = key === "a" ? 100 : 255
        const validValue = Math.max(0, Math.min(numValue, max))

        const newRgb = { ...rgb, [key]: validValue }
        setRgb(newRgb)

        if (key !== "a") {
            const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
            setCurrentColor(newColor)
            onChange?.(newColor)
            setHsv(rgbToHsv(newRgb.r, newRgb.g, newRgb.b))
        }
    }

    // Handle preset color selection
    const handlePresetColorClick = (presetColor: string) => {
        setCurrentColor(presetColor)
        onChange?.(presetColor)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[220px] justify-start text-left font-normal", className)}>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: currentColor }} />
                        <span>{currentColor}</span>
                    </div>
                    <Paintbrush className="ml-auto h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <Tabs defaultValue="list">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="list">Color List</TabsTrigger>
                        <TabsTrigger value="picker">Color Picker</TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="space-y-4">
                        <div className="grid grid-cols-5 gap-2">
                            {presetColors.map((presetColor) => (
                                <button
                                    key={presetColor}
                                    className="h-8 w-8 rounded-md border border-gray-200 transition-all hover:scale-110"
                                    style={{ backgroundColor: presetColor }}
                                    onClick={() => handlePresetColorClick(presetColor)}
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label htmlFor="hex-list" className="text-xs">
                                    Hex
                                </Label>
                                <Input
                                    id="hex-list"
                                    value={currentColor.replace("#", "")}
                                    onChange={handleHexChange}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div>
                                <div className="text-xs mb-1">Selected</div>
                                <div className="h-8 w-full rounded-md border" style={{ backgroundColor: currentColor }} />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="picker" className="space-y-3">
                        {/* Saturation/Value area */}
                        <div
                            ref={saturationRef}
                            className="relative h-40 w-full rounded-md cursor-pointer"
                            style={{
                                backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                                backgroundImage: `
                  linear-gradient(to top, #000, transparent),
                  linear-gradient(to right, #fff, transparent)
                `,
                            }}
                            onMouseDown={handleSaturationMouseDown}
                        >
                            <div
                                className="absolute w-3 h-3 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                style={{
                                    left: saturationPosition.x,
                                    top: saturationPosition.y,
                                    boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
                                }}
                            />
                        </div>

                        {/* Hue slider */}
                        <div
                            ref={hueRef}
                            className="relative h-4 w-full rounded-md cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, 
                  #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000
                )`,
                            }}
                            onMouseDown={handleHueMouseDown}
                        >
                            <div
                                className="absolute w-2 h-4 border-2 border-white transform -translate-x-1/2 pointer-events-none"
                                style={{
                                    left: huePosition,
                                    boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
                                }}
                            />
                        </div>

                        {/* Color inputs */}
                        <div className="grid grid-cols-5 gap-2">
                            <div className="col-span-2">
                                <Label htmlFor="hex" className="sr-only">
                                    Hex
                                </Label>
                                <Input
                                    id="hex"
                                    value={currentColor.replace("#", "")}
                                    onChange={handleHexChange}
                                    className="h-8 text-xs"
                                />
                                <div className="text-xs text-center mt-1">Hex</div>
                            </div>
                            <div>
                                <Label htmlFor="r" className="sr-only">
                                    R
                                </Label>
                                <Input
                                    id="r"
                                    value={rgb.r}
                                    onChange={(e) => handleRgbChange("r", e.target.value)}
                                    className="h-8 text-xs"
                                />
                                <div className="text-xs text-center mt-1">R</div>
                            </div>
                            <div>
                                <Label htmlFor="g" className="sr-only">
                                    G
                                </Label>
                                <Input
                                    id="g"
                                    value={rgb.g}
                                    onChange={(e) => handleRgbChange("g", e.target.value)}
                                    className="h-8 text-xs"
                                />
                                <div className="text-xs text-center mt-1">G</div>
                            </div>
                            <div>
                                <Label htmlFor="b" className="sr-only">
                                    B
                                </Label>
                                <Input
                                    id="b"
                                    value={rgb.b}
                                    onChange={(e) => handleRgbChange("b", e.target.value)}
                                    className="h-8 text-xs"
                                />
                                <div className="text-xs text-center mt-1">B</div>
                            </div>
                        </div>

                        {/* Alpha input */}
                        <div className="grid grid-cols-5 gap-2">
                            <div className="col-span-4">
                                <Label htmlFor="a" className="sr-only">
                                    Alpha
                                </Label>
                                <Input
                                    id="a"
                                    value={rgb.a}
                                    onChange={(e) => handleRgbChange("a", e.target.value)}
                                    className="h-8 text-xs"
                                />
                                <div className="text-xs text-center mt-1">A</div>
                            </div>
                            <div>
                                <div className="h-8 w-full rounded-md border" style={{ backgroundColor: currentColor }} />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    )
}
