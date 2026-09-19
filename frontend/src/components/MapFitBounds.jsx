import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/*
 * Keeps the dashboard map at the desired default world view.
 * The map opens at zoom 3 (the equivalent of pressing "+" once
 * from the old zoom-2 view). It does not automatically zoom
 * further when supplier data loads.
 */
const MapFitBounds = () => {
  const map = useMap();

  useEffect(() => {
    const setDefaultView = () => {
      map.invalidateSize({ animate: false });
      map.setView([20, 0], 3, { animate: false });
    };

    setDefaultView();

    const container = map.getContainer();

    const observer = new ResizeObserver(() => {
      setDefaultView();
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [map]);

  return null;
};

export default MapFitBounds;
