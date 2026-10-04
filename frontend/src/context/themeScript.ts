export const THEME_STORAGE_KEY = "theme";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

export const themeInitScript = `(function(){try{var p=localStorage.getItem('${THEME_STORAGE_KEY}');var d=p==='dark'||(p==='system'&&window.matchMedia('${DARK_QUERY}').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.classList.toggle('theme-night',d);}catch(e){}})();`;
