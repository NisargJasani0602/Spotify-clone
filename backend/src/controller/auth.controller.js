import User from '../models/user.model.js';

export const authCallback = async (req, res) => {
  try {
    const { id, firstName, lastName, imageUrl } = req.body;

    // Check if user exists in DB
    const user = await User.findOne({ clerkId: id });
    if (!user) {
      await User.create({ 
        clerkId: id,
        username: `${firstName || ""} ${lastName || ""}`.trim(),
        imageUrl,
      });
      return res.status(201).json({ message: 'User created successfully' });
    }

    return res.status(200).json({ message: 'User already exists' });
  } catch (error) {
    console.error('Error in callback:', error);
    next(error);
  }
};
