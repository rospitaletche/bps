
/* ========================================================================== */
/* Archivo: frontend/src/layouts/Header.jsx (NUEVO MENÚ DESPLEGABLE)         */
/* ========================================================================== */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // Almacena el índice del dropdown abierto
  const [dropdownHoverTimeoutId, setDropdownHoverTimeoutId] = useState(null); // Para el retraso al quitar el hover
  const location = useLocation();
  const dropdownRefs = useRef([]);

  const navStructure = [
    /*
    {
      name: 'Oficios',
      isCategory: true,
      subLinks: [
        { name: 'Front', path: '/' },
        { name: 'Back', path: '/back' },
      ],
    },
    */
    {
      name: 'Gemelares',
      isCategory: true,
      subLinks: [
        { name: 'Manual', path: '/calculadora-prestaciones' },
        { name: 'Automático', path: '/gemelares/automatico' },
      ],
    },
  ];

  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const logoSrc = `${base}bps.png`;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRefs.current.every(ref => ref && !ref.contains(event.target))) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCategoryMouseEnter = (index) => {
    if (dropdownHoverTimeoutId) {
      clearTimeout(dropdownHoverTimeoutId);
      setDropdownHoverTimeoutId(null);
    }
    setOpenDropdown(index);
  };

  const handleCategoryMouseLeave = () => {
    const timeoutId = setTimeout(() => {
      setOpenDropdown(null);
    }, 200); // 200ms de retraso antes de cerrar
    setDropdownHoverTimeoutId(timeoutId);
  };

  const handleDropdownPanelMouseEnter = () => {
    if (dropdownHoverTimeoutId) {
      clearTimeout(dropdownHoverTimeoutId);
      setDropdownHoverTimeoutId(null);
    }
  };


  const getNavItemClasses = (path, isSubItem = false) => {
    const isActive = location.pathname === path;
    let classes = `font-medium transition duration-150 ease-in-out whitespace-nowrap `;
    if (isSubItem) {
      classes += `block px-4 py-2 text-sm ${isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-secondary'}`;
    } else {
      classes += `relative py-2 ${isActive && !isSubItem ? 'text-white' : 'text-gray-300 hover:text-white'}`;
    }
    return classes;
  };

  const getCategoryClasses = (index) => {
    const category = navStructure[index];
    const isActiveCategory = category.subLinks?.some(subLink => location.pathname === subLink.path);
    let classes = `font-medium transition duration-150 ease-in-out relative py-2 cursor-pointer flex items-center `;
    classes += isActiveCategory ? 'text-white' : 'text-gray-300 hover:text-white';
    return classes;
  };

  return (
    <header className="bg-secondary shadow-md sticky top-0 z-50 text-gray-200">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img src={logoSrc} alt="Logo BPS" className="h-10 md:h-12 w-auto" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/191x100/193b69/FFFFFF?text=BPS'; e.target.alt='Logo BPS Placeholder' }}/>
          </Link>
          <nav className="hidden md:flex space-x-4 lg:space-x-7">
            {navStructure.map((item, index) => (
              <div
                key={item.name}
                className="relative" // No necesitamos 'group' para JS hover
                ref={el => dropdownRefs.current[index] = el}
                onMouseEnter={() => item.isCategory && handleCategoryMouseEnter(index)}
                onMouseLeave={() => item.isCategory && handleCategoryMouseLeave()}
              >
                {item.isCategory ? (
                  <button
                    className={`${getCategoryClasses(index)} focus:outline-none`}
                    onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
                  >
                    {item.name}
                    <i className={`fas fa-chevron-down text-xs ml-2 transform transition-transform duration-200 ${openDropdown === index ? 'rotate-180' : ''}`}></i>
                  </button>
                ) : (
                  <Link to={item.path} className={getNavItemClasses(item.path)}>
                    {item.name}
                  </Link>
                )}
                {item.isCategory && openDropdown === index && (
                  <div
                    className="absolute left-0 top-full mt-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-20" // Usar top-full y quitar mt-1
                    onMouseEnter={handleDropdownPanelMouseEnter} // Mantener abierto si el mouse entra al panel
                    onMouseLeave={handleCategoryMouseLeave} // Cerrar si el mouse sale del panel
                  >
                    {item.subLinks.map(subLink => (
                      <Link
                        key={subLink.name}
                        to={subLink.path}
                        className={getNavItemClasses(subLink.path, true)}
                        onClick={() => { setOpenDropdown(null); setIsMobileMenuOpen(false); }}
                      >
                        {subLink.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="md:hidden">
            <button id="menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 hover:text-white focus:outline-none" aria-label="Toggle menu" aria-expanded={isMobileMenuOpen}>
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
            </button>
          </div>
        </div>
        <div id="mobile-menu" className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} mt-3 pb-2 border-t border-gray-700`}>
          {navStructure.map((item) => (
            <div key={item.name} className="py-1">
              {item.isCategory ? (
                <>
                  <span className="block px-1 py-2 text-sm text-gray-400 font-semibold">{item.name}</span>
                  {item.subLinks.map(subLink => (
                    <Link key={subLink.name} to={subLink.path} className={`${getNavItemClasses(subLink.path, true)} pl-4`} onClick={() => { setIsMobileMenuOpen(false); setOpenDropdown(null); }}>
                      {subLink.name}
                    </Link>
                  ))}
                </>
              ) : (
                <Link to={item.path} className={getNavItemClasses(item.path, true)} onClick={() => { setIsMobileMenuOpen(false); setOpenDropdown(null); }}>
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
export default Header;
