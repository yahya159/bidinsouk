declare module "@prisma/client" {
  // Minimal ambient types to satisfy the compiler until `prisma generate` runs.
  export class PrismaClient {
    $queryRaw<T = unknown>(
      strings: TemplateStringsArray,
      ...values: ReadonlyArray<unknown>
    ): Promise<T>;
  }
}


