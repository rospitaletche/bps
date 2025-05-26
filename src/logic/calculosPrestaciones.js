/* ========================================================================== */
/* Archivo: frontend/src/logic/calculosPrestaciones.js (LÓGICA MÚLTIPLES CORREGIDA) */
/* ========================================================================== */
import * as C from '../utils/calculadoraConstants.js';

export function calcularAsignacionFamiliar(ingresosPadres, listaMenores) {
  const numTotalMenores = listaMenores.length;
  if (numTotalMenores === 0) { return { monto: 0, desglose: "No hay menores." }; }
  let tope1 = C.AF_LEY15084_TOPE1_INGRESO_BASE;
  let tope2 = C.AF_LEY15084_TOPE2_INGRESO_BASE;
  let desgloseTopes = `Topes base: Tope 1 <= $${tope1.toFixed(2)}, Tope 2 <= $${tope2.toFixed(2)}.`;
  if (numTotalMenores > 2) {
    tope1 += C.INCREMENTO_TOPES_AF_MAS_DE_2_MENORES;
    tope2 += C.INCREMENTO_TOPES_AF_MAS_DE_2_MENORES;
    desgloseTopes = `Topes ajustados por ${numTotalMenores} menores: Tope 1 <= $${tope1.toFixed(2)}, Tope 2 <= $${tope2.toFixed(2)}.`;
  }
  let montoPorNino = 0;
  let tramoAplicado = "Ninguno (supera tope máximo)";
  if (ingresosPadres <= tope1) { montoPorNino = C.AF_LEY15084_MONTO_TRAMO1_NINO; tramoAplicado = `Tope 1 ($${C.AF_LEY15084_MONTO_TRAMO1_NINO}/niño)`; }
  else if (ingresosPadres <= tope2) { montoPorNino = C.AF_LEY15084_MONTO_TRAMO2_NINO; tramoAplicado = `Tope 2 ($${C.AF_LEY15084_MONTO_TRAMO2_NINO}/niño)`; }
  const montoTotal = montoPorNino * numTotalMenores;
  const desglose = `Cálculo Asignación Familiar (Ley 15.084):\nIngresos: $${ingresosPadres.toFixed(2)}. ${desgloseTopes}\nTope aplicado: ${tramoAplicado}.\nMonto por niño: $${montoPorNino.toFixed(2)}.\nTotal por ${numTotalMenores} menores: $${montoTotal.toFixed(2)}.`;
  return { monto: montoTotal, desglose };
}

export function calcularPlanEquidad(listaMenores) {
  const numMenoresPrimaria = listaMenores.filter(m => m.nivelEducativo === "Primaria").length;
  const numMenoresEdMedia = listaMenores.filter(m => m.nivelEducativo === "Media").length;
  if (numMenoresPrimaria === 0 && numMenoresEdMedia === 0) { return { monto: 0, desglose: "Plan de Equidad: No hay menores en Primaria o Media." }; }
  const montoConsultado = C.tablaPlanEquidad[String(numMenoresPrimaria)]?.[String(numMenoresEdMedia)] ?? 0;
  const desglose = `Cálculo Plan de Equidad (Ley 18.227):\nMenores en Primaria: ${numMenoresPrimaria}.\nMenores en Ed. Media: ${numMenoresEdMedia}.\nMonto: $${montoConsultado.toFixed(2)}.`;
  return { monto: montoConsultado, desglose };
}

export function calcularLeyNacimientosMultiples(ingresosPadres, menoresMultiplesValidos) {
  // Esta función ahora recibe 'menoresMultiplesValidos', que ya son grupos de 2+ con la misma edad.
  if (!menoresMultiplesValidos || menoresMultiplesValidos.length === 0) {
    return { monto: 0, desglose: "No hay grupos de nacimientos múltiples válidos (mínimo 2 de la misma edad)." };
  }

  let montoTotalMultiples = 0;
  const desgloseDetalladoMultiples = [];

  menoresMultiplesValidos.forEach(menor => { // Cada menor en esta lista ya es parte de un grupo válido
    let montoBaseNinoMultiple = 0;
    let tramoAplicado = "Ninguno (supera tope máximo)";

    if (ingresosPadres <= C.MULTIPLES_LEY20365_TOPE1_INGRESO) {
      montoBaseNinoMultiple = C.MULTIPLES_LEY20365_MONTO_BASE_TRAMO1_NINO;
      tramoAplicado = `Tope 1 ($${C.MULTIPLES_LEY20365_MONTO_BASE_TRAMO1_NINO} base)`;
    } else if (ingresosPadres <= C.MULTIPLES_LEY20365_TOPE2_INGRESO) {
      montoBaseNinoMultiple = C.MULTIPLES_LEY20365_MONTO_BASE_TRAMO2_NINO;
      tramoAplicado = `Tope 2 ($${C.MULTIPLES_LEY20365_MONTO_BASE_TRAMO2_NINO} base)`;
    }

    let factorEdad = 0;
    if (menor.edad <= 5) { factorEdad = C.MULTIPLES_FACTOR_EDAD_0_5; }
    else if (menor.edad >= 6 && menor.edad <= 12) { factorEdad = C.MULTIPLES_FACTOR_EDAD_6_12; }
    else if (menor.edad >= 13) { factorEdad = C.MULTIPLES_FACTOR_EDAD_13_MAS; }

    const montoNinoMultiple = montoBaseNinoMultiple * factorEdad;
    montoTotalMultiples += montoNinoMultiple;
    desgloseDetalladoMultiples.push(`Menor múltiple (edad ${menor.edad}, ${tramoAplicado}): Base $${montoBaseNinoMultiple.toFixed(2)} * ${factorEdad} = $${montoNinoMultiple.toFixed(2)}`);
  });

  const desglose = `Cálculo Ley Nacimientos Múltiples (Ley 20.365):\nIngresos: $${ingresosPadres.toFixed(2)}.\n${desgloseDetalladoMultiples.join('\n')}\nTotal Múltiples: $${montoTotalMultiples.toFixed(2)}.`;
  return { monto: montoTotalMultiples, desglose };
}

