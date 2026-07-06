import { z } from "zod";

export const SIGNUP_PASSWORD_HINT =
  "Minimo 8 caratteri, con lettere, numeri, una maiuscola e un carattere speciale";

export const loginPasswordSchema = z
  .string()
  .min(6, "La password deve avere almeno 6 caratteri");

export const signupPasswordSchema = z
  .string()
  .min(8, "La password deve avere almeno 8 caratteri")
  .regex(/[a-zA-Z]/, "La password deve contenere almeno una lettera")
  .regex(/\d/, "La password deve contenere almeno un numero")
  .regex(/[A-Z]/, "La password deve contenere almeno una lettera maiuscola")
  .regex(/[^a-zA-Z0-9]/, "La password deve contenere almeno un carattere speciale");

export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: loginPasswordSchema,
});

export const signupSchema = z
  .object({
    email: z.string().email("Email non valida"),
    password: signupPasswordSchema,
    firstName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
    lastName: z.string().min(2, "Il cognome deve avere almeno 2 caratteri"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non corrispondono",
    path: ["confirmPassword"],
  });
