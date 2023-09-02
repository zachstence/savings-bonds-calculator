import axios from 'axios'
import { format, getMonth, getYear, startOfMonth } from 'date-fns'
import { load as cheerioLoad } from 'cheerio'

import { Bond, BondValue, bondValueTableRowSchema } from './schemas'

const UA = 'https://github.com/zachstence/savings-bonds-calculator'

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

export class TreasuryDirectCalculatorError extends Error {}

const parseBondCalculatorHtml = (html: string): BondValue => {
    const $ = cheerioLoad(html)

    const resultsTable = $('table.bnddata')
    if (resultsTable.length) {
        const cells = resultsTable.find('td').toArray().map(elm => $(elm).text())
        const bondValue = bondValueTableRowSchema.parse(cells)
        return bondValue
    }

    const errorMessage = $('.errormessage')
    if (errorMessage.length) {
        const firstError = errorMessage.find('li').toArray().map(elm => $(elm).text())[0]
        throw new TreasuryDirectCalculatorError(firstError)
    }

    throw new Error('Failed to parse TreasuryDirect calculator HTML response')
}

const MAY_MONTH_INDEX = 4
const NOVEMBER_MONTH_INDEX = 10

const getMaxValueAsOfDate = (): Date => {
    const now = Date.now()
    const nowYear = getYear(now)
    const nowMonth = getMonth(now)

    let maxMonthIndex: number
    let nextYear: boolean
    if (nowMonth < MAY_MONTH_INDEX) {
        maxMonthIndex = MAY_MONTH_INDEX
        nextYear = false
    } else if (nowMonth < NOVEMBER_MONTH_INDEX) {
        maxMonthIndex = NOVEMBER_MONTH_INDEX
        nextYear = false
    } else {
        maxMonthIndex = MAY_MONTH_INDEX
        nextYear = true
    }

    const year = nextYear ? nowYear + 1 : nowYear
    const maxValueAsOfDate = new Date(year, maxMonthIndex)
    return maxValueAsOfDate
}

type BondValueAsOfDate = {
    valueAsOfDate: Date
    bondValue: BondValue
}

type BondValuesAsOfDate = {
    valuesAsOfDate: Date
    bondValues: BondValue[]
}

export const calculateBondValue = async (bond: Bond, valueAsOfDate = getMaxValueAsOfDate()): Promise<BondValueAsOfDate> => {
    const data = getPostBody(bond, valueAsOfDate)

    try {
        const res = await client.post('/BC/SBCPrice', data, {
            headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': UA,
            }
        })
    
        const bondValue = parseBondCalculatorHtml(res.data)

        return {
            valueAsOfDate,
            bondValue,
        }
    } catch (e) {
        if (axios.isAxiosError(e)) {
            const body = e.response?.data
            console.error('calculateBondValue POST request failed', body)
        }
        throw e
    }
}

export const calculateBondValues = async (bonds: Bond[], valuesAsOfDate = getMaxValueAsOfDate()): Promise<BondValuesAsOfDate> => {
    const bondValues = await Promise.all(
        bonds.map(async bond => {
            const { bondValue } = await calculateBondValue(bond, valuesAsOfDate)
            return bondValue
        })
    )

    return {
        valuesAsOfDate,
        bondValues,
    }
}
