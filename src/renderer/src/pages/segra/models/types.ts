export type ContentType = 'Session' | 'Buffer' | 'Clip' | 'Highlight';

export type RecordingMode = 'Session' | 'Buffer' | 'Hybrid';

export type DisplayCaptureMethod = 'Auto' | 'DXGI' | 'WGC';

export type AudioOutputMode = 'All' | 'GameOnly' | 'GameAndDiscord';

export type StartupWindowMode = 'Normal' | 'Minimized';
export type CloseButtonAction = 'Minimize' | 'Exit';

export interface Content {
  id: string;
  type: ContentType;
  title: string;
  game: string;
  bookmarks: Bookmark[];
  fileName: string;
  filePath: string;
  fileSize: string;
  fileSizeKb: number;
  duration: string;
  createdAt: string;
  uploadId?: string;
  igdbId?: number;
  isImported: boolean;
  compressed: boolean;
  audioTrackNames?: string[];
}

export interface OBSVersion {
  version: string;
  isBeta: boolean;
  url: string;
}

export interface State {
  gpuVendor: GpuVendor;
  preRecording?: PreRecording;
  recording?: Recording;
  hasLoadedObs: boolean;
  content: Content[];
  inputDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  displays: Display[];
  codecs: Codec[];
  availableOBSVersions: OBSVersion[];
  isCheckingForUpdates: boolean;
  gameList: GameListEntry[];
  maxDisplayHeight: number;
  currentFolderSizeGb: number;
  recordingDriveUsedGb: number | null;
  recordingDriveFreeGb: number | null;
  cacheFolder: string;
}

export enum GpuVendor {
  Unknown = 'Unknown',
  Nvidia = 'Nvidia',
  AMD = 'AMD',
  Intel = 'Intel',
}

export enum BookmarkType {
  Manual = 'Manual',
  Kill = 'Kill',
  Goal = 'Goal',
  Assist = 'Assist',
  Death = 'Death',
}

export const includeInHighlight = (type: BookmarkType): boolean =>
  type === BookmarkType.Kill || type === BookmarkType.Goal;

export enum BookmarkSubtype {
  Headshot = 'Headshot',
}

export enum KeybindAction {
  CreateBookmark = 'CreateBookmark',
  SaveReplayBuffer = 'SaveReplayBuffer',
  ToggleRecording = 'ToggleRecording',
  TogglePreview = 'TogglePreview',
}

export interface Keybind {
  keys: number[];
  action: KeybindAction;
  enabled: boolean;
}

export interface Bookmark {
  id: number;
  type: BookmarkType;
  subtype?: BookmarkSubtype;
  time: string;
}

export interface Recording {
  startTime: Date;
  endTime: Date;
  game: string;
  isUsingGameHook: boolean;
  coverImageId?: string;
}

export interface PreRecording {
  game: string;
  status: string;
  coverImageId?: string;
}

