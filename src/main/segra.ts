import { app, ipcMain, BrowserWindow, desktopCapturer } from 'electron'
import { promises as fs } from 'fs'
import path, { join } from 'path'
import os from 'os'

let mainWindow: BrowserWindow | null = null

interface SegraContent {
  id: string
  type: string
  title: string
  game: string
  bookmarks: any[]
  fileName: string
  filePath: string
  fileSize: string
  fileSizeKb: number
  duration: string
  createdAt: string
  isImported: boolean
  compressed: boolean
}

interface RecordingState {
  startTime: Date | null
  endTime: Date | null
  game: string
  isUsingGameHook: boolean
}

let isRecording = false
let recordingStartTime: Date | null = null
let currentRecordingPath: string | null = null

function getContentFolder(): string {
  return join(app.getPath('videos'), 'ChibangaRx')
}

function getCacheFolder(): string {
  return join(app.getPath('userData'), 'cache')
}

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'segra-settings.json')
}

function getStatePath(): string {
  return join(app.getPath('userData'), 'segra-state.json')
}

async function ensureFolders(): Promise<void> {
  await fs.mkdir(getContentFolder(), { recursive: true })
  await fs.mkdir(getCacheFolder(), { recursive: true })
  await fs.mkdir(join(getContentFolder(), 'Sessions'), { recursive: true })
  await fs.mkdir(join(getContentFolder(), 'Clips'), { recursive: true })
  await fs.mkdir(join(getContentFolder(), 'Highlights'), { recursive: true })
  await fs.mkdir(join(getContentFolder(), 'Replay Buffer'), { recursive: true })
}

async function loadContent(): Promise<SegraContent[]> {
  const content: SegraContent[] = []
  const contentFolder = getContentFolder()

  const types = ['Sessions', 'Clips', 'Highlights', 'Replay Buffer']
  const typeMap: Record<string, string> = {
    'Sessions': 'Session',
    'Clips': 'Clip',
    'Highlights': 'Highlight',
    'Replay Buffer': 'Buffer',
  }

  for (const folder of types) {
    const folderPath = join(contentFolder, folder)
    try {
      const files = await fs.readdir(folderPath)
      for (const file of files) {
        if (!file.endsWith('.webm') && !file.endsWith('.mp4') && !file.endsWith('.mkv')) continue
        const filePath = join(folderPath, file)
        try {
          const stat = await fs.stat(filePath)
          const id = Buffer.from(filePath).toString('base64url')
          content.push({
            id,
            type: typeMap[folder],
            title: file.replace(/\.[^/.]+$/, ''),
            game: 'Unknown',
            bookmarks: [],
            fileName: file,
            filePath,
            fileSize: formatFileSize(stat.size),
            fileSizeKb: Math.round(stat.size / 1024),
            duration: '0:00',
            createdAt: stat.birthtime.toISOString(),
            isImported: false,
            compressed: false,
          })
        } catch { /* skip unreadable files */ }
      }
    } catch { /* folder doesn't exist */ }
  }

  return content
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function sendToRenderer(channel: string, data: any): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data)
  }
}

function pushState(): void {
  sendToRenderer('segra:state-update', { method: 'State', content: {} })
}

