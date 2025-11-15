import Song from '../models/song.model.js';

export const getAllSongs = async (req, res, next) => {
    try {
        // -1 = Descending order => newest songs first
        // 1 = Ascending order => oldest songs first
        const songs = await Song.find().sort({ createdAt: -1 });
        res.status(200).json(songs);
    } catch (error) {
        next(error);
    }
};

export const getFeaturedSongs = async (req, res, next) => {
    try {
        // Get 6 random songs using aggregation pipeline
        const songs = await Song.aggregate([
            {
                $sample:{size: 6},
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    artist: 1,
                    imageUrl: 1,
                    audioFileUrl: 1,
                }
            },
        ]);
        res.status(200).json(songs);
    } catch (error) {
        next(error);
    }
};

export const getMadeForYouSongs = async (req, res, next) => {
    try {
        // Get 4 random songs using aggregation pipeline
        const songs = await Song.aggregate([
            {
                $sample:{size: 4},
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    artist: 1,
                    imageUrl: 1,
                    audioFileUrl: 1,
                }
            },
        ]);
        res.status(200).json(songs);
    } catch (error) {
        next(error);
    }
};

export const getTrendingSongs = async (req, res, next) => {
    try {
        // Get 4 random songs using aggregation pipeline
        const songs = await Song.aggregate([
            {
                $sample:{size: 4},
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    artist: 1,
                    imageUrl: 1,
                    audioFileUrl: 1,
                }
            },
        ]);
        res.status(200).json(songs);
    } catch (error) {
        next(error);
    }
};
