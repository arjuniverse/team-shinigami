/**
 * Metadata API routes
 */

import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import * as storage from '../storage/index.js';
import { CreateMetadataRequest, UpdateTxRequest, MetadataResponse } from '../types.js';

const router = Router();

/**
 * POST /api/metadata
 * Create new document metadata entry
 */
router.post(
  '/',
  [
    body('filename').isString().trim().notEmpty().withMessage('Filename is required'),
    body('cid').isString().trim().notEmpty().withMessage('CID is required'),
    body('sha256').isString().isLength({ min: 64, max: 64 }).withMessage('SHA-256 must be 64 hex characters'),
    body('encryptedSize').isInt({ min: 1 }).withMessage('Encrypted size must be positive integer'),
    body('ownerAddress').isString().matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid Ethereum address'),
    body('iv').isArray({ min: 12, max: 12 }).withMessage('IV must be array of 12 bytes'),
    body('salt').isArray({ min: 16, max: 16 }).withMessage('Salt must be array of 16 bytes'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    try {
      const data: CreateMetadataRequest = req.body;
      
      const metadata = {
        id: uuidv4(),
        ...data,
        timestamp: new Date().toISOString(),
      };

      const created = await storage.createDocument(metadata);
      
      const response: MetadataResponse = {
        success: true,
        data: created,
        message: 'Metadata created successfully',
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      console.error('Error creating metadata:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to create metadata' 
      });
    }
  }
);

/**
 * GET /api/metadata
 * Get all documents (optionally filter by owner)
 */
router.get(
  '/',
  [
    query('owner').optional().isString().matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid Ethereum address'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    try {
      const { owner } = req.query;
      
      let documents;
      if (owner) {
        documents = await storage.getDocumentsByOwner(owner as string);
      } else {
        documents = await storage.getAllDocuments();
      }
      
      const response: MetadataResponse = {
        success: true,
        data: documents,
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Error fetching metadata:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to fetch metadata' 
      });
    }
  }
);

/**
 * GET /api/metadata/:id
 * Get document by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await storage.getDocumentById(id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: 'Document not found' 
      });
    }
    
    const response: MetadataResponse = {
      success: true,
      data: document,
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch metadata' 
    });
  }
});

/**
 * GET /api/metadata/byHash/:sha256
 * Get document by SHA-256 hash
 */
router.get('/byHash/:sha256', async (req: Request, res: Response) => {
  try {
    const { sha256 } = req.params;
    
    if (!/^[a-fA-F0-9]{64}$/.test(sha256)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid SHA-256 hash format' 
      });
    }
    
    const document = await storage.getDocumentByHash(sha256);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: 'Document not found' 
      });
    }
    
    const response: MetadataResponse = {
      success: true,
      data: document,
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error fetching metadata by hash:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch metadata' 
    });
  }
});

/**
 * PATCH /api/metadata/updateTx
 * Update document with transaction hash
 */
router.patch(
  '/updateTx',
  [
    body('id').isString().notEmpty().withMessage('Document ID is required'),
    body('txHash').isString().matches(/^0x[a-fA-F0-9]{64}$/).withMessage('Invalid transaction hash'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    try {
      const { id, txHash }: UpdateTxRequest = req.body;
      
      const updated = await storage.updateDocumentTxHash(id, txHash);
      
      const response: MetadataResponse = {
        success: true,
        data: updated,
        message: 'Transaction hash updated successfully',
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Error updating transaction hash:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          success: false, 
          error: error.message 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to update transaction hash' 
      });
    }
  }
);

export default router;
