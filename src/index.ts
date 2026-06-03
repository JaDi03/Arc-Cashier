import dotenv from 'dotenv';
import { createServer } from './server';

// Inicializar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 3000;

async function main() {
    try {
        const app = createServer();
        
        app.listen(PORT, () => {
            console.log(`🚀 [Production Engine] x402 Webhook Sidecar running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Fallo crítico al iniciar el servidor:", error);
        process.exit(1);
    }
}

main();
