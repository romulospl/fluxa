import { db } from '@/lib/db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function registerUser({ name, email, password, walletAddress, cnpj, address }: any) {
  const existingUser = await db.user.findUnique({ where: { email } })
  if (existingUser) throw new Error('Este e-mail já está cadastrado')

  if (cnpj) {
    const existingCnpj = await db.user.findUnique({ where: { cnpj } })
    if (existingCnpj) throw new Error('Este CNPJ já está cadastrado')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      walletAddress,
      cnpj: cnpj || null,
      ...(address && {
        address: {
          create: {
            zipCode: address.zipCode,
            street: address.street,
            number: address.number,
            complement: address.complement || null,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
          },
        },
      }),
    },
    include: { address: true },
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    cnpj: user.cnpj,
    walletAddress: user.walletAddress,
    address: user.address,
    createdAt: user.createdAt,
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

export async function updateUser(
  token: string,
  data: {
    name?: string
    email?: string
    address?: {
      zipCode?: string
      street?: string
      number?: string
      complement?: string | null
      neighborhood?: string
      city?: string
      state?: string
    }
  }
) {
  const decoded = await verifyToken(token)

  const user = await db.user.update({
    where: { id: decoded.userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.address && {
        address: {
          upsert: {
            create: {
              zipCode: data.address.zipCode ?? '',
              street: data.address.street ?? '',
              number: data.address.number ?? '',
              complement: data.address.complement ?? null,
              neighborhood: data.address.neighborhood ?? '',
              city: data.address.city ?? '',
              state: data.address.state ?? '',
            },
            update: {
              ...(data.address.zipCode !== undefined && { zipCode: data.address.zipCode }),
              ...(data.address.street !== undefined && { street: data.address.street }),
              ...(data.address.number !== undefined && { number: data.address.number }),
              ...(data.address.complement !== undefined && { complement: data.address.complement }),
              ...(data.address.neighborhood !== undefined && { neighborhood: data.address.neighborhood }),
              ...(data.address.city !== undefined && { city: data.address.city }),
              ...(data.address.state !== undefined && { state: data.address.state }),
            },
          },
        },
      }),
    },
    include: { address: true },
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    cnpj: user.cnpj,
    walletAddress: user.walletAddress,
    address: user.address
      ? {
          id: user.address.id,
          zipCode: user.address.zipCode,
          street: user.address.street,
          number: user.address.number,
          complement: user.address.complement,
          neighborhood: user.address.neighborhood,
          city: user.address.city,
          state: user.address.state,
        }
      : null,
    createdAt: user.createdAt,
  }
}

export async function getUserFromToken(token: string) {
  const decoded = await verifyToken(token)

  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    include: { address: true },
  })

  if (!user) {
    throw new Error('Usuário não encontrado')
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    cnpj: user.cnpj,
    walletAddress: user.walletAddress,
    address: user.address
      ? {
          id: user.address.id,
          zipCode: user.address.zipCode,
          street: user.address.street,
          number: user.address.number,
          complement: user.address.complement,
          neighborhood: user.address.neighborhood,
          city: user.address.city,
          state: user.address.state,
        }
      : null,
    createdAt: user.createdAt,
  }
}
