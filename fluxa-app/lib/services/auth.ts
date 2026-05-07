import { db } from '@/lib/db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function registerUser({ name, email, password }: any) {
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
      password: hashedPassword
    }
  })


  return {
    id: user.id,
    email: user.email,
    name: user.name
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
      name: user.name
    },
    token
  }
}
