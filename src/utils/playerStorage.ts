export interface SavedPlayer {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
  isMainAccount: boolean;
  savedAt: number;
  lastBlitzRating?: number;
  lastRapidRating?: number;
}

const STORAGE_KEY = 'chesstactix_saved_players';
const ACTIVE_PLAYER_KEY = 'chesstactix_active_player';

const DEFAULT_PLAYERS: SavedPlayer[] = [
  {
    id: 'player_hikaru',
    username: 'Hikaru',
    name: 'Hikaru Nakamura',
    avatar: 'https://images.chesscomfiles.com/uploads/v1/user/15448422.062a4fa9.200x200o.e38bb64be3fd.png',
    isMainAccount: false,
    savedAt: Date.now() - 1000000,
    lastBlitzRating: 3240,
    lastRapidRating: 2850
  },
  {
    id: 'player_magnus',
    username: 'MagnusCarlsen',
    name: 'Magnus Carlsen',
    avatar: 'https://images.chesscomfiles.com/uploads/v1/user/3889224.a9b036fc.200x200o.b0114b0b1c97.png',
    isMainAccount: false,
    savedAt: Date.now() - 2000000,
    lastBlitzRating: 3280,
    lastRapidRating: 2890
  }
];

export function getSavedPlayers(): SavedPlayer[] {
  if (typeof window === 'undefined') return DEFAULT_PLAYERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PLAYERS));
      return DEFAULT_PLAYERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PLAYERS;
  }
}

export function savePlayer(player: Omit<SavedPlayer, 'id' | 'savedAt'>): SavedPlayer {
  const players = getSavedPlayers();
  const cleanUsername = player.username.trim();

  // Check if exists
  const existingIndex = players.findIndex(p => p.username.toLowerCase() === cleanUsername.toLowerCase());
  
  const newPlayer: SavedPlayer = {
    id: `player_${Date.now()}`,
    ...player,
    username: cleanUsername,
    savedAt: Date.now(),
  };

  let updatedPlayers: SavedPlayer[];
  if (existingIndex >= 0) {
    updatedPlayers = [...players];
    updatedPlayers[existingIndex] = {
      ...updatedPlayers[existingIndex],
      ...player,
      username: cleanUsername
    };
  } else {
    updatedPlayers = [newPlayer, ...players];
  }

  // If marked as main account, unmark others
  if (player.isMainAccount) {
    updatedPlayers = updatedPlayers.map(p => ({
      ...p,
      isMainAccount: p.username.toLowerCase() === cleanUsername.toLowerCase()
    }));
    setActivePlayerUsername(cleanUsername);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers));
  } catch (e) {
    console.warn('Failed to save player to localStorage', e);
  }

  return existingIndex >= 0 ? updatedPlayers[existingIndex] : newPlayer;
}

export function deleteSavedPlayer(username: string): void {
  const players = getSavedPlayers();
  const filtered = players.filter(p => p.username.toLowerCase() !== username.toLowerCase());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    if (getActivePlayerUsername()?.toLowerCase() === username.toLowerCase()) {
      localStorage.removeItem(ACTIVE_PLAYER_KEY);
    }
  } catch (e) {
    console.warn('Failed to delete player from localStorage', e);
  }
}

export function getActivePlayerUsername(): string {
  if (typeof window === 'undefined') return 'Hikaru';
  try {
    const active = localStorage.getItem(ACTIVE_PLAYER_KEY);
    if (active) return active;
    const players = getSavedPlayers();
    const main = players.find(p => p.isMainAccount);
    return main ? main.username : (players[0]?.username || 'Hikaru');
  } catch {
    return 'Hikaru';
  }
}

export function setActivePlayerUsername(username: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_PLAYER_KEY, username.trim());
  } catch (e) {
    console.warn('Failed to set active player', e);
  }
}
