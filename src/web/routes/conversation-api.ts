/**
 * Conversation REST API routes — mirrors src/main/handlers/conversation-handlers.ts.
 */
import type { Request, Response } from 'express';
import { Router } from 'express';

import {
  createConversation,
  deleteConversation,
  generateTitleFromMessages,
  getConversation,
  initializeDatabase,
  listConversations,
  updateConversation
} from '../standalone-conversation-db';

// Initialize DB on module load
initializeDatabase();

const router = Router();

// GET /api/conversation
router.get('/', (_req: Request, res: Response) => {
  try {
    const conversations = listConversations();
    res.json({ success: true, conversations });
  } catch (error) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// POST /api/conversation
router.post('/', (req: Request, res: Response) => {
  try {
    const { messages, sessionId } = req.body as {
      messages: unknown[];
      sessionId?: string | null;
    };
    const title = generateTitleFromMessages(messages);
    const conversation = createConversation(title, messages, sessionId);
    res.json({ success: true, conversation });
  } catch (error) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// GET /api/conversation/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const conversation = getConversation(id);
    if (!conversation) {
      res.json({ success: false, error: 'Conversation not found' });
      return;
    }
    res.json({ success: true, conversation });
  } catch (error) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// PUT /api/conversation/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, messages, sessionId } = req.body as {
      title?: string;
      messages?: unknown[];
      sessionId?: string | null;
    };
    updateConversation(id, title, messages, sessionId);
    res.json({ success: true });
  } catch (error) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// DELETE /api/conversation/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    deleteConversation(id);
    res.json({ success: true });
  } catch (error) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