export interface AudioDevice {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface DeviceSetting {
  id: string;
  name: string;
  volume: number;
}

export interface Display {
  deviceId: string;
  deviceName: string;
  isPrimary: boolean;
  isHdr: boolean;
}

export interface Codec {
  friendlyName: string;
  internalEncoderId: string;
  isHardwareEncoder: boolean;
}

export interface Game {
  name: string;
  paths?: string[];
}

export interface GameListEntry {
  name: string;
  executables: string[];
  icon?: string;
  igdbId?: number;
}

export interface GameQualityOverride {
  preset: VideoQualityPreset;
  resolution: '720p' | '1080p' | '1440p' | '4K';
  frameRate: number;
  rateControl: string;
  crfValue: number;
  cqLevel: number;
  bitrate: number;
  minBitrate: number;
  maxBitrate: number;
  encoder: 'gpu' | 'cpu';
  codec: Codec | null;
}

export interface GameRecordingModeOverride {
  recordingMode: RecordingMode;
  replayBufferDuration: number;
  replayBufferMaxSize: number;
}

export interface GameSetting {
  name: string;
  paths: string[];
  igdbId: number | null;
  icon?: string;
  customIcon: string | null;
  record: boolean;
  qualityOverride: GameQualityOverride | null;
  recordingModeOverride: GameRecordingModeOverride | null;
  discardSessionsWithoutBookmarksOverride: boolean | null;
  enableHdrOverride: boolean | null;
  volumeOverride: number | null;
}

export interface GameIntegrationSettings {
  enabled: boolean;
}

export interface GameIntegrations {
  counterStrike2: GameIntegrationSettings;
  leagueOfLegends: GameIntegrationSettings;
  pubg: GameIntegrationSettings;
  rocketLeague: GameIntegrationSettings;
  dota2: GameIntegrationSettings;
  rust: GameIntegrationSettings;
  minecraft: GameIntegrationSettings;
  runescapeDragonwilds: GameIntegrationSettings;
  warThunder: GameIntegrationSettings;
  gta: GameIntegrationSettings;
}

export type ClipEncoder = 'gpu' | 'cpu';
export type ClipCodec = 'h264' | 'h265' | 'av1';
export type ClipFPS = 0 | 24 | 30 | 60 | 120 | 144;
export type ClipAudioQuality = '96k' | '128k' | '192k' | '256k' | '320k';
export type CpuClipPreset = 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
export type NvidiaClipPreset = 'slow' | 'medium' | 'fast' | 'hp' | 'hq' | 'bd' | 'll' | 'llhq' | 'llhp' | 'lossless' | 'losslesshp';
export type Av1NvencPreset = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7';
export type AmdClipPreset = 'quality' | 'transcoding' | 'lowlatency' | 'ultralowlatency';
export type IntelClipPreset = 'fast' | 'medium' | 'slow';
export type ClipPreset = CpuClipPreset | NvidiaClipPreset | Av1NvencPreset | AmdClipPreset | IntelClipPreset;

export type VideoQualityPreset = 'low' | 'standard' | 'high' | 'custom';
export type ClipQualityPreset = 'low' | 'standard' | 'high' | 'custom';

export type MenuItemId = 'Full Sessions' | 'Replay Buffer' | 'Clips' | 'Highlights' | 'Settings';

export interface MenuItemPreference {
  id: MenuItemId;
  visible: boolean;
}

export const DEFAULT_MENU_ITEMS: MenuItemPreference[] = [
  { id: 'Full Sessions', visible: true },
  { id: 'Replay Buffer', visible: true },
  { id: 'Clips', visible: true },
  { id: 'Highlights', visible: true },
  { id: 'Settings', visible: true },
];

export const MENU_ITEM_CONTENT_TYPES: Record<MenuItemId, ContentType[]> = {
  'Full Sessions': ['Session'],
  'Replay Buffer': ['Buffer'],
  Clips: ['Clip'],
  Highlights: ['Highlight'],
  Settings: [],
};

export const menuItemHasContent = (id: MenuItemId, content: Content[]): boolean => {
  const types = MENU_ITEM_CONTENT_TYPES[id];
  if (types.length === 0) return false;
  return content.some((c) => types.includes(c.type));
};

export interface Settings {
  resolution: '720p' | '1080p' | '1440p' | '4K';
  frameRate: number;
  stretch4By3: boolean;
  enableHdr: boolean;
  rateControl: string;
  crfValue: number;
  cqLevel: number;
  bitrate: number;
  minBitrate: number;
  maxBitrate: number;
  encoder: 'gpu' | 'cpu';
  codec: Codec | null;
  storageLimit: number;
  contentFolder: string;
  cacheFolder: string;
  inputDevices: DeviceSetting[];
  outputDevices: DeviceSetting[];
  forceMonoInputSources: boolean;
  inputNoiseSuppression: boolean;
  selectedDisplay: Display | null;
  displayCaptureMethod: DisplayCaptureMethod;
  selectedOBSVersion: string | null;
  enableAi: boolean;
  autoGenerateHighlights: boolean;
  runOnStartup: boolean;
  startupWindowMode: StartupWindowMode;
  closeButtonAction: CloseButtonAction;
  receiveBetaUpdates: boolean;
  airplaneMode: boolean;
  recordingMode: RecordingMode;
  replayBufferDuration: number;
  replayBufferMaxSize: number;
  highlightPaddingBefore: number;
  highlightPaddingAfter: number;
  clipClearSegmentsAfterCreatingClip: boolean;
  clipShowInBrowserAfterUpload: boolean;
  clipEncoder: ClipEncoder;
  clipQualityCpu: number;
  clipQualityGpu: number;
  clipCodec: ClipCodec;
  clipFps: ClipFPS;
  clipAudioQuality: ClipAudioQuality;
  clipPreset: ClipPreset;
  clipKeepSeparateAudioTracks: boolean;
  keybindings: Keybind[];
  games: GameSetting[];
  gameIntegrations: GameIntegrations;
  soundEffectsVolume: number;
  showNewBadgeOnVideos: boolean;
  showGameBackground: boolean;
  showAudioWaveformInTimeline: boolean;
  enableSeparateAudioTracks: boolean;
  audioOutputMode: AudioOutputMode;
  videoQualityPreset: VideoQualityPreset;
  clipQualityPreset: ClipQualityPreset;
  confirmBeforeDeleting: boolean;
  removeOriginalAfterCompression: boolean;
  discardSessionsWithoutBookmarks: boolean;
  disableWindowsGameMode: boolean;
  menuItems: MenuItemPreference[];
  defaultMenuItem: MenuItemId;
}

export const initialState: State = {
  gpuVendor: GpuVendor.Unknown,
  recording: undefined,
  hasLoadedObs: false,
  content: [],
  inputDevices: [],
  outputDevices: [],
  displays: [],
  codecs: [],
  availableOBSVersions: [],
  isCheckingForUpdates: false,
  gameList: [],
  maxDisplayHeight: 1080,
  currentFolderSizeGb: 0,
  recordingDriveUsedGb: null,
  recordingDriveFreeGb: null,
  cacheFolder: '',
};

export const initialSettings: Settings = {
  resolution: '720p',
  frameRate: 30,
  stretch4By3: true,
  enableHdr: true,
  rateControl: 'VBR',
  crfValue: 23,
  cqLevel: 20,
  bitrate: 50,
  minBitrate: 35,
  maxBitrate: 70,
  encoder: 'gpu',
  codec: null,
  storageLimit: 100,
  contentFolder: '',
  cacheFolder: '',
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
  menuItems: DEFAULT_MENU_ITEMS,
  defaultMenuItem: 'Full Sessions',
  keybindings: [
    { keys: [119], action: KeybindAction.CreateBookmark, enabled: true },
    { keys: [120], action: KeybindAction.ToggleRecording, enabled: true },
    { keys: [121], action: KeybindAction.SaveReplayBuffer, enabled: true },
    { keys: [122], action: KeybindAction.TogglePreview, enabled: true },
  ],
  games: [],
  gameIntegrations: {
    counterStrike2: { enabled: true },
    leagueOfLegends: { enabled: true },
    pubg: { enabled: true },
    rocketLeague: { enabled: false },
    dota2: { enabled: true },
    rust: { enabled: true },
    minecraft: { enabled: true },
    runescapeDragonwilds: { enabled: true },
    warThunder: { enabled: true },
    gta: { enabled: true },
  },
};

export interface Segment {
  id: number;
  contentId: string;
  type: ContentType;
  startTime: number;
  endTime: number;
  thumbnailDataUrl?: string;
  isLoading: boolean;
  fileName: string;
  filePath: string;
  game?: string;
  title?: string;
  igdbId?: number;
  mutedAudioTracks?: number[];
  audioTrackVolumes?: Record<number, number>;
}

export interface SegmentCardProps {
  segment: Segment;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  formatTime: (time: number) => string;
  isHovered: boolean;
  setHoveredSegmentId: (id: number | null) => void;
  removeSegment: (id: number) => void;
  audioTrackNames?: string[];
  onMutedAudioTracksChange?: (id: number, mutedTracks: number[]) => void;
  onAudioTrackVolumesChange?: (id: number, volumes: Record<number, number>) => void;
}

export interface AiProgress {
  id: string;
  progress: number;
  status: 'processing' | 'done';
  message: string;
  content: Content;
}

export interface MigrationStatus {
  isRunning: boolean;
  currentMigration: string | null;
}

export interface GameResponse {
  game: {
    id: number;
    name: string;
    cover?: {
      id: number;
      image_id: string;
    };
  };
}
