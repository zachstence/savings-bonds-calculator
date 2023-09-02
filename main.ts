import { readFile } from 'fs/promises'
import { parse as parseCsv } from 'csv-parse/sync'
import { z } from 'zod'

const numericStringSchema = z.union([
    z.number().int().positive(),
    z.string().nonempty()]).pipe(z.coerce.number().int().positive(),
)

const bondSchema = 
    z.tuple([
        /** Series */
        z.literal('EE'),

        /** Denomination (USD) */
        numericStringSchema,

        /** Serial Number */
        z.string().nonempty(),

        /** Issue Date */
        z.string().nonempty().pipe(z.coerce.date()),
    ]).transform(([series, denomination, serialNumber, issueDate]) =>
        ({ series, denomination, serialNumber, issueDate })
    )
type Bond = z.infer<typeof bondSchema>

const bondsCsvSchema = z.array(bondSchema)
type BondsCsv = z.infer<typeof bondsCsvSchema>

const main = async (): Promise<void> => {
    const bondsCsv = await readFile('./bonds.csv')
    const bonds: Bond[] = bondsCsvSchema.parse(parseCsv(bondsCsv))
    console.log(bonds)
}

main()