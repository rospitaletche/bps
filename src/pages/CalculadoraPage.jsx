
/* ========================================================================== */
/* Archivo: frontend/src/pages/CalculadoraPage.jsx (AJUSTES FORMULARIO)      */
/* ========================================================================== */
import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import SectionCard from '../components/SectionCard.jsx';
import Button from '../components/Button.jsx';
import { evaluarEscenarios } from '../logic/calculosPrestaciones.js';
import { createAccessLogApi } from '../services/apiService.js';

/**
 * Página de la Calculadora de Prestaciones Sociales.
 */
function CalculadoraPage() {
  const [ingresosPadres, setIngresosPadres] = useState('');
  const [leyActual, setLeyActual] = useState('AFAM');
  const [menores, setMenores] = useState([{ id: uuidv4(), edad: '', esMultiple: false, nivelEducativo: 'Primaria' }]);
  const [calculoResultados, setCalculoResultados] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorCalculo, setErrorCalculo] = useState(null);

  const handleMenorChange = (id, field, value) => {
    setMenores(prevMenores =>
      prevMenores.map(menor =>
        menor.id === id ? { ...menor, [field]: value } : menor
      )
    );
  };

  const addMenor = () => {
    setMenores(prevMenores => [
      ...prevMenores,
      { id: uuidv4(), edad: '', esMultiple: false, nivelEducativo: 'Primaria' }, // Default a Primaria
    ]);
  };

  const removeMenor = (id) => {
    setMenores(prevMenores => prevMenores.filter(menor => menor.id !== id));
  };

  const handleSubmitCalculo = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorCalculo(null);
    setCalculoResultados(null);

    const ingresosNum = parseFloat(ingresosPadres);
    if (isNaN(ingresosNum) || ingresosNum < 0) {
      setErrorCalculo("Por favor, ingrese un monto válido para los ingresos.");
      setIsLoading(false);
      return;
    }

    const menoresValidos = menores.map(m => ({
      ...m,
      edad: parseInt(m.edad, 10),
    })).filter(m => !isNaN(m.edad) && m.edad >= 0 && m.edad <= 18);

    if (menoresValidos.length !== menores.length) {
        setErrorCalculo("Por favor, ingrese edades válidas (0-18) para todos los menores.");
        setIsLoading(false);
        return;
    }
    if (menoresValidos.length === 0 && menores.length > 0) {
        setErrorCalculo("Por favor, ingrese edades válidas para los menores.");
        setIsLoading(false);
        return;
    }
     if (menores.length === 0) {
        setErrorCalculo("Por favor, agregue al menos un menor.");
        setIsLoading(false);
        return;
    }

    const datosEntrada = {
      ingresosPadres: ingresosNum,
      leyActual: leyActual,
      menores: menoresValidos.map(m => ({
          edad: m.edad,
          esMultiple: m.esMultiple,
          nivelEducativo: m.nivelEducativo
      })),
    };

    await createAccessLogApi({
        action_description: "Cálculo de Prestaciones Gemelares",
        details: {
            ingresosPadres: datosEntrada.ingresosPadres,
            leyActual: datosEntrada.leyActual,
            cantidadMenores: datosEntrada.menores.length,
            menoresDetalle: datosEntrada.menores.map(m => ({ edad: m.edad, esMultiple: m.esMultiple, nivel: m.nivelEducativo }))
        }
    });

    setTimeout(() => {
      try {
        const resultados = evaluarEscenarios(datosEntrada);
        setCalculoResultados(resultados);
      } catch (error) {
        console.error("Error al calcular escenarios:", error);
        setErrorCalculo("Ocurrió un error al realizar el cálculo. Verifique los datos ingresados.");
      }
      setIsLoading(false);
    }, 500);
  }, [ingresosPadres, leyActual, menores]);

  const resetForm = () => {
    setIngresosPadres('');
    setLeyActual('AFAM');
    setMenores([{ id: uuidv4(), edad: '', esMultiple: false, nivelEducativo: 'Primaria' }]);
    setCalculoResultados(null);
    setErrorCalculo(null);
    setIsLoading(false);
  };

  // Determinar la etiqueta del input de ingresos dinámicamente
  const etiquetaIngresos = leyActual === 'AFAM'
    ? "Ingreso Nominal Mensual Conjunto de los Padres ($)"
    : "Ingreso Nominal de quienes conviven en el núcleo ($)";

  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8 lg:gap-x-12">
        {/* Columna Izquierda: Formulario */}
        <div className="md:col-span-1">
          <SectionCard title="Calculadora de Prestaciones Sociales">
            <form onSubmit={handleSubmitCalculo}>
              {/* Ley Actual (Movido arriba) */}
              <div className="mb-4"> {/* Ajustar margen si es necesario */}
                <label htmlFor="leyActual" className="block text-sm font-medium text-gray-700 mb-1">
                  Prestación Actual
                </label>
                <select
                  id="leyActual"
                  value={leyActual}
                  onChange={(e) => setLeyActual(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                >
                  <option value="AFAM">Asignación Familiar (Ley 15.084)</option>
                  <option value="PE">Plan de Equidad (Ley 18.227)</option>
                </select>
              </div>

              {/* Ingresos (Movido debajo de Ley Actual) */}
              <div className="mb-6">
                <label htmlFor="ingresosPadres" className="block text-sm font-medium text-gray-700 mb-1">
                  {etiquetaIngresos} {/* Etiqueta dinámica */}
                </label>
                <input
                  type="number"
                  id="ingresosPadres"
                  value={ingresosPadres}
                  onChange={(e) => setIngresosPadres(e.target.value)}
                  placeholder="Ej: 50000"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  required
                />
              </div>

              {/* Sección de Menores */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-secondary mb-2">Información de los Menores</h3>
                {menores.map((menor, index) => (
                  <div key={menor.id} className="p-4 border border-gray-200 rounded-md mb-3 bg-gray-50 relative">
                    <p className="font-semibold text-sm text-gray-600 mb-2">Menor {index + 1}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={`edad-${menor.id}`} className="block text-xs font-medium text-gray-600 mb-1">
                          Edad
                        </label>
                        <input
                          type="number"
                          id={`edad-${menor.id}`}
                          value={menor.edad}
                          onChange={(e) => handleMenorChange(menor.id, 'edad', e.target.value)}
                          placeholder="Ej: 7"
                          min="0"
                          max="18"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor={`nivelEducativo-${menor.id}`} className="block text-xs font-medium text-gray-600 mb-1">
                          Nivel Educativo
                        </label>
                        <select
                          id={`nivelEducativo-${menor.id}`}
                          value={menor.nivelEducativo}
                          onChange={(e) => handleMenorChange(menor.id, 'nivelEducativo', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        >
                          {/* CORREGIDO: Opciones de Nivel Educativo */}
                          <option value="Primaria">Primaria</option>
                          <option value="Media">Educación Media</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label htmlFor={`esMultiple-${menor.id}`} className="flex items-center text-sm text-gray-700">
                        <input
                          type="checkbox"
                          id={`esMultiple-${menor.id}`}
                          checked={menor.esMultiple}
                          onChange={(e) => handleMenorChange(menor.id, 'esMultiple', e.target.checked)}
                          className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary mr-2"
                        />
                        ¿Es parte de un nacimiento múltiple (gemelo, trillizo, etc.)?
                      </label>
                    </div>
                    {menores.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMenor(menor.id)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                        title="Eliminar menor"
                      >
                        <i className="fas fa-times-circle"></i>
                      </button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="ghost" onClick={addMenor} className="mt-2 text-sm">
                  <i className="fas fa-plus-circle mr-2"></i>Añadir Menor
                </Button>
              </div>

              <div className="mt-8 flex items-center space-x-3">
                <Button type="submit" variant="primary" disabled={isLoading}>{isLoading ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Calculando...</>) : (<><i className="fas fa-calculator mr-2"></i>Calcular Prestaciones</>)}</Button>
                <Button type="button" variant="ghost" onClick={resetForm} disabled={isLoading}><i className="fas fa-sync-alt mr-2"></i>Limpiar Formulario</Button>
              </div>
              {errorCalculo && <p className="mt-3 text-sm text-red-600">{errorCalculo}</p>}
            </form>
          </SectionCard>
        </div>
        <div className="md:col-span-1">
          {calculoResultados && !isLoading && !errorCalculo && (
            <SectionCard title="Resultados de la Simulación" className="mt-0 md:mt-0">
              <div className="space-y-6">
                <div><h4 className="text-lg font-semibold text-secondary mb-2">Escenario 1: Ley Actual ({calculoResultados.escenarioLeyActual.leyAplicada})</h4><p className="text-2xl font-bold text-primary mb-2">Monto Total: ${calculoResultados.escenarioLeyActual.montoTotal.toFixed(2)}</p><details className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md"><summary className="cursor-pointer font-medium hover:text-primary">Ver Desglose Ley Actual</summary><pre className="mt-2 whitespace-pre-wrap text-xs">{calculoResultados.escenarioLeyActual.desgloseCalculo}</pre></details></div>
                <div><h4 className="text-lg font-semibold text-secondary mb-2">Escenario 2: Con Ley de Nacimientos Múltiples (Ley 20.365)</h4><p className="text-2xl font-bold text-primary mb-2">Monto Total Combinado: ${calculoResultados.escenarioConNuevaLey.montoTotalCombinado.toFixed(2)}</p><details className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md mb-2"><summary className="cursor-pointer font-medium hover:text-primary">Ver Desglose Hijos Múltiples</summary><pre className="mt-2 whitespace-pre-wrap text-xs">{calculoResultados.escenarioConNuevaLey.desgloseCalculo.parteMultiples}</pre></details><details className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md"><summary className="cursor-pointer font-medium hover:text-primary">Ver Desglose Hermanos No Múltiples</summary><pre className="mt-2 whitespace-pre-wrap text-xs">{calculoResultados.escenarioConNuevaLey.desgloseCalculo.parteNoMultiples}</pre></details></div>
                <div className="pt-4 border-t border-gray-200"><h4 className="text-lg font-semibold text-secondary mb-2">Comparación y Recomendación</h4><div className={`p-4 rounded-md text-center ${calculoResultados.comparacion.diferencia > 0 ? 'bg-green-50 border-green-200 border' : calculoResultados.comparacion.diferencia < 0 ? 'bg-orange-50 border-orange-200 border' : 'bg-blue-50 border-blue-200 border'}`}><p className={`text-md font-medium ${calculoResultados.comparacion.diferencia > 0 ? 'text-green-700' : calculoResultados.comparacion.diferencia < 0 ? 'text-orange-700' : 'text-blue-700'}`}>{calculoResultados.comparacion.recomendacion}</p></div></div>
              </div>
            </SectionCard>
          )}
          {!calculoResultados && !isLoading && !errorCalculo && (<div className="md:sticky md:top-24"><SectionCard title="Resultados de la Simulación" className="mt-0 md:mt-0"><p className="text-gray-500 italic">Ingrese los datos en el formulario y presione "Calcular Prestaciones" para ver los resultados aquí.</p></SectionCard></div>)}
        </div>
      </div>
    </main>
  );
}
export default CalculadoraPage;