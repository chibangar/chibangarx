import { app, desktopCapturer } from "electron"
import { ipcMain } from "./secure-ipc"
import path from "path"
import fs from "fs/promises"
import { randomUUID } from "crypto"

const clipsDirectory = path.join(app.getPath("videos"), "ChibangaRx Clips")

export interface ClipMetadata {
  id: string
  filePath: string
  name: string
  duration: number
  size: number
  resolution: string
  fps: number
  game: string | null
  timestamp: number
  favorite: boolean
  tags?: string[]
}

export interface ClipConfig {
  resolution: "720p" | "1080p" | "1440p" | "native"
  fps: 30 | 60 | 120
  quality: "low" | "medium" | "high" | "lossless"
  codec: "h264" | "hevc"
  useHardwareEncoder: boolean
  recordAudio: boolean
  recordMicrophone: boolean
  gameAudioVolume: number
  micVolume: number
  duration: number
  hotkey: string
}

export function initClipBufferSystem(config: { enabled: boolean; duration: number }) {
  console.log("[Clips] Initializing buffer system...", config)
  fs.mkdir(clipsDirectory, { recursive: true }).catch((err: any) => {
    console.error("[Clips] Failed to create clips directory:", err)
  })
}

export function setupClipsHandlers(selectSource: (sourceId: string) => void = () => {}) {
  ipcMain.handle("clips:get-sources", async () => {
    const sources = await desktopCapturer.getSources({
      types: ["window", "screen"],
      thumbnailSize: { width: 320, height: 180 },
    }) as any

    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
    }))
  })

  ipcMain.handle("clips:set-source", async (_event: any, sourceId: string) => {
    if (typeof sourceId !== "string") throw new Error("Invalid capture source")
    const sources = await desktopCapturer.getSources({ types: ["window", "screen"] })
    if (!sources.some((source) => source.id === sourceId)) throw new Error("Unknown capture source")
    selectSource(sourceId)
    console.log("[Clips] Selected source:", sourceId)
    return { success: true, id: sourceId }
  })

  ipcMain.handle(
    "clips:save",
    async (_event: any, payload: { data: ArrayBuffer; name?: string; game?: string | null }) => {
      try {
        if (!payload || !(payload.data instanceof ArrayBuffer) || payload.data.byteLength > 512 * 1024 * 1024 ||
            (payload.name !== undefined && (typeof payload.name !== "string" || payload.name.length > 200)) ||
            (payload.game != null && (typeof payload.game !== "string" || payload.game.length > 200))) {
          throw new Error("Invalid clip payload")
        }
        await fs.mkdir(clipsDirectory, { recursive: true })
        if ((await fs.lstat(clipsDirectory)).isSymbolicLink()) throw new Error("Clip directory cannot be a symbolic link")
        const clipName = payload.name || (payload.game || "Clip") + " " + Math.floor(Date.now() / 1000)
        const clipId = randomUUID()
        const filePath = path.join(clipsDirectory, `${clipId}.webm`)
        await fs.writeFile(filePath, Buffer.from(payload.data), { flag: "wx" })

        const metadata: ClipMetadata = {
          id: clipId,
          filePath,
          name: clipName,
          duration: 60,
          size: payload.data.byteLength,
          resolution: "1920x1080",
          fps: 60,
          game: payload.game || null,
          timestamp: Date.now(),
          favorite: false,
        }

        const metadataPath = path.join(clipsDirectory, "clips.json")
        let previous: ClipMetadata[] = []
        try {
          if ((await fs.lstat(metadataPath)).isSymbolicLink()) throw new Error("Invalid metadata file")
          previous = JSON.parse(await fs.readFile(metadataPath, "utf-8"))
          if (!Array.isArray(previous)) throw new Error("Invalid metadata")
        } catch (error: any) {
          if (error.code !== "ENOENT") throw error
        }
        await fs.writeFile(metadataPath, JSON.stringify([...previous, metadata], null, 2), "utf-8")

        return filePath
      } catch (err: any) {
        console.error("[Clips] Failed to save clip:", err.message)
        throw err
      }
    }
  )

  ipcMain.handle("clips:list", async () => {
    try {
      const content = await fs.readFile(path.join(clipsDirectory, "clips.json"), "utf-8").catch(() => null)
      return content ? JSON.parse(content) as ClipMetadata[] : []
    } catch (err: any) {
      console.error("[Clips] Failed to load clips:", err.message)
      return []
    }
  })

  ipcMain.handle("clips:delete", async (_event: any, clipId: string) => {
    try {
      const content = await fs.readFile(path.join(clipsDirectory, "clips.json"), "utf-8").catch(() => "[]")
      const clips = JSON.parse(content) as ClipMetadata[]
      const filteredClips = clips.filter(c => c.id !== clipId)

      if (filteredClips.length === clips.length) {
        throw new Error("Clip not found")
      }

      await fs.writeFile(path.join(clipsDirectory, "clips.json"), JSON.stringify(filteredClips, null, 2), "utf-8")

      const clipToDelete = clips.find(c => c.id === clipId)
      if (clipToDelete) {
        await fs.unlink(clipToDelete.filePath).catch(() => {})
        try {
          await fs.unlink(path.join(clipsDirectory, "thumbnails", `${clipId}.jpg`) as any)
        } catch {}
      }

      return { success: true, deletedCount: 1 }
    } catch (err: any) {
      console.error("[Clips] Failed to delete clip:", err.message)
      return { success: false, error: "Unknown error" }
    }
  })

  ipcMain.handle("clips:set-favorite", async (_event: any, clipId: string, favorite: boolean) => {
    try {
      const content = await fs.readFile(path.join(clipsDirectory, "clips.json"), "utf-8").catch(() => "[]")
      const clips = JSON.parse(content) as ClipMetadata[]
      const clip = clips.find(c => c.id === clipId)

      if (!clip) return { success: false }

      clip.favorite = favorite
      await fs.writeFile(path.join(clipsDirectory, "clips.json"), JSON.stringify(clips, null, 2), "utf-8")

      return { success: true, favorite }
    } catch (err: any) {
      console.error("[Clips] Failed to update favorite:", err.message)
      return { success: false }
    }
  })

  ipcMain.handle("clips:set-tags", async (_event: any, clipId: string, tags: string[]) => {
    try {
      const content = await fs.readFile(path.join(clipsDirectory, "clips.json"), "utf-8").catch(() => "[]")
      const clips = JSON.parse(content) as ClipMetadata[]
      const clip = clips.find(c => c.id === clipId)

      if (!clip) return { success: false }

      clip.tags = tags
      await fs.writeFile(path.join(clipsDirectory, "clips.json"), JSON.stringify(clips, null, 2), "utf-8")

      return { success: true }
    } catch (err: any) {
      console.error("[Clips] Failed to set tags:", err.message)
      return { success: false }
    }
  })

  ipcMain.handle("clips:search", async (_event: any, query: string) => {
    try {
      const content = await fs.readFile(path.join(clipsDirectory, "clips.json"), "utf-8").catch(() => "[]")
      const allClips = JSON.parse(content) as ClipMetadata[]
      const queryLower = query.toLowerCase()

      return allClips.filter(c =>
        c.name.toLowerCase().includes(queryLower) ||
        c.game?.toLowerCase().includes(queryLower) ||
        c.tags?.some(tag => tag.toLowerCase().includes(queryLower))
      )
    } catch (err: any) {
      console.error("[Clips] Search failed:", err.message)
      return []
    }
  })

  console.log("[Clips] IPC handlers registered successfully")
}
