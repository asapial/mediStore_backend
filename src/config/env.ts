import dotenv from 'dotenv';
import status from 'http-status';
import AppError from '../errorHelpers/AppError';

dotenv.config();

interface EnvConfig {
    BACKEND_URL: string;
    ORIGIN_URL: string;
    BETTER_AUTH_URL: string;
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    NODE_ENV: string;
   
}


const loadEnvVariables = (): EnvConfig => {

    const requireEnvVariable = [
        'BACKEND_URL',
        'ORIGIN_URL',
        'BETTER_AUTH_URL',
        'DATABASE_URL',
        'BETTER_AUTH_URL',
        'BETTER_AUTH_SECRET',
        'NODE_ENV',
        
    ]

    requireEnvVariable.forEach((variable) => {
        if (!process.env[variable]) {
            // throw new Error(`Environment variable ${variable} is required but not set in .env file.`);
            throw new AppError(status.INTERNAL_SERVER_ERROR, `Environment variable ${variable} is required but not set in .env file.`);
        }
    })

    return {
        BACKEND_URL: process.env.BACKEND_URL as string,
        ORIGIN_URL: process.env.ORIGIN_URL as string,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
        NODE_ENV: process.env.NODE_ENV as string,
      
    }
}

export const envVars = loadEnvVariables();