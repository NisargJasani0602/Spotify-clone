export interface Song {
    _id: string;
    title: string;
    artist: string | null;
    imageUrl: string;
    audioFileUrl: string;
    durationInSeconds: number;
    createdAt: string;
    updatedAt: string;
}

export interface Album {
    _id: string;
    title: string;
    artist: string;
    imageUrl: string;
    releaseYear: number;
    songs: Song[];
    createdAt: Date;
    updatedAt: Date;
}