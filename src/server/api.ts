import express, { Request, Response } from 'express';
import { getStorage } from './storage.js';
import { generateAllUniqueKeys } from '@/server/uniqueKeys.js';
import { getServiceConfigs } from './mockLoader.js';
import { asyncHandler, HttpError } from './errorHandler.js';

const router = express.Router();

router.get('/services', asyncHandler((_: Request, res: Response) => {
  const servicesConfig = getServiceConfigs();
  res.json(servicesConfig);
}));

router.post('/generate-response', asyncHandler(async (req: Request, res: Response) => {
  const serviceSelections = req.body;

  if (!serviceSelections || typeof serviceSelections !== 'object') {
    throw new HttpError(400, 'Invalid request body', 'Request body must be an object with service selections');
  }

  const lastRecord = getStorage().findLatest('responses');
  const existingKeys = lastRecord?.uniqueKeys || {};
  
  const newUniqueKeys = generateAllUniqueKeys(existingKeys);

  const responseRecord = {
    responses: serviceSelections,
    uniqueKeys: newUniqueKeys,
    timestamp: new Date().toISOString()
  };

  getStorage().insert('responses', responseRecord);

  res.status(200).json({
    responses: serviceSelections,
    uniqueKeys: newUniqueKeys,
    timestamp: new Date().toISOString()
  });
}));

router.get('/responses/:userId', asyncHandler((req: Request, res: Response) => {
  const { userId } = req.params;
  
  if (!userId) {
    throw new HttpError(400, 'userId is required');
  }

  const userResponses = getStorage().findByUniqueKey('responses', 'userId', userId);
  
  if (userResponses.length === 0) {
    throw new HttpError(404, 'No responses found for this userId', userId);
  }

  res.json(userResponses);
}));

export default router;
