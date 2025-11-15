import mongoose from "mongoose";

const songSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
    }, 
    artist:{
        type: String,
        required: true,
    },
    imageUrl:{
        type: String,
        required: false,
    },
    audioFileUrl:{
        type: String,
        required: true,
    },
    durationInSeconds:{
        type: Number,
        required: true,
    },
    albumId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album',
        required: false,
    },
    genre:{
        type: String,
        required: false,
    },
    releaseDate:{
        type: Date,
        required: false,
    },
}, { timestamps: true }  // CreatedAt and UpdatedAt fields
);

const Song = mongoose.model("Song", songSchema); 

export default Song;
