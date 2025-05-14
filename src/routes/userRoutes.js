import express from 'express';
import { createUser, login } from '../controllers/userController.js';

const router = express.Router();

// Route to create a new user
router.post('/register', createUser);
router.post('/login', login);

export default router;
