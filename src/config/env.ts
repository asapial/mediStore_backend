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
        CLOUDINARY:{
        CLOUDINARY_CLOUD_NAME: string;
        CLOUDINARY_API_KEY: string;
        CLOUDINARY_API_SECRET: string;
    },
   
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
                'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
        
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
        NODE_ENV: process.env.NODE_ENV as string,
                CLOUDINARY: {
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
            CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
            CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
        },
      
    }
}

export const envVars = loadEnvVariables();