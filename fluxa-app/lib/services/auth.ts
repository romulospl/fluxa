import { db } from '@/lib/db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function registerUser({ name, email, password, walletAddress }: any) {
  // 1. Validação de regras de negócio (ex: e-mail já existe)
  const existingUser = await db.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    throw new Error('Este e-mail já está cadastrado')
  }

  // 2. Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10)

  // 3. Persistência dos dados
  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      walletAddress
    }
  })


  return {
    id: user.id,
    email: user.email,
    name: user.name,
    walletAddress: user.walletAddress,
    createdAt: user.createdAt
  }
}

export async function loginUser({ email, password }: any) {
  // 1. Busca o usuário pelo e-mail
  const user = await db.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw new Error('E-mail ou senha incorretos')
  }

  // 2. Compara a senha informada com o hash no banco
  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    throw new Error('E-mail ou senha incorretos')
  }

  // 3. Gera o token JWT
  const secret = process.env.JWT_SECRET || 'fallback-secret'
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    secret,
    { expiresIn: '1d' }
  )

  // 4. Retorna os dados do usuário e o token
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt
    },
    token
  }
}

export async function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET || 'fallback-secret'
  try {
    return jwt.verify(token, secret) as { userId: string; email: string }
  } catch (error) {
    throw new Error('Token inválido ou expirado')
  }
}

export async function getUserFromToken(token: string) {
  const decoded = await verifyToken(token)
  
  const user = await db.user.findUnique({
    where: { id: decoded.userId }
  })

  if (!user) {
    throw new Error('Usuário não encontrado')
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    walletAddress: user.walletAddress,
    createdAt: user.createdAt
  }
}
