import type { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs/promises';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'data', 'zkid-mapping.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { zkID, walletAddress } = req.body;
  if (!zkID || !walletAddress) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  let data: any = {};
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    data = JSON.parse(content);
  } catch (e) {
    // file may not exist, that's fine
  }
  data[zkID] = walletAddress;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  res.status(200).json({ success: true });
} 