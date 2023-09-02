import { readFile } from 'fs/promises'
import { parse as parseCsv } from 'csv-parse/sync'

import { bondsCsvSchema, cliArgsSchema } from './schemas'
import { calculateBondValues } from './treasury-direct-calculator'
import { format } from 'date-fns'

export const main = async (): Promise<void> => {
    try {
        const { inputCsvFilePath, asOfDate } = cliArgsSchema.parse(process.argv)

        console.log(`Reading ${inputCsvFilePath}...`)

        const bondsCsv = await readFile(inputCsvFilePath)
        const bonds = bondsCsvSchema.parse(parseCsv(bondsCsv))

        console.log(`Calculating value of ${bonds.length} bonds${asOfDate ? `as of ${asOfDate?.toLocaleTimeString()}` : ''}...`)

        const { valuesAsOfDate, bondValues } = await calculateBondValues(bonds, asOfDate)
        console.table(bondValues)

        console.log('Values as of date', format(valuesAsOfDate, 'MM/yyyy'))
    
        const totalValue = bondValues.reduce<number>((acc, bondValue) => acc += bondValue.value, 0)
        console.log('Total Value', totalValue)
    } catch (e) {
        console.error(`Error: ${(e as Error).message}`)
        console.log('Usage: ./savings-bonds-calculator [csv file] [as of date (optional)]')
    }
}
