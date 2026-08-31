/**
 * Spanish (es-CO) is the reference dictionary: `en.ts` is typed against it, so
 * adding a key here forces the English translation to be added too.
 *
 * Values that interpolate are functions rather than templates with
 * placeholders, which keeps them type-checked and lets each language put the
 * arguments wherever its grammar needs them.
 */
export const es = {
  app: {
    title: 'Simulador Financiero',
    tabs: {
      savings: 'Ahorro',
      savingsGoal: 'Meta de ahorro',
      retirement: 'Retiro',
      loan: 'Crédito',
      debtConsolidation: 'Consolidación de deudas',
      card: 'Tarjeta de crédito',
      budget: 'Mi Presupuesto',
    },
    navLabel: 'Simuladores',
    footer: 'Proyecciones estimadas. No constituyen asesoría financiera.',
    language: 'Idioma',
    currency: 'Moneda',
    currencyUSD: 'Dólar (USD)',
    currencyEUR: 'Euro (EUR)',
    currencyGBP: 'Libra (GBP)',
    currencyKYD: 'Dólar Caimán (KYD)',
    currencyCOP: 'Pesos',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeSystem: 'Sistema',
    settings: 'Ajustes',
  },

  common: {
    helpFor: (label: string) => `Ayuda: ${label}`,
    parameters: 'Parámetros',
    liveRecalc: 'Cada cambio recalcula la proyección al instante.',
    reset: 'Restablecer valores',
    exportCsv: 'Exportar CSV',
    expandAll: 'Expandir todo',
    collapseAll: 'Colapsar todo',
    year: 'Año',
    month: 'Mes',
    months: 'meses',
    years: 'años',
    date: 'Fecha',
    schedule: 'Detalle mes a mes',
    none: 'Ninguno',
    never: 'Nunca',
    add: 'Agregar',
    delete: 'Eliminar',
    monthNames: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    chartDataTable: (title: string) => `Datos de: ${title}`,
    chartTrendSummary: (title: string, from: string, to: string) =>
      `${title}. Gráfico de línea, de ${from} a ${to}.`,
    chartSummary: (title: string, description: string) => `${title}. ${description}`,
    category: 'Categoría',
    value: 'Valor',
    viewReport: 'Ver reporte',
    downloadPdf: 'Descargar PDF',
    close: 'Cerrar',
    generatedOn: (date: string) => `Generado el ${date}`,
    reportParameters: 'Parámetros ingresados',
    csvForFullDetail: 'Descarga el CSV para el detalle completo.',
    yes: 'Sí',
    no: 'No',
  },

  savings: {
    monthlyContribution: 'Aporte mensual',
    monthlyContributionHint: 'Monto fijo que depositas cada mes.',
    monthlyContributionHelp: 'El monto que aportas cada mes, siempre el mismo salvo que actives el crecimiento anual.',
    monthlyContributionHelpLong:
      'Es un aporte fijo mes a mes — no varía dentro de un mismo año. Si quieres que suba con el tiempo (por ejemplo, para seguir el ritmo de tus ingresos), usa el campo «Crecimiento del aporte», que lo incrementa un porcentaje al inicio de cada año sin que tengas que volver a escribirlo tú mismo.',
    annualRate: 'Interés anual (%)',
    annualRateHint: 'Tasa nominal anual. Define el tramo base.',
    annualRateHelp: 'La tasa de interés anual que ofrece tu cuenta de ahorros.',
    annualRateHelpLong:
      'Esta es la tasa base del modelo: el interés de cada mes se calcula como esta tasa dividida entre 12, no como una capitalización mensual real (esa comparación está disponible aparte, en «Capitalización mensual real»). Si usas tramos de tasa, este campo define el primer tramo y cualquier cambio aquí se refleja automáticamente en él.',
    withholding: 'Retención (%)',
    withholdingHint: 'Impuesto retenido sobre el interés.',
    withholdingHelp: 'El porcentaje de impuesto que tu banco retiene sobre el interés que ganas.',
    withholdingHelpLong:
      'Se aplica únicamente sobre el interés generado cada mes, nunca sobre el capital que aportas. El resultado — «interés neto» — es lo que realmente se acredita a tu saldo; el interés bruto (antes de esta retención) también se muestra por separado para que veas cuánto te está costando el impuesto.',
    years: 'Años',
    yearsHint: (months: number) => `Horizonte de la proyección — ${months} meses.`,
    yearsHelp: 'Cuántos años quieres proyectar el ahorro.',
    yearsHelpLong:
      'Define el horizonte completo de la proyección — el gráfico, la tabla de detalle y el saldo final se calculan hasta este punto, ni un mes más. Cambiar este valor no afecta ningún otro cálculo del modelo, solo hasta dónde se extiende.',
    growth: 'Crecimiento del aporte (% anual)',
    growthHint: 'Aumenta el aporte al inicio de cada año.',
    growthHelp: 'Sube el aporte mensual un porcentaje cada año, en vez de mantenerlo fijo.',
    growthHelpLong:
      'Al inicio de cada año (no cada mes), el aporte mensual se multiplica por 1 + este porcentaje, así que el aumento se aplica una vez por año y luego se mantiene fijo hasta el siguiente. Déjalo en 0 % para un aporte perfectamente constante durante todo el horizonte.',
    realCompounding: 'Capitalización mensual real',
    realCompoundingHint: 'Compara contra el modelo de interés anual ÷ 12.',

    tiers: 'Tramos de tasa',
    tiersEnabled: 'Usar tramos de tasa',
    tiersEnabledHint: 'Si está apagado o hay un solo tramo, se usa el campo «Interés anual».',
    tiersSummary: (count: number, mode: string) => `${count} tramos · ${mode}`,
    tiersBaseOnly: 'Usando la tasa base',
    byAge: 'Por antigüedad',
    byBalance: 'Por saldo',
    byAgeHelp: 'La tasa del mes t es la del tramo con el mayor «desde el mes» ≤ t.',
    byBalanceHelp:
      'Se evalúa contra el saldo del mes anterior, así la tasa sube a medida que crece el fondo.',
    addTier: 'Agregar tramo',
    tierLimitReached: (max: number) => `Máximo ${max} tramos.`,
    fromMonth: 'Desde el mes',
    minBalance: 'Saldo mínimo',
    tierRate: 'Tasa anual',
    firstTierLocked: 'El primer tramo define la tasa base y no se puede eliminar',
    monthOne: 'Mes 1',
    tierFootnote: (start: string) =>
      `El primer tramo siempre empieza en ${start} y toma su tasa del campo «Interés anual». Los tramos se ordenan solos de menor a mayor.`,
    tierStartMonth: 'el mes 1',
    tierStartBalance: 'saldo 0',
    duplicateTier: (unit: string, at: number) =>
      `Hay dos tramos que empiezan en el mismo ${unit} (${at}).`,
    tierBeyondHorizon: (months: number) =>
      `Algunos tramos empiezan después del mes ${months} y nunca se aplican.`,
    unitMonth: 'mes',
    unitBalance: 'saldo',

    finalBalance: 'Saldo final',
    finalBalanceCaption: (month: number) => `Al mes ${month}`,
    totalContributed: 'Total aportado',
    totalContributedCaption: (count: number) => `${count} aportes mensuales`,
    grossInterest: 'Interés bruto ganado',
    grossInterestCaption: 'Antes de retención',
    totalWithholding: 'Retención total',
    totalWithholdingCaption: (rate: string) => `${rate} sobre el interés`,
    netInterest: 'Interés neto ganado',
    netInterestCaption: 'Lo que realmente se acredita',
    multiplier: 'Multiplicador',
    multiplierCaption: 'Saldo final ÷ total aportado',

    comparisonDivided: 'Interés anual ÷ 12',
    difference: 'Diferencia',

    sentence: (args: {
      contribution: string
      years: number
      rate: string
      growth: string
      tiers: string
      balance: string
      interest: string
    }) =>
      `Aportando ${args.contribution} al mes durante ${args.years === 1 ? '1 año' : `${args.years} años`} al ${args.rate} anual${args.growth}${args.tiers}, acumularías ${args.balance}, de los cuales ${args.interest} son intereses.`,
    sentenceGrowth: (rate: string) => `, con un aumento del ${rate} anual en el aporte`,
    sentenceTiers: (count: number) => ` (con ${count} tramos de tasa)`,

    chartGrowth: 'Crecimiento del saldo',
    chartGrowthHint: 'La brecha entre las dos curvas es el interés acumulado.',
    chartComposition: 'Composición final',
    chartCompositionHint: 'Cuánto pusiste tú y cuánto puso el interés.',
    chartMonthly: 'Interés mensual recibido',
    chartMonthlyHint: 'Promedio del crédito mensual en cada año.',
    seriesBalance: 'Saldo total',
    seriesContributed: 'Total aportado',
    sliceContributions: 'Aportes',
    sliceInterest: 'Interés neto',
    seriesAverageInterest: 'Interés mensual promedio',

    colContribution: 'Aporte',
    colGrossInterest: 'Interés anual',
    colWithholding: 'Retención',
    colNetInterest: 'Interés neto',
    colMonthlyInterest: 'Interés mensual',
    colBalance: 'Saldo',
    scheduleHint: (count: number) => `${count} meses · agrupados por año`,
  },


  savingsGoal: {
    goal: 'Meta de ahorro',
    goalHint: 'Cuánto quieres tener ahorrado al final del plazo.',
    goalHelp:
      'El monto que quieres alcanzar. Se usa para calcular cuánto tiempo tomaría con tu aporte actual, y cuánto tendrías que aportar para llegar justo a tiempo.',
    goalHelpLong:
      'Este monto alimenta dos cálculos distintos a la vez: «Meses para alcanzarla» busca el mes exacto en el que tu aporte actual, creciendo con la rentabilidad esperada, alcanza esta cifra; «Aporte requerido» resuelve la pregunta inversa — qué aporte constante llegaría exactamente a esta meta en el plazo que fijaste. El control deslizante usa una escala logarítmica para metas grandes, así que montos pequeños no quedan apretados en los primeros píxeles.',
    years: 'Años objetivo',
    yearsHint: (months: number) => `Plazo de la meta — ${months} meses.`,
    yearsHelp:
      'El plazo que tienes en mente. Se usa para calcular el aporte exacto que te llevaría a la meta en ese tiempo, y para el horizonte del gráfico y la tabla.',
    yearsHelpLong:
      'A diferencia de «Meses para alcanzarla» (que depende de tu aporte real), este plazo es fijo — lo eliges tú, y el modelo calcula qué aporte constante cumpliría la meta exactamente en esos años, ni uno más. También determina hasta dónde llega el eje del gráfico y cuántas filas tiene la tabla de detalle.',
    currentSavings: 'Ahorrado actualmente',
    currentSavingsHint: 'Lo que ya tienes ahorrado para esta meta.',
    currentSavingsHelp:
      'Saldo inicial antes del primer aporte. Cuenta a tu favor tanto en el tiempo que falta como en el aporte requerido.',
    currentSavingsHelpLong:
      'Se suma al modelo como el saldo del mes 0, antes de que se acredite ningún aporte ni interés — así que entre más alto sea este valor, menos tiempo te tomará llegar a la meta y menor será el aporte mensual requerido para lograrlo en el plazo elegido.',
    monthlyContribution: 'Aporte mensual',
    monthlyContributionHint: 'Lo que aportas cada mes — se compara contra el aporte requerido.',
    monthlyContributionHelp:
      'El aporte que realmente planeas hacer. No se ajusta automáticamente: se compara contra el aporte que sí cumpliría la meta exactamente, para que veas si vas sobrado o corto.',
    monthlyContributionHelpLong:
      'A diferencia de «Aporte requerido» (que el modelo calcula por ti), este es un valor que tú controlas directamente — el punto de la función es justo comparar los dos: si tu aporte real supera, iguala o se queda corto frente al aporte que cumpliría la meta exactamente en el plazo elegido.',
    expectedReturn: 'Rentabilidad esperada (% anual, E.A.)',
    expectedReturnHint: 'Tasa efectiva anual, igual que en Crédito.',
    expectedReturnHelp:
      'La tasa que esperas ganar sobre tus ahorros, efectiva anual. Se convierte internamente a una tasa mensual equivalente; no hay selector de convención porque aquí solo tiene sentido leerla así.',
    expectedReturnHelpLong:
      'Se usa como la tasa de crecimiento de una anualidad-anticipada (el aporte se acredita al inicio de cada mes, antes de que ese mes gane interés) — la misma convención que usa el modelo de Ahorro. Convertida a una tasa mensual equivalente, es la que hace crecer tanto la curva de tu aporte real como la del aporte requerido en el gráfico.',
    expectedInflation: 'Inflación esperada (% anual)',
    expectedInflationHint: 'Solo para referencia — no cambia el aporte requerido.',
    expectedInflationHelp:
      'Se usa únicamente para mostrar cuánto valdría tu meta en pesos de hoy. No afecta el tiempo para alcanzarla ni el aporte requerido, que siempre se calculan en pesos nominales.',
    expectedInflationHelpLong:
      'Es deliberadamente de solo lectura para el resto del modelo: la referencia original no deja claro qué otra cosa debería afectar, así que aquí únicamente descuenta la meta a pesos de hoy para la tarjeta «Meta en poder adquisitivo de hoy» — el tiempo para alcanzarla y el aporte requerido siempre se calculan en términos nominales, sin ajustar por inflación.',

    duration: (years: number, months: number) => {
      const y = years > 0 ? `${years} ${years === 1 ? 'año' : 'años'}` : ''
      const m = months > 0 ? `${months} ${months === 1 ? 'mes' : 'meses'}` : ''
      if (y && m) return `${y} y ${m}`
      return y || m || 'menos de un mes'
    },
    headlineReachable: (duration: string) => `Podrías alcanzar tu meta en ${duration}.`,
    headlineAlreadyMet: 'Ya alcanzaste tu meta con lo que tienes ahorrado.',
    headlineNeverZero:
      'Con este aporte nunca alcanzarías la meta: no estás ahorrando nada y la rentabilidad esperada no genera crecimiento por sí sola.',
    headlineNeverTooSlow:
      'Con este aporte tardarías más de 100 años en alcanzar tu meta — auméntalo o ajusta el plazo.',

    goalCard: 'Meta',
    requiredContribution: 'Aporte requerido',
    requiredContributionCaption: (contribution: string) => `Tu aporte actual es ${contribution}`,
    purchasingPower: 'Meta en poder adquisitivo de hoy',
    purchasingPowerCaption: 'Ajustada por la inflación esperada',

    chartTitle: 'Plan de ahorro por año',
    chartHint: 'Tu aporte frente al aporte que cumple la meta exactamente, año por año.',
    seriesAtContribution: 'Con tu aporte',
    seriesAtRequired: 'Aporte que cumple la meta',
    referenceLineLabel: 'Meta',
    captionAtContribution: (amount: string, comparison: 'exceeds' | 'meets' | 'short') => {
      const verb =
        comparison === 'exceeds' ? 'superas' : comparison === 'meets' ? 'cumples' : 'no alcanzas'
      return `Ahorrando ${amount} al mes ${verb} tu meta${comparison === 'short' ? '' : ' exactamente'}.`
    },
    captionAtRequired: (amount: string) => `Ahorrando ${amount} al mes cumples tu meta exactamente.`,

    colYear: 'Año',
    colBalanceAtContribution: 'Saldo con tu aporte',
    colBalanceAtRequired: 'Saldo con aporte requerido',
    colDifferenceVsGoal: 'Diferencia vs. meta',
    scheduleHint: (count: number) => `${count} años proyectados`,
  },

  retirement: {
    startingBalance: 'Saldo inicial',
    startingBalanceHelp: 'El saldo que ya tienes ahorrado para el retiro, hoy.',
    startingBalanceHelpLong:
      'Es el saldo del que parte la fase de acumulación — entra al modelo antes que el primer aporte anual, así que también gana rentabilidad desde el año 1. Entre más alto sea, menor será el saldo que necesitas construir con tus propios aportes para llegar a la misma meta al retiro.',
    annualContribution: 'Aporte anual',
    annualContributionHelp:
      'Lo que aportas cada año, al inicio del año. El año en que te retiras no cuenta como un año de aporte.',
    annualContributionHelpLong:
      'Se acredita como una anualidad-anticipada: el aporte del año entra antes de que ese año gane rentabilidad, no después. Los años de aporte van de tu edad actual hasta un año antes de la edad de retiro — si te retiras a los 65 habiendo empezado a los 45, son 20 aportes, no 21, porque el año del retiro en sí no lleva aporte.',
    currentAge: 'Edad actual',
    currentAgeHelp: 'Tu edad hoy.',
    currentAgeHelpLong:
      'Junto con la edad de retiro, define cuántos años dura la fase de acumulación — la diferencia entre las dos es exactamente el número de aportes anuales que hace el modelo.',
    retirementAge: 'Edad de retiro',
    retirementAgeHelp: 'La edad en la que planeas retirarte. Debe ser mayor que tu edad actual.',
    retirementAgeError: 'La edad de retiro debe ser mayor que la edad actual.',
    retirementAgeHelpLong:
      'Marca el final de la fase de acumulación y el inicio del retiro — el saldo acumulado hasta este punto es el que se convierte en el ingreso mensual de la fase de retiro. Si intentas poner una edad de retiro menor o igual a tu edad actual, el campo muestra un error y no calcula un resultado inválido.',
    retirementYears: 'Años de retiro',
    retirementYearsHelp: 'Cuántos años esperas vivir del retiro.',
    retirementYearsHelpLong:
      'Define el horizonte de la fase de retiro — el ingreso mensual se calcula para que el saldo se agote exactamente al final de estos años (una anualidad ordinaria), ni antes ni después. Un horizonte más largo, con el mismo saldo, siempre resulta en un ingreso mensual menor.',
    growWithInflation: 'Incrementar aportes con la inflación',
    growWithInflationHelp:
      'Sube el aporte cada año a la par de la inflación esperada, en vez de mantenerlo fijo.',
    growWithInflationHelpLong:
      'Activado, cada aporte anual es el anterior multiplicado por 1 + la inflación esperada — así que el aporte del año 10 es mayor en pesos nominales que el del año 1, aunque represente el mismo poder adquisitivo. Desactivado, el aporte anual es idéntico todos los años, y su valor real se erosiona con la inflación.',
    taxDeferred: 'Ahorro con impuesto diferido',
    taxDeferredHelp:
      'Si está activo, el crecimiento no paga impuesto cada año y el impuesto se cobra al retirar. Si está apagado, el impuesto se cobra cada año sobre la rentabilidad, y el retiro ya no se grava de nuevo.',
    taxDeferredHelpLong:
      'Este interruptor decide cuál de las dos tasas de impuesto (actual o de retiro) realmente se aplica: con impuesto diferido, la rentabilidad de acumulación crece intacta y el impuesto se cobra sobre el ingreso mensual una vez retirado, según la tasa de retiro; sin impuesto diferido, la rentabilidad de cada año ya se grava con la tasa actual, así que el ingreso mensual del retiro no se vuelve a gravar — de lo contrario se cobraría el impuesto dos veces sobre el mismo dinero.',

    returnsCardTitle: 'Rentabilidad, impuestos e inflación',
    returnBefore: 'Rentabilidad antes del retiro (%, anual)',
    returnBeforeHelp: 'La rentabilidad que esperas mientras todavía estás aportando.',
    returnBeforeHelpLong:
      'Es la tasa que hace crecer el saldo durante toda la fase de acumulación, como una anualidad-anticipada. No tiene selector de convención — se lee siempre como una tasa efectiva anual.',
    returnDuring: 'Rentabilidad durante el retiro (%, anual)',
    returnDuringHelp:
      'La rentabilidad que esperas mientras retiras el dinero — normalmente más baja, por decisiones de inversión más conservadoras.',
    returnDuringHelpLong:
      'A diferencia de la rentabilidad de acumulación, esta se usa en una anualidad ordinaria (el ingreso se paga al final de cada mes) — la única convención de este tipo en toda la app, necesaria para que el modelo reproduzca los mismos números que la calculadora de referencia.',
    currentTaxRate: 'Tasa de impuesto actual (%)',
    currentTaxRateHelp: 'Tu tasa de impuesto hoy. Solo aplica si el ahorro no es con impuesto diferido.',
    currentTaxRateHelpLong:
      'Solo tiene efecto cuando «Ahorro con impuesto diferido» está apagado — en ese caso, esta tasa grava la rentabilidad de acumulación cada año. Con el impuesto diferido activo, este campo no participa en el cálculo.',
    retirementTaxRate: 'Tasa de impuesto en el retiro (%)',
    retirementTaxRateHelp: 'Tu tasa de impuesto esperada en el retiro.',
    retirementTaxRateHelpLong:
      'Solo tiene efecto cuando «Ahorro con impuesto diferido» está activo — en ese caso, esta tasa grava el ingreso mensual antes de impuestos para llegar al ingreso después de impuestos. Nota: esta rama del modelo se verificó contra una referencia con 0% de impuestos en ambos campos, así que trata los resultados con una tasa distinta de cero como razonables pero no verificados cifra por cifra.',
    inflation: 'Inflación esperada (%)',
    inflationHelp: 'Usada para el poder adquisitivo de hoy y, si está activo, para subir los aportes.',
    inflationHelpLong:
      'Tiene dos usos, ambos opcionales: descuenta el ingreso mensual después de impuestos a poder adquisitivo de hoy (siempre activo, es la cifra del resumen principal), y si «Incrementar aportes con la inflación» está activo, también sube cada aporte anual a este mismo ritmo.',

    headline: (amount: string) => `Tus ahorros producen ${amount} mensuales después de impuestos e inflación.`,
    balanceAtRetirement: 'Saldo al retiro',
    monthlyIncomeBeforeTax: 'Ingreso mensual antes de impuestos',
    monthlyIncomeAfterTax: 'Ingreso mensual después de impuestos',
    monthlyIncomeToday: 'Ingreso mensual en poder adquisitivo de hoy',

    incomeChartTitle: (retirementAge: number, years: number) =>
      `Ingreso mensual a los ${retirementAge} años, por ${years} años`,
    incomeChartHint: 'Antes y después de impuestos, sin y con la inflación esperada.',
    groupBeforeInflation: 'Antes de inflación',
    groupWithInflation: (rate: string) => `${rate} de inflación`,
    seriesBeforeTax: 'Antes de impuestos',
    seriesAfterTax: 'Después de impuestos',

    accumulationChartTitle: 'Ahorro para el retiro por año',
    accumulationChartHint: 'Saldo proyectado desde tu edad actual hasta el retiro.',
    finalBalanceLabel: (amount: string) => `Saldo final ${amount}`,
    seriesBalance: 'Saldo',

    depletionChartTitle: 'Saldo durante el retiro',
    depletionChartHint: 'Cómo se agota el saldo mes a mes mientras retiras el ingreso mensual.',

    accumulationSection: 'Acumulación',
    retirementSection: 'Retiro',
    colYear: 'Año',
    colAge: 'Edad',
    colContribution: 'Aporte',
    colBalance: 'Saldo',
    colMonthlyIncome: 'Ingreso del mes',
    colRemainingBalance: 'Saldo restante',
    accumulationScheduleHint: (count: number) => `${count} años de acumulación`,
    retirementScheduleHint: (count: number) => `${count} años de retiro`,
  },

  loan: {
    principal: 'Monto del préstamo',
    principalHint: 'Capital desembolsado.',
    principalHelp: 'El capital que te desembolsan al inicio del crédito.',
    principalHelpLong:
      'Es el punto de partida de toda la amortización: el saldo pendiente en el mes 1, antes de cualquier cuota. No incluye seguros ni cargos — esos se suman aparte a cada cuota, pero nunca se le suman al capital que estás pagando.',
    rate: 'Tasa de interés',
    rateHint: (monthly: string) => `= ${monthly} mensual efectiva`,
    rateHelp: 'La tasa que cobra el crédito, en la convención que elijas (E.A., Nominal M.V. o Mensual).',
    rateHelpLong:
      'Las tres convenciones describen la misma tasa real de formas distintas: E.A. es la tasa efectiva anual, Nominal M.V. es una tasa anual que se divide entre 12 sin componer, y Mensual es la tasa mensual efectiva directamente. El campo siempre se convierte internamente a una tasa mensual antes de amortizar, y esa tasa mensual equivalente se muestra justo debajo para que puedas comparar créditos cotizados en convenciones distintas.',
    conventionEA: 'E.A. (efectiva anual)',
    conventionNominal: 'Nominal anual M.V.',
    conventionMonthly: 'Mensual efectiva',
    conventionShortEA: 'E.A.',
    conventionShortNominal: 'Nominal M.V.',
    conventionShortMonthly: 'Mensual',
    term: 'Plazo',
    termHint: (months: number, years: string) => `${months} meses · ${years} años`,
    termHelp: 'Cuántos meses o años dura el crédito.',
    termHelpLong:
      'Define cuántas cuotas tiene el crédito. El selector meses/años solo cambia cómo escribes el valor — internamente el modelo siempre trabaja en meses — así que pasar de 5 años a 60 meses no cambia nada del resultado, es la misma cifra en dos unidades.',
    termUnitMonths: 'meses',
    termUnitYears: 'años',
    disbursementDate: 'Fecha de desembolso',
    disbursementDateHint: 'Solo se usa para fechar las cuotas.',
    disbursementDateHelp: 'La fecha en la que se desembolsa el crédito.',
    disbursementDateHelpLong:
      'Esta fecha no afecta ningún cálculo del modelo — el monto de la cuota, el interés y el saldo son exactamente los mismos sin importar qué fecha elijas. Solo se usa para poner una fecha real a cada cuota en la tabla de detalle y en el CSV exportado, en vez de mostrar solo números de mes.',
    system: 'Sistema de amortización',
    systemFrench: 'Cuota fija',
    systemGerman: 'Abono constante a capital',
    systemBullet: 'Solo intereses + pago único al final',
    systemHelp: 'Cómo se reparte cada cuota entre interés y abono a capital.',
    systemHelpLong:
      'Cuota fija (francés) paga lo mismo cada mes, con el interés bajando y el abono a capital subiendo con el tiempo — el más común en créditos de consumo e hipotecarios. Abono constante a capital (alemán) abona siempre el mismo capital, así que la cuota total va bajando mes a mes porque el interés se calcula sobre un saldo cada vez menor. Bullet paga solo intereses durante todo el plazo y el capital completo se paga de una sola vez en la última cuota.',
    graceMonths: 'Periodo de gracia (meses)',
    graceMonthsHint: 'Meses antes de empezar a amortizar.',
    graceMonthsHelp: 'Meses al inicio del crédito donde todavía no se abona a capital.',
    graceMonthsHelpLong:
      'Durante estos meses el capital no baja — el tipo de gracia (abajo) decide qué pasa con el interés mientras tanto: se paga cada mes, o se capitaliza y se suma al saldo. Después de este periodo, la amortización empieza normalmente sobre el plazo restante.',
    graceType: 'Tipo de gracia',
    graceInterestOnly: 'Solo intereses',
    graceTotal: 'Total / capitaliza intereses',
    graceBadge: 'gracia',
    graceTypeHelp: 'Qué pasa con el interés durante el periodo de gracia.',
    graceTypeHelpLong:
      '«Solo intereses» significa que pagas el interés de cada mes de gracia, así que el saldo no crece ni baja. «Total / capitaliza intereses» significa que no pagas nada durante la gracia, y el interés no pagado se suma al saldo — el crédito sale más caro, pero no tienes cuota mientras dura la gracia.',

    charges: 'Seguros y cargos',
    chargesActive: 'Activos',
    chargesNone: 'Sin cargos',
    lifeInsurance: 'Seguro de vida (% mensual sobre saldo)',
    lifeInsuranceHelp: 'Un porcentaje del saldo pendiente que se cobra cada mes como seguro de vida.',
    lifeInsuranceHelpLong:
      'Se calcula sobre el saldo pendiente de cada mes, no sobre el monto original del crédito — así que baja junto con el saldo a medida que amortizas. Se suma a la cuota como parte de «Seguros», sin afectar el abono a capital ni el interés del crédito en sí.',
    assetInsurance: 'Seguro de bien / todo riesgo (mensual)',
    assetInsuranceHelp: 'Un monto fijo mensual por el seguro del bien financiado (vivienda, vehículo, etc.).',
    assetInsuranceHelpLong:
      'A diferencia del seguro de vida, este es un monto fijo en pesos, no un porcentaje — no cambia aunque el saldo baje. Se suma a la cuota todos los meses del crédito, incluidos los de periodo de gracia.',
    adminFee: 'Cuota de administración o estudio (mensual)',
    adminFeeHelp: 'Un cargo fijo mensual que cobra la entidad por administrar el crédito.',
    adminFeeHelpLong:
      'Igual que el seguro de bien, es un monto fijo en pesos que se suma a la cuota cada mes, independiente del saldo o de la tasa. Se refleja en «Total pagado» y en el «Costo del crédito», así que si quieres ver el crédito sin este cargo, ponlo en cero.',

    extraPayments: 'Abonos extraordinarios',
    extraPaymentsCount: (count: number) => `${count} abono${count > 1 ? 's' : ''}`,
    extraPaymentsHint: 'Un abono mayor al saldo pendiente se ajusta al saldo y cierra el crédito.',
    addExtraPayment: 'Agregar abono',
    extraPaymentLimitReached: (max: number) => `Máximo ${max} abonos.`,
    noExtraPayments: 'Sin abonos extraordinarios.',
    amount: 'Monto',
    effect: 'Efecto',
    reduceTerm: 'Reducir plazo',
    reducePayment: 'Reducir cuota',

    graceCoversTerm: 'El periodo de gracia cubre todo el plazo: no queda tiempo para amortizar.',
    extraBeyondTerm: (months: number) =>
      `Hay abonos programados después del mes ${months}, cuando el crédito ya está pagado.`,

    monthlyPayment: 'Cuota mensual',
    monthlyPaymentLevel: 'Igual todos los meses',
    monthlyPaymentRange: 'Primera → última',
    totalPaid: 'Total pagado',
    totalPaidCaption: (count: number) => `${count} cuotas`,
    totalInterest: 'Total intereses',
    totalInterestCaption: 'Sobre el saldo pendiente',
    totalInsurance: 'Total seguros y cargos',
    totalInsuranceCaption: 'Vida + bien + administración',
    creditCost: 'Costo del crédito',
    creditCostCaption: 'Intereses + seguros ÷ monto',
    lastPayment: 'Última cuota',
    lastPaymentCaption: (month: number) => `Mes ${month}`,
    lastPaymentSaved: (months: number, saved: number) => `${months} meses — ${saved} menos`,

    savings: 'Ahorro por abonos extra',
    savingsCaption: 'Intereses que dejas de pagar',
    monthsSaved: 'Meses ahorrados',
    monthsSavedCaption: 'Frente al mismo crédito sin abonos',
    totalExtra: 'Total abonado extra',
    totalExtraCaption: 'Capital adelantado',

    sentence: (args: {
      principal: string
      months: number
      rate: string
      convention: string
      payment: string
      interest: string
    }) =>
      `Un crédito de ${args.principal} a ${args.months} meses con tasa del ${args.rate} ${args.convention} tiene una cuota de ${args.payment} y un costo total en intereses de ${args.interest}.`,

    chartBalance: 'Saldo pendiente',
    chartBalanceHintExtra: 'La línea punteada es el mismo crédito sin abonos extraordinarios.',
    chartBalanceHint: 'Capital que aún debes, mes a mes.',
    chartComposition: 'Composición de la cuota',
    chartCompositionCrossover: (month: number) =>
      `Desde el mes ${month} el capital supera al interés.`,
    chartCompositionNoCrossover: 'El interés nunca baja del capital en este plazo.',
    chartDonut: 'Capital vs. interés acumulado',
    chartDonutHint: (cost: string) => `Costo del crédito: ${cost}`,
    seriesBalance: 'Saldo pendiente',
    seriesBaseline: 'Sin abonos extra',
    seriesPrincipal: 'Capital',
    seriesInterest: 'Interés',
    seriesInsurance: 'Seguros',
    sliceCharges: 'Seguros y cargos',
    crossoverLabel: (month: number) => `mes ${month}`,

    colPayment: 'Cuota',
    colInterest: 'Interés',
    colPrincipal: 'Abono a capital',
    colExtra: 'Abono extra',
    colInsurance: 'Seguros',
    colTotalPayment: 'Cuota total',
    colBalance: 'Saldo',
    scheduleHint: (count: number) => `${count} cuotas · agrupadas por año`,
  },

  debtConsolidation: {
    cardsTitle: 'Tarjetas de crédito',
    addCard: 'Agregar tarjeta',
    cardLimitReached: (max: number) => `Máximo ${max} tarjetas.`,
    cardLabel: (index: number) => `Tarjeta de crédito #${index}`,
    balance: 'Saldo',
    balanceHelp: 'La deuda actual de esta tarjeta o préstamo.',
    balanceHelpLong:
      'Es el punto de partida para calcular cuánto pagas hoy y cuántos meses te tomaría liquidar esta deuda por su cuenta — se usa exactamente igual sin importar si la deuda es una tarjeta, un préstamo de auto o cualquier otro tipo.',
    rate: 'Tasa de interés',
    rateHelp: 'La tasa de interés de esta deuda, en Nominal M.V.',
    rateHelpLong:
      'Esta sección lee toda tasa como Nominal M.V. (se divide entre 12 sin componer), no como E.A. — a diferencia del valor por defecto de Crédito. No hay selector de convención aquí porque cada campo de tasa en esta función se interpreta siempre de la misma forma.',
    useMinimumPayment: 'Usar pago mínimo de la tarjeta',
    useMinimumPaymentHelp: 'Si está activo, el pago se calcula como un porcentaje del saldo, no un monto fijo.',
    useMinimumPaymentHelpLong:
      'Activado, el pago de cada mes es el mayor entre un porcentaje del saldo y un piso mínimo (ajustables en «Ajustes avanzados»), recalculado sobre el saldo de cada mes — el clásico pago mínimo de tarjeta, que puede no llegar nunca a saldar la deuda. Desactivado, escribes tú mismo un pago fijo mensual y la tarjeta se comporta como un préstamo de cuota fija.',
    advancedSettings: 'Ajustes avanzados',
    minimumPct: '% mínimo',
    minimumPctHint:
      'Porcentaje del saldo que se paga cada mes. No es un valor documentado del emisor — es un punto de partida razonable, ajústalo si tu tarjeta especifica otro.',
    minimumPctHelp: 'El porcentaje del saldo que se paga como mínimo cada mes.',
    minimumPctHelpLong:
      'Se recalcula cada mes sobre el saldo de ese momento, no sobre el saldo original de la tarjeta, así que el pago mínimo en pesos baja junto con el saldo. Si este porcentaje no alcanza a cubrir el interés del mes, el saldo nunca llega a cero — el modelo lo detecta y lo señala como «Nunca».',
    minimumFloor: 'Piso mínimo',
    minimumFloorHint: 'Monto mínimo absoluto, aunque el porcentaje del saldo sea menor. 0 lo desactiva.',
    minimumFloorHelp: 'El monto mínimo absoluto a pagar, aunque el porcentaje del saldo sea menor.',
    minimumFloorHelpLong:
      'El pago mínimo real de cada mes es el mayor entre este monto fijo y el porcentaje del saldo — protege contra un pago demasiado pequeño una vez el saldo ya bajó bastante. Déjalo en 0 para que el pago dependa solo del porcentaje.',
    payment: 'Pago',
    paymentHint: 'Se calcula solo — apaga «Usar pago mínimo» para editarlo.',
    paymentHelp: 'El pago mensual de esta tarjeta o préstamo.',
    paymentHelpLong:
      'Cuando «Usar pago mínimo» está activo, este campo se calcula automáticamente y no se puede editar directamente. Apágalo para escribir tú mismo un pago fijo — en ese caso, si el pago no alcanza a cubrir el interés mensual, verás la advertencia de que nunca cubre el saldo, en vez de un número de meses.',
    monthlyPayment: 'Pago mensual',

    autoTitle: 'Préstamos de auto',
    addAuto: 'Agregar préstamo de auto',
    autoLimitReached: (max: number) => `Máximo ${max} préstamos de auto.`,
    autoLabel: (index: number) => `Préstamo de auto #${index}`,

    otherTitle: 'Otros préstamos',
    addOther: 'Agregar otro préstamo',
    otherLimitReached: (max: number) => `Máximo ${max} otros préstamos.`,
    description: 'Descripción',
    descriptionHelp: 'Un nombre para identificar esta deuda — libre, no afecta ningún cálculo.',
    descriptionHelpLong:
      'A diferencia de las tarjetas y los préstamos de auto (que se numeran automáticamente), esta categoría no tiene un nombre fijo — tú decides cómo llamarla, y ese texto es justo el que aparece en la tabla de detalle y el CSV exportado.',
    defaultOtherDescription: 'Préstamo personal',

    monthsRemaining: 'Cuotas restantes',
    neverPaysOff: 'Este pago nunca cubre el saldo.',

    consolidatedTitle: 'Nuevo préstamo consolidado',
    consolidatedBalance: 'Saldo del préstamo',
    consolidatedBalanceHint:
      'Se inicializa con la suma de los saldos de arriba, pero puedes cambiarlo libremente.',
    consolidatedBalanceHelp: 'El monto del nuevo préstamo que reemplaza a todas las deudas de arriba.',
    consolidatedBalanceHelpLong:
      'Al cargar la página, se calcula automáticamente como la suma de todos los saldos ingresados — pero es un campo independiente, así que puedes ajustarlo libremente después (por ejemplo, si el banco solo te aprueba un monto distinto al total exacto). No se vuelve a recalcular solo mientras editas los saldos individuales.',
    consolidatedRate: 'Tasa de interés del nuevo préstamo',
    consolidatedRateHint: 'Nominal M.V. — a diferencia del valor por defecto de Crédito (E.A.).',
    consolidatedRateHelp: 'La tasa del nuevo préstamo, en Nominal M.V.',
    consolidatedRateHelpLong:
      'Igual que las demás tasas de esta función, se lee en Nominal M.V. — dividida entre 12 sin componer — no en E.A., que es la convención por defecto en Crédito. No hay selector aquí porque este campo siempre se interpreta de la misma forma.',
    consolidatedTerm: 'Plazo',
    consolidatedTermHelp: 'Cuántos meses dura el nuevo préstamo consolidado.',
    consolidatedTermHelpLong:
      'Un plazo más largo generalmente baja la cuota mensual pero sube el interés total pagado — compara «Ahorro mensual» contra «Ahorro total en intereses» al cambiar este valor para ver ese equilibrio.',
    termOption: (months: number, years: number) => `${months} (${years} ${years === 1 ? 'año' : 'años'})`,
    consolidatedPayment: 'Pago mensual',

    headline: (amount: string) => `Tu nuevo pago mensual sería ${amount}.`,
    currentPayment: 'Pago actual total',
    consolidatedPaymentCard: 'Pago consolidado',
    monthlySavings: 'Ahorro mensual',
    currentMonths: 'Meses para pagar (actual)',
    consolidatedMonths: 'Plazo consolidado (meses)',
    totalInterestSavings: 'Ahorro total en intereses',
    totalInterestSavingsHint:
      'Intereses totales de las deudas actuales menos los del préstamo consolidado. No aparece en la calculadora de referencia, pero es el número que realmente responde si conviene consolidar.',

    chartPaymentTitle: 'Comparación de pago mensual',
    chartPaymentHint: 'Lo que pagas hoy frente al préstamo consolidado.',
    chartTimeTitle: 'Tiempo para pagar la deuda',
    chartTimeHint: 'Meses hasta quedar libre de deuda, en cada escenario.',
    seriesCurrent: 'Actual',
    seriesConsolidated: 'Consolidado',

    detailTitle: 'Detalle de deudas',
    detailHint: (count: number) => `${count} deudas registradas`,
    colType: 'Tipo',
    colDescription: 'Descripción',
    colBalance: 'Saldo',
    colRate: 'Tasa',
    colPayment: 'Pago',
    colMonths: 'Meses para pagar',
    typeCard: 'Tarjeta',
    typeAuto: 'Auto',
    typeOther: 'Otro',

    consolidatedScheduleTitle: 'Cronograma del préstamo consolidado',
    colInterest: 'Interés',
    colPrincipal: 'Abono a capital',
  },

  card: {
    cardsTitle: 'Tus tarjetas',
    addCard: 'Agregar tarjeta',
    cardLimitReached: (max: number) => `Máximo ${max} tarjetas.`,
    defaultCardName: (n: number) => `Tarjeta ${n}`,
    cardName: 'Nombre de la tarjeta',
    cardNameHelp: 'Un nombre para identificar esta tarjeta entre las demás.',
    cardNameHelpLong:
      'Puramente descriptivo — no afecta ningún cálculo. Útil cuando manejas varias tarjetas a la vez, por ejemplo «Bancolombia Visa» o «Tarjeta del negocio», para no confundirlas al cambiar entre ellas.',
    franchise: 'Franquicia',
    franchiseHelp: 'La red de la tarjeta (Visa, Mastercard, etc.).',
    franchiseHelpLong:
      'Solo identifica la tarjeta en la lista — igual que el nombre, no cambia el interés, el pago mínimo ni ningún otro resultado de la proyección.',
    franchiseVisa: 'Visa',
    franchiseMastercard: 'Mastercard',
    franchiseAmex: 'American Express',
    franchiseDiscover: 'Discover',
    franchiseDiners: 'Diners Club',

    creditLimit: 'Cupo total',
    creditLimitHint: 'Límite aprobado de la tarjeta.',
    creditLimitHelp: 'El límite de crédito aprobado para esta tarjeta.',
    creditLimitHelpLong:
      'Se usa únicamente para calcular el porcentaje de cupo utilizado y para avisarte si tus compras y saldo proyectado lo superan en algún mes — no afecta el interés ni el pago mínimo, que dependen solo del saldo real.',
    openingBalance: 'Saldo rotativo inicial',
    openingBalanceHint: 'Deuda que ya traes al mes 1.',
    openingBalanceHelp: 'La deuda que ya tienes en la tarjeta antes de empezar la proyección.',
    openingBalanceHelpLong:
      'Es el saldo rotativo con el que arranca el mes 1 — antes de sumar ninguna compra nueva o cuota diferida. Genera interés desde el primer mes igual que cualquier saldo rotativo, según la tasa y la estrategia de pago que elijas.',
    usuryRate: 'Tasa de usura (% E.A.)',
    usuryRateHint: 'Solo se usa para la advertencia.',
    usuryWarning: 'Supera la tasa de usura vigente',
    usuryBadge: 'USURA',
    usuryRateHelp: 'La tasa máxima legal permitida, para comparar contra la tasa de tu tarjeta.',
    usuryRateHelpLong:
      'Este campo es solo informativo: no cambia ningún cálculo del modelo. Si la tasa de la tarjeta (efectiva anual) supera este valor, aparece la advertencia «USURA» junto al campo de tasa, para que la notes de inmediato.',
    monthlyFee: 'Cuota de manejo mensual',
    addVat: '+ IVA 19%',
    monthlyFeeHelp: 'Lo que cobra el banco cada mes por el manejo de la tarjeta.',
    monthlyFeeHelpLong:
      'Es un cargo fijo, independiente del saldo o de cuánto uses la tarjeta. Si activas «+ IVA 19%», el 19% se suma sobre este valor antes de incluirlo en el pago del mes — el total con IVA se muestra por separado en el resumen.',
    cutoffDay: 'Día de corte',
    cutoffDayHint: 'El pago vence 15 días después del corte.',
    cutoffDayHelp: 'El día del mes en que se genera el extracto de la tarjeta.',
    cutoffDayHelpLong:
      'A partir de este día se calcula la fecha límite de pago, siempre 15 días después. También es el día en el que se congelan las compras y cuotas de ese ciclo para calcular el saldo del extracto — solo afecta las fechas mostradas, no los montos.',
    horizon: 'Horizonte',
    horizonHint: (months: number) => `${months} meses proyectados.`,
    horizonHelp: 'Cuántos meses proyectar hacia adelante.',
    horizonHelpLong:
      'Define hasta dónde llega la proyección — el gráfico, la tabla de detalle y «Meses hasta saldo cero» nunca van más allá de este límite. Si la deuda no llega a cero dentro de este horizonte, se reporta como «Nunca», no como un número más allá del horizonte.',

    strategy: 'Estrategia de pago',
    strategyFull: 'Pago total',
    strategyMinimum: 'Pago mínimo',
    strategyFixed: 'Pago fijo',
    strategyPercentage: '% del saldo',
    minimumRate: '% del saldo',
    minimumFloor: 'Mínimo absoluto',
    fixedAmount: 'Monto fijo mensual',
    percentageAmount: '% del saldo a pagar',
    strategyHelp: 'Cómo se calcula el pago cada mes.',
    strategyHelpLong:
      'Pago total paga el saldo completo cada mes, así que nunca hay interés sobre el saldo rotativo. Pago mínimo paga el mayor entre un porcentaje del saldo y un mínimo absoluto, recalculado cada mes — es el que puede caer en la trampa de nunca llegar a cero. Pago fijo y % del saldo pagan un monto constante o un porcentaje fijo cada mes, sin recalcular contra un mínimo.',
    minimumRateHelp: 'El porcentaje del saldo que se paga como mínimo cada mes.',
    minimumRateHelpLong:
      'Se recalcula cada mes sobre el saldo de ese momento, no sobre el saldo original — así que el pago mínimo en pesos baja a medida que el saldo baja. Si este porcentaje no alcanza a cubrir el interés del mes, el saldo nunca llega a cero.',
    minimumFloorHelp: 'El monto mínimo absoluto a pagar, aunque el porcentaje del saldo sea menor.',
    minimumFloorHelpLong:
      'El pago mínimo real es el mayor entre este monto fijo y el porcentaje del saldo — así que este piso protege contra un pago mínimo demasiado pequeño cuando el saldo ya es bajo. Ponlo en 0 para que el pago dependa solo del porcentaje.',
    fixedAmountHelp: 'El monto fijo que pagas cada mes, sin importar cuánto sea el saldo.',
    fixedAmountHelpLong:
      'A diferencia del pago mínimo, este monto no se recalcula contra el saldo — si es menor que el interés del mes, el saldo crece en vez de bajar, y el modelo lo señala si nunca llega a cero.',
    percentageAmountHelp: 'El porcentaje del saldo del extracto que pagas cada mes.',
    percentageAmountHelpLong:
      'Se calcula sobre el saldo del extracto de ese mes, sin un piso mínimo absoluto — a diferencia de la estrategia de pago mínimo, aquí no hay un monto fijo de respaldo si el porcentaje resulta muy bajo.',

    purchases: 'Compras',
    purchasesHint: 'Lo que pasa por la tarjeta cada mes.',
    utilization: 'Cupo utilizado',
    utilizationOf: (used: string, limit: string, percent: string) =>
      `${used} de ${limit} · ${percent}`,
    peakUtilization: (percent: string) => `Pico proyectado: ${percent}`,
    overLimitAt: (month: number) => `— supera el cupo en el mes ${month}`,

    deferredPurchases: 'Compras diferidas',
    addPurchase: 'Agregar compra',
    purchaseLimitReached: (max: number) => `Máximo ${max} compras diferidas.`,
    noPurchases: 'Sin compras diferidas.',
    description: 'Descripción',
    amount: 'Monto',
    purchaseMonth: 'Mes de compra',
    installments: 'Cuotas',
    interestFree: 'Sin intereses',
    newPurchase: 'Nueva compra',

    recurring: 'Gastos recurrentes',
    addRecurring: 'Agregar gasto',
    recurringLimitReached: (max: number) => `Máximo ${max} gastos recurrentes.`,
    noRecurring: 'Sin gastos recurrentes.',
    monthlyAmount: 'Monto mensual',
    startMonth: 'Mes inicio',
    endMonth: 'Mes fin',
    defer: 'Diferir',
    defaultInstallments: 'Cuotas por defecto',
    newRecurring: 'Nuevo gasto',

    purchasesBeyondHorizon: (months: number) =>
      `Hay compras después del mes ${months} que quedan fuera del horizonte.`,
    invertedRange: 'Hay gastos recurrentes cuyo mes final es anterior al inicial: no se cobran.',
    overLimitWarning: (month: number) => `El cupo se supera en el mes ${month}.`,

    nextPayment: 'Pago del próximo corte',
    nextPaymentCaption: (date: string) => `Vence el ${date}`,
    totalPaid: 'Total pagado en el horizonte',
    totalPaidCaption: (months: number) => `${months} meses`,
    totalInterest: 'Total intereses',
    totalInterestCaption: 'Sobre el saldo rotativo',
    totalFees: 'Total cuota de manejo',
    totalFeesWithVat: 'Con IVA 19%',
    totalFeesNoVat: 'Sin IVA',
    monthsToZero: 'Meses hasta saldo cero',
    monthsToZeroCaption: 'Con la estrategia actual',
    neverCaption: 'El pago no cubre los intereses',
    utilizationCard: 'Cupo utilizado',
    utilizationCaption: (month: number, peak: string) => `Al mes ${month} · pico ${peak}`,

    neverBanner:
      'Con esta estrategia el saldo nunca llega a cero: el pago no alcanza a cubrir los intereses más la cuota de manejo, así que la deuda no baja.',
    stripFull: (fees: string) =>
      `Pagando el total cada mes no se te cobran intereses sobre el saldo rotativo: solo la cuota de manejo, ${fees} en el horizonte.`,
    stripTakes: (months: number) => `tardarías ${months} meses`,
    stripNever: (horizon: number) => `no saldarías la deuda en ${horizon} meses`,
    stripCompare: (args: {
      minimumTime: string
      minimumInterest: string
      fixedAmount: string
      fixedTime: string
      fixedInterest: string
      saving: string
    }) =>
      `Pagando el mínimo ${args.minimumTime} y pagarías ${args.minimumInterest} en intereses. ` +
      `Pagando ${args.fixedAmount} fijos ${args.fixedTime} y pagarías ${args.fixedInterest}${args.saving}.`,
    stripSaving: (amount: string) => ` — un ahorro de ${amount}`,

    chartBalance: 'Saldo total por mes',
    chartBalanceHint: 'Saldo rotativo más el capital pendiente de las cuotas diferidas.',
    chartStrategies: 'Comparador de estrategias',
    chartStrategiesHint: 'El mismo consumo, pagado de tres formas distintas.',
    chartPayment: 'Composición del pago mensual',
    chartPaymentHint: 'A dónde va cada peso que pagas.',
    seriesBalance: 'Saldo total',
    limitLabel: (limit: string) => `Cupo ${limit}`,
    neverReachesZero: (name: string) => `${name} (nunca llega a cero)`,
    seriesInstallments: 'Cuotas diferidas',
    seriesRevolvingPrincipal: 'Capital rotativo',
    seriesInterest: 'Interés',
    seriesFee: 'Cuota de manejo',

    colCutoff: 'Fecha de corte',
    colDue: 'Fecha límite de pago',
    colPurchases: 'Compras del mes',
    colInstallments: 'Cuotas diferidas',
    colInterest: 'Interés',
    colFee: 'Cuota de manejo',
    colPayment: 'Pago',
    colRevolving: 'Saldo rotativo',
    colTotalBalance: 'Saldo total',
    colUtilization: 'Cupo usado %',
    scheduleHint: (count: number) => `${count} meses · abre un mes para ver las cuotas diferidas`,
    detailTitle: (month: number) => `Cuotas diferidas del mes ${month}`,
    detailNone: 'Sin cuotas diferidas este mes.',
    detailPrincipal: (amount: string) => `capital ${amount}`,
    detailInterest: (amount: string) => `interés ${amount}`,
    detailRemaining: (amount: string) => `queda ${amount}`,
  },

  auth: {
    signIn: 'Iniciar sesión',
    signOut: 'Cerrar sesión',
    account: (name: string) => `Cuenta de ${name}`,
    accountMenu: 'Menú de cuenta',
    loginTitle: 'Inicia sesión',
    loginSubtitle:
      'Ingresa tu correo y contraseña. El resto de la app sigue funcionando igual sin iniciar sesión.',
    gateTitle: 'Acceso restringido',
    gateSubtitle: 'Inicia sesión con tu correo y contraseña para continuar.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    loginError: 'Correo o contraseña incorrectos',
    backToApp: 'Volver a la app sin iniciar sesión',
    name: 'Nombre',
    emailLabel: 'Correo',
  },

  budget: {
    primaryIncomeTitle: 'Tu ingreso mensual neto',
    spouseIncomeTitle: 'Ingreso neto del cónyuge',
    mortgageDebtTitle: 'Hipoteca y deudas',
    utilitiesTitle: 'Servicios públicos',
    foodTitle: 'Alimentación y gastos generales',
    insuranceTitle: 'Seguros',
    maintenanceTitle: 'Mantenimiento, médico, cuidado infantil, etc.',

    grossAmount: 'Monto bruto',
    grossAmountHelp: 'Antes de cualquier deducción, en la frecuencia elegida abajo.',
    grossAmountHelpLong:
      'Es el ingreso antes de retenciones, impuestos o descuentos — el modelo resta cada deducción por separado para llegar al ingreso neto. Se interpreta siempre en la frecuencia elegida en el campo de al lado, así que si te pagan quincenal, este monto es por quincena, no al mes.',
    frequency: 'Frecuencia de pago',
    frequencyHelp: 'Se aplica a todos los campos de este bloque, excepto «Otro ingreso».',
    frequencyHelpLong:
      'Convierte el monto bruto y cada retención de este bloque a una cifra mensual — por ejemplo, con frecuencia semanal, cada monto se multiplica por 52/12. «Otro ingreso» tiene su propio selector de frecuencia porque una bonificación o ingreso extra no siempre llega con la misma periodicidad que el salario.',
    freqWeekly: 'Semanal (52/año)',
    freqBiweekly: 'Cada dos semanas (26/año)',
    freqSemiMonthly: 'Quincenal (24/año)',
    freqMonthly: 'Mensual (12/año)',
    freqQuarterly: 'Trimestral (4/año)',
    freqAnnual: 'Anual (1/año)',
    federalWithholding: 'Retención de impuesto federal',
    federalWithholdingHelp: 'El impuesto de renta que te retienen a nivel nacional.',
    federalWithholdingHelpLong:
      'Se resta del ingreso bruto en la misma frecuencia que el monto bruto — no tiene su propio selector de frecuencia porque siempre se retiene junto con el pago del salario, nunca por separado.',
    stateWithholding: 'Retención de impuesto estatal/departamental',
    stateWithholdingHelp: 'El impuesto retenido a nivel estatal o departamental, si aplica donde vives.',
    stateWithholdingHelpLong:
      'En países sin este nivel de impuesto sobre la renta personal, simplemente déjalo en cero — el campo existe para quienes sí lo pagan, y no afecta el cálculo si no aplica en tu caso.',
    localWithholding: 'Retención de impuesto local/municipal',
    localWithholdingHelp: 'El impuesto retenido a nivel local o municipal, si aplica donde vives.',
    localWithholdingHelpLong:
      'Igual que la retención estatal, este nivel de impuesto no existe en todos los países — déjalo en cero si no te aplica.',
    otherTaxes: 'Otros impuestos y retenciones',
    otherTaxesHelp: 'Cualquier otra retención sobre tu salario que no encaje en las categorías anteriores.',
    otherTaxesHelpLong:
      'Úsalo para agrupar cualquier descuento fiscal que no sea federal, estatal, local, FICA o salud — por ejemplo, un impuesto solidario o una retención específica de tu país o industria.',
    fica: 'FICA / seguridad social',
    ficaHelp: 'El aporte a seguridad social que se descuenta de tu salario.',
    ficaHelpLong:
      'En el donut de composición del ingreso bruto, este campo se combina con «Salud» en una sola porción «FICA y salud», igual que en la calculadora de referencia — pero aquí se ingresan por separado porque no siempre son el mismo monto.',
    medicare: 'Salud (equivalente a Medicare)',
    medicareHelp: 'El aporte a salud que se descuenta de tu salario.',
    medicareHelpLong:
      'Aunque el nombre viene de Medicare (el seguro de salud público de EE. UU.), este campo representa el equivalente en cualquier sistema — el aporte obligatorio de salud que sale de tu nómina. Se agrupa junto con FICA en el gráfico de composición del ingreso.',
    insuranceBenefits: 'Seguros y beneficios',
    insuranceBenefitsHelp: 'Seguros de salud, vida u otros beneficios que se descuentan por nómina.',
    insuranceBenefitsHelpLong:
      'Cubre cualquier seguro privado o beneficio adicional que tu empleador descuenta de tu pago — seguro de salud complementario, seguro de vida grupal, etc. — distinto de los aportes obligatorios de FICA y salud.',
    retirementSavings: 'Ahorro para el retiro de la empresa',
    retirementSavingsHelp: 'Se resta del ingreso neto, igual que los demás descuentos.',
    retirementSavingsHelpLong:
      'Es tu propio aporte a un plan de retiro patrocinado por la empresa (tipo 401(k) o similar) — se descuenta de tu pago antes de llegar a tu bolsillo, así que reduce el ingreso neto disponible este mes aunque el dinero siga siendo tuyo a largo plazo.',
    otherIncome: 'Otro ingreso',
    otherIncomeHelp: 'Con su propia frecuencia — una bonificación no siempre comparte la del salario.',
    otherIncomeHelpLong:
      'A diferencia del monto bruto y las retenciones, este ingreso no se resta de nada — se suma directamente al ingreso neto, después de convertirlo a mensual con su propia frecuencia. Úsalo para bonos, ingresos freelance, o cualquier entrada de dinero que no venga del salario principal.',
    otherIncomeFrequency: 'Frecuencia del otro ingreso',
    otherIncomeFrequencyHelp: 'Con qué frecuencia recibes este otro ingreso — no tiene que ser la misma del salario.',
    otherIncomeFrequencyHelpLong:
      'Por ejemplo, si el salario es mensual pero recibes un bono trimestral, elige «Trimestral» aquí mientras el campo de arriba sigue en «Mensual» — cada uno se convierte a una cifra mensual de forma independiente.',

    housePayment: 'Pago de vivienda',
    housePaymentHelp: 'La cuota mensual de tu hipoteca o arriendo.',
    housePaymentHelpLong:
      'Incluye tanto hipoteca como arriendo — el campo no distingue entre los dos, así que usa el que te aplique. Ya se asume mensual: no hay selector de frecuencia en esta sección porque todos los gastos aquí se ingresan directamente como cifra del mes.',
    autoPayment: 'Pago de auto',
    autoPaymentHelp: 'La cuota mensual de tu primer préstamo de auto.',
    autoPaymentHelpLong: 'Si tienes un segundo vehículo financiado, regístralo en «Pago de auto 2» en vez de sumarlo aquí.',
    autoPayment2: 'Pago de auto 2',
    autoPayment2Help: 'La cuota mensual de un segundo préstamo de auto, si tienes más de uno.',
    autoPayment2HelpLong: 'Déjalo en cero si solo financias un vehículo — no es obligatorio tener un segundo auto para usar el presupuesto.',
    creditCardPayments: 'Pagos de tarjeta de crédito',
    creditCardPaymentsHelp: 'Lo que pagas cada mes en tarjetas de crédito.',
    creditCardPaymentsHelpLong:
      'Es un solo campo para el total de tus pagos de tarjeta — si quieres ver el detalle de una tarjeta específica (saldo, tasa, si te alcanza el pago mínimo), usa la función Consolidación de deudas, que sí modela cada tarjeta por separado.',
    otherDebtPayments: 'Otros pagos de deuda',
    otherDebtPaymentsHelp: 'Cualquier otro pago de deuda que no sea vivienda, auto o tarjeta de crédito.',
    otherDebtPaymentsHelpLong:
      'Agrupa aquí préstamos personales, préstamos estudiantiles, o cualquier otra deuda mensual fija que no encaje en las categorías anteriores de esta sección.',

    electric: 'Electricidad',
    electricHelp: 'Tu factura mensual de electricidad.',
    gas: 'Gas',
    gasHelp: 'Tu factura mensual de gas.',
    water: 'Acueducto y alcantarillado',
    waterHelp: 'Tu factura mensual de agua y alcantarillado.',
    cable: 'Cable',
    cableHelp: 'Tu factura mensual de televisión por cable o streaming.',
    phone: 'Teléfono',
    phoneHelp: 'Tu factura mensual de teléfono, fijo o celular.',
    internet: 'Internet',
    internetHelp: 'Tu factura mensual de internet.',

    groceries: 'Alimentación',
    groceriesHelp: 'Lo que gastas al mes en mercado y comida.',
    groceriesHelpLong: 'Incluye mercado, restaurantes y domicilios — cualquier gasto regular en alimentación, no solo el supermercado.',
    gasAndMaintenance: 'Gasolina y mantenimiento del auto',
    gasAndMaintenanceHelp: 'Gasolina, cambios de aceite y otro mantenimiento rutinario del auto.',
    gasAndMaintenanceHelpLong:
      'Es distinto de «Pago de auto» (la cuota del crédito) — este campo es el gasto operativo de tener el vehículo, no la deuda por haberlo comprado.',
    generalMerchandise: 'Mercancía general',
    generalMerchandiseHelp: 'Compras generales que no encajan en otra categoría — artículos del hogar, aseo, etc.',
    charitableDonations: 'Donaciones caritativas',
    charitableDonationsHelp: 'Donaciones mensuales a causas o fundaciones benéficas.',
    religiousDonations: 'Donaciones religiosas',
    religiousDonationsHelp: 'Donaciones o diezmos mensuales a tu comunidad religiosa.',

    autoInsurance: 'Seguro de auto',
    autoInsuranceHelp: 'La prima mensual de tu seguro de auto.',
    lifeInsurance: 'Seguro de vida',
    lifeInsuranceHelp: 'La prima mensual de un seguro de vida personal, fuera del que ya se descuenta por nómina.',
    lifeInsuranceHelpLong:
      'Si ya registraste un seguro de vida en «Seguros y beneficios» de tu ingreso (el que se descuenta por nómina), este campo es para una póliza adicional que pagas tú directamente, no para duplicar el mismo gasto.',
    healthInsurance: 'Seguro de salud',
    healthInsuranceHelp: 'La prima mensual de un seguro de salud adicional, fuera del que ya se descuenta por nómina.',
    homeInsurance: 'Seguro de vivienda',
    homeInsuranceHelp: 'La prima mensual del seguro de tu vivienda.',

    homeMaintenance: 'Mantenimiento del hogar',
    homeMaintenanceHelp: 'Reparaciones y mantenimiento rutinario de la vivienda.',
    medical: 'Médico',
    medicalHelp: 'Gastos médicos regulares que no cubre el seguro — consultas, medicamentos, etc.',
    childcare: 'Cuidado infantil',
    childcareHelp: 'Guardería, niñera u otro cuidado infantil regular.',
    clothing: 'Ropa',
    clothingHelp: 'Lo que gastas al mes en ropa y calzado.',
    entertainment: 'Entretenimiento',
    entertainmentHelp: 'Salidas, suscripciones de streaming, hobbies y otro entretenimiento regular.',
    otherCategories: 'Otros',
    addOtherCategory: 'Agregar categoría',
    otherCategoryLimitReached: (max: number) => `Máximo ${max} categorías adicionales.`,
    otherDescription: 'Descripción',
    otherDescriptionHelp: 'Un nombre para este gasto — libre, no afecta ningún cálculo.',
    otherDescriptionHelpLong:
      'A diferencia de los campos fijos de esta categoría, «Otros» no tiene una lista predefinida — agrega tantas filas como necesites, cada una con su propio nombre y monto, para cualquier gasto que no encaje en las categorías ya listadas.',
    otherAmount: 'Monto',
    otherAmountHelp: 'El monto mensual de este gasto adicional.',
    defaultOtherDescription: 'Otro gasto',

    headline1Before: (expenses: string) => `Gastos mensuales de ${expenses} te dejan con`,
    headline1After: 'disponibles para ahorrar.',
    headline2: (net: string, deductions: string) =>
      `El ingreso mensual neto es de ${net} después de ${deductions} en deducciones.`,
    totalNetIncome: 'Ingreso neto total',
    totalExpenses: 'Gastos totales',
    availableToSave: 'Disponible para ahorrar',

    chartExpenseTitle: 'Composición del gasto',
    chartExpenseHint: 'Cada categoría de gasto, más lo que queda disponible para ahorrar.',
    chartIncomeTitle: 'Composición del ingreso bruto',
    chartIncomeHint: 'Cómo se reparte el ingreso bruto combinado de ambos ingresos.',

    sliceMortgageDebt: 'Hipoteca y deudas',
    sliceUtilities: 'Servicios públicos',
    sliceFood: 'Alimentación y gastos generales',
    sliceInsurance: 'Seguros',
    sliceMaintenance: 'Mantenimiento y otros',
    sliceAvailableToSave: 'Disponible para ahorrar',
    sliceFederal: 'Retención de impuesto federal',
    sliceState: 'Retención de impuesto estatal',
    sliceLocal: 'Retención de impuesto local',
    sliceOtherTaxes: 'Otros impuestos y retenciones',
    sliceFicaAndHealth: 'FICA y salud',
    sliceInsuranceBenefits: 'Seguros y beneficios',
    sliceRetirementSavings: 'Ahorro para el retiro',
    sliceNetIncome: 'Ingreso neto',

    detailTitle: 'Detalle de presupuesto',
    detailHint: (count: number) => `${count} conceptos con valor distinto de cero`,
    colSection: 'Sección',
    colConcept: 'Concepto',
    colMonthlyAmount: 'Monto mensual',
  },

  help: {
    title: 'Ayuda',
    skipToContent: 'Saltar al contenido',
    indexLabel: 'Índice de ayuda',
    searchLabel: 'Buscar un campo',
    searchPlaceholder: 'Buscar…',
    noResults: 'No se encontraron campos.',
    selectPrompt: 'Selecciona un campo del índice para ver su explicación.',
    backToApp: 'Volver a la app',
  },
}

/**
 * The dictionary shape. Derived without `as const` on purpose: the type should
 * describe the structure, not pin every value to its Spanish literal.
 */
export type Dictionary = typeof es
