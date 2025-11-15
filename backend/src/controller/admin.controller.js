import Song from '../models/song.model.js';
import Album from '../models/album.model.js';
import cloudinary from '../lib/cloudinary.js';

// Upload a temp file path to Cloudinary and return the hosted URL.
const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

export const checkAdmin = async (req, res, next) => {
  res.status(200).json({ admin: true });
}

export const createSong = async (req, res, next) => {
  try {
    if (!req.files || !req.files.audioFile || !req.files.imageFile) {
      return res.status(400).json({ message: 'Audio file and image file are required' });
    }

    const { title, artist, albumId, durationInSeconds } = req.body;
    const parsedDuration = Number(durationInSeconds);

    if (!title || !artist || Number.isNaN(parsedDuration)) {
      return res.status(400).json({ message: 'Title, artist, and numeric durationInSeconds are required' });
    }

    const audioFile = req.files.audioFile;
    const imageFile = req.files.imageFile;

    const audioUrl = await uploadToCloudinary(audioFile);
    const imageUrl = await uploadToCloudinary(imageFile);

    const song = new Song({
      title,
      artist,
      audioFileUrl: audioUrl,
      imageUrl,
      durationInSeconds: parsedDuration,
      albumId: albumId || undefined,
    });

    await song.save();

    // if song is part of an album, update the album's song list
    if (albumId) {
      await Album.findByIdAndUpdate(albumId, {
        $push: { songs: song._id },
      });
    }

    res.status(201).json(song);
  } catch (error) {
    console.error('Error creating song:', error);
    next(error);
  }
};

export const deleteSong = async (req, res, next) => {
  try {
    const { id } = req.params;

    const song = await Song.findById(id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // if song is part of an album, remove it from the album's song list
    if (song.albumId) {
      await Album.findByIdAndUpdate(song.albumId, {
        $pull: { songs: song._id },
      });
    }

    await song.deleteOne();
    return res.status(200).json({ message: 'Song deleted successfully' });

  } catch (error) {
    console.error('Error deleting song:', error);
    next(error);
  }
};

export const createAlbum = async (req, res, next) => {
  try {
    if (!req.files || !req.files.imageFile) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const { title, artist, releaseYear } = req.body;
    if (!title || !artist) {
      return res.status(400).json({ message: 'Title and artist are required' });
    }

    const parsedYear = releaseYear ? Number(releaseYear) : undefined;
    if (releaseYear && Number.isNaN(parsedYear)) {
      return res.status(400).json({ message: 'releaseYear must be a number' });
    }

    const { imageFile } = req.files;

    const imageUrl = await uploadToCloudinary(imageFile);

    const album = new Album({
      title,
      artist,
      imageUrl,
      releaseYear: parsedYear,
    });

    await album.save();

    res.status(201).json(album);

  } catch (error) {
    console.error('Error creating album:', error);
    next(error);
  }
};

export const deleteAlbum = async (req, res, next) => {
  try {
    const { id } = req.params;
    const album = await Album.findById(id);

    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    await Song.deleteMany({ albumId: id });
    await album.deleteOne();
    return res.status(200).json({ message: 'Album and associated songs deleted successfully' });
  } catch (error) {
    console.error('Error deleting album:', error);
    next(error);
  }
};