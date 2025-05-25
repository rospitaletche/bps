/* ========================================================================== */
/* Archivo: frontend/src/logic/calculosPrestaciones.js (NUEVO)               */
/* ========================================================================== */
import * as C from '../utils/calculadoraConstants.js'; // Importar todas las constantes

// 4.1. Función: calcularAsignacionFamiliar
export function calcularAsignacionFamiliar(ingresosPadres, listaMenores) {
  const numTotalMenores = listaMenores.length;
  if (numTotalMenores === 0) {
    return { monto: 0, desglose: "No hay menores." };
  }

  let tope1 = C.AF_LEY15084_TOPE1_INGRESO_BASE;
  let tope2 = C.AF_LEY15084_TOPE2_INGRESO_BASE;
  let desgloseTopes = `Topes base: Tramo 1 <= $${tope1.toFixed(2)}, Tramo 2 <= $${tope2.toFixed(2)}.`;

  if (numTotalMenores > 2) {
    tope1 += C.INCREMENTO_TOPES_AF_MAS_DE_2_MENORES;
    tope2 += C.INCREMENTO_TOPES_AF_MAS_DE_2_MENORES;
    desgloseTopes = `Topes ajustados por ${numTotalMenores} menores: Tope 1 <= $${tope1.toFixed(2)}, Tope 2 <= $${tope2.toFixed(2)}.`;
  }

  let montoPorNino = 0;
  let tramoAplicado = "Ninguno (supera tope máximo)";

  if (ingresosPadres <= tope1) {
    montoPorNino = C.AF_LEY15084_MONTO_TRAMO1_NINO;
    tramoAplicado = `Tope 1 ($${C.AF_LEY15084_MONTO_TRAMO1_NINO}/niño)`;
  } else if (ingresosPadres <= tope2) {
    montoPorNino = C.AF_LEY15084_MONTO_TRAMO2_NINO;
    tramoAplicado = `Tope 2 ($${C.AF_LEY15084_MONTO_TRAMO2_NINO}/niño)`;
  }

  const montoTotal = montoPorNino * numTotalMenores;
  const desglose = `Cálculo Asignación Familiar (Ley 15.084):\nIngresos: $${ingresosPadres.toFixed(2)}. ${desgloseTopes}\nTope aplicado: ${tramoAplicado}.\nMonto por niño: $${montoPorNino.toFixed(2)}.\nTotal por ${numTotalMenores} menores: $${montoTotal.toFixed(2)}.`;

  return { monto: montoTotal, desglose };
}

// 4.2. Función: calcularPlanEquidad
export function calcularPlanEquidad(listaMenores) {
  const numMenoresPrimaria = listaMenores.filter(m => m.nivelEducativo === "Primaria").length;
  const numMenoresEdMedia = listaMenores.filter(m => m.nivelEducativo === "Media").length;

  if (numMenoresPrimaria === 0 && numMenoresEdMedia === 0) {
    return { monto: 0, desglose: "Plan de Equidad: No hay menores en Primaria o Media." };
  }

  const montoConsultado = C.tablaPlanEquidad[String(numMenoresPrimaria)]?.[String(numMenoresEdMedia)] ?? 0;
  const desglose = `Cálculo Plan de Equidad (Ley 18.227):\nMenores en Primaria: ${numMenoresPrimaria}.\nMenores en Ed. Media: ${numMenoresEdMedia}.\nMonto: $${montoConsultado.toFixed(2)}.`;

  return { monto: montoConsultado, desglose };
}

