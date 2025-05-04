/**
 * Pie de página de la aplicación.
 */
function Footer() {
  return (
    <footer className="bg-secondary text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            {/* Título Actualizado */}
            <h3 className="font-semibold text-lg mb-2">Oficios Judiciales</h3>
            <p className="text-sm text-gray-300">Sistema de procesamiento y análisis de documentos</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm">&copy; {new Date().getFullYear()} Todos los derechos reservados</p>
            <p className="text-sm text-gray-300 mt-1">Contacto: bps@bps.gub.uy</p> {/* Email Ejemplo */}
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer; // Asegúrate que Footer también se actualice si cambiaste el título