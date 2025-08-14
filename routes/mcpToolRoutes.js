import express from 'express';
import { handleToolCall, getToolDefinitions } from '../controllers/mcpToolController.js';

const router = express.Router();

router.post('/tool', handleToolCall);
router.get('/tools/list', (req, res) => {
  res.json({
    jsonrpc: "2.0",
    id: "tool-list",
    result: getToolDefinitions()
  });
});
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'DataQueryMCP' });
});

export default router;
