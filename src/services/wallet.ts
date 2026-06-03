import { privateKeyToAccount } from 'viem/accounts';
import type { Hex } from 'viem';

/**
 * Interface required by BatchEvmScheme from the Circle SDK
 */
export interface BatchEvmSigner {
    address: `0x${string}`;
    signTypedData: (params: any) => Promise<`0x${string}`>;
}

/**
 * Wallet Abstraction Service
 * Manages the custody of Session Keys delegated by the viewers.
 */
export class WalletService {
    /**
     * Retrieves the session key (BatchEvmSigner) for a specific user.
     * @param userId The ID of the user in Owncast
     * @returns BatchEvmSigner ready to sign payments with Circle
     */
    public async getSessionSignerForUser(userId: string): Promise<BatchEvmSigner> {
        // TODO: In production, fetch the encrypted key from the database
        // e.g.: const encryptedKey = await db.sessionKeys.findOne({ userId });
        
        const privateKeyHex = process.env.SESSION_PRIVATE_KEY as Hex;
        
        if (!privateKeyHex) {
            throw new Error("No session key found for user. User must delegate a session key before joining.");
        }

        const account = privateKeyToAccount(privateKeyHex);

        return {
            address: account.address,
            signTypedData: async (params) => account.signTypedData(params)
        };
    }
}

export const walletService = new WalletService();