// 4.3. Función: calcularLeyNacimientosMultiples
export function calcularLeyNacimientosMultiples(ingresosPadres, menoresMultiples) {
  if (!menoresMultiples || menoresMultiples.length === 0) {
    return { monto: 0, desglose: "No hay menores de nacimientos múltiples." };
  }

  let montoTotalMultiples = 0;
  const desgloseDetalladoMultiples = [];

  menoresMultiples.forEach(menor => {
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
    if (menor.edad <= 5) {
      factorEdad = C.MULTIPLES_FACTOR_EDAD_0_5;
    } else if (menor.edad >= 6 && menor.edad <= 12) {
      factorEdad = C.MULTIPLES_FACTOR_EDAD_6_12;
    } else if (menor.edad >= 13) { // Asumiendo que 13 o más es el último tramo
      factorEdad = C.MULTIPLES_FACTOR_EDAD_13_MAS;
    }

    const montoNinoMultiple = montoBaseNinoMultiple * factorEdad;
    montoTotalMultiples += montoNinoMultiple;
    desgloseDetalladoMultiples.push(`Menor (edad ${menor.edad}, ${tramoAplicado}): Base $${montoBaseNinoMultiple.toFixed(2)} * ${factorEdad} = $${montoNinoMultiple.toFixed(2)}`);
  });

  const desglose = `Cálculo Ley Nacimientos Múltiples (Ley 20.365):\nIngresos: $${ingresosPadres.toFixed(2)}.\n${desgloseDetalladoMultiples.join('\n')}\nTotal Múltiples: $${montoTotalMultiples.toFixed(2)}.`;
  return { monto: montoTotalMultiples, desglose };
}

// 4.4. Función Principal de Cálculo y Comparación
export function evaluarEscenarios(datosEntrada) {
  const { ingresosPadres, leyActual, menores } = datosEntrada;

  // Escenario 1: Ley Actual
  let resultadoLeyActual = { monto: 0, desglose: "No aplica o no hay menores." };
  if (menores.length > 0) {
    if (leyActual === "AFAM") {
      resultadoLeyActual = calcularAsignacionFamiliar(ingresosPadres, menores);
    } else if (leyActual === "PE") {
      resultadoLeyActual = calcularPlanEquidad(menores);
    }
  }
  const montoLeyActual = resultadoLeyActual.monto;

  // Escenario 2: Ley de Múltiples + Hermanos
  const menoresMultiples = menores.filter(m => m.esMultiple);
  const menoresNoMultiples = menores.filter(m => !m.esMultiple);

  const calcMultiples = calcularLeyNacimientosMultiples(ingresosPadres, menoresMultiples);
  let montoTotalConNuevaLey = calcMultiples.monto;
  let desgloseParteNoMultiples = "No hay hermanos no múltiples o no aplica ley original.";
  let montoHermanosNoMultiples = 0;

  if (menoresNoMultiples.length > 0) {
    let calcHermanos;
    if (leyActual === "AFAM") {
      calcHermanos = calcularAsignacionFamiliar(ingresosPadres, menoresNoMultiples);
      desgloseParteNoMultiples = `Hermanos No Múltiples (Asignación Familiar):\n${calcHermanos.desglose}`;
    } else if (leyActual === "PE") {
      calcHermanos = calcularPlanEquidad(menoresNoMultiples);
      desgloseParteNoMultiples = `Hermanos No Múltiples (Plan de Equidad):\n${calcHermanos.desglose}`;
    }
    if (calcHermanos) {
        montoHermanosNoMultiples = calcHermanos.monto;
        montoTotalConNuevaLey += montoHermanosNoMultiples;
    }
  }

  const diferencia = montoTotalConNuevaLey - montoLeyActual;
  let recomendacion = "";
  if (diferencia > 0) {
    recomendacion = `Conviene optar por el cálculo que incluye la Ley 20.365 para los nacimientos múltiples. Diferencia a favor: $${diferencia.toFixed(2)}.`;
  } else if (diferencia < 0) {
    recomendacion = `Conviene mantenerse con la Ley actual (${leyActual}). Diferencia a favor: $${Math.abs(diferencia).toFixed(2)}.`;
  } else {
    recomendacion = "Ambos escenarios resultan en el mismo monto.";
  }

  return {
    escenarioLeyActual: {
      leyAplicada: menores.length > 0 ? leyActual : "N/A",
      montoTotal: montoLeyActual,
      desgloseCalculo: resultadoLeyActual.desglose,
    },
    escenarioConNuevaLey: {
      montoTotalCombinado: montoTotalConNuevaLey,
      desgloseCalculo: {
        parteMultiples: calcMultiples.desglose,
        parteNoMultiples: desgloseParteNoMultiples,
      },
    },
    comparacion: {
      montoLeyActual: montoLeyActual,
      montoConNuevaLey: montoTotalConNuevaLey,
      diferencia: diferencia,
      recomendacion: recomendacion,
    },
    inputsOriginales: { ...datosEntrada }, // Copia de los datos de entrada
  };
}
