import { Router, Request, Response } from 'express';
import { GatewayClient } from '@circle-fin/x402-batching/client';
import { privateKeyToAccount } from 'viem/accounts';
import { walletService } from './wallet';
import { baseSepolia } from 'viem/chains';

const coreRouter = Router();

coreRouter.post('/register-session', async (req: Request, res: Response) => {
    const { userId, privateKey, address } = req.body;
    
    if (!userId || !privateKey) {
        return res.status(400).json({ error: "Missing userId or privateKey" });
    }

    try {
        console.log(`\n[Core Gateway] 💳 Processing initial deposit for user ${userId}...`);
        
        const gatewayClient = new GatewayClient({ 
            privateKey: privateKey as `0x${string}`, 
            chain: "baseSepolia" 
        });
        
        const depositReceipt = await gatewayClient.deposit('1000000');
        console.log(`[Core Gateway] ✅ Deposit of 1 USDC confirmed. Receipt: ${JSON.stringify(depositReceipt)}`);

        walletService.registerSessionKey(userId, privateKey);
        
        return res.json({ status: "session_registered", depositReceipt: depositReceipt });
    } catch (error: any) {
        console.error(`[Core Gateway] ❌ Failed to deposit:`, error.message);
        return res.status(500).json({ error: "Failed to deposit to Gateway" });
    }
});

export default coreRouter;
