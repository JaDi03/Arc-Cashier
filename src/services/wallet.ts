import { privateKeyToAccount } from 'viem/accounts';
import type { Hex } from 'viem';

/**
 * Interfaz requerida por BatchEvmScheme del SDK de Circle
 */
export interface BatchEvmSigner {
    address: `0x${string}`;
    signTypedData: (params: any) => Promise<`0x${string}`>;
}

/**
 * Wallet Abstraction Service
 * Maneja la custodia de las Llaves de Sesión delegadas por los espectadores.
 */
export class WalletService {
    /**
     * Obtiene la llave de sesión (BatchEvmSigner) para un usuario específico.
     * @param userId El ID del usuario en Owncast
     * @returns BatchEvmSigner listo para firmar pagos con Circle
     */
    public async getSessionSignerForUser(userId: string): Promise<BatchEvmSigner> {
        // TODO: En producción, buscar la llave encriptada en la base de datos
        // ej: const encryptedKey = await db.sessionKeys.findOne({ userId });
        
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
