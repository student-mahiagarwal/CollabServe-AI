import { generateResult } from '../services/ai.service.js';
import { asyncHandler } from '../lib/errors.js';

export const getResult = asyncHandler(async (req, res) => {
    const result = await generateResult(req.body.prompt);
    res.status(200).json({ result });
});
