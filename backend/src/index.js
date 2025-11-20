import express from 'express';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express'   
import { connectDB } from './lib/db.js';   
import fileUpload from 'express-fileupload';
import path from 'path';
import cors from 'cors';
import { createServer } from 'http';
import { initializeSocket } from './lib/socket.js';
import fs from "fs";
import cron from "node-cron";

import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import adminRoutes from './routes/admin.route.js';
import songRoutes from './routes/song.route.js';
import albumRoutes from './routes/album.route.js';
import statRoutes from './routes/stat.route.js';


dotenv.config();

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT;

const httpServer = createServer(app);
initializeSocket(httpServer);

app.use(cors(
  {
    origin: ['http://localhost:3000',
    process.env.FRONTEND_URL,],
    credentials: true,
  }
)); // Enable CORS for all routes

app.use(express.json()); // parse JSON payloads

app.use(express.urlencoded({ extended: true })); // parse form posts

// this will add auth to req objects => req.auth
app.use(clerkMiddleware()); // Clerk middleware for authentication

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: path.join(__dirname, 'tmp'),
  createParentPath: true,
  limits:{
    fileSize: 10 * 1024 * 1024 // 10 MB max file size
  },
}));

const tempDir = path.join(process.cwd(), "tmp")
// cron jobs -> delete files stored in tmp directory after every 1 hour
cron.schedule("0 * * * *", () => {
	if (fs.existsSync(tempDir)) {
		fs.readdir(tempDir, (err, files) => {
			if (err) {
				console.log("error", err);
				return;
			}
			for (const file of files) {
				fs.unlink(path.join(tempDir, file), (err) => {});
			}
		});
	}
});

// Define routes

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/stats", statRoutes);

if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../frontend/dist");

  app.use(express.static(distPath));

  // Catch-all route (must be REGEX, not "*", not "/*")
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
});


httpServer.listen(PORT, () => {
  console.log('Server is running on port '+ PORT);
  connectDB();
});
