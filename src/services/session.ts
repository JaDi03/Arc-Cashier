import { walletService } from './wallet';
import { settlementService } from './settlement';

/**
 * Streaming Session Management Service (Post-paid)
 */
export class SessionService {
    // In-memory storage for active sessions.
    // In production, this should migrate to Redis or PostgreSQL.
    private activeSessions = new Map<string, number>();
    
    // Financial Configuration
    private readonly RATE_PER_SECOND = 0.0001; // USDC per second
    // The address of the platform/creator receiving the payments
    private readonly SELLER_ADDRESS = process.env.SELLER_ADDRESS || "0x9876543210987654321098765432109876543210"; 

    /**
     * Records the start of a user session.
     */
    public recordJoin(userId: string): void {
        this.activeSessions.set(userId, Date.now());
        console.log(`[Session] 🟢 Session started for user: ${userId}`);
    }

    /**
     * Records the end of the session, calculates the total cost, and settles the payment.
     */
    public async recordPartAndSettle(userId: string): Promise<void> {
        const joinedTime = this.activeSessions.get(userId);
        
        if (!joinedTime) {
            console.warn(`[Session] ⚠️ User ${userId} parted, but no join record found. Ignoring.`);
            return;
        }

        this.activeSessions.delete(userId);
        
        const partedTime = Date.now();
        const durationSeconds = Math.ceil((partedTime - joinedTime) / 1000);
        const amountUsdc = durationSeconds * this.RATE_PER_SECOND;

        console.log(`[Session] 🔴 User ${userId} parted. Watch time: ${durationSeconds}s. Charge: $${amountUsdc.toFixed(6)} USDC.`);

        if (amountUsdc <= 0) {
            console.log(`[Session] ℹ️ Amount is too low to charge.`);
            return;
        }

        try {
            // 1. Get the user's delegated session key
            const signer = await walletService.getSessionSignerForUser(userId);

            // 2. Execute on-chain settlement with Gateway
            await settlementService.settleSession(signer, amountUsdc, this.SELLER_ADDRESS);
        } catch (error: any) {
            console.error(`[Session] ❌ Failed to process session close for ${userId}: ${error.message}`);
        }
    }
}

export const sessionService = new SessionService();
