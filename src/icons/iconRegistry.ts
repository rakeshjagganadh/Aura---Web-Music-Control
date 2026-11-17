export type AuraIconSize =
  | '2xs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | 'hero';

export const AURA_ICON_SIZES: Record<AuraIconSize, number> = {
  '2xs': 12,
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 36,
  '3xl': 48,
  hero: 56,
};

export interface IconRegistryEntry {
  /** Official Google Material Symbols Rounded ligature identifier */
  ligature: string;
  /** Default filled state when `filled` prop is not explicitly supplied */
  defaultFilled?: boolean;
  /** Default font weight (100..700) */
  defaultWeight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
}

export const ICON_REGISTRY = {
  // Navigation & Layout
  home: { ligature: 'home' },
  search: { ligature: 'search' },
  library: { ligature: 'library_music' },
  queue: { ligature: 'queue_music' },
  playlist: { ligature: 'queue_music' },
  playlistAdd: { ligature: 'playlist_add' },
  settings: { ligature: 'settings' },
  more: { ligature: 'more_horiz' },
  close: { ligature: 'close' },
  add: { ligature: 'add' },
  plusSquare: { ligature: 'add_box' },
  expand: { ligature: 'open_in_full' },
  chevronLeft: { ligature: 'chevron_left' },
  chevronRight: { ligature: 'chevron_right' },
  chevronUp: { ligature: 'keyboard_arrow_up' },
  chevronDown: { ligature: 'keyboard_arrow_down' },
  arrowLeft: { ligature: 'arrow_back' },
  arrowRight: { ligature: 'arrow_forward' },
  arrowUpRight: { ligature: 'north_east' },
  externalLink: { ligature: 'open_in_new' },
  arrowUpDown: { ligature: 'swap_vert' },
  arrowRightLeft: { ligature: 'swap_horiz' },
  panelRightOpen: { ligature: 'right_panel_open' },
  panelRightClose: { ligature: 'right_panel_close' },
  grid: { ligature: 'grid_view' },
  list: { ligature: 'view_list' },
  filter: { ligature: 'filter_list' },

  // Music Player & Transport
  play: { ligature: 'play_arrow', defaultFilled: true },
  playCircle: { ligature: 'play_circle' },
  pause: { ligature: 'pause', defaultFilled: true },
  skipPrevious: { ligature: 'skip_previous', defaultFilled: true },
  skipNext: { ligature: 'skip_next', defaultFilled: true },
  replay10: { ligature: 'replay_10' },
  forward10: { ligature: 'forward_10' },
  fastForward: { ligature: 'fast_forward' },
  rewind: { ligature: 'fast_rewind' },
  shuffle: { ligature: 'shuffle' },
  repeat: { ligature: 'repeat' },
  repeatOne: { ligature: 'repeat_one' },
  volumeHigh: { ligature: 'volume_up' },
  volumeLow: { ligature: 'volume_down' },
  volumeMute: { ligature: 'volume_off' },
  heart: { ligature: 'favorite' },
  star: { ligature: 'star' },

  // Music Entities & Library
  musicNote: { ligature: 'music_note' },
  musicAlt: { ligature: 'genres' },
  disc: { ligature: 'album' },
  user: { ligature: 'person' },
  users: { ligature: 'group' },
  hardDrive: { ligature: 'storage' },
  database: { ligature: 'database' },
  folderOpen: { ligature: 'folder_open' },
  folderPlus: { ligature: 'create_new_folder' },
  fileAudio: { ligature: 'audio_file' },
  fileText: { ligature: 'description' },

  // Audio Studio, DSP & Visualization
  sliders: { ligature: 'tune' },
  equalizer: { ligature: 'equalizer' },
  waveform: { ligature: 'graphic_eq' },
  waves: { ligature: 'waves' },
  activity: { ligature: 'show_chart' },
  compass: { ligature: 'explore' },
  sparkles: { ligature: 'auto_awesome' },
  wand: { ligature: 'auto_fix_high' },
  flame: { ligature: 'local_fire_department' },
  zap: { ligature: 'bolt' },
  power: { ligature: 'power_settings_new' },
  split: { ligature: 'call_split' },
  box: { ligature: 'view_in_ar' },
  layers: { ligature: 'layers' },
  gauge: { ligature: 'speed' },
  mic: { ligature: 'mic' },
  piano: { ligature: 'piano' },
  film: { ligature: 'movie' },
  headphones: { ligature: 'headphones' },
  speaker: { ligature: 'speaker' },
  car: { ligature: 'directions_car' },
  laptop: { ligature: 'laptop_mac' },
  smartphone: { ligature: 'smartphone' },
  cpu: { ligature: 'memory' },
  reset: { ligature: 'restart_alt' },
  refresh: { ligature: 'refresh' },
  rotateCw: { ligature: 'rotate_right' },

  // Radio, Network & Listen Together
  radio: { ligature: 'radio' },
  radioTower: { ligature: 'cell_tower' },
  wifi: { ligature: 'wifi' },
  globe: { ligature: 'public' },
  messageSquare: { ligature: 'chat_bubble' },
  send: { ligature: 'send' },

  // Time, Weather & Moods
  clock: { ligature: 'schedule' },
  history: { ligature: 'history' },
  calendar: { ligature: 'calendar_today' },
  timer: { ligature: 'timer' },
  sun: { ligature: 'light_mode' },
  moon: { ligature: 'dark_mode' },
  cloudSun: { ligature: 'partly_cloudy_day' },

  // File Transfer, Editing & Actions
  upload: { ligature: 'upload' },
  uploadCloud: { ligature: 'cloud_upload' },
  download: { ligature: 'download' },
  share: { ligature: 'ios_share' },
  shareAlt: { ligature: 'share' },
  copy: { ligature: 'content_copy' },
  clipboard: { ligature: 'content_paste' },
  link: { ligature: 'link' },
  bookmark: { ligature: 'bookmark' },
  pin: { ligature: 'push_pin' },
  flag: { ligature: 'flag' },
  tag: { ligature: 'label' },
  mapPin: { ligature: 'location_on' },
  trash: { ligature: 'delete' },
  edit: { ligature: 'edit' },
  save: { ligature: 'save' },
  scissors: { ligature: 'content_cut' },
  eye: { ligature: 'visibility' },
  move: { ligature: 'open_with' },
  keyboard: { ligature: 'keyboard' },

  // Status, Validation & Security
  check: { ligature: 'check' },
  checkCircle: { ligature: 'check_circle' },
  checkSquare: { ligature: 'check_box' },
  square: { ligature: 'check_box_outline_blank' },
  info: { ligature: 'info' },
  alertCircle: { ligature: 'error' },
  alertTriangle: { ligature: 'warning' },
  shieldCheck: { ligature: 'verified_user' },
  shieldAlert: { ligature: 'gpp_maybe' },
  lock: { ligature: 'lock' },
  unlock: { ligature: 'lock_open' },
  loader: { ligature: 'progress_activity' },
} as const satisfies Record<string, IconRegistryEntry>;

export type AuraIconName = keyof typeof ICON_REGISTRY;

/**
 * Maps legacy serialized source icon identifiers (stored in sourceService.ts / persistence)
 * into canonical AuraIconName entries.
 */
export function normalizeLegacyIconName(rawName?: string): AuraIconName {
  switch (rawName) {
    case 'HardDrive':
      return 'hardDrive';
    case 'Radio':
      return 'radio';
    case 'Sparkles':
      return 'sparkles';
    case 'Music':
    default:
      return 'musicNote';
  }
}
