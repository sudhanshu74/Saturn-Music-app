// backend/services/musicService.js

const searchSongs = async (query) => {
  try {
    // 1. Fetch from iTunes API (Native Node.js fetch)
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=12`);
    const data = await response.json();

    // 2. Format the data to perfectly match our Saturn UI needs
    return data.results.map(track => ({
      _id: track.trackId.toString(), // We use their track ID as our React key
      title: track.trackName,
      artist: track.artistName,
      // iTunes sends tiny 100x100 covers. This trick forces it to give us HD 600x600 covers!
      coverUrl: track.artworkUrl100.replace('100x100bb', '600x600bb'),
      audioUrl: track.previewUrl // The actual 30-second mp3 stream
    }));
  } catch (error) {
    console.error("iTunes API Error:", error);
    return []; // If it fails, return an empty array so the app doesn't crash
  }
};

module.exports = { searchSongs };