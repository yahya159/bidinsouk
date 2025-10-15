import { Prisma } from '@prisma/client'

export function auditMiddleware() {
  return Prisma.defineExtension({
    name: 'auditMiddleware',
    query: {
      async $allOperations({ operation, model, args, query }) {
        // Log the operation
        console.log(`AUDIT: ${operation} on ${model}`, args)
        
        // Execute the operation
        const result = await query(args)
        
        // You could save audit logs to the database here
        // For example:
        // await prisma.auditLog.create({
        //   data: {
        //     entity: model,
        //     entityId: result.id,
        //     diff: JSON.stringify(args),
        //     actorId: 1 // Placeholder user ID
        //   }
        // })
        
        return result
      }
    }
  })
}
