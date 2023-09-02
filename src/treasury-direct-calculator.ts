import axios from 'axios'
import { format } from 'date-fns'
import { load as cheerioLoad } from 'cheerio'

import { Bond, BondValue, bondValueTableRowSchema } from './schemas'

const UA = 'https://github.com/zachstence/treasury-direct-savings-bonds-calculator'

const client = axios.create({
    baseURL: 'https://treasurydirect.gov/'
})

const dateToMMYYYY = (date: Date): string => format(date, 'MM/yyyy')

const getPostBody = (bond: Bond, redemptionDate = new Date()): string => {
    const jsonBody: Record<string, string> = {
        'RedemptionDate': dateToMMYYYY(redemptionDate),
        'Series': bond.series,
        'Denomination': bond.denomination.toFixed(0),
        'SerialNumber': bond.serialNumber,
        'IssueDate': dateToMMYYYY(bond.issueDate),
        'btnAdd.x': 'CALCULATE',
    }

    const tokens = Object.entries(jsonBody).reduce<string[]>(
        (acc, curr) => {
            const [key, value] = curr
            const encodedValue = encodeURIComponent(value)
            const token = `${key}=${encodedValue}`
            acc.push(token)
            return acc
        },
    [])

    const rawData = tokens.join('&')
    return rawData
}

const parseBondCalculatorHtml = (html: string): BondValue => {
    const $ = cheerioLoad(html)
    const cells = $('table.bnddata td').toArray().map(elm => $(elm).text())
    const bondValue = bondValueTableRowSchema.parse(cells)
    return bondValue
}

export const calculateBondValue = async (bond: Bond, redemptionDate = new Date()): Promise<BondValue> => {
    const data = getPostBody(bond, redemptionDate)

    try {
        const res = await client.post('/BC/SBCPrice', data, {
            headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': UA,
            }
        })
    
        const bondValue = parseBondCalculatorHtml(res.data)
        return bondValue
    } catch (e) {
        if (axios.isAxiosError(e)) {
            const body = e.response?.data
            console.error('calculateBondValue POST request failed', body)
        }
        throw e
    }
}

export const calculateBondValues = async (bonds: Bond[], redemptionDate = new Date()): Promise<BondValue[]> => Promise.all(bonds.map(bond => calculateBondValue(bond, redemptionDate)))