export function evaluarEscenarios(datosEntrada) {
  const { ingresosPadres, leyActual, menores } = datosEntrada;

  // Escenario 1: Ley Actual
  let resultadoLeyActual = { monto: 0, desglose: "No aplica o no hay menores." };
  if (menores.length > 0) {
    if (leyActual === "AFAM") { resultadoLeyActual = calcularAsignacionFamiliar(ingresosPadres, menores); }
    else if (leyActual === "PE") { resultadoLeyActual = calcularPlanEquidad(menores); }
  }
  const montoLeyActual = resultadoLeyActual.monto;

  // Escenario 2: Ley de Múltiples + Hermanos
  // 1. Identificar todos los menores marcados como 'esMultiple'
  const candidatosMultiples = menores.filter(m => m.esMultiple);

  // 2. Agruparlos por edad
  const gruposMultiplesPorEdad = candidatosMultiples.reduce((acc, menor) => {
    acc[menor.edad] = acc[menor.edad] || [];
    acc[menor.edad].push(menor);
    return acc;
  }, {});

  // 3. Filtrar solo los grupos con 2 o más menores (verdaderos múltiples)
  let menoresMultiplesReales = [];
  let menoresMultiplesNoValidos = []; // Aquellos marcados como múltiples pero que no forman grupo

  Object.values(gruposMultiplesPorEdad).forEach(grupo => {
    if (grupo.length >= 2) {
      menoresMultiplesReales = menoresMultiplesReales.concat(grupo);
    } else {
      menoresMultiplesNoValidos = menoresMultiplesNoValidos.concat(grupo);
    }
  });

  // 4. Los 'menoresNoMultiples' son los originalmente no múltiples + los múltiples no válidos
  const menoresNoMultiplesOriginales = menores.filter(m => !m.esMultiple);
  const todosLosMenoresNoMultiples = [...menoresNoMultiplesOriginales, ...menoresMultiplesNoValidos];


  const calcMultiples = calcularLeyNacimientosMultiples(ingresosPadres, menoresMultiplesReales);
  let montoTotalConNuevaLey = calcMultiples.monto;
  let desgloseParteNoMultiples = "No hay hermanos no múltiples o no aplica ley original.";

  if (todosLosMenoresNoMultiples.length > 0) {
    let calcHermanos;
    if (leyActual === "AFAM") {
      calcHermanos = calcularAsignacionFamiliar(ingresosPadres, todosLosMenoresNoMultiples);
      desgloseParteNoMultiples = `Hermanos No Múltiples (Asignación Familiar):\n${calcHermanos.desglose}`;
    } else if (leyActual === "PE") {
      calcHermanos = calcularPlanEquidad(todosLosMenoresNoMultiples);
      desgloseParteNoMultiples = `Hermanos No Múltiples (Plan de Equidad):\n${calcHermanos.desglose}`;
    }
    if (calcHermanos) {
        montoTotalConNuevaLey += calcHermanos.monto;
    }
  }

  const diferencia = montoTotalConNuevaLey - montoLeyActual;
  let recomendacion = "";
  if (diferencia > 0) { recomendacion = `Conviene optar por el cálculo que incluye la Ley 20.365 para los nacimientos múltiples. Diferencia a favor: $${diferencia.toFixed(2)}.`; }
  else if (diferencia < 0) { recomendacion = `Conviene mantenerse con la Ley actual (${leyActual}). Diferencia a favor: $${Math.abs(diferencia).toFixed(2)}.`; }
  else { recomendacion = "Ambos escenarios resultan en el mismo monto."; }

  return {
    escenarioLeyActual: { leyAplicada: menores.length > 0 ? leyActual : "N/A", montoTotal: montoLeyActual, desgloseCalculo: resultadoLeyActual.desglose, },
    escenarioConNuevaLey: { montoTotalCombinado: montoTotalConNuevaLey, desgloseCalculo: { parteMultiples: calcMultiples.desglose, parteNoMultiples: desgloseParteNoMultiples, }, },
    comparacion: { montoLeyActual: montoLeyActual, montoConNuevaLey: montoTotalConNuevaLey, diferencia: diferencia, recomendacion: recomendacion, },
    inputsOriginales: { ...datosEntrada },
  };
}
