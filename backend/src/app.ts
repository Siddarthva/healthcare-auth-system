import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
// import routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import patientRoutes from './modules/patients/patients.routes';
import consentRoutes from './modules/consent/consent.routes';
import emergencyRoutes from './modules/emergency/emergency.routes';
import adminRoutes from './modules/admin/admin.routes';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { redis } from './config/redis';

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(
    morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) },
    })
);

app.get("/", (req, res) => {
    res.json({
        status: "OK",
        service: "Healthcare Auth API",
        timestamp: new Date()
    });
});

app.get("/api/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        await redis.ping();
        res.json({
            status: "UP",
            database: "CONNECTED",
            redis: "CONNECTED",
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({
            status: "DOWN",
            database: "DISCONNECTED",
            redis: "DISCONNECTED",
            uptime: process.uptime()
        });
    }
});

// Routes
app.use('/api/', rateLimiter); // Apply rate limiting to all API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling (Must be last)
app.use(errorHandler);

export default app;
