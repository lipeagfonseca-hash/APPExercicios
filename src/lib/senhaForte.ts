import { z } from "zod";

/** Regra de senha das contas criadas pelo admin: 8 a 72 caracteres, com letra e número. */
export const senhaSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Za-z]/, "A senha precisa ter ao menos uma letra.")
  .regex(/\d/, "A senha precisa ter ao menos um número.");

export const MENSAGEM_SENHA_INVALIDA = "Senha de 8 a 72 caracteres, com ao menos uma letra e um número.";
