/* ========================================================================== */
/* Archivo: frontend/src/layouts/Header.jsx (ACTUALIZADO CON ROUTER)         */
/* ========================================================================== */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Importar Link y useLocation

/**
 * Cabecera de la aplicación con logo, fondo oscuro y navegación con Router.
 */
function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation(); // Hook para obtener la ruta actual

  // Mapeo de nombres de item a rutas
  const navLinks = [
    { name: 'Front', path: '/' },
    { name: 'Back', path: '/back' }, // Ruta de ejemplo para la página "Back"
    // Añadir más enlaces aquí si es necesario
  ];

  // Generador de clases para items de navegación
  const getNavItemClasses = (path, isMobile = false) => {
    const isActive = location.pathname === path; // Comprobar si la ruta actual coincide
    const base = `font-medium transition duration-150 ease-in-out ${isMobile ? 'block py-2 px-1' : 'relative py-2'}`;
    const active = isActive ? 'text-white' : 'text-gray-300 hover:text-white';
    const activeDesktopAfter = !isMobile && isActive ? 'after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-primary' : '';
    const activeMobileBorder = isMobile && isActive ? 'border-b-2 border-primary' : '';
    return `${base} ${active} ${activeDesktopAfter} ${activeMobileBorder}`;
  };

  return (
    <header className="bg-secondary shadow-md sticky top-0 z-50 text-gray-200">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          {/* Logo (enlazado a la home) */}
          <Link to="/" className="flex items-center"> {/* Enlazar logo a la home */}
            <img
              src="/bps.png"
              alt="Logo BPS"
              className="h-10 md:h-12 w-auto"
              onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/191x100/193b69/FFFFFF?text=BPS'; e.target.alt='Logo BPS Placeholder' }}
            />
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map(link => (
              // Usar Link en lugar de <a>
              <Link key={link.name} to={link.path} className={getNavItemClasses(link.path)}>
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Botón Menú Móvil */}
          <div className="md:hidden">
            <button
              id="menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
            </button>
          </div>
        </div>

        {/* Menú Móvil */}
        <div id="mobile-menu" className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} mt-3 pb-2 border-t border-gray-700`}>
          {navLinks.map(link => (
             // Usar Link en lugar de <a>
             <Link
               key={link.name}
               to={link.path}
               className={getNavItemClasses(link.path, true)}
               onClick={() => setIsMobileMenuOpen(false)} // Cerrar menú al hacer clic
             >
               {link.name}
             </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
export default Header;