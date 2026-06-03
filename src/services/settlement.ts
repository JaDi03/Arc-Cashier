import { BatchFacilitatorClient } from '@circle-fin/x402-batching/server';
import { BatchEvmScheme } from '@circle-fin/x402-batching/client';
import type { BatchEvmSigner } from './wallet';

/**
 * Settlement Service
 * Interactúa con el API de Circle Gateway para liquidar firmas matemáticas en lotes on-chain.
 */
export class SettlementService {
    private facilitator: BatchFacilitatorClient;

    constructor() {
        this.facilitator = new BatchFacilitatorClient();
    }

    /**
     * Formatea USDC a la unidad base (6 decimales) requerida por el contrato
     */
    private toBaseUnits(usdcAmount: number): string {
        return Math.ceil(usdcAmount * 1_000_000).toString();
    }

    /**
     * Liquida el consumo de una sesión firmando y enviando el pago a Gateway.
     */
    public async settleSession(signer: BatchEvmSigner, amountUsdc: number, sellerAddress: string): Promise<boolean> {
        const gatewaySigner = new BatchEvmScheme(signer);
        
        try {
            // Obtenemos las configuraciones soportadas por Gateway (Testnet: Base Sepolia)
            const support = await this.facilitator.getSupported();
            const gatewaySupport = support.kinds.find(k => k.extra && k.extra.name === "GatewayWalletBatched" && k.network === "eip155:84532");
            
            if (!gatewaySupport) {
                throw new Error("No Gateway support found for Base Sepolia");
            }

            // Construimos los requerimientos exactos de este cobro
            const requirements = {
                kind: `eip155:84532:usdc`, // El SDK internamente lo mapea a la dirección correcta del token
                amount: this.toBaseUnits(amountUsdc),
                recipient: sellerAddress,
                extra: gatewaySupport.extra
            };

            // Creamos la firma EIP-3009 localmente usando la llave de sesión
            const payload = await gatewaySigner.createPaymentPayload(2, requirements as any);
            
            // Enviamos la firma a Gateway para que la recolecte y la liquide en lote
            const settlement = await this.facilitator.settle(payload as any, requirements as any);
            
            if (settlement.success) {
                console.log(`[Settlement] ✅ Liquidación exitosa de $${amountUsdc.toFixed(6)} USDC. Hash: ${settlement.transaction}`);
                return true;
            } else {
                console.error(`[Settlement] ❌ Error en liquidación: ${settlement.errorReason}`);
                return false;
            }

        } catch (error: any) {
            console.error(`[Settlement] ❌ Fallo crítico liquidando la sesión:`, error.message);
            return false;
        }
    }
}

export const settlementService = new SettlementService();
