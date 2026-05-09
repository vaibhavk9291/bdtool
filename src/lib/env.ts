import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  TURSO_DATABASE_URL: z.string().default('libsql://bd-assigner-tool-vaibhavk9291.aws-ap-south-1.turso.io'),
  TURSO_AUTH_TOKEN: z.string().default('eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzgzNTI1ODEsImlkIjoiMDE5ZTBlMTAtYzgwMS03ZmJlLThjOGUtNDg4OTEzYmUwZDM5IiwicmlkIjoiZWI5Mjk1MWYtMWM2YS00NTg3LTkxZmItYzRjYzI3NmQ0ODY2In0.uedYnQdTm1rW47Gr-cz-p7u1zcGvmzn1xVNVOwVqSLqrKUvuoprd0PPEmng51Aw7-LIY24AgsT7iDL94eIg4CA'),
  NEXT_PUBLIC_DEFAULT_COUNTRY_CODE: z.string().default('+91'),
  SESSION_COOKIE_NAME: z.string().default('bd_session'),
  SESSION_MAX_AGE_DAYS: z.coerce.number().default(30),
}).refine(
  (env) => !env.TURSO_DATABASE_URL || env.TURSO_AUTH_TOKEN,
  { message: 'TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL is set' }
)

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
}

export const env = parsed.data
