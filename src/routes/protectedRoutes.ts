import express from 'express';
import { checkAndVerifyToken } from '../utilities/verifyToken';


const router = express.Router();


router.get('/', checkAndVerifyToken);

export default router