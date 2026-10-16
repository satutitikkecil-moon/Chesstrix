import { GameMetadata } from './sampleGames.ts';

export interface ChessComProfile {
  username: string;
  avatar?: string;
  name?: string;
  title?: string;
  country?: string;
  followers?: number;
  joined?: number;
  stats?: {
    blitz?: { last: number; best: number; record: { win: number; loss: number; draw: number } };
    rapid?: { last: number; best: number; record: { win: number; loss: number; draw: number } };
    bullet?: { last: number; best: number; record: { win: number; loss: number; draw: number } };
  };
}

export async function fetchChessComProfile(username: string): Promise<ChessComProfile | null> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) return null;

  try {
    const res = await fetch(`https://api.chess.com/pub/player/${cleanUsername}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`User not found: ${res.status}`);
    }

    const data = await res.json();

    // Fetch stats
    let stats: ChessComProfile['stats'] = undefined;
    try {
      const statsRes = await fetch(`https://api.chess.com/pub/player/${cleanUsername}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        stats = {
          blitz: statsData.chess_blitz ? {
            last: statsData.chess_blitz.last?.rating || 0,
            best: statsData.chess_blitz.best?.rating || 0,
            record: statsData.chess_blitz.record || { win: 0, loss: 0, draw: 0 }
          } : undefined,
          rapid: statsData.chess_rapid ? {
            last: statsData.chess_rapid.last?.rating || 0,
            best: statsData.chess_rapid.best?.rating || 0,
            record: statsData.chess_rapid.record || { win: 0, loss: 0, draw: 0 }
          } : undefined,
          bullet: statsData.chess_bullet ? {
            last: statsData.chess_bullet.last?.rating || 0,
            best: statsData.chess_bullet.best?.rating || 0,
            record: statsData.chess_bullet.record || { win: 0, loss: 0, draw: 0 }
          } : undefined,
        };
      }
    } catch {
      // stats error fallback
    }

    return {
      username: data.username,
      avatar: data.avatar,
      name: data.name || data.username,
      title: data.title,
      country: data.country,
      followers: data.followers,
      joined: data.joined,
      stats
    };
  } catch (err) {
    console.warn('Chess.com API fetch failed:', err);
    return null;
  }
}

export async function fetchRecentGames(username: string): Promise<GameMetadata[]> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) return [];

  try {
    // 1. Get archives list
    const archivesRes = await fetch(`https://api.chess.com/pub/player/${cleanUsername}/games/archives`);
    if (!archivesRes.ok) return [];

    const archivesData = await archivesRes.json();
    const archives: string[] = archivesData.archives || [];
    if (archives.length === 0) return [];

    // Get the latest month
    const latestArchiveUrl = archives[archives.length - 1];
    const gamesRes = await fetch(latestArchiveUrl);
    if (!gamesRes.ok) return [];

    const gamesData = await gamesRes.json();
    const rawGames = (gamesData.games || []).slice(-15).reverse(); // latest 15 games

    return rawGames.map((g: any, index: number) => {
      const whiteUser = g.white?.username || 'White';
      const blackUser = g.black?.username || 'Black';
      const whiteRating = g.white?.rating || 1500;
      const blackRating = g.black?.rating || 1500;
      const result = g.white?.result === 'win' ? '1-0' : (g.black?.result === 'win' ? '0-1' : '1/2-1/2');

      // Extract opening name from pgn or eco
      let openingName = 'Chess Game';
      let eco = 'A00';
      if (g.eco) {
        const match = g.eco.match(/https:\/\/www\.chess\.com\/openings\/(.+)/);
        if (match && match[1]) {
          openingName = decodeURIComponent(match[1]).replace(/-/g, ' ');
        }
      }

      return {
        id: `chesscom_${cleanUsername}_${index}_${g.end_time || Date.now()}`,
        title: `${whiteUser} (${whiteRating}) vs ${blackUser} (${blackRating})`,
        event: g.time_class ? `${g.time_class.toUpperCase()} ${g.time_control}` : 'Chess.com Game',
        date: g.end_time ? new Date(g.end_time * 1000).toISOString().split('T')[0] : 'Recent',
        white: {
          username: whiteUser,
          rating: whiteRating
        },
        black: {
          username: blackUser,
          rating: blackRating
        },
        result,
        timeControl: g.time_control || 'Blitz',
        openingName,
        eco,
        pgn: g.pgn || ''
      };
    }).filter((g: GameMetadata) => !!g.pgn);
  } catch (err) {
    console.warn('Failed to fetch recent Chess.com games:', err);
    return [];
  }
}
