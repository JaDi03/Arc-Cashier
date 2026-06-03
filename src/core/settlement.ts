import { BatchFacilitatorClient } from '@circle-fin/x402-batching/server';
import { BatchEvmScheme } from '@circle-fin/x402-batching/client';
import type { BatchEvmSigner } from './wallet';

/**
 * Settlement Service
 * Interacts with the Circle Gateway API to settle mathematical signatures in batches on-chain.
 */
export class SettlementService {
    private facilitator: BatchFacilitatorClient;

    constructor() {
        this.facilitator = new BatchFacilitatorClient();
    }

    /**
     * Formats USDC to the base unit (6 decimals) required by the contract
     */
    private toBaseUnits(usdcAmount: number): string {
        return Math.ceil(usdcAmount * 1_000_000).toString();
    }

    /**
     * Settles the session consumption by signing and sending the payment to Gateway.
     */
    public async settleSession(signer: BatchEvmSigner, amountUsdc: number, sellerAddress: string): Promise<boolean> {
        const gatewaySigner = new BatchEvmScheme(signer);
        
        try {
            // Get configurations supported by Gateway (Testnet: Base Sepolia)
            const support = await this.facilitator.getSupported();
            const gatewaySupport = support.kinds.find(k => k.extra && k.extra.name === "GatewayWalletBatched" && k.network === "eip155:84532");
            
            if (!gatewaySupport) {
                throw new Error("No Gateway support found for Base Sepolia");
            }

            // Construct the exact requirements for this payment
            const requirements = {
                kind: `eip155:84532:usdc`, // The SDK internally maps this to the correct token address
                amount: this.toBaseUnits(amountUsdc),
                recipient: sellerAddress,
                extra: gatewaySupport.extra
            };

            // Create the EIP-3009 signature locally using the session key
            const payload = await gatewaySigner.createPaymentPayload(2, requirements as any);
            
            // Send the signature to Gateway to be collected and settled in a batch
            const settlement = await this.facilitator.settle(payload as any, requirements as any);
            
            if (settlement.success) {
                console.log(`[Settlement] ✅ Successful settlement of $${amountUsdc.toFixed(6)} USDC. Hash: ${settlement.transaction}`);
                return true;
            } else {
                console.error(`[Settlement] ❌ Settlement error: ${settlement.errorReason}`);
                return false;
            }

        } catch (error: any) {
            console.error(`[Settlement] ❌ Critical failure settling the session:`, error.message);
            return false;
        }
    }
}

export const settlementService = new SettlementService();
