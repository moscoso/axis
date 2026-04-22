import express from 'express';
import os from 'node:os';
import process from 'node:process';
import { GameServer } from '../GameServer';

export const index = express.Router();

index.get('/', (req: express.Request, res: express.Response) => {
	res.send(getUsageStats());
});

function getUsageStats() {
	const totalMemory = os.totalmem();
	const freeMemory = os.freemem();
	const uptime = os.uptime();
	const cpuInfo = os.cpus();
	const memoryUsage = process.memoryUsage();
	const cpuUsage = process.cpuUsage();

	const totalMemoryInGB = (totalMemory / (1024 ** 3)).toFixed(2);
	const freeMemoryInGB = (freeMemory / (1024 ** 3)).toFixed(2);
	const heapTotalInMB = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
	const heapUsedInMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
	const externalMemoryInMB = (memoryUsage.external / 1024 / 1024).toFixed(2);
	const cpuTimeUser = (cpuUsage.user / 1000).toFixed(2);
	const cpuTimeSystem = (cpuUsage.system / 1000).toFixed(2);

	return {
		system: {
			totalMemory: `${totalMemoryInGB} GB`,
			freeMemory: `${freeMemoryInGB} GB`,
			uptime: `${Math.floor(uptime / 60)} minutes`,
			cpuCores: cpuInfo.length
		},
		nodeProcess: {
			heapTotal: `${heapTotalInMB} MB`,
			heapUsed: `${heapUsedInMB} MB`,
			externalMemory: `${externalMemoryInMB} MB`,
			cpuUserTime: `${cpuTimeUser} ms`,
			cpuSystemTime: `${cpuTimeSystem} ms`
		}
	};
}

index.get('/game/:roomId', (req: express.Request, res: express.Response) => {
	const roomId = String(req.params.roomId);
	const dealer = GameServer.getInstance().dealerMap.get(roomId);
	res.send(dealer?.gameState);
});

index.get('/game/:roomId/events', (req: express.Request, res: express.Response) => {
	const roomId = String(req.params.roomId);
	const dealer = GameServer.getInstance().dealerMap.get(roomId);
	res.send(dealer?.gameEvents);
});

index.get('/table/:roomId', (req: express.Request, res: express.Response) => {
	const roomId = String(req.params.roomId);
	const dealer = GameServer.getInstance().dealerMap.get(roomId);
	res.send(dealer?.tableState);
});

index.get('/table/:roomId/events', (req: express.Request, res: express.Response) => {
	const roomId = String(req.params.roomId);
	const dealer = GameServer.getInstance().dealerMap.get(roomId);
	res.send(dealer?.tableEvents);
});