async function loadSettings(): Promise<Record<string, any>> {
  try {
    const data = await fs.readFile(getSettingsPath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

async function saveSettings(settings: Record<string, any>): Promise<void> {
  await fs.writeFile(getSettingsPath(), JSON.stringify(settings, null, 2))
}

export function setSegraMainWindow(window: BrowserWindow): void {
  mainWindow = window
}

export function setupSegraHandlers(): void {
  console.log('[Segra] Setting up IPC handlers...')

  ensureFolders().catch(console.error)

  ipcMain.handle('segra:get-state', async () => {
    const content = await loadContent()
    const cacheFolder = getCacheFolder()
    const contentFolder = getContentFolder()

    let currentFolderSizeGb = 0
    try {
      const files = await fs.readdir(contentFolder, { recursive: true, withFileTypes: true })
      for (const file of files) {
        if (file.isFile()) {
          try {
            const stat = await fs.stat(join(file.parentPath ?? file.path, file.name))
            currentFolderSizeGb += stat.size
          } catch { /* skip */ }
        }
      }
    } catch { /* ignore */ }

    return {
      gpuVendor: 'Unknown',
      recording: isRecording && recordingStartTime
        ? { startTime: recordingStartTime, endTime: null, game: 'Unknown', isUsingGameHook: false }
        : undefined,
      preRecording: undefined,
      hasLoadedObs: true,
      content,
      inputDevices: [],
      outputDevices: [],
      displays: [],
      codecs: [],
      availableOBSVersions: [],
      isCheckingForUpdates: false,
      gameList: [],
      maxDisplayHeight: 1080,
      currentFolderSizeGb: Math.round(currentFolderSizeGb / (1024 * 1024 * 1024) * 100) / 100,
      recordingDriveUsedGb: null,
      recordingDriveFreeGb: null,
      cacheFolder,
    }
  })

  ipcMain.handle('segra:get-settings', async () => {
    const saved = await loadSettings()
    return {
      resolution: '1080p',
      frameRate: 60,
      stretch4By3: false,
      enableHdr: false,
      rateControl: 'VBR',
      crfValue: 23,
      cqLevel: 20,
      bitrate: 50,
      minBitrate: 35,
      maxBitrate: 70,
      encoder: 'gpu',
      codec: null,
      storageLimit: 100,
      contentFolder: getContentFolder(),
      cacheFolder: getCacheFolder(),
      inputDevices: [],
      outputDevices: [],
      forceMonoInputSources: false,
      inputNoiseSuppression: true,
      selectedDisplay: null,
      displayCaptureMethod: 'Auto',
      selectedOBSVersion: null,
      enableAi: true,
      autoGenerateHighlights: true,
      runOnStartup: false,
      startupWindowMode: 'Minimized',
      closeButtonAction: 'Minimize',
      receiveBetaUpdates: false,
      airplaneMode: false,
      recordingMode: 'Hybrid',
      replayBufferDuration: 30,
      replayBufferMaxSize: 1000,
      highlightPaddingBefore: 4,
      highlightPaddingAfter: 4,
      clipClearSegmentsAfterCreatingClip: false,
      clipShowInBrowserAfterUpload: false,
      clipEncoder: 'cpu',
      clipQualityCpu: 23,
      clipQualityGpu: 23,
      clipCodec: 'h264',
      clipFps: 60,
      clipAudioQuality: '128k',
      clipPreset: 'veryfast',
      clipKeepSeparateAudioTracks: false,
      soundEffectsVolume: 1,
      showNewBadgeOnVideos: false,
      showGameBackground: true,
      showAudioWaveformInTimeline: true,
      enableSeparateAudioTracks: false,
      audioOutputMode: 'All',
      videoQualityPreset: 'high',
      clipQualityPreset: 'standard',
      confirmBeforeDeleting: false,
      removeOriginalAfterCompression: false,
      discardSessionsWithoutBookmarks: false,
      disableWindowsGameMode: false,
      menuItems: [
        { id: 'Full Sessions', visible: true },
        { id: 'Replay Buffer', visible: true },
        { id: 'Clips', visible: true },
        { id: 'Highlights', visible: true },
        { id: 'Settings', visible: true },
      ],
      defaultMenuItem: 'Full Sessions',
      keybindings: [],
      games: [],
      gameIntegrations: {},
      ...saved,
    }
  })

  ipcMain.handle('segra:UpdateSettings', async (_event, payload: Record<string, any>) => {
    const current = await loadSettings()
    const updated = { ...current, ...payload }
    await saveSettings(updated)
    sendToRenderer('segra:state-update', { method: 'Settings', content: updated })
  })

  ipcMain.handle('segra:StartRecording', async (_event, payload?: { game?: string }) => {
    if (isRecording) return { success: false, error: 'Already recording' }

    isRecording = true
    recordingStartTime = new Date()

    const timestamp = recordingStartTime.toISOString().replace(/[.:]/g, '-')
    const game = payload?.game || 'Unknown'
    const fileName = `${game} ${timestamp}.webm`
    currentRecordingPath = join(getContentFolder(), 'Sessions', fileName)

    await ensureFolders()

    sendToRenderer('segra:state-update', {
      method: 'State',
      content: {
        recording: {
          startTime: recordingStartTime,
          endTime: null,
          game,
          isUsingGameHook: false,
        },
      },
    })

    console.log('[Segra] Recording started:', currentRecordingPath)
    return { success: true }
  })

  ipcMain.handle('segra:StopRecording', async () => {
    if (!isRecording) return { success: false, error: 'Not recording' }

    isRecording = false
    const endTime = new Date()

    sendToRenderer('segra:state-update', {
      method: 'State',
      content: {
        recording: {
          startTime: recordingStartTime,
          endTime,
          game: 'Unknown',
          isUsingGameHook: false,
        },
      },
    })

    // Clear recording state after a short delay so the UI can show the finishing state
    setTimeout(() => {
      sendToRenderer('segra:state-update', {
        method: 'State',
        content: { recording: undefined },
      })
      // Refresh content list
      loadContent().then((content) => {
        sendToRenderer('segra:state-update', { method: 'State', content: { content } })
      })
    }, 2000)

    console.log('[Segra] Recording stopped')
    recordingStartTime = null
    return { success: true }
  })

  ipcMain.handle('segra:CreateClip', async (_event, payload: { contentId: string; segments: any[]; title?: string }) => {
    console.log('[Segra] CreateClip:', payload.contentId, 'segments:', payload.segments?.length)
    const id = Date.now().toString()
    sendToRenderer('segra:state-update', {
      method: 'ClipProgress',
      content: { id, progress: 0, segments: payload.segments || [], error: undefined },
    })

    // Simulate clip creation progress
    for (let p = 0; p <= 100; p += 10) {
      await new Promise((r) => setTimeout(r, 100))
      sendToRenderer('segra:state-update', {
        method: 'ClipProgress',
        content: { id, progress: p, segments: payload.segments || [] },
      })
    }

    return { success: true, id }
  })

  ipcMain.handle('segra:CreateHighlight', async (_event, payload: { contentId: string; title?: string }) => {
    console.log('[Segra] CreateHighlight:', payload.contentId)
    return { success: true }
  })

  ipcMain.handle('segra:CreateBookmark', async (_event, payload: { contentId: string; bookmark: any }) => {
    console.log('[Segra] CreateBookmark:', payload.contentId, payload.bookmark)
    return { success: true }
  })

  ipcMain.handle('segra:DeleteBookmark', async (_event, payload: { contentId: string; bookmarkId: number }) => {
    console.log('[Segra] DeleteBookmark:', payload.contentId, payload.bookmarkId)
    return { success: true }
  })

  ipcMain.handle('segra:DeleteContent', async (_event, payload: { id: string }) => {
    try {
      const filePath = Buffer.from(payload.id, 'base64url').toString('utf-8')
      await fs.unlink(filePath)
      console.log('[Segra] Deleted content:', filePath)
      return { success: true }
    } catch (err: any) {
      console.error('[Segra] DeleteContent failed:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('segra:DeleteMultipleContent', async (_event, payload: { ids: string[] }) => {
    const results = []
    for (const id of payload.ids) {
      try {
        const filePath = Buffer.from(id, 'base64url').toString('utf-8')
        await fs.unlink(filePath)
        results.push({ id, success: true })
      } catch (err: any) {
        results.push({ id, success: false, error: err.message })
      }
    }
    return results
  })

  ipcMain.handle('segra:RenameContent', async (_event, payload: { id: string; newTitle: string }) => {
    try {
      const oldPath = Buffer.from(payload.id, 'base64url').toString('utf-8')
      const dir = path.dirname(oldPath)
      const ext = path.extname(oldPath)
      const newPath = join(dir, `${payload.newTitle}${ext}`)
      await fs.rename(oldPath, newPath)
      console.log('[Segra] Renamed:', oldPath, '->', newPath)
      return { success: true }
    } catch (err: any) {
      console.error('[Segra] RenameContent failed:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('segra:ImportFile', async (_event, payload?: { type?: string }) => {
    const { dialog } = await import('electron')
    if (!mainWindow) return { success: false, error: 'No window' }

    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Video',
      filters: [
        { name: 'Video Files', extensions: ['webm', 'mp4', 'mkv', 'avi', 'mov'] },
      ],
      properties: ['openFile', 'multiSelections'],
    })

    if (result.canceled || !result.filePaths.length) return { success: false, error: 'Cancelled' }

    const type = payload?.type || 'Session'
    const folderMap: Record<string, string> = {
      Session: 'Sessions',
      Clip: 'Clips',
      Highlight: 'Highlights',
      Buffer: 'Replay Buffer',
    }
    const targetFolder = join(getContentFolder(), folderMap[type] || 'Sessions')
    await fs.mkdir(targetFolder, { recursive: true })

    const imported = []
    for (const filePath of result.filePaths) {
      const fileName = path.basename(filePath)
      const destPath = join(targetFolder, fileName)
      try {
        await fs.copyFile(filePath, destPath)
        imported.push({ success: true, path: destPath })
        console.log('[Segra] Imported:', filePath, '->', destPath)
      } catch (err: any) {
        imported.push({ success: false, error: err.message })
      }
    }

    // Refresh content list
    const content = await loadContent()
    sendToRenderer('segra:state-update', { method: 'State', content: { content } })

    return { success: true, imported }
  })

  ipcMain.handle('segra:CreateAiClip', async (_event, payload: { contentId: string }) => {
    console.log('[Segra] CreateAiClip:', payload.contentId)
    const id = `ai-${Date.now()}`

    // Simulate AI processing
    for (let p = 0; p <= 100; p += 5) {
      await new Promise((r) => setTimeout(r, 200))
      sendToRenderer('segra:state-update', {
        method: 'AiProgress',
        content: {
          id,
          progress: p,
          status: p >= 100 ? 'done' : 'processing',
          message: p >= 100 ? 'Complete' : `Processing... ${p}%`,
          content: { id: payload.contentId },
        },
      })
    }

    return { success: true, id }
  })

  ipcMain.handle('segra:CancelClip', async (_event, payload: { id: number }) => {
    console.log('[Segra] CancelClip:', payload.id)
    return { success: true }
  })

  // Get available capture sources for recording
  ipcMain.handle('segra:get-sources', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 320, height: 180 },
    })
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
    }))
  })

  console.log('[Segra] IPC handlers registered')
}
