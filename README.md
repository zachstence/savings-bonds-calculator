# savings-bonds-calculator

Calculate the value of your United States EE Paper Savings Bonds

<p align="center">
    <a href="https://github.com/zachstence/savings-bonds-calculator/blob/main/LICENSE">
        <img alt="license mit" src="https://img.shields.io/github/license/zachstence/savings-bonds-calculator?style=for-the-badge" />
    </a>
    <a href="#">
        <img alt="wakatime" src="https://wakatime.com/badge/user/2a0a4013-ea89-43b7-99d9-1a215b4c34d0/project/f3add325-825f-4812-a31d-2e288322374f.svg?style=for-the-badge" />
    </a>
</p>

## Details

This project is an alternative to the [Treasury Direct Paper Savings Bonds calculator](https://www.treasurydirect.gov/BC/SBCPrice). Input on that site is tedious and error prone. Instead, simply provide a CSV file to this script and it will get all the data for you.

## Setup
```sh
git clone https://github.com/zachstence/savings-bonds-calculator
cd savings-bonds-calculator
npm i
```

## Usage
```sh
./savings-bonds-calculator [csv file] [as of date (optional)]

# e.g.
./savings-bonds-calculator ./bonds.csv
./savings-bonds-calculator ./bonds.csv 01/2020
```
