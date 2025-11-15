import mongoose from "mongoose";    

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
}, { timestamps: true }  // CreatedAt and UpdatedAt fields
);

const User = mongoose.model("User", userSchema);

export default User;
