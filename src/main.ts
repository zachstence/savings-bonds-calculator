import { readFile } from 'fs/promises'
import { parse as parseCsv } from 'csv-parse/sync'

import { bondsCsvSchema } from './schemas'
import { calculateBondValues } from './treasury-direct-calculator'

const main = async (): Promise<void> => {
    const bondsCsv = await readFile('./bonds.csv')
    const bonds = bondsCsvSchema.parse(parseCsv(bondsCsv))
    
    const bondValues = await calculateBondValues(bonds)
    console.table(bondValues)

    const totalValue = bondValues.reduce<number>((acc, bondValue) => acc += bondValue.value, 0)
    console.log('Total Value', totalValue)
}

main()
