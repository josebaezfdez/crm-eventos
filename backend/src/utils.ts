import { eq, and, inArray } from 'drizzle-orm'

export async function assertTenantResource(
  db: any,
  table: any,
  id: string,
  companyId: string,
  resourceName: string = 'Recurso'
): Promise<void> {
  const results = await db.select({ id: table.id }).from(table).where(and(eq(table.id, id), eq(table.companyId, companyId)))
  if (results.length === 0) {
    throw new Error(`${resourceName} no encontrado o no pertenece a la empresa actual.`)
  }
}

export async function assertTenantResources(
  db: any,
  table: any,
  ids: string[],
  companyId: string,
  resourceName: string = 'Recursos'
): Promise<void> {
  if (!ids || ids.length === 0) return;
  const results = await db.select({ id: table.id }).from(table).where(and(inArray(table.id, ids), eq(table.companyId, companyId)))
  if (results.length !== ids.length) {
    throw new Error(`Alguno de los ${resourceName} no fue encontrado o no pertenece a la empresa actual.`)
  }
}
