import axios from 'axios'
import { format } from 'date-fns'
import { load as cheerioLoad } from 'cheerio'

import { Bond, BondValue, bondValueTableRowSchema } from './schemas'

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
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Content-Type': 'application/x-www-form-urlencoded',
                'DNT': '1',
                'Origin': 'https://treasurydirect.gov',
                'Pragma': 'no-cache',
                'Referer': 'https://treasurydirect.gov/BC/SBCPrice',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
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