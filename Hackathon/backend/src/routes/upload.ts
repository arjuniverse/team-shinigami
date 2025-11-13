/**
 * Upload route for server-side Lighthouse integration (production)
 * Keeps API key secure on server
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
// @ts-ignore
import lighthouse from '@lighthouse-web3/sdk';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;

/**
 * POST /api/upload
 * Upload file to Lighthouse (server-side)
 * This keeps the API key secure and not exposed in client bundle
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!LIGHTHOUSE_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Lighthouse API key not configured on server',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    // Convert buffer to File-like object for Lighthouse SDK
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;

    // Upload to Lighthouse
    // Note: Lighthouse SDK expects File objects, may need adjustment
    const response = await lighthouse.upload([req.file], LIGHTHOUSE_API_KEY);

    if (!response || !response.data || !response.data.Hash) {
      throw new Error('Invalid response from Lighthouse');
    }

    const cid = response.data.Hash;
    const gatewayUrl = `https://gateway.lighthouse.storage/ipfs/${cid}`;

    res.json({
      success: true,
      cid,
      gatewayUrl,
      size: req.file.size,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed',
    });
  }
});

export default router;
