import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcrypt'

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
