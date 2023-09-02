import { readFile } from 'fs/promises'
import { parse as parseCsv } from 'csv-parse/sync'

import { bondsCsvSchema } from './schemas'
import { calculateBondValues } from './treasury-direct-calculator'
import { format } from 'date-fns'

const main = async (): Promise<void> => {
    const bondsCsv = await readFile('./bonds.csv')
    const bonds = bondsCsvSchema.parse(parseCsv(bondsCsv))

    const { valuesAsOfDate, bondValues } = await calculateBondValues(bonds)
    console.table(bondValues)

    console.log('Values as of date', format(valuesAsOfDate, 'MM/yyyy'))

    const totalValue = bondValues.reduce<number>((acc, bondValue) => acc += bondValue.value, 0)
    console.log('Total Value', totalValue)
}

main()
