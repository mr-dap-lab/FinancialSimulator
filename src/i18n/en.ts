import type { Dictionary } from './es'

/**
 * English translation. Typed against the Spanish dictionary, so a key added
 * there fails the build here until it is translated.
 */
export const en: Dictionary = {
  app: {
    title: 'Financial Simulator',
    tabs: {
      savings: 'Savings',
      savingsGoal: 'Savings goal',
      retirement: 'Retirement',
      loan: 'Loan',
      debtConsolidation: 'Debt consolidation',
      card: 'Credit card',
      budget: 'My Budget',
    },
    navLabel: 'Simulators',
    footer: 'Estimated projections. Not financial advice.',
    language: 'Language',
    currency: 'Currency',
    currencyUSD: 'Dollar (USD)',
    currencyEUR: 'Euro (EUR)',
    currencyGBP: 'Pound (GBP)',
    currencyKYD: 'Cayman Dollar (KYD)',
    currencyCOP: 'Pesos',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    settings: 'Settings',
  },

  common: {
    helpFor: (label: string) => `Help: ${label}`,
    legalDisclaimer:
      "This tool is for educational and personal planning purposes only. It does not constitute financial, tax, or legal advice, and Financial Simulator is not a financial advisor or financial advisory tool. Figures shown are estimates based solely on the assumptions you enter and may not reflect actual results. Consult a licensed financial professional before making decisions based on this information.",
    parameters: 'Parameters',
    liveRecalc: 'Every change recalculates the projection instantly.',
    reset: 'Reset values',
    exportCsv: 'Export CSV',
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
    year: 'Year',
    month: 'Month',
    months: 'months',
    years: 'years',
    date: 'Date',
    schedule: 'Month-by-month detail',
    none: 'None',
    never: 'Never',
    add: 'Add',
    delete: 'Delete',
    monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    chartDataTable: (title: string) => `Data for: ${title}`,
    chartTrendSummary: (title: string, from: string, to: string) =>
      `${title}. Line chart, from ${from} to ${to}.`,
    chartSummary: (title: string, description: string) => `${title}. ${description}`,
    category: 'Category',
    value: 'Value',
    viewReport: 'View report',
    downloadPdf: 'Download PDF',
    close: 'Close',
    generatedOn: (date: string) => `Generated on ${date}`,
    reportParameters: 'Parameters entered',
    csvForFullDetail: 'Download the CSV for the full detail.',
    yes: 'Yes',
    no: 'No',
  },

  savings: {
    introTitle: 'Watch a monthly contribution grow.',
    introDescription: 'Project how a fixed monthly deposit compounds with interest, net of withholding tax.',
    monthlyContribution: 'Monthly contribution',
    monthlyContributionHint: 'Fixed amount you deposit each month.',
    monthlyContributionHelp: 'What you contribute every month, always the same unless you turn on yearly growth.',
    monthlyContributionHelpLong:
      "It's a fixed contribution month to month — it doesn't change within a given year. If you want it to rise over time (say, to keep pace with your income), use the \"Contribution growth\" field, which increases it by a percentage at the start of each year without you having to re-enter it yourself.",
    annualRate: 'Annual interest (%)',
    annualRateHint: 'Nominal annual rate. Sets the base tier.',
    annualRateHelp: 'The annual interest rate your savings account pays.',
    annualRateHelpLong:
      'This is the model\'s base rate: each month\'s interest is calculated as this rate divided by 12, not as true monthly compounding (that comparison is available separately, under "True monthly compounding"). If you use rate tiers, this field sets the first tier, and any change here is reflected in it automatically.',
    withholding: 'Withholding (%)',
    withholdingHint: 'Tax withheld on the interest.',
    withholdingHelp: 'The percentage of tax your bank withholds on the interest you earn.',
    withholdingHelpLong:
      'It applies only to the interest generated each month, never to the principal you contribute. The result — "net interest" — is what actually gets credited to your balance; gross interest (before this withholding) is also shown separately so you can see what the tax is costing you.',
    years: 'Years',
    yearsHint: (months: number) => `Projection horizon — ${months} months.`,
    yearsHelp: 'How many years you want to project the savings.',
    yearsHelpLong:
      "Sets the full horizon of the projection — the chart, the detail table, and the final balance are all calculated up to this point, not a month more. Changing this value doesn't affect any other part of the model, only how far it extends.",
    growth: 'Contribution growth (% per year)',
    growthHint: 'Increases the contribution at the start of each year.',
    growthHelp: 'Raises the monthly contribution by a percentage every year, instead of keeping it fixed.',
    growthHelpLong:
      "At the start of each year (not each month), the monthly contribution is multiplied by 1 plus this percentage, so the increase applies once a year and then holds steady until the next. Leave it at 0% for a perfectly constant contribution throughout the horizon.",
    realCompounding: 'True monthly compounding',
    realCompoundingHint: 'Compares against the annual interest ÷ 12 model.',

    tiers: 'Rate tiers',
    tiersEnabled: 'Use rate tiers',
    tiersEnabledHint: 'When off, or with a single tier, the "Annual interest" field is used.',
    tiersSummary: (count: number, mode: string) => `${count} tiers · ${mode}`,
    tiersBaseOnly: 'Using the base rate',
    byAge: 'By age',
    byBalance: 'By balance',
    byAgeHelp: 'The rate for month t is the tier with the largest "from month" ≤ t.',
    byBalanceHelp:
      "Evaluated against the prior month's balance, so the rate steps up as the fund grows.",
    addTier: 'Add tier',
    tierLimitReached: (max: number) => `Maximum ${max} tiers.`,
    fromMonth: 'From month',
    minBalance: 'Minimum balance',
    tierRate: 'Annual rate',
    firstTierLocked: 'The first tier sets the base rate and cannot be removed',
    monthOne: 'Month 1',
    tierFootnote: (start: string) =>
      `The first tier always starts at ${start} and takes its rate from the "Annual interest" field. Tiers sort themselves ascending.`,
    tierStartMonth: 'month 1',
    tierStartBalance: 'balance 0',
    duplicateTier: (unit: string, at: number) => `Two tiers start at the same ${unit} (${at}).`,
    tierBeyondHorizon: (months: number) =>
      `Some tiers start after month ${months} and never apply.`,
    unitMonth: 'month',
    unitBalance: 'balance',

    finalBalance: 'Final balance',
    finalBalanceCaption: (month: number) => `At month ${month}`,
    totalContributed: 'Total contributed',
    totalContributedCaption: (count: number) => `${count} monthly contributions`,
    grossInterest: 'Gross interest earned',
    grossInterestCaption: 'Before withholding',
    totalWithholding: 'Total withholding',
    totalWithholdingCaption: (rate: string) => `${rate} on the interest`,
    netInterest: 'Net interest earned',
    netInterestCaption: 'What is actually credited',
    multiplier: 'Multiplier',
    multiplierCaption: 'Final balance ÷ total contributed',

    comparisonDivided: 'Annual interest ÷ 12',
    difference: 'Difference',

    sentence: (args) =>
      `Contributing ${args.contribution} a month for ${args.years === 1 ? '1 year' : `${args.years} years`} at ${args.rate} a year${args.growth}${args.tiers}, you would accumulate ${args.balance}, of which ${args.interest} is interest.`,
    sentenceGrowth: (rate: string) => `, with the contribution rising ${rate} a year`,
    sentenceTiers: (count: number) => ` (with ${count} rate tiers)`,

    chartGrowth: 'Balance growth',
    chartGrowthHint: 'The gap between the two curves is the accumulated interest.',
    chartComposition: 'Final composition',
    chartCompositionHint: 'How much you put in versus how much the interest did.',
    chartMonthly: 'Monthly interest received',
    chartMonthlyHint: 'Average monthly credit in each year.',
    seriesBalance: 'Total balance',
    seriesContributed: 'Total contributed',
    sliceContributions: 'Contributions',
    sliceInterest: 'Net interest',
    seriesAverageInterest: 'Average monthly interest',

    colContribution: 'Contribution',
    colGrossInterest: 'Annual interest',
    colWithholding: 'Withholding',
    colNetInterest: 'Net interest',
    colMonthlyInterest: 'Monthly interest',
    colBalance: 'Balance',
    scheduleHint: (count: number) => `${count} months · grouped by year`,
  },


  savingsGoal: {
    introTitle: 'When will you hit your goal?',
    introDescription:
      "Find out how long it'll take to reach a target amount — or what monthly contribution gets you there on schedule.",
    goal: 'Savings goal',
    goalHint: 'How much you want saved by the end of the term.',
    goalHelp:
      'The amount you want to reach. Used to work out how long it would take at your current contribution, and what contribution would get you there right on time.',
    goalHelpLong:
      'This amount feeds two different calculations at once: "Months to reach it" searches for the exact month your current contribution, growing at the expected return, hits this figure; "Required contribution" solves the reverse question — what constant contribution would land exactly on this goal in the term you set. The slider uses a log scale for large goals, so small amounts don\'t get squeezed into the first few pixels.',
    years: 'Target years',
    yearsHint: (months: number) => `Goal term — ${months} months.`,
    yearsHelp:
      'The timeframe you have in mind. Used to work out the exact contribution that would reach the goal in that time, and as the horizon for the chart and table.',
    yearsHelpLong:
      'Unlike "Months to reach it" (which depends on your real contribution), this term is fixed — you choose it, and the model works out what constant contribution would meet the goal exactly in those years, not a month more. It also sets how far the chart\'s axis extends and how many rows the detail table has.',
    currentSavings: 'Currently saved',
    currentSavingsHint: 'What you already have saved toward this goal.',
    currentSavingsHelp:
      'The starting balance before the first contribution. Counts in your favour both for time remaining and for the required contribution.',
    currentSavingsHelpLong:
      "It's added to the model as month 0's balance, before any contribution or interest is credited — so the higher this value, the less time it takes to reach the goal and the smaller the monthly contribution required to get there within the chosen term.",
    monthlyContribution: 'Monthly contribution',
    monthlyContributionHint: 'What you contribute each month — compared against the required contribution.',
    monthlyContributionHelp:
      'The contribution you actually plan to make. It is not adjusted automatically: it is compared against the contribution that would meet the goal exactly, so you can see whether you are ahead or behind.',
    monthlyContributionHelpLong:
      'Unlike "Required contribution" (which the model calculates for you), this is a value you control directly — the whole point of the feature is comparing the two: whether your real contribution exceeds, matches, or falls short of the one that would meet the goal exactly within the chosen term.',
    expectedReturn: 'Expected return (% annual, EAR)',
    expectedReturnHint: 'Effective annual rate, same as in Loan.',
    expectedReturnHelp:
      'The rate you expect to earn on your savings, effective annual. Converted internally to an equivalent monthly rate; there is no convention selector because reading it any other way would not make sense here.',
    expectedReturnHelpLong:
      "Used as the growth rate of an annuity-due (the contribution is credited at the start of each month, before that month earns interest) — the same convention the Savings model uses. Converted to an equivalent monthly rate, it's what grows both your real-contribution curve and the required-contribution curve in the chart.",
    expectedInflation: 'Expected inflation (% annual)',
    expectedInflationHint: 'For reference only — does not change the required contribution.',
    expectedInflationHelp:
      "Used only to show what your goal would be worth in today's money. It does not affect the time to reach it or the required contribution, which are always calculated in nominal terms.",
    expectedInflationHelpLong:
      "It's deliberately read-only for the rest of the model: the original reference doesn't make clear what else it should affect, so here it only discounts the goal to today's money for the \"Goal in today's purchasing power\" card — time to reach it and the required contribution are always calculated in nominal terms, with no inflation adjustment.",

    duration: (years: number, months: number) => {
      const y = years > 0 ? `${years} ${years === 1 ? 'year' : 'years'}` : ''
      const m = months > 0 ? `${months} ${months === 1 ? 'month' : 'months'}` : ''
      if (y && m) return `${y} and ${m}`
      return y || m || 'less than a month'
    },
    headlineReachable: (duration: string) => `You could reach your goal in ${duration}.`,
    headlineAlreadyMet: 'You already reached your goal with what you have saved.',
    headlineNeverZero:
      "With this contribution you would never reach the goal: you aren't saving anything, and the expected return doesn't generate growth on its own.",
    headlineNeverTooSlow:
      'With this contribution it would take over 100 years to reach the goal — increase it or adjust the term.',

    goalCard: 'Goal',
    requiredContribution: 'Required contribution',
    requiredContributionCaption: (contribution: string) => `Your current contribution is ${contribution}`,
    purchasingPower: "Goal in today's purchasing power",
    purchasingPowerCaption: 'Adjusted for expected inflation',

    chartTitle: 'Savings plan by year',
    chartHint: 'Your contribution against the one that meets the goal exactly, year by year.',
    seriesAtContribution: 'At your contribution',
    seriesAtRequired: 'Contribution that meets the goal',
    referenceLineLabel: 'Goal',
    captionAtContribution: (amount: string, comparison: 'exceeds' | 'meets' | 'short') => {
      const verb =
        comparison === 'exceeds' ? 'exceeds' : comparison === 'meets' ? 'meets' : "doesn't reach"
      return `Saving ${amount} a month ${verb} your goal${comparison === 'short' ? '' : ' exactly'}.`
    },
    captionAtRequired: (amount: string) => `Saving ${amount} a month meets your goal exactly.`,

    colYear: 'Year',
    colBalanceAtContribution: 'Balance at your contribution',
    colBalanceAtRequired: 'Balance at required contribution',
    colDifferenceVsGoal: 'Difference vs. goal',
    scheduleHint: (count: number) => `${count} years projected`,
  },

  retirement: {
    introTitle: "From today's savings to tomorrow's income.",
    introDescription:
      "See how today's contributions become monthly income at retirement, after taxes and inflation.",
    startingBalance: 'Starting balance',
    startingBalanceHelp: 'What you already have saved for retirement, today.',
    startingBalanceHelpLong:
      "It's the balance the accumulation phase starts from — it enters the model before the first annual contribution, so it also earns a return starting in year 1. The higher it is, the smaller the balance you need to build through your own contributions to reach the same balance at retirement.",
    annualContribution: 'Annual contribution',
    annualContributionHelp:
      'What you contribute each year, at the start of the year. The year you retire does not count as a contribution year.',
    annualContributionHelpLong:
      "It's credited as an annuity-due: the year's contribution lands before that year earns a return, not after. Contribution years run from your current age up to one year before retirement age — if you retire at 65 having started at 45, that's 20 contributions, not 21, because the retirement year itself carries no contribution.",
    currentAge: 'Current age',
    currentAgeHelp: 'Your age today.',
    currentAgeHelpLong:
      "Together with retirement age, it sets how many years the accumulation phase runs — the difference between the two is exactly the number of annual contributions the model makes.",
    retirementAge: 'Retirement age',
    retirementAgeHelp: 'The age you plan to retire. Must be greater than your current age.',
    retirementAgeError: 'Retirement age must be greater than your current age.',
    retirementAgeHelpLong:
      "Marks the end of accumulation and the start of retirement — the balance built up to this point is what turns into the retirement phase's monthly income. If you try to set a retirement age at or below your current age, the field shows an error instead of computing an invalid result.",
    retirementYears: 'Years in retirement',
    retirementYearsHelp: 'How many years you expect to spend in retirement.',
    retirementYearsHelpLong:
      "Sets the retirement phase's horizon — the monthly income is calculated so the balance runs out exactly at the end of these years (an ordinary annuity), not before or after. A longer horizon with the same balance always produces a lower monthly income.",
    growWithInflation: 'Grow contributions with inflation',
    growWithInflationHelp:
      'Raises the contribution every year in step with expected inflation, instead of keeping it fixed.',
    growWithInflationHelpLong:
      "On, each year's contribution is the previous one multiplied by 1 plus expected inflation — so year 10's contribution is larger in nominal terms than year 1's, even though it represents the same purchasing power. Off, the annual contribution is identical every year, and its real value erodes with inflation.",
    taxDeferred: 'Tax-deferred savings',
    taxDeferredHelp:
      "When on, growth isn't taxed each year and tax is charged on withdrawal instead. When off, tax is charged each year on the return, and the withdrawal itself is not taxed again.",
    taxDeferredHelpLong:
      "This switch decides which of the two tax rates (current or retirement) actually applies: tax-deferred, accumulation's return grows untaxed and tax is charged on the monthly income once withdrawn, at the retirement rate; not deferred, each year's return is already taxed at the current rate, so retirement's monthly income isn't taxed again — otherwise the same money would be taxed twice.",

    returnsCardTitle: 'Returns, taxes and inflation',
    returnBefore: 'Return before retirement (% annual)',
    returnBeforeHelp: 'The return you expect while you are still contributing.',
    returnBeforeHelpLong:
      "It's the rate that grows the balance through the whole accumulation phase, as an annuity-due. There's no convention selector — it's always read as an effective annual rate.",
    returnDuring: 'Return during retirement (% annual)',
    returnDuringHelp:
      'The return you expect while withdrawing the money — usually lower, from more conservative investment choices.',
    returnDuringHelpLong:
      "Unlike the accumulation return, this one is used in an ordinary annuity (income paid at the end of each month) — the only convention of that kind anywhere in the app, needed so the model reproduces the same numbers as the reference calculator.",
    currentTaxRate: 'Current tax rate (%)',
    currentTaxRateHelp: 'Your tax rate today. Only applies when savings are not tax-deferred.',
    currentTaxRateHelpLong:
      "Only takes effect when \"Tax-deferred savings\" is off — in that case, this rate taxes the accumulation return every year. With tax deferral on, this field plays no part in the calculation.",
    retirementTaxRate: 'Retirement tax rate (%)',
    retirementTaxRateHelp: 'Your expected tax rate in retirement.',
    retirementTaxRateHelpLong:
      "Only takes effect when \"Tax-deferred savings\" is on — in that case, this rate taxes the pre-tax monthly income to arrive at the after-tax income. Note: this branch of the model was checked against a reference with 0% tax in both fields, so treat results at a nonzero rate as reasonable but not verified figure by figure.",
    inflation: 'Expected inflation (%)',
    inflationHelp: "Used for today's purchasing power and, when on, to grow contributions.",
    inflationHelpLong:
      "It has two uses, both optional: it discounts the after-tax monthly income to today's purchasing power (always on — it's the headline summary figure), and if \"Grow contributions with inflation\" is on, it also raises each year's contribution at this same pace.",

    headline: (amount: string) => `Your savings produce ${amount} a month after tax and inflation.`,
    balanceAtRetirement: 'Balance at retirement',
    monthlyIncomeBeforeTax: 'Monthly income before tax',
    monthlyIncomeAfterTax: 'Monthly income after tax',
    monthlyIncomeToday: "Monthly income in today's purchasing power",

    incomeChartTitle: (retirementAge: number, years: number) =>
      `Monthly income at age ${retirementAge}, for ${years} years`,
    incomeChartHint: 'Before and after tax, without and with expected inflation.',
    groupBeforeInflation: 'Before inflation',
    groupWithInflation: (rate: string) => `${rate} inflation`,
    seriesBeforeTax: 'Before tax',
    seriesAfterTax: 'After tax',

    accumulationChartTitle: 'Retirement savings by year',
    accumulationChartHint: 'Projected balance from your current age to retirement.',
    finalBalanceLabel: (amount: string) => `Final balance ${amount}`,
    seriesBalance: 'Balance',

    depletionChartTitle: 'Balance during retirement',
    depletionChartHint: 'How the balance runs down month by month as you draw the monthly income.',

    accumulationSection: 'Accumulation',
    retirementSection: 'Retirement',
    colYear: 'Year',
    colAge: 'Age',
    colContribution: 'Contribution',
    colBalance: 'Balance',
    colMonthlyIncome: "Month's income",
    colRemainingBalance: 'Remaining balance',
    accumulationScheduleHint: (count: number) => `${count} years of accumulation`,
    retirementScheduleHint: (count: number) => `${count} years in retirement`,
  },

  loan: {
    introTitle: 'Understand what a loan really costs.',
    introDescription:
      'Model the full amortization schedule — payment, interest, and payoff timeline — across different repayment systems.',
    principal: 'Loan amount',
    principalHint: 'Principal disbursed.',
    principalHelp: 'The principal disbursed at the start of the loan.',
    principalHelpLong:
      "It's the starting point for the whole amortization: the outstanding balance in month 1, before any instalment. It doesn't include insurance or fees — those are added separately to each instalment, but never added to the principal you're paying down.",
    rate: 'Interest rate',
    rateHint: (monthly: string) => `= ${monthly} effective monthly`,
    rateEarHint: (ear: string) => `≈ ${ear} EAR`,
    rateHelp: 'The rate the loan charges, in whichever convention you pick (EAR, Nominal monthly, or Monthly).',
    rateHelpLong:
      "The three conventions describe the same real rate in different ways: EAR is the effective annual rate, Nominal monthly is an annual rate divided by 12 with no compounding, and Monthly is the effective monthly rate directly. The field is always converted internally to a monthly rate before amortizing, and that equivalent monthly rate is shown right below so you can compare loans quoted in different conventions. If you pick Nominal monthly or Monthly, the equivalent EAR is also shown below, computed by compounding that monthly rate over 12 months.",
    conventionEA: 'EAR (effective annual)',
    conventionNominal: 'Nominal annual, monthly',
    conventionMonthly: 'Effective monthly',
    conventionShortEA: 'EAR',
    conventionShortNominal: 'Nominal',
    conventionShortMonthly: 'Monthly',
    term: 'Term',
    termHint: (months: number, years: string) => `${months} months · ${years} years`,
    termHelp: 'How many months or years the loan runs.',
    termHelpLong:
      "Sets how many instalments the loan has. The months/years toggle only changes how you enter the value — internally the model always works in months — so switching from 5 years to 60 months changes nothing about the result, it's the same figure in two units.",
    termUnitMonths: 'months',
    termUnitYears: 'years',
    disbursementDate: 'Disbursement date',
    disbursementDateHint: 'Only used to date the instalments.',
    disbursementDateHelp: 'The date the loan is disbursed.',
    disbursementDateHelpLong:
      "This date doesn't affect any calculation in the model — the instalment amount, interest, and balance are exactly the same no matter which date you pick. It's only used to put a real date on each instalment in the detail table and the exported CSV, instead of showing month numbers alone.",
    system: 'Amortization system',
    systemFrench: 'Level payment',
    systemGerman: 'Constant principal',
    systemBullet: 'Interest only + balloon at the end',
    systemHelp: 'How each instalment splits between interest and principal.',
    systemHelpLong:
      'Level payment (French) pays the same amount every month, with interest falling and principal rising over time — the most common system for consumer and mortgage loans. Constant principal (German) always pays down the same amount of principal, so the total instalment falls month by month because interest is calculated on an ever-smaller balance. Bullet pays interest only for the whole term, with the full principal paid in one lump sum on the last instalment.',
    graceMonths: 'Grace period (months)',
    graceMonthsHint: 'Months before amortization starts.',
    graceMonthsHelp: "Months at the start of the loan where principal isn't paid down yet.",
    graceMonthsHelpLong:
      "During these months the principal doesn't fall — the grace type (below) decides what happens to interest in the meantime: paid each month, or capitalised and added to the balance. After this period, amortization starts normally over the remaining term.",
    graceType: 'Grace type',
    graceInterestOnly: 'Interest only',
    graceTotal: 'Total / capitalises interest',
    graceBadge: 'grace',
    graceTypeHelp: 'What happens to interest during the grace period.',
    graceTypeHelpLong:
      "\"Interest only\" means you pay each grace month's interest, so the balance neither grows nor shrinks. \"Total / capitalises interest\" means you pay nothing during grace, and the unpaid interest is added to the balance instead — the loan ends up costing more, but there's no instalment while grace lasts.",

    charges: 'Insurance and fees',
    chargesActive: 'Active',
    chargesNone: 'No fees',
    lifeInsurance: 'Life insurance (% monthly on balance)',
    lifeInsuranceHelp: 'A percentage of the outstanding balance charged each month as life insurance.',
    lifeInsuranceHelpLong:
      "Calculated on each month's outstanding balance, not the loan's original amount — so it falls along with the balance as you amortize. It's added to the instalment as part of \"Insurance,\" without affecting the principal or interest of the loan itself.",
    assetInsurance: 'Asset / all-risk insurance (monthly)',
    assetInsuranceHelp: 'A flat monthly amount for insuring the financed asset (home, vehicle, etc.).',
    assetInsuranceHelpLong:
      "Unlike life insurance, this is a flat currency amount, not a percentage — it doesn't change even as the balance falls. It's added to the instalment every month of the loan, including grace-period months.",
    adminFee: 'Administration or origination fee (monthly)',
    adminFeeHelp: 'A flat monthly charge the lender bills for administering the loan.',
    adminFeeHelpLong:
      "Same as asset insurance, it's a flat currency amount added to the instalment every month, independent of the balance or the rate. It shows up in \"Total paid\" and \"Cost of credit,\" so set it to zero if you want to see the loan without this charge.",

    extraPayments: 'Extra payments',
    extraPaymentsCount: (count: number) => `${count} payment${count > 1 ? 's' : ''}`,
    extraPaymentsHint:
      'A payment larger than the outstanding balance is clamped to it and closes the loan.',
    addExtraPayment: 'Add payment',
    extraPaymentLimitReached: (max: number) => `Maximum ${max} payments.`,
    noExtraPayments: 'No extra payments.',
    amount: 'Amount',
    effect: 'Effect',
    reduceTerm: 'Shorten term',
    reducePayment: 'Lower instalment',

    graceCoversTerm: 'The grace period covers the whole term: no time is left to amortize.',
    extraBeyondTerm: (months: number) =>
      `Some payments are scheduled after month ${months}, when the loan is already repaid.`,

    monthlyPayment: 'Monthly instalment',
    monthlyPaymentLevel: 'The same every month',
    monthlyPaymentRange: 'First → last',
    totalPaid: 'Total paid',
    totalPaidCaption: (count: number) => `${count} instalments`,
    totalInterest: 'Total interest',
    totalInterestCaption: 'On the outstanding balance',
    totalInsurance: 'Total insurance and fees',
    totalInsuranceCaption: 'Life + asset + administration',
    creditCost: 'Cost of credit',
    creditCostCaption: 'Interest + insurance ÷ amount',
    lastPayment: 'Last instalment',
    lastPaymentCaption: (month: number) => `Month ${month}`,
    lastPaymentSaved: (months: number, saved: number) => `${months} months — ${saved} fewer`,

    savings: 'Saved by extra payments',
    savingsCaption: 'Interest you no longer pay',
    monthsSaved: 'Months saved',
    monthsSavedCaption: 'Versus the same loan with no extra payments',
    totalExtra: 'Total paid extra',
    totalExtraCaption: 'Principal paid ahead',

    sentence: (args) =>
      `A ${args.principal} loan over ${args.months} months at ${args.rate} ${args.convention} has an instalment of ${args.payment} and a total interest cost of ${args.interest}.`,

    chartBalance: 'Outstanding balance',
    chartBalanceHintExtra: 'The dashed line is the same loan without extra payments.',
    chartBalanceHint: 'Principal you still owe, month by month.',
    chartComposition: 'Instalment composition',
    chartCompositionCrossover: (month: number) =>
      `From month ${month} principal overtakes interest.`,
    chartCompositionNoCrossover: 'Interest never drops below principal within this term.',
    chartDonut: 'Principal vs. accumulated interest',
    chartDonutHint: (cost: string) => `Cost of credit: ${cost}`,
    seriesBalance: 'Outstanding balance',
    seriesBaseline: 'Without extra payments',
    seriesPrincipal: 'Principal',
    seriesInterest: 'Interest',
    seriesInsurance: 'Insurance',
    sliceCharges: 'Insurance and fees',
    crossoverLabel: (month: number) => `month ${month}`,

    colPayment: 'Instalment',
    colInterest: 'Interest',
    colPrincipal: 'Principal',
    colExtra: 'Extra payment',
    colInsurance: 'Insurance',
    colTotalPayment: 'Total instalment',
    colBalance: 'Balance',
    scheduleHint: (count: number) => `${count} instalments · grouped by year`,
  },

  debtConsolidation: {
    introTitle: 'Is consolidating worth it?',
    introDescription:
      "Compare what you're paying today across several debts against one consolidated loan — monthly payment and payoff time, side by side.",
    cardsTitle: 'Credit cards',
    addCard: 'Add card',
    cardLimitReached: (max: number) => `Maximum ${max} cards.`,
    cardLabel: (index: number) => `Credit card #${index}`,
    balance: 'Balance',
    balanceHelp: 'The current debt on this card or loan.',
    balanceHelpLong:
      "It's the starting point for working out what you pay today and how many months it would take to pay off this debt on its own — used the same way whether the debt is a card, an auto loan, or any other type.",
    rate: 'Interest rate',
    rateHelp: "This debt's interest rate, in Nominal M.V.",
    rateHelpLong:
      "This section reads every rate as Nominal M.V. (divided by 12, no compounding), not EAR — unlike Loan's own default. There's no convention selector here because every rate field in this feature is always read the same way.",
    useMinimumPayment: "Use the card's minimum payment",
    useMinimumPaymentHelp: 'When on, the payment is a percentage of the balance, not a fixed amount.',
    useMinimumPaymentHelpLong:
      "On, each month's payment is the greater of a percentage of the balance and a floor (both adjustable under \"Advanced settings\"), recalculated against that month's balance — the classic credit-card minimum payment, which can end up never paying off the debt. Off, you type your own fixed monthly payment and the card behaves like a level-payment loan.",
    advancedSettings: 'Advanced settings',
    minimumPct: 'Minimum %',
    minimumPctHint:
      "Share of the balance paid each month. Not a documented issuer figure — it's a reasonable starting point; adjust it if your card states a different one.",
    minimumPctHelp: 'The percentage of the balance paid as the minimum each month.',
    minimumPctHelpLong:
      "Recalculated every month against that month's balance, not the card's original balance, so the currency amount of the minimum falls along with the balance. If this percentage never covers that month's interest, the balance never reaches zero — the model detects that and reports it as \"Never.\"",
    minimumFloor: 'Minimum floor',
    minimumFloorHint:
      'Absolute minimum amount, even if the percentage of the balance is lower. 0 turns it off.',
    minimumFloorHelp: 'The absolute minimum amount due, even if the percentage of the balance is lower.',
    minimumFloorHelpLong:
      "Each month's real minimum payment is the greater of this flat amount and the percentage of the balance — it guards against too small a payment once the balance has already fallen a lot. Leave it at 0 to let the payment depend on the percentage alone.",
    payment: 'Payment',
    paymentHint: 'Computed automatically — turn off "Use minimum payment" to edit it.',
    paymentHelp: 'The monthly payment on this card or loan.',
    paymentHelpLong:
      'While "Use minimum payment" is on, this field is computed automatically and can\'t be edited directly. Turn it off to type your own fixed payment — in that case, if the payment doesn\'t cover the monthly interest, you\'ll see the "never covers the balance" warning instead of a month count.',
    monthlyPayment: 'Monthly payment',

    autoTitle: 'Auto loans',
    addAuto: 'Add auto loan',
    autoLimitReached: (max: number) => `Maximum ${max} auto loans.`,
    autoLabel: (index: number) => `Auto loan #${index}`,

    otherTitle: 'Other loans',
    addOther: 'Add other loan',
    otherLimitReached: (max: number) => `Maximum ${max} other loans.`,
    description: 'Description',
    descriptionHelp: "A name to tell this debt apart — free text, doesn't affect any calculation.",
    descriptionHelpLong:
      "Unlike credit cards and auto loans (which are numbered automatically), this category has no fixed name — you decide what to call it, and that's exactly the text that shows up in the detail table and the exported CSV.",
    defaultOtherDescription: 'Personal loan',

    monthsRemaining: 'Payments remaining',
    neverPaysOff: 'This payment never covers the balance.',

    consolidatedTitle: 'New consolidated loan',
    consolidatedBalance: 'Loan balance',
    consolidatedBalanceHint:
      'Starts as the sum of the balances above, but you can change it freely.',
    consolidatedBalanceHelp: 'The amount of the new loan that replaces all the debts above.',
    consolidatedBalanceHelpLong:
      "On load, it's calculated automatically as the sum of every balance entered above — but it's an independent field, so you can adjust it freely afterward (say, if the bank only approves a different amount than the exact total). It doesn't recalculate on its own while you edit the individual balances.",
    consolidatedRate: 'New loan interest rate',
    consolidatedRateHint: "Nominal M.V. — unlike Loan's own default (EAR).",
    consolidatedRateHelp: 'The new loan\'s rate, in Nominal M.V.',
    consolidatedRateHelpLong:
      "Same as every other rate in this feature, it's read as Nominal M.V. — divided by 12, no compounding — not EAR, which is Loan's own default convention. There's no selector here because this field is always read the same way.",
    consolidatedTerm: 'Term',
    consolidatedTermHelp: 'How many months the new consolidated loan runs.',
    consolidatedTermHelpLong:
      'A longer term generally lowers the monthly payment but raises the total interest paid — compare "Monthly savings" against "Total interest savings" as you change this value to see that trade-off.',
    termOption: (months: number, years: number) => `${months} (${years} ${years === 1 ? 'yr' : 'yrs'})`,
    consolidatedPayment: 'Monthly payment',

    headline: (amount: string) => `Your new monthly payment would be ${amount}.`,
    currentPayment: 'Current total payment',
    consolidatedPaymentCard: 'Consolidated payment',
    monthlySavings: 'Monthly savings',
    currentMonths: 'Months to pay off (current)',
    consolidatedMonths: 'Consolidated term (months)',
    totalInterestSavings: 'Total interest savings',
    totalInterestSavingsHint:
      "Total interest on the current debts minus total interest on the consolidated loan. The reference calculator doesn't show this, but it's the number that actually answers whether consolidating is worth it.",

    chartPaymentTitle: 'Monthly payment comparison',
    chartPaymentHint: 'What you pay today versus the consolidated loan.',
    chartTimeTitle: 'Time to pay off debt',
    chartTimeHint: 'Months until debt-free, in each scenario.',
    seriesCurrent: 'Current',
    seriesConsolidated: 'Consolidated',

    detailTitle: 'Debt detail',
    detailHint: (count: number) => `${count} debts entered`,
    colType: 'Type',
    colDescription: 'Description',
    colBalance: 'Balance',
    colRate: 'Rate',
    colPayment: 'Payment',
    colMonths: 'Months to pay off',
    typeCard: 'Card',
    typeAuto: 'Auto',
    typeOther: 'Other',

    consolidatedScheduleTitle: 'Consolidated loan schedule',
    colInterest: 'Interest',
    colPrincipal: 'Principal',
  },

  card: {
    introTitle: 'What a credit card really costs.',
    introDescription:
      'Simulate purchases, installments, and revolving balance — and see what happens if you only ever pay the minimum.',
    cardsTitle: 'Your cards',
    addCard: 'Add card',
    cardLimitReached: (max: number) => `Maximum ${max} cards.`,
    defaultCardName: (n: number) => `Card ${n}`,
    cardName: 'Card name',
    cardNameHelp: 'A name to tell this card apart from the others.',
    cardNameHelpLong:
      "Purely descriptive — it doesn't affect any calculation. Useful when you're tracking several cards at once, for example \"Chase Visa\" or \"Business card\", so you don't mix them up when switching between them.",
    franchise: 'Franchise',
    franchiseHelp: 'The card network (Visa, Mastercard, etc.).',
    franchiseHelpLong:
      "Only identifies the card in the list — like the name, it doesn't change the interest, the minimum payment, or any other projection result.",
    franchiseVisa: 'Visa',
    franchiseMastercard: 'Mastercard',
    franchiseAmex: 'American Express',
    franchiseDiscover: 'Discover',
    franchiseDiners: 'Diners Club',

    creditLimit: 'Credit limit',
    creditLimitHint: 'Approved limit on the card.',
    creditLimitHelp: 'The approved credit limit on this card.',
    creditLimitHelpLong:
      "Used only to calculate the percentage of the limit in use and to warn you if your projected purchases and balance exceed it in any month — it doesn't affect interest or the minimum payment, which depend only on the real balance.",
    openingBalance: 'Opening revolving balance',
    openingBalanceHint: 'Debt you already carry into month 1.',
    openingBalanceHelp: 'The debt you already carry on the card before the projection starts.',
    openingBalanceHelpLong:
      "It's the revolving balance month 1 starts with — before adding any new purchase or instalment plan. It accrues interest from the first month just like any revolving balance, according to the rate and payment strategy you choose.",
    usuryRate: 'Usury cap (% EAR)',
    usuryRateHint: 'Used only for the warning.',
    usuryWarning: 'Above the current usury cap',
    usuryBadge: 'USURY',
    usuryRateHelp: 'The maximum legal rate allowed, to compare against your card’s own rate.',
    usuryRateHelpLong:
      "This field is informational only — it doesn't change any calculation in the model. If the card's rate (effective annual) exceeds this value, the \"USURY\" warning appears next to the rate field so you notice it right away.",
    monthlyFee: 'Monthly card fee',
    addVat: '+ 19% VAT',
    monthlyFeeHelp: "What the bank charges each month for the card's upkeep.",
    monthlyFeeHelpLong:
      'It’s a flat charge, independent of the balance or how much you use the card. Turning on "+ 19% VAT" adds 19% on top of this value before it’s included in that month’s payment — the total with VAT is shown separately in the summary.',
    cutoffDay: 'Statement day',
    cutoffDayHint: 'Payment is due 15 days after the cutoff.',
    cutoffDayHelp: "The day of the month the card's statement is generated.",
    cutoffDayHelpLong:
      "The payment due date is calculated from this day, always 15 days later. It's also the day that cycle's purchases and instalments are frozen to calculate the statement balance — it only affects the dates shown, not the amounts.",
    horizon: 'Horizon',
    horizonHint: (months: number) => `${months} months projected.`,
    horizonHelp: 'How many months to project forward.',
    horizonHelpLong:
      'Sets how far the projection reaches — the chart, the detail table, and "Months to zero balance" never go beyond this limit. If the debt doesn’t reach zero within this horizon, it’s reported as "Never," not as a number past the horizon.',

    strategy: 'Payment strategy',
    strategyFull: 'Pay in full',
    strategyMinimum: 'Minimum payment',
    strategyFixed: 'Fixed payment',
    strategyPercentage: '% of balance',
    minimumRate: '% of balance',
    minimumFloor: 'Absolute minimum',
    fixedAmount: 'Fixed monthly amount',
    percentageAmount: '% of the balance to pay',
    strategyHelp: 'How the payment is calculated each month.',
    strategyHelpLong:
      "Pay in full pays the whole balance every month, so there's never interest on the revolving balance. Minimum payment pays the greater of a percentage of the balance and an absolute floor, recalculated every month — it's the one that can fall into the trap of never reaching zero. Fixed payment and % of balance pay a constant amount or a fixed percentage every month, without recalculating against a floor.",
    minimumRateHelp: 'The percentage of the balance paid as the minimum each month.',
    minimumRateHelpLong:
      "Recalculated every month against that month's balance, not the original one — so the currency amount of the minimum payment falls as the balance falls. If this percentage never covers that month's interest, the balance never reaches zero.",
    minimumFloorHelp: 'The absolute minimum amount due, even if the percentage of the balance is lower.',
    minimumFloorHelpLong:
      "The real minimum payment is the greater of this flat amount and the percentage of the balance — so this floor guards against a minimum payment that's too small once the balance is already low. Set it to 0 to let the payment depend on the percentage alone.",
    fixedAmountHelp: 'The flat amount you pay every month, regardless of the balance.',
    fixedAmountHelpLong:
      "Unlike the minimum payment, this amount isn't recalculated against the balance — if it's less than that month's interest, the balance grows instead of shrinking, and the model flags it if it never reaches zero.",
    percentageAmountHelp: 'The percentage of the statement balance you pay each month.',
    percentageAmountHelpLong:
      "Calculated on that month's statement balance, with no absolute floor underneath it — unlike the minimum-payment strategy, there's no flat backup amount here if the percentage comes out very low.",

    purchases: 'Purchases',
    purchasesHint: 'What goes through the card each month.',
    utilization: 'Credit used',
    utilizationOf: (used: string, limit: string, percent: string) =>
      `${used} of ${limit} · ${percent}`,
    peakUtilization: (percent: string) => `Projected peak: ${percent}`,
    overLimitAt: (month: number) => `— over the limit in month ${month}`,

    deferredPurchases: 'Instalment purchases',
    addPurchase: 'Add purchase',
    purchaseLimitReached: (max: number) => `Maximum ${max} instalment purchases.`,
    noPurchases: 'No instalment purchases.',
    description: 'Description',
    amount: 'Amount',
    purchaseMonth: 'Purchase month',
    installments: 'Instalments',
    interestFree: 'Interest free',
    newPurchase: 'New purchase',

    recurring: 'Recurring expenses',
    addRecurring: 'Add expense',
    recurringLimitReached: (max: number) => `Maximum ${max} recurring expenses.`,
    noRecurring: 'No recurring expenses.',
    monthlyAmount: 'Monthly amount',
    startMonth: 'Start month',
    endMonth: 'End month',
    defer: 'Defer',
    defaultInstallments: 'Default instalments',
    newRecurring: 'New expense',

    purchasesBeyondHorizon: (months: number) =>
      `Some purchases fall after month ${months} and are outside the horizon.`,
    invertedRange: 'Some recurring expenses end before they start and are never charged.',
    overLimitWarning: (month: number) => `The limit is exceeded in month ${month}.`,

    nextPayment: 'Next statement payment',
    nextPaymentCaption: (date: string) => `Due ${date}`,
    totalPaid: 'Total paid over the horizon',
    totalPaidCaption: (months: number) => `${months} months`,
    totalInterest: 'Total interest',
    totalInterestCaption: 'On the revolving balance',
    totalFees: 'Total card fees',
    totalFeesWithVat: 'With 19% VAT',
    totalFeesNoVat: 'Without VAT',
    monthsToZero: 'Months to zero balance',
    monthsToZeroCaption: 'With the current strategy',
    neverCaption: 'The payment does not cover the interest',
    utilizationCard: 'Credit used',
    utilizationCaption: (month: number, peak: string) => `At month ${month} · peak ${peak}`,

    neverBanner:
      'With this strategy the balance never reaches zero: the payment does not cover the interest plus the card fee, so the debt does not go down.',
    stripFull: (fees: string) =>
      `Paying in full each month means no interest on the revolving balance: only the card fee, ${fees} over the horizon.`,
    stripTakes: (months: number) => `it would take ${months} months`,
    stripNever: (horizon: number) => `you would not clear the debt in ${horizon} months`,
    stripCompare: (args) =>
      `Paying the minimum, ${args.minimumTime} and you would pay ${args.minimumInterest} in interest. ` +
      `Paying ${args.fixedAmount} a month, ${args.fixedTime} and you would pay ${args.fixedInterest}${args.saving}.`,
    stripSaving: (amount: string) => ` — a saving of ${amount}`,

    chartBalance: 'Total balance by month',
    chartBalanceHint: 'Revolving balance plus principal still owed on instalment plans.',
    chartStrategies: 'Strategy comparison',
    chartStrategiesHint: 'The same spending, paid off three different ways.',
    chartPayment: 'Monthly payment composition',
    chartPaymentHint: 'Where every unit you pay goes.',
    seriesBalance: 'Total balance',
    limitLabel: (limit: string) => `Limit ${limit}`,
    neverReachesZero: (name: string) => `${name} (never reaches zero)`,
    seriesInstallments: 'Instalments',
    seriesRevolvingPrincipal: 'Revolving principal',
    seriesInterest: 'Interest',
    seriesFee: 'Card fee',

    colCutoff: 'Statement date',
    colDue: 'Payment due date',
    colPurchases: 'Purchases this month',
    colInstallments: 'Instalments',
    colInterest: 'Interest',
    colFee: 'Card fee',
    colPayment: 'Payment',
    colRevolving: 'Revolving balance',
    colTotalBalance: 'Total balance',
    colUtilization: 'Credit used %',
    scheduleHint: (count: number) => `${count} months · open a month to see its instalments`,
    detailTitle: (month: number) => `Instalments for month ${month}`,
    detailNone: 'No instalments this month.',
    detailPrincipal: (amount: string) => `principal ${amount}`,
    detailInterest: (amount: string) => `interest ${amount}`,
    detailRemaining: (amount: string) => `${amount} left`,
  },

  auth: {
    signIn: 'Sign in',
    signOut: 'Sign out',
    account: (name: string) => `${name}'s account`,
    accountMenu: 'Account menu',
    loginTitle: 'Sign in',
    loginSubtitle: 'Enter your email and password. Everything else in the app works exactly the same without signing in.',
    gateTitle: 'Restricted access',
    gateSubtitle: 'Sign in with your email and password to continue.',
    email: 'Email address',
    password: 'Password',
    loginError: 'Incorrect email or password',
    backToApp: 'Back to the app without signing in',
    name: 'Name',
    emailLabel: 'Email',
  },

  budget: {
    introTitle: 'Where does your income actually go?',
    introDescription:
      "Track household income and expenses month by month, and see what's genuinely left over to save.",
    primaryIncomeTitle: 'Your monthly net income',
    spouseIncomeTitle: "Spouse's net income",
    mortgageDebtTitle: 'Mortgage and debt',
    utilitiesTitle: 'Utilities',
    foodTitle: 'Food and general expenses',
    insuranceTitle: 'Insurance',
    maintenanceTitle: 'Maintenance, medical, childcare, etc.',

    grossAmount: 'Gross amount',
    grossAmountHelp: 'Before any deduction, at the frequency chosen below.',
    grossAmountHelpLong:
      "It's income before withholding, taxes, or deductions — the model subtracts each deduction separately to arrive at net income. It's always read at the frequency chosen in the field next to it, so if you're paid semi-monthly, this amount is per pay period, not per month.",
    frequency: 'Pay frequency',
    frequencyHelp: 'Applies to every field in this block, except "Other income."',
    frequencyHelpLong:
      'Converts the gross amount and every withholding in this block to a monthly figure — for example, at a weekly frequency, each amount is multiplied by 52/12. "Other income" has its own frequency selector because a bonus or side income doesn\'t always arrive on the same schedule as the salary.',
    freqWeekly: 'Weekly (52/yr)',
    freqBiweekly: 'Every two weeks (26/yr)',
    freqSemiMonthly: 'Semi-monthly (24/yr)',
    freqMonthly: 'Monthly (12/yr)',
    freqQuarterly: 'Quarterly (4/yr)',
    freqAnnual: 'Annual (1/yr)',
    federalWithholding: 'Federal tax withholding',
    federalWithholdingHelp: 'The income tax withheld at the national level.',
    federalWithholdingHelpLong:
      "Subtracted from gross income at the same frequency as the gross amount — it has no frequency selector of its own because it's always withheld together with the salary payment, never separately.",
    stateWithholding: 'State tax withholding',
    stateWithholdingHelp: 'Tax withheld at the state or provincial level, if that applies where you live.',
    stateWithholdingHelpLong:
      "In countries with no such level of personal income tax, just leave this at zero — the field exists for those who do pay it, and it doesn't affect the calculation if it doesn't apply to you.",
    localWithholding: 'Local tax withholding',
    localWithholdingHelp: 'Tax withheld at the local or municipal level, if that applies where you live.',
    localWithholdingHelpLong:
      "Same as state withholding, this level of tax doesn't exist everywhere — leave it at zero if it doesn't apply to you.",
    otherTaxes: 'Other taxes and withholding',
    otherTaxesHelp: "Any other withholding on your salary that doesn't fit the categories above.",
    otherTaxesHelpLong:
      "Use it to group any tax deduction that isn't federal, state, local, FICA, or health — for example, a solidarity tax or a withholding specific to your country or industry.",
    fica: 'FICA / social security',
    ficaHelp: 'The social security contribution deducted from your paycheck.',
    ficaHelpLong:
      'In the gross income composition donut, this field is combined with "Health" into a single "FICA and health" slice, matching the reference calculator — but they\'re entered separately here since they aren\'t always the same amount.',
    medicare: 'Health (Medicare-equivalent)',
    medicareHelp: 'The health contribution deducted from your paycheck.',
    medicareHelpLong:
      "Though the name comes from Medicare (the US public health insurance program), this field stands for the equivalent in any system — the mandatory health contribution taken from your pay. It's grouped together with FICA in the income composition chart.",
    insuranceBenefits: 'Insurance and benefits',
    insuranceBenefitsHelp: 'Health, life, or other insurance and benefits deducted through payroll.',
    insuranceBenefitsHelpLong:
      "Covers any private insurance or extra benefit your employer deducts from your pay — supplemental health coverage, group life insurance, and so on — distinct from the mandatory FICA and health contributions.",
    retirementSavings: 'Company retirement savings',
    retirementSavingsHelp: 'Subtracted from net income, same as the other deductions.',
    retirementSavingsHelpLong:
      "It's your own contribution to a company-sponsored retirement plan (a 401(k) or similar) — deducted from your pay before it reaches your pocket, so it reduces the net income available this month even though the money is still yours long-term.",
    otherIncome: 'Other income',
    otherIncomeHelp: "With its own frequency — a bonus doesn't always share the salary's cadence.",
    otherIncomeHelpLong:
      "Unlike the gross amount and the withholdings, this income isn't subtracted from anything — it's added straight to net income, after converting it to monthly using its own frequency. Use it for bonuses, freelance income, or any money coming in that isn't from the main salary.",
    otherIncomeFrequency: 'Other income frequency',
    otherIncomeFrequencyHelp: "How often you receive this other income — it doesn't have to match the salary's.",
    otherIncomeFrequencyHelpLong:
      'For example, if the salary is monthly but you get a quarterly bonus, choose "Quarterly" here while the field above stays "Monthly" — each is converted to a monthly figure independently.',

    housePayment: 'House payment',
    housePaymentHelp: 'Your monthly mortgage or rent payment.',
    housePaymentHelpLong:
      "Covers both mortgage and rent — the field doesn't distinguish between the two, so use whichever applies. It's already assumed monthly: there's no frequency selector in this section, since every expense here is entered directly as that month's figure.",
    autoPayment: 'Auto payment',
    autoPaymentHelp: 'The monthly payment on your first auto loan.',
    autoPaymentHelpLong: 'If you have a second financed vehicle, record it under "Auto payment 2" instead of adding it in here.',
    autoPayment2: 'Auto payment 2',
    autoPayment2Help: 'The monthly payment on a second auto loan, if you have more than one.',
    autoPayment2HelpLong: "Leave it at zero if you only finance one vehicle — a second car isn't required to use the budget.",
    creditCardPayments: 'Credit card payments',
    creditCardPaymentsHelp: 'What you pay each month across your credit cards.',
    creditCardPaymentsHelpLong:
      "It's a single field for your total card payments — if you want the detail for one specific card (balance, rate, whether the minimum payment is enough), use the Debt consolidation feature, which does model each card separately.",
    otherDebtPayments: 'Other debt payments',
    otherDebtPaymentsHelp: "Any other debt payment that isn't a house, auto, or credit card payment.",
    otherDebtPaymentsHelpLong:
      "Group personal loans, student loans, or any other fixed monthly debt that doesn't fit the categories above in this section.",

    electric: 'Electric',
    electricHelp: 'Your monthly electricity bill.',
    gas: 'Gas',
    gasHelp: 'Your monthly gas bill.',
    water: 'Sewer and water',
    waterHelp: 'Your monthly water and sewer bill.',
    cable: 'Cable',
    cableHelp: 'Your monthly cable or streaming TV bill.',
    phone: 'Telephone',
    phoneHelp: 'Your monthly landline or cell phone bill.',
    internet: 'Internet',
    internetHelp: 'Your monthly internet bill.',

    groceries: 'Food',
    groceriesHelp: 'What you spend monthly on groceries and food.',
    groceriesHelpLong: 'Covers groceries, restaurants, and delivery — any regular food spending, not just the supermarket.',
    gasAndMaintenance: 'Auto gas and maintenance',
    gasAndMaintenanceHelp: 'Gas, oil changes, and other routine car maintenance.',
    gasAndMaintenanceHelpLong:
      "It's different from \"Auto payment\" (the loan instalment) — this field is the running cost of owning the vehicle, not the debt from buying it.",
    generalMerchandise: 'General merchandise',
    generalMerchandiseHelp: "General purchases that don't fit another category — household items, toiletries, and so on.",
    charitableDonations: 'Charitable donations',
    charitableDonationsHelp: 'Monthly donations to charitable causes or organizations.',
    religiousDonations: 'Religious donations',
    religiousDonationsHelp: 'Monthly donations or tithing to your religious community.',

    autoInsurance: 'Auto insurance',
    autoInsuranceHelp: 'Your monthly auto insurance premium.',
    lifeInsurance: 'Life insurance',
    lifeInsuranceHelp: 'The monthly premium for a personal life insurance policy, beyond any already deducted through payroll.',
    lifeInsuranceHelpLong:
      "If you already recorded life insurance under \"Insurance and benefits\" in your income (the one deducted through payroll), this field is for an additional policy you pay for directly, not for double-counting the same expense.",
    healthInsurance: 'Health insurance',
    healthInsuranceHelp: 'The monthly premium for additional health insurance, beyond any already deducted through payroll.',
    homeInsurance: 'Home insurance',
    homeInsuranceHelp: 'Your monthly home insurance premium.',

    homeMaintenance: 'Home maintenance',
    homeMaintenanceHelp: 'Routine home repairs and upkeep.',
    medical: 'Medical',
    medicalHelp: "Regular medical costs insurance doesn't cover — visits, medication, and so on.",
    childcare: 'Childcare',
    childcareHelp: 'Daycare, a nanny, or other regular childcare.',
    clothing: 'Clothing',
    clothingHelp: 'What you spend monthly on clothing and footwear.',
    entertainment: 'Entertainment',
    entertainmentHelp: 'Outings, streaming subscriptions, hobbies, and other regular entertainment.',
    otherCategories: 'Other',
    addOtherCategory: 'Add category',
    otherCategoryLimitReached: (max: number) => `Maximum ${max} extra categories.`,
    otherDescription: 'Description',
    otherDescriptionHelp: "A name for this expense — free text, doesn't affect any calculation.",
    otherDescriptionHelpLong:
      'Unlike the fixed fields in this category, "Other" has no predefined list — add as many rows as you need, each with its own name and amount, for any expense that doesn\'t fit the categories already listed.',
    otherAmount: 'Amount',
    otherAmountHelp: 'The monthly amount of this extra expense.',
    defaultOtherDescription: 'Other expense',

    headline1Before: (expenses: string) => `Monthly expenses of ${expenses} leave you with`,
    headline1After: 'available for savings.',
    headline2: (net: string, deductions: string) =>
      `Monthly net income is ${net} after ${deductions} in deductions.`,
    totalNetIncome: 'Total net income',
    totalExpenses: 'Total expenses',
    availableToSave: 'Available to save',

    chartExpenseTitle: 'Expense composition',
    chartExpenseHint: 'Every expense category, plus what is left available to save.',
    chartIncomeTitle: 'Gross income composition',
    chartIncomeHint: 'How the combined gross income from both incomes breaks down.',

    sliceMortgageDebt: 'Mortgage and debt',
    sliceUtilities: 'Utilities',
    sliceFood: 'Food and general expenses',
    sliceInsurance: 'Insurance',
    sliceMaintenance: 'Maintenance and other',
    sliceAvailableToSave: 'Available to save',
    sliceFederal: 'Federal tax withholding',
    sliceState: 'State tax withholding',
    sliceLocal: 'Local tax withholding',
    sliceOtherTaxes: 'Other taxes and withholding',
    sliceFicaAndHealth: 'FICA and health',
    sliceInsuranceBenefits: 'Insurance and benefits',
    sliceRetirementSavings: 'Retirement savings',
    sliceNetIncome: 'Net income',

    detailTitle: 'Budget detail',
    detailHint: (count: number) => `${count} items with a nonzero value`,
    colSection: 'Section',
    colConcept: 'Item',
    colMonthlyAmount: 'Monthly amount',
  },

  help: {
    title: 'Help',
    skipToContent: 'Skip to content',
    indexLabel: 'Help index',
    searchLabel: 'Search a field',
    searchPlaceholder: 'Search…',
    noResults: 'No fields found.',
    selectPrompt: 'Select a field from the index to see its explanation.',
    backToApp: 'Back to the app',
  },
}
