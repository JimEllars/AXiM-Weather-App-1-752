#!/bin/bash

# We want to add the quick-action button near the bottom of MapPage.jsx
# We'll replace the line `<LocalForecastPanel locationName={selectedLocation} />`
# with the button + LocalForecastPanel.

sed -i 's|<LocalForecastPanel locationName={selectedLocation} />|<LocalForecastPanel locationName={selectedLocation} />\n      <div className="md:hidden absolute bottom-32 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-sm pointer-events-auto">\n        <button\n          onClick={() => { \n             // Navigating to submit form while keeping coordinates if available\n             window.location.href = "/submit?lat=" + mapRef.current.getCenter().lat + "&lng=" + mapRef.current.getCenter().lng; \n          }}\n          className="w-full py-3 px-6 glass-panel bg-axim-accent/20 hover:bg-axim-accent/40 border border-axim-accent/50 text-white font-bold rounded-full shadow-lg backdrop-blur-md transition-all flex items-center justify-center gap-2"\n        >\n          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>\n          Tag Local Weather\n        </button>\n      </div>|' src/pages/MapPage.jsx
