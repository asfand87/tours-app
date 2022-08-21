// const locations = JSON.parse(document.getElementById('map').dataset.locations);
// // console.log(locations);
import mapboxgl from 'mapbox-gl';
// import 'mapbox-gl/dist/mapbox-gl.css';
export const displayMap = (locations) => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiYXNmYW5kMTk4NyIsImEiOiJja3QxdWZ6emgwZTMwMnpzMjQxemVxNzloIn0.oO5L-8UMY2tfP1RlatZswA';
  const map = new mapboxgl.Map({
    container: 'map', // container ID will be used to mount this map object in html
    style: 'mapbox://styles/asfand1987/cl4gzfvxn000j14rllbr5m7n0', // style URL
    scrollZoom: false,
    // center: [-6.668226831939935, 53.39988275601335], // starting position [lng, lat]
    // zoom: 10, // starting zoom,
    // if we set interactive to false it will make the map just like an image.
    // interactive: false,
  });


  // so we have to make bounds variable to have longitude and latitude for our map.

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // create the marker 
    const el = document.createElement("div");
    el.className = "marker";
    // 1 add the marker .
    new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
    }).setLngLat(loc.coordinates).addTo(map);

    // 2 Add a popup on the markup 
    new mapboxgl.Popup({
      offset: 30
    }).
      setLngLat(loc.coordinates).
      setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    // 3 then we have to extend our bounds. 
    // Extend the bounds to include a given LngLatLike or LngLatBoundsLike.
    bounds.extend(loc.coordinates);
  });


  // this method zoom and fits our markers. doesn't let map go beyond our markers
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    }
  });
}

