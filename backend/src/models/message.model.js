import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: { // Clerk User ID of the sender
    type: String,
    required: true,
  },
  receiverId: { // Clerk User ID of the receiver
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, { timestamps: true }  // CreatedAt and UpdatedAt fields
);

const Message = mongoose.model('Message', messageSchema);

export default Message;
