import { walletService } from './wallet';
import { settlementService } from './settlement';

/**
 * Servicio de Gestión de Sesiones de Streaming (Post-pago)
 */
export class SessionService {
    // Memoria en RAM para las sesiones en curso. 
    // En producción esto debe migrar a Redis o PostgreSQL.
    private activeSessions = new Map<string, number>();
    
    // Configuración Financiera
    private readonly RATE_PER_SECOND = 0.0001; // USDC por segundo
    // La dirección de la plataforma/creador que recibe los pagos
    private readonly SELLER_ADDRESS = process.env.SELLER_ADDRESS || "0x9876543210987654321098765432109876543210"; 

    /**
     * Registra el inicio de una sesión de un usuario.
     */
    public recordJoin(userId: string): void {
        this.activeSessions.set(userId, Date.now());
        console.log(`[Session] 🟢 Sesión iniciada para el usuario: ${userId}`);
    }

    /**
     * Registra el fin de la sesión, calcula el costo total y liquida el pago.
     */
    public async recordPartAndSettle(userId: string): Promise<void> {
        const joinedTime = this.activeSessions.get(userId);
        
        if (!joinedTime) {
            console.warn(`[Session] ⚠️ Usuario ${userId} desconectado, pero no hay registro de inicio. Ignorando.`);
            return;
        }

        this.activeSessions.delete(userId);
        
        const partedTime = Date.now();
        const durationSeconds = Math.ceil((partedTime - joinedTime) / 1000);
        const amountUsdc = durationSeconds * this.RATE_PER_SECOND;

        console.log(`[Session] 🔴 Usuario ${userId} desconectado. Tiempo visto: ${durationSeconds}s. Cobro: $${amountUsdc.toFixed(6)} USDC.`);

        if (amountUsdc <= 0) {
            console.log(`[Session] ℹ️ El monto es demasiado bajo para cobrar.`);
            return;
        }

        try {
            // 1. Obtener la llave de sesión (delegada) del usuario
            const signer = await walletService.getSessionSignerForUser(userId);

            // 2. Ejecutar la liquidación on-chain con Gateway
            await settlementService.settleSession(signer, amountUsdc, this.SELLER_ADDRESS);
        } catch (error: any) {
            console.error(`[Session] ❌ Fallo al procesar el cierre de sesión para ${userId}: ${error.message}`);
        }
    }
}

export const sessionService = new SessionService();